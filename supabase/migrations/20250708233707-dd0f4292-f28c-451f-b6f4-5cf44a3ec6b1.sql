-- =========================================
-- SISTEMA DE COBRANÇA RECORRENTE ASAAS
-- =========================================

-- Criar enum para status de assinatura
CREATE TYPE public.subscription_status AS ENUM (
    'trial',
    'active', 
    'suspended',
    'cancelled'
);

-- Criar enum para status de pagamento
CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'confirmed',
    'overdue',
    'cancelled'
);

-- Tabela de assinaturas
CREATE TABLE public.subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    asaas_customer_id TEXT,
    asaas_subscription_id TEXT,
    status public.subscription_status NOT NULL DEFAULT 'trial',
    trial_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    trial_end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    monthly_value DECIMAL(10,2) NOT NULL DEFAULT 75.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de faturas/pagamentos
CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    asaas_payment_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    status public.payment_status NOT NULL DEFAULT 'pending',
    due_date DATE NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    invoice_url TEXT,
    pix_qr_code TEXT,
    boleto_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para subscriptions
CREATE POLICY "subscriptions_select_empresa_users" 
ON public.subscriptions 
FOR SELECT 
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "subscriptions_update_empresa_admins" 
ON public.subscriptions 
FOR UPDATE 
USING (empresa_id = get_user_empresa_id() AND is_admin());

CREATE POLICY "subscriptions_insert_empresa_admins" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (empresa_id = get_user_empresa_id() AND is_admin());

-- Políticas RLS para invoices
CREATE POLICY "invoices_select_empresa_users" 
ON public.invoices 
FOR SELECT 
USING (subscription_id IN (
    SELECT id FROM public.subscriptions 
    WHERE empresa_id = get_user_empresa_id()
));

-- Política para admins verem todas as assinaturas (para dashboard admin)
CREATE POLICY "subscriptions_select_all_admins" 
ON public.subscriptions 
FOR SELECT 
USING (is_admin());

CREATE POLICY "invoices_select_all_admins" 
ON public.invoices 
FOR SELECT 
USING (is_admin());

-- Triggers para updated_at
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Função para verificar se empresa tem acesso ativo
CREATE OR REPLACE FUNCTION public.has_active_subscription(empresa_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.subscriptions 
        WHERE empresa_id = empresa_uuid 
        AND (
            status = 'trial' AND trial_end_date > now()
            OR status = 'active'
        )
    );
$$;

-- Função para criar assinatura automática ao criar empresa
CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.subscriptions (empresa_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$;

-- Trigger para criar assinatura automática
CREATE TRIGGER create_subscription_on_empresa_insert
    AFTER INSERT ON public.empresas
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_subscription();