-- Criar tabela de serviços
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC(10,2) NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'avulso',
  duracao_meses INTEGER DEFAULT 1,
  categoria TEXT DEFAULT 'Serviços',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índice para busca por empresa
CREATE INDEX idx_servicos_empresa_id ON public.servicos(empresa_id);

-- Habilitar RLS
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "servicos_select" ON public.servicos
  FOR SELECT USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

CREATE POLICY "servicos_insert" ON public.servicos
  FOR INSERT WITH CHECK (empresa_id = get_active_user_empresa_id() AND is_active_user());

CREATE POLICY "servicos_update" ON public.servicos
  FOR UPDATE USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

CREATE POLICY "servicos_delete" ON public.servicos
  FOR DELETE USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

-- Bloquear acesso anônimo
CREATE POLICY "block_anonymous_access_servicos" ON public.servicos
  FOR ALL USING (false);

-- Trigger para updated_at
CREATE TRIGGER update_servicos_updated_at
  BEFORE UPDATE ON public.servicos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Adicionar coluna servico_id na tabela financeiro_lancamentos
ALTER TABLE public.financeiro_lancamentos 
  ADD COLUMN servico_id UUID REFERENCES public.servicos(id) ON DELETE SET NULL;