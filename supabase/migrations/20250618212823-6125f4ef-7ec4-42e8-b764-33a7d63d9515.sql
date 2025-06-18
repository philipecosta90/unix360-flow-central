
-- Lançamentos financeiros
CREATE TABLE public.financeiro_lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  categoria TEXT NOT NULL,
  data DATE NOT NULL,
  a_receber BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.perfis(id)
);

-- RLS: Segurança por empresa
ALTER TABLE public.financeiro_lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Selecionar dados da empresa" ON public.financeiro_lancamentos
FOR SELECT USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

CREATE POLICY "Inserir dados da empresa" ON public.financeiro_lancamentos
FOR INSERT WITH CHECK (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

CREATE POLICY "Atualizar dados da empresa" ON public.financeiro_lancamentos
FOR UPDATE USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

CREATE POLICY "Excluir dados da empresa" ON public.financeiro_lancamentos
FOR DELETE USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_financeiro_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_financeiro_updated_at
BEFORE UPDATE ON public.financeiro_lancamentos
FOR EACH ROW EXECUTE FUNCTION public.handle_financeiro_updated_at();
