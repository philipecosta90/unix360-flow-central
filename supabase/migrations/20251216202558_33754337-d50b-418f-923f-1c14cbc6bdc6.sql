-- =============================================
-- SISTEMA DE ANAMNESE - TABELAS E ESTRUTURA
-- =============================================

-- 1. Tabela de templates de anamnese
CREATE TABLE public.anamnese_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabela de perguntas dos templates
CREATE TABLE public.anamnese_perguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.anamnese_templates(id) ON DELETE CASCADE,
  secao TEXT NOT NULL,
  secao_icone TEXT,
  ordem INTEGER NOT NULL,
  pergunta TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'text', -- text, textarea, number, date, email, select
  opcoes JSONB, -- para selects: ["Opção 1", "Opção 2"]
  obrigatoria BOOLEAN DEFAULT true,
  placeholder TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabela de envios de anamnese
CREATE TABLE public.anamnese_envios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.anamnese_templates(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, preenchido, expirado
  enviado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  preenchido_em TIMESTAMP WITH TIME ZONE,
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabela de respostas
CREATE TABLE public.anamnese_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envio_id UUID NOT NULL REFERENCES public.anamnese_envios(id) ON DELETE CASCADE,
  pergunta_id UUID NOT NULL REFERENCES public.anamnese_perguntas(id),
  resposta TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_anamnese_templates_empresa ON public.anamnese_templates(empresa_id);
CREATE INDEX idx_anamnese_perguntas_template ON public.anamnese_perguntas(template_id);
CREATE INDEX idx_anamnese_envios_empresa ON public.anamnese_envios(empresa_id);
CREATE INDEX idx_anamnese_envios_cliente ON public.anamnese_envios(cliente_id);
CREATE INDEX idx_anamnese_envios_token ON public.anamnese_envios(token);
CREATE INDEX idx_anamnese_respostas_envio ON public.anamnese_respostas(envio_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.anamnese_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnese_perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnese_envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnese_respostas ENABLE ROW LEVEL SECURITY;

-- Políticas para anamnese_templates
CREATE POLICY "anamnese_templates_select" ON public.anamnese_templates
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "anamnese_templates_insert" ON public.anamnese_templates
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id() AND is_admin());

CREATE POLICY "anamnese_templates_update" ON public.anamnese_templates
  FOR UPDATE USING (empresa_id = get_user_empresa_id() AND is_admin());

CREATE POLICY "anamnese_templates_delete" ON public.anamnese_templates
  FOR DELETE USING (empresa_id = get_user_empresa_id() AND is_admin());

-- Políticas para anamnese_perguntas (herda do template)
CREATE POLICY "anamnese_perguntas_select" ON public.anamnese_perguntas
  FOR SELECT USING (
    template_id IN (SELECT id FROM public.anamnese_templates WHERE empresa_id = get_user_empresa_id())
  );

CREATE POLICY "anamnese_perguntas_insert" ON public.anamnese_perguntas
  FOR INSERT WITH CHECK (
    template_id IN (SELECT id FROM public.anamnese_templates WHERE empresa_id = get_user_empresa_id()) AND is_admin()
  );

CREATE POLICY "anamnese_perguntas_update" ON public.anamnese_perguntas
  FOR UPDATE USING (
    template_id IN (SELECT id FROM public.anamnese_templates WHERE empresa_id = get_user_empresa_id()) AND is_admin()
  );

CREATE POLICY "anamnese_perguntas_delete" ON public.anamnese_perguntas
  FOR DELETE USING (
    template_id IN (SELECT id FROM public.anamnese_templates WHERE empresa_id = get_user_empresa_id()) AND is_admin()
  );

-- Políticas para anamnese_envios
CREATE POLICY "anamnese_envios_select" ON public.anamnese_envios
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "anamnese_envios_insert" ON public.anamnese_envios
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "anamnese_envios_update" ON public.anamnese_envios
  FOR UPDATE USING (empresa_id = get_user_empresa_id());

CREATE POLICY "anamnese_envios_delete" ON public.anamnese_envios
  FOR DELETE USING (empresa_id = get_user_empresa_id() AND is_admin());

-- Política especial para acesso público via token (para submissão)
CREATE POLICY "anamnese_envios_public_select" ON public.anamnese_envios
  FOR SELECT USING (true); -- Token validation done in edge function

-- Políticas para anamnese_respostas (herda do envio)
CREATE POLICY "anamnese_respostas_select" ON public.anamnese_respostas
  FOR SELECT USING (
    envio_id IN (SELECT id FROM public.anamnese_envios WHERE empresa_id = get_user_empresa_id())
  );

CREATE POLICY "anamnese_respostas_insert_public" ON public.anamnese_respostas
  FOR INSERT WITH CHECK (true); -- Validação feita na edge function

CREATE POLICY "anamnese_respostas_delete" ON public.anamnese_respostas
  FOR DELETE USING (
    envio_id IN (SELECT id FROM public.anamnese_envios WHERE empresa_id = get_user_empresa_id()) AND is_admin()
  );

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE TRIGGER update_anamnese_templates_updated_at
  BEFORE UPDATE ON public.anamnese_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_anamnese_envios_updated_at
  BEFORE UPDATE ON public.anamnese_envios
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- FUNÇÃO PARA CRIAR TEMPLATE PADRÃO FITNESS
-- =============================================

CREATE OR REPLACE FUNCTION public.create_default_anamnese_template_for_company(p_empresa_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_template_id UUID;
BEGIN
  -- Verificar se já existe template para esta empresa
  SELECT id INTO v_template_id 
  FROM public.anamnese_templates 
  WHERE empresa_id = p_empresa_id AND ativo = true
  LIMIT 1;
  
  IF v_template_id IS NOT NULL THEN
    RETURN v_template_id;
  END IF;

  -- Criar template padrão
  INSERT INTO public.anamnese_templates (empresa_id, nome, descricao, ativo)
  VALUES (
    p_empresa_id,
    'Anamnese Fitness Padrão',
    'Parabéns pela decisão, seja muito bem vindo a sua nova família! 

Gostaria de lhe desejar as boas vindas. Esse é o primeiro passo no caminho em direção aos seus objetivos.

📋 Instruções importantes:
• Responda as perguntas com o máximo de detalhes e informações possíveis
• Não omita informações - somos um time!
• Reserve um tempo para responder com calma
• Lembre-se: este questionário é nossa base inicial para entender sua condição atual',
    true
  )
  RETURNING id INTO v_template_id;

  -- Inserir perguntas - Seção: Dados Pessoais
  INSERT INTO public.anamnese_perguntas (template_id, secao, secao_icone, ordem, pergunta, tipo, obrigatoria, placeholder) VALUES
  (v_template_id, 'Dados Pessoais', '👤', 1, 'Nome completo', 'text', true, NULL),
  (v_template_id, 'Dados Pessoais', '👤', 2, 'Data de nascimento', 'date', true, NULL),
  (v_template_id, 'Dados Pessoais', '👤', 3, 'Peso atual (kg)', 'number', true, 'Ex: 75.5'),
  (v_template_id, 'Dados Pessoais', '👤', 4, 'Altura (cm)', 'number', true, 'Ex: 175'),
  (v_template_id, 'Dados Pessoais', '👤', 5, 'Cidade/Estado', 'text', true, NULL),
  (v_template_id, 'Dados Pessoais', '👤', 6, 'E-mail', 'email', true, NULL),
  (v_template_id, 'Dados Pessoais', '👤', 7, 'Instagram', 'text', false, '@seuusuario'),
  (v_template_id, 'Dados Pessoais', '👤', 8, 'Profissão', 'text', true, NULL);

  -- Inserir perguntas - Seção: Objetivos e Estilo de Vida
  INSERT INTO public.anamnese_perguntas (template_id, secao, secao_icone, ordem, pergunta, tipo, obrigatoria, placeholder, opcoes) VALUES
  (v_template_id, 'Objetivos e Estilo de Vida', '🎯', 9, 'Qual o seu principal objetivo com a consultoria?', 'textarea', true, 'Ex: emagrecer, definir, ganhar massa, saúde', NULL),
  (v_template_id, 'Objetivos e Estilo de Vida', '🎯', 10, 'Você já fez alguma dieta? Qual funcionou melhor pra você?', 'textarea', true, NULL, NULL),
  (v_template_id, 'Objetivos e Estilo de Vida', '🎯', 11, 'Teve alguma dificuldade ou desafio que te atrapalhou? Se sim, qual?', 'textarea', true, NULL, NULL),
  (v_template_id, 'Objetivos e Estilo de Vida', '🎯', 12, 'Pratica alguma atividade física? Se sim, qual, quantas vezes por semana e em qual horário?', 'textarea', true, NULL, NULL),
  (v_template_id, 'Objetivos e Estilo de Vida', '🎯', 13, 'Tem dificuldade com alguma refeição específica? Qual?', 'textarea', true, NULL, NULL),
  (v_template_id, 'Objetivos e Estilo de Vida', '🎯', 14, 'Qual horário do dia você mais sente fome?', 'select', true, NULL, '["Manhã", "Tarde", "Noite", "Madrugada"]'),
  (v_template_id, 'Objetivos e Estilo de Vida', '🎯', 15, 'Quanto tempo você tem disponível por refeição?', 'select', true, NULL, '["Até 10 minutos", "10-30 minutos", "Mais de 30 minutos"]');

  -- Inserir perguntas - Seção: Alimentação
  INSERT INTO public.anamnese_perguntas (template_id, secao, secao_icone, ordem, pergunta, tipo, obrigatoria, placeholder) VALUES
  (v_template_id, 'Alimentação', '🍽️', 16, 'O que costuma comer no café da manhã?', 'textarea', true, NULL),
  (v_template_id, 'Alimentação', '🍽️', 17, 'Costuma fazer lanche da manhã? Se sim, o que come?', 'textarea', true, NULL),
  (v_template_id, 'Alimentação', '🍽️', 18, 'O que costuma comer no almoço?', 'textarea', true, NULL),
  (v_template_id, 'Alimentação', '🍽️', 19, 'Costuma fazer lanche da tarde? Se sim, o que come?', 'textarea', true, NULL),
  (v_template_id, 'Alimentação', '🍽️', 20, 'O que costuma comer no jantar?', 'textarea', true, NULL),
  (v_template_id, 'Alimentação', '🍽️', 21, 'Costuma fazer ceia? Se sim, o que come?', 'textarea', true, NULL),
  (v_template_id, 'Alimentação', '🍽️', 22, 'Quais alimentos você gosta muito e considera indispensáveis?', 'textarea', true, NULL),
  (v_template_id, 'Alimentação', '🍽️', 23, 'Tem algum alimento que você não come de jeito nenhum?', 'textarea', true, NULL),
  (v_template_id, 'Alimentação', '🍽️', 24, 'Quais alimentos você sempre tem em casa?', 'textarea', true, NULL);

  -- Inserir perguntas - Seção: Restrições e Saúde
  INSERT INTO public.anamnese_perguntas (template_id, secao, secao_icone, ordem, pergunta, tipo, obrigatoria, placeholder) VALUES
  (v_template_id, 'Restrições e Saúde', '⚠️', 25, 'Tem alergia ou intolerância alimentar? Qual?', 'textarea', true, NULL),
  (v_template_id, 'Restrições e Saúde', '⚠️', 26, 'Faz uso de medicamentos? Quais?', 'textarea', true, NULL),
  (v_template_id, 'Restrições e Saúde', '⚠️', 27, 'Usa insulina ou tem alguma condição clínica? Qual?', 'textarea', true, NULL),
  (v_template_id, 'Restrições e Saúde', '⚠️', 28, 'Já passou por alguma cirurgia? Qual?', 'textarea', true, NULL),
  (v_template_id, 'Restrições e Saúde', '⚠️', 29, 'Tem histórico de alguma dessas doenças na família? (Ex: diabetes, hipertensão, depressão, obesidade)', 'textarea', true, NULL);

  -- Inserir perguntas - Seção: Sono e Hidratação
  INSERT INTO public.anamnese_perguntas (template_id, secao, secao_icone, ordem, pergunta, tipo, obrigatoria, placeholder, opcoes) VALUES
  (v_template_id, 'Sono e Hidratação', '😴', 30, 'Quantas horas costuma dormir por noite?', 'number', true, 'Ex: 7', NULL),
  (v_template_id, 'Sono e Hidratação', '😴', 31, 'Como você considera seu sono?', 'select', true, NULL, '["Bom", "Regular", "Ruim"]'),
  (v_template_id, 'Sono e Hidratação', '😴', 32, 'Tem insônia? Toma algum medicamento para dormir?', 'textarea', true, NULL, NULL),
  (v_template_id, 'Sono e Hidratação', '😴', 33, 'Ingestão média diária de água', 'text', true, 'Ex: 2 litros ou 4 garrafas', NULL),
  (v_template_id, 'Sono e Hidratação', '😴', 34, 'Tem prisão de ventre? Frequência de idas ao banheiro?', 'textarea', true, NULL, NULL);

  -- Inserir perguntas - Seção: Extras
  INSERT INTO public.anamnese_perguntas (template_id, secao, secao_icone, ordem, pergunta, tipo, obrigatoria, placeholder, opcoes) VALUES
  (v_template_id, 'Extras', '💬', 35, 'Como me conheceu?', 'text', true, NULL, NULL),
  (v_template_id, 'Extras', '💬', 36, 'Me autoriza a compartilhar seus conteúdos como depoimento ou print nos stories?', 'select', true, NULL, '["Sim, pode mostrar com meu nome", "Sim, mas sem mostrar meu nome", "Prefiro que não"]'),
  (v_template_id, 'Extras', '💬', 37, 'Deseja compartilhar alguma informação extra ou tem alguma observação?', 'textarea', false, NULL, NULL);

  RETURN v_template_id;
END;
$$;