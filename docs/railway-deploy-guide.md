# 🚀 Deploy Rápido no Railway - AL Chatbot Agency

## ⚡ Resumo em 5 Minutos

### 1. Evolution API
```bash
# Fork: https://github.com/EvolutionAPI/evolution-api
# Deploy no Railway com essas variáveis:

AUTHENTICATION_API_KEY=meu_token_secreto_123
PORT=8080
NODE_ENV=production
DATABASE_ENABLED=true
DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}
REDIS_ENABLED=true
REDIS_URI=${{Redis.REDIS_URL}}
WEBHOOK_GLOBAL_ENABLED=true
```

### 2. Backend AL Chatbot
```bash
# Deploy este repositório com Root Directory: /backend
# Variáveis no Railway:

PORT=3001
NODE_ENV=production
SUPABASE_URL=https://zogacwdhspzpqqfmakcf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZ2Fjd2Roc3B6cHFxZm1ha2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MDY4ODcsImV4cCI6MjA2Njk4Mjg4N30.wCd1j9w2n2XL-6W2LRgvXIrDYqmSATTciHhTJ0on7gA
EVOLUTION_API_URL=https://evolution-api-production-xxxx.up.railway.app
EVOLUTION_API_KEY=meu_token_secreto_123
WEBHOOK_BASE_URL=https://al-chatbot-backend-production-yyyy.up.railway.app
DIFY_API_URL=https://api.dify.ai/v1
```

## 📋 Checklist Rápido

- [ ] Evolution API rodando no Railway
- [ ] PostgreSQL + Redis adicionados
- [ ] Backend AL Chatbot rodando
- [ ] URLs atualizadas nas variáveis
- [ ] Health checks funcionando
- [ ] Teste criação de instância WhatsApp

## 🧪 Teste Rápido

```bash
# Testar Evolution API
curl https://evolution-api-production-xxxx.up.railway.app/instance/list \
  -H "apikey: meu_token_secreto_123"

# Testar Backend  
curl https://al-chatbot-backend-production-yyyy.up.railway.app/health

# Criar instância teste
curl -X POST https://evolution-api-production-xxxx.up.railway.app/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: meu_token_secreto_123" \
  -d '{"instanceName": "teste-001"}'
```

## 💰 Custo Total

- Evolution API: $5/mês
- Backend: $5/mês  
- PostgreSQL + Redis: Grátis
- **Total: $10/mês** vs. $30-50/mês terceirizado

## ⚠️ Importantes

1. **URLs**: Sempre atualize as URLs após deploy
2. **API Key**: Use token forte para Evolution API
3. **CORS**: Configure domínios corretos para produção
4. **Health Check**: `/health` deve retornar 200

---

🎉 **Pronto para produção!** Economia de 70% vs. terceirizado! 