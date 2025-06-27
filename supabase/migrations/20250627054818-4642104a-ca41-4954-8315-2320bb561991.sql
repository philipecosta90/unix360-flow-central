
-- Garantir que RLS está habilitado na tabela perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes da tabela perfis
DROP POLICY IF EXISTS "Perfis select proprio usuario" ON public.perfis;
DROP POLICY IF EXISTS "Perfis insert proprio usuario" ON public.perfis;
DROP POLICY IF EXISTS "Perfis update proprio usuario" ON public.perfis;
DROP POLICY IF EXISTS "Perfis delete proprio usuario" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem ver apenas proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem inserir apenas proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem atualizar apenas proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem deletar apenas proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem visualizar perfis da empresa" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem inserir perfis" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Admins podem deletar perfis da empresa" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem ver perfis da mesma empresa" ON public.perfis;

-- Criar apenas as 4 políticas solicitadas com expressões exatas

-- SELECT: user_id = auth.uid()
CREATE POLICY "perfis_select" ON public.perfis
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- INSERT: new.user_id = auth.uid()
CREATE POLICY "perfis_insert" ON public.perfis
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: user_id = auth.uid()
CREATE POLICY "perfis_update" ON public.perfis
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- DELETE: user_id = auth.uid()
CREATE POLICY "perfis_delete" ON public.perfis
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
