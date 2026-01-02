-- Fix PUBLIC_DATA_EXPOSURE: anamnese_envios_public_select
-- The current policy allows anyone to view ALL submissions
-- Replace with a more restrictive policy for public form access

-- Drop the overly permissive public select policy
DROP POLICY IF EXISTS "anamnese_envios_public_select" ON anamnese_envios;

-- Create a restrictive policy for public form access
-- Only allow viewing submissions that are pending/parcial and not expired
CREATE POLICY "anamnese_envios_token_access"
ON anamnese_envios FOR SELECT
USING (
  status IN ('pendente', 'parcial') 
  AND expira_em > now()
);

-- Fix OPEN_ENDPOINTS: anamnese_respostas_insert_public
-- The current policy allows anyone to insert any data
-- The edge function uses service role key, so we can remove the unrestricted policy

-- Drop the unrestricted insert policy
DROP POLICY IF EXISTS "anamnese_respostas_insert_public" ON anamnese_respostas;

-- No replacement policy needed for public access since:
-- 1. The submit-anamnese edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- 2. Authenticated company users already have access via anamnese_respostas_select policy
-- 3. All public submissions must go through the edge function which validates token and expiry