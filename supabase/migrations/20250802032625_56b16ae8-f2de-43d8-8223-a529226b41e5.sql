-- Fix security vulnerabilities by setting search_path for all functions
-- This prevents SQL injection attacks through search_path manipulation

-- Function: handle_financeiro_updated_at
CREATE OR REPLACE FUNCTION public.handle_financeiro_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Function: handle_cliente_documentos_updated_at
CREATE OR REPLACE FUNCTION public.handle_cliente_documentos_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Function: handle_tarefas_updated_at
CREATE OR REPLACE FUNCTION public.handle_tarefas_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Function: has_active_subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(empresa_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.subscriptions 
        WHERE empresa_id = empresa_uuid 
        AND (
            status = 'trial' AND trial_end_date > now()
            OR status = 'active'
        )
    );
$function$;

-- Function: create_default_subscription
CREATE OR REPLACE FUNCTION public.create_default_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.subscriptions (empresa_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$function$;

-- Function: check_and_update_expired_trials
CREATE OR REPLACE FUNCTION public.check_and_update_expired_trials()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Update expired trial subscriptions to suspended
  UPDATE public.subscriptions 
  SET status = 'suspended',
      updated_at = now()
  WHERE status = 'trial' 
    AND trial_end_date < now();
    
  -- Log the operation
  INSERT INTO public.audit_logs (
    action,
    table_name,
    record_id,
    created_at
  ) VALUES (
    'AUTO_SUSPEND_EXPIRED_TRIALS',
    'subscriptions',
    null,
    now()
  );
END;
$function$;

-- Function: log_sensitive_access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(p_action text, p_table_name text, p_record_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    empresa_id,
    action,
    table_name,
    record_id
  ) VALUES (
    auth.uid(),
    public.get_user_empresa_id(),
    p_action,
    p_table_name,
    p_record_id
  );
END;
$function$;

-- Function: validate_user_empresa_integrity
CREATE OR REPLACE FUNCTION public.validate_user_empresa_integrity()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.perfis p
    LEFT JOIN public.empresas e ON p.empresa_id = e.id
    WHERE e.id IS NULL
  );
$function$;

-- Function: validate_permission_levels
CREATE OR REPLACE FUNCTION public.validate_permission_levels()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.perfis
    WHERE nivel_permissao NOT IN ('admin', 'operacional', 'visualizacao')
  );
$function$;

-- Function: is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT auth.uid() = 'b0896210-8487-4456-a5f1-056a0685ee7f'::uuid;
$function$;

-- Function: auto_check_trial_expiration
CREATE OR REPLACE FUNCTION public.auto_check_trial_expiration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- If this is a trial subscription and it's expired, suspend it
  IF NEW.status = 'trial' AND NEW.trial_end_date < now() THEN
    NEW.status = 'suspended';
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Function: is_company_admin
CREATE OR REPLACE FUNCTION public.is_company_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE user_id = auth.uid() 
    AND nivel_permissao = 'admin'
    AND ativo = TRUE
  );
$function$;

-- Function: prevent_privilege_escalation
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Se não é super admin e está tentando alterar nível de permissão para admin
  IF OLD.nivel_permissao != NEW.nivel_permissao 
     AND NEW.nivel_permissao = 'admin' 
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas o super administrador pode criar administradores';
  END IF;
  
  -- Se não é admin da empresa ou super admin, não pode alterar permissões
  IF OLD.nivel_permissao != NEW.nivel_permissao 
     AND NOT (public.is_company_admin() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem alterar níveis de permissão';
  END IF;
  
  -- Log da alteração sensível
  PERFORM public.log_sensitive_access(
    'UPDATE_PERMISSION',
    'perfis',
    NEW.id
  );
  
  RETURN NEW;
END;
$function$;

-- Function: get_active_user_empresa_id
CREATE OR REPLACE FUNCTION public.get_active_user_empresa_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT empresa_id FROM public.perfis 
  WHERE user_id = auth.uid() 
  AND ativo = TRUE 
  LIMIT 1;
$function$;

-- Function: is_active_user
CREATE OR REPLACE FUNCTION public.is_active_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE user_id = auth.uid() 
    AND ativo = TRUE
  );
