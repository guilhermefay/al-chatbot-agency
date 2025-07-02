const axios = require('axios');
const { logger } = require('../config/logger');

const difyService = {
  client: axios.create({
    baseURL: process.env.DIFY_API_URL,
    headers: {
      'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
      'Content-Type': 'application/json'
    }
  }),

  async processMessage(difyApiKey, message, userId, conversationId = null) {
    try {
      const response = await this.client.post('/chat-messages', {
        inputs: {},
        query: message,
        user: userId,
        conversation_id: conversationId || "",
        response_mode: 'blocking',
        files: []
      }, {
        headers: {
          'Authorization': `Bearer ${difyApiKey}` // Use company-specific Dify API key
        }
      });

      return {
        answer: response.data.answer,
        conversation_id: response.data.conversation_id,
        message_id: response.data.message_id,
        usage: response.data.metadata?.usage || null
      };
    } catch (error) {
      logger.error('Error processing message with Dify:', error);
      throw error;
    }
  },

  /**
   * Lista conversas do usuário
   * @param {string} difyApiKey - Chave da API do Dify
   * @param {string} userId - ID do usuário
   * @param {string} lastId - ID da última conversa (para paginação)
   * @param {number} limit - Limite de conversas
   * @param {boolean} pinned - Filtrar apenas conversas fixadas
   * @returns {Object} Lista de conversas
   */
  async getConversations(difyApiKey, userId, lastId = null, limit = 20, pinned = null) {
    try {
      const params = {
        user: userId,
        limit: limit
      };
      
      if (lastId) params.last_id = lastId;
      if (pinned !== null) params.pinned = pinned;

      const response = await this.client.get('/conversations', {
        params,
        headers: {
          'Authorization': `Bearer ${difyApiKey}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting conversations from Dify:', error);
      throw error;
    }
  },

  /**
   * Obtém histórico de mensagens de uma conversa
   * @param {string} difyApiKey - Chave da API do Dify
   * @param {string} conversationId - ID da conversa
   * @param {string} userId - ID do usuário
   * @param {string} firstId - ID da primeira mensagem (para paginação)
   * @param {number} limit - Limite de mensagens
   * @returns {Object} Histórico de mensagens
   */
  async getMessages(difyApiKey, conversationId, userId, firstId = null, limit = 20) {
    try {
      const params = {
        conversation_id: conversationId,
        user: userId,
        limit: limit
      };
      
      if (firstId) params.first_id = firstId;

      const response = await this.client.get('/messages', {
        params,
        headers: {
          'Authorization': `Bearer ${difyApiKey}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting messages from Dify:', error);
      throw error;
    }
  },

  /**
   * Submete feedback para uma mensagem
   * @param {string} difyApiKey - Chave da API do Dify
   * @param {string} messageId - ID da mensagem
   * @param {string} rating - Rating: 'like', 'dislike' ou null
   * @param {string} userId - ID do usuário
   * @returns {Object} Resultado do feedback
   */
  async submitMessageFeedback(difyApiKey, messageId, rating, userId) {
    try {
      const response = await this.client.post(`/messages/${messageId}/feedbacks`, {
        rating: rating, // 'like', 'dislike', ou null
        user: userId
      }, {
        headers: {
          'Authorization': `Bearer ${difyApiKey}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error submitting feedback to Dify:', error);
      throw error;
    }
  },

  /**
   * Deleta uma conversa
   * @param {string} difyApiKey - Chave da API do Dify
   * @param {string} conversationId - ID da conversa
   * @param {string} userId - ID do usuário
   * @returns {Object} Resultado da operação
   */
  async deleteConversation(difyApiKey, conversationId, userId) {
    try {
      const response = await this.client.delete(`/conversations/${conversationId}`, {
        data: {
          user: userId
        },
        headers: {
          'Authorization': `Bearer ${difyApiKey}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error deleting conversation from Dify:', error);
      throw error;
    }
  },

  /**
   * Renomeia uma conversa
   * @param {string} difyApiKey - Chave da API do Dify
   * @param {string} conversationId - ID da conversa
   * @param {string} name - Novo nome (opcional, se não fornecido será auto-gerado)
   * @param {boolean} autoGenerate - Auto-gerar nome
   * @param {string} userId - ID do usuário
   * @returns {Object} Conversa atualizada
   */
  async renameConversation(difyApiKey, conversationId, name = null, autoGenerate = false, userId) {
    try {
      const requestData = {
        user: userId,
        auto_generate: autoGenerate
      };
      
      if (name) requestData.name = name;

      const response = await this.client.post(`/conversations/${conversationId}/name`, requestData, {
        headers: {
          'Authorization': `Bearer ${difyApiKey}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error renaming conversation in Dify:', error);
      throw error;
    }
  },

  /**
   * Para geração de mensagem em streaming
   * @param {string} difyApiKey - Chave da API do Dify
   * @param {string} taskId - ID da tarefa
   * @param {string} userId - ID do usuário
   * @returns {Object} Resultado da operação
   */
  async stopMessageGeneration(difyApiKey, taskId, userId) {
    try {
      const response = await this.client.post(`/chat-messages/${taskId}/stop`, {
        user: userId
      }, {
        headers: {
          'Authorization': `Bearer ${difyApiKey}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error stopping message generation in Dify:', error);
      throw error;
    }
  },

  /**
   * Lista datasets/bases de conhecimento
   * @param {string} difyApiKey - Chave da API do Dify
   * @param {number} page - Página
   * @param {number} limit - Limite por página
   * @returns {Object} Lista de datasets
   */
  async getDatasets(difyApiKey, page = 1, limit = 20) {
    try {
      const response = await this.client.get('/datasets', {
        params: {
          page: page,
          limit: limit
        },
        headers: {
          'Authorization': `Bearer ${difyApiKey}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting datasets from Dify:', error);
      throw error;
    }
  },

  /**
   * Deleta documento específico de um dataset
   * @param {string} difyApiKey - Chave da API do Dify
   * @param {string} datasetId - ID do dataset
   * @param {string} documentId - ID do documento
   * @returns {Object} Resultado da operação
   */
  async deleteDocument(difyApiKey, datasetId, documentId) {
    try {
      const response = await this.client.delete(`/datasets/${datasetId}/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${difyApiKey}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error deleting document from Dify:', error);
      throw error;
    }
  },

  /**
   * Cria dataset/base de conhecimento
   * @param {string} difyApiKey - Chave da API do Dify
   * @param {string} name - Nome do dataset
   * @param {string} permission - Permissão ('only_me', 'all_team_members', etc.)
   * @returns {Object} Dataset criado
   */
  async createDataset(difyApiKey, name, permission = 'only_me') {
    try {
      const response = await this.client.post('/datasets', {
        name: name,
        permission: permission
      }, {
        headers: {
          'Authorization': `Bearer ${difyApiKey}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating dataset in Dify:', error);
      throw error;
    }
  },

  async createApp(appConfig) {
    try {
      const response = await this.client.post('/apps', {
        name: appConfig.name,
        mode: 'agent-chat',
        icon: '🤖',
        icon_background: '#1C64F2',
        model_config: {
          model: {
            provider: 'openai',
            name: 'gpt-4-turbo-preview',
            mode: 'chat',
            completion_params: {
              temperature: 0.7,
              max_tokens: 2000
            }
          },
          prompt: {
            text: appConfig.systemPrompt
          }
        },
        features: {
          file_upload: {
            enabled: true
          },
          opening_statement: appConfig.openingStatement,
          suggested_questions_after_answer: {
            enabled: true
          },
          speech_to_text: {
            enabled: false
          }
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating Dify app:', error);
      throw error;
    }
  },

  async uploadDocument(appId, documentData) {
    try {
      const formData = new FormData();
      formData.append('file', documentData.file);
      formData.append('name', documentData.name);
      formData.append('indexing_technique', 'high_quality');

      const response = await this.client.post(`/datasets/${appId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error uploading document to Dify:', error);
      throw error;
    }
  },

  async createTool(toolConfig) {
    try {
      const response = await this.client.post('/tools', {
        name: toolConfig.name,
        description: toolConfig.description,
        parameters: toolConfig.parameters,
        callback_url: `${process.env.WEBHOOK_BASE_URL}/api/webhook/dify/tools/${toolConfig.id}`
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating Dify tool:', error);
      throw error;
    }
  }
};

module.exports = { difyService };