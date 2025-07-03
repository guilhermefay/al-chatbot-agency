const axios = require('axios');
const CRMBase = require('../../base/CRMBase');

/**
 * Integração com a API do ChatGuru
 * Baseado na documentação: https://wiki.chatguru.com.br/documentacao-api/parametros-obrigatorios/
 */
class ChatGuruCRM extends CRMBase {
  constructor(config) {
    super(config);
    this.baseURL = null; // Será definido pelas credenciais (endpoint específico da conta)
    this.apiVersion = 'v1';
  }

  /**
   * Informações do provedor ChatGuru
   */
  getDisplayName() {
    return 'ChatGuru';
  }

  getDescription() {
    return 'Sistema brasileiro de automação de WhatsApp com CRM integrado. Perfeito para gerenciar chats, funis de vendas e campanhas automatizadas.';
  }

  getVersion() {
    return '1.0.0';
  }

  getRequiredCredentials() {
    return [
      {
        name: 'endpoint',
        displayName: 'Endpoint da API',
        type: 'text',
        placeholder: 'https://s10.chatguru.app',
        description: 'Endpoint específico da sua conta (ex: https://s10.chatguru.app)'
      },
      {
        name: 'key',
        displayName: 'Chave da API',
        type: 'password',
        placeholder: 'K8881E8955Y1515',
        description: 'Sua chave da API do ChatGuru'
      },
      {
        name: 'account_id',
        displayName: 'ID da Conta',
        type: 'text',
        placeholder: '8881ID9551515',
        description: 'ID da sua conta no ChatGuru'
      },
      {
        name: 'phone_id',
        displayName: 'ID do WhatsApp',
        type: 'text',
        placeholder: '8881IDW9551515',
        description: 'ID WhatsApp da sua conta'
      }
    ];
  }

  getCapabilities() {
    return [
      'contacts', // Gerenciamento de contatos
      'chats', // Gerenciamento de chats
      'messages', // Envio de mensagens
      'files', // Envio de arquivos
      'notes', // Anotações
      'automations', // Diálogos/Chatbot
      'custom_fields', // Campos personalizados
      'webhooks' // Posts para URL personalizada
    ];
  }

  getWebhookConfig() {
    return {
      enabled: true,
      url: `${process.env.WEBHOOK_BASE_URL}/api/webhooks/crm/chatguru`,
      events: ['chat', 'message', 'image', 'audio'],
      description: 'Configure este URL no ChatGuru para receber webhooks de novas mensagens'
    };
  }

  /**
   * Autentica com a API do ChatGuru
   */
  async authenticate(credentials) {
    try {
      this.setCredentials(credentials);
      this.baseURL = `${credentials.endpoint}/api/${this.apiVersion}`;

      // Teste a autenticação fazendo uma chamada simples
      const response = await this.makeRequest('POST', '', {
        action: 'chat_add_status', // Ação que retorna erro específico se credenciais inválidas
        chat_add_id: 'test_id', // ID falso para testar credenciais
        chat_number: '5511999999999'
      });

      // Se retornar erro de credenciais, falha na autenticação
      if (response.result === 'error' && response.description.includes('inválida')) {
        return false;
      }

      this.setEnabled(true);
      this.log('Authentication successful');
      return true;

    } catch (error) {
      this.log('Authentication failed', { error: error.message });
      return false;
    }
  }

