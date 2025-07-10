-- =====================================================
-- AUDITORIA COMPLETA DE SEGURANÇA RLS - UNIX360
-- =====================================================

-- ====================================================
-- PARTE 1: LIMPEZA DE POLÍTICAS DUPLICADAS E CONFLITANTES
-- ====================================================

-- Remover todas as políticas duplicadas e conflitantes
DROP POLICY IF EXISTS "cliente_documentos_delete_empresa" ON public.cliente_documentos;
DROP POLICY IF EXISTS "cliente_documentos_insert_empresa" ON public.cliente_documentos;
DROP POLICY IF EXISTS "cliente_documentos_select_empresa" ON public.cliente_documentos;
DROP POLICY IF EXISTS "cliente_documentos_update_empresa" ON public.cliente_documentos;

DROP POLICY IF EXISTS "clientes_delete_empresa" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert_empresa" ON public.clientes;
DROP POLICY IF EXISTS "clientes_select_empresa" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_empresa" ON public.clientes;

DROP POLICY IF EXISTS "contratos_delete_empresa" ON public.contratos;
DROP POLICY IF EXISTS "contratos_insert_empresa" ON public.contratos;
DROP POLICY IF EXISTS "contratos_select_empresa" ON public.contratos;
DROP POLICY IF EXISTS "contratos_update_empresa" ON public.contratos;

DROP POLICY IF EXISTS "cs_interacoes_delete_empresa" ON public.cs_interacoes;
DROP POLICY IF EXISTS "cs_interacoes_insert_empresa" ON public.cs_interacoes;
DROP POLICY IF EXISTS "cs_interacoes_select_empresa" ON public.cs_interacoes;
DROP POLICY IF EXISTS "cs_interacoes_update_empresa" ON public.cs_interacoes;

DROP POLICY IF EXISTS "cs_nps_delete_empresa" ON public.cs_nps;
DROP POLICY IF EXISTS "cs_nps_insert_empresa" ON public.cs_nps;
DROP POLICY IF EXISTS "cs_nps_select_empresa" ON public.cs_nps;
DROP POLICY IF EXISTS "cs_nps_update_empresa" ON public.cs_nps;

DROP POLICY IF EXISTS "financeiro_lancamentos_delete_empresa" ON public.financeiro_lancamentos;
DROP POLICY IF EXISTS "financeiro_lancamentos_insert_empresa" ON public.financeiro_lancamentos;
DROP POLICY IF EXISTS "financeiro_lancamentos_select_empresa" ON public.financeiro_lancamentos;
DROP POLICY IF EXISTS "financeiro_lancamentos_update_empresa" ON public.financeiro_lancamentos;

DROP POLICY IF EXISTS "financeiro_tarefas_delete_empresa" ON public.financeiro_tarefas;
DROP POLICY IF EXISTS "financeiro_tarefas_insert_empresa" ON public.financeiro_tarefas;
DROP POLICY IF EXISTS "financeiro_tarefas_select_empresa" ON public.financeiro_tarefas;
DROP POLICY IF EXISTS "financeiro_tarefas_update_empresa" ON public.financeiro_tarefas;

-- Remover políticas antigas inconsistentes nas empresas
DROP POLICY IF EXISTS "Admins podem atualizar empresas" ON public.empresas;
DROP POLICY IF EXISTS "Admins podem ver todas as empresas" ON public.empresas;
DROP POLICY IF EXISTS "Usuários podem atualizar empresa" ON public.empresas;
DROP POLICY IF EXISTS "Usuários podem inserir empresa" ON public.empresas;
DROP POLICY IF EXISTS "Usuários podem ver sua empresa" ON public.empresas;

-- Remover políticas antigas inconsistentes no onboarding
DROP POLICY IF EXISTS "Usuários podem atualizar onboarding da sua empresa" ON public.cs_onboarding;
DROP POLICY IF EXISTS "Usuários podem deletar onboarding da sua empresa" ON public.cs_onboarding;
DROP POLICY IF EXISTS "Usuários podem inserir onboarding na sua empresa" ON public.cs_onboarding;
DROP POLICY IF EXISTS "Usuários podem ver onboarding da sua empresa" ON public.cs_onboarding;

-- Remover políticas restritivas incorretas do CRM
DROP POLICY IF EXISTS "crm_atividades_delete_admins_only" ON public.crm_atividades;
DROP POLICY IF EXISTS "crm_prospects_delete_admins_only" ON public.crm_prospects;

-- ====================================================
-- PARTE 2: FUNÇÃO DE SEGURANÇA PARA SUPER ADMIN
-- ====================================================

-- Criar função para verificar se é super admin (nível sistema)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE user_id = auth.uid() 
    AND nivel_permissao = 'admin'
    AND empresa_id IN (
      SELECT id FROM public.empresas WHERE nome = 'Empresa Padrão'
    )
  );
$$;

-- ====================================================
-- PARTE 3: POLÍTICAS PADRONIZADAS E SEGURAS
-- ====================================================

-- EMPRESAS: Acesso restrito e controlado
CREATE POLICY "empresa_select_own" ON public.empresas
  FOR SELECT TO authenticated
  USING (id = public.get_user_empresa_id());

