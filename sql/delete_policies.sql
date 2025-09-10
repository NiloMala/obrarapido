-- Políticas de DELETE para exclusão de solicitações de serviço

-- 1. Política para permitir que clientes excluam orçamentos de suas solicitações
CREATE POLICY "Users can delete quotes from their requests" ON quotes
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM service_requests 
    WHERE service_requests.id = quotes.service_request_id 
    AND service_requests.client_id = auth.uid()
  )
);

-- 2. Política para permitir que clientes excluam suas próprias solicitações  
CREATE POLICY "Users can delete own service requests" ON service_requests
FOR DELETE USING (client_id = auth.uid());

-- 3. Verificar se as políticas foram criadas corretamente
SELECT 'QUOTES DELETE POLICIES:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'quotes' AND cmd = 'DELETE';

SELECT 'SERVICE_REQUESTS DELETE POLICIES:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'service_requests' AND cmd = 'DELETE';
