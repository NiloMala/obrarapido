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
