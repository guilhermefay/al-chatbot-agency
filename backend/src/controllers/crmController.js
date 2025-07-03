const { getManager } = require('../integrations/crms/CRMManager');

/**
 * Controlador para gerenciar integrações com CRMs
 */
class CRMController {
  constructor() {
    this.crmManager = getManager();
  }

  /**
   * Lista todos os CRMs disponíveis
   * GET /api/crms/available
   */
  async getAvailableCRMs(req, res) {
    try {
      const crms = this.crmManager.getAvailableCRMs();
      
      res.json({
        success: true,
        data: crms,
        message: 'CRMs disponíveis carregados com sucesso'
      });

    } catch (error) {
      console.error('[CRMController] Error getting available CRMs:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Lista CRMs ativos para uma empresa
   * GET /api/companies/:companyId/crms
   */
  async getCompanyCRMs(req, res) {
    try {
      const { companyId } = req.params;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'ID da empresa é obrigatório'
        });
      }

      // Por enquanto, usar apenas CRMs ativos no registry
      const activeCRMs = this.crmManager.registry.listActiveProviders();
      
      res.json({
        success: true,
        data: activeCRMs,
        message: 'CRMs da empresa carregados com sucesso'
      });

    } catch (error) {
      console.error('[CRMController] Error getting company CRMs:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar CRMs da empresa',
        error: error.message
      });
    }
  }

  /**
   * Configura um CRM para uma empresa
   * POST /api/companies/:companyId/crms/:providerName/configure
   */
  async configureCRM(req, res) {
    try {
      const { companyId, providerName } = req.params;
      const { credentials, configuration } = req.body;

      if (!companyId || !providerName) {
        return res.status(400).json({
          success: false,
          message: 'ID da empresa e nome do provedor são obrigatórios'
        });
      }

      if (!credentials) {
        return res.status(400).json({
          success: false,
          message: 'Credenciais são obrigatórias'
        });
      }

      const result = await this.crmManager.configureCRM(
        companyId,
        providerName,
        credentials,
        configuration || {}
      );

      res.json({
        success: true,
        data: result,
        message: `CRM ${providerName} configurado com sucesso`
      });

    } catch (error) {
      console.error('[CRMController] Error configuring CRM:', error.message);
      res.status(400).json({
        success: false,
        message: 'Erro ao configurar CRM',
        error: error.message
      });
    }
  }

  /**
   * Testa a conexão com um CRM
   * POST /api/companies/:companyId/crms/:providerName/test
   */
  async testCRMConnection(req, res) {
    try {
      const { companyId, providerName } = req.params;
      const { credentials } = req.body;

      if (!companyId || !providerName) {
        return res.status(400).json({
          success: false,
          message: 'ID da empresa e nome do provedor são obrigatórios'
        });
      }

      if (!credentials) {
        return res.status(400).json({
          success: false,
          message: 'Credenciais são obrigatórias para teste'
        });
      }

      // Validar credenciais sem ativar o CRM
      const isValid = await this.crmManager.registry.validateCredentials(
        providerName, 
        credentials
      );

      if (isValid) {
        res.json({
          success: true,
          message: `Conexão com ${providerName} testada com sucesso`,
          data: {
            provider: providerName,
            status: 'connected'
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: `Falha na conexão com ${providerName}`,
          data: {
            provider: providerName,
            status: 'failed'
          }
        });
      }

    } catch (error) {
      console.error('[CRMController] Error testing CRM connection:', error.message);
      res.status(400).json({
        success: false,
        message: 'Erro ao testar conexão com CRM',
        error: error.message
      });
    }
  }

  /**
   * Remove/desativa um CRM
   * DELETE /api/companies/:companyId/crms/:providerName
   */
  async removeCRM(req, res) {
    try {
      const { companyId, providerName } = req.params;

      if (!companyId || !providerName) {
        return res.status(400).json({
          success: false,
          message: 'ID da empresa e nome do provedor são obrigatórios'
        });
      }

      // Desativar o CRM
      const removed = this.crmManager.registry.deactivateProvider(providerName);

      if (removed) {
        res.json({
          success: true,
          message: `CRM ${providerName} removido com sucesso`
        });
      } else {
        res.status(404).json({
          success: false,
          message: `CRM ${providerName} não encontrado ou não está ativo`
        });
      }

    } catch (error) {
      console.error('[CRMController] Error removing CRM:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover CRM',
        error: error.message
      });
    }
  }

  /**
   * Sincroniza um contato com todos os CRMs ativos
   * POST /api/companies/:companyId/crms/sync-contact
   */
  async syncContact(req, res) {
    try {
      const { companyId } = req.params;
      const contactData = req.body;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'ID da empresa é obrigatório'
        });
      }

      if (!contactData || !contactData.phone) {
        return res.status(400).json({
          success: false,
          message: 'Dados do contato são obrigatórios (pelo menos telefone)'
        });
      }

      const results = await this.crmManager.syncContactToAllCRMs(companyId, contactData);

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: totalCount,
            successful: successCount,
            failed: totalCount - successCount
          }
        },
        message: `Contato sincronizado com ${successCount}/${totalCount} CRMs`
      });

    } catch (error) {
      console.error('[CRMController] Error syncing contact:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro ao sincronizar contato',
        error: error.message
      });
    }
  }

  /**
   * Envia uma mensagem através de um CRM
   * POST /api/companies/:companyId/crms/:providerName/send-message
   */
  async sendMessage(req, res) {
    try {
      const { companyId, providerName } = req.params;
      const { chatNumber, message, options } = req.body;

      if (!companyId || !providerName) {
        return res.status(400).json({
          success: false,
          message: 'ID da empresa e nome do provedor são obrigatórios'
        });
      }

      if (!chatNumber || !message) {
        return res.status(400).json({
          success: false,
          message: 'Número do chat e mensagem são obrigatórios'
        });
      }

      const instance = await this.crmManager.getCRMInstance(companyId, providerName);
      if (!instance) {
        return res.status(404).json({
          success: false,
          message: `CRM ${providerName} não está configurado para esta empresa`
        });
      }

      const result = await instance.sendMessage(chatNumber, message, options || {});

      res.json({
        success: true,
        data: result,
        message: 'Mensagem enviada com sucesso'
      });

    } catch (error) {
      console.error('[CRMController] Error sending message:', error.message);
      res.status(400).json({
        success: false,
        message: 'Erro ao enviar mensagem',
        error: error.message
      });
    }
  }

  /**
   * Adiciona uma nota a um contato
   * POST /api/companies/:companyId/crms/:providerName/add-note
   */
  async addNote(req, res) {
    try {
      const { companyId, providerName } = req.params;
      const { chatNumber, note } = req.body;

      if (!companyId || !providerName) {
        return res.status(400).json({
          success: false,
          message: 'ID da empresa e nome do provedor são obrigatórios'
        });
      }

      if (!chatNumber || !note) {
        return res.status(400).json({
          success: false,
          message: 'Número do chat e texto da nota são obrigatórios'
        });
      }

      const instance = await this.crmManager.getCRMInstance(companyId, providerName);
      if (!instance) {
        return res.status(404).json({
          success: false,
          message: `CRM ${providerName} não está configurado para esta empresa`
        });
      }

      const result = await instance.createNote(chatNumber, note);

      res.json({
        success: true,
        data: result,
        message: 'Nota adicionada com sucesso'
      });

    } catch (error) {
      console.error('[CRMController] Error adding note:', error.message);
      res.status(400).json({
        success: false,
        message: 'Erro ao adicionar nota',
        error: error.message
      });
    }
  }

  /**
   * Dispara uma automação
   * POST /api/companies/:companyId/crms/:providerName/trigger-automation
   */
  async triggerAutomation(req, res) {
    try {
      const { companyId, providerName } = req.params;
      const { chatNumber, automationId } = req.body;

      if (!companyId || !providerName) {
        return res.status(400).json({
          success: false,
          message: 'ID da empresa e nome do provedor são obrigatórios'
        });
      }

      if (!chatNumber || !automationId) {
        return res.status(400).json({
          success: false,
          message: 'Número do chat e ID da automação são obrigatórios'
        });
      }

      const instance = await this.crmManager.getCRMInstance(companyId, providerName);
      if (!instance) {
        return res.status(404).json({
          success: false,
          message: `CRM ${providerName} não está configurado para esta empresa`
        });
      }

      const result = await instance.triggerAutomation(chatNumber, automationId);

      res.json({
        success: true,
        data: result,
        message: 'Automação disparada com sucesso'
      });

    } catch (error) {
      console.error('[CRMController] Error triggering automation:', error.message);
      res.status(400).json({
        success: false,
        message: 'Erro ao disparar automação',
        error: error.message
      });
    }
  }

  /**
   * Processa webhook de CRM
   * POST /api/webhooks/crm/:providerName
   */
  async processWebhook(req, res) {
    try {
      const { providerName } = req.params;
      const webhookData = req.body;

      if (!providerName) {
        return res.status(400).json({
          success: false,
          message: 'Nome do provedor é obrigatório'
        });
      }

      const processedData = await this.crmManager.processWebhook(providerName, webhookData);

      res.json({
        success: true,
        data: processedData,
        message: 'Webhook processado com sucesso'
      });

    } catch (error) {
      console.error('[CRMController] Error processing webhook:', error.message);
      res.status(400).json({
        success: false,
        message: 'Erro ao processar webhook',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas dos CRMs
   * GET /api/companies/:companyId/crms/stats
   */
  async getCRMStats(req, res) {
    try {
      const { companyId } = req.params;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'ID da empresa é obrigatório'
        });
      }

      const registryStats = this.crmManager.registry.getStats();
      
      res.json({
        success: true,
        data: {
          ...registryStats,
          companyId
        },
        message: 'Estatísticas carregadas com sucesso'
      });

    } catch (error) {
      console.error('[CRMController] Error getting CRM stats:', error.message);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas',
        error: error.message
      });
    }
  }
}

module.exports = new CRMController(); 