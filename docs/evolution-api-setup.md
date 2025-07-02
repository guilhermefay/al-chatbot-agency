# 📱 Configuração Evolution API - Guia Completo

## 🎯 O que é Evolution API?

A Evolution API é o gateway que conecta seu sistema AL Chatbot Agency com o WhatsApp. Ela:
- Permite enviar/receber mensagens no WhatsApp
- Gerencia conexões de múltiplas empresas
- Envia webhooks em tempo real para seu backend

## 📦 Passo 1: Contratar Evolution API

### Opção A: Evolution Cloud (Recomendado) ⭐
- **Site**: https://evolution-api.com
- **Preço**: ~R$ 30-50/mês por instância
- **Vantagens**: Sem setup, suporte, escalável
- **O que você recebe**:
  - URL da API (ex: `https://api.evolution.com.br`)
  - API Key (ex: `evo_abc123xyz789`)

### Opção B: Codechat.dev
- **Site**: https://codechat.dev
- **Preço**: ~R$ 25-40/mês
- **Vantagens**: Suporte brasileiro, preço baixo

### Opção C: Hospedar Próprio (Docker)
```bash
# Para desenvolvedores avançados
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=SUA_CHAVE_SECRETA \
  evolution-api/evolution-api:latest
```

## ⚙️ Passo 2: Configurar Backend

### 2.1 Editar arquivo .env

Abra o arquivo `al-chatbot-agency/backend/.env` e adicione:

```bash
# EVOLUTION API - OBRIGATÓRIO
EVOLUTION_API_URL=https://api.evolution.com.br
EVOLUTION_API_KEY=SUA_CHAVE_EVOLUTION_API

# Webhook URL - onde Evolution enviará mensagens
WEBHOOK_BASE_URL=https://seu-dominio.com
```

### 2.2 Para desenvolvimento local:

Se você está testando local, use **ngrok** para expor o backend:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3001 (backend)
ngrok http 3001

# Use a URL gerada no WEBHOOK_BASE_URL
WEBHOOK_BASE_URL=https://abc123.ngrok.io
```

## 🔗 Passo 3: Testar Configuração

### 3.1 Iniciar Backend
```bash
cd al-chatbot-agency/backend
npm run dev
```

### 3.2 Testar conexão Evolution API
```bash
# Teste se Evolution API está funcionando
curl -X GET "https://api.evolution.com.br/instance/list" \
  -H "apikey: SUA_CHAVE_EVOLUTION_API"
```

## 💻 Passo 4: Configurar via Dashboard

1. **Acesse**: http://localhost:3000/dashboard/integrations
2. **Selecione** uma empresa
3. **Configure Evolution Instance**: 
   - Nome: `empresa-001` (único por empresa)
4. **Salve** as configurações

## 📱 Passo 5: Conectar WhatsApp

O sistema criará automaticamente uma instância WhatsApp para cada empresa.

### Via API:
```bash
# Criar instância WhatsApp para empresa
curl -X POST "http://localhost:3001/api/companies/COMPANY_ID/whatsapp" \
  -H "Content-Type: application/json"

# Verificar status e obter QR Code
curl -X GET "http://localhost:3001/api/companies/COMPANY_ID/whatsapp/status"
```

### Via Dashboard:
1. Vá em **Empresas**
2. Clique em **Conectar WhatsApp**
3. Escaneie o QR Code
4. Aguarde conectar

## 🧪 Passo 6: Testar o Sistema

1. **Envie mensagem** para o número WhatsApp conectado
2. **Verifique logs** no terminal do backend:
   ```
   Evolution webhook received: messages.upsert for instance empresa-001
   Processing message with Dify...
   Sending response via Evolution API...
   ```
3. **Confira no dashboard** se a conversa apareceu

## 🚨 Problemas Comuns

### ❌ "No company found for instance"
- **Causa**: Nome da instância não está no banco
- **Solução**: Verifique se criou a empresa e instância corretamente

### ❌ "Evolution API connection failed"
- **Causa**: URL ou API Key incorretos
- **Solução**: Verifique credenciais no .env

### ❌ "Webhook not received"
- **Causa**: WEBHOOK_BASE_URL não está acessível
- **Solução**: Use ngrok para desenvolvimento local

### ❌ "WhatsApp disconnected"
- **Causa**: WhatsApp Web desconectou
- **Solução**: Escaneie QR Code novamente

## 📊 Fluxo Completo

```
Cliente WhatsApp
    ↓ (envia "Olá")
Evolution API
    ↓ (webhook para seu backend)
Seu Backend AL Chatbot
    ↓ (processa com Dify AI)
Dify Cloud ("PDC VENDAS")
    ↓ (retorna resposta IA)
Seu Backend
    ↓ (envia via Evolution API)
Evolution API
    ↓ (entrega no WhatsApp)
Cliente recebe resposta IA
```

## 💰 Custos Estimados

- **Evolution API**: R$ 30-50/mês por empresa
- **Dify Cloud**: Grátis até 200 msg/mês
- **Servidor**: R$ 20-40/mês (VPS básica)
- **Total por empresa**: ~R$ 50-90/mês

## 🔧 Arquivos de Configuração

### Backend (.env)
```bash
PORT=3001
EVOLUTION_API_URL=https://api.evolution.com.br
EVOLUTION_API_KEY=evo_abc123xyz789
WEBHOOK_BASE_URL=https://meudominio.com
SUPABASE_URL=https://zogacwdhspzpqqfmakcf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DIFY_API_URL=https://api.dify.ai/v1
```

### Principais Endpoints Evolution API
- **Listar instâncias**: `GET /instance/list`
- **Criar instância**: `POST /instance/create`
- **Status instância**: `GET /instance/status/{instance}`
- **Enviar mensagem**: `POST /message/sendText/{instance}`
- **Webhook recebido**: `POST /webhook/evolution/{instance}`

---

🎉 **Pronto!** Agora você tem WhatsApp integrado com IA!

Para suporte: verifique logs no backend e use a página `/debug` do frontend. 