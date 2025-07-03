-- Permitir que todos os usuários da empresa possam deletar prospects (não apenas admins)
DROP POLICY IF EXISTS "crm_prospects_delete" ON public.crm_prospects;

CREATE POLICY "crm_prospects_delete" 
ON public.crm_prospects 
FOR DELETE 
USING (empresa_id = get_user_empresa_id());

-- Permitir que todos os usuários da empresa possam deletar transações financeiras (não apenas admins)
DROP POLICY IF EXISTS "financeiro_lancamentos_delete" ON public.financeiro_lancamentos;

CREATE POLICY "financeiro_lancamentos_delete" 
ON public.financeiro_lancamentos 
FOR DELETE 
USING (empresa_id = get_user_empresa_id());