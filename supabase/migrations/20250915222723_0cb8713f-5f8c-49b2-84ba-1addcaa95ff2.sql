-- Inserir etapas padrão para todas as empresas que não têm etapas de CRM
INSERT INTO public.crm_stages (empresa_id, nome, ordem, cor, ativo)
SELECT 
  e.id as empresa_id,
  stage_data.nome,
  stage_data.ordem,
  stage_data.cor,
  true as ativo
FROM public.empresas e
CROSS JOIN (
  VALUES 
    ('INBOX', 1, '#6B7280'),
    ('LEAD', 2, '#3B82F6'),
    ('QUALIFICAÇÃO', 3, '#F59E0B'),
    ('CONTATO INICIAL', 4, '#F97316'),
    ('PROPOSTA ENVIADA', 5, '#8B5CF6'),
    ('NEGOCIAÇÃO', 6, '#EC4899'),
    ('FECHADO', 7, '#10B981')
) AS stage_data(nome, ordem, cor)
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_stages cs 
  WHERE cs.empresa_id = e.id AND cs.ativo = true
);

-- Criar função para garantir etapas padrão em novas empresas
CREATE OR REPLACE FUNCTION public.create_default_crm_stages_for_company(p_empresa_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Verificar se a empresa já tem etapas
  IF NOT EXISTS (SELECT 1 FROM public.crm_stages WHERE empresa_id = p_empresa_id AND ativo = true) THEN
    -- Inserir etapas padrão
    INSERT INTO public.crm_stages (empresa_id, nome, ordem, cor, ativo)
    VALUES 
      (p_empresa_id, 'INBOX', 1, '#6B7280', true),
      (p_empresa_id, 'LEAD', 2, '#3B82F6', true),
      (p_empresa_id, 'QUALIFICAÇÃO', 3, '#F59E0B', true),
      (p_empresa_id, 'CONTATO INICIAL', 4, '#F97316', true),
      (p_empresa_id, 'PROPOSTA ENVIADA', 5, '#8B5CF6', true),
      (p_empresa_id, 'NEGOCIAÇÃO', 6, '#EC4899', true),
      (p_empresa_id, 'FECHADO', 7, '#10B981', true);
  END IF;
END;
$function$;

-- Criar trigger para automaticamente criar etapas quando uma nova empresa é criada
CREATE OR REPLACE FUNCTION public.handle_new_empresa_crm_stages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Criar etapas padrão para a nova empresa
  PERFORM public.create_default_crm_stages_for_company(NEW.id);
  RETURN NEW;
END;
$function$;

-- Criar o trigger na tabela empresas
DROP TRIGGER IF EXISTS create_crm_stages_on_new_empresa ON public.empresas;
CREATE TRIGGER create_crm_stages_on_new_empresa
  AFTER INSERT ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_empresa_crm_stages();