CREATE POLICY "empresa_select_super_admin" ON public.empresas
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "empresa_update_admin" ON public.empresas
  FOR UPDATE TO authenticated
  USING (id = public.get_user_empresa_id() AND public.is_admin());

-- PERFIS: Controle rigoroso de acesso
CREATE POLICY "perfis_select_company" ON public.perfis
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "perfis_insert_admin_only" ON public.perfis
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id() AND public.is_admin());

CREATE POLICY "perfis_update_self_or_admin" ON public.perfis
  FOR UPDATE TO authenticated
  USING (
    (user_id = auth.uid()) OR 
    (empresa_id = public.get_user_empresa_id() AND public.is_admin())
  );

CREATE POLICY "perfis_delete_admin_only" ON public.perfis
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id() AND public.is_admin());

-- SUBSCRIPTIONS: Acesso controlado para billing
CREATE POLICY "subscriptions_select_company" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "subscriptions_select_super_admin" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "subscriptions_update_admin" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id() AND public.is_admin());

CREATE POLICY "subscriptions_insert_admin" ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id() AND public.is_admin());

-- INVOICES: Somente leitura para usuários, gestão para admins
CREATE POLICY "invoices_select_company" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    subscription_id IN (
      SELECT id FROM public.subscriptions 
      WHERE empresa_id = public.get_user_empresa_id()
    )
  );

CREATE POLICY "invoices_select_super_admin" ON public.invoices
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- ====================================================
-- PARTE 4: CORRIGIR POLÍTICAS DE DELETE RESTRITIVAS
-- ====================================================

-- CRM: Permitir delete para usuários operacionais
CREATE POLICY "crm_atividades_delete_operational" ON public.crm_atividades
  FOR DELETE TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM public.crm_prospects 
      WHERE empresa_id = public.get_user_empresa_id()
    )
  );

CREATE POLICY "crm_prospects_delete_operational" ON public.crm_prospects
  FOR DELETE TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

-- ====================================================
-- PARTE 5: AUDITORIA DE ACESSOS - FUNÇÃO DE LOG
-- ====================================================

-- Criar tabela de auditoria de acessos sensíveis
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  empresa_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas super admins podem ver logs de auditoria
CREATE POLICY "audit_logs_select_super_admin" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- Função para log de auditoria
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    empresa_id,
    action,
    table_name,
    record_id
  ) VALUES (
    auth.uid(),
    public.get_user_empresa_id(),
    p_action,
    p_table_name,
    p_record_id
  );
END;
$$;

-- ====================================================
-- PARTE 6: VALIDAÇÕES DE INTEGRIDADE DOS DADOS
-- ====================================================

-- Função para validar integridade empresa-usuário
CREATE OR REPLACE FUNCTION public.validate_user_empresa_integrity()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.perfis p
    LEFT JOIN public.empresas e ON p.empresa_id = e.id
    WHERE e.id IS NULL
  );
$$;

-- Função para validar permissões válidas
CREATE OR REPLACE FUNCTION public.validate_permission_levels()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.perfis
    WHERE nivel_permissao NOT IN ('admin', 'operacional', 'visualizacao')
  );
$$;

-- ====================================================
-- PARTE 7: POLÍTICA DE PROTEÇÃO CONTRA ESCALAÇÃO
-- ====================================================

-- Garantir que usuários não possam elevar suas próprias permissões
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se não é admin, não pode alterar nível de permissão
  IF OLD.nivel_permissao != NEW.nivel_permissao AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas admins podem alterar níveis de permissão';
  END IF;
  
  -- Log da alteração sensível
  PERFORM public.log_sensitive_access(
    'UPDATE_PERMISSION',
    'perfis',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para prevenir escalação de privilégios
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON public.perfis;
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privilege_escalation();

-- ====================================================
-- PARTE 8: RELATÓRIO DE SEGURANÇA
-- ====================================================

-- View para relatório de segurança (apenas super admins)
CREATE OR REPLACE VIEW public.security_report AS
SELECT 
  'Integridade Empresa-Usuário' as check_name,
  public.validate_user_empresa_integrity() as status,
  CASE 
    WHEN public.validate_user_empresa_integrity() THEN 'OK' 
    ELSE 'FALHOU - Usuários com empresas inválidas detectados'
  END as message
UNION ALL
SELECT 
  'Níveis de Permissão Válidos' as check_name,
  public.validate_permission_levels() as status,
  CASE 
    WHEN public.validate_permission_levels() THEN 'OK'
    ELSE 'FALHOU - Níveis de permissão inválidos detectados'
  END as message
UNION ALL
SELECT 
  'Total de Usuários Admin' as check_name,
  true as status,
  CONCAT('Total: ', COUNT(*), ' admins no sistema') as message
FROM public.perfis 
WHERE nivel_permissao = 'admin';

-- RLS para view de segurança
ALTER VIEW public.security_report SET (security_barrier = true);

COMMENT ON VIEW public.security_report IS 'Relatório de segurança do sistema - acesso restrito a super admins';