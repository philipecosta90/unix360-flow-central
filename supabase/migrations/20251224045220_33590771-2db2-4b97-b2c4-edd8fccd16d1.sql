-- Adicionar política pública para anamnese_templates
-- Permite acesso público apenas a templates que têm envios pendentes não expirados
CREATE POLICY "anamnese_templates_public_select" 
ON anamnese_templates 
FOR SELECT 
USING (
  id IN (
    SELECT template_id FROM anamnese_envios 
    WHERE status = 'pendente' 
    AND expira_em > now()
  )
);

-- Adicionar política pública para anamnese_perguntas
-- Permite acesso público apenas a perguntas de templates com envios pendentes válidos
CREATE POLICY "anamnese_perguntas_public_select" 
ON anamnese_perguntas 
FOR SELECT 
USING (
  template_id IN (
    SELECT template_id FROM anamnese_envios 
    WHERE status = 'pendente' 
    AND expira_em > now()
  )
);