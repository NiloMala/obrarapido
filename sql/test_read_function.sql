-- Script para testar a função mark_messages_as_read

-- 1. Verificar se a função existe
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'mark_messages_as_read';

-- 2. Verificar se as colunas foram adicionadas à tabela messages
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('read_at', 'is_read')
ORDER BY column_name;

-- 3. Primeiro, verificar todas as colunas da tabela messages
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- 4. Verificar algumas mensagens existentes (com nome correto da coluna)
SELECT 
    id,
    sender_id,
    receiver_id,
    message, -- Nome correto da coluna
    created_at,
    read_at,
    is_read,
    service_request_id
FROM messages 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Verificar políticas da tabela messages
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'messages' 
AND cmd = 'UPDATE';
