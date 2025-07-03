# WhatsApp Business API Integration

Este documento explica como configurar e usar a integração com a WhatsApp Business API oficial para disparos em massa e mensagens interativas.

## 📋 Recursos Implementados

### ✅ Sistema de Chunking Inteligente (Aprimorado)
- **Detecção de Contexto**: Identifica listas, código, citações, ênfase
- **Delays Realistas**: Velocidade variável de 30-50 WPM baseada na estratégia
- **Estratégias Disponíveis**:
  - `natural`: Mais humano, delays variáveis (35±10 WPM)
  - `efficient`: Mais rápido, delays menores (50±5 WPM)  
  - `formal`: Pausas mais longas, profissional (30±5 WPM)
- **Indicadores de Digitação**: Alternância natural entre "digitando" e pausas

### ✅ WhatsApp Business API Oficial
- **Configuração por Empresa**: Múltiplas instâncias simultâneas
- **Mensagens de Texto**: Com chunking inteligente automático
- **Templates**: Mensagens pré-aprovadas para disparos
- **Mídia**: Imagens, documentos, áudio, vídeo
- **Botões Interativos**: Até 3 botões por mensagem
- **Listas Interativas**: Menus organizados por seções
- **Disparo em Massa**: Com rate limiting e controle de progresso
- **Webhooks**: Recebimento de mensagens e status de entrega

## 🚀 Configuração Inicial

### 1. Pré-requisitos
- Conta WhatsApp Business verificada
- App Facebook Developer configurado
- Phone Number ID e Access Token da Meta

### 2. Configurar Instância da Empresa

```bash
POST /api/whatsapp-business/{companyId}/configure
```

```json
{
  "phoneNumberId": "123456789012345",
  "accessToken": "EAAxxxxxxxxxxxxx",
  "businessAccountId": "123456789012345",
  "webhookVerifyToken": "meu_token_secreto",
  "apiUrl": "https://graph.facebook.com"
}
```

### 3. Verificar Status

```bash
GET /api/whatsapp-business/{companyId}/status
```

## 📤 Enviando Mensagens

### Mensagem de Texto Simples

```bash
POST /api/whatsapp-business/{companyId}/send/message
```

```json
{
  "to": "5511999999999",
  "message": "Sua mensagem aqui",
  "enableChunking": true
}
```

### Mensagem com Template

```bash
POST /api/whatsapp-business/{companyId}/send/template
```

```json
{
  "to": "5511999999999",
  "templateName": "hello_world",
  "languageCode": "pt_BR",
  "parameters": ["João", "15/01/2024"]
}
```

### Mensagem com Mídia

```bash
POST /api/whatsapp-business/{companyId}/send/media
```

```json
{
  "to": "5511999999999",
  "mediaType": "image",
  "mediaUrl": "https://example.com/image.jpg",
  "caption": "Legenda da imagem"
}
```

### Mensagem com Botões

```bash
POST /api/whatsapp-business/{companyId}/send/buttons
```

```json
{
  "to": "5511999999999",
  "bodyText": "Escolha uma opção:",
  "buttons": [
    {"id": "opt1", "title": "Opção 1"},
    {"id": "opt2", "title": "Opção 2"},
    {"id": "opt3", "title": "Opção 3"}
  ],
  "header": "Menu Principal",
  "footer": "Powered by AL Studio"
}
```

### Lista Interativa

```bash
POST /api/whatsapp-business/{companyId}/send/list
```

```json
{
  "to": "5511999999999",
  "bodyText": "Escolha um produto:",
  "buttonText": "Ver Produtos",
  "sections": [
    {
      "title": "Categoria A",
      "rows": [
        {
          "id": "prod1",
          "title": "Produto 1",
          "description": "Descrição do produto 1"
        }
      ]
    }
  ]
}
```

## 🚀 Disparo em Massa

```bash
POST /api/whatsapp-business/{companyId}/send/bulk
```

```json
{
  "recipients": [
    {
      "phone": "5511999999999",
      "message": "Mensagem personalizada 1"
    },
    {
      "phone": "5511888888888",
      "message": "Mensagem personalizada 2"
    }
  ],
  "rateLimitPerSecond": 10,
  "delayBetweenMessages": 100
}
```

### Disparo com Template

