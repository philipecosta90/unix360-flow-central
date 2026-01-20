-- Tabela para armazenar dados semanais do Planner
CREATE TABLE public.cs_planner_semanas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  semana_numero INTEGER NOT NULL,
  micro_meta TEXT,
  checkin_realizado BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, cliente_id, semana_numero)
);

-- Adicionar colunas do Planner na tabela clientes
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS tipo_contrato TEXT,
ADD COLUMN IF NOT EXISTS ciclo_atual INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS semana_atual INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS ultimo_contato DATE,
ADD COLUMN IF NOT EXISTS planner_obs TEXT;

-- Enable RLS
ALTER TABLE public.cs_planner_semanas ENABLE ROW LEVEL SECURITY;

-- Policies para cs_planner_semanas
CREATE POLICY "Users can view planner data from their company" 
ON public.cs_planner_semanas 
FOR SELECT 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Users can insert planner data for their company" 
ON public.cs_planner_semanas 
FOR INSERT 
WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Users can update planner data from their company" 
ON public.cs_planner_semanas 
FOR UPDATE 
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Users can delete planner data from their company" 
ON public.cs_planner_semanas 
FOR DELETE 
USING (empresa_id = public.get_user_empresa_id());

-- Trigger para updated_at
CREATE TRIGGER update_cs_planner_semanas_updated_at
BEFORE UPDATE ON public.cs_planner_semanas
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Index para performance
CREATE INDEX idx_cs_planner_semanas_cliente ON public.cs_planner_semanas(cliente_id);
CREATE INDEX idx_cs_planner_semanas_empresa ON public.cs_planner_semanas(empresa_id);