-- Verificar as mensagens existentes com os campos de leitura
SELECT 
    id,
    sender_id,
    receiver_id,
    message,
    created_at,
    read_at,
    is_read,
    service_request_id
FROM messages 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar se há mensagens sem os campos de leitura
SELECT 
    COUNT(*) as total_messages,
    COUNT(is_read) as messages_with_is_read,
    COUNT(read_at) as messages_with_read_at
FROM messages;

-- Atualizar mensagens antigas que não têm os campos de leitura
UPDATE messages 
SET is_read = false 
WHERE is_read IS NULL;

-- Verificar novamente
SELECT 
    id,
    sender_id,
    receiver_id,
    message,
    created_at,
    read_at,
    is_read,
    service_request_id
FROM messages 
ORDER BY created_at DESC 
LIMIT 5;

-- Habilitar RLS (Row Level Security) na tabela messages se ainda não estiver habilitado
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas mensagens onde são remetente ou destinatário
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Política para permitir que usuários insiram mensagens
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
CREATE POLICY "Users can insert their own messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- Habilitar realtime para a tabela messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
