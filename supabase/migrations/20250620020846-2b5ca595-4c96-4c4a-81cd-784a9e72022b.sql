
-- Criar tabela de contratos
CREATE TABLE public.contratos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  cliente_nome TEXT,
  valor NUMERIC,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('ativo', 'inativo', 'pendente', 'cancelado')),
  tipo TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança para que usuários só vejam contratos de sua empresa
CREATE POLICY "Usuários podem ver contratos de sua empresa" 
  ON public.contratos 
  FOR SELECT 
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários podem criar contratos para sua empresa" 
  ON public.contratos 
  FOR INSERT 
  WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários podem atualizar contratos de sua empresa" 
  ON public.contratos 
  FOR UPDATE 
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Usuários podem excluir contratos de sua empresa" 
  ON public.contratos 
  FOR DELETE 
  USING (empresa_id = get_user_empresa_id());

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER handle_contratos_updated_at 
  BEFORE UPDATE ON public.contratos 
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
