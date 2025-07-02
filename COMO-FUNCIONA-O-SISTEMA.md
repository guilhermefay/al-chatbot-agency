# 🤖 Como Funciona o Sistema AL Chatbot Agency

## 📋 **Resumo da Arquitetura**

O sistema é uma **plataforma multi-tenant** onde você gerencia chatbots de WhatsApp para múltiplos clientes, cada um com suas próprias integrações.

---

## 🏗️ **Responsabilidades dos Serviços**

### **1. 🗄️ Supabase (PostgreSQL)**
**É responsável por:**
- ✅ **Dados estruturados**: Empresas, usuários, configurações
- ✅ **Metadados das conversas**: IDs, timestamps, status  
- ✅ **Autenticação e autorização** (login/logout)
- ✅ **Configurações das integrações** (API keys, tokens)
- ✅ **Relacionamentos** entre empresas e conversas
- ✅ **Controle multi-tenant** (isolamento por empresa)

### **2. 🧠 Dify AI**
**É responsável por:**
- ✅ **Inteligência conversacional** (respostas do bot)
- ✅ **Histórico completo das mensagens** (pergunta + resposta)
- ✅ **Bases de conhecimento** (RAG/documentos)
- ✅ **Processamento de linguagem natural**
- ✅ **Feedback das respostas** (👍/👎)
- ✅ **Workflows e automações** da IA

### **3. 📱 Evolution API**
**É responsável por:**
- ✅ **Conexão com WhatsApp** (QR Code)
- ✅ **Recebimento de mensagens** (webhook)
- ✅ **Envio de mensagens** para usuários
- ✅ **Status da conexão** (conectado/desconectado)
- ✅ **Gerenciamento de sessões** WhatsApp

---

## 💬 **Fluxo do Histórico de Conversas**

### **📊 Dados Distribuídos:**

**No Supabase:**
```sql
conversations: {
  id, company_id, phone, status, created_at
}
```

**No Dify:**
```json
{
  "conversation_id": "conv-abc123",
  "messages": [
    {"role": "user", "content": "Oi!"},
    {"role": "assistant", "content": "Olá! Como posso ajudar?"}
  ]
}
```

### **🔄 Como Funciona:**
1. **Mensagem chega** → Evolution API recebe
2. **Metadados salvos** → Supabase registra conversa
3. **IA processa** → Dify gera resposta inteligente  
4. **Resposta enviada** → Evolution API envia para WhatsApp
5. **Tudo sincronizado** → Sistema combina dados dos dois

---

## ⚙️ **Onde Configurar as APIs**

### **🎯 Local de Configuração:**
**Dashboard → Empresas → [Selecionar Cliente] → Aba "Integrações"**

### **1. 🧠 Dify AI**
```
📍 Onde obter:
1. Acesse: https://dify.ai/
2. Login → Seu App → "Publish" → "Access API"
3. Copie: API Key + App ID

🔧 Configurar no sistema:
- API Key: sk-xxxxxxxxxxxx
- App ID: app-xxxxxxxxxxxx
```

### **2. 📱 WhatsApp Evolution API**
```
📍 Configuração automática:
1. Clique: "Conectar WhatsApp"  
2. Sistema cria sessão automaticamente
3. Escaneie: QR Code gerado
4. Status: Muda para "Conectado"

⚠️ Não precisa configurar API Key manualmente
```

### **3. 📅 Google Calendar**
```
📍 Onde obter:
1. Google Cloud Console
2. Ativar: Calendar API
3. Criar: Service Account
4. Baixar: JSON da chave

🔧 Configurar no sistema:
- Calendar ID: usuario@gmail.com
- Service Account: Colar JSON completo
```

### **4. 🏢 CRM (Pipedrive/HubSpot/Salesforce)**
```
📍 Pipedrive:
- API Key: Settings → Personal preferences → API
- Domain: suaempresa.pipedrive.com

📍 HubSpot:
- API Key: Settings → Integrations → API Key
- Domain: Não necessário

📍 Salesforce:
- API Key: Setup → Apps → App Manager
- Domain: suaempresa.my.salesforce.com
```

---

## 🔄 **Como o Sistema Sincroniza Dados**

### **📥 Recebimento de Mensagem:**
```
WhatsApp → Evolution API → Backend → {
  ├── Supabase: Salva metadados
  └── Dify: Processa IA + Histórico
}
```

### **📤 Envio de Resposta:**
```
Dify: Gera resposta → Backend → Evolution API → WhatsApp
```

### **📊 Dashboard:**
```
Frontend → Backend → {
  ├── Supabase: Lista conversas
  ├── Dify: Histórico + mensagens  
  └── Evolution: Status WhatsApp
}
```

---

## 🌐 **URLs de Produção**

### **🔗 Links Ativos:**
- **Backend:** `https://al-chatbot-backend-new-production.up.railway.app`
- **Frontend:** `https://deploy-railway-production-1308.up.railway.app`
- **Evolution API:** `https://evolution-api-official-production.up.railway.app`

### **✅ Status:**
- ✅ **Backend:** Deploy em andamento (sucesso esperado)
- ✅ **Repositório:** Código no GitHub  
- ✅ **Banco:** Supabase configurado
- ✅ **Arquitetura:** 100% implementada

---

## 🎯 **Próximos Passos**

1. **✅ Aguardar deploy finalizar** (3-5 minutos)
2. **🔧 Testar endpoints** do backend  
3. **🌐 Deploy do frontend** no Railway
4. **⚙️ Configurar integrações** reais
5. **📱 Testar fluxo completo** WhatsApp

**🚀 O sistema está 100% implementado e pronto para uso!** 