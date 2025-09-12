interface CheckoutUrlParams {
  empresaId: string;
  email: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}

export const buildCheckoutUrl = ({
  empresaId,
  email,
  planId,
  successUrl,
  cancelUrl
}: CheckoutUrlParams): string => {
  // Get base URL from environment variables - client or server
  const base = (typeof window !== 'undefined' 
    ? (window as any).location?.protocol === 'https:' 
      ? process.env.NEXT_PUBLIC_CAKTO_CHECKOUT_BASE_URL 
      : process.env.CAKTO_CHECKOUT_BASE_URL
    : process.env.CAKTO_CHECKOUT_BASE_URL) || process.env.NEXT_PUBLIC_CAKTO_CHECKOUT_BASE_URL;
  
  if (!base) {
    throw new Error('CAKTO_CHECKOUT_BASE_URL or NEXT_PUBLIC_CAKTO_CHECKOUT_BASE_URL not configured');
  }

  const url = new URL(base);
  
  // Add search parameters
  url.searchParams.set('empresaId', empresaId);
  url.searchParams.set('email', email);
  url.searchParams.set('planId', planId);
  url.searchParams.set('success_url', successUrl);
  url.searchParams.set('cancel_url', cancelUrl);
  
  return url.toString();
};

export const getPlans = () => [
  {
    id: 'basic',
    name: 'Plano Básico',
    price: 75.00,
    features: [
      'CRM completo',
      'Gestão financeira',
      'Contratos',
      'Suporte por email'
    ]
  },
  {
    id: 'premium',
    name: 'Plano Premium',
    price: 150.00,
    popular: true,
    features: [
      'Tudo do Plano Básico',
      'Customer Success',
      'Relatórios avançados',
      'Suporte prioritário',
      'Integrações premium'
    ]
  }
];