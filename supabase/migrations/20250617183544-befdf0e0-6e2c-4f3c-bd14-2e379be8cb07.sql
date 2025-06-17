
-- Criar enum para status dos clientes
CREATE TYPE public.status_cliente AS ENUM ('ativo', 'inativo', 'lead', 'prospecto');

-- Criar tabela de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  status status_cliente NOT NULL DEFAULT 'lead',
  plano_contratado TEXT,
  observacoes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS na tabela clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clientes
CREATE POLICY "Usuários podem ver clientes da sua empresa"
  ON public.clientes
  FOR SELECT
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem inserir clientes na sua empresa"
  ON public.clientes
  FOR INSERT
  WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem atualizar clientes da sua empresa"
  ON public.clientes
  FOR UPDATE
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Admins podem deletar clientes da sua empresa"
  ON public.clientes
  FOR DELETE
  USING (empresa_id = public.get_user_empresa_id() AND public.is_admin());

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Criar índices para melhor performance
CREATE INDEX idx_clientes_empresa_id ON public.clientes(empresa_id);
CREATE INDEX idx_clientes_status ON public.clientes(status);
CREATE INDEX idx_clientes_tags ON public.clientes USING gin(tags);
