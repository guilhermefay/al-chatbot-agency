const { logger } = require('../config/logger');
const { supabase } = require('../config/supabase');
const { evolutionService } = require('./evolution.service');
const { difyService } = require('./dify.service');
const { audioService } = require('./audio.service');
const { messageChunkerService } = require('./messageChunker.service');

const messageService = {
  async handleIncomingMessage(instanceId, messageData) {
    try {
      logger.info(`📨 Received webhook for instance ${instanceId}:`, JSON.stringify(messageData, null, 2));
      
      const { key, message, pushName } = messageData;
      
      // Validate required data
      if (!key || !message) {
        logger.warn('Invalid message data - missing key or message');
        return;
      }
      
      // Ignore non-user messages
      if (key.fromMe || !message) {
        logger.info('Ignoring message from self or empty message');
        return;
      }

      // Get company by Evolution instance
      const { data: whatsappSession, error: sessionError } = await supabase
        .from('whatsapp_sessions')
        .select(`
          company_id, 
          companies(
            id, name, dify_api_key, dify_enabled, features, voice_config
          )
        `)
        .eq('evolution_instance', instanceId)
        .single();

      if (sessionError || !whatsappSession) {
        logger.error(`❌ No company found for instance ${instanceId}:`, sessionError);
        return;
      }

      const companyData = whatsappSession.companies;
      const contact = key.remoteJid.split('@')[0];
      
      logger.info(`🏢 Processing message for company: ${companyData.name} (${companyData.id})`);
      logger.info(`👤 Contact: ${contact} (${pushName || 'No name'})`);
      
      // Check if Dify is enabled for this company
      if (!companyData.dify_enabled) {
        logger.info(`🚫 Dify disabled for company ${companyData.name} - skipping AI response`);
        
        // Still save the conversation and message for manual handling
        const conversation = await this.getOrCreateConversation(
          companyData.id,
          contact,
          pushName
        );
        
        const processedMessage = message.conversation || message.extendedTextMessage?.text || '[Mensagem não suportada]';
        await this.saveMessage(conversation.id, 'user', processedMessage, {
          raw_message: message,
          whatsapp_message_id: key.id
        });
        
        return;
      }

      // Create or get conversation
      const conversation = await this.getOrCreateConversation(
        companyData.id,
        contact,
        pushName
      );

      // Handle different message types
      let processedMessage = message.conversation || message.extendedTextMessage?.text;
      
      // Handle audio messages
      if (message.audioMessage) {
        logger.info('Processing audio message');
        const audioUrl = await evolutionService.getMediaUrl(instanceId, message.audioMessage.url);
        const audioBuffer = await audioService.downloadAudio(audioUrl);
        processedMessage = await audioService.transcribeAudio(
          audioBuffer, 
          companyData.dify_api_key, 
          contact
        );
        logger.info(`Audio transcribed: ${processedMessage}`);
      }

      // Save incoming message
      await this.saveMessage(conversation.id, 'user', processedMessage, {
        raw_message: message,
        whatsapp_message_id: key.id
      });

      // Process with Dify
      const difyResponse = await difyService.processMessage(
        companyData.dify_api_key,
        processedMessage,
        contact,
        conversation.dify_conversation_id
      );

      // Update conversation with Dify conversation ID
      if (difyResponse.conversation_id && !conversation.dify_conversation_id) {
        await supabase
          .from('conversations')
          .update({ dify_conversation_id: difyResponse.conversation_id })
          .eq('id', conversation.id);
      }

      // Save bot response
      await this.saveMessage(conversation.id, 'assistant', difyResponse.answer, {
        dify_message_id: difyResponse.message_id,
        usage: difyResponse.usage
      });

      // Process response for sending
      const shouldRespondWithAudio = companyData.features?.voice_enabled && 
                                     (message.audioMessage || companyData.voice_config?.always_voice);
      
      if (shouldRespondWithAudio) {
        try {
          // Generate audio response using Dify TTS
          const audioBuffer = await audioService.textToSpeech(
            difyResponse.answer,
            companyData.dify_api_key,
            difyResponse.message_id,
            contact
          );
          
          // Convert buffer to base64 for WhatsApp
          const audioBase64 = audioBuffer.toString('base64');
          
          // Send audio (single message, no chunking for audio)
          await evolutionService.sendMessage(instanceId, {
            number: key.remoteJid,
            audio: audioBase64,
            mimetype: 'audio/ogg; codecs=opus'
          });
          
          logger.info('Sent audio response via TTS');
        } catch (audioError) {
          logger.warn('TTS failed, falling back to chunked text:', audioError);
          // Fallback to chunked text if TTS fails
          await this.sendChunkedTextResponse(instanceId, key.remoteJid, difyResponse.answer, companyData);
        }
      } else {
        // Send chunked text response
        await this.sendChunkedTextResponse(instanceId, key.remoteJid, difyResponse.answer, companyData);
      }

    } catch (error) {
      logger.error('Error handling incoming message:', error);
    }
  },

  async getOrCreateConversation(companyId, contact, contactName) {
    try {
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .eq('company_id', companyId)
        .eq('contact', contact)
        .single();

      if (existing && !findError) {
        logger.info(`💬 Found existing conversation: ${existing.id}`);
        return existing;
      }

      logger.info(`🆕 Creating new conversation for contact: ${contact}`);
      
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          company_id: companyId,
          contact,
          contact_name: contactName,
          contact_phone: contact, // For WhatsApp, contact is the phone number
          platform: 'whatsapp',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        logger.error('Error creating conversation:', createError);
        throw createError;
      }

      logger.info(`✅ Created conversation: ${newConversation.id}`);
      return newConversation;
    } catch (error) {
      logger.error('Error in getOrCreateConversation:', error);
      throw error;
    }
  },

  async saveMessage(conversationId, role, content, metadata = null) {
    try {
      logger.info(`💾 Saving ${role} message for conversation ${conversationId}: ${content.substring(0, 100)}...`);
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          metadata,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Error saving message:', error);
        throw error;
      }

      logger.info(`✅ Message saved with ID: ${data.id}`);
      return data;
    } catch (error) {
      logger.error('Error in saveMessage:', error);
      throw error;
    }
  },

  /**
   * Envia resposta de texto com chunking automático
   */
  async sendChunkedTextResponse(instanceId, remoteJid, message, companyData) {
    try {
      // Analisa se a mensagem deve ser quebrada
      const analysis = messageChunkerService.analyzeMessage(message, {
        message_chunk_size: companyData.features?.message_chunk_size || 280,
        enable_message_chunking: companyData.features?.enable_message_chunking !== false
      });

      if (!analysis.shouldChunk) {
        // Mensagem única
        await evolutionService.sendMessage(instanceId, {
          number: remoteJid,
          text: message
        });
        
        logger.info(`Sent single message: ${message.substring(0, 50)}...`);
      } else {
        // Mensagens múltiplas com delay
        logger.info(`Breaking message into ${analysis.chunks.length} chunks`);
        
        const sendFunction = async (data) => {
          return evolutionService.sendMessage(instanceId, data);
        };

        await messageChunkerService.sendChunkedMessages(
          analysis.chunks,
          sendFunction,
          { number: remoteJid },
          {
            enableTypingIndicator: companyData.features?.typing_indicator !== false,
            customDelay: companyData.features?.chunk_delay || null,
            strategy: companyData.features?.chunking_strategy || 'natural',
            metadata: analysis.metadata,
            showProgress: analysis.chunkCount > 3
          }
        );
        
        logger.info(`Sent ${analysis.chunks.length} chunked messages successfully`);
      }
    } catch (error) {
      logger.error('Error sending chunked text response:', error);
      
      // Fallback: enviar mensagem original sem chunking
      try {
        await evolutionService.sendMessage(instanceId, {
          number: remoteJid,
          text: message
        });
        logger.info('Fallback: sent original message without chunking');
      } catch (fallbackError) {
        logger.error('Fallback also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }
};

module.exports = { messageService };