-- Adicionar colunas de personalização da área do cliente na tabela empresas
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#43B26D';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS cor_secundaria TEXT DEFAULT '#37A05B';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS nome_exibicao TEXT;

-- Criar bucket para logos das empresas
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload por usuários autenticados da própria empresa
CREATE POLICY "Users can upload company logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (SELECT empresa_id::text FROM public.perfis WHERE user_id = auth.uid() LIMIT 1)
);

-- Política para leitura pública (logos são públicos)
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Política para permitir update/delete pelo dono
CREATE POLICY "Users can update their company logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (SELECT empresa_id::text FROM public.perfis WHERE user_id = auth.uid() LIMIT 1)
);

CREATE POLICY "Users can delete their company logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (SELECT empresa_id::text FROM public.perfis WHERE user_id = auth.uid() LIMIT 1)
);

-- Função para buscar dados da empresa pelo envio de anamnese/checkin (usada nas páginas públicas)
CREATE OR REPLACE FUNCTION public.get_empresa_by_envio(p_empresa_id uuid)
RETURNS TABLE(
  nome text,
  nome_exibicao text,
  logo_url text,
  cor_primaria text,
  cor_secundaria text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    e.nome,
    e.nome_exibicao,
    e.logo_url,
    COALESCE(e.cor_primaria, '#43B26D') as cor_primaria,
    COALESCE(e.cor_secundaria, '#37A05B') as cor_secundaria
  FROM empresas e
  WHERE e.id = p_empresa_id
  LIMIT 1;
$$;