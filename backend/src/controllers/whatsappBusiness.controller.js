const { whatsappBusinessService } = require('../services/whatsappBusiness.service');
const { logger } = require('../config/logger');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const whatsappBusinessController = {
  /**
   * Configura WhatsApp Business API para uma empresa
   */
  async configure(req, res) {
    try {
      const { companyId } = req.params;
      const {
        phoneNumberId,
        accessToken,
        businessAccountId,
        webhookVerifyToken,
        apiUrl
      } = req.body;

      if (!phoneNumberId || !accessToken) {
        return res.status(400).json({
          error: 'phoneNumberId and accessToken are required'
        });
      }

      // Configura o serviço
      whatsappBusinessService.configureInstance(companyId, {
        phoneNumberId,
        accessToken,
        businessAccountId,
        webhookVerifyToken,
        apiUrl
      });

      // Salva configuração no banco (sem expor o token)
      await supabase
        .from('company_integrations')
        .upsert({
          company_id: companyId,
          integration_type: 'whatsapp_business',
          config: {
            phoneNumberId,
            businessAccountId,
            apiUrl: apiUrl || 'https://graph.facebook.com',
            configured_at: new Date().toISOString()
          },
          is_active: true
        });

      logger.info(`WhatsApp Business API configured for company ${companyId}`);

      res.json({
        success: true,
        message: 'WhatsApp Business API configured successfully',
        phoneNumberId
      });

    } catch (error) {
      logger.error('Error configuring WhatsApp Business API:', error);
      res.status(500).json({
        error: 'Failed to configure WhatsApp Business API',
        details: error.message
      });
    }
  },

  /**
   * Envia mensagem de texto
   */
  async sendMessage(req, res) {
    try {
      const { companyId } = req.params;
      const { to, message, enableChunking = true } = req.body;

      if (!to || !message) {
        return res.status(400).json({
          error: 'to and message are required'
        });
      }

      let result;
      
      if (enableChunking && message.length > 280) {
        result = await whatsappBusinessService.sendChunkedMessage(companyId, to, message);
      } else {
        result = await whatsappBusinessService.sendTextMessage(companyId, to, message);
      }

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error sending WhatsApp Business message:', error);
      res.status(500).json({
        error: 'Failed to send message',
        details: error.message
      });
    }
  },

  /**
   * Envia mensagem com template
   */
  async sendTemplate(req, res) {
    try {
      const { companyId } = req.params;
      const { to, templateName, languageCode = 'pt_BR', parameters = [] } = req.body;

      if (!to || !templateName) {
        return res.status(400).json({
          error: 'to and templateName are required'
        });
      }

      const result = await whatsappBusinessService.sendTemplateMessage(
        companyId,
        to,
        templateName,
        languageCode,
        parameters
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error sending WhatsApp Business template:', error);
      res.status(500).json({
        error: 'Failed to send template',
        details: error.message
      });
    }
  },

  /**
   * Envia mensagem com mídia
   */
  async sendMedia(req, res) {
    try {
      const { companyId } = req.params;
      const { to, mediaType, mediaUrl, caption, filename } = req.body;

      if (!to || !mediaType || !mediaUrl) {
        return res.status(400).json({
          error: 'to, mediaType and mediaUrl are required'
        });
      }

      const result = await whatsappBusinessService.sendMediaMessage(
        companyId,
        to,
        mediaType,
        mediaUrl,
        { caption, filename }
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error sending WhatsApp Business media:', error);
      res.status(500).json({
        error: 'Failed to send media',
        details: error.message
      });
    }
  },

  /**
   * Envia mensagem com botões
   */
  async sendButtons(req, res) {
    try {
      const { companyId } = req.params;
      const { to, bodyText, buttons, header, footer } = req.body;

      if (!to || !bodyText || !buttons || buttons.length === 0) {
        return res.status(400).json({
          error: 'to, bodyText and buttons are required'
        });
      }

      const result = await whatsappBusinessService.sendButtonMessage(
        companyId,
        to,
        bodyText,
        buttons,
        { header, footer }
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error sending WhatsApp Business buttons:', error);
      res.status(500).json({
        error: 'Failed to send buttons',
        details: error.message
      });
    }
  },

  /**
   * Envia lista interativa
   */
  async sendList(req, res) {
    try {
      const { companyId } = req.params;
      const { to, bodyText, buttonText, sections } = req.body;

      if (!to || !bodyText || !buttonText || !sections) {
        return res.status(400).json({
          error: 'to, bodyText, buttonText and sections are required'
        });
      }

      const result = await whatsappBusinessService.sendListMessage(
        companyId,
        to,
        bodyText,
        buttonText,
        sections
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error sending WhatsApp Business list:', error);
      res.status(500).json({
        error: 'Failed to send list',
        details: error.message
      });
    }
  },

  /**
   * Disparo em massa
   */
  async sendBulk(req, res) {
    try {
      const { companyId } = req.params;
      const {
        recipients,
        templateName,
        languageCode = 'pt_BR',
        rateLimitPerSecond = 10,
        delayBetweenMessages = 100
      } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          error: 'recipients array is required'
        });
      }

      // Inicia o processo assíncrono
      res.json({
        success: true,
        message: `Bulk send started for ${recipients.length} recipients`,
        estimatedTime: `${Math.ceil(recipients.length / rateLimitPerSecond)} seconds`
      });

      // Processa em background
      whatsappBusinessService.sendBulkMessages(companyId, recipients, {
        templateName,
        languageCode,
        rateLimitPerSecond,
        delayBetweenMessages,
        onProgress: (current, total) => {
          logger.info(`📊 Bulk progress: ${current}/${total} (${((current/total)*100).toFixed(1)}%)`);
        },
        onError: (errorInfo) => {
          logger.error(`❌ Bulk error for ${errorInfo.recipient}:`, errorInfo.error);
        }
      }).then(result => {
        logger.info('✅ Bulk send completed:', result.summary);
      }).catch(error => {
        logger.error('❌ Bulk send failed:', error);
      });

    } catch (error) {
      logger.error('Error starting WhatsApp Business bulk send:', error);
      res.status(500).json({
        error: 'Failed to start bulk send',
        details: error.message
      });
    }
  },

  /**
   * Webhook verification
   */
  async verifyWebhook(req, res) {
    try {
      const { companyId } = req.params;
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const result = whatsappBusinessService.verifyWebhook(mode, token, challenge, companyId);
      
      if (result) {
        res.status(200).send(challenge);
      } else {
        res.status(403).send('Forbidden');
      }

    } catch (error) {
      logger.error('Error verifying WhatsApp Business webhook:', error);
      res.status(500).send('Error');
    }
  },

  /**
   * Processa webhook recebido
   */
  async handleWebhook(req, res) {
    try {
      const { companyId } = req.params;
      const body = req.body;

      const processedData = await whatsappBusinessService.processWebhook(companyId, body);
      
      if (processedData) {
        // Aqui você pode integrar com o seu sistema de mensagens
        // Por exemplo, enviar para o Dify ou processar a mensagem
        logger.info(`📨 WhatsApp Business webhook processed:`, {
          type: processedData.type,
          from: processedData.from || processedData.recipient
        });

        // TODO: Integrar com message.service.js para processar mensagens recebidas
      }

      res.status(200).send('OK');

    } catch (error) {
      logger.error('Error handling WhatsApp Business webhook:', error);
      res.status(500).send('Error');
    }
  },

  /**
   * Lista templates disponíveis (requer permissões específicas)
   */
  async getTemplates(req, res) {
    try {
      const { companyId } = req.params;
      const instance = whatsappBusinessService.getInstance(companyId);

      // Esta funcionalidade requer permissões especiais na API
      // Por enquanto, retornamos uma mensagem informativa
      res.json({
        message: 'Template listing requires WhatsApp Business Management API permissions',
        documentation: 'https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates'
      });

    } catch (error) {
      logger.error('Error getting WhatsApp Business templates:', error);
      res.status(500).json({
        error: 'Failed to get templates',
        details: error.message
      });
    }
  },

  /**
   * Status da configuração
   */
  async getStatus(req, res) {
    try {
      const { companyId } = req.params;
      
      const instance = whatsappBusinessService.getInstance(companyId);
      
      res.json({
        configured: true,
        phoneNumberId: instance.phoneNumberId,
        businessAccountId: instance.businessAccountId,
        webhookConfigured: !!instance.webhookVerifyToken
      });

    } catch (error) {
      res.json({
        configured: false,
        error: error.message
      });
    }
  }
};

module.exports = { whatsappBusinessController };