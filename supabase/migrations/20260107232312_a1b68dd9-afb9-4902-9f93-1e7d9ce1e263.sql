-- Adicionar campo aviso_final na tabela anamnese_templates
ALTER TABLE anamnese_templates 
ADD COLUMN aviso_final TEXT NULL;

COMMENT ON COLUMN anamnese_templates.aviso_final IS 'Texto de avisos importantes exibido ao cliente no final do questionário';