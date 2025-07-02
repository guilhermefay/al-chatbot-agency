# 🚀 Evolution API Self-Hosted no Railway

## 🎯 Vantagens do Self-Hosted

✅ **Controle total** da API
✅ **Mais barato** (grátis Railway + $5/mês)
✅ **Sem dependência** de terceiros
✅ **Escalabilidade** automática
✅ **Deploy fácil** com Git

## 📦 Passo 1: Preparar Repositório

### 1.1 Fork da Evolution API
```bash
# Vá para: https://github.com/EvolutionAPI/evolution-api
# Clique em "Fork" para criar sua cópia
```

### 1.2 Ou Clone Direto
```bash
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api
```

## 🚂 Passo 2: Deploy no Railway

### 2.1 Conectar com Railway
1. Acesse: https://railway.app
2. Faça login com GitHub
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha seu fork da **evolution-api**

### 2.2 Configurar Variáveis de Ambiente

No Railway, vá em **Variables** e adicione:

```bash
# Autenticação
AUTHENTICATION_API_KEY=SEU_TOKEN_SUPER_SECRETO_123

# Configurações básicas
NODE_ENV=production
PORT=8080
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# Store (Redis/PostgreSQL) - Railway oferece grátis
DATABASE_ENABLED=true
DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}

# Webhook configuração
WEBHOOK_GLOBAL_URL=https://seu-backend.railway.app/api/webhook/evolution
WEBHOOK_GLOBAL_ENABLED=true

# Configurações de instância
CONFIG_SESSION_PHONE_CLIENT=Evolution
CONFIG_SESSION_PHONE_NAME=Chrome

# Cache Redis (opcional - Railway oferece)
REDIS_ENABLED=true
REDIS_URI=${{Redis.REDIS_URL}}

# Logs
LOG_LEVEL=info
LOG_COLOR=true

# QR Code
QRCODE_LIMIT=10
QRCODE_COLOR=#198754

# WhatsApp configurações
INSTANCE_DELETE_ENABLED=true
DEL_INSTANCE=7
```

### 2.3 Adicionar PostgreSQL e Redis

No Railway:
1. Clique em **"Add Service"**
2. Selecione **"PostgreSQL"** 
3. Clique em **"Add Service"** novamente
4. Selecione **"Redis"**

As URLs serão preenchidas automaticamente!

## 📡 Passo 3: Configurar Backend AL Chatbot

### 3.1 Obter URL da Evolution API

Após deploy no Railway, você terá uma URL como:
```
https://evolution-api-production-xxxx.up.railway.app
```

### 3.2 Configurar Backend (.env)

```bash
# Evolution API Self-Hosted
EVOLUTION_API_URL=https://evolution-api-production-xxxx.up.railway.app
EVOLUTION_API_KEY=SEU_TOKEN_SUPER_SECRETO_123

# Webhook onde Evolution enviará mensagens
WEBHOOK_BASE_URL=https://seu-backend.railway.app
```

## 🔧 Passo 4: Deploy do Backend no Railway

### 4.1 Preparar Backend
```bash
cd al-chatbot-agency/backend

# Criar railway.json
echo '{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}' > railway.json

# Criar Procfile (alternativo)
echo "web: npm start" > Procfile
```

### 4.2 Deploy Backend
1. Vá para Railway
2. **New Project** → **Deploy from GitHub**
3. Selecione repositório `al-chatbot-agency`
4. Configure **Root Directory**: `/backend`
5. Adicione variáveis de ambiente

### 4.3 Variáveis Backend no Railway
```bash
PORT=3001
NODE_ENV=production

# Supabase
SUPABASE_URL=https://zogacwdhspzpqqfmakcf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Evolution API (sua instância)
EVOLUTION_API_URL=https://evolution-api-production-xxxx.up.railway.app
EVOLUTION_API_KEY=SEU_TOKEN_SUPER_SECRETO_123
WEBHOOK_BASE_URL=https://al-chatbot-backend-production-yyyy.up.railway.app

# Dify
DIFY_API_URL=https://api.dify.ai/v1
```

## 🧪 Passo 5: Testar Tudo

### 5.1 Testar Evolution API
```bash
curl -X GET "https://evolution-api-production-xxxx.up.railway.app/instance/list" \
  -H "apikey: SEU_TOKEN_SUPER_SECRETO_123"

# Resposta esperada: {"instances": []}
```

### 5.2 Testar Backend
```bash
curl -X GET "https://al-chatbot-backend-production-yyyy.up.railway.app/health"

# Resposta esperada: {"status": "ok"}
```

### 5.3 Criar Instância WhatsApp
```bash
curl -X POST "https://evolution-api-production-xxxx.up.railway.app/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: SEU_TOKEN_SUPER_SECRETO_123" \
  -d '{
    "instanceName": "empresa-teste-001",
    "integration": "WHATSAPP-BAILEYS",
    "webhook": {
      "url": "https://al-chatbot-backend-production-yyyy.up.railway.app/api/webhook/evolution/empresa-teste-001",
      "events": ["messages.upsert", "connection.update"]
    }
  }'
```

## 💰 Custos Railway (Muito Barato!)

- **Evolution API**: $5/mês (depois do plano grátis)
- **Backend AL Chatbot**: $5/mês  
- **PostgreSQL**: Grátis até 1GB
- **Redis**: Grátis até 100MB
- **Total**: ~$10/mês para TUDO!

Vs. contratar Evolution API: $30-50/mês 💸

## 🔄 Fluxo Completo Atualizado

```
Cliente WhatsApp
    ↓ (envia mensagem)
Evolution API (Railway)
    ↓ (webhook)
AL Chatbot Backend (Railway)
    ↓ (processa com Dify)
Dify Cloud
    ↓ (resposta IA)
AL Chatbot Backend
    ↓ (envia resposta)
Evolution API (Railway)
    ↓ (entrega WhatsApp)
Cliente WhatsApp
```

## 🚨 Troubleshooting

### ❌ Evolution API não inicia
- Verifique `PORT=8080` nas variáveis
- Confirme PostgreSQL conectado

### ❌ Webhook não funciona
- URL webhook deve terminar com `/empresa-teste-001`
- Teste conectividade entre serviços

### ❌ Instância não conecta
- Verifique logs no Railway
- QR Code expira em 10 min

## 📚 Próximos Passos

1. ✅ Deploy Evolution API no Railway
2. ✅ Deploy Backend no Railway  
3. ✅ Configurar webhook entre eles
4. ✅ Criar primeira instância WhatsApp
5. ✅ Testar mensagem completa
6. 🚀 Adicionar empresas no dashboard

---

💡 **Dica**: Use Railway Templates para deploy ainda mais rápido! 