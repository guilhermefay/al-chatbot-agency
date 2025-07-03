const { logger } = require('../config/logger');
const { supabase } = require('../config/supabase');
const { difyService } = require('../services/dify.service');

const conversationController = {
  /**
   * Lista conversas de uma empresa
   * GET /api/conversations
   */
  async getConversations(req, res) {
    try {
      const { company_id, last_id, limit = 20, pinned } = req.query;

      if (!company_id) {
        return res.status(400).json({ error: 'company_id é obrigatório' });
      }

      // Buscar dados da empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name, dify_api_key')
        .eq('id', company_id)
        .single();

      if (companyError || !company) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      if (!company.dify_api_key) {
        return res.status(400).json({ error: 'API key do Dify não configurada para esta empresa' });
      }

      // Buscar conversas locais do banco
      let localQuery = supabase
        .from('conversations')
        .select('id, contact, contact_name, dify_conversation_id, created_at, updated_at, messages(count)')
        .eq('company_id', company_id)
        .order('updated_at', { ascending: false })
        .limit(parseInt(limit));

      const { data: localConversations, error: localError } = await localQuery;
      
      if (localError) throw localError;

      // Para cada conversa local que tem dify_conversation_id, buscar dados do Dify
      const enrichedConversations = [];
      
      for (const localConv of localConversations) {
        let conversationData = {
          id: localConv.id,
          contact: localConv.contact,
          contact_name: localConv.contact_name,
          created_at: localConv.created_at,
          updated_at: localConv.updated_at,
          message_count: localConv.messages[0]?.count || 0,
          dify_conversation_id: localConv.dify_conversation_id,
          dify_data: null
        };

        // Se tem ID do Dify, buscar dados adicionais
        if (localConv.dify_conversation_id) {
          try {
            const difyConversations = await difyService.getConversations(
              company.dify_api_key,
              localConv.contact,
              null,
              100 // Buscar mais para encontrar a conversa específica
            );

            // Encontrar a conversa específica
            const difyConv = difyConversations.data?.find(
              conv => conv.id === localConv.dify_conversation_id
            );

            if (difyConv) {
              conversationData.dify_data = {
                name: difyConv.name,
                introduction: difyConv.introduction,
                inputs: difyConv.inputs
              };
            }
          } catch (difyError) {
            logger.warn(`Erro ao buscar dados do Dify para conversa ${localConv.id}:`, difyError);
          }
        }

        enrichedConversations.push(conversationData);
      }

      res.json({
        success: true,
        data: enrichedConversations,
        total: enrichedConversations.length
      });

    } catch (error) {
      logger.error('Erro ao buscar conversas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  /**
   * Obtém histórico de mensagens de uma conversa
   * GET /api/conversations/:id/messages
   */
  async getConversationMessages(req, res) {
    try {
      const { id } = req.params;
      const { first_id, limit = 20 } = req.query;

      // Buscar conversa local
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*, companies(dify_api_key)')
        .eq('id', id)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      if (!conversation.companies.dify_api_key) {
        return res.status(400).json({ error: 'API key do Dify não configurada' });
      }

      // Buscar mensagens locais
      const { data: localMessages, error: localError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })
        .limit(parseInt(limit));

      if (localError) throw localError;

      let difyMessages = [];
      
      // Se a conversa tem ID do Dify, buscar histórico do Dify também
      if (conversation.dify_conversation_id) {
        try {
          const difyHistory = await difyService.getMessages(
            conversation.companies.dify_api_key,
            conversation.dify_conversation_id,
            conversation.contact,
            first_id,
            parseInt(limit)
          );

          difyMessages = difyHistory.data || [];
        } catch (difyError) {
          logger.warn('Erro ao buscar mensagens do Dify:', difyError);
        }
      }

      // Combinar mensagens locais com dados do Dify
      const enrichedMessages = localMessages.map(localMsg => {
        const difyMsg = difyMessages.find(d => d.id === localMsg.dify_message_id);
        
        return {
          id: localMsg.id,
          content: localMsg.content,
          role: localMsg.role,
          created_at: localMsg.created_at,
          metadata: localMsg.metadata,
          dify_message_id: localMsg.dify_message_id,
          dify_data: difyMsg ? {
            inputs: difyMsg.inputs,
            query: difyMsg.query,
            answer: difyMsg.answer,
            message_files: difyMsg.message_files,
            agent_thoughts: difyMsg.agent_thoughts,
            feedback: difyMsg.feedback,
            retriever_resources: difyMsg.retriever_resources
          } : null
        };
      });

      res.json({
        success: true,
        data: enrichedMessages,
        conversation: {
          id: conversation.id,
          contact: conversation.contact,
          contact_name: conversation.contact_name,
          dify_conversation_id: conversation.dify_conversation_id
        }
      });

    } catch (error) {
      logger.error('Erro ao buscar mensagens da conversa:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  /**
   * Envia mensagem para conversa (simula mensagem do usuário)
   * POST /api/conversations/:id/messages
   */
  async sendMessage(req, res) {
    try {
      const { id } = req.params;
      const { content, role, audio, mimetype } = req.body;

      // Buscar conversa
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*, companies(id, dify_api_key), whatsapp_sessions!inner(evolution_instance)')
        .eq('id', id)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      let messageContent = content;
      let isAudio = false;

      // Se for mensagem de áudio, processar com Dify transcription
      if (audio && mimetype && role === 'user') {
        const { audioService } = require('../services/audio.service');
        
        try {
          // Convert base64 to buffer
          const audioBuffer = Buffer.from(audio, 'base64');
          
          // Transcribe with Dify
          messageContent = await audioService.transcribeAudio(
            audioBuffer, 
            conversation.companies.dify_api_key, 
            conversation.contact
          );
          
          isAudio = true;
          logger.info(`Audio transcribed: ${messageContent}`);
        } catch (audioError) {
          logger.error('Error transcribing audio:', audioError);
          return res.status(400).json({ error: 'Erro ao processar áudio' });
        }
      }

      // Salvar mensagem no banco
      const { data: savedMessage, error: saveError } = await supabase
        .from('messages')
        .insert({
          conversation_id: id,
          role,
          content: messageContent,
          is_audio: isAudio,
          metadata: isAudio ? { original_audio: true, mimetype } : null,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Se for mensagem do usuário, processar com Dify e enviar pelo WhatsApp
      if (role === 'user' && conversation.companies.dify_api_key) {
        const { messageService } = require('../services/message.service');
        
        // Simular dados do webhook do WhatsApp
        const mockMessageData = {
          key: {
            remoteJid: `${conversation.contact}@s.whatsapp.net`,
            fromMe: false,
            id: `mock_${Date.now()}`
          },
          message: isAudio ? {
            audioMessage: {
              url: `data:${mimetype};base64,${audio}`,
              mimetype: mimetype
            }
          } : {
            conversation: messageContent
          },
          pushName: conversation.contact_name || conversation.contact
        };

        // Processar mensagem através do serviço
        const instanceName = conversation.whatsapp_sessions[0]?.evolution_instance;
        if (instanceName) {
          await messageService.handleIncomingMessage(instanceName, mockMessageData);
        }
      }

      logger.info(`Mensagem enviada para conversa ${id}: ${role} - ${isAudio ? 'audio' : messageContent}`);
      
      res.status(201).json({
        success: true,
        data: savedMessage
      });

    } catch (error) {
      logger.error('Erro ao enviar mensagem:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  /**
   * Submete feedback para uma mensagem
   * POST /api/messages/:messageId/feedback
   */
  async submitMessageFeedback(req, res) {
    try {
      const { messageId } = req.params;
      const { rating } = req.body; // 'like', 'dislike', ou null

      if (!['like', 'dislike', null].includes(rating)) {
        return res.status(400).json({ error: 'Rating deve ser "like", "dislike" ou null' });
      }

      // Buscar mensagem local
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .select('*, conversations(contact, companies(dify_api_key))')
        .eq('id', messageId)
        .single();

      if (msgError || !message) {
        return res.status(404).json({ error: 'Mensagem não encontrada' });
      }

      if (!message.dify_message_id) {
        return res.status(400).json({ error: 'Mensagem não possui ID do Dify' });
      }

      // Submeter feedback no Dify
      try {
        await difyService.submitMessageFeedback(
          message.conversations.companies.dify_api_key,
          message.dify_message_id,
          rating,
          message.conversations.contact
        );

        // Atualizar feedback local
        const { error: updateError } = await supabase
          .from('messages')
          .update({
            metadata: {
              ...message.metadata,
              feedback: rating
            }
          })
          .eq('id', messageId);

        if (updateError) throw updateError;

        logger.info(`Feedback submetido para mensagem ${messageId}: ${rating}`);
        
        res.json({
          success: true,
          message: 'Feedback submetido com sucesso'
        });

      } catch (difyError) {
        logger.error('Erro ao submeter feedback no Dify:', difyError);
        res.status(500).json({ error: 'Erro ao submeter feedback no Dify' });
      }

    } catch (error) {
      logger.error('Erro ao submeter feedback:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  /**
   * Deleta uma conversa
   * DELETE /api/conversations/:id
   */
  async deleteConversation(req, res) {
    try {
      const { id } = req.params;

      // Buscar conversa
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*, companies(dify_api_key)')
        .eq('id', id)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      // Deletar do Dify se tiver ID
      if (conversation.dify_conversation_id && conversation.companies.dify_api_key) {
        try {
          await difyService.deleteConversation(
            conversation.companies.dify_api_key,
            conversation.dify_conversation_id,
            conversation.contact
          );
          logger.info(`Conversa deletada do Dify: ${conversation.dify_conversation_id}`);
        } catch (difyError) {
          logger.warn('Erro ao deletar conversa do Dify:', difyError);
          // Continua com a deleção local mesmo se falhar no Dify
        }
      }

      // Deletar mensagens locais
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', id);

      // Deletar conversa local
      const { error: deleteError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      logger.info(`Conversa deletada: ${id}`);
      
      res.json({
        success: true,
        message: 'Conversa deletada com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao deletar conversa:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  /**
   * Renomeia uma conversa
   * PUT /api/conversations/:id/name
   */
  async renameConversation(req, res) {
    try {
      const { id } = req.params;
      const { name, auto_generate = false } = req.body;

      if (!name && !auto_generate) {
        return res.status(400).json({ error: 'Nome ou auto_generate deve ser fornecido' });
      }

      // Buscar conversa
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*, companies(dify_api_key)')
        .eq('id', id)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      let newName = name;

      // Renomear no Dify se tiver ID
      if (conversation.dify_conversation_id && conversation.companies.dify_api_key) {
        try {
          const difyResult = await difyService.renameConversation(
            conversation.companies.dify_api_key,
            conversation.dify_conversation_id,
            name,
            auto_generate,
            conversation.contact
          );

          if (auto_generate && difyResult.name) {
            newName = difyResult.name;
          }

          logger.info(`Conversa renomeada no Dify: ${conversation.dify_conversation_id}`);
        } catch (difyError) {
          logger.warn('Erro ao renomear conversa no Dify:', difyError);
          // Continua com a renomeação local mesmo se falhar no Dify
        }
      }

      // Atualizar nome local (se fornecido ou gerado)
      if (newName) {
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ contact_name: newName })
          .eq('id', id);

        if (updateError) throw updateError;
      }

      logger.info(`Conversa renomeada: ${id} -> ${newName}`);
      
      res.json({
        success: true,
        data: {
          id: id,
          name: newName || conversation.contact_name
        }
      });

    } catch (error) {
      logger.error('Erro ao renomear conversa:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  /**
   * Para geração de mensagem em streaming
   * POST /api/conversations/:id/stop
   */
  async stopMessageGeneration(req, res) {
    try {
      const { id } = req.params;
      const { task_id } = req.body;

      if (!task_id) {
        return res.status(400).json({ error: 'task_id é obrigatório' });
      }

      // Buscar conversa
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*, companies(dify_api_key)')
        .eq('id', id)
        .single();

      if (convError || !conversation) {
        return res.status(404).json({ error: 'Conversa não encontrada' });
      }

      if (!conversation.companies.dify_api_key) {
        return res.status(400).json({ error: 'API key do Dify não configurada' });
      }

      // Parar geração no Dify
      await difyService.stopMessageGeneration(
        conversation.companies.dify_api_key,
        task_id,
        conversation.contact
      );

      logger.info(`Geração de mensagem parada: ${task_id}`);
      
      res.json({
        success: true,
        message: 'Geração de mensagem parada com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao parar geração de mensagem:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = { conversationController };