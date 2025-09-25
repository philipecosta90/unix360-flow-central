-- Criar tabela de assinaturas Cakto para receber dados via webhook N8N
CREATE TABLE public.assinaturas_cakto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE,
  id_assinatura TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  data_de_ativacao TIMESTAMP WITH TIME ZONE,
  data_de_expiracao TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE public.assinaturas_cakto ENABLE ROW LEVEL SECURITY;

-- Criar índices para melhor performance
CREATE INDEX idx_assinaturas_cakto_perfil_id ON public.assinaturas_cakto(perfil_id);
CREATE INDEX idx_assinaturas_cakto_id_assinatura ON public.assinaturas_cakto(id_assinatura);
CREATE INDEX idx_assinaturas_cakto_email ON public.assinaturas_cakto(email);
CREATE INDEX idx_assinaturas_cakto_status ON public.assinaturas_cakto(status);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_assinaturas_cakto_updated_at
  BEFORE UPDATE ON public.assinaturas_cakto
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Políticas RLS para controle de acesso

-- Usuários podem ver apenas suas próprias assinaturas
CREATE POLICY "Usuários podem ver suas próprias assinaturas"
ON public.assinaturas_cakto
FOR SELECT
USING (
  perfil_id IN (
    SELECT p.id FROM public.perfis p 
    WHERE p.user_id = auth.uid() AND p.ativo = true
  )
);

-- Admins podem ver todas as assinaturas da empresa
CREATE POLICY "Admins podem ver todas as assinaturas da empresa"
ON public.assinaturas_cakto
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.perfis p1
    JOIN public.perfis p2 ON p1.empresa_id = p2.empresa_id
    WHERE p1.user_id = auth.uid() 
    AND p1.nivel_permissao = 'admin' 
    AND p1.ativo = true
    AND p2.id = assinaturas_cakto.perfil_id
  )
);

-- Sistema pode inserir novas assinaturas (via webhook/API)
CREATE POLICY "Sistema pode inserir assinaturas"
ON public.assinaturas_cakto
FOR INSERT
WITH CHECK (true);

-- Sistema pode atualizar assinaturas existentes
CREATE POLICY "Sistema pode atualizar assinaturas"
ON public.assinaturas_cakto
FOR UPDATE
USING (true);

-- Admins podem atualizar assinaturas da empresa
CREATE POLICY "Admins podem atualizar assinaturas da empresa"
ON public.assinaturas_cakto
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.perfis p1
    JOIN public.perfis p2 ON p1.empresa_id = p2.empresa_id
    WHERE p1.user_id = auth.uid() 
    AND p1.nivel_permissao = 'admin' 
    AND p1.ativo = true
    AND p2.id = assinaturas_cakto.perfil_id
  )
);