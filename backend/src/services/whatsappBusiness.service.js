const axios = require('axios');
const { logger } = require('../config/logger');
const { messageChunkerService } = require('./messageChunker.service');

/**
 * Serviço para integração com WhatsApp Business API oficial
 * Suporta Meta Cloud API e On-Premises API
 */
class WhatsAppBusinessService {
  constructor() {
    this.instances = new Map(); // Cache de configurações por empresa
  }

  /**
   * Configura uma instância do WhatsApp Business API para uma empresa
   * @param {string} companyId - ID da empresa
   * @param {Object} config - Configurações da API
   */
  configureInstance(companyId, config) {
    const {
      apiVersion = 'v18.0',
      phoneNumberId,
      accessToken,
      businessAccountId,
      webhookVerifyToken,
      apiUrl = 'https://graph.facebook.com' // Cloud API por padrão
    } = config;

    if (!phoneNumberId || !accessToken) {
      throw new Error('phoneNumberId and accessToken are required');
    }

    this.instances.set(companyId, {
      phoneNumberId,
      accessToken,
      businessAccountId,
      webhookVerifyToken,
      baseUrl: `${apiUrl}/${apiVersion}/${phoneNumberId}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    logger.info(`WhatsApp Business API configured for company ${companyId}`);
  }

  /**
   * Obtém configuração de uma empresa
   */
  getInstance(companyId) {
    const instance = this.instances.get(companyId);
    if (!instance) {
      throw new Error(`WhatsApp Business API not configured for company ${companyId}`);
    }
    return instance;
  }

  /**
   * Envia mensagem de texto
   * @param {string} companyId - ID da empresa
   * @param {string} to - Número do destinatário (formato: 5511999999999)
   * @param {string} text - Texto da mensagem
   * @param {Object} options - Opções extras
   */
  async sendTextMessage(companyId, to, text, options = {}) {
    const instance = this.getInstance(companyId);
    
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: options.previewUrl || false,
          body: text
        }
      };

      const response = await axios.post(
        `${instance.baseUrl}/messages`,
        payload,
        { headers: instance.headers }
      );

      logger.info(`Text message sent via WhatsApp Business API to ${to}`);
      return response.data;

    } catch (error) {
      logger.error('Error sending WhatsApp Business API message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia mensagem com template
   * @param {string} companyId - ID da empresa
   * @param {string} to - Número do destinatário
   * @param {string} templateName - Nome do template
   * @param {string} languageCode - Código do idioma (pt_BR, en_US, etc)
   * @param {Array} parameters - Parâmetros do template
   */
  async sendTemplateMessage(companyId, to, templateName, languageCode = 'pt_BR', parameters = []) {
    const instance = this.getInstance(companyId);
    
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: parameters.length > 0 ? [{
            type: 'body',
            parameters: parameters.map(param => ({
              type: 'text',
              text: param
            }))
          }] : []
        }
      };

      const response = await axios.post(
        `${instance.baseUrl}/messages`,
        payload,
        { headers: instance.headers }
      );

      logger.info(`Template message sent via WhatsApp Business API to ${to}`);
      return response.data;

    } catch (error) {
      logger.error('Error sending WhatsApp Business template:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia mensagem com mídia
   * @param {string} companyId - ID da empresa
   * @param {string} to - Número do destinatário
   * @param {string} mediaType - Tipo de mídia (image, document, audio, video)
   * @param {string} mediaUrl - URL da mídia ou media_id
   * @param {Object} options - Opções extras (caption, filename, etc)
   */
  async sendMediaMessage(companyId, to, mediaType, mediaUrl, options = {}) {
    const instance = this.getInstance(companyId);
    
    try {
      const mediaObject = {
        link: mediaUrl
      };

      // Adiciona opções específicas por tipo de mídia
      if (options.caption && ['image', 'video', 'document'].includes(mediaType)) {
        mediaObject.caption = options.caption;
      }
      
      if (options.filename && mediaType === 'document') {
        mediaObject.filename = options.filename;
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: mediaType,
        [mediaType]: mediaObject
      };

      const response = await axios.post(
        `${instance.baseUrl}/messages`,
        payload,
        { headers: instance.headers }
      );

      logger.info(`Media message (${mediaType}) sent via WhatsApp Business API to ${to}`);
      return response.data;

    } catch (error) {
      logger.error('Error sending WhatsApp Business media:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia mensagem com botões interativos
   * @param {string} companyId - ID da empresa
   * @param {string} to - Número do destinatário
   * @param {string} bodyText - Texto principal
   * @param {Array} buttons - Array de botões (máximo 3)
   * @param {Object} options - Opções extras (header, footer)
   */
  async sendButtonMessage(companyId, to, bodyText, buttons, options = {}) {
    const instance = this.getInstance(companyId);
    
    if (buttons.length > 3) {
      throw new Error('Maximum 3 buttons allowed');
    }

    try {
      const interactive = {
        type: 'button',
        body: {
          text: bodyText
        },
        action: {
          buttons: buttons.map((button, index) => ({
            type: 'reply',
            reply: {
              id: button.id || `btn_${index}`,
              title: button.title.substring(0, 20) // Máximo 20 caracteres
            }
          }))
        }
      };

      if (options.header) {
        interactive.header = {
          type: 'text',
          text: options.header
        };
      }

      if (options.footer) {
        interactive.footer = {
          text: options.footer
        };
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive
      };

      const response = await axios.post(
        `${instance.baseUrl}/messages`,
        payload,
        { headers: instance.headers }
      );

      logger.info(`Button message sent via WhatsApp Business API to ${to}`);
      return response.data;

    } catch (error) {
      logger.error('Error sending WhatsApp Business buttons:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia mensagem com lista interativa
   * @param {string} companyId - ID da empresa
   * @param {string} to - Número do destinatário
   * @param {string} bodyText - Texto principal
   * @param {string} buttonText - Texto do botão da lista
   * @param {Array} sections - Seções da lista
   */
  async sendListMessage(companyId, to, bodyText, buttonText, sections) {
    const instance = this.getInstance(companyId);
    
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: bodyText
          },
          action: {
            button: buttonText,
            sections: sections.map(section => ({
              title: section.title,
              rows: section.rows.map(row => ({
                id: row.id,
                title: row.title,
                description: row.description || ''
              }))
            }))
          }
        }
      };

      const response = await axios.post(
        `${instance.baseUrl}/messages`,
        payload,
        { headers: instance.headers }
      );

      logger.info(`List message sent via WhatsApp Business API to ${to}`);
      return response.data;

    } catch (error) {
      logger.error('Error sending WhatsApp Business list:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia mensagem com chunking inteligente usando WhatsApp Business API
   * @param {string} companyId - ID da empresa
   * @param {string} to - Número do destinatário
   * @param {string} message - Mensagem longa
   * @param {Object} chunkingOptions - Opções de chunking
   */
  async sendChunkedMessage(companyId, to, message, chunkingOptions = {}) {
    try {
      // Analisa a mensagem para chunking
      const analysis = messageChunkerService.analyzeMessage(message, chunkingOptions);

      if (!analysis.shouldChunk) {
        // Mensagem única
        return await this.sendTextMessage(companyId, to, message);
      }

      // Mensagens múltiplas com delay
      logger.info(`🔄 Sending ${analysis.chunkCount} chunks via WhatsApp Business API to ${to}`);
      
      const results = [];
      for (let i = 0; i < analysis.chunks.length; i++) {
        const chunk = analysis.chunks[i];
        const metadata = analysis.metadata[i];

        // Delay antes de enviar (exceto primeira mensagem)
        if (i > 0) {
          await messageChunkerService.sleep(metadata.delay);
        }

        const result = await this.sendTextMessage(companyId, to, chunk);
        results.push(result);

        logger.info(`📤 Sent chunk ${i + 1}/${analysis.chunkCount} (${metadata.type})`);
      }

      logger.info(`✅ All ${analysis.chunkCount} chunks sent successfully`);
      return results;

    } catch (error) {
      logger.error('Error sending chunked WhatsApp Business message:', error);
      throw error;
    }
  }

  /**
   * Disparo em massa com controle de rate limiting
   * @param {string} companyId - ID da empresa
   * @param {Array} recipients - Array de destinatários [{ phone, message, variables }]
   * @param {Object} options - Opções de disparo
   */
  async sendBulkMessages(companyId, recipients, options = {}) {
    const {
      templateName = null,
      languageCode = 'pt_BR',
      rateLimitPerSecond = 10, // WhatsApp Business API limits
      delayBetweenMessages = 100,
      onProgress = null,
      onError = null
    } = options;

    const results = [];
    const errors = [];
    
    logger.info(`🚀 Starting bulk send to ${recipients.length} recipients`);

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        let result;
        
        if (templateName) {
          // Envio via template
          result = await this.sendTemplateMessage(
            companyId,
            recipient.phone,
            templateName,
            languageCode,
            recipient.variables || []
          );
        } else {
          // Envio de texto normal (com chunking se necessário)
          result = await this.sendChunkedMessage(
            companyId,
            recipient.phone,
            recipient.message
          );
        }

        results.push({ recipient: recipient.phone, success: true, data: result });
        
        if (onProgress) {
          onProgress(i + 1, recipients.length, null);
        }

      } catch (error) {
        const errorInfo = {
          recipient: recipient.phone,
          success: false,
          error: error.message
        };
        
        errors.push(errorInfo);
        
        if (onError) {
          onError(errorInfo);
        }

        logger.error(`Failed to send to ${recipient.phone}:`, error.message);
      }

      // Rate limiting - aguarda entre mensagens
      if (i < recipients.length - 1) {
        await messageChunkerService.sleep(delayBetweenMessages);
      }

      // Rate limiting por segundo
      if ((i + 1) % rateLimitPerSecond === 0) {
        logger.info(`📊 Rate limit: sent ${i + 1} messages, waiting 1 second...`);
        await messageChunkerService.sleep(1000);
      }
    }

    const summary = {
      total: recipients.length,
      successful: results.length,
      failed: errors.length,
      successRate: (results.length / recipients.length * 100).toFixed(2) + '%'
    };

    logger.info(`📊 Bulk send completed: ${summary.successful}/${summary.total} successful (${summary.successRate})`);

    return {
      summary,
      results,
      errors
    };
  }

  /**
   * Verifica webhook do WhatsApp Business API
   */
  verifyWebhook(mode, token, challenge, companyId) {
    const instance = this.getInstance(companyId);
    
    if (mode === 'subscribe' && token === instance.webhookVerifyToken) {
      logger.info(`Webhook verified for company ${companyId}`);
      return challenge;
    }
    
    logger.warn(`Webhook verification failed for company ${companyId}`);
    return null;
  }

  /**
   * Processa webhook recebido do WhatsApp Business API
   */
  async processWebhook(companyId, body) {
    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) {
        logger.warn('Invalid webhook payload structure');
        return null;
      }

      // Mensagens recebidas
      if (value.messages) {
        const message = value.messages[0];
        const contact = value.contacts?.[0];
        
        return {
          type: 'message',
          messageId: message.id,
          from: message.from,
          contact: {
            name: contact?.profile?.name || 'Unknown',
            wa_id: contact?.wa_id
          },
          message: {
            type: message.type,
            text: message.text?.body,
            timestamp: message.timestamp
          }
        };
      }

      // Status de entrega
      if (value.statuses) {
        const status = value.statuses[0];
        
        return {
          type: 'status',
          messageId: status.id,
          recipient: status.recipient_id,
          status: status.status, // sent, delivered, read, failed
          timestamp: status.timestamp
        };
      }

      return null;

    } catch (error) {
      logger.error('Error processing WhatsApp Business webhook:', error);
      throw error;
    }
  }
}

// Instância singleton
const whatsappBusinessService = new WhatsAppBusinessService();

module.exports = { whatsappBusinessService, WhatsAppBusinessService };