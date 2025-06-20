
-- Add configuracoes_nicho column to empresas table to store niche configurations
ALTER TABLE public.empresas 
ADD COLUMN configuracoes_nicho JSONB;

-- Add a comment to describe the column
COMMENT ON COLUMN public.empresas.configuracoes_nicho IS 'Stores niche configuration settings as JSON including niche type, config details, and last updated timestamp';
