
-- Create CRM prospects table
CREATE TABLE public.crm_prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  empresa_cliente TEXT,
  cargo TEXT,
  stage TEXT NOT NULL DEFAULT 'lead',
  valor_estimado DECIMAL(10,2),
  origem TEXT,
  tags TEXT[] DEFAULT '{}',
  responsavel_id UUID REFERENCES public.perfis(id),
  proximo_followup DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.perfis(id)
);

-- Create CRM stages table for customizable pipeline
CREATE TABLE public.crm_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  cor TEXT DEFAULT '#gray',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CRM activities table for tracking interactions
CREATE TABLE public.crm_atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id UUID NOT NULL REFERENCES public.crm_prospects(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'call', 'email', 'meeting', 'note', 'stage_change'
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_atividade TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.perfis(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.crm_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_atividades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_prospects
CREATE POLICY "Users can view company prospects" 
  ON public.crm_prospects 
  FOR SELECT 
  USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

CREATE POLICY "Users can create company prospects" 
  ON public.crm_prospects 
  FOR INSERT 
  WITH CHECK (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

CREATE POLICY "Users can update company prospects" 
  ON public.crm_prospects 
  FOR UPDATE 
  USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete company prospects" 
  ON public.crm_prospects 
  FOR DELETE 
  USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

-- RLS Policies for crm_stages
CREATE POLICY "Users can view company stages" 
  ON public.crm_stages 
  FOR SELECT 
  USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

CREATE POLICY "Users can create company stages" 
  ON public.crm_stages 
  FOR INSERT 
  WITH CHECK (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

CREATE POLICY "Users can update company stages" 
  ON public.crm_stages 
  FOR UPDATE 
  USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete company stages" 
  ON public.crm_stages 
  FOR DELETE 
  USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

-- RLS Policies for crm_atividades
CREATE POLICY "Users can view company activities" 
  ON public.crm_atividades 
  FOR SELECT 
  USING (prospect_id IN (
    SELECT id FROM public.crm_prospects 
    WHERE empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can create company activities" 
  ON public.crm_atividades 
  FOR INSERT 
  WITH CHECK (prospect_id IN (
    SELECT id FROM public.crm_prospects 
    WHERE empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can update company activities" 
  ON public.crm_atividades 
  FOR UPDATE 
  USING (prospect_id IN (
    SELECT id FROM public.crm_prospects 
    WHERE empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can delete company activities" 
  ON public.crm_atividades 
  FOR DELETE 
  USING (prospect_id IN (
    SELECT id FROM public.crm_prospects 
    WHERE empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid())
  ));

-- Insert default stages for new companies
INSERT INTO public.crm_stages (empresa_id, nome, ordem, cor) 
SELECT DISTINCT empresa_id, 'Lead', 1, '#3B82F6' FROM public.perfis;

INSERT INTO public.crm_stages (empresa_id, nome, ordem, cor) 
SELECT DISTINCT empresa_id, 'Contatado', 2, '#F59E0B' FROM public.perfis;

INSERT INTO public.crm_stages (empresa_id, nome, ordem, cor) 
SELECT DISTINCT empresa_id, 'Proposta Enviada', 3, '#F97316' FROM public.perfis;

INSERT INTO public.crm_stages (empresa_id, nome, ordem, cor) 
SELECT DISTINCT empresa_id, 'Negociação', 4, '#8B5CF6' FROM public.perfis;

INSERT INTO public.crm_stages (empresa_id, nome, ordem, cor) 
SELECT DISTINCT empresa_id, 'Fechado', 5, '#10B981' FROM public.perfis;

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_crm_prospects_updated_at
    BEFORE UPDATE ON public.crm_prospects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_crm_stages_updated_at
    BEFORE UPDATE ON public.crm_stages
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
