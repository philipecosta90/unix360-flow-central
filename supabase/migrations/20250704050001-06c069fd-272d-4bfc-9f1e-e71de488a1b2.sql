-- Criar stages padrão para a empresa e corrigir prospect com stage vazio
DO $$
DECLARE
    empresa_id_var uuid := '22b53cc1-e2b2-4005-97d7-f380119d83ec';
    lead_stage_id uuid;
BEGIN
    -- Criar stages padrão se não existirem
    INSERT INTO public.crm_stages (empresa_id, nome, ordem, cor, ativo) VALUES
    (empresa_id_var, 'Lead', 1, '#3B82F6', true),
    (empresa_id_var, 'Qualificado', 2, '#F59E0B', true),
    (empresa_id_var, 'Proposta', 3, '#F97316', true),
    (empresa_id_var, 'Negociação', 4, '#8B5CF6', true),
    (empresa_id_var, 'Fechado', 5, '#10B981', true)
    ON CONFLICT DO NOTHING;
    
    -- Buscar o ID do stage 'Lead'
    SELECT id INTO lead_stage_id 
    FROM public.crm_stages 
    WHERE empresa_id = empresa_id_var AND nome = 'Lead' 
    LIMIT 1;
    
    -- Atualizar prospects com stage vazio para usar o stage 'Lead'
    UPDATE public.crm_prospects 
    SET stage = lead_stage_id::text
    WHERE empresa_id = empresa_id_var 
    AND (stage IS NULL OR stage = '');
    
    RAISE NOTICE 'Stages criados e prospects atualizados para empresa %', empresa_id_var;
END $$;