
-- Criar tabela de empresas
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar enum para níveis de permissão
CREATE TYPE public.nivel_permissao AS ENUM ('admin', 'operacional', 'visualizacao');

-- Criar tabela de perfis de usuário
CREATE TABLE public.perfis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  sobrenome TEXT,
  telefone TEXT,
  cargo TEXT,
  nivel_permissao nivel_permissao NOT NULL DEFAULT 'visualizacao',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Função para obter empresa do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Função para verificar se usuário é admin da empresa
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE user_id = auth.uid() 
    AND nivel_permissao = 'admin'
  );
$$;

-- Políticas RLS para empresas
CREATE POLICY "Usuários podem ver apenas sua empresa"
  ON public.empresas
  FOR SELECT
  USING (id = public.get_user_empresa_id());

CREATE POLICY "Admins podem atualizar sua empresa"
  ON public.empresas
  FOR UPDATE
  USING (id = public.get_user_empresa_id() AND public.is_admin());

-- Políticas RLS para perfis
CREATE POLICY "Usuários podem ver perfis da sua empresa"
  ON public.perfis
  FOR SELECT
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.perfis
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.perfis
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins podem inserir novos perfis na sua empresa"
  ON public.perfis
  FOR INSERT
  WITH CHECK (empresa_id = public.get_user_empresa_id() AND public.is_admin());

CREATE POLICY "Admins podem atualizar perfis da sua empresa"
  ON public.perfis
  FOR UPDATE
  USING (empresa_id = public.get_user_empresa_id() AND public.is_admin());

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER perfis_updated_at
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Inserir uma empresa padrão para testes
INSERT INTO public.empresas (nome, cnpj, email) 
VALUES ('Empresa Demo', '12.345.678/0001-90', 'contato@empresademo.com');