$function$;

-- Function: log_subscription_action
CREATE OR REPLACE FUNCTION public.log_subscription_action(p_subscription_id uuid, p_action text, p_old_status text DEFAULT NULL::text, p_new_status text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    empresa_id,
    action,
    table_name,
    record_id,
    created_at
  ) VALUES (
    auth.uid(),
    (SELECT empresa_id FROM public.subscriptions WHERE id = p_subscription_id),
    CASE 
      WHEN p_old_status IS NOT NULL AND p_new_status IS NOT NULL 
      THEN format('%s: %s -> %s', p_action, p_old_status, p_new_status)
      ELSE p_action
    END,
    'subscriptions',
    p_subscription_id,
    now()
  );
END;
$function$;

-- Function: can_user_access_system
CREATE OR REPLACE FUNCTION public.can_user_access_system(user_uuid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  user_profile record;
  user_subscription record;
  result jsonb;
BEGIN
  -- SUPER ADMIN BYPASS: Always allow super admin access
  IF user_uuid = 'b0896210-8487-4456-a5f1-056a0685ee7f'::uuid THEN
    result = jsonb_build_object(
      'can_access', true,
      'reason', 'SUPER_ADMIN',
      'message', 'Acesso de super administrador autorizado'
    );
    RETURN result;
  END IF;
  
  -- Get user profile
  SELECT * INTO user_profile
  FROM public.perfis 
  WHERE user_id = user_uuid;
  
  -- If profile doesn't exist or is inactive, deny access
  IF user_profile.id IS NULL OR user_profile.ativo = false THEN
    result = jsonb_build_object(
      'can_access', false,
      'reason', 'PROFILE_INACTIVE',
      'message', 'Conta inativa ou não encontrada. Entre em contato com o administrador.'
    );
    RETURN result;
  END IF;
  
  -- Get user subscription
  SELECT * INTO user_subscription
  FROM public.subscriptions 
  WHERE empresa_id = user_profile.empresa_id;
  
  -- If subscription doesn't exist, deny access
  IF user_subscription.id IS NULL THEN
    result = jsonb_build_object(
      'can_access', false,
      'reason', 'NO_SUBSCRIPTION',
      'message', 'Nenhuma assinatura encontrada para esta empresa.'
    );
    RETURN result;
  END IF;
  
  -- Check subscription status
  IF user_subscription.status = 'suspended' THEN
    result = jsonb_build_object(
      'can_access', false,
      'reason', 'SUBSCRIPTION_SUSPENDED',
      'message', 'Sua assinatura está suspensa. Regularize o pagamento para reativar o acesso.'
    );
    RETURN result;
  END IF;
  
  IF user_subscription.status = 'cancelled' THEN
    result = jsonb_build_object(
      'can_access', false,
      'reason', 'SUBSCRIPTION_CANCELLED',
      'message', 'Sua assinatura foi cancelada. Entre em contato com o suporte.'
    );
    RETURN result;
  END IF;
  
  -- Check if trial is expired
  IF user_subscription.status = 'trial' AND user_subscription.trial_end_date < now() THEN
    result = jsonb_build_object(
      'can_access', false,
      'reason', 'TRIAL_EXPIRED',
      'message', 'Seu período de trial expirou. Assine agora para continuar usando o sistema.'
    );
    RETURN result;
  END IF;
  
  -- If all checks pass, allow access
  result = jsonb_build_object(
    'can_access', true,
    'reason', 'AUTHORIZED',
    'message', 'Acesso autorizado',
    'subscription_status', user_subscription.status,
    'days_left_in_trial', 
    CASE 
      WHEN user_subscription.status = 'trial' 
      THEN GREATEST(0, EXTRACT(DAYS FROM (user_subscription.trial_end_date - now())))
      ELSE null
    END
  );
  
  RETURN result;
END;
$function$;

-- Function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE user_id = auth.uid() 
    AND nivel_permissao = 'admin'
    AND ativo = TRUE
  );
$function$;

-- Function: get_user_empresa_id
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid() LIMIT 1;
$function$;

-- Function: handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;