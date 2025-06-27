
-- Garantir que RLS está habilitado na tabela empresas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver para evitar conflitos
DROP POLICY IF EXISTS "Usuarios podem visualizar suas empresas" ON public.empresas;
DROP POLICY IF EXISTS "Usuarios podem editar suas empresas" ON public.empresas;
DROP POLICY IF EXISTS "Usuarios podem deletar suas empresas" ON public.empresas;
DROP POLICY IF EXISTS "Admins podem inserir empresas" ON public.empresas;

-- 1. SELECT: Usuários podem visualizar apenas empresas às quais estão vinculados
CREATE POLICY "Usuarios podem visualizar suas empresas"
  ON public.empresas
  FOR SELECT
  USING (
    id IN (
      SELECT empresa_id 
      FROM public.perfis 
      WHERE user_id = auth.uid()
    )
  );

-- 2. UPDATE: Usuários podem editar apenas empresas às quais estão vinculados
CREATE POLICY "Usuarios podem editar suas empresas"
  ON public.empresas
  FOR UPDATE
  USING (
    id IN (
      SELECT empresa_id 
      FROM public.perfis 
      WHERE user_id = auth.uid()
    )
  );

-- 3. DELETE: Usuários podem deletar apenas empresas às quais estão vinculados
CREATE POLICY "Usuarios podem deletar suas empresas"
  ON public.empresas
  FOR DELETE
  USING (
    id IN (
      SELECT empresa_id 
      FROM public.perfis 
      WHERE user_id = auth.uid()
    )
  );

-- 4. INSERT: Apenas admins podem inserir novas empresas
CREATE POLICY "Admins podem inserir empresas"
  ON public.empresas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.perfis 
      WHERE user_id = auth.uid() 
      AND nivel_permissao = 'admin'
    )
  );
