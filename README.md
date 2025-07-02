# AL Chatbot Agency

Sistema multi-tenant para gerenciar chatbots de WhatsApp para múltiplos clientes.

## Stack

- **Backend**: Node.js + Express
- **Frontend**: Next.js 14
- **Banco de Dados**: Supabase (PostgreSQL)
- **IA/RAG**: Dify Cloud
- **WhatsApp**: Evolution API
- **Processamento de Voz**: Whisper (STT) + ElevenLabs (TTS)

## Estrutura

```
al-chatbot-agency/
├── backend/          # API Node.js
├── frontend/         # Painel admin Next.js
└── docs/            # Documentação
```

## Funcionalidades

- ✅ Multi-tenant (múltiplos clientes)
- ✅ Integração WhatsApp via Evolution API
- ✅ IA conversacional via Dify
- ✅ Processamento de áudio
- ✅ Integrações (Google Calendar, CRM)
- ✅ Painel de administração
- ✅ Analytics e relatórios

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```