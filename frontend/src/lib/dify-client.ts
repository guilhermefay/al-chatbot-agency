/**
 * Cliente para API do Dify Cloud
 * Documentação: https://docs.dify.ai/guides/application-management/api-based-application
 */

interface DifyMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface DifyResponse {
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata?: {
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  created_at: number;
}

interface DifyConversation {
  id: string;
  name: string;
  inputs: Record<string, any>;
  status: string;
  introduction: string;
  created_at: number;
}

export class DifyClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.dify.ai/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Enviar mensagem para o chatbot
   */
  async sendMessage(
    message: string, 
    conversationId?: string,
    user: string = 'user'
  ): Promise<DifyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {},
          query: message,
          response_mode: 'blocking',
          conversation_id: conversationId,
          user: user,
          files: []
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Dify API Error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem para Dify:', error);
      throw error;
    }
  }

  /**
   * Listar conversas do usuário
   */
  async getConversations(
    user: string = 'user',
    limit: number = 20
  ): Promise<DifyConversation[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/conversations?user=${user}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar conversas: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      throw error;
    }
  }

  /**
   * Buscar mensagens de uma conversa
   */
  async getMessages(
    conversationId: string,
    user: string = 'user',
    limit: number = 20
  ): Promise<DifyMessage[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/messages?conversation_id=${conversationId}&user=${user}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar mensagens: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw error;
    }
  }

  /**
   * Testar conexão com a API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.sendMessage('Hello, this is a test message.');
      return !!response.message_id;
    } catch (error) {
      console.error('Erro ao testar conexão Dify:', error);
      return false;
    }
  }

  /**
   * Obter parâmetros da aplicação
   */
  async getAppParams(user: string = 'user'): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/parameters?user=${user}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar parâmetros: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar parâmetros:', error);
      throw error;
    }
  }
}

// Função helper para criar instância do cliente
export function createDifyClient(apiKey: string): DifyClient {
  return new DifyClient(apiKey);
}

// Tipos exportados
export type { DifyMessage, DifyResponse, DifyConversation }; 