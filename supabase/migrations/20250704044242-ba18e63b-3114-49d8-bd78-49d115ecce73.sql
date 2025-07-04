-- Verificar usuário atual e atualizar para admin se necessário
-- Primeiro, verificar qual é o usuário atual logado
DO $$
DECLARE
    current_user_id uuid;
    user_profile_count int;
BEGIN
    -- Obter o ID do usuário atual
    SELECT auth.uid() INTO current_user_id;
    
    -- Verificar se existe um perfil para este usuário
    SELECT COUNT(*) INTO user_profile_count 
    FROM public.perfis 
    WHERE user_id = current_user_id;
    
    -- Se existe perfil, atualizar para admin
    IF user_profile_count > 0 THEN
        UPDATE public.perfis 
        SET nivel_permissao = 'admin'
        WHERE user_id = current_user_id;
        
        RAISE NOTICE 'Usuário atual atualizado para admin';
    ELSE
        -- Se não existe perfil, criar um novo como admin
        INSERT INTO public.perfis (user_id, empresa_id, nome, nivel_permissao)
        SELECT 
            current_user_id,
            (SELECT id FROM public.empresas LIMIT 1),
            'Admin User',
            'admin'
        WHERE current_user_id IS NOT NULL;
        
        RAISE NOTICE 'Novo perfil admin criado para usuário atual';
    END IF;
END $$;