-- Criar bucket para uploads de check-in (público para acesso fácil)
INSERT INTO storage.buckets (id, name, public)
VALUES ('checkin-uploads', 'checkin-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Qualquer um pode fazer upload (página pública)
CREATE POLICY "Allow public uploads for checkin"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'checkin-uploads');

-- Política: Leitura pública
CREATE POLICY "Allow public read for checkin uploads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'checkin-uploads');

-- Política: Usuários autenticados podem deletar (limpeza)
CREATE POLICY "Allow authenticated delete for checkin uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'checkin-uploads');