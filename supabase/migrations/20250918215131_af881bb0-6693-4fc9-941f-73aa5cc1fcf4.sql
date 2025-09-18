-- Create policy to allow super admin to update any company
CREATE POLICY "empresa_update_super_admin" 
ON public.empresas 
FOR UPDATE 
TO authenticated 
USING (is_super_admin());