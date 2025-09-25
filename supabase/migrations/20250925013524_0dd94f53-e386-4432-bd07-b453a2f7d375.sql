-- Adicionar colunas relacionadas à assinatura na tabela perfis
ALTER TABLE public.perfis 
ADD COLUMN trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
ADD COLUMN subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'canceled')),
ADD COLUMN subscription_plan TEXT DEFAULT 'free';

-- Atualizar perfis existentes para terem trial ativo por 7 dias
UPDATE public.perfis 
SET 
  trial_start_date = now(),
  trial_end_date = now() + INTERVAL '7 days',
  subscription_status = 'trial',
  subscription_plan = 'free'
WHERE trial_start_date IS NULL;

-- Criar índices para melhor performance
CREATE INDEX idx_perfis_subscription_status ON public.perfis(subscription_status);
CREATE INDEX idx_perfis_trial_end_date ON public.perfis(trial_end_date);

-- Função para verificar se usuário tem assinatura ativa
CREATE OR REPLACE FUNCTION public.has_active_subscription()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis p
    WHERE p.user_id = auth.uid() 
    AND p.ativo = TRUE
    AND (
      p.subscription_status = 'active' 
      OR (p.subscription_status = 'trial' AND p.trial_end_date > now())
    )
  );
$$;