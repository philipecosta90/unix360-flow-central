-- =============================================
-- SISTEMA DE CHECK-INS INTELIGENTES
-- =============================================

-- 1. Templates de Check-in (questionários de acompanhamento)
CREATE TABLE public.checkin_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Perguntas com sistema de pontuação
CREATE TABLE public.checkin_perguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.checkin_templates(id) ON DELETE CASCADE,
  secao TEXT NOT NULL,
  secao_icone TEXT,
  ordem INT NOT NULL,
  pergunta TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'likert_5', -- 'likert_5', 'likert_10', 'texto', 'numero', 'foto', 'arquivo', 'select_pontuado'
  pontos_maximo INT DEFAULT 0,
  opcoes_pontuacao JSONB, -- {"Ótimo": 10, "Bom": 7, "Regular": 4, "Ruim": 1}
  obrigatoria BOOLEAN DEFAULT true,
  placeholder TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Agendamentos de envio recorrente
CREATE TABLE public.checkin_agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.checkin_templates(id) ON DELETE CASCADE,
  frequencia TEXT NOT NULL DEFAULT 'semanal', -- 'diario', 'semanal', 'quinzenal', 'mensal', 'personalizado'
  intervalo_dias INT, -- para frequência personalizada
  proximo_envio DATE NOT NULL,
  hora_envio TIME DEFAULT '09:00',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Envios realizados
