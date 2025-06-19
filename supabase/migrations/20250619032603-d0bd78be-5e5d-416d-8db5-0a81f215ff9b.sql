
-- Criar tabela para onboarding dos clientes
CREATE TABLE public.cs_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 1,
  concluido BOOLEAN NOT NULL DEFAULT false,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  responsavel_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para interações de CS
CREATE TABLE public.cs_interacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'call', 'email', 'meeting', 'feedback', 'other'
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_interacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responsavel_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para NPS
CREATE TABLE public.cs_nps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL CHECK (nota >= 0 AND nota <= 10),
  comentario TEXT,
  data_resposta TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responsavel_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.cs_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cs_nps ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cs_onboarding
CREATE POLICY "Usuários podem ver onboarding da sua empresa"
  ON public.cs_onboarding
  FOR SELECT
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem inserir onboarding na sua empresa"
  ON public.cs_onboarding
  FOR INSERT
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem atualizar onboarding da sua empresa"
  ON public.cs_onboarding
  FOR UPDATE
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem deletar onboarding da sua empresa"
  ON public.cs_onboarding
  FOR DELETE
  USING (empresa_id = public.get_user_empresa_id());

-- Políticas RLS para cs_interacoes
CREATE POLICY "Usuários podem ver interações da sua empresa"
  ON public.cs_interacoes
  FOR SELECT
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem inserir interações na sua empresa"
  ON public.cs_interacoes
  FOR INSERT
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem atualizar interações da sua empresa"
  ON public.cs_interacoes
  FOR UPDATE
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem deletar interações da sua empresa"
  ON public.cs_interacoes
  FOR DELETE
  USING (empresa_id = public.get_user_empresa_id());

-- Políticas RLS para cs_nps
CREATE POLICY "Usuários podem ver NPS da sua empresa"
  ON public.cs_nps
  FOR SELECT
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem inserir NPS na sua empresa"
  ON public.cs_nps
  FOR INSERT
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem atualizar NPS da sua empresa"
  ON public.cs_nps
  FOR UPDATE
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem deletar NPS da sua empresa"
  ON public.cs_nps
  FOR DELETE
  USING (empresa_id = public.get_user_empresa_id());

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER cs_onboarding_updated_at
  BEFORE UPDATE ON public.cs_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER cs_interacoes_updated_at
  BEFORE UPDATE ON public.cs_interacoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Criar índices para melhor performance
CREATE INDEX idx_cs_onboarding_empresa_cliente ON public.cs_onboarding(empresa_id, cliente_id);
CREATE INDEX idx_cs_interacoes_empresa_cliente ON public.cs_interacoes(empresa_id, cliente_id);
CREATE INDEX idx_cs_nps_empresa_cliente ON public.cs_nps(empresa_id, cliente_id);
CREATE INDEX idx_cs_interacoes_data ON public.cs_interacoes(data_interacao);
CREATE INDEX idx_cs_nps_data ON public.cs_nps(data_resposta);
