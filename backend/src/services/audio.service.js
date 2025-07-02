const axios = require('axios');
const FormData = require('form-data');
const { logger } = require('../config/logger');

const audioService = {
  /**
   * Transcreve áudio usando a API de Speech-to-Text do Dify
   * @param {Buffer|File} audioFile - Arquivo de áudio para transcrever
   * @param {string} difyApiKey - Chave da API do Dify específica da empresa
   * @param {string} userId - ID do usuário para o Dify
   * @returns {string} Texto transcrito
   */
  async transcribeAudio(audioFile, difyApiKey, userId) {
    try {
      // Use Dify's built-in Speech to Text
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('user', userId);

      const response = await axios.post(`${process.env.DIFY_API_URL}/audio-to-text`, formData, {
        headers: {
          'Authorization': `Bearer ${difyApiKey}`,
          ...formData.getHeaders()
        }
      });

      logger.info('Audio transcribed successfully with Dify');
      return response.data.text;
    } catch (error) {
      logger.error('Error transcribing audio with Dify:', error);
      throw error;
    }
  },

  /**
   * Converte texto em áudio usando a API de Text-to-Speech do Dify
   * @param {string} text - Texto para converter em áudio
   * @param {string} difyApiKey - Chave da API do Dify específica da empresa
   * @param {string} messageId - ID da mensagem (opcional, para usar resposta do chat)
   * @param {string} userId - ID do usuário para o Dify
   * @returns {Buffer} Buffer de áudio
   */
  async textToSpeech(text, difyApiKey, messageId = null, userId) {
    try {
      // Use Dify's built-in Text to Audio
      const requestData = {
        user: userId
      };

      // Use message_id if available, otherwise use text directly
      if (messageId) {
        requestData.message_id = messageId;
      } else {
        requestData.text = text;
      }

      const response = await axios.post(`${process.env.DIFY_API_URL}/text-to-audio`, requestData, {
        headers: {
          'Authorization': `Bearer ${difyApiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      });

      logger.info('Text converted to speech successfully with Dify');
      return response.data;
    } catch (error) {
      logger.error('Error generating speech with Dify:', error);
      throw error;
    }
  },

  /**
   * Processa eventos de TTS em streaming do Dify
   * @param {Object} eventData - Dados do evento SSE do Dify
   * @returns {Object|null} Objeto processado ou null se não for evento de áudio
   */
  handleDifyTTSEvents(eventData) {
    switch (eventData.event) {
      case 'tts_message':
        // Decodifica chunk de áudio base64
        const audioChunk = Buffer.from(eventData.audio, 'base64');
        return { type: 'audio_chunk', data: audioChunk };
      
      case 'tts_message_end':
        return { type: 'audio_end' };
      
      default:
        return null;
    }
  },

  /**
   * Baixa áudio de uma URL e prepara para transcrição
   * @param {string} audioUrl - URL do arquivo de áudio
   * @returns {Buffer} Buffer do arquivo de áudio
   */
  async downloadAudio(audioUrl) {
    try {
      const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (error) {
      logger.error('Error downloading audio:', error);
      throw error;
    }
  }
};

module.exports = { audioService };