-- Remove a política restritiva que está bloqueando todos os acessos
-- As políticas existentes já usam get_user_empresa_id() que retorna NULL para usuários anônimos
DROP POLICY IF EXISTS "block_anonymous_access_whatsapp" ON public.whatsapp_instances;