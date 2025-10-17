-- ==========================================
-- CORREÇÃO DE SEGURANÇA: 10 ERROS CRÍTICOS
-- ==========================================

-- ✅ PASSO 1: Corrigir funções de segurança para validar autenticação
-- ==========================================

-- Correção 1: get_user_empresa_id() deve retornar NULL se não autenticado
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN NULL
    ELSE (
      SELECT empresa_id 
      FROM public.perfis 
      WHERE user_id = auth.uid() 
      LIMIT 1
    )
  END;
$$;

-- Correção 2: get_active_user_empresa_id() deve validar autenticação
CREATE OR REPLACE FUNCTION public.get_active_user_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN NULL
    ELSE (
      SELECT empresa_id 
      FROM public.perfis 
      WHERE user_id = auth.uid() 
      AND ativo = TRUE 
      LIMIT 1
    )
  END;
$$;

-- Correção 3: is_active_user() deve retornar FALSE se não autenticado
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN FALSE
    ELSE EXISTS (
      SELECT 1 FROM public.perfis 
      WHERE user_id = auth.uid() 
      AND ativo = TRUE
    )
  END;
$$;

-- ✅ PASSO 2: Reforçar políticas RLS com validação explícita de autenticação
-- ==========================================

-- TABELA: perfis
DROP POLICY IF EXISTS "block_anonymous_access_perfis" ON public.perfis;
CREATE POLICY "block_anonymous_access_perfis"
ON public.perfis
FOR ALL
TO anon
USING (false);

DROP POLICY IF EXISTS "perfis_select_company" ON public.perfis;
CREATE POLICY "perfis_select_company"
ON public.perfis
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_user_empresa_id()
);

-- TABELA: clientes
DROP POLICY IF EXISTS "block_anonymous_access_clientes" ON public.clientes;
CREATE POLICY "block_anonymous_access_clientes"
ON public.clientes
FOR ALL
TO anon
USING (false);

DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
CREATE POLICY "clientes_select"
ON public.clientes
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_active_user_empresa_id() 
  AND is_active_user()
);

-- TABELA: crm_prospects
DROP POLICY IF EXISTS "block_anonymous_access_crm_prospects" ON public.crm_prospects;
CREATE POLICY "block_anonymous_access_crm_prospects"
ON public.crm_prospects
FOR ALL
TO anon
USING (false);

DROP POLICY IF EXISTS "crm_prospects_select_empresa_users" ON public.crm_prospects;
CREATE POLICY "crm_prospects_select_empresa_users"
ON public.crm_prospects
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_active_user_empresa_id() 
  AND is_active_user()
);

-- TABELA: empresas
DROP POLICY IF EXISTS "block_anonymous_access_empresas" ON public.empresas;
CREATE POLICY "block_anonymous_access_empresas"
ON public.empresas
FOR ALL
TO anon
USING (false);

DROP POLICY IF EXISTS "empresa_select_own" ON public.empresas;
CREATE POLICY "empresa_select_own"
ON public.empresas
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND id = get_user_empresa_id()
);

-- TABELA: assinaturas_cakto
DROP POLICY IF EXISTS "block_anonymous_access_assinaturas" ON public.assinaturas_cakto;
CREATE POLICY "block_anonymous_access_assinaturas"
ON public.assinaturas_cakto
FOR ALL
TO anon
USING (false);

DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON public.assinaturas_cakto;
CREATE POLICY "Usuários podem ver suas próprias assinaturas"
ON public.assinaturas_cakto
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND perfil_id IN (
    SELECT p.id
    FROM perfis p
    WHERE p.user_id = auth.uid() 
    AND p.ativo = true
  )
);

-- TABELA: financeiro_lancamentos
DROP POLICY IF EXISTS "block_anonymous_access_financeiro" ON public.financeiro_lancamentos;
CREATE POLICY "block_anonymous_access_financeiro"
ON public.financeiro_lancamentos
FOR ALL
TO anon
USING (false);

DROP POLICY IF EXISTS "financeiro_lancamentos_select" ON public.financeiro_lancamentos;
CREATE POLICY "financeiro_lancamentos_select"
ON public.financeiro_lancamentos
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_active_user_empresa_id() 
  AND is_active_user()
);

-- TABELA: contratos
DROP POLICY IF EXISTS "block_anonymous_access_contratos" ON public.contratos;
CREATE POLICY "block_anonymous_access_contratos"
ON public.contratos
FOR ALL
TO anon
USING (false);

DROP POLICY IF EXISTS "contratos_select" ON public.contratos;
CREATE POLICY "contratos_select"
ON public.contratos
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_active_user_empresa_id() 
  AND is_active_user()
);

-- TABELA: contratos_documentos
DROP POLICY IF EXISTS "block_anonymous_access_contratos_docs" ON public.contratos_documentos;
CREATE POLICY "block_anonymous_access_contratos_docs"
ON public.contratos_documentos
FOR ALL
TO anon
USING (false);

DROP POLICY IF EXISTS "contratos_documentos_select" ON public.contratos_documentos;
CREATE POLICY "contratos_documentos_select"
ON public.contratos_documentos
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_active_user_empresa_id() 
  AND is_active_user()
);

-- TABELA: cs_nps
DROP POLICY IF EXISTS "block_anonymous_access_cs_nps" ON public.cs_nps;
CREATE POLICY "block_anonymous_access_cs_nps"
ON public.cs_nps
FOR ALL
TO anon
USING (false);

DROP POLICY IF EXISTS "cs_nps_select" ON public.cs_nps;
CREATE POLICY "cs_nps_select"
ON public.cs_nps
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_user_empresa_id()
);

-- TABELA: vendas_fechadas
DROP POLICY IF EXISTS "block_anonymous_access_vendas" ON public.vendas_fechadas;
CREATE POLICY "block_anonymous_access_vendas"
ON public.vendas_fechadas
FOR ALL
TO anon
USING (false);

DROP POLICY IF EXISTS "vendas_fechadas_select" ON public.vendas_fechadas;
CREATE POLICY "vendas_fechadas_select"
ON public.vendas_fechadas
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_active_user_empresa_id() 
  AND is_active_user()
);

-- ✅ PASSO 3: Comentário de conclusão
-- ==========================================
COMMENT ON FUNCTION public.get_user_empresa_id() IS 'Retorna NULL para usuários não autenticados';
COMMENT ON FUNCTION public.get_active_user_empresa_id() IS 'Retorna NULL para usuários não autenticados ou inativos';
COMMENT ON FUNCTION public.is_active_user() IS 'Retorna FALSE para usuários não autenticados';