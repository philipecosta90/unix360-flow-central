-- Adicionar coluna wuzapi_id para referenciar o ID da instância na API WUZAPI
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS wuzapi_id TEXT;