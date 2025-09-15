-- Criar bucket para documentos de clientes
INSERT INTO storage.buckets (id, name, public) VALUES ('client-documents', 'client-documents', false);

-- Políticas para o bucket client-documents
CREATE POLICY "Users can view documents from their company"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-documents' AND auth.uid() IN (
  SELECT user_id FROM public.perfis 
  WHERE empresa_id = (
    SELECT SPLIT_PART(name, '/', 1)::uuid 
    FROM storage.objects 
    WHERE id = storage.objects.id
  ) 
  AND ativo = true
));

CREATE POLICY "Users can upload documents for their company"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'client-documents' AND auth.uid() IN (
  SELECT user_id FROM public.perfis 
  WHERE empresa_id = (
    SELECT SPLIT_PART(name, '/', 1)::uuid 
    FROM storage.objects 
    WHERE id = storage.objects.id
  ) 
  AND ativo = true
));

CREATE POLICY "Users can delete documents from their company"
ON storage.objects FOR DELETE
USING (bucket_id = 'client-documents' AND auth.uid() IN (
  SELECT user_id FROM public.perfis 
  WHERE empresa_id = (
    SELECT SPLIT_PART(name, '/', 1)::uuid 
    FROM storage.objects 
    WHERE id = storage.objects.id
  ) 
  AND ativo = true
));