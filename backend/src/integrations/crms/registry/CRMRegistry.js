/**
 * Registry para gerenciar todos os provedores de CRM disponíveis
 * Permite descoberta, registro e instanciação dinâmica de CRMs
 */
class CRMRegistry {
  constructor() {
    this.providers = new Map();
    this.activeProviders = new Map();
    this.loadDefaultProviders();
  }

  /**
   * Carrega os provedores padrão do sistema
   */
  loadDefaultProviders() {
    try {
      // Registrar ChatGuru
      const ChatGuruCRM = require('../providers/chatguru/ChatGuruCRM');
      this.register('chatguru', ChatGuruCRM);

      console.log('[CRMRegistry] Default providers loaded successfully');
    } catch (error) {
      console.error('[CRMRegistry] Error loading default providers:', error.message);
    }
  }

  /**
   * Registra um novo provedor de CRM
   * @param {string} name - Nome único do provedor
   * @param {class} ProviderClass - Classe do provedor que estende CRMBase
   */
  register(name, ProviderClass) {
    if (!name || typeof name !== 'string') {
      throw new Error('Provider name must be a non-empty string');
    }

    if (!ProviderClass || typeof ProviderClass !== 'function') {
      throw new Error('Provider must be a valid class');
    }

    // Verificar se a classe estende CRMBase (validação básica)
    const instance = new ProviderClass({});
    if (!instance.authenticate || !instance.syncContact) {
      throw new Error('Provider must implement required CRM methods');
    }

    this.providers.set(name.toLowerCase(), {
      name: name.toLowerCase(),
      displayName: instance.getDisplayName(),
      description: instance.getDescription(),
      version: instance.getVersion(),
      requiredCredentials: instance.getRequiredCredentials(),
      capabilities: instance.getCapabilities(),
      webhookConfig: instance.getWebhookConfig(),
      ProviderClass,
      registeredAt: new Date().toISOString()
    });

    console.log(`[CRMRegistry] Provider "${name}" registered successfully`);
  }

  /**
   * Remove um provedor do registry
   * @param {string} name - Nome do provedor
   */
  unregister(name) {
    const providerName = name.toLowerCase();
    
    if (this.providers.has(providerName)) {
      // Remover instância ativa se existir
      if (this.activeProviders.has(providerName)) {
        this.activeProviders.delete(providerName);
      }
      
      this.providers.delete(providerName);
      console.log(`[CRMRegistry] Provider "${name}" unregistered`);
      return true;
    }
    
    return false;
  }

  /**
   * Lista todos os provedores registrados
   * @returns {Array} Lista de provedores
   */
  listProviders() {
    return Array.from(this.providers.values()).map(provider => ({
      name: provider.name,
      displayName: provider.displayName,
      description: provider.description,
      version: provider.version,
      requiredCredentials: provider.requiredCredentials,
      capabilities: provider.capabilities,
      webhookConfig: provider.webhookConfig,
      isActive: this.activeProviders.has(provider.name),
      registeredAt: provider.registeredAt
    }));
  }

  /**
   * Lista apenas os provedores ativos
   * @returns {Array} Lista de provedores ativos
   */
  listActiveProviders() {
    return Array.from(this.activeProviders.values()).map(instance => ({
      name: instance.name,
      displayName: instance.getDisplayName(),
      description: instance.getDescription(),
      isEnabled: instance.isEnabled,
      capabilities: instance.getCapabilities()
    }));
  }

  /**
   * Obtém informações de um provedor específico
   * @param {string} name - Nome do provedor
   * @returns {Object|null} Informações do provedor
   */
  getProvider(name) {
    const provider = this.providers.get(name.toLowerCase());
    return provider ? {
      ...provider,
      isActive: this.activeProviders.has(provider.name)
    } : null;
  }

  /**
   * Verifica se um provedor está registrado
   * @param {string} name - Nome do provedor
   * @returns {boolean} True se registrado
   */
  hasProvider(name) {
    return this.providers.has(name.toLowerCase());
  }

