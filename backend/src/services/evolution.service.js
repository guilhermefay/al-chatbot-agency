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
        webhook: {
          url: `${process.env.WEBHOOK_BASE_URL}/api/webhook/evolution/${instanceName}`,
          events: [
            'messages.upsert',
            'connection.update',
            'status.instance'
          ]
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating Evolution instance:', error);
      throw error;
    }
  },

  async getInstanceStatus(instanceName) {
    try {
      const response = await this.client.get(`/instance/status/${instanceName}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting instance status:', error);
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
      return response.data;
    } catch (error) {
      logger.error('Error deleting instance:', error);
      throw error;
    }
  }
};

module.exports = { evolutionService };