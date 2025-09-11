-- Corrigir a função mark_messages_as_read para lidar com tipos text

-- Primeiro, remover a função atual
DROP FUNCTION IF EXISTS mark_messages_as_read(text, text);
DROP FUNCTION IF EXISTS mark_messages_as_read(text, uuid);

-- Recriar a função com conversões adequadas
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_service_request_id text,
    p_user_id text
)
RETURNS void AS $$
BEGIN
    UPDATE messages 
    SET 
        read_at = timezone('utc'::text, now()),
        is_read = true
    WHERE 
        service_request_id = p_service_request_id 
        AND receiver_id = p_user_id  -- Mantendo como text se a coluna é text
        AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Testar a função (substitua pelos valores reais)
-- SELECT mark_messages_as_read('9ddc146e-1ac9-416c-98ca-6c3ccbcfb0c9', '65061f3f-958f-4e80-bea4-f07aa904eda9');
