-- Atualizar políticas RLS para incluir verificação de perfil ativo

-- Atualizar função helper para incluir verificação de ativo
CREATE OR REPLACE FUNCTION public.get_active_user_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT empresa_id FROM public.perfis 
  WHERE user_id = auth.uid() 
  AND ativo = TRUE 
  LIMIT 1;
$$;

-- Função helper para verificar se usuário está ativo
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE user_id = auth.uid() 
    AND ativo = TRUE
  );
$$;

-- Atualizar função is_admin para incluir verificação de ativo
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE user_id = auth.uid() 
    AND nivel_permissao = 'admin'
    AND ativo = TRUE
  );
$$;

-- Atualizar função is_company_admin para incluir verificação de ativo
CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE user_id = auth.uid() 
    AND nivel_permissao = 'admin'
    AND ativo = TRUE
  );
$$;

-- Atualizar políticas de clientes para usar verificação ativa
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
CREATE POLICY "clientes_select" ON public.clientes
FOR SELECT 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "clientes_insert" ON public.clientes;
CREATE POLICY "clientes_insert" ON public.clientes
FOR INSERT 
WITH CHECK (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "clientes_update" ON public.clientes;
CREATE POLICY "clientes_update" ON public.clientes
FOR UPDATE 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "clientes_delete_operacional" ON public.clientes;
CREATE POLICY "clientes_delete_operacional" ON public.clientes
FOR DELETE 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

-- Atualizar políticas de financeiro_lancamentos
DROP POLICY IF EXISTS "financeiro_lancamentos_select" ON public.financeiro_lancamentos;
CREATE POLICY "financeiro_lancamentos_select" ON public.financeiro_lancamentos
FOR SELECT 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "financeiro_lancamentos_insert" ON public.financeiro_lancamentos;
CREATE POLICY "financeiro_lancamentos_insert" ON public.financeiro_lancamentos
FOR INSERT 
WITH CHECK (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "financeiro_lancamentos_update" ON public.financeiro_lancamentos;
CREATE POLICY "financeiro_lancamentos_update" ON public.financeiro_lancamentos
FOR UPDATE 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "financeiro_lancamentos_delete" ON public.financeiro_lancamentos;
CREATE POLICY "financeiro_lancamentos_delete" ON public.financeiro_lancamentos
FOR DELETE 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

-- Atualizar políticas de financeiro_tarefas
DROP POLICY IF EXISTS "financeiro_tarefas_select" ON public.financeiro_tarefas;
CREATE POLICY "financeiro_tarefas_select" ON public.financeiro_tarefas
FOR SELECT 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "financeiro_tarefas_insert" ON public.financeiro_tarefas;
CREATE POLICY "financeiro_tarefas_insert" ON public.financeiro_tarefas
FOR INSERT 
WITH CHECK (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "financeiro_tarefas_update" ON public.financeiro_tarefas;
CREATE POLICY "financeiro_tarefas_update" ON public.financeiro_tarefas
FOR UPDATE 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "financeiro_tarefas_delete" ON public.financeiro_tarefas;
CREATE POLICY "financeiro_tarefas_delete" ON public.financeiro_tarefas
FOR DELETE 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

-- Atualizar políticas de contratos
DROP POLICY IF EXISTS "contratos_select" ON public.contratos;
CREATE POLICY "contratos_select" ON public.contratos
FOR SELECT 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "contratos_insert" ON public.contratos;
CREATE POLICY "contratos_insert" ON public.contratos
FOR INSERT 
WITH CHECK (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "contratos_update" ON public.contratos;
CREATE POLICY "contratos_update" ON public.contratos
FOR UPDATE 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "contratos_delete_operacional" ON public.contratos;
CREATE POLICY "contratos_delete_operacional" ON public.contratos
FOR DELETE 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

-- Atualizar políticas de CRM
DROP POLICY IF EXISTS "crm_prospects_select_empresa_users" ON public.crm_prospects;
CREATE POLICY "crm_prospects_select_empresa_users" ON public.crm_prospects
FOR SELECT 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "crm_prospects_insert_empresa_users" ON public.crm_prospects;
CREATE POLICY "crm_prospects_insert_empresa_users" ON public.crm_prospects
FOR INSERT 
WITH CHECK (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "crm_prospects_update_empresa_users" ON public.crm_prospects;
CREATE POLICY "crm_prospects_update_empresa_users" ON public.crm_prospects
FOR UPDATE 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "crm_prospects_delete_operational" ON public.crm_prospects;
CREATE POLICY "crm_prospects_delete_operational" ON public.crm_prospects
FOR DELETE 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

-- Atualizar políticas de CS
DROP POLICY IF EXISTS "cs_interacoes_select" ON public.cs_interacoes;
CREATE POLICY "cs_interacoes_select" ON public.cs_interacoes
FOR SELECT 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "cs_interacoes_insert" ON public.cs_interacoes;
CREATE POLICY "cs_interacoes_insert" ON public.cs_interacoes
FOR INSERT 
WITH CHECK (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "cs_interacoes_update" ON public.cs_interacoes;
CREATE POLICY "cs_interacoes_update" ON public.cs_interacoes
FOR UPDATE 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "cs_interacoes_delete" ON public.cs_interacoes;
CREATE POLICY "cs_interacoes_delete" ON public.cs_interacoes
FOR DELETE 
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

-- Atualizar políticas de notifications para incluir verificação de ativo
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT 
USING (user_id = auth.uid() AND empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE 
USING (user_id = auth.uid() AND empresa_id = get_active_user_empresa_id() AND is_active_user());

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
FOR INSERT 
WITH CHECK (empresa_id = get_active_user_empresa_id());