
-- Corrigir políticas RLS e garantir que existam dados de teste
-- Primeiro, vamos limpar e recriar as políticas para a tabela perfis

-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Usuários podem ver perfis da empresa" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Admins podem ver perfis da empresa" ON public.perfis;

-- Criar políticas mais simples e funcionais
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

-- Política para admins verem todos os perfis da empresa
CREATE POLICY "Usuários podem ver perfis da mesma empresa"
  ON public.perfis
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.perfis 
      WHERE user_id = auth.uid()
    )
  );

-- Corrigir políticas para empresas
DROP POLICY IF EXISTS "Usuários podem ver sua empresa" ON public.empresas;
DROP POLICY IF EXISTS "Admins podem atualizar empresa" ON public.empresas;

CREATE POLICY "Usuários podem ver sua empresa"
  ON public.empresas
  FOR SELECT
  USING (
    id IN (
      SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir empresa"
  ON public.empresas
  FOR INSERT
  WITH CHECK (true); -- Permitir inserção para criação automática

CREATE POLICY "Usuários podem atualizar empresa"
  ON public.empresas
  FOR UPDATE
  USING (
    id IN (
      SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()
    )
  );

-- Garantir que existe pelo menos uma empresa padrão
INSERT INTO public.empresas (nome, email)
SELECT 'Empresa Padrão', 'contato@empresa.com'
WHERE NOT EXISTS (SELECT 1 FROM public.empresas WHERE nome = 'Empresa Padrão');

-- Criar perfis para usuários existentes que não têm perfil
INSERT INTO public.perfis (user_id, empresa_id, nome, nivel_permissao)
SELECT 
  au.id,
  (SELECT id FROM public.empresas WHERE nome = 'Empresa Padrão' LIMIT 1),
  COALESCE(
    au.raw_user_meta_data->>'nome',
    au.raw_user_meta_data->>'full_name', 
    split_part(au.email, '@', 1),
    'Usuário'
  ),
  'admin'
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM public.perfis WHERE user_id IS NOT NULL)
AND au.email IS NOT NULL;

-- Corrigir políticas para outras tabelas importantes
-- Cliente documentos
DROP POLICY IF EXISTS "Usuários podem ver documentos da sua empresa" ON public.cliente_documentos;
DROP POLICY IF EXISTS "Usuários podem inserir documentos da sua empresa" ON public.cliente_documentos;

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

CREATE POLICY "Usuários podem atualizar documentos da sua empresa"
  ON public.cliente_documentos
  FOR UPDATE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar documentos da sua empresa"
  ON public.cliente_documentos
  FOR DELETE
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.perfis WHERE user_id = auth.uid()
    )
  );
