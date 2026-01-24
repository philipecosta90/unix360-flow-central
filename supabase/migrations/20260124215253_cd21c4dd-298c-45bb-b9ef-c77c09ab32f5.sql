-- =============================================
-- MÓDULO DIETA - Estrutura Completa
-- =============================================

-- 1. Tabela de Templates de Dieta (planos reutilizáveis)
CREATE TABLE public.dieta_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  objetivo TEXT, -- emagrecimento, hipertrofia, manutenção, etc.
  calorias_total INTEGER,
  proteinas_g NUMERIC(10,2),
  carboidratos_g NUMERIC(10,2),
  gorduras_g NUMERIC(10,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Tabela de Refeições do Template
CREATE TABLE public.dieta_template_refeicoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.dieta_templates(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, -- Café da Manhã, Almoço, etc.
  horario_sugerido TIME,
  ordem INTEGER NOT NULL DEFAULT 1,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela de Alimentos de cada Refeição do Template
CREATE TABLE public.dieta_template_alimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  refeicao_id UUID NOT NULL REFERENCES public.dieta_template_refeicoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  quantidade TEXT, -- "100g", "1 unidade", "2 colheres"
  calorias INTEGER,
  proteinas_g NUMERIC(10,2),
  carboidratos_g NUMERIC(10,2),
  gorduras_g NUMERIC(10,2),
  observacoes TEXT,
  ordem INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabela de Dietas dos Clientes (vincula template ao cliente com personalizações)
CREATE TABLE public.dieta_clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.dieta_templates(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  objetivo TEXT,
  calorias_total INTEGER,
  proteinas_g NUMERIC(10,2),
  carboidratos_g NUMERIC(10,2),
  gorduras_g NUMERIC(10,2),
  data_inicio DATE,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'ativa', -- ativa, pausada, finalizada
  observacoes_profissional TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5. Tabela de Refeições da Dieta do Cliente
CREATE TABLE public.dieta_cliente_refeicoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dieta_id UUID NOT NULL REFERENCES public.dieta_clientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  horario_sugerido TIME,
  ordem INTEGER NOT NULL DEFAULT 1,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Tabela de Alimentos da Dieta do Cliente
CREATE TABLE public.dieta_cliente_alimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  refeicao_id UUID NOT NULL REFERENCES public.dieta_cliente_refeicoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  quantidade TEXT,
  calorias INTEGER,
  proteinas_g NUMERIC(10,2),
  carboidratos_g NUMERIC(10,2),
  gorduras_g NUMERIC(10,2),
  observacoes TEXT,
  ordem INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Histórico de versões das dietas (para manter versões anteriores)
CREATE TABLE public.dieta_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dieta_cliente_id UUID NOT NULL REFERENCES public.dieta_clientes(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL DEFAULT 1,
  dados_completos JSONB NOT NULL, -- snapshot completo da dieta
  motivo_alteracao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- =============================================
-- TRIGGERS para updated_at
-- =============================================

CREATE TRIGGER handle_dieta_templates_updated_at
  BEFORE UPDATE ON public.dieta_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_dieta_clientes_updated_at
  BEFORE UPDATE ON public.dieta_clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ÍNDICES para performance
-- =============================================

CREATE INDEX idx_dieta_templates_empresa ON public.dieta_templates(empresa_id);
CREATE INDEX idx_dieta_clientes_empresa ON public.dieta_clientes(empresa_id);
CREATE INDEX idx_dieta_clientes_cliente ON public.dieta_clientes(cliente_id);
CREATE INDEX idx_dieta_clientes_status ON public.dieta_clientes(status);
CREATE INDEX idx_dieta_historico_dieta ON public.dieta_historico(dieta_cliente_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.dieta_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dieta_template_refeicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dieta_template_alimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dieta_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dieta_cliente_refeicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dieta_cliente_alimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dieta_historico ENABLE ROW LEVEL SECURITY;

-- Políticas para dieta_templates
CREATE POLICY "dieta_templates_select" ON public.dieta_templates
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "dieta_templates_insert" ON public.dieta_templates
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "dieta_templates_update" ON public.dieta_templates
  FOR UPDATE USING (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "dieta_templates_delete" ON public.dieta_templates
  FOR DELETE USING (empresa_id = get_user_empresa_id() AND can_edit_empresa());

-- Políticas para dieta_template_refeicoes (baseado no template pai)
CREATE POLICY "dieta_template_refeicoes_select" ON public.dieta_template_refeicoes
  FOR SELECT USING (
    template_id IN (SELECT id FROM public.dieta_templates WHERE empresa_id = get_user_empresa_id())
  );

CREATE POLICY "dieta_template_refeicoes_insert" ON public.dieta_template_refeicoes
  FOR INSERT WITH CHECK (
    template_id IN (SELECT id FROM public.dieta_templates WHERE empresa_id = get_user_empresa_id()) AND is_active_user()
  );

CREATE POLICY "dieta_template_refeicoes_update" ON public.dieta_template_refeicoes
  FOR UPDATE USING (
    template_id IN (SELECT id FROM public.dieta_templates WHERE empresa_id = get_user_empresa_id()) AND is_active_user()
  );

CREATE POLICY "dieta_template_refeicoes_delete" ON public.dieta_template_refeicoes
  FOR DELETE USING (
    template_id IN (SELECT id FROM public.dieta_templates WHERE empresa_id = get_user_empresa_id()) AND can_edit_empresa()
  );

-- Políticas para dieta_template_alimentos (baseado na refeição pai)
CREATE POLICY "dieta_template_alimentos_select" ON public.dieta_template_alimentos
  FOR SELECT USING (
    refeicao_id IN (
      SELECT r.id FROM public.dieta_template_refeicoes r
      JOIN public.dieta_templates t ON r.template_id = t.id
      WHERE t.empresa_id = get_user_empresa_id()
    )
  );

CREATE POLICY "dieta_template_alimentos_insert" ON public.dieta_template_alimentos
  FOR INSERT WITH CHECK (
    refeicao_id IN (
      SELECT r.id FROM public.dieta_template_refeicoes r
      JOIN public.dieta_templates t ON r.template_id = t.id
      WHERE t.empresa_id = get_user_empresa_id()
    ) AND is_active_user()
  );

CREATE POLICY "dieta_template_alimentos_update" ON public.dieta_template_alimentos
  FOR UPDATE USING (
    refeicao_id IN (
      SELECT r.id FROM public.dieta_template_refeicoes r
      JOIN public.dieta_templates t ON r.template_id = t.id
      WHERE t.empresa_id = get_user_empresa_id()
    ) AND is_active_user()
  );

CREATE POLICY "dieta_template_alimentos_delete" ON public.dieta_template_alimentos
  FOR DELETE USING (
    refeicao_id IN (
      SELECT r.id FROM public.dieta_template_refeicoes r
      JOIN public.dieta_templates t ON r.template_id = t.id
      WHERE t.empresa_id = get_user_empresa_id()
    ) AND can_edit_empresa()
  );

-- Políticas para dieta_clientes
CREATE POLICY "dieta_clientes_select" ON public.dieta_clientes
  FOR SELECT USING (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "dieta_clientes_insert" ON public.dieta_clientes
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "dieta_clientes_update" ON public.dieta_clientes
  FOR UPDATE USING (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "dieta_clientes_delete" ON public.dieta_clientes
  FOR DELETE USING (empresa_id = get_user_empresa_id() AND can_edit_empresa());

-- Políticas para dieta_cliente_refeicoes
CREATE POLICY "dieta_cliente_refeicoes_select" ON public.dieta_cliente_refeicoes
  FOR SELECT USING (
    dieta_id IN (SELECT id FROM public.dieta_clientes WHERE empresa_id = get_user_empresa_id())
  );

CREATE POLICY "dieta_cliente_refeicoes_insert" ON public.dieta_cliente_refeicoes
  FOR INSERT WITH CHECK (
    dieta_id IN (SELECT id FROM public.dieta_clientes WHERE empresa_id = get_user_empresa_id()) AND is_active_user()
  );

CREATE POLICY "dieta_cliente_refeicoes_update" ON public.dieta_cliente_refeicoes
  FOR UPDATE USING (
    dieta_id IN (SELECT id FROM public.dieta_clientes WHERE empresa_id = get_user_empresa_id()) AND is_active_user()
  );

CREATE POLICY "dieta_cliente_refeicoes_delete" ON public.dieta_cliente_refeicoes
  FOR DELETE USING (
    dieta_id IN (SELECT id FROM public.dieta_clientes WHERE empresa_id = get_user_empresa_id()) AND can_edit_empresa()
  );

-- Políticas para dieta_cliente_alimentos
CREATE POLICY "dieta_cliente_alimentos_select" ON public.dieta_cliente_alimentos
  FOR SELECT USING (
    refeicao_id IN (
      SELECT r.id FROM public.dieta_cliente_refeicoes r
      JOIN public.dieta_clientes d ON r.dieta_id = d.id
      WHERE d.empresa_id = get_user_empresa_id()
    )
  );

CREATE POLICY "dieta_cliente_alimentos_insert" ON public.dieta_cliente_alimentos
  FOR INSERT WITH CHECK (
    refeicao_id IN (
      SELECT r.id FROM public.dieta_cliente_refeicoes r
      JOIN public.dieta_clientes d ON r.dieta_id = d.id
      WHERE d.empresa_id = get_user_empresa_id()
    ) AND is_active_user()
  );

CREATE POLICY "dieta_cliente_alimentos_update" ON public.dieta_cliente_alimentos
  FOR UPDATE USING (
    refeicao_id IN (
      SELECT r.id FROM public.dieta_cliente_refeicoes r
      JOIN public.dieta_clientes d ON r.dieta_id = d.id
      WHERE d.empresa_id = get_user_empresa_id()
    ) AND is_active_user()
  );

CREATE POLICY "dieta_cliente_alimentos_delete" ON public.dieta_cliente_alimentos
  FOR DELETE USING (
    refeicao_id IN (
      SELECT r.id FROM public.dieta_cliente_refeicoes r
      JOIN public.dieta_clientes d ON r.dieta_id = d.id
      WHERE d.empresa_id = get_user_empresa_id()
    ) AND can_edit_empresa()
  );

-- Políticas para dieta_historico
CREATE POLICY "dieta_historico_select" ON public.dieta_historico
  FOR SELECT USING (
    dieta_cliente_id IN (SELECT id FROM public.dieta_clientes WHERE empresa_id = get_user_empresa_id())
  );

CREATE POLICY "dieta_historico_insert" ON public.dieta_historico
  FOR INSERT WITH CHECK (
    dieta_cliente_id IN (SELECT id FROM public.dieta_clientes WHERE empresa_id = get_user_empresa_id()) AND is_active_user()
  );