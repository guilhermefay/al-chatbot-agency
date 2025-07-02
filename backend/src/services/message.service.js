const { logger } = require('../config/logger');
const { supabase } = require('../config/supabase');
const { evolutionService } = require('./evolution.service');
const { difyService } = require('./dify.service');
const { audioService } = require('./audio.service');

const messageService = {
  async handleIncomingMessage(instanceId, messageData) {
    try {
      const { key, message, pushName } = messageData;
      
      // Ignore non-user messages
      if (key.fromMe || !message) return;

      // Get company by Evolution instance
      const { data: company } = await supabase
        .from('whatsapp_sessions')
        .select('company_id, companies(*)')
        .eq('evolution_instance', instanceId)
        .single();

      if (!company) {
        logger.error(`No company found for instance ${instanceId}`);
        return;
      }

      const companyData = company.companies;
      const contact = key.remoteJid.split('@')[0];

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
        processedMessage = await audioService.transcribeAudio(audioUrl);
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

      // Send response
      let responseData;
      if (companyData.features?.voice_enabled && !message.audioMessage) {
        // Text response for text input
        responseData = {
          number: key.remoteJid,
          text: difyResponse.answer
        };
      } else if (message.audioMessage && companyData.features?.voice_enabled) {
        // Audio response for audio input
        const audioUrl = await audioService.textToSpeech(difyResponse.answer, companyData.voice_config);
        responseData = {
          number: key.remoteJid,
          audio: audioUrl
        };
      } else {
        // Default text response
        responseData = {
          number: key.remoteJid,
          text: difyResponse.answer
        };
      }

      await evolutionService.sendMessage(instanceId, responseData);

    } catch (error) {
      logger.error('Error handling incoming message:', error);
    }
  },

  async getOrCreateConversation(companyId, contact, contactName) {
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('company_id', companyId)
      .eq('contact', contact)
      .single();

    if (existing) return existing;

    const { data: newConversation } = await supabase
      .from('conversations')
      .insert({
        company_id: companyId,
        contact,
        contact_name: contactName,
        status: 'active'
      })
      .select()
      .single();

    return newConversation;
  },

  async saveMessage(conversationId, role, content, metadata = null) {
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        metadata,
        timestamp: new Date().toISOString()
      });
  }
};

module.exports = { messageService };