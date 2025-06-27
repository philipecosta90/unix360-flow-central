
-- Garantir que RLS está habilitado na tabela perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver para evitar conflitos
DROP POLICY IF EXISTS "Usuarios podem visualizar perfis da empresa" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem inserir perfis" ON public.perfis;
DROP POLICY IF EXISTS "Usuarios podem atualizar proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Admins podem deletar perfis da empresa" ON public.perfis;

-- 1. SELECT: Usuários podem visualizar perfis da mesma empresa
CREATE POLICY "Usuarios podem visualizar perfis da empresa"
  ON public.perfis
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id 
      FROM public.perfis 
      WHERE user_id = auth.uid()
    )
  );

-- 2. INSERT: Apenas admins podem inserir novos perfis
CREATE POLICY "Usuarios podem inserir perfis"
  ON public.perfis
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.perfis 
      WHERE user_id = auth.uid() 
      AND nivel_permissao = 'admin'
    )
  );

-- 3. UPDATE: Usuários podem atualizar apenas o próprio perfil
CREATE POLICY "Usuarios podem atualizar proprio perfil"
  ON public.perfis
  FOR UPDATE
  USING (user_id = auth.uid());

-- 4. DELETE: Apenas admins podem deletar perfis da própria empresa
CREATE POLICY "Admins podem deletar perfis da empresa"
  ON public.perfis
  FOR DELETE
  USING (
    empresa_id IN (
      SELECT empresa_id 
      FROM public.perfis 
      WHERE user_id = auth.uid() 
      AND nivel_permissao = 'admin'
    )
  );