```json
{
  "recipients": [
    {
      "phone": "5511999999999",
      "variables": ["João", "Produto A"]
    }
  ],
  "templateName": "promocao",
  "languageCode": "pt_BR",
  "rateLimitPerSecond": 15
}
```

## 🔧 Configuração de Chunking Avançada

### Na Configuração da Empresa

```json
{
  "features": {
    "enable_message_chunking": true,
    "message_chunk_size": 280,
    "chunking_strategy": "natural",
    "typing_indicator": true,
    "chunk_delay": null,
    "preserve_formatting": true
  }
}
```

### Estratégias Disponíveis

| Estratégia | WPM Base | Variação | Min Delay | Max Delay | Uso Recomendado |
|------------|----------|----------|-----------|-----------|-----------------|
| `natural` | 35 | ±10 | 1.8s | 10s | Atendimento humanizado |
| `efficient` | 50 | ±5 | 1s | 6s | Marketing, newsletters |
| `formal` | 30 | ±5 | 2.5s | 12s | Suporte técnico, jurídico |

### Configuração Recomendada por Tipo de Negócio

```javascript
// Atendimento ao cliente
const customerServiceConfig = {
  chunking_strategy: 'natural',
  message_chunk_size: 250,
  typing_indicator: true
};

// Marketing
const marketingConfig = {
  chunking_strategy: 'efficient',
  message_chunk_size: 300,
  typing_indicator: false
};

// Suporte técnico
const technicalSupportConfig = {
  chunking_strategy: 'formal',
  message_chunk_size: 400,
  typing_indicator: true
};
```

## 🪝 Webhooks

### Configuração do Webhook

1. Configure a URL do webhook no Facebook Developer Console:
```
https://seu-dominio.com/api/whatsapp-business/{companyId}/webhook
```

2. Use o `webhookVerifyToken` definido na configuração

### Eventos Recebidos

```json
// Mensagem recebida
{
  "type": "message",
  "messageId": "wamid.xxx",
  "from": "5511999999999",
  "contact": {
    "name": "João Silva",
    "wa_id": "5511999999999"
  },
  "message": {
    "type": "text",
    "text": "Mensagem do cliente",
    "timestamp": "1642680000"
  }
}

// Status de entrega
{
  "type": "status",
  "messageId": "wamid.xxx",
  "recipient": "5511999999999",
  "status": "delivered",
  "timestamp": "1642680000"
}
```

## 📊 Monitoramento e Logs

### Logs do Sistema

```bash
# Chunking inteligente
📤 Sent chunk 1/3 (list): Aqui estão os produtos disponíveis...

# Disparo em massa
🚀 Starting bulk send to 100 recipients
📊 Bulk progress: 50/100 (50.0%)
✅ Bulk send completed: 98/100 successful (98.0%)

# WhatsApp Business API
📨 WhatsApp Business webhook processed: message from 5511999999999
```

### Rate Limiting

- **WhatsApp Business API**: Máximo 80 mensagens/segundo
- **Configuração padrão**: 10 mensagens/segundo com 100ms entre mensagens
- **Rate limiting automático**: Pausa de 1s a cada lote processado

## 🔐 Segurança

- **Tokens**: Armazenados de forma segura, não expostos em logs
- **Webhook Verification**: Token de verificação obrigatório
- **Rate Limiting**: Proteção contra spam e abuse
- **Validation**: Validação rigorosa de todos os parâmetros

## 🚨 Limitações da WhatsApp Business API

1. **Templates**: Necessários para iniciar conversas (primeiras 24h)
2. **Rate Limits**: Varia conforme o status da conta (Tier 1-3)
3. **Aprovação**: Templates precisam ser aprovados pelo WhatsApp
4. **Custos**: Cobrança por mensagem enviada
5. **Horários**: Respeitar fusos horários dos destinatários

## 🔄 Migração do Evolution API

Para empresas que já usam Evolution API, o sistema suporta ambas as integrações simultaneamente:

1. Configure WhatsApp Business API mantendo Evolution ativo
2. Teste com alguns contatos primeiro
3. Migre gradualmente os disparos em massa
4. Mantenha Evolution para funcionalidades específicas (grupos, etc)

## 📞 Suporte

Para dúvidas técnicas:
- Documentação oficial: https://developers.facebook.com/docs/whatsapp
- Logs detalhados disponíveis no sistema
- Monitoramento em tempo real dos disparos