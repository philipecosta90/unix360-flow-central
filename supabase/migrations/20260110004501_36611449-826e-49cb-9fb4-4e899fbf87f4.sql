-- Corrigir permissões RLS para permitir admin e operacional (não apenas admin)
-- Usando can_edit_empresa() que já existe e suporta ambos os níveis

-- =====================================================
-- 1. ANAMNESE_TEMPLATES
-- =====================================================

-- DROP existing policies
DROP POLICY IF EXISTS "anamnese_templates_insert" ON anamnese_templates;
DROP POLICY IF EXISTS "anamnese_templates_update" ON anamnese_templates;
DROP POLICY IF EXISTS "anamnese_templates_delete" ON anamnese_templates;
DROP POLICY IF EXISTS "Users can insert templates for their company" ON anamnese_templates;
DROP POLICY IF EXISTS "Users can update templates for their company" ON anamnese_templates;
DROP POLICY IF EXISTS "Users can delete templates for their company" ON anamnese_templates;

-- CREATE new policies with can_edit_empresa()
CREATE POLICY "anamnese_templates_insert" ON anamnese_templates FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id() AND can_edit_empresa());

CREATE POLICY "anamnese_templates_update" ON anamnese_templates FOR UPDATE
USING (empresa_id = get_user_empresa_id() AND can_edit_empresa());

CREATE POLICY "anamnese_templates_delete" ON anamnese_templates FOR DELETE
USING (empresa_id = get_user_empresa_id() AND can_edit_empresa());

-- =====================================================
-- 2. ANAMNESE_PERGUNTAS
-- =====================================================

DROP POLICY IF EXISTS "anamnese_perguntas_insert" ON anamnese_perguntas;
DROP POLICY IF EXISTS "anamnese_perguntas_update" ON anamnese_perguntas;
DROP POLICY IF EXISTS "anamnese_perguntas_delete" ON anamnese_perguntas;
DROP POLICY IF EXISTS "Users can insert questions for their templates" ON anamnese_perguntas;
DROP POLICY IF EXISTS "Users can update questions for their templates" ON anamnese_perguntas;
DROP POLICY IF EXISTS "Users can delete questions for their templates" ON anamnese_perguntas;

CREATE POLICY "anamnese_perguntas_insert" ON anamnese_perguntas FOR INSERT
WITH CHECK (template_id IN (SELECT id FROM anamnese_templates WHERE empresa_id = get_user_empresa_id()) AND can_edit_empresa());

CREATE POLICY "anamnese_perguntas_update" ON anamnese_perguntas FOR UPDATE
USING (template_id IN (SELECT id FROM anamnese_templates WHERE empresa_id = get_user_empresa_id()) AND can_edit_empresa());

CREATE POLICY "anamnese_perguntas_delete" ON anamnese_perguntas FOR DELETE
USING (template_id IN (SELECT id FROM anamnese_templates WHERE empresa_id = get_user_empresa_id()) AND can_edit_empresa());

-- =====================================================
-- 3. WHATSAPP_MENSAGENS
-- =====================================================

DROP POLICY IF EXISTS "whatsapp_mensagens_insert" ON whatsapp_mensagens;
DROP POLICY IF EXISTS "whatsapp_mensagens_update" ON whatsapp_mensagens;
DROP POLICY IF EXISTS "whatsapp_mensagens_delete" ON whatsapp_mensagens;
DROP POLICY IF EXISTS "Users can insert messages for their company" ON whatsapp_mensagens;
DROP POLICY IF EXISTS "Users can update messages for their company" ON whatsapp_mensagens;
DROP POLICY IF EXISTS "Users can delete messages for their company" ON whatsapp_mensagens;

CREATE POLICY "whatsapp_mensagens_insert" ON whatsapp_mensagens FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id() AND can_edit_empresa());

CREATE POLICY "whatsapp_mensagens_update" ON whatsapp_mensagens FOR UPDATE
USING (empresa_id = get_user_empresa_id() AND can_edit_empresa());

CREATE POLICY "whatsapp_mensagens_delete" ON whatsapp_mensagens FOR DELETE
USING (empresa_id = get_user_empresa_id() AND can_edit_empresa());

-- =====================================================
-- 4. CHECKIN_ENVIOS
-- =====================================================

DROP POLICY IF EXISTS "checkin_envios_delete" ON checkin_envios;
DROP POLICY IF EXISTS "Users can delete checkin_envios for their company" ON checkin_envios;

CREATE POLICY "checkin_envios_delete" ON checkin_envios FOR DELETE
USING (empresa_id = get_user_empresa_id() AND can_edit_empresa());

-- =====================================================
-- 5. CHECKIN_RESPOSTAS
-- =====================================================

DROP POLICY IF EXISTS "checkin_respostas_delete" ON checkin_respostas;
DROP POLICY IF EXISTS "Users can delete checkin_respostas for their company" ON checkin_respostas;

CREATE POLICY "checkin_respostas_delete" ON checkin_respostas FOR DELETE
USING (envio_id IN (SELECT id FROM checkin_envios WHERE empresa_id = get_user_empresa_id()) AND can_edit_empresa());

-- =====================================================
-- 6. CHECKIN_PERGUNTAS
-- =====================================================

DROP POLICY IF EXISTS "checkin_perguntas_insert" ON checkin_perguntas;
DROP POLICY IF EXISTS "checkin_perguntas_update" ON checkin_perguntas;
DROP POLICY IF EXISTS "checkin_perguntas_delete" ON checkin_perguntas;
DROP POLICY IF EXISTS "Users can insert checkin questions for their templates" ON checkin_perguntas;
DROP POLICY IF EXISTS "Users can update checkin questions for their templates" ON checkin_perguntas;
DROP POLICY IF EXISTS "Users can delete checkin questions for their templates" ON checkin_perguntas;

CREATE POLICY "checkin_perguntas_insert" ON checkin_perguntas FOR INSERT
WITH CHECK (template_id IN (SELECT id FROM checkin_templates WHERE empresa_id = get_user_empresa_id()) AND can_edit_empresa());

CREATE POLICY "checkin_perguntas_update" ON checkin_perguntas FOR UPDATE
USING (template_id IN (SELECT id FROM checkin_templates WHERE empresa_id = get_user_empresa_id()) AND can_edit_empresa());

CREATE POLICY "checkin_perguntas_delete" ON checkin_perguntas FOR DELETE
USING (template_id IN (SELECT id FROM checkin_templates WHERE empresa_id = get_user_empresa_id()) AND can_edit_empresa());

-- =====================================================
-- 7. CHECKIN_TEMPLATES
-- =====================================================

DROP POLICY IF EXISTS "checkin_templates_insert" ON checkin_templates;
DROP POLICY IF EXISTS "checkin_templates_update" ON checkin_templates;
DROP POLICY IF EXISTS "checkin_templates_delete" ON checkin_templates;
DROP POLICY IF EXISTS "Users can insert checkin templates for their company" ON checkin_templates;
DROP POLICY IF EXISTS "Users can update checkin templates for their company" ON checkin_templates;
DROP POLICY IF EXISTS "Users can delete checkin templates for their company" ON checkin_templates;

CREATE POLICY "checkin_templates_insert" ON checkin_templates FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id() AND can_edit_empresa());

CREATE POLICY "checkin_templates_update" ON checkin_templates FOR UPDATE
USING (empresa_id = get_user_empresa_id() AND can_edit_empresa());

CREATE POLICY "checkin_templates_delete" ON checkin_templates FOR DELETE
USING (empresa_id = get_user_empresa_id() AND can_edit_empresa());