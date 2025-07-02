# Instruções de Configuração - AL Chatbot Agency

## 1. Configurar Supabase

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Vá em SQL Editor e execute o script `database-schema.sql`
4. Copie a URL e as chaves do projeto (Settings > API)

## 2. Configurar Evolution API

### Opção A: Docker (Recomendado)
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua_chave_aqui \
  evolution-api/evolution-api:latest
```

### Opção B: Evolution Cloud
1. Acesse [Evolution Cloud](https://evolution-api.com)
2. Crie uma conta e obtenha as credenciais

## 3. Configurar Dify Cloud

1. Crie conta no [Dify](https://cloud.dify.ai)
2. Crie um novo workspace
3. Crie um AI Agent base
4. Copie a API Key

## 4. Configurar Variáveis de Ambiente

### Backend (.env)
```bash
cd backend
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

### Frontend (.env.local)
```bash
cd frontend
cp .env.local.example .env.local
# Edite o arquivo .env.local
```

## 5. Instalar Dependências e Rodar

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 6. Criar Primeiro Cliente

1. Acesse http://localhost:3000
2. Faça login com suas credenciais Supabase
3. Vá em "Empresas" > "Nova Empresa"
4. Configure o WhatsApp via QR Code
5. Faça upload dos documentos de treinamento
6. Configure as integrações desejadas

## 7. Testar

1. Envie mensagem para o número WhatsApp configurado
2. Acompanhe as conversas no painel
3. Verifique os logs no backend

## Problemas Comuns

### WhatsApp não conecta
- Verifique se Evolution API está rodando
- Confirme que o webhook está configurado corretamente

### Dify não responde
- Verifique a API Key
- Confirma que o Agent foi criado e está ativo

### Erro de autenticação
- Verifique as variáveis de ambiente
- Confirme que o Supabase está configurado corretamente