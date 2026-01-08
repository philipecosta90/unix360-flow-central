-- Adicionar policy de UPDATE para permitir que admins atualizem dados da própria empresa
-- Esta policy estava faltando após hardening de segurança

-- Primeiro, remover policy de UPDATE se existir para evitar conflito
DROP POLICY IF EXISTS "empresa_update_own" ON public.empresas;
DROP POLICY IF EXISTS "Admins can update their own company" ON public.empresas;

-- Criar policy de UPDATE para admins da empresa
CREATE POLICY "empresa_update_own"
ON public.empresas
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND id = get_user_empresa_id() 
  AND is_admin()
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND id = get_user_empresa_id() 
  AND is_admin()
);