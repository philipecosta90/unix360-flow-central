-- Criar política RLS para permitir que super admin veja todos os perfis
CREATE POLICY "perfis_select_super_admin_global" ON public.perfis 
FOR SELECT USING (is_super_admin());