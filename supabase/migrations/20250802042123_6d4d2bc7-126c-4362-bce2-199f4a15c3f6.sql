-- Fix Security Definer Views
-- Remove any existing security definer views and replace with secure functions

-- Check and remove admin_empresa_stats view if it exists with security definer
DROP VIEW IF EXISTS public.admin_empresa_stats;

-- Recreate admin_empresa_stats as a regular view (no security definer)
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

-- Remove any other potential security definer views
DROP VIEW IF EXISTS public.security_report;

-- Recreate security_report as a regular view
CREATE VIEW public.security_report AS
SELECT 
    'RLS_CHECK' as check_name,
    'Row Level Security validation' as message,
    public.validate_user_empresa_integrity() as status
UNION ALL
SELECT 
    'PERMISSION_CHECK' as check_name,
    'Permission levels validation' as message,
    public.validate_permission_levels() as status;

-- Add RLS policies for the views
ALTER TABLE public.admin_empresa_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_empresa_stats_super_admin_only" 
ON public.admin_empresa_stats 
FOR SELECT 
USING (public.is_super_admin());

ALTER TABLE public.security_report ENABLE ROW LEVEL SECURITY;
CREATE POLICY "security_report_super_admin_only" 
ON public.security_report 
FOR SELECT 
USING (public.is_super_admin());