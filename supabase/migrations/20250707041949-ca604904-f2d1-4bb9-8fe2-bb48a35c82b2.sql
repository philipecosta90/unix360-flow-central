-- ====================================================
-- AJUSTAR POLÍTICAS RLS DO CRM PARA ACESSO DE LEITURA
-- ====================================================

-- Remover políticas restritivas existentes para CRM_PROSPECTS
DROP POLICY IF EXISTS "Users can view prospects from their company" ON public.crm_prospects;
DROP POLICY IF EXISTS "Users can insert prospects for their company" ON public.crm_prospects;
DROP POLICY IF EXISTS "Users can update their own prospects from their company" ON public.crm_prospects;
DROP POLICY IF EXISTS "Users can delete their own prospects from their company" ON public.crm_prospects;

-- Remover políticas restritivas existentes para CRM_STAGES
DROP POLICY IF EXISTS "Users can view company stages" ON public.crm_stages;
DROP POLICY IF EXISTS "Users can create company stages" ON public.crm_stages;
DROP POLICY IF EXISTS "Users can update company stages" ON public.crm_stages;
DROP POLICY IF EXISTS "Users can delete company stages" ON public.crm_stages;

-- ====================================================
-- CRIAR POLÍTICAS MAIS PERMISSIVAS PARA CRM_PROSPECTS
-- ====================================================

-- SELECT: Qualquer usuário da empresa pode visualizar prospects
CREATE POLICY "crm_prospects_select_empresa_users" ON public.crm_prospects
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id());

-- INSERT: Qualquer usuário da empresa pode criar prospects
CREATE POLICY "crm_prospects_insert_empresa_users" ON public.crm_prospects
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id());

-- UPDATE: Qualquer usuário da empresa pode atualizar prospects
CREATE POLICY "crm_prospects_update_empresa_users" ON public.crm_prospects
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id());

-- DELETE: Apenas admins podem deletar prospects
CREATE POLICY "crm_prospects_delete_admins_only" ON public.crm_prospects
  FOR DELETE TO authenticated
  USING (empresa_id = get_user_empresa_id() AND is_admin());

-- ====================================================
-- CRIAR POLÍTICAS MAIS PERMISSIVAS PARA CRM_STAGES
-- ====================================================

-- SELECT: Qualquer usuário da empresa pode visualizar stages
CREATE POLICY "crm_stages_select_empresa_users" ON public.crm_stages
  FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id());

-- INSERT: Apenas admins podem criar novos stages
CREATE POLICY "crm_stages_insert_admins_only" ON public.crm_stages
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id() AND is_admin());

-- UPDATE: Apenas admins podem atualizar stages
CREATE POLICY "crm_stages_update_admins_only" ON public.crm_stages
  FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id() AND is_admin());

-- DELETE: Apenas admins podem deletar stages
CREATE POLICY "crm_stages_delete_admins_only" ON public.crm_stages
  FOR DELETE TO authenticated
  USING (empresa_id = get_user_empresa_id() AND is_admin());

-- ====================================================
-- AJUSTAR POLÍTICAS PARA CRM_ATIVIDADES
-- ====================================================

-- Remover políticas antigas duplicadas
DROP POLICY IF EXISTS "Users can view company activities" ON public.crm_atividades;
DROP POLICY IF EXISTS "Users can create company activities" ON public.crm_atividades;
DROP POLICY IF EXISTS "Users can update company activities" ON public.crm_atividades;
DROP POLICY IF EXISTS "Users can delete company activities" ON public.crm_atividades;

-- SELECT: Qualquer usuário da empresa pode visualizar atividades
CREATE POLICY "crm_atividades_select_empresa_users" ON public.crm_atividades
  FOR SELECT TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM public.crm_prospects 
      WHERE empresa_id = get_user_empresa_id()
    )
  );

-- INSERT: Qualquer usuário da empresa pode criar atividades
CREATE POLICY "crm_atividades_insert_empresa_users" ON public.crm_atividades
  FOR INSERT TO authenticated
  WITH CHECK (
    prospect_id IN (
      SELECT id FROM public.crm_prospects 
      WHERE empresa_id = get_user_empresa_id()
    )
  );

-- UPDATE: Qualquer usuário da empresa pode atualizar atividades
CREATE POLICY "crm_atividades_update_empresa_users" ON public.crm_atividades
  FOR UPDATE TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM public.crm_prospects 
      WHERE empresa_id = get_user_empresa_id()
    )
  );

-- DELETE: Apenas admins podem deletar atividades
CREATE POLICY "crm_atividades_delete_admins_only" ON public.crm_atividades
  FOR DELETE TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM public.crm_prospects 
      WHERE empresa_id = get_user_empresa_id()
    )
    AND is_admin()
  );