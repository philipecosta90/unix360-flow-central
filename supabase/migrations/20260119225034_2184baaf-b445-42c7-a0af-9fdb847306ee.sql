-- Criar tabela cs_stages para etapas do Kanban CS
CREATE TABLE public.cs_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  cor TEXT DEFAULT '#6B7280',
  ativo BOOLEAN DEFAULT true,
  auto_move JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar coluna cs_stage_id na tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN cs_stage_id UUID REFERENCES public.cs_stages(id) ON DELETE SET NULL;

-- Adicionar coluna para data de entrada na etapa atual
ALTER TABLE public.clientes
ADD COLUMN cs_stage_entered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Enable RLS
ALTER TABLE public.cs_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies para cs_stages
CREATE POLICY "Users can view cs_stages from their company"
ON public.cs_stages
FOR SELECT
USING (empresa_id = public.get_active_user_empresa_id());

CREATE POLICY "Admins can insert cs_stages for their company"
ON public.cs_stages
FOR INSERT
WITH CHECK (
  empresa_id = public.get_active_user_empresa_id() 
  AND public.is_company_admin()
);

CREATE POLICY "Admins can update cs_stages from their company"
ON public.cs_stages
FOR UPDATE
USING (
  empresa_id = public.get_active_user_empresa_id() 
  AND public.is_company_admin()
);

CREATE POLICY "Admins can delete cs_stages from their company"
ON public.cs_stages
FOR DELETE
USING (
  empresa_id = public.get_active_user_empresa_id() 
  AND public.is_company_admin()
);

-- Trigger para updated_at
CREATE TRIGGER update_cs_stages_updated_at
BEFORE UPDATE ON public.cs_stages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Função para criar etapas padrão do CS
CREATE OR REPLACE FUNCTION public.create_default_cs_stages_for_company(p_empresa_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Verificar se a empresa já tem etapas CS
  IF NOT EXISTS (SELECT 1 FROM public.cs_stages WHERE empresa_id = p_empresa_id AND ativo = true) THEN
    -- Inserir etapas padrão
    INSERT INTO public.cs_stages (empresa_id, nome, ordem, cor, ativo)
    VALUES 
      (p_empresa_id, 'Onboarding', 1, '#6B7280', true),
      (p_empresa_id, 'Aguardando Anamnese', 2, '#F97316', true),
      (p_empresa_id, 'Em Produção', 3, '#EAB308', true),
      (p_empresa_id, 'Entrega', 4, '#22C55E', true),
      (p_empresa_id, 'Acompanhamento', 5, '#3B82F6', true),
      (p_empresa_id, 'Check-in Semanal', 6, '#6366F1', true),
      (p_empresa_id, 'Reavaliação', 7, '#8B5CF6', true),
      (p_empresa_id, 'Renovação', 8, '#10B981', true);
  END IF;
END;
$$;

-- Índices para performance
CREATE INDEX idx_cs_stages_empresa_id ON public.cs_stages(empresa_id);
CREATE INDEX idx_cs_stages_ordem ON public.cs_stages(ordem);
CREATE INDEX idx_clientes_cs_stage_id ON public.clientes(cs_stage_id);