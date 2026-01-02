-- =====================================================
-- FASE 1: REMOVER POLÍTICAS PÚBLICAS PERIGOSAS
-- =====================================================

-- 1.1 Remover política pública de anamnese_envios (já criada anteriormente, mas vamos garantir)
DROP POLICY IF EXISTS "anamnese_envios_token_access" ON anamnese_envios;

-- 1.2 Remover política pública de anamnese_perguntas
DROP POLICY IF EXISTS "anamnese_perguntas_public_select" ON anamnese_perguntas;

-- 1.3 Remover política pública de anamnese_templates
DROP POLICY IF EXISTS "anamnese_templates_public_select" ON anamnese_templates;

-- 1.4 Remover política pública de checkin_envios
DROP POLICY IF EXISTS "checkin_envios_public_select" ON checkin_envios;

-- 1.5 Remover política pública de checkin_perguntas
DROP POLICY IF EXISTS "checkin_perguntas_public_select" ON checkin_perguntas;

-- 1.6 Remover política pública de checkin_respostas
DROP POLICY IF EXISTS "checkin_respostas_insert_public" ON checkin_respostas;

-- 1.7 Remover política problemática de evolucao_fotos (com OR true)
DROP POLICY IF EXISTS "evolucao_fotos_insert" ON evolucao_fotos;

-- 1.8 Remover política problemática de checkin_envios update
DROP POLICY IF EXISTS "checkin_envios_update" ON checkin_envios;

-- =====================================================
-- FASE 2: CRIAR POLÍTICAS SEGURAS
-- =====================================================

-- 2.1 Criar política segura de INSERT para evolucao_fotos
CREATE POLICY "evolucao_fotos_insert_secure" ON evolucao_fotos
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND empresa_id = get_user_empresa_id() 
  AND is_active_user()
);

-- 2.2 Criar política segura de UPDATE para checkin_envios (apenas usuários autenticados)
CREATE POLICY "checkin_envios_update_secure" ON checkin_envios
FOR UPDATE USING (
  auth.uid() IS NOT NULL
  AND empresa_id = get_user_empresa_id() 
  AND is_active_user()
);

-- =====================================================
-- FASE 3: FUNÇÕES DE VALIDAÇÃO DE TOKEN (SECURITY DEFINER)
-- =====================================================

-- 3.1 Função para validar token de checkin
CREATE OR REPLACE FUNCTION public.validate_checkin_token(p_token text)
RETURNS TABLE(
  envio_id uuid,
  template_id uuid,
  cliente_id uuid,
  empresa_id uuid,
  expira_em timestamptz,
  status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id, template_id, cliente_id, empresa_id, expira_em, status
  FROM checkin_envios 
  WHERE token = p_token 
  AND status IN ('pendente', 'parcial')
  AND expira_em > now()
  LIMIT 1;
$$;

-- 3.2 Função para validar token de anamnese
CREATE OR REPLACE FUNCTION public.validate_anamnese_token(p_token text)
RETURNS TABLE(
  envio_id uuid,
  template_id uuid,
  cliente_id uuid,
  empresa_id uuid,
  expira_em timestamptz,
  status text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id, template_id, cliente_id, empresa_id, expira_em, status
  FROM anamnese_envios 
  WHERE token = p_token 
  AND status IN ('pendente', 'parcial')
  AND expira_em > now()
  LIMIT 1;
$$;

-- 3.3 Função para obter perguntas de checkin por template (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_checkin_perguntas_by_template(p_template_id uuid)
RETURNS TABLE(
  id uuid,
  pergunta text,
  tipo text,
  secao text,
  secao_icone text,
  ordem integer,
  obrigatoria boolean,
  placeholder text,
  opcoes_pontuacao jsonb,
  pontos_maximo integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id, pergunta, tipo, secao, secao_icone, ordem, obrigatoria, placeholder, opcoes_pontuacao, pontos_maximo
  FROM checkin_perguntas 
  WHERE template_id = p_template_id
  ORDER BY ordem;
$$;

-- 3.4 Função para obter template de checkin (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_checkin_template(p_template_id uuid)
RETURNS TABLE(
  id uuid,
  nome text,
  descricao text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id, nome, descricao
  FROM checkin_templates 
  WHERE id = p_template_id
  LIMIT 1;
$$;

-- 3.5 Função para obter cliente por id (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_cliente_nome(p_cliente_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT nome FROM clientes WHERE id = p_cliente_id LIMIT 1;
$$;

-- 3.6 Função para obter perguntas de anamnese por template (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_anamnese_perguntas_by_template(p_template_id uuid)
RETURNS TABLE(
  id uuid,
  pergunta text,
  tipo text,
  secao text,
  secao_icone text,
  ordem integer,
  obrigatoria boolean,
  placeholder text,
  opcoes jsonb
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id, pergunta, tipo, secao, secao_icone, ordem, obrigatoria, placeholder, opcoes
  FROM anamnese_perguntas 
  WHERE template_id = p_template_id
  ORDER BY ordem;
$$;

-- 3.7 Função para obter template de anamnese (bypass RLS)
CREATE OR REPLACE FUNCTION public.get_anamnese_template(p_template_id uuid)
RETURNS TABLE(
  id uuid,
  nome text,
  descricao text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id, nome, descricao
  FROM anamnese_templates 
  WHERE id = p_template_id
  LIMIT 1;
$$;

-- =====================================================
-- FASE 4: CORRIGIR POLÍTICAS DE STORAGE
-- =====================================================

-- 4.1 Remover políticas problemáticas de client-documents
DROP POLICY IF EXISTS "Users can view documents from their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload documents for their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents from their company" ON storage.objects;

-- 4.2 Remover políticas problemáticas de contract-documents
DROP POLICY IF EXISTS "Contract documents are viewable by users of same company" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload contract documents for their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can update contract documents for their company" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete contract documents for their company" ON storage.objects;

-- 4.3 Criar políticas seguras para client-documents
CREATE POLICY "client_docs_select_secure" ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-documents' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1]::uuid = get_user_empresa_id()
);

CREATE POLICY "client_docs_insert_secure" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1]::uuid = get_user_empresa_id()
);

CREATE POLICY "client_docs_delete_secure" ON storage.objects FOR DELETE
USING (
  bucket_id = 'client-documents'
  AND auth.uid() IS NOT NULL  
  AND (storage.foldername(name))[1]::uuid = get_user_empresa_id()
);

-- 4.4 Criar políticas seguras para contract-documents
CREATE POLICY "contract_docs_select_secure" ON storage.objects FOR SELECT
USING (
  bucket_id = 'contract-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1]::uuid = get_user_empresa_id()
);

CREATE POLICY "contract_docs_insert_secure" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contract-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1]::uuid = get_user_empresa_id()
);

CREATE POLICY "contract_docs_update_secure" ON storage.objects FOR UPDATE
USING (
  bucket_id = 'contract-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1]::uuid = get_user_empresa_id()
);

CREATE POLICY "contract_docs_delete_secure" ON storage.objects FOR DELETE
USING (
  bucket_id = 'contract-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1]::uuid = get_user_empresa_id()
);