  /**
   * Sincroniza um contato (cadastra um chat)
   */
  async syncContact(contact) {
    try {
      const formattedContact = this.formatContactData(contact);

      const response = await this.makeRequest('POST', '', {
        action: 'chat_add',
        name: formattedContact.name,
        text: `Contato adicionado via AL Chatbot Agency: ${formattedContact.name}`,
        chat_number: formattedContact.phone,
        // user_id: opcional - ID do usuário responsável
        // dialog_id: opcional - ID do diálogo para executar
      });

      if (response.result === 'success') {
        this.log('Contact synced', { contact_id: response.chat_add_id });
        
        return {
          success: true,
          id: response.chat_add_id,
          status: response.chat_add_status,
          data: response
        };
      }

      throw new Error(response.description || 'Erro ao sincronizar contato');

    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Cria um lead (mesmo que syncContact no ChatGuru)
   */
  async createLead(leadData) {
    return this.syncContact(leadData);
  }

  /**
   * Atualiza um lead (atualiza campos personalizados e nome do chat)
   */
  async updateLead(chatNumber, data) {
    try {
      const updates = [];

      // Atualizar nome do chat se fornecido
      if (data.name) {
        const nameResponse = await this.makeRequest('POST', '', {
          action: 'chat_update_name',
          chat_number: chatNumber,
          chat_name: data.name
        });
        updates.push({ type: 'name', success: nameResponse.result === 'success' });
      }

      // Atualizar campos personalizados
      if (data.customFields) {
        const customFieldsData = {
          action: 'chat_update_custom_fields',
          chat_number: chatNumber
        };

        // Adicionar campos personalizados com prefixo field__
        Object.keys(data.customFields).forEach(field => {
          customFieldsData[`field__${field}`] = data.customFields[field];
        });

        const fieldsResponse = await this.makeRequest('POST', '', customFieldsData);
        updates.push({ type: 'customFields', success: fieldsResponse.result === 'success' });
      }

      // Atualizar contexto se fornecido
      if (data.context) {
        const contextData = {
          action: 'chat_update_context',
          chat_number: chatNumber
        };

        // Adicionar contextos com prefixo var__
        Object.keys(data.context).forEach(contextName => {
          contextData[`var__${contextName}`] = data.context[contextName];
        });

        const contextResponse = await this.makeRequest('POST', '', contextData);
        updates.push({ type: 'context', success: contextResponse.result === 'success' });
      }

      this.log('Lead updated', { chatNumber, updates });

      return {
        success: updates.every(update => update.success),
        updates
      };

    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * No ChatGuru não há endpoint específico para buscar leads
   * Esta funcionalidade seria implementada via webhook ou exportação
   */
  async getLead(leadId) {
    throw new Error('ChatGuru API não oferece endpoint para buscar leads específicos. Use webhooks para capturar dados.');
  }

  async getLeads(filters = {}) {
    throw new Error('ChatGuru API não oferece endpoint para listar leads. Use webhooks para capturar dados.');
  }

  /**
   * Adiciona uma anotação a um chat
   */
  async createNote(chatNumber, note) {
    try {
      const response = await this.makeRequest('POST', '', {
        action: 'note_add',
        chat_number: chatNumber,
        note_text: note
      });

      if (response.result === 'success') {
        this.log('Note created', { note_id: response.note_id });
        
        return {
          success: true,
          id: response.note_id,
          data: response
        };
      }

      throw new Error(response.description || 'Erro ao criar anotação');

    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Executa um diálogo/automação
   */
  async triggerAutomation(chatNumber, dialogId) {
    try {
      const response = await this.makeRequest('POST', '', {
        action: 'dialog_execute',
        chat_number: chatNumber,
        dialog_id: dialogId
      });

      if (response.result === 'success') {
        this.log('Automation triggered', { chatNumber, dialogId });
        
        return {
          success: true,
          message: response.dialog_execution_return,
          data: response
        };
      }

      throw new Error(response.description || 'Erro ao executar diálogo');

    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Envia uma mensagem de texto
   */
  async sendMessage(chatNumber, message, options = {}) {
    try {
      const requestData = {
        action: 'message_send',
        chat_number: chatNumber,
        text: message
      };

      // Adicionar data de envio se especificada
      if (options.sendDate) {
        requestData.send_date = options.sendDate; // Formato: YYYY-MM-DD HH:MM
      }

      const response = await this.makeRequest('POST', '', requestData);

      if (response.result === 'success') {
        this.log('Message sent', { 
          message_id: response.message_id, 
          status: response.message_status 
        });
        
        return {
          success: true,
          id: response.message_id,
          status: response.message_status,
          data: response
        };
      }

      throw new Error(response.description || 'Erro ao enviar mensagem');

    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Envia um arquivo
   */
  async sendFile(chatNumber, fileUrl, caption) {
    try {
      const response = await this.makeRequest('POST', '', {
        action: 'message_file_send',
        chat_number: chatNumber,
        file_url: fileUrl,
        caption: caption
      });

      if (response.result === 'success') {
        this.log('File sent', { chatNumber, fileUrl });
        
        return {
          success: true,
          message: response.message_file_send_return,
          data: response
        };
      }

      throw new Error(response.description || 'Erro ao enviar arquivo');

    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Verifica o status de uma mensagem
   */
  async getMessageStatus(messageId, chatNumber) {
    try {
      const response = await this.makeRequest('POST', '', {
        action: 'message_status',
        message_id: messageId,
        chat_number: chatNumber
      });

      if (response.result === 'success') {
        return {
          success: true,
          status: response.message_status,
          data: response
        };
      }

      throw new Error(response.description || 'Erro ao verificar status da mensagem');

    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Verifica o status de adição de chat
   */
  async getChatAddStatus(chatAddId, chatNumber) {
    try {
      const response = await this.makeRequest('POST', '', {
        action: 'chat_add_status',
        chat_add_id: chatAddId,
        chat_number: chatNumber
      });

      if (response.result === 'success') {
        return {
          success: true,
          status: response.chat_add_status,
          description: response.chat_add_status_description,
          data: response
        };
      }

      throw new Error(response.description || 'Erro ao verificar status do chat');

    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Processa webhook do ChatGuru
   */
  async processWebhook(webhookData) {
    try {
      this.log('Processing webhook', { type: webhookData.tipo_mensagem });

      // Estrutura padrão do webhook do ChatGuru
      const processedData = {
        chatId: webhookData.chat_id,
        phoneId: webhookData.phone_id,
        phoneNumber: webhookData.celular,
        contactName: webhookData.nome,
        email: webhookData.email,
        message: webhookData.texto_mensagem,
        messageType: webhookData.tipo_mensagem,
        tags: webhookData.tags || [],
        customFields: webhookData.campos_personalizados || {},
        botContext: webhookData.bot_context || {},
        campaignId: webhookData.campanha_id,
        campaignName: webhookData.campanha_nome,
        source: webhookData.origem,
        responsibleName: webhookData.responsavel_nome,
        responsibleEmail: webhookData.responsavel_email,
        chatLink: webhookData.link_chat,
        chatCreated: webhookData.chat_created,
        timestamp: webhookData.datetime_post,
        attachments: webhookData.anexos || []
      };

      return processedData;

    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * Faz uma requisição para a API do ChatGuru
   */
  async makeRequest(method, endpoint, data = {}) {
    if (!this.baseURL) {
      throw new Error('ChatGuru não está configurado. Execute authenticate() primeiro.');
    }

    const url = `${this.baseURL}${endpoint}`;
    
    // Adicionar credenciais obrigatórias a todas as requisições
    const requestData = {
      ...data,
      key: this.credentials.key,
      account_id: this.credentials.account_id,
      phone_id: this.credentials.phone_id
    };

    try {
      const response = await axios({
        method: method.toLowerCase(),
        url,
        data: new URLSearchParams(requestData), // ChatGuru usa application/x-www-form-urlencoded
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000 // 30 segundos de timeout
      });

      return response.data;

    } catch (error) {
      if (error.response) {
        throw new Error(`ChatGuru API Error: ${error.response.status} - ${error.response.data?.description || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('ChatGuru API Error: Sem resposta do servidor');
      } else {
        throw new Error(`ChatGuru API Error: ${error.message}`);
      }
    }
  }

  /**
   * Formata dados específicos para o ChatGuru
   */
  formatContactData(contact) {
    const formatted = super.formatContactData(contact);
    
    // ChatGuru espera número no formato: Código do País + DDD + Número
    let phone = contact.phone;
    if (phone && !phone.startsWith('55')) {
      // Assumir que é um número brasileiro se não tiver código do país
      phone = phone.replace(/\D/g, ''); // Remove caracteres não numéricos
      if (phone.length === 11) {
        phone = '55' + phone; // Adiciona código do Brasil
      }
    }

    return {
      ...formatted,
      phone
    };
  }
}

module.exports = ChatGuruCRM; 