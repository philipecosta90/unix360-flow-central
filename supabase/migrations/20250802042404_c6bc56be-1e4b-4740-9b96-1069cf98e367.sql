-- Fix Security Definer Views and other security issues
-- Remove views that can't have RLS and replace with secure functions

-- Drop existing views
DROP VIEW IF EXISTS public.admin_empresa_stats CASCADE;
DROP VIEW IF EXISTS public.security_report CASCADE;

-- Create secure functions instead of views with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_admin_empresa_stats()
RETURNS TABLE (
    id uuid,
    nome text,
    email text,
    plano text,
    ativa boolean,
    created_at timestamptz,
    total_usuarios bigint,
    usuarios_ativos bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
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
    WHERE public.is_super_admin() -- Security check
    GROUP BY e.id, e.nome, e.email, e.plano, e.ativa, e.created_at;
$$;

-- Create secure function for security report
CREATE OR REPLACE FUNCTION public.get_security_report()
RETURNS TABLE (
    check_name text,
    message text,
    status boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT 
        'RLS_CHECK'::text as check_name,
        'Row Level Security validation'::text as message,
        public.validate_user_empresa_integrity() as status
    WHERE public.is_super_admin() -- Security check
    UNION ALL
    SELECT 
        'PERMISSION_CHECK'::text as check_name,
        'Permission levels validation'::text as message,
        public.validate_permission_levels() as status
    WHERE public.is_super_admin(); -- Security check
$$;