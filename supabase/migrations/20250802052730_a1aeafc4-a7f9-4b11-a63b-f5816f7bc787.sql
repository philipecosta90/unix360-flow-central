-- Remove view Security Definer para resolver problema de segurança
DROP VIEW IF EXISTS public.admin_empresa_stats;

-- Recriar view sem SECURITY DEFINER
CREATE VIEW public.admin_empresa_stats AS
SELECT 
    e.id,
    e.nome,
    e.email,
    e.plano,
    e.ativa,
    e.created_at,
    COUNT(p.id) as total_usuarios,
    COUNT(CASE WHEN p.ativo = true THEN 1 END) as usuarios_ativos
FROM public.empresas e
LEFT JOIN public.perfis p ON e.id = p.empresa_id
GROUP BY e.id, e.nome, e.email, e.plano, e.ativa, e.created_at;

-- Criar RLS policy para a view
ALTER VIEW public.admin_empresa_stats SET (security_invoker = true);

-- Adicionar RLS policy para acesso somente super admin
CREATE POLICY "admin_empresa_stats_super_admin_only" ON public.admin_empresa_stats
FOR SELECT USING (public.is_super_admin());