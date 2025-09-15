-- Adicionar coluna plano na tabela empresas
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS plano text DEFAULT 'gratuito';

-- Atualizar a função get_admin_empresa_stats para incluir a coluna plano
CREATE OR REPLACE FUNCTION public.get_admin_empresa_stats()
 RETURNS TABLE(id uuid, nome text, email text, plano text, ativa boolean, created_at timestamp with time zone, total_usuarios bigint, usuarios_ativos bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;

-- Habilitar realtime para a tabela empresas
ALTER TABLE public.empresas REPLICA IDENTITY FULL;