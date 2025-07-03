const { getRegistry } = require('./registry/CRMRegistry');

/**
 * Gerenciador central para operações de CRM
 */
class CRMManager {
  constructor() {
    this.registry = getRegistry();
    this.companyConfigs = new Map();
  }

  getAvailableCRMs() {
    return this.registry.listProviders();
  }

  async configureCRM(companyId, providerName, credentials, config = {}) {
    try {
      if (!this.registry.hasProvider(providerName)) {
        throw new Error(`CRM provider "${providerName}" não encontrado`);
      }

      const isValid = await this.registry.validateCredentials(providerName, credentials);
      if (!isValid) {
        throw new Error('Credenciais inválidas para o CRM');
      }

      await this.registry.activateProvider(providerName, credentials, config);

      return {
        success: true,
        provider: providerName,
        message: `CRM ${providerName} configurado com sucesso`
      };

    } catch (error) {
      console.error('[CRMManager] Error configuring CRM:', error.message);
      throw new Error(`Erro ao configurar CRM: ${error.message}`);
    }
  }

  async getCRMInstance(companyId, providerName) {
    try {
      return this.registry.getActiveProvider(providerName);
    } catch (error) {
      console.error('[CRMManager] Error getting CRM instance:', error.message);
      return null;
    }
  }

  async syncContactToAllCRMs(companyId, contactData) {
    try {
      const activeProviders = this.registry.listActiveProviders();
      const results = [];

      for (const provider of activeProviders) {
        try {
          const instance = this.registry.getActiveProvider(provider.name);
          if (instance) {
            const result = await instance.syncContact(contactData);
            results.push({
              provider: provider.name,
              success: true,
              result
            });
          }
        } catch (error) {
          results.push({
            provider: provider.name,
            success: false,
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      console.error('[CRMManager] Error syncing contact to CRMs:', error.message);
      throw error;
    }
  }

  async processWebhook(providerName, webhookData) {
    try {
      const instance = this.registry.getActiveProvider(providerName);
      if (!instance) {
        throw new Error(`CRM "${providerName}" não está ativo`);
      }

      if (typeof instance.processWebhook !== 'function') {
        throw new Error(`CRM "${providerName}" não suporta processamento de webhooks`);
      }

      return await instance.processWebhook(webhookData);

    } catch (error) {
      console.error('[CRMManager] Error processing webhook:', error.message);
      throw error;
    }
  }
}

let managerInstance = null;

function getManager() {
  if (!managerInstance) {
    managerInstance = new CRMManager();
  }
  return managerInstance;
}

module.exports = {
  CRMManager,
  getManager
}; 