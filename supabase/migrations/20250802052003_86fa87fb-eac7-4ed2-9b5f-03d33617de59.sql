-- Recriar a view admin_empresa_stats com todos os campos necessários
CREATE OR REPLACE VIEW admin_empresa_stats AS
SELECT 
    e.id,
    e.nome,
    e.email,
    e.plano,
    e.ativa,
    e.created_at,
    COALESCE(COUNT(p.id), 0) as total_usuarios,
    COALESCE(COUNT(CASE WHEN p.ativo = true THEN 1 END), 0) as usuarios_ativos
FROM public.empresas e
LEFT JOIN public.perfis p ON e.id = p.empresa_id
GROUP BY e.id, e.nome, e.email, e.plano, e.ativa, e.created_at
ORDER BY e.created_at DESC;

-- Garantir que apenas super admins possam acessar esta view
CREATE POLICY "admin_empresa_stats_select_super_admin" ON admin_empresa_stats
FOR SELECT USING (public.is_super_admin());