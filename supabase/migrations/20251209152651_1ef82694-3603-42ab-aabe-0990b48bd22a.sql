-- Remover políticas públicas vulneráveis que permitem acesso não autenticado
DROP POLICY IF EXISTS "Sistema pode atualizar perfis via service role" ON public.perfis;
DROP POLICY IF EXISTS "Sistema pode inserir perfis via service role" ON public.perfis;

-- Corrigir política de super admin (restringir para authenticated apenas)
DROP POLICY IF EXISTS "perfis_select_super_admin_global" ON public.perfis;
CREATE POLICY "perfis_select_super_admin_global" ON public.perfis
FOR SELECT TO authenticated
USING (is_super_admin());