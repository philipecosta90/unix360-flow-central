-- Remove payment-related tables and triggers
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- Remove payment-related functions
DROP FUNCTION IF EXISTS public.has_active_subscription(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_default_subscription() CASCADE;
DROP FUNCTION IF EXISTS public.check_and_update_expired_trials() CASCADE;
DROP FUNCTION IF EXISTS public.auto_check_trial_expiration() CASCADE;
DROP FUNCTION IF EXISTS public.log_subscription_action(uuid, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.can_user_access_system(uuid) CASCADE;

-- Remove payment-related types
DROP TYPE IF EXISTS public.subscription_status CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;

-- Update empresas table to remove subscription-related fields if they exist
ALTER TABLE public.empresas DROP COLUMN IF EXISTS plano CASCADE;