-- Criar tabela para registrar vendas fechadas
CREATE TABLE public.vendas_fechadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  valor_fechado NUMERIC,
  data_fechamento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observacoes TEXT,
  responsavel_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.vendas_fechadas ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "vendas_fechadas_select" 
ON public.vendas_fechadas 
FOR SELECT 
USING ((empresa_id = get_active_user_empresa_id()) AND is_active_user());

CREATE POLICY "vendas_fechadas_insert" 
ON public.vendas_fechadas 
FOR INSERT 
WITH CHECK ((empresa_id = get_active_user_empresa_id()) AND is_active_user());

CREATE POLICY "vendas_fechadas_update" 
ON public.vendas_fechadas 
FOR UPDATE 
USING ((empresa_id = get_active_user_empresa_id()) AND is_active_user());

CREATE POLICY "vendas_fechadas_delete" 
ON public.vendas_fechadas 
FOR DELETE 
USING ((empresa_id = get_active_user_empresa_id()) AND is_active_user());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vendas_fechadas_updated_at
BEFORE UPDATE ON public.vendas_fechadas
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();