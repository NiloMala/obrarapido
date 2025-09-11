-- Adicionar campos para controle de visualização de mensagens

-- Adicionar campo read_at para marcar quando a mensagem foi lida
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;

-- Adicionar campo is_read para facilitar consultas
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_messages_read_status ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

-- Função para marcar mensagens como lidas
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_service_request_id text,
    p_user_id uuid
)
RETURNS void AS $$
BEGIN
    UPDATE messages 
    SET 
        read_at = timezone('utc'::text, now()),
        is_read = true
    WHERE 
        service_request_id = p_service_request_id 
        AND receiver_id = p_user_id 
        AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política para permitir que usuários marquem suas mensagens como lidas
-- Primeiro, tentar deletar a política se ela já existir
DROP POLICY IF EXISTS "Users can mark their received messages as read" ON messages;

-- Criar a nova política
CREATE POLICY "Users can mark their received messages as read" ON messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('read_at', 'is_read')
ORDER BY column_name;
