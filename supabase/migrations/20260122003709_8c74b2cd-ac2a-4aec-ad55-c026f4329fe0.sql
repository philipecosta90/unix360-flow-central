-- Adicionar coluna foto_url na tabela clientes
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Criar bucket para avatares de clientes
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-avatars', 'client-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Permitir leitura pública dos avatares
CREATE POLICY "Avatares são públicos para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'client-avatars');

-- Política: Usuários autenticados podem fazer upload
CREATE POLICY "Usuários autenticados podem fazer upload de avatares"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-avatars');

-- Política: Usuários autenticados podem atualizar seus avatares
CREATE POLICY "Usuários autenticados podem atualizar avatares"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client-avatars');

-- Política: Usuários autenticados podem deletar avatares
CREATE POLICY "Usuários autenticados podem deletar avatares"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-avatars');