
-- Garantir que RLS está habilitado na tabela perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes que podem causar recursão
DROP POLICY IF EXISTS "Usuarios podem ver apenas proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem inserir apenas proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem atualizar apenas proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem deletar apenas proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem visualizar perfis da empresa" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem inserir perfis" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Admins podem deletar perfis da empresa" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem ver perfis da mesma empresa" ON public.perfis;

-- 1. SELECT: Usuários podem visualizar apenas o próprio perfil (sem subconsulta)
CREATE POLICY "Perfis select proprio usuario"
  ON public.perfis
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. INSERT: Usuários podem inserir apenas com seu próprio user_id (sem subconsulta)
CREATE POLICY "Perfis insert proprio usuario"
  ON public.perfis
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3. UPDATE: Usuários podem atualizar apenas o próprio perfil (sem subconsulta)
CREATE POLICY "Perfis update proprio usuario"
  ON public.perfis
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. DELETE: Usuários podem deletar apenas o próprio perfil (sem subconsulta)
CREATE POLICY "Perfis delete proprio usuario"
  ON public.perfis
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
