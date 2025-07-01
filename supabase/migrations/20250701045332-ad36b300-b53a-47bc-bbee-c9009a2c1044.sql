
-- ====================================================
-- PARTE 1: HABILITAR RLS EM TODAS AS TABELAS
-- ====================================================

-- Garantir que RLS esteja habilitado em todas as tabelas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_nps ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- PARTE 2: LIMPAR POLICIES EXISTENTES
-- ====================================================

-- Remover todas as policies existentes para recriar com padrão seguro
DROP POLICY IF EXISTS "Usuarios podem visualizar suas empresas" ON public.empresas;
DROP POLICY IF EXISTS "Usuarios podem editar suas empresas" ON public.empresas;
DROP POLICY IF EXISTS "Usuarios podem deletar suas empresas" ON public.empresas;
DROP POLICY IF EXISTS "Admins podem inserir empresas" ON public.empresas;

DROP POLICY IF EXISTS "perfis_select_authenticated" ON public.perfis;
DROP POLICY IF EXISTS "perfis_insert_authenticated" ON public.perfis;
DROP POLICY IF EXISTS "perfis_update_authenticated" ON public.perfis;
DROP POLICY IF EXISTS "perfis_delete_authenticated" ON public.perfis;

DROP POLICY IF EXISTS "Usuários podem ver clientes da sua empresa" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem inserir clientes na sua empresa" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem atualizar clientes da sua empresa" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem deletar clientes da sua empresa" ON public.clientes;

DROP POLICY IF EXISTS "Usuários podem ver contratos de sua empresa" ON public.contratos;
DROP POLICY IF EXISTS "Usuários podem criar contratos para sua empresa" ON public.contratos;
DROP POLICY IF EXISTS "Usuários podem atualizar contratos de sua empresa" ON public.contratos;
DROP POLICY IF EXISTS "Usuários podem excluir contratos de sua empresa" ON public.contratos;

-- Limpar policies de outras tabelas também
DROP POLICY IF EXISTS "Selecionar dados da empresa" ON public.financeiro_lancamentos;
DROP POLICY IF EXISTS "Inserir dados da empresa" ON public.financeiro_lancamentos;
DROP POLICY IF EXISTS "Atualizar dados da empresa" ON public.financeiro_lancamentos;
DROP POLICY IF EXISTS "Excluir dados da empresa" ON public.financeiro_lancamentos;

-- ====================================================
-- PARTE 3: POLICIES PARA EMPRESAS
-- ====================================================

-- Empresas: usuários veem apenas sua empresa
CREATE POLICY "empresa_select" ON public.empresas
  FOR SELECT TO authenticated
  USING (id = public.get_user_empresa_id());

-- Empresas: apenas admins podem atualizar
CREATE POLICY "empresa_update" ON public.empresas
  FOR UPDATE TO authenticated
  USING (id = public.get_user_empresa_id() AND public.is_admin());

-- Empresas: apenas admins podem criar empresas (caso excepcional)
CREATE POLICY "empresa_insert" ON public.empresas
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- ====================================================
-- PARTE 4: POLICIES PARA PERFIS
-- ====================================================

-- Perfis: usuários veem perfis da própria empresa
CREATE POLICY "perfis_select" ON public.perfis
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

-- Perfis: apenas admins podem inserir novos perfis
CREATE POLICY "perfis_insert" ON public.perfis
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id() AND public.is_admin());

-- Perfis: usuários podem atualizar apenas próprio perfil, admins podem atualizar qualquer perfil da empresa
CREATE POLICY "perfis_update" ON public.perfis
  FOR UPDATE TO authenticated
  USING (
    (user_id = auth.uid()) OR 
    (empresa_id = public.get_user_empresa_id() AND public.is_admin())
  );

-- Perfis: apenas admins podem deletar perfis
CREATE POLICY "perfis_delete" ON public.perfis
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id() AND public.is_admin());

-- ====================================================
-- PARTE 5: POLICIES PARA CLIENTES
-- ====================================================

CREATE POLICY "clientes_select" ON public.clientes
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "clientes_insert" ON public.clientes
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "clientes_update" ON public.clientes
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "clientes_delete" ON public.clientes
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id() AND public.is_admin());

-- ====================================================
-- PARTE 6: POLICIES PARA CONTRATOS
-- ====================================================

