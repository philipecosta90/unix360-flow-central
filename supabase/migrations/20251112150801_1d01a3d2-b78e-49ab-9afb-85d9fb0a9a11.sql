-- 1. Atualizar status da Marcela para expired
UPDATE public.perfis 
SET subscription_status = 'expired'
WHERE id = '6f9ae3ea-cb76-4c12-9101-1a22f7232b4b'
AND subscription_status = 'trial'
AND trial_end_date < NOW();

-- 2. Atualizar TODOS os trials expirados (não apenas Marcela)
UPDATE public.perfis 
SET subscription_status = 'expired'
WHERE subscription_status = 'trial'
AND trial_end_date < NOW();

-- 3. Adicionar RLS policies para bloquear operações de usuários com assinatura expirada
-- Tabela: financeiro_tarefas
DROP POLICY IF EXISTS "financeiro_tarefas_insert_active_subscription" ON public.financeiro_tarefas;
CREATE POLICY "financeiro_tarefas_insert_active_subscription"
ON public.financeiro_tarefas
FOR INSERT
WITH CHECK (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);

DROP POLICY IF EXISTS "financeiro_tarefas_update_active_subscription" ON public.financeiro_tarefas;
CREATE POLICY "financeiro_tarefas_update_active_subscription"
ON public.financeiro_tarefas
FOR UPDATE
USING (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);

DROP POLICY IF EXISTS "financeiro_tarefas_delete_active_subscription" ON public.financeiro_tarefas;
CREATE POLICY "financeiro_tarefas_delete_active_subscription"
ON public.financeiro_tarefas
FOR DELETE
USING (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);

-- Tabela: financeiro_lancamentos
DROP POLICY IF EXISTS "financeiro_lancamentos_insert_active_subscription" ON public.financeiro_lancamentos;
CREATE POLICY "financeiro_lancamentos_insert_active_subscription"
ON public.financeiro_lancamentos
FOR INSERT
WITH CHECK (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);

DROP POLICY IF EXISTS "financeiro_lancamentos_update_active_subscription" ON public.financeiro_lancamentos;
CREATE POLICY "financeiro_lancamentos_update_active_subscription"
ON public.financeiro_lancamentos
FOR UPDATE
USING (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);

DROP POLICY IF EXISTS "financeiro_lancamentos_delete_active_subscription" ON public.financeiro_lancamentos;
CREATE POLICY "financeiro_lancamentos_delete_active_subscription"
ON public.financeiro_lancamentos
FOR DELETE
USING (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);

-- Tabela: clientes
DROP POLICY IF EXISTS "clientes_insert_active_subscription" ON public.clientes;
CREATE POLICY "clientes_insert_active_subscription"
ON public.clientes
FOR INSERT
WITH CHECK (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);

DROP POLICY IF EXISTS "clientes_update_active_subscription" ON public.clientes;
CREATE POLICY "clientes_update_active_subscription"
ON public.clientes
FOR UPDATE
USING (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);

DROP POLICY IF EXISTS "clientes_delete_active_subscription" ON public.clientes;
CREATE POLICY "clientes_delete_active_subscription"
ON public.clientes
FOR DELETE
USING (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);

-- Tabela: contratos
DROP POLICY IF EXISTS "contratos_insert_active_subscription" ON public.contratos;
CREATE POLICY "contratos_insert_active_subscription"
ON public.contratos
FOR INSERT
WITH CHECK (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);

DROP POLICY IF EXISTS "contratos_update_active_subscription" ON public.contratos;
CREATE POLICY "contratos_update_active_subscription"
ON public.contratos
FOR UPDATE
USING (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);

DROP POLICY IF EXISTS "contratos_delete_active_subscription" ON public.contratos;
CREATE POLICY "contratos_delete_active_subscription"
ON public.contratos
FOR DELETE
USING (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);

-- Tabela: crm_prospects
DROP POLICY IF EXISTS "crm_prospects_insert_active_subscription" ON public.crm_prospects;
CREATE POLICY "crm_prospects_insert_active_subscription"
ON public.crm_prospects
FOR INSERT
WITH CHECK (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);

DROP POLICY IF EXISTS "crm_prospects_update_active_subscription" ON public.crm_prospects;
CREATE POLICY "crm_prospects_update_active_subscription"
ON public.crm_prospects
FOR UPDATE
USING (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);

DROP POLICY IF EXISTS "crm_prospects_delete_active_subscription" ON public.crm_prospects;
CREATE POLICY "crm_prospects_delete_active_subscription"
ON public.crm_prospects
FOR DELETE
USING (
  empresa_id = get_active_user_empresa_id() 
  AND is_active_user() 
  AND has_active_subscription()
);