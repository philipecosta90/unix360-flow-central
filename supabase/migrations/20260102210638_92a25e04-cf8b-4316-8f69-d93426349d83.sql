-- =====================================================
-- FASE 5: CORREÇÕES ADICIONAIS DE SEGURANÇA
-- Corrigindo problemas encontrados no segundo scan
-- =====================================================

-- 5.1 Corrigir política de perfis - verificar se já existe e tem a empresa_id correta
-- O problema atual: política permite ler perfis de outras empresas
DROP POLICY IF EXISTS "perfis_select_authenticated_only" ON perfis;

CREATE POLICY "perfis_select_same_company" ON perfis
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND (
    -- Usuário pode ver seu próprio perfil
    user_id = auth.uid()
    -- Ou perfis da mesma empresa
    OR empresa_id = get_user_empresa_id()
    -- Super admin pode ver todos
    OR is_super_admin()
  )
);

-- 5.2 Política de block para acesso anônimo na tabela perfis
DROP POLICY IF EXISTS "block_anonymous_access_perfis" ON perfis;

CREATE POLICY "block_anonymous_access_perfis" ON perfis
FOR ALL USING (
  auth.uid() IS NOT NULL
);

-- 5.3 Corrigir anamnese_respostas - adicionar política de INSERT segura
-- A inserção ocorre via edge function com service role, mas vamos garantir proteção adicional
CREATE POLICY "anamnese_respostas_insert_via_function" ON anamnese_respostas
FOR INSERT WITH CHECK (
  -- Apenas via service role (edge function) OU usuário autenticado da mesma empresa
  auth.uid() IS NOT NULL AND envio_id IN (
    SELECT id FROM anamnese_envios WHERE empresa_id = get_user_empresa_id()
  )
);

-- 5.4 Corrigir checkin_respostas - garantir que existe política de INSERT
-- Verificar se a política antiga ainda existe e remover se necessário
-- A inserção deve ocorrer apenas via edge function (service role)
DROP POLICY IF EXISTS "checkin_respostas_insert" ON checkin_respostas;

-- Criar política que bloqueia INSERT direto (apenas service role)
-- Como já removemos checkin_respostas_insert_public, precisamos de uma política segura
CREATE POLICY "checkin_respostas_insert_secure" ON checkin_respostas
FOR INSERT WITH CHECK (
  -- Apenas usuário autenticado da mesma empresa pode inserir
  -- (Na prática, a edge function usa service role)
  auth.uid() IS NOT NULL AND envio_id IN (
    SELECT id FROM checkin_envios WHERE empresa_id = get_user_empresa_id()
  )
);

-- 5.5 Corrigir evolucao_fotos - adicionar política de UPDATE
CREATE POLICY "evolucao_fotos_update_secure" ON evolucao_fotos
FOR UPDATE USING (
  auth.uid() IS NOT NULL
  AND empresa_id = get_user_empresa_id() 
  AND is_active_user()
);

-- 5.6 Corrigir notifications - adicionar política de DELETE
CREATE POLICY "notifications_delete_own" ON notifications
FOR DELETE USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- 5.7 Adicionar proteção extra na função get_user_empresa_id para retornar NULL de forma segura
-- (já retorna NULL quando auth.uid() é NULL, o que é seguro)

-- 5.8 Verificar que as tabelas têm RLS habilitado (garantia extra)
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnese_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolucao_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;