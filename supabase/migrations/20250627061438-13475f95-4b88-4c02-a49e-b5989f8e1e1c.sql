
-- Garantir que RLS está habilitado na tabela perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes da tabela perfis
DROP POLICY IF EXISTS "perfis_select" ON public.perfis;
DROP POLICY IF EXISTS "perfis_insert" ON public.perfis;
DROP POLICY IF EXISTS "perfis_update" ON public.perfis;
DROP POLICY IF EXISTS "perfis_delete" ON public.perfis;
DROP POLICY IF EXISTS "Perfis select proprio usuario" ON public.perfis;
DROP POLICY IF EXISTS "Perfis insert proprio usuario" ON public.perfis;
DROP POLICY IF EXISTS "Perfis update proprio usuario" ON public.perfis;
DROP POLICY IF EXISTS "Perfis delete proprio usuario" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem ver apenas proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem inserir apenas proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem atualizar apenas proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem deletar apenas proprio perfil" ON public.perfis;

-- Criar apenas as 4 políticas solicitadas para authenticated
CREATE POLICY "perfis_select_authenticated" ON public.perfis
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "perfis_insert_authenticated" ON public.perfis
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "perfis_update_authenticated" ON public.perfis
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "perfis_delete_authenticated" ON public.perfis
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