CREATE POLICY "contratos_select" ON public.contratos
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "contratos_insert" ON public.contratos
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "contratos_update" ON public.contratos
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "contratos_delete" ON public.contratos
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id() AND public.is_admin());

-- ====================================================
-- PARTE 7: POLICIES PARA FINANCEIRO_LANCAMENTOS
-- ====================================================

CREATE POLICY "financeiro_lancamentos_select" ON public.financeiro_lancamentos
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "financeiro_lancamentos_insert" ON public.financeiro_lancamentos
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "financeiro_lancamentos_update" ON public.financeiro_lancamentos
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "financeiro_lancamentos_delete" ON public.financeiro_lancamentos
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id() AND public.is_admin());

-- ====================================================
-- PARTE 8: POLICIES PARA FINANCEIRO_TAREFAS
-- ====================================================

CREATE POLICY "financeiro_tarefas_select" ON public.financeiro_tarefas
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "financeiro_tarefas_insert" ON public.financeiro_tarefas
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "financeiro_tarefas_update" ON public.financeiro_tarefas
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "financeiro_tarefas_delete" ON public.financeiro_tarefas
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

-- ====================================================
-- PARTE 9: POLICIES PARA CLIENTE_DOCUMENTOS
-- ====================================================

CREATE POLICY "cliente_documentos_select" ON public.cliente_documentos
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "cliente_documentos_insert" ON public.cliente_documentos
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "cliente_documentos_update" ON public.cliente_documentos
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "cliente_documentos_delete" ON public.cliente_documentos
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

-- ====================================================
-- PARTE 10: POLICIES PARA CRM_PROSPECTS
-- ====================================================

CREATE POLICY "crm_prospects_select" ON public.crm_prospects
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "crm_prospects_insert" ON public.crm_prospects
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "crm_prospects_update" ON public.crm_prospects
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "crm_prospects_delete" ON public.crm_prospects
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

-- ====================================================
-- PARTE 11: POLICIES PARA CRM_STAGES
-- ====================================================

CREATE POLICY "crm_stages_select" ON public.crm_stages
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "crm_stages_insert" ON public.crm_stages
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "crm_stages_update" ON public.crm_stages
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "crm_stages_delete" ON public.crm_stages
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id() AND public.is_admin());

-- ====================================================
-- PARTE 12: POLICIES PARA CRM_ATIVIDADES
-- ====================================================

-- CRM_ATIVIDADES precisa de tratamento especial pois referencia prospect_id
CREATE POLICY "crm_atividades_select" ON public.crm_atividades
  FOR SELECT TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM public.crm_prospects 
      WHERE empresa_id = public.get_user_empresa_id()
    )
  );

CREATE POLICY "crm_atividades_insert" ON public.crm_atividades
  FOR INSERT TO authenticated
  WITH CHECK (
    prospect_id IN (
      SELECT id FROM public.crm_prospects 
      WHERE empresa_id = public.get_user_empresa_id()
    )
  );

CREATE POLICY "crm_atividades_update" ON public.crm_atividades
  FOR UPDATE TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM public.crm_prospects 
      WHERE empresa_id = public.get_user_empresa_id()
    )
  );

CREATE POLICY "crm_atividades_delete" ON public.crm_atividades
  FOR DELETE TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM public.crm_prospects 
      WHERE empresa_id = public.get_user_empresa_id()
    )
  );

-- ====================================================
-- PARTE 13: POLICIES PARA CS_ONBOARDING
-- ====================================================

CREATE POLICY "cs_onboarding_select" ON public.cs_onboarding
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "cs_onboarding_insert" ON public.cs_onboarding
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "cs_onboarding_update" ON public.cs_onboarding
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "cs_onboarding_delete" ON public.cs_onboarding
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

-- ====================================================
-- PARTE 14: POLICIES PARA CS_INTERACOES
-- ====================================================

CREATE POLICY "cs_interacoes_select" ON public.cs_interacoes
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "cs_interacoes_insert" ON public.cs_interacoes
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "cs_interacoes_update" ON public.cs_interacoes
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "cs_interacoes_delete" ON public.cs_interacoes
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

-- ====================================================
-- PARTE 15: POLICIES PARA CS_NPS
-- ====================================================

CREATE POLICY "cs_nps_select" ON public.cs_nps
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "cs_nps_insert" ON public.cs_nps
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "cs_nps_update" ON public.cs_nps
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "cs_nps_delete" ON public.cs_nps
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());
