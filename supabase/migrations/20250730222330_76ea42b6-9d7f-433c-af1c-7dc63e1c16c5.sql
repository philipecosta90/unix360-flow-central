-- Create a function to check and update expired trials
CREATE OR REPLACE FUNCTION check_and_update_expired_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create a trigger function that checks trial expiration on subscription reads
CREATE OR REPLACE FUNCTION auto_check_trial_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If this is a trial subscription and it's expired, suspend it
  IF NEW.status = 'trial' AND NEW.trial_end_date < now() THEN
    NEW.status = 'suspended';
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-check trial expiration on updates
DROP TRIGGER IF EXISTS auto_check_trial_on_update ON public.subscriptions;
CREATE TRIGGER auto_check_trial_on_update
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION auto_check_trial_expiration();