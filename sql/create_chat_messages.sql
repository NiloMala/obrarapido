-- Tabela para armazenar mensagens do chat
CREATE TABLE chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id text NOT NULL,
    sender_id uuid NOT NULL REFERENCES auth.users(id),
    recipient_id uuid NOT NULL REFERENCES auth.users(id),
    content text NOT NULL,
    sender_name text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- RLS (Row Level Security)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias conversas
CREATE POLICY "Users can view their own messages" ON chat_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = recipient_id
    );

-- Política para permitir que usuários insiram mensagens
CREATE POLICY "Users can insert their own messages" ON chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- Permitir realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
