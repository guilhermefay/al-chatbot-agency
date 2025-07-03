/**
 * Classe base abstrata para todos os provedores de CRM
 * Todos os CRMs devem estender esta classe e implementar os métodos obrigatórios
 */
class CRMBase {
  constructor(config) {
    this.config = config;
    this.name = this.constructor.name;
    this.isEnabled = false;
    this.credentials = {};
  }

  /**
   * Obtém as informações básicas do CRM
   * @returns {Object} Informações do provedor
   */
  getProviderInfo() {
    return {
      name: this.name,
      displayName: this.getDisplayName(),
      description: this.getDescription(),
      version: this.getVersion(),
      isEnabled: this.isEnabled,
      requiredCredentials: this.getRequiredCredentials(),
      capabilities: this.getCapabilities(),
      webhookConfig: this.getWebhookConfig()
    };
  }

  /**
   * Métodos obrigatórios que devem ser implementados pelos CRMs
   */

  /**
   * Autentica com o CRM usando as credenciais fornecidas
   * @param {Object} credentials - Credenciais de autenticação
   * @returns {Promise<boolean>} True se autenticação bem-sucedida
   */
  async authenticate(credentials) {
    throw new Error(`Method 'authenticate' must be implemented by ${this.name}`);
  }

  /**
   * Sincroniza um contato com o CRM
   * @param {Object} contact - Dados do contato
   * @returns {Promise<Object>} Resultado da sincronização
   */
  async syncContact(contact) {
    throw new Error(`Method 'syncContact' must be implemented by ${this.name}`);
  }

  /**
   * Cria um novo lead/oportunidade no CRM
   * @param {Object} leadData - Dados do lead
   * @returns {Promise<Object>} Lead criado
   */
  async createLead(leadData) {
    throw new Error(`Method 'createLead' must be implemented by ${this.name}`);
  }

  /**
   * Atualiza um lead existente
   * @param {string} leadId - ID do lead
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<Object>} Lead atualizado
   */
  async updateLead(leadId, data) {
    throw new Error(`Method 'updateLead' must be implemented by ${this.name}`);
  }

  /**
   * Busca um lead por ID
   * @param {string} leadId - ID do lead
   * @returns {Promise<Object>} Dados do lead
   */
  async getLead(leadId) {
    throw new Error(`Method 'getLead' must be implemented by ${this.name}`);
  }

  /**
   * Lista leads com filtros opcionais
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Array>} Lista de leads
   */
  async getLeads(filters = {}) {
    throw new Error(`Method 'getLeads' must be implemented by ${this.name}`);
  }

  /**
   * Adiciona uma nota/anotação a um lead
   * @param {string} leadId - ID do lead
   * @param {string} note - Texto da nota
   * @returns {Promise<Object>} Resultado da operação
   */
  async createNote(leadId, note) {
    throw new Error(`Method 'createNote' must be implemented by ${this.name}`);
  }

  /**
   * Dispara uma automação/workflow
   * @param {string} leadId - ID do lead
   * @param {string} trigger - Trigger da automação
   * @returns {Promise<Object>} Resultado da automação
   */
  async triggerAutomation(leadId, trigger) {
    throw new Error(`Method 'triggerAutomation' must be implemented by ${this.name}`);
  }

  /**
   * Envia uma mensagem através do CRM
   * @param {string} leadId - ID do lead
   * @param {string} message - Mensagem a ser enviada
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} Resultado do envio
   */
  async sendMessage(leadId, message, options = {}) {
    throw new Error(`Method 'sendMessage' must be implemented by ${this.name}`);
  }

  /**
   * Métodos de configuração que devem ser implementados
   */

  /**
   * Retorna o nome de exibição do CRM
   * @returns {string}
   */
  getDisplayName() {
    throw new Error(`Method 'getDisplayName' must be implemented by ${this.name}`);
  }

  /**
   * Retorna a descrição do CRM
   * @returns {string}
   */
  getDescription() {
    throw new Error(`Method 'getDescription' must be implemented by ${this.name}`);
  }

  /**
   * Retorna a versão da integração
   * @returns {string}
   */
  getVersion() {
    return '1.0.0';
  }

  /**
   * Retorna as credenciais obrigatórias
   * @returns {Array} Lista de campos de credenciais
   */
  getRequiredCredentials() {
    throw new Error(`Method 'getRequiredCredentials' must be implemented by ${this.name}`);
  }

  /**
   * Retorna as capacidades do CRM
   * @returns {Array} Lista de capacidades
   */
  getCapabilities() {
    return [
      'contacts', 'leads', 'notes', 'messages', 'automations'
    ];
  }

  /**
   * Retorna a configuração de webhook
   * @returns {Object} Configuração de webhook
   */
  getWebhookConfig() {
    return {
      enabled: false,
      url: null,
      events: []
    };
  }

  /**
   * Métodos auxiliares
   */

  /**
   * Configura as credenciais do CRM
   * @param {Object} credentials - Credenciais
   */
  setCredentials(credentials) {
    this.credentials = { ...this.credentials, ...credentials };
  }

  /**
   * Habilita/desabilita o CRM
   * @param {boolean} enabled - Estado de habilitação
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Valida se as credenciais obrigatórias estão presentes
   * @returns {boolean} True se válidas
   */
  validateCredentials() {
    const required = this.getRequiredCredentials();
    return required.every(field => this.credentials[field.name]);
  }

  /**
   * Formata dados do contato para o padrão do CRM
   * @param {Object} contact - Dados do contato
   * @returns {Object} Dados formatados
   */
  formatContactData(contact) {
    return {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      tags: contact.tags || [],
      customFields: contact.customFields || {},
      source: 'whatsapp',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Trata erros da API do CRM
   * @param {Error} error - Erro original
   * @returns {Error} Erro tratado
   */
  handleAPIError(error) {
    console.error(`[${this.name}] API Error:`, error.message);
    
    return new Error(`${this.name} API Error: ${error.message}`);
  }

  /**
   * Log de ações do CRM
   * @param {string} action - Ação executada
   * @param {Object} data - Dados da ação
   */
  log(action, data = {}) {
    console.log(`[${this.name}] ${action}:`, data);
  }
}

module.exports = CRMBase; 