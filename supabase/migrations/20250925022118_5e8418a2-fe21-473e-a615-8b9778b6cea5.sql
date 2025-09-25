-- Adicionar colunas para controle de assinatura ativa
ALTER TABLE public.perfis 
ADD COLUMN data_de_assinatura_ativa TIMESTAMP WITH TIME ZONE,
ADD COLUMN data_de_expiracao_da_assinatura_ativa TIMESTAMP WITH TIME ZONE;

-- Criar constraint para garantir consistência das datas
ALTER TABLE public.perfis 
ADD CONSTRAINT check_assinatura_ativa_dates 
CHECK (
  (data_de_assinatura_ativa IS NULL AND data_de_expiracao_da_assinatura_ativa IS NULL) OR
  (data_de_assinatura_ativa IS NOT NULL AND data_de_expiracao_da_assinatura_ativa IS NOT NULL AND data_de_expiracao_da_assinatura_ativa > data_de_assinatura_ativa)
);

-- Criar função para limpar datas de assinatura ativa quando status não for 'active'
CREATE OR REPLACE FUNCTION public.clear_inactive_subscription_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Limpar datas de assinatura ativa se o status não for 'active'
  IF NEW.subscription_status IS DISTINCT FROM 'active' THEN
    NEW.data_de_assinatura_ativa := NULL;
    NEW.data_de_expiracao_da_assinatura_ativa := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar a função
CREATE TRIGGER clear_subscription_dates_on_status_change
  BEFORE INSERT OR UPDATE ON public.perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_inactive_subscription_dates();