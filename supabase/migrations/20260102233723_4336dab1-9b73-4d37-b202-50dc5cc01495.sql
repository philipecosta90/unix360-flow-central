-- Adicionar coluna data_nascimento na tabela clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Criar tabela de agendamentos de mensagens
CREATE TABLE public.mensagens_agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  mensagem_id UUID NOT NULL REFERENCES public.whatsapp_mensagens(id) ON DELETE CASCADE,
  
  -- Tipo de agendamento
  tipo_agendamento TEXT NOT NULL CHECK (tipo_agendamento IN ('unico', 'aniversario', 'recorrente', 'data_fixa')),
  
  -- Para agendamentos únicos ou fixos
  data_envio DATE,
  
  -- Para data_fixa: usa dia/mês específico (ex: Natal, Ano Novo) formato "DD-MM"
  dia_mes TEXT,
  
  -- Filtros de destinatários
  filtro_clientes JSONB DEFAULT '{}',
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- Horário de envio
  hora_envio TIME DEFAULT '09:00',
  
  -- Controle
  ativo BOOLEAN DEFAULT true,
  ultimo_envio TIMESTAMPTZ,
  proximo_envio DATE,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Habilitar RLS
ALTER TABLE public.mensagens_agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "mensagens_agendamentos_select" ON public.mensagens_agendamentos
  FOR SELECT TO authenticated 
  USING (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "mensagens_agendamentos_insert" ON public.mensagens_agendamentos
  FOR INSERT TO authenticated 
  WITH CHECK (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "mensagens_agendamentos_update" ON public.mensagens_agendamentos
  FOR UPDATE TO authenticated 
  USING (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "mensagens_agendamentos_delete" ON public.mensagens_agendamentos
  FOR DELETE TO authenticated 
  USING (empresa_id = get_user_empresa_id() AND is_active_user());

-- Trigger para updated_at
CREATE TRIGGER mensagens_agendamentos_updated_at
  BEFORE UPDATE ON public.mensagens_agendamentos
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();