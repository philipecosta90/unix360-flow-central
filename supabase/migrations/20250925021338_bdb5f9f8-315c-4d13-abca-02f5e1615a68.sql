-- Adicionar coluna email na tabela perfis
ALTER TABLE public.perfis ADD COLUMN email TEXT;

-- Popular a coluna email com dados da tabela auth.users
UPDATE public.perfis 
SET email = au.email 
FROM auth.users au 
WHERE perfis.user_id = au.id;

-- Apenas desativar perfis duplicados, mantendo o mais recente ativo
WITH perfis_ranked AS (
  SELECT 
    id,
    email,
    ROW_NUMBER() OVER (
      PARTITION BY email 
      ORDER BY 
        CASE WHEN ativo = true THEN 0 ELSE 1 END,
        updated_at DESC,
        created_at DESC
    ) as rn
  FROM public.perfis
  WHERE email IS NOT NULL
)
UPDATE public.perfis 
SET ativo = false
WHERE id IN (
  SELECT id 
  FROM perfis_ranked 
  WHERE rn > 1
);

-- Tornar a coluna email obrigatória
ALTER TABLE public.perfis ALTER COLUMN email SET NOT NULL;

-- Criar índice único apenas para perfis ativos
CREATE UNIQUE INDEX idx_perfis_email_ativo ON public.perfis (email) WHERE ativo = true;

-- Adicionar constraint para formato de email
ALTER TABLE public.perfis ADD CONSTRAINT perfis_email_format_check 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Função para sincronização com auth.users
CREATE OR REPLACE FUNCTION public.sync_perfil_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.perfis 
  SET email = NEW.email, updated_at = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronização automática
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_perfil_email();