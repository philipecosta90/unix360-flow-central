-- Adicionar etapa FECHADO nas empresas que já têm stages criados
INSERT INTO public.crm_stages (nome, ordem, cor, empresa_id, ativo)
SELECT 'FECHADO', 7, '#10B981', empresa_id, true
FROM public.crm_stages 
WHERE nome = 'NEGOCIAÇÃO'
AND NOT EXISTS (
    SELECT 1 FROM public.crm_stages cs2 
    WHERE cs2.empresa_id = crm_stages.empresa_id 
    AND cs2.nome = 'FECHADO'
)
GROUP BY empresa_id;