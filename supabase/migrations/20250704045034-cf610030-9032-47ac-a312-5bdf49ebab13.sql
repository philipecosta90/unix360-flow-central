-- Criar perfil admin para o usuário philipecostawup@gmail.com
DO $$
DECLARE
    target_user_id uuid := 'b0896210-8487-4456-a5f1-056a0685ee7f';
    default_company_id uuid;
BEGIN
    -- Buscar ou criar empresa padrão
    SELECT id INTO default_company_id FROM public.empresas LIMIT 1;
    
    IF default_company_id IS NULL THEN
        INSERT INTO public.empresas (nome, email)
        VALUES ('Empresa Principal', 'philipecostawup@gmail.com')
        RETURNING id INTO default_company_id;
    END IF;
    
    -- Remover perfil existente se houver
    DELETE FROM public.perfis WHERE user_id = target_user_id;
    
    -- Criar novo perfil admin
    INSERT INTO public.perfis (user_id, empresa_id, nome, nivel_permissao)
    VALUES (
        target_user_id,
        default_company_id,
        'Philipe Costa',
        'admin'
    );
    
    RAISE NOTICE 'Perfil admin criado para philipecostawup@gmail.com';
END $$;