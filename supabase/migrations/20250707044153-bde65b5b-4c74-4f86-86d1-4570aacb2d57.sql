-- =========================================
-- CORREÇÃO DAS POLÍTICAS RLS DO CRM
-- =========================================

-- 1. LIMPAR POLÍTICAS DUPLICADAS/CONFLITANTES DA TABELA CRM_STAGES
DROP POLICY IF EXISTS "crm_stages_select" ON public.crm_stages;
DROP POLICY IF EXISTS "crm_stages_select_empresa" ON public.crm_stages;
DROP POLICY IF EXISTS "crm_stages_insert" ON public.crm_stages;
DROP POLICY IF EXISTS "crm_stages_insert_empresa" ON public.crm_stages;
DROP POLICY IF EXISTS "crm_stages_update" ON public.crm_stages;
DROP POLICY IF EXISTS "crm_stages_update_empresa" ON public.crm_stages;
DROP POLICY IF EXISTS "crm_stages_delete" ON public.crm_stages;
DROP POLICY IF EXISTS "crm_stages_delete_empresa" ON public.crm_stages;

-- 2. LIMPAR POLÍTICAS DUPLICADAS/CONFLITANTES DA TABELA CRM_PROSPECTS  
DROP POLICY IF EXISTS "crm_prospects_select" ON public.crm_prospects;
DROP POLICY IF EXISTS "crm_prospects_select_empresa" ON public.crm_prospects;
DROP POLICY IF EXISTS "crm_prospects_insert" ON public.crm_prospects;
DROP POLICY IF EXISTS "crm_prospects_insert_empresa" ON public.crm_prospects;
DROP POLICY IF EXISTS "crm_prospects_update" ON public.crm_prospects;
DROP POLICY IF EXISTS "crm_prospects_update_empresa" ON public.crm_prospects;
DROP POLICY IF EXISTS "crm_prospects_delete" ON public.crm_prospects;
DROP POLICY IF EXISTS "crm_prospects_delete_empresa" ON public.crm_prospects;

-- 3. LIMPAR POLÍTICAS DUPLICADAS/CONFLITANTES DA TABELA CRM_ATIVIDADES
DROP POLICY IF EXISTS "crm_atividades_select" ON public.crm_atividades;
DROP POLICY IF EXISTS "crm_atividades_insert" ON public.crm_atividades;
DROP POLICY IF EXISTS "crm_atividades_update" ON public.crm_atividades;
DROP POLICY IF EXISTS "crm_atividades_delete" ON public.crm_atividades;

-- =========================================
-- MANTER APENAS AS POLÍTICAS CORRETAS CRIADAS NA MIGRAÇÃO ANTERIOR
-- (As políticas *_empresa_users e *_admins_only já estão corretas)
-- =========================================

-- 4. CRIAR PERFIL PARA USUÁRIOS QUE NÃO POSSUEM (DADOS DE EXEMPLO)
-- Nota: Esta correção cria perfis para usuários autenticados sem perfil
-- baseado nos dados de exemplo encontrados nos logs

INSERT INTO public.perfis (user_id, empresa_id, nome, nivel_permissao, ativo)
SELECT 
    '10832734-f383-4932-9069-d4ded2b6d887'::uuid,
    '93d721f5-0407-46eb-9ce0-b4b1eaa19eea'::uuid,
    'PH',
    'operacional'::nivel_permissao,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE user_id = '10832734-f383-4932-9069-d4ded2b6d887'::uuid
);

-- 5. CRIAR STAGES PADRÃO PARA EMPRESAS QUE NÃO POSSUEM
INSERT INTO public.crm_stages (empresa_id, nome, ordem, cor, ativo)
SELECT DISTINCT 
    '93d721f5-0407-46eb-9ce0-b4b1eaa19eea'::uuid,
    stage_data.nome,
    stage_data.ordem,
    stage_data.cor,
    true
FROM (VALUES 
    ('Lead', 1, '#3B82F6'),
    ('Qualificado', 2, '#F59E0B'), 
    ('Proposta', 3, '#F97316'),
    ('Negociação', 4, '#8B5CF6'),
    ('Fechado', 5, '#10B981')
) AS stage_data(nome, ordem, cor)
WHERE NOT EXISTS (
    SELECT 1 FROM public.crm_stages 
    WHERE empresa_id = '93d721f5-0407-46eb-9ce0-b4b1eaa19eea'::uuid
);