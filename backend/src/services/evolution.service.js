const axios = require('axios');
const { logger } = require('../config/logger');

const evolutionService = {
  client: axios.create({
    baseURL: process.env.EVOLUTION_API_URL,
    headers: {
      'apikey': process.env.EVOLUTION_API_KEY,
      'Content-Type': 'application/json'
    }
  }),

  async createInstance(instanceName, companyId) {
    try {
      const response = await this.client.post('/instance/create', {
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
        reject_call: true,
        msg_call: 'Desculpe, não posso atender chamadas.',
        webhook: `${process.env.WEBHOOK_BASE_URL}/webhook/evolution/${instanceName}`
      });

      logger.info(`✅ Evolution instance created: ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error('Error creating Evolution instance:', error);
      throw error;
    }
  },

  async getInstanceStatus(instanceName) {
    try {
      const response = await this.client.get(`/instance/connectionState/${instanceName}`);
      logger.info(`📡 Instance status for ${instanceName}:`, response.data);
      return response.data;
    } catch (error) {
      logger.error('Error getting instance status:', error);
      throw error;
    }
  },

  /**
   * Conecta à instância e obtém QR code
   * @param {string} instanceName Nome da instância
   * @returns {Object} Dados de conexão com QR code
   */
  async connectInstance(instanceName) {
    try {
      const response = await this.client.get(`/instance/connect/${instanceName}`);
      logger.info(`🔗 Instance connect for ${instanceName}:`, response.data);
      return response.data;
    } catch (error) {
      logger.error('Error connecting instance:', error);
      throw error;
    }
  },

  /**
   * Lista todas as instâncias
   * @returns {Array} Lista de instâncias
   */
  async fetchInstances() {
    try {
      const response = await this.client.get('/instance/fetchInstances');
      logger.info('📋 Fetched instances:', response.data);
      return response.data;
    } catch (error) {
      logger.error('Error fetching instances:', error);
      throw error;
    }
  },

  /**
   * Obtém status completo com QR code se necessário
   * @param {string} instanceName Nome da instância
   * @returns {Object} Status completo da instância
   */
  async getInstanceStatusWithQR(instanceName) {
    try {
      // Primeiro obter o status da conexão
      const statusResponse = await this.getInstanceStatus(instanceName);
      
      // Se desconectado, obter QR code
      if (statusResponse.instance?.state === 'close' || statusResponse.instance?.state === 'disconnected') {
        try {
          const connectResponse = await this.connectInstance(instanceName);
          return {
            ...statusResponse,
            qr_code: connectResponse.qrcode || connectResponse.base64 || null
          };
        } catch (connectError) {
          logger.warn('Failed to get QR code, returning status only:', connectError.message);
          return statusResponse;
        }
      }
      
      return statusResponse;
    } catch (error) {
      logger.error('Error getting instance status with QR:', error);
      throw error;
    }
  },

  async sendMessage(instanceName, messageData) {
    try {
      const endpoint = messageData.audio ? '/message/sendAudio' : '/message/sendText';
      
      const response = await this.client.post(`${endpoint}/${instanceName}`, {
        ...messageData
      });

      return response.data;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  },

  async getMediaUrl(instanceName, mediaKey) {
    try {
      const response = await this.client.post(`/message/getMedia/${instanceName}`, {
        mediaKey
      });
      return response.data.mediaUrl;
    } catch (error) {
      logger.error('Error getting media URL:', error);
      throw error;
    }
  },

  async deleteInstance(instanceName) {
    try {
      const response = await this.client.delete(`/instance/delete/${instanceName}`);
      logger.info(`🗑️ Instance deleted: ${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error('Error deleting instance:', error);
      throw error;
    }
  }
};

module.exports = { evolutionService };