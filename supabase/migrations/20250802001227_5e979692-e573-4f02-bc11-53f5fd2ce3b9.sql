-- Fix subscription DELETE policies for admin users

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "subscriptions_delete_super_admin" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_company_admin" ON public.subscriptions;

-- Create DELETE policy for super admin
CREATE POLICY "subscriptions_delete_super_admin" 
ON public.subscriptions 
FOR DELETE 
USING (is_super_admin());

-- Create DELETE policy for company admins (own company only)
CREATE POLICY "subscriptions_delete_company_admin" 
ON public.subscriptions 
FOR DELETE 
USING (empresa_id = get_user_empresa_id() AND is_admin());

-- Update UPDATE policies to ensure super admin can update any subscription
DROP POLICY IF EXISTS "subscriptions_update_super_admin" ON public.subscriptions;

CREATE POLICY "subscriptions_update_super_admin" 
ON public.subscriptions 
FOR UPDATE 
USING (is_super_admin());

-- Ensure invoices table allows deletion when subscription is deleted
-- Check if we need to handle foreign key constraints
DO $$
BEGIN
    -- Add CASCADE delete to invoices if constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%invoices%subscription%' 
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE public.invoices 
        DROP CONSTRAINT IF EXISTS invoices_subscription_id_fkey;
        
        ALTER TABLE public.invoices 
        ADD CONSTRAINT invoices_subscription_id_fkey 
        FOREIGN KEY (subscription_id) 
        REFERENCES public.subscriptions(id) 
        ON DELETE CASCADE;
    END IF;
END $$;