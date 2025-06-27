
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_nps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_documentos ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "clientes_select_empresa" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert_empresa" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_empresa" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete_empresa" ON public.clientes;

DROP POLICY IF EXISTS "contratos_select_empresa" ON public.contratos;
DROP POLICY IF EXISTS "contratos_insert_empresa" ON public.contratos;
DROP POLICY IF EXISTS "contratos_update_empresa" ON public.contratos;
DROP POLICY IF EXISTS "contratos_delete_empresa" ON public.contratos;

DROP POLICY IF EXISTS "crm_prospects_select_empresa" ON public.crm_prospects;
DROP POLICY IF EXISTS "crm_prospects_insert_empresa" ON public.crm_prospects;
DROP POLICY IF EXISTS "crm_prospects_update_empresa" ON public.crm_prospects;
DROP POLICY IF EXISTS "crm_prospects_delete_empresa" ON public.crm_prospects;

DROP POLICY IF EXISTS "crm_stages_select_empresa" ON public.crm_stages;
DROP POLICY IF EXISTS "crm_stages_insert_empresa" ON public.crm_stages;
DROP POLICY IF EXISTS "crm_stages_update_empresa" ON public.crm_stages;
DROP POLICY IF EXISTS "crm_stages_delete_empresa" ON public.crm_stages;

DROP POLICY IF EXISTS "cs_interacoes_select_empresa" ON public.cs_interacoes;
DROP POLICY IF EXISTS "cs_interacoes_insert_empresa" ON public.cs_interacoes;
DROP POLICY IF EXISTS "cs_interacoes_update_empresa" ON public.cs_interacoes;
DROP POLICY IF EXISTS "cs_interacoes_delete_empresa" ON public.cs_interacoes;

DROP POLICY IF EXISTS "cs_nps_select_empresa" ON public.cs_nps;
DROP POLICY IF EXISTS "cs_nps_insert_empresa" ON public.cs_nps;
DROP POLICY IF EXISTS "cs_nps_update_empresa" ON public.cs_nps;
DROP POLICY IF EXISTS "cs_nps_delete_empresa" ON public.cs_nps;

DROP POLICY IF EXISTS "financeiro_lancamentos_select_empresa" ON public.financeiro_lancamentos;
DROP POLICY IF EXISTS "financeiro_lancamentos_insert_empresa" ON public.financeiro_lancamentos;
DROP POLICY IF EXISTS "financeiro_lancamentos_update_empresa" ON public.financeiro_lancamentos;
DROP POLICY IF EXISTS "financeiro_lancamentos_delete_empresa" ON public.financeiro_lancamentos;

DROP POLICY IF EXISTS "financeiro_tarefas_select_empresa" ON public.financeiro_tarefas;
DROP POLICY IF EXISTS "financeiro_tarefas_insert_empresa" ON public.financeiro_tarefas;
DROP POLICY IF EXISTS "financeiro_tarefas_update_empresa" ON public.financeiro_tarefas;
DROP POLICY IF EXISTS "financeiro_tarefas_delete_empresa" ON public.financeiro_tarefas;

DROP POLICY IF EXISTS "cliente_documentos_select_empresa" ON public.cliente_documentos;
DROP POLICY IF EXISTS "cliente_documentos_insert_empresa" ON public.cliente_documentos;
DROP POLICY IF EXISTS "cliente_documentos_update_empresa" ON public.cliente_documentos;
DROP POLICY IF EXISTS "cliente_documentos_delete_empresa" ON public.cliente_documentos;

-- Remover políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS "Usuários podem ver clientes da sua empresa" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem inserir clientes na sua empresa" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem atualizar clientes da sua empresa" ON public.clientes;
DROP POLICY IF EXISTS "Admins podem deletar clientes da sua empresa" ON public.clientes;

DROP POLICY IF EXISTS "Usuários podem ver contratos de sua empresa" ON public.contratos;
DROP POLICY IF EXISTS "Usuários podem criar contratos para sua empresa" ON public.contratos;
DROP POLICY IF EXISTS "Usuários podem atualizar contratos de sua empresa" ON public.contratos;
DROP POLICY IF EXISTS "Usuários podem excluir contratos de sua empresa" ON public.contratos;

DROP POLICY IF EXISTS "Users can view prospects from their company" ON public.crm_prospects;
DROP POLICY IF EXISTS "Users can insert prospects for their company" ON public.crm_prospects;
DROP POLICY IF EXISTS "Users can update their own prospects from their company" ON public.crm_prospects;
DROP POLICY IF EXISTS "Users can delete their own prospects from their company" ON public.crm_prospects;

DROP POLICY IF EXISTS "Users can view company stages" ON public.crm_stages;
DROP POLICY IF EXISTS "Users can create company stages" ON public.crm_stages;
DROP POLICY IF EXISTS "Users can update company stages" ON public.crm_stages;
DROP POLICY IF EXISTS "Users can delete company stages" ON public.crm_stages;

DROP POLICY IF EXISTS "Usuários podem ver interações da sua empresa" ON public.cs_interacoes;
DROP POLICY IF EXISTS "Usuários podem inserir interações na sua empresa" ON public.cs_interacoes;
DROP POLICY IF EXISTS "Usuários podem atualizar interações da sua empresa" ON public.cs_interacoes;
DROP POLICY IF EXISTS "Usuários podem deletar interações da sua empresa" ON public.cs_interacoes;

