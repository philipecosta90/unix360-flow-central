-- ============================================
-- TRIGGER AUTOMÁTICO DE CRIAÇÃO DE PERFIL
-- ============================================
-- Este trigger garante que ao criar um usuário no auth.users,
-- automaticamente será criada uma empresa e um perfil associado

-- 1. Criar função que será executada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
  v_nome text;
  v_nome_empresa text;
BEGIN
  -- Extrair dados do user_metadata enviados no signup
  v_nome := COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));
  v_nome_empresa := COALESCE(NEW.raw_user_meta_data->>'nomeEmpresa', v_nome || ' - Empresa');
  
  -- Verificar se perfil já existe (evitar duplicação)
  IF EXISTS (SELECT 1 FROM public.perfis WHERE user_id = NEW.id) THEN
    RAISE NOTICE 'Perfil já existe para user_id: %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Log início do processo
  RAISE NOTICE 'Iniciando criação automática de empresa e perfil para: % (ID: %)', NEW.email, NEW.id;
  
  -- 1. Criar empresa
  INSERT INTO public.empresas (nome, email, plano, ativa)
  VALUES (v_nome_empresa, NEW.email, 'gratuito', true)
  RETURNING id INTO v_empresa_id;
  
  RAISE NOTICE 'Empresa criada com ID: %', v_empresa_id;
  
  -- 2. Criar etapas padrão do CRM para a empresa
  PERFORM public.create_default_crm_stages_for_company(v_empresa_id);
  
  RAISE NOTICE 'Etapas CRM criadas para empresa: %', v_empresa_id;
  
  -- 3. Criar perfil com trial de 7 dias
  INSERT INTO public.perfis (
    user_id,
    empresa_id,
    nome,
    email,
    nivel_permissao,
    ativo,
    trial_start_date,
    trial_end_date,
    subscription_status,
    subscription_plan
  ) VALUES (
    NEW.id,
    v_empresa_id,
    v_nome,
    NEW.email,
    'admin', -- Primeiro usuário da empresa é sempre admin
    true,
    NOW(),
    NOW() + INTERVAL '7 days',
    'trial',
    'free'
  );
  
  RAISE NOTICE 'Perfil criado com sucesso para user_id: %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Log do erro
  RAISE WARNING 'Erro ao criar perfil automático para %: % - %', NEW.email, SQLERRM, SQLSTATE;
  
  -- Tentar rollback da empresa se o perfil falhou
  IF v_empresa_id IS NOT NULL THEN
    DELETE FROM public.empresas WHERE id = v_empresa_id;
    RAISE WARNING 'Rollback: Empresa % removida devido ao erro', v_empresa_id;
  END IF;
  
  -- Re-lançar o erro para impedir o signup
  RAISE;
END;
$$;

-- 2. Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Criar trigger que dispara após inserção de novo usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- ============================================
-- CORREÇÃO MANUAL DO USUÁRIO EXISTENTE
-- ============================================
-- Criar empresa e perfil para diamondteamconsultoria@outlook.com

DO $$
DECLARE
  v_user_id uuid;
  v_empresa_id uuid;
BEGIN
  -- Buscar user_id do auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'diamondteamconsultoria@outlook.com'
  LIMIT 1;
  
  -- Se usuário existe e não tem perfil, criar
  IF v_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.perfis WHERE user_id = v_user_id) THEN
    
    -- Criar empresa
    INSERT INTO public.empresas (nome, email, plano, ativa)
    VALUES ('Diamond Team Consultoria', 'diamondteamconsultoria@outlook.com', 'gratuito', true)
    RETURNING id INTO v_empresa_id;
    
    -- Criar etapas CRM
    PERFORM public.create_default_crm_stages_for_company(v_empresa_id);
    
    -- Criar perfil
    INSERT INTO public.perfis (
      user_id,
      empresa_id,
      nome,
      email,
      nivel_permissao,
      ativo,
      trial_start_date,
      trial_end_date,
      subscription_status,
      subscription_plan
    ) VALUES (
      v_user_id,
      v_empresa_id,
      'Diamond Team',
      'diamondteamconsultoria@outlook.com',
      'admin',
      true,
      NOW(),
      NOW() + INTERVAL '7 days',
      'trial',
      'free'
    );
    
    RAISE NOTICE 'Perfil corrigido para diamondteamconsultoria@outlook.com';
  ELSE
    RAISE NOTICE 'Usuário não encontrado ou já possui perfil';
  END IF;
END $$;