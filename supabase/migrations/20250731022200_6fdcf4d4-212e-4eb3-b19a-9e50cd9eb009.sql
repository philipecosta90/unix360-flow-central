-- Fix super admin access - always allow regardless of subscription/profile status
CREATE OR REPLACE FUNCTION public.can_user_access_system(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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
$function$