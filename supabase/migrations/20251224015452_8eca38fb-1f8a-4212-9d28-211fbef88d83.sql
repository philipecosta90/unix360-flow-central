-- Criar tabela para armazenar instâncias WhatsApp
CREATE TABLE public.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  numero TEXT NOT NULL,
  user_token TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected',
  jid TEXT,
  webhook TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "whatsapp_instances_select" ON public.whatsapp_instances
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "whatsapp_instances_insert" ON public.whatsapp_instances
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "whatsapp_instances_update" ON public.whatsapp_instances
  FOR UPDATE USING (empresa_id = get_user_empresa_id());

CREATE POLICY "whatsapp_instances_delete" ON public.whatsapp_instances
  FOR DELETE USING (empresa_id = get_user_empresa_id() AND is_admin());

-- Trigger para updated_at
CREATE TRIGGER handle_whatsapp_instances_updated_at
  BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Bloquear acesso anônimo
CREATE POLICY "block_anonymous_access_whatsapp" ON public.whatsapp_instances
  AS RESTRICTIVE FOR ALL USING (false);