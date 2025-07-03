-- Migration Script: Fix WhatsApp + Conversations Schema
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar campos faltantes na tabela companies
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS dify_api_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS dify_enabled BOOLEAN DEFAULT true;

-- 2. Adicionar campos faltantes na tabela conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS platform VARCHAR(50) DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS last_message TEXT,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dify_conversation_id VARCHAR(255);

-- 3. Criar função para atualizar last_message automaticamente
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET 
        last_message = NEW.content,
        last_message_at = NEW.timestamp,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para atualizar last_message quando nova mensagem é inserida
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversations_company_last_message 
ON conversations(company_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp 
ON messages(conversation_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_company_status 
ON whatsapp_sessions(company_id, status);

-- 6. Atualizar conversas existentes com dados básicos (se existirem)
UPDATE conversations 
SET 
    contact_phone = contact,
    platform = 'whatsapp',
    last_message_at = COALESCE(updated_at, created_at)
WHERE contact_phone IS NULL;

-- 7. Popular last_message das conversas existentes
UPDATE conversations 
SET last_message = (
    SELECT content 
    FROM messages 
    WHERE messages.conversation_id = conversations.id 
    ORDER BY timestamp DESC 
    LIMIT 1
)
WHERE last_message IS NULL;

-- 8. Popular last_message_at das conversas existentes
UPDATE conversations 
SET last_message_at = (
    SELECT timestamp 
    FROM messages 
    WHERE messages.conversation_id = conversations.id 
    ORDER BY timestamp DESC 
    LIMIT 1
)
WHERE last_message_at IS NULL;

-- Verificação final
SELECT 'Migration completed successfully' as status;