DROP POLICY IF EXISTS "Usuários podem ver NPS da sua empresa" ON public.cs_nps;
DROP POLICY IF EXISTS "Usuários podem inserir NPS na sua empresa" ON public.cs_nps;
DROP POLICY IF EXISTS "Usuários podem atualizar NPS da sua empresa" ON public.cs_nps;
DROP POLICY IF EXISTS "Usuários podem deletar NPS da sua empresa" ON public.cs_nps;

DROP POLICY IF EXISTS "Selecionar dados da empresa" ON public.financeiro_lancamentos;
DROP POLICY IF EXISTS "Inserir dados da empresa" ON public.financeiro_lancamentos;
DROP POLICY IF EXISTS "Atualizar dados da empresa" ON public.financeiro_lancamentos;
DROP POLICY IF EXISTS "Excluir dados da empresa" ON public.financeiro_lancamentos;

DROP POLICY IF EXISTS "Selecionar tarefas da empresa" ON public.financeiro_tarefas;
DROP POLICY IF EXISTS "Inserir tarefas da empresa" ON public.financeiro_tarefas;
DROP POLICY IF EXISTS "Atualizar tarefas da empresa" ON public.financeiro_tarefas;
DROP POLICY IF EXISTS "Excluir tarefas da empresa" ON public.financeiro_tarefas;

DROP POLICY IF EXISTS "Users can view documents from their company" ON public.cliente_documentos;
DROP POLICY IF EXISTS "Users can insert documents for their company" ON public.cliente_documentos;
DROP POLICY IF EXISTS "Users can update their own documents from their company" ON public.cliente_documentos;
DROP POLICY IF EXISTS "Users can delete their own documents from their company" ON public.cliente_documentos;

-- ====== POLÍTICAS PARA TABELA CLIENTES ======
CREATE POLICY "clientes_select_empresa" ON public.clientes
  FOR SELECT TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "clientes_insert_empresa" ON public.clientes
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "clientes_update_empresa" ON public.clientes
  FOR UPDATE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "clientes_delete_empresa" ON public.clientes
  FOR DELETE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

-- ====== POLÍTICAS PARA TABELA CONTRATOS ======
CREATE POLICY "contratos_select_empresa" ON public.contratos
  FOR SELECT TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "contratos_insert_empresa" ON public.contratos
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "contratos_update_empresa" ON public.contratos
  FOR UPDATE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "contratos_delete_empresa" ON public.contratos
  FOR DELETE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

-- ====== POLÍTICAS PARA TABELA CRM_PROSPECTS ======
CREATE POLICY "crm_prospects_select_empresa" ON public.crm_prospects
  FOR SELECT TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "crm_prospects_insert_empresa" ON public.crm_prospects
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "crm_prospects_update_empresa" ON public.crm_prospects
  FOR UPDATE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "crm_prospects_delete_empresa" ON public.crm_prospects
  FOR DELETE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

-- ====== POLÍTICAS PARA TABELA CRM_STAGES ======
CREATE POLICY "crm_stages_select_empresa" ON public.crm_stages
  FOR SELECT TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "crm_stages_insert_empresa" ON public.crm_stages
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "crm_stages_update_empresa" ON public.crm_stages
  FOR UPDATE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "crm_stages_delete_empresa" ON public.crm_stages
  FOR DELETE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

-- ====== POLÍTICAS PARA TABELA CS_INTERACOES ======
CREATE POLICY "cs_interacoes_select_empresa" ON public.cs_interacoes
  FOR SELECT TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "cs_interacoes_insert_empresa" ON public.cs_interacoes
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "cs_interacoes_update_empresa" ON public.cs_interacoes
  FOR UPDATE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "cs_interacoes_delete_empresa" ON public.cs_interacoes
  FOR DELETE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

-- ====== POLÍTICAS PARA TABELA CS_NPS ======
CREATE POLICY "cs_nps_select_empresa" ON public.cs_nps
  FOR SELECT TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "cs_nps_insert_empresa" ON public.cs_nps
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "cs_nps_update_empresa" ON public.cs_nps
  FOR UPDATE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "cs_nps_delete_empresa" ON public.cs_nps
  FOR DELETE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

-- ====== POLÍTICAS PARA TABELA FINANCEIRO_LANCAMENTOS ======
CREATE POLICY "financeiro_lancamentos_select_empresa" ON public.financeiro_lancamentos
  FOR SELECT TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "financeiro_lancamentos_insert_empresa" ON public.financeiro_lancamentos
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "financeiro_lancamentos_update_empresa" ON public.financeiro_lancamentos
  FOR UPDATE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "financeiro_lancamentos_delete_empresa" ON public.financeiro_lancamentos
  FOR DELETE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

-- ====== POLÍTICAS PARA TABELA FINANCEIRO_TAREFAS ======
CREATE POLICY "financeiro_tarefas_select_empresa" ON public.financeiro_tarefas
  FOR SELECT TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "financeiro_tarefas_insert_empresa" ON public.financeiro_tarefas
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "financeiro_tarefas_update_empresa" ON public.financeiro_tarefas
  FOR UPDATE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "financeiro_tarefas_delete_empresa" ON public.financeiro_tarefas
  FOR DELETE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

-- ====== POLÍTICAS PARA TABELA CLIENTE_DOCUMENTOS ======
CREATE POLICY "cliente_documentos_select_empresa" ON public.cliente_documentos
  FOR SELECT TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "cliente_documentos_insert_empresa" ON public.cliente_documentos
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "cliente_documentos_update_empresa" ON public.cliente_documentos
  FOR UPDATE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

CREATE POLICY "cliente_documentos_delete_empresa" ON public.cliente_documentos
  FOR DELETE TO authenticated
  USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);