  /**
   * Cria uma instância de um provedor CRM
   * @param {string} name - Nome do provedor
   * @param {Object} config - Configuração do provedor
   * @returns {Object} Instância do CRM
   */
  createInstance(name, config = {}) {
    const providerName = name.toLowerCase();
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`CRM provider "${name}" not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
    }

    try {
      const instance = new provider.ProviderClass(config);
      console.log(`[CRMRegistry] Created instance of "${name}"`);
      return instance;
    } catch (error) {
      throw new Error(`Failed to create instance of "${name}": ${error.message}`);
    }
  }

  /**
   * Ativa um provedor com credenciais
   * @param {string} name - Nome do provedor
   * @param {Object} credentials - Credenciais do provedor
   * @param {Object} config - Configuração adicional
   * @returns {Promise<Object>} Instância ativa do CRM
   */
  async activateProvider(name, credentials, config = {}) {
    const providerName = name.toLowerCase();
    
    if (!this.hasProvider(providerName)) {
      throw new Error(`CRM provider "${name}" not found`);
    }

    try {
      // Criar nova instância
      const instance = this.createInstance(providerName, config);
      
      // Tentar autenticar
      const authenticated = await instance.authenticate(credentials);
      
      if (!authenticated) {
        throw new Error('Authentication failed with provided credentials');
      }

      // Armazenar instância ativa
      this.activeProviders.set(providerName, instance);
      
      console.log(`[CRMRegistry] Provider "${name}" activated successfully`);
      return instance;
      
    } catch (error) {
      throw new Error(`Failed to activate "${name}": ${error.message}`);
    }
  }

  /**
   * Desativa um provedor
   * @param {string} name - Nome do provedor
   * @returns {boolean} True se desativado com sucesso
   */
  deactivateProvider(name) {
    const providerName = name.toLowerCase();
    
    if (this.activeProviders.has(providerName)) {
      this.activeProviders.delete(providerName);
      console.log(`[CRMRegistry] Provider "${name}" deactivated`);
      return true;
    }
    
    return false;
  }

  /**
   * Obtém uma instância ativa de um provedor
   * @param {string} name - Nome do provedor
   * @returns {Object|null} Instância ativa ou null
   */
  getActiveProvider(name) {
    return this.activeProviders.get(name.toLowerCase()) || null;
  }

  /**
   * Verifica se um provedor está ativo
   * @param {string} name - Nome do provedor
   * @returns {boolean} True se ativo
   */
  isProviderActive(name) {
    return this.activeProviders.has(name.toLowerCase());
  }

  /**
   * Busca provedores por capacidade
   * @param {string} capability - Capacidade desejada
   * @returns {Array} Lista de provedores que suportam a capacidade
   */
  findProvidersByCapability(capability) {
    return this.listProviders().filter(provider => 
      provider.capabilities.includes(capability)
    );
  }

  /**
   * Obtém estatísticas do registry
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      totalProviders: this.providers.size,
      activeProviders: this.activeProviders.size,
      availableCapabilities: this.getAvailableCapabilities(),
      providers: this.listProviders().map(p => ({
        name: p.name,
        displayName: p.displayName,
        isActive: p.isActive,
        capabilities: p.capabilities.length
      }))
    };
  }

  /**
   * Obtém todas as capacidades disponíveis
   * @returns {Array} Lista única de capacidades
   */
  getAvailableCapabilities() {
    const capabilities = new Set();
    
    this.providers.forEach(provider => {
      provider.capabilities.forEach(cap => capabilities.add(cap));
    });
    
    return Array.from(capabilities).sort();
  }

  /**
   * Valida credenciais de um provedor sem ativar
   * @param {string} name - Nome do provedor
   * @param {Object} credentials - Credenciais para validar
   * @returns {Promise<boolean>} True se válidas
   */
  async validateCredentials(name, credentials) {
    const providerName = name.toLowerCase();
    
    if (!this.hasProvider(providerName)) {
      throw new Error(`CRM provider "${name}" not found`);
    }

    try {
      const instance = this.createInstance(providerName);
      return await instance.authenticate(credentials);
    } catch (error) {
      console.error(`[CRMRegistry] Credential validation failed for "${name}":`, error.message);
      return false;
    }
  }

  /**
   * Limpa todas as instâncias ativas
   */
  clearActiveProviders() {
    this.activeProviders.clear();
    console.log('[CRMRegistry] All active providers cleared');
  }

  /**
   * Recarrega o registry
   */
  reload() {
    this.clearActiveProviders();
    this.providers.clear();
    this.loadDefaultProviders();
    console.log('[CRMRegistry] Registry reloaded');
  }
}

// Singleton instance
let registryInstance = null;

/**
 * Obtém a instância singleton do registry
 * @returns {CRMRegistry} Instância do registry
 */
function getRegistry() {
  if (!registryInstance) {
    registryInstance = new CRMRegistry();
  }
  return registryInstance;
}

module.exports = {
  CRMRegistry,
  getRegistry
}; 