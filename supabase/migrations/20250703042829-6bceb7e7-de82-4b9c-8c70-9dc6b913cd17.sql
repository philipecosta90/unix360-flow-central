-- Corrigir políticas RLS para permitir DELETE para usuários operacionais
-- Remover políticas antigas que exigem admin para DELETE
DROP POLICY IF EXISTS "clientes_delete" ON public.clientes;
DROP POLICY IF EXISTS "contratos_delete" ON public.contratos;

-- Criar novas políticas que permitem DELETE para usuários da empresa
CREATE POLICY "clientes_delete_operacional" 
  ON public.clientes 
  FOR DELETE 
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "contratos_delete_operacional" 
  ON public.contratos 
  FOR DELETE 
  USING (empresa_id = get_user_empresa_id());