# Arquitetura do Sistema

## Visão Geral

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   WhatsApp      │────▶│  Evolution API  │────▶│   Backend API   │
│   (Cliente)     │     │   (Gateway)     │     │   (Node.js)     │
└─────────────────┘     └─────────────────┘     └───────┬─────────┘
                                                         │
                                ┌────────────────────────┼────────────────────────┐
                                │                        │                        │
                        ┌───────▼────────┐      ┌────────▼────────┐      ┌───────▼────────┐
                        │   Dify Cloud   │      │    Supabase     │      │  Integrações   │
                        │   (IA/RAG)     │      │   (Database)    │      │  (Calendar,    │
                        └────────────────┘      └─────────────────┘      │   CRM, etc)    │
                                                                          └────────────────┘
```

## Componentes

### 1. Frontend (Next.js)
- **Painel Admin**: Interface para gerenciar empresas e configurações
- **Dashboard**: Visualização de métricas e conversas
- **Configurador**: Upload de documentos e personalização de chatbots

### 2. Backend API (Node.js)
- **Webhook Handler**: Recebe mensagens do Evolution API
- **Message Service**: Processa e roteia mensagens
- **Dify Service**: Integração com IA
- **Tool Service**: Executa ações de integração

### 3. Evolution API
- **Gateway WhatsApp**: Conexão com WhatsApp Web
- **Multi-sessão**: Uma instância por empresa
- **Webhooks**: Notifica eventos em tempo real

### 4. Dify Cloud
- **AI Agent**: Processamento de linguagem natural
- **RAG**: Busca em documentos do cliente
- **Tools**: Chamadas para integrações externas

### 5. Supabase
- **PostgreSQL**: Banco de dados principal
- **Row Level Security**: Isolamento por tenant
- **Storage**: Armazenamento de documentos e áudios
- **Auth**: Autenticação de usuários

## Fluxo de Mensagem

1. **Recepção**: Cliente envia mensagem no WhatsApp
2. **Gateway**: Evolution API recebe e envia webhook
3. **Processamento**: Backend identifica empresa e contexto
4. **IA**: Dify processa com base nos documentos
5. **Ações**: Se necessário, executa tools (agenda, CRM)
6. **Resposta**: Envia resposta via Evolution API

## Segurança

- **Multi-tenant**: Dados isolados por empresa
- **Autenticação**: JWT + Supabase Auth
- **Criptografia**: Credenciais de integração criptografadas
- **Rate Limiting**: Proteção contra abuso

## Escalabilidade

- **Horizontal**: Backend stateless, pode adicionar instâncias
- **Banco**: Supabase escala automaticamente
- **IA**: Dify Cloud gerencia carga
- **WhatsApp**: Uma instância Evolution por empresa

## Monitoramento

- **Logs**: Winston com níveis configuráveis
- **Métricas**: Dashboard com KPIs em tempo real
- **Alertas**: Notificações para erros críticos
- **Analytics**: Relatórios de uso por empresa