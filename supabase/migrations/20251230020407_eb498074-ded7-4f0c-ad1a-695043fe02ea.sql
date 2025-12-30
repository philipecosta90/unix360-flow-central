-- Create whatsapp_mensagens table
CREATE TABLE public.whatsapp_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  variaveis_disponiveis TEXT[] NOT NULL DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, tipo)
);

-- Enable RLS
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "whatsapp_mensagens_select"
  ON public.whatsapp_mensagens FOR SELECT
  USING (empresa_id = get_user_empresa_id() AND is_active_user());

CREATE POLICY "whatsapp_mensagens_insert"
  ON public.whatsapp_mensagens FOR INSERT
  WITH CHECK (empresa_id = get_user_empresa_id() AND is_admin());

CREATE POLICY "whatsapp_mensagens_update"
  ON public.whatsapp_mensagens FOR UPDATE
  USING (empresa_id = get_user_empresa_id() AND is_admin());

CREATE POLICY "whatsapp_mensagens_delete"
  ON public.whatsapp_mensagens FOR DELETE
  USING (empresa_id = get_user_empresa_id() AND is_admin());

-- Block anonymous access
CREATE POLICY "block_anonymous_access_whatsapp_mensagens"
  ON public.whatsapp_mensagens FOR ALL
  USING (false);

-- Trigger for updated_at
CREATE TRIGGER handle_whatsapp_mensagens_updated_at
  BEFORE UPDATE ON public.whatsapp_mensagens
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to create default messages for a company
CREATE OR REPLACE FUNCTION public.create_default_whatsapp_messages_for_company(p_empresa_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Mensagem de Boas-vindas
  INSERT INTO public.whatsapp_mensagens (empresa_id, tipo, titulo, conteudo, variaveis_disponiveis)
  VALUES (
    p_empresa_id,
    'boas_vindas',
    'Mensagem de Boas-vindas',
    'Olá {clienteNome}! 👋

Bem-vindo(a) à *{nomeEmpresa}*! 🎉

Estamos muito felizes em tê-lo(a) como nosso cliente.

Se precisar de algo, é só responder esta mensagem.

Atenciosamente,
Equipe {nomeEmpresa}',
    ARRAY['clienteNome', 'nomeEmpresa']
  )
  ON CONFLICT (empresa_id, tipo) DO NOTHING;

  -- Mensagem de Anamnese
  INSERT INTO public.whatsapp_mensagens (empresa_id, tipo, titulo, conteudo, variaveis_disponiveis)
  VALUES (
    p_empresa_id,
    'anamnese',
    'Envio de Anamnese',
    'Olá {clienteNome}! 👋

📋 *Questionário de Anamnese*

Parabéns pela decisão! Este é o primeiro passo no caminho em direção aos seus objetivos.

Para começarmos, preencha o questionário clicando no link abaixo:

🔗 {link}

⏰ O link é válido por 7 dias.

Dúvidas? Responda esta mensagem!

Equipe *{nomeEmpresa}*',
    ARRAY['clienteNome', 'link', 'nomeEmpresa']
  )
  ON CONFLICT (empresa_id, tipo) DO NOTHING;

  -- Mensagem de Check-in
  INSERT INTO public.whatsapp_mensagens (empresa_id, tipo, titulo, conteudo, variaveis_disponiveis)
  VALUES (
    p_empresa_id,
    'checkin',
    'Envio de Check-in',
    'Olá {clienteNome}! 👋

📊 *{nomeTemplate}*

Como está seu progresso? Responda este check-in rápido para que possamos acompanhar sua evolução.

🔗 {link}

⏰ O link é válido por 3 dias.

Dúvidas? Responda esta mensagem!

Equipe *{nomeEmpresa}*',
    ARRAY['clienteNome', 'nomeTemplate', 'link', 'nomeEmpresa']
  )
  ON CONFLICT (empresa_id, tipo) DO NOTHING;
END;
$$;