interface CheckoutUrlParams {
  empresaId?: string;
  email?: string;
  planId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export const buildCheckoutUrl = (params: CheckoutUrlParams = {}): string | null => {
  const base = "https://pay.cakto.com.br/chho9do_565429";
  
  if (!base) {
    // Show toast about missing configuration instead of throwing
    return null;
  }

  const url = new URL(base); // env is already the complete payment link URL
  
  // Defaults
  const planId = params.planId || "starter-monthly";
  
  // Get user data from context if not provided
  // Note: These will be filled by the calling component with actual user data
  const empresaId = params.empresaId || "";
  const email = params.email || "";
  
  const origin = typeof window !== 'undefined' ? window.location.origin : "";
  const successUrl = params.successUrl || `${origin}/subscription/success`;
  const cancelUrl = params.cancelUrl || `${origin}/subscription/cancel`;
  
  // Add parameters (only if not empty)
  function addParam(key: string, value: string) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  
  addParam('planId', planId);
  addParam('refId', empresaId); // Source of truth for empresa_id in webhook
  addParam('empresaId', empresaId);
  addParam('email', email);
  addParam('success_url', successUrl);
  addParam('cancel_url', cancelUrl);
  
  return url.toString();
};

export const getPlans = () => [
  {
    id: 'starter-monthly',
    name: 'Plano Starter',
    price: 87.00,
    features: [
      'CRM completo',
      'Gestão financeira',
      'Contratos',
      'Customer Success',
      'Relatórios avançados',
      'Suporte por email'
    ]
  }
];