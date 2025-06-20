
-- Criar tabela para armazenar documentos dos clientes
CREATE TABLE IF NOT EXISTS public.cliente_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  cliente_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho INTEGER DEFAULT 0,
  url_arquivo TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cliente_documentos_empresa_id ON public.cliente_documentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cliente_documentos_cliente_id ON public.cliente_documentos(cliente_id);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_cliente_documentos_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_cliente_documentos_updated_at
  BEFORE UPDATE ON public.cliente_documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_cliente_documentos_updated_at();
