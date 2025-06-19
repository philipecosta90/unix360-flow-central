
-- ✅ ETAPA 1: Estrutura da tabela financeiro_tarefas

CREATE TABLE public.financeiro_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id UUID NULL REFERENCES public.crm_prospects(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  vencimento DATE NOT NULL,
  concluida BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.perfis(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ✅ ETAPA 2: Segurança (Row-Level Security)

ALTER TABLE public.financeiro_tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Selecionar tarefas da empresa" 
  ON public.financeiro_tarefas
  FOR SELECT
  USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

CREATE POLICY "Inserir tarefas da empresa"
  ON public.financeiro_tarefas
  FOR INSERT
  WITH CHECK (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

CREATE POLICY "Atualizar tarefas da empresa"
  ON public.financeiro_tarefas
  FOR UPDATE
  USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

CREATE POLICY "Excluir tarefas da empresa"
  ON public.financeiro_tarefas
  FOR DELETE
  USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

-- ✅ ETAPA 3: Trigger para updated_at

CREATE OR REPLACE FUNCTION public.handle_tarefas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tarefas_updated_at
BEFORE UPDATE ON public.financeiro_tarefas
FOR EACH ROW EXECUTE FUNCTION public.handle_tarefas_updated_at();
