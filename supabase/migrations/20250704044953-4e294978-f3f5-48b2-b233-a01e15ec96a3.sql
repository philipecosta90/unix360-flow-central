-- Criar perfil admin para o usuário atual logado
DO $$
DECLARE
    current_user_id uuid;
    current_user_email text;
    default_company_id uuid;
BEGIN
    -- Obter o ID e email do usuário atual
    SELECT auth.uid() INTO current_user_id;
    SELECT auth.email() INTO current_user_email;
    
    -- Verificar se já existe perfil para este usuário
    IF NOT EXISTS (SELECT 1 FROM public.perfis WHERE user_id = current_user_id) THEN
        
        -- Buscar ou criar empresa padrão
        SELECT id INTO default_company_id FROM public.empresas LIMIT 1;
        
        IF default_company_id IS NULL THEN
            INSERT INTO public.empresas (nome, email)
            VALUES ('Empresa Padrão', COALESCE(current_user_email, 'admin@empresa.com'))
            RETURNING id INTO default_company_id;
        END IF;
        
        -- Criar perfil admin
        INSERT INTO public.perfis (user_id, empresa_id, nome, nivel_permissao)
        VALUES (
            current_user_id,
            default_company_id,
            COALESCE(split_part(current_user_email, '@', 1), 'Admin'),
            'admin'
        );
        
        RAISE NOTICE 'Perfil admin criado para usuário: %', current_user_email;
    ELSE
        -- Se perfil existe, garantir que é admin
        UPDATE public.perfis 
        SET nivel_permissao = 'admin'
        WHERE user_id = current_user_id;
        
        RAISE NOTICE 'Perfil atualizado para admin: %', current_user_email;
    END IF;
END $$;