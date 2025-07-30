-- Create a function to check if a user can access the system
CREATE OR REPLACE FUNCTION public.can_user_access_system(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_profile record;
  user_subscription record;
  result jsonb;
BEGIN
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
$$;

-- Create audit function for access control actions
CREATE OR REPLACE FUNCTION public.log_subscription_action(
  p_subscription_id uuid,
  p_action text,
  p_old_status text DEFAULT NULL,
  p_new_status text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;