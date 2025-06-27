
-- Primeiro, vamos remover a view existente
DROP VIEW IF EXISTS public.admin_empresa_stats;

-- Recriar a view admin_empresa_stats com filtro de segurança integrado
CREATE VIEW public.admin_empresa_stats AS
SELECT 
  e.id,
  e.nome,
  e.email,
  e.plano,
  e.ativa,
  e.created_at,
  COALESCE(user_stats.total_usuarios, 0) as total_usuarios,
  COALESCE(user_stats.usuarios_ativos, 0) as usuarios_ativos
FROM public.empresas e
LEFT JOIN (
  SELECT 
    empresa_id,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN ativo = true THEN 1 END) as usuarios_ativos
  FROM public.perfis 
  GROUP BY empresa_id
) user_stats ON e.id = user_stats.empresa_id
-- Adicionar filtro de segurança: apenas mostrar dados da empresa do usuário logado
WHERE e.id IN (
  SELECT empresa_id 
  FROM public.perfis 
  WHERE user_id = auth.uid()
)
OR auth.role() = 'service_role';  -- Permitir acesso total para operações administrativas
