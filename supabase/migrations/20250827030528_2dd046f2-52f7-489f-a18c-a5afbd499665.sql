-- Remove Asaas-related columns from subscriptions table
ALTER TABLE public.subscriptions 
DROP COLUMN IF EXISTS asaas_customer_id,
DROP COLUMN IF EXISTS asaas_subscription_id;

-- Remove Asaas-related columns from invoices table  
ALTER TABLE public.invoices
DROP COLUMN IF EXISTS asaas_payment_id;