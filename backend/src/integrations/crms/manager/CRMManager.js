const { getRegistry } = require('../registry/CRMRegistry');
const supabase = require('../../../config/supabase');

/**
 * Gerenciador central para operações de CRM
 * Coordena todas as integrações e fornece uma interface unificada
 */
class CRMManager {
  constructor() {
    this.registry = getRegistry();
    this.companyConfigs = new Map(); // Cache de configurações por empresa
  }

  /**
   * Lista todos os CRMs disponíveis
   * @returns {Array} Lista de CRMs disponíveis
   */
  getAvailableCRMs() {
    return this.registry.listProviders();
  }

  /**
   * Lista CRMs ativos para uma empresa
   * @param {string} companyId - ID da empresa
   * @returns {Promise<Array>} Lista de CRMs ativos
   */
  async getActiveCRMs(companyId) {
    try {
      const { data: configs, error } = await supabase
        .from('crm_configurations')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (error) throw error;

      return configs.map(config => ({
        ...config,
        providerInfo: this.registry.getProvider(config.provider_name)
      }));

    } catch (error) {
      console.error('[CRMManager] Error getting active CRMs:', error.message);
      throw new Error(`Erro ao buscar CRMs ativos: ${error.message}`);
    }
  }

  /**
   * Configura um CRM para uma empresa
   * @param {string} companyId - ID da empresa
   * @param {string} providerName - Nome do provedor CRM
   * @param {Object} credentials - Credenciais do CRM
   * @param {Object} config - Configuração adicional
   * @returns {Promise<Object>} Resultado da configuração
   */
  async configureCRM(companyId, providerName, credentials, config = {}) {
    try {
      // Verificar se o provedor existe
      if (!this.registry.hasProvider(providerName)) {
        throw new Error(`CRM provider "${providerName}" não encontrado`);
      }

      // Validar credenciais
      const isValid = await this.registry.validateCredentials(providerName, credentials);
      if (!isValid) {
        throw new Error('Credenciais inválidas para o CRM');
      }

      // Salvar configuração no banco de dados
      const configData = {
        company_id: companyId,
        provider_name: providerName.toLowerCase(),
        credentials: JSON.stringify(credentials),
        configuration: JSON.stringify(config),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Verificar se já existe configuração para este provedor
      const { data: existing } = await supabase
        .from('crm_configurations')
        .select('id')
        .eq('company_id', companyId)
        .eq('provider_name', providerName.toLowerCase())
        .single();

      let result;
      if (existing) {
        // Atualizar configuração existente
        const { data, error } = await supabase
          .from('crm_configurations')
          .update({
            credentials: configData.credentials,
            configuration: configData.configuration,
            is_active: true,
            updated_at: configData.updated_at
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Criar nova configuração
        const { data, error } = await supabase
          .from('crm_configurations')
          .insert(configData)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Ativar o CRM no registry
      await this.registry.activateProvider(providerName, credentials, config);

      // Atualizar cache
      this.companyConfigs.set(`${companyId}-${providerName}`, result);

      console.log(`[CRMManager] CRM "${providerName}" configured for company ${companyId}`);

      return {
        success: true,
        configId: result.id,
        provider: providerName,
        message: `CRM ${providerName} configurado com sucesso`
      };

    } catch (error) {
      console.error('[CRMManager] Error configuring CRM:', error.message);
      throw new Error(`Erro ao configurar CRM: ${error.message}`);
    }
  }

  /**
   * Remove a configuração de um CRM
   * @param {string} companyId - ID da empresa
   * @param {string} providerName - Nome do provedor
   * @returns {Promise<boolean>} True se removido com sucesso
   */
  async removeCRMConfiguration(companyId, providerName) {
    try {
      const { error } = await supabase
        .from('crm_configurations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('company_id', companyId)
        .eq('provider_name', providerName.toLowerCase());

      if (error) throw error;

      // Remover do cache
      this.companyConfigs.delete(`${companyId}-${providerName}`);

      console.log(`[CRMManager] CRM "${providerName}" deactivated for company ${companyId}`);
      return true;

    } catch (error) {
      console.error('[CRMManager] Error removing CRM configuration:', error.message);
      return false;
    }
  }

  /**
   * Obtém uma instância ativa de CRM para uma empresa
   * @param {string} companyId - ID da empresa
   * @param {string} providerName - Nome do provedor
   * @returns {Promise<Object|null>} Instância do CRM ou null
   */
  async getCRMInstance(companyId, providerName) {
    try {
      const cacheKey = `${companyId}-${providerName}`;
      
      // Verificar cache primeiro
      if (this.companyConfigs.has(cacheKey)) {
        const instance = this.registry.getActiveProvider(providerName);
        if (instance) return instance;
      }

      // Buscar configuração no banco
      const { data: config } = await supabase
        .from('crm_configurations')
        .select('*')
        .eq('company_id', companyId)
        .eq('provider_name', providerName.toLowerCase())
        .eq('is_active', true)
        .single();

      if (!config) return null;

      // Ativar o CRM se não estiver ativo
      const credentials = JSON.parse(config.credentials);
      const configuration = JSON.parse(config.configuration || '{}');
      
      const instance = await this.registry.activateProvider(
        providerName, 
        credentials, 
        configuration
      );

      // Atualizar cache
      this.companyConfigs.set(cacheKey, config);

      return instance;

    } catch (error) {
      console.error('[CRMManager] Error getting CRM instance:', error.message);
      return null;
    }
  }

  /**
   * Sincroniza um contato com todos os CRMs ativos
   * @param {string} companyId - ID da empresa
   * @param {Object} contactData - Dados do contato
   * @returns {Promise<Array>} Resultados das sincronizações
   */
  async syncContactToAllCRMs(companyId, contactData) {
    try {
      const activeCRMs = await this.getActiveCRMs(companyId);
      const results = [];

      for (const crmConfig of activeCRMs) {
        try {
          const instance = await this.getCRMInstance(companyId, crmConfig.provider_name);
          if (instance) {
            const result = await instance.syncContact(contactData);
            results.push({
              provider: crmConfig.provider_name,
              success: true,
              result
            });
          }
        } catch (error) {
          results.push({
            provider: crmConfig.provider_name,
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

  /**
   * Envia uma mensagem através de um CRM específico
   * @param {string} companyId - ID da empresa
   * @param {string} providerName - Nome do provedor
   * @param {string} leadId - ID do lead/contato
   * @param {string} message - Mensagem a ser enviada
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resultado do envio
   */
  async sendMessage(companyId, providerName, leadId, message, options = {}) {
    try {
      const instance = await this.getCRMInstance(companyId, providerName);
      if (!instance) {
        throw new Error(`CRM "${providerName}" não está configurado para esta empresa`);
      }

      return await instance.sendMessage(leadId, message, options);

    } catch (error) {
      console.error('[CRMManager] Error sending message:', error.message);
      throw error;
    }
  }

  /**
   * Cria uma nota em um CRM específico
   * @param {string} companyId - ID da empresa
   * @param {string} providerName - Nome do provedor
   * @param {string} leadId - ID do lead/contato
   * @param {string} note - Texto da nota
   * @returns {Promise<Object>} Resultado da criação
   */
  async createNote(companyId, providerName, leadId, note) {
    try {
      const instance = await this.getCRMInstance(companyId, providerName);
      if (!instance) {
        throw new Error(`CRM "${providerName}" não está configurado para esta empresa`);
      }

      return await instance.createNote(leadId, note);

    } catch (error) {
      console.error('[CRMManager] Error creating note:', error.message);
      throw error;
    }
  }

  /**
   * Dispara uma automação em um CRM específico
   * @param {string} companyId - ID da empresa
   * @param {string} providerName - Nome do provedor
   * @param {string} leadId - ID do lead/contato
   * @param {string} trigger - Trigger da automação
   * @returns {Promise<Object>} Resultado da automação
   */
  async triggerAutomation(companyId, providerName, leadId, trigger) {
    try {
      const instance = await this.getCRMInstance(companyId, providerName);
      if (!instance) {
        throw new Error(`CRM "${providerName}" não está configurado para esta empresa`);
      }

      return await instance.triggerAutomation(leadId, trigger);

    } catch (error) {
      console.error('[CRMManager] Error triggering automation:', error.message);
      throw error;
    }
  }

  /**
   * Processa webhook de um CRM
   * @param {string} providerName - Nome do provedor
   * @param {Object} webhookData - Dados do webhook
   * @returns {Promise<Object>} Dados processados
   */
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

  /**
   * Obtém estatísticas de uso dos CRMs
   * @param {string} companyId - ID da empresa
   * @returns {Promise<Object>} Estatísticas
   */
  async getCRMStats(companyId) {
    try {
      const { data: configs } = await supabase
        .from('crm_configurations')
        .select('provider_name, created_at, is_active')
        .eq('company_id', companyId);

      const activeCRMs = configs?.filter(c => c.is_active) || [];
      const registryStats = this.registry.getStats();

      return {
        totalConfigured: configs?.length || 0,
        totalActive: activeCRMs.length,
        availableProviders: registryStats.totalProviders,
        activeCRMs: activeCRMs.map(crm => ({
          provider: crm.provider_name,
          configuredAt: crm.created_at
        })),
        availableCapabilities: registryStats.availableCapabilities
      };

    } catch (error) {
      console.error('[CRMManager] Error getting CRM stats:', error.message);
      throw error;
    }
  }

  /**
   * Testa a conexão com um CRM
   * @param {string} companyId - ID da empresa
   * @param {string} providerName - Nome do provedor
   * @returns {Promise<Object>} Resultado do teste
   */
  async testCRMConnection(companyId, providerName) {
    try {
      const instance = await this.getCRMInstance(companyId, providerName);
      if (!instance) {
        return {
          success: false,
          message: `CRM "${providerName}" não configurado`
        };
      }

      // Testar com uma operação simples (validar credenciais)
      if (instance.validateCredentials && instance.validateCredentials()) {
        return {
          success: true,
          message: `Conexão com ${providerName} está funcionando`,
          provider: instance.getDisplayName(),
          capabilities: instance.getCapabilities()
        };
      } else {
        return {
          success: false,
          message: `Credenciais inválidas para ${providerName}`
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `Erro ao testar conexão: ${error.message}`
      };
    }
  }

  /**
   * Limpa cache de configurações
   */
  clearCache() {
    this.companyConfigs.clear();
    console.log('[CRMManager] Cache cleared');
  }
}

// Singleton instance
let managerInstance = null;

/**
 * Obtém a instância singleton do manager
 * @returns {CRMManager} Instância do manager
 */
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