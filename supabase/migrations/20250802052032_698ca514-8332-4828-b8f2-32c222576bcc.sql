-- Remover view se existir
DROP VIEW IF EXISTS admin_empresa_stats;

-- Recriar a view admin_empresa_stats sem RLS (views não suportam RLS)
CREATE VIEW admin_empresa_stats AS
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