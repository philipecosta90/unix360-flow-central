-- Corrigir função para ter search_path definido
CREATE OR REPLACE FUNCTION public.clear_inactive_subscription_dates()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Limpar datas de assinatura ativa se o status não for 'active'
  IF NEW.subscription_status IS DISTINCT FROM 'active' THEN
    NEW.data_de_assinatura_ativa := NULL;
    NEW.data_de_expiracao_da_assinatura_ativa := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;