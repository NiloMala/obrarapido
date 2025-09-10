-- Atualizar política do Storage para permitir nomes de arquivo com timestamp
-- Primeiro, vamos ver a política atual
SELECT * FROM storage.policies WHERE bucket_id = 'avatars';

-- Deletar política antiga se existir
DELETE FROM storage.policies WHERE bucket_id = 'avatars' AND operation = 'UPDATE';

-- Criar nova política que permite arquivos com formato: {userId}_{timestamp}.{ext}
INSERT INTO storage.policies 
(id, bucket_id, name, definition, check_expression, command, target_role)
VALUES 
('avatars-update-timestamp', 'avatars', 'Allow authenticated users to upload avatars with timestamp', 
 'auth.role() = ''authenticated'' AND (
   (storage.foldername(name))[1] = ''public'' OR 
   name ~ (''^'' || auth.uid()::text || ''(_[0-9]+)?\.(jpg|jpeg|png|gif|webp)$'')
 )', 
 'auth.role() = ''authenticated'' AND (
   (storage.foldername(name))[1] = ''public'' OR 
   name ~ (''^'' || auth.uid()::text || ''(_[0-9]+)?\.(jpg|jpeg|png|gif|webp)$'')
 )', 
 'UPDATE', 'authenticated');

-- Também criar política para INSERT (caso não exista)
INSERT INTO storage.policies 
(id, bucket_id, name, definition, check_expression, command, target_role)
VALUES 
('avatars-insert-timestamp', 'avatars', 'Allow authenticated users to insert avatars with timestamp', 
 'auth.role() = ''authenticated'' AND (
   (storage.foldername(name))[1] = ''public'' OR 
   name ~ (''^'' || auth.uid()::text || ''(_[0-9]+)?\.(jpg|jpeg|png|gif|webp)$'')
 )', 
 'auth.role() = ''authenticated'' AND (
   (storage.foldername(name))[1] = ''public'' OR 
   name ~ (''^'' || auth.uid()::text || ''(_[0-9]+)?\.(jpg|jpeg|png|gif|webp)$'')
 )', 
 'INSERT', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Política para DELETE (para limpeza de arquivos antigos)
INSERT INTO storage.policies 
(id, bucket_id, name, definition, check_expression, command, target_role)
VALUES 
('avatars-delete-timestamp', 'avatars', 'Allow authenticated users to delete their own avatars', 
 'auth.role() = ''authenticated'' AND name ~ (''^'' || auth.uid()::text || ''(_[0-9]+)?\.(jpg|jpeg|png|gif|webp)$'')', 
 'auth.role() = ''authenticated'' AND name ~ (''^'' || auth.uid()::text || ''(_[0-9]+)?\.(jpg|jpeg|png|gif|webp)$'')', 
 'DELETE', 'authenticated')
ON CONFLICT (id) DO NOTHING;
