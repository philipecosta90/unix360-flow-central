-- Criar função que verifica se usuário pode editar configurações da empresa
-- Permite admin e operacional, bloqueia apenas visualizacao
CREATE OR REPLACE FUNCTION public.can_edit_empresa()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE user_id = auth.uid() 
    AND nivel_permissao IN ('admin', 'operacional')
    AND ativo = TRUE
  );
$$;

-- Atualizar policy de UPDATE para usar nova função
DROP POLICY IF EXISTS "empresa_update_own" ON public.empresas;

CREATE POLICY "empresa_update_own"
ON public.empresas
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND id = get_user_empresa_id() 
  AND can_edit_empresa()
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND id = get_user_empresa_id() 
  AND can_edit_empresa()
);