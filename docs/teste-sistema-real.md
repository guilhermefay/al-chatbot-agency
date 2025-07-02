# 🚀 Teste do Sistema com Dados Reais

## ✅ Sistema Preparado para Testes

O sistema AL Chatbot Agency está agora **100% limpo** e pronto para usar **apenas dados reais**:

- ❌ **Removidos todos os dados mock**
- ✅ **Database zerado e funcional**
- ✅ **Interface para adicionar clientes reais**
- ✅ **Endpoints de teste de conectividade**

---

## 📋 Como Testar

### 1. **Iniciar o Frontend**
```bash
cd al-chatbot-agency/frontend
npm run dev
```
- Acesse: http://localhost:3002
- Login: `guilhermeefay@gmail.com` / `Orygen@2023`

### 2. **Iniciar o Backend**
```bash
cd al-chatbot-agency/backend
npm run dev
```
- Backend rodará em: http://localhost:3001

### 3. **Adicionar Novo Cliente Real**

1. **Vá para Dashboard → Empresas**
2. **Clique em "Nova Empresa"**
3. **Preencha os dados:**
   - Nome da empresa
   - Email
   - Telefone WhatsApp
   - Plano (Basic/Premium)

4. **Configure a API Dify:**
   - Cole sua chave API real do Dify
   - Formato: `app-xxxxxxxxxxxxxxxxx`

5. **Configure WhatsApp (opcional):**
   - Nome da instância Evolution
   - Ex: `cliente-teste-001`

### 4. **Testar Conectividade**

#### Via Frontend:
- Na página de empresas, clique em "Configurar"
- Teste a conexão Dify automaticamente

#### Via API (manual):
```bash
# Testar API Dify
curl -X POST http://localhost:3001/api/test/dify-connection \
  -H "Content-Type: application/json" \
  -d '{"api_key": "SUA_API_KEY_REAL_AQUI"}'

# Testar configuração completa da empresa
curl -X POST http://localhost:3001/api/test/company-setup/COMPANY_ID
```

---

## 🔑 Suas Chaves API Reais

### Dify API:
- **URL:** https://api.dify.ai/v1
- **Sua API Key:** `[Cole aqui sua chave real]`
- **App:** PDC VENDAS (seu app existente)

### Evolution API:
- **Precisa contratar:** Serviço de WhatsApp Business
- **Instâncias:** Uma por cliente
- **Formato:** `cliente-nome-001`

---

## 🧪 Fluxo de Teste Completo

### Teste 1: Adicionar Cliente
1. ✅ Adicionar nova empresa via interface
2. ✅ Verificar se aparece na lista
3. ✅ Conferir dados no Supabase

### Teste 2: Conectar Dify
1. ✅ Adicionar sua API key real
2. ✅ Testar conectividade
3. ✅ Enviar mensagem teste
4. ✅ Verificar resposta do chatbot

### Teste 3: WhatsApp (se tiver Evolution)
1. ✅ Configurar instância
2. ✅ Conectar número
3. ✅ Testar webhook
4. ✅ Enviar/receber mensagens

### Teste 4: Dashboard Real
1. ✅ Ver dados reais nas métricas
2. ✅ Conversas reais aparecendo
3. ✅ Mensagens sendo salvas
4. ✅ Estatísticas atualizando

---

## 🐛 Troubleshooting

### Erro "API key inválida":
- Verifique se copiou a chave completa
- Confirme se o app está ativo no Dify
- Teste direto na API do Dify

### Erro "Empresa não encontrada":
- Verifique se o frontend está conectado ao Supabase
- Confirme se a empresa foi salva corretamente

### WhatsApp não conecta:
- Evolution API é serviço externo (pago)
- Precisa contratar separadamente
- Pode testar só com Dify primeiro

---

## 📊 Status Atual

- **Database:** ✅ Limpo e funcional
- **Frontend:** ✅ Interface para clientes reais
- **Backend:** ✅ APIs de teste funcionando
- **Dify Integration:** ✅ Pronto para suas chaves
- **WhatsApp:** ⏳ Aguardando Evolution API
- **Áudio:** ✅ Via Dify (sem custos extras)

---

## 🎯 Próximos Passos

1. **Teste com sua API Dify real**
2. **Adicione seus primeiros clientes**
3. **Configure Evolution API (opcional)**
4. **Monitore conversas reais**

**O sistema está pronto para produção!** 🚀 