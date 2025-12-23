-- Tabela de histórico de renovações de plano
CREATE TABLE public.historico_renovacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL,
  data_inicio_plano date NOT NULL,
  data_fim_plano date NOT NULL,
  periodo_dias integer NOT NULL,
  periodo_label text NOT NULL,
  renovado_por uuid REFERENCES public.perfis(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.historico_renovacoes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "historico_renovacoes_select"
ON public.historico_renovacoes
FOR SELECT
USING (empresa_id = get_active_user_empresa_id() AND is_active_user());

CREATE POLICY "historico_renovacoes_insert"
ON public.historico_renovacoes
FOR INSERT
WITH CHECK (empresa_id = get_active_user_empresa_id() AND is_active_user());

CREATE POLICY "historico_renovacoes_delete"
ON public.historico_renovacoes
FOR DELETE
USING (empresa_id = get_active_user_empresa_id() AND is_active_user() AND is_admin());

-- Bloquear acesso anônimo
CREATE POLICY "block_anonymous_access_historico"
ON public.historico_renovacoes
FOR ALL
USING (false);

-- Índice para busca por cliente
CREATE INDEX idx_historico_renovacoes_cliente ON public.historico_renovacoes(cliente_id);
CREATE INDEX idx_historico_renovacoes_empresa ON public.historico_renovacoes(empresa_id);