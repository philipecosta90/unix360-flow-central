
-- Primeiro, vamos verificar e corrigir as políticas RLS para a tabela perfis
DROP POLICY IF EXISTS "Usuários podem ver perfis da sua empresa" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Admins podem inserir novos perfis na sua empresa" ON public.perfis;
DROP POLICY IF EXISTS "Admins podem atualizar perfis da sua empresa" ON public.perfis;

-- Criar políticas mais simples e funcionais para perfis
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.perfis
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.perfis
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.perfis
  FOR UPDATE
  USING (user_id = auth.uid());

-- Criar políticas para admins verem perfis da mesma empresa
CREATE POLICY "Admins podem ver perfis da empresa"
  ON public.perfis
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.perfis 
      WHERE user_id = auth.uid() AND nivel_permissao = 'admin'
    )
  );

-- Verificar e corrigir políticas para empresas
DROP POLICY IF EXISTS "Usuários podem ver apenas sua empresa" ON public.empresas;
DROP POLICY IF EXISTS "Admins podem atualizar sua empresa" ON public.empresas;

CREATE POLICY "Usuários podem ver sua empresa"
  ON public.empresas
  FOR SELECT
  USING (
    id IN (
      SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins podem atualizar empresa"
  ON public.empresas
  FOR UPDATE
  USING (
    id IN (
      SELECT empresa_id FROM public.perfis 
      WHERE user_id = auth.uid() AND nivel_permissao = 'admin'
    )
  );

-- Adicionar políticas básicas para cliente_documentos
ALTER TABLE public.cliente_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver documentos da sua empresa"
  ON public.cliente_documentos
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir documentos da sua empresa"
  ON public.cliente_documentos
  FOR INSERT
  WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()
    )
  );

-- Criar um perfil de teste se não existir nenhum
-- Primeiro, vamos criar uma empresa de teste se não existir
INSERT INTO public.empresas (nome, email)
SELECT 'Empresa Teste', 'teste@empresa.com'
WHERE NOT EXISTS (SELECT 1 FROM public.empresas LIMIT 1);

-- Agora vamos criar perfis para todos os usuários que não têm perfil
INSERT INTO public.perfis (user_id, empresa_id, nome, nivel_permissao)
SELECT 
  au.id,
  (SELECT id FROM public.empresas LIMIT 1),
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'Usuário'),
  'admin'
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM public.perfis)
AND au.email IS NOT NULL;
