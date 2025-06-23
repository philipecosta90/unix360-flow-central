
-- Adicionar campo para plano na tabela empresas
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS plano text DEFAULT 'gratuito';

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_empresas_plano ON public.empresas(plano);
CREATE INDEX IF NOT EXISTS idx_perfis_nivel_permissao ON public.perfis(nivel_permissao);

-- Criar view para estatísticas administrativas
CREATE OR REPLACE VIEW public.admin_empresa_stats AS
SELECT 
  e.id,
  e.nome,
  e.email,
  e.created_at,
  e.plano,
  e.ativa,
  COUNT(p.id) as total_usuarios,
  COUNT(CASE WHEN p.ativo = true THEN 1 END) as usuarios_ativos
FROM public.empresas e
LEFT JOIN public.perfis p ON e.id = p.empresa_id
GROUP BY e.id, e.nome, e.email, e.created_at, e.plano, e.ativa;

-- Remover políticas existentes se houver (para evitar conflitos)
DROP POLICY IF EXISTS "Admins podem ver todas as empresas" ON public.empresas;
DROP POLICY IF EXISTS "Admins podem atualizar empresas" ON public.empresas;

-- Habilitar RLS na tabela empresas se não estiver habilitado
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Criar política para que admins possam ver todas as empresas
CREATE POLICY "Admins podem ver todas as empresas"
  ON public.empresas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.perfis 
      WHERE user_id = auth.uid() 
      AND nivel_permissao = 'admin'
    )
  );

-- Criar política para que admins possam atualizar empresas
CREATE POLICY "Admins podem atualizar empresas"
  ON public.empresas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.perfis 
      WHERE user_id = auth.uid() 
      AND nivel_permissao = 'admin'
    )
  );