CREATE TABLE public.checkin_envios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.checkin_templates(id),
  agendamento_id UUID REFERENCES public.checkin_agendamentos(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'parcial', 'completo', 'expirado'
  pontuacao_total INT DEFAULT 0,
  pontuacao_maxima INT DEFAULT 0,
  enviado_em TIMESTAMPTZ DEFAULT now(),
  respondido_em TIMESTAMPTZ,
  expira_em TIMESTAMPTZ NOT NULL,
  revisado BOOLEAN DEFAULT false,
  anotacoes_profissional TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Respostas individuais com pontuação
CREATE TABLE public.checkin_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envio_id UUID NOT NULL REFERENCES public.checkin_envios(id) ON DELETE CASCADE,
  pergunta_id UUID NOT NULL REFERENCES public.checkin_perguntas(id),
  resposta TEXT,
  resposta_arquivo TEXT, -- URL para arquivos/fotos
  pontuacao INT DEFAULT 0,
  indicador_visual TEXT, -- 'verde', 'amarelo', 'vermelho'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Fotos de evolução (separado para galeria)
CREATE TABLE public.evolucao_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL DEFAULT 'outro', -- 'frente', 'costas', 'lateral', 'refeicao', 'outro'
  url_arquivo TEXT NOT NULL,
  data_foto DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ENABLE RLS
-- =============================================
ALTER TABLE public.checkin_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolucao_fotos ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - checkin_templates
-- =============================================
CREATE POLICY "checkin_templates_select" ON public.checkin_templates
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "checkin_templates_insert" ON public.checkin_templates
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "checkin_templates_update" ON public.checkin_templates
  FOR UPDATE USING (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "checkin_templates_delete" ON public.checkin_templates
  FOR DELETE USING (empresa_id = get_user_empresa_id() AND is_admin());

-- =============================================
-- RLS POLICIES - checkin_perguntas
-- =============================================
CREATE POLICY "checkin_perguntas_select" ON public.checkin_perguntas
  FOR SELECT USING (
    template_id IN (SELECT id FROM public.checkin_templates WHERE empresa_id = get_user_empresa_id())
  );

CREATE POLICY "checkin_perguntas_public_select" ON public.checkin_perguntas
  FOR SELECT USING (
    template_id IN (
      SELECT template_id FROM public.checkin_envios 
      WHERE status IN ('pendente', 'parcial') AND expira_em > now()
    )
  );

CREATE POLICY "checkin_perguntas_insert" ON public.checkin_perguntas
  FOR INSERT WITH CHECK (
    template_id IN (SELECT id FROM public.checkin_templates WHERE empresa_id = get_user_empresa_id())
    AND is_active_user()
  );

CREATE POLICY "checkin_perguntas_update" ON public.checkin_perguntas
  FOR UPDATE USING (
    template_id IN (SELECT id FROM public.checkin_templates WHERE empresa_id = get_user_empresa_id())
    AND is_active_user()
  );

CREATE POLICY "checkin_perguntas_delete" ON public.checkin_perguntas
  FOR DELETE USING (
    template_id IN (SELECT id FROM public.checkin_templates WHERE empresa_id = get_user_empresa_id())
    AND is_admin()
  );

-- =============================================
-- RLS POLICIES - checkin_agendamentos
-- =============================================
CREATE POLICY "checkin_agendamentos_select" ON public.checkin_agendamentos
  FOR SELECT USING (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "checkin_agendamentos_insert" ON public.checkin_agendamentos
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "checkin_agendamentos_update" ON public.checkin_agendamentos
  FOR UPDATE USING (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "checkin_agendamentos_delete" ON public.checkin_agendamentos
  FOR DELETE USING (empresa_id = get_user_empresa_id() AND is_active_user());

-- =============================================
-- RLS POLICIES - checkin_envios
-- =============================================
CREATE POLICY "checkin_envios_select" ON public.checkin_envios
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "checkin_envios_public_select" ON public.checkin_envios
  FOR SELECT USING (true); -- para acesso via token

CREATE POLICY "checkin_envios_insert" ON public.checkin_envios
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "checkin_envios_update" ON public.checkin_envios
  FOR UPDATE USING (empresa_id = get_user_empresa_id() OR status IN ('pendente', 'parcial'));

CREATE POLICY "checkin_envios_delete" ON public.checkin_envios
  FOR DELETE USING (empresa_id = get_user_empresa_id() AND is_admin());

-- =============================================
-- RLS POLICIES - checkin_respostas
-- =============================================
CREATE POLICY "checkin_respostas_select" ON public.checkin_respostas
  FOR SELECT USING (
    envio_id IN (SELECT id FROM public.checkin_envios WHERE empresa_id = get_user_empresa_id())
  );

CREATE POLICY "checkin_respostas_insert_public" ON public.checkin_respostas
  FOR INSERT WITH CHECK (true); -- permite inserção via formulário público

CREATE POLICY "checkin_respostas_delete" ON public.checkin_respostas
  FOR DELETE USING (
    envio_id IN (SELECT id FROM public.checkin_envios WHERE empresa_id = get_user_empresa_id())
    AND is_admin()
  );

-- =============================================
-- RLS POLICIES - evolucao_fotos
-- =============================================
CREATE POLICY "evolucao_fotos_select" ON public.evolucao_fotos
  FOR SELECT USING (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "evolucao_fotos_insert" ON public.evolucao_fotos
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id() OR true); -- permite upload público

CREATE POLICY "evolucao_fotos_delete" ON public.evolucao_fotos
  FOR DELETE USING (empresa_id = get_user_empresa_id() AND is_active_user());

-- =============================================
-- TRIGGERS para updated_at
-- =============================================
CREATE TRIGGER update_checkin_templates_updated_at
  BEFORE UPDATE ON public.checkin_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_checkin_agendamentos_updated_at
  BEFORE UPDATE ON public.checkin_agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- INDEXES para performance
-- =============================================
CREATE INDEX idx_checkin_templates_empresa ON public.checkin_templates(empresa_id);
CREATE INDEX idx_checkin_perguntas_template ON public.checkin_perguntas(template_id);
CREATE INDEX idx_checkin_agendamentos_cliente ON public.checkin_agendamentos(cliente_id);
CREATE INDEX idx_checkin_agendamentos_proximo ON public.checkin_agendamentos(proximo_envio) WHERE ativo = true;
CREATE INDEX idx_checkin_envios_cliente ON public.checkin_envios(cliente_id);
CREATE INDEX idx_checkin_envios_token ON public.checkin_envios(token);
CREATE INDEX idx_checkin_envios_status ON public.checkin_envios(status);
CREATE INDEX idx_checkin_respostas_envio ON public.checkin_respostas(envio_id);
CREATE INDEX idx_evolucao_fotos_cliente ON public.evolucao_fotos(cliente_id);