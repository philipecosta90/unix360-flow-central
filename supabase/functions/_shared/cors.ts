// Configuração de CORS segura para Edge Functions
// Suporta produção, preview Lovable e desenvolvimento local

const ALLOWED_ORIGINS_EXACT = [
  'https://app.unix360.com.br',
  'https://unix360-flow-central.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const ALLOWED_ORIGIN_PATTERNS = [
  /\.lovableproject\.com$/,
  /\.lovable\.app$/,
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  
  // Verifica origens exatas
  if (ALLOWED_ORIGINS_EXACT.includes(origin)) {
    return true;
  }
  
  // Verifica padrões (ex: *.lovableproject.com)
  try {
    const url = new URL(origin);
    return ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(url.hostname));
  } catch {
    return false;
  }
}

export function getCorsHeaders(origin: string | null): Record<string, string> {
  // Se a origem é permitida, ecoa ela; senão usa o domínio principal
  const allowedOrigin = isOriginAllowed(origin) ? origin! : ALLOWED_ORIGINS_EXACT[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export function handleCorsPreflightRequest(origin: string | null): Response {
  return new Response(null, { 
    headers: getCorsHeaders(origin),
    status: 204
  });
}

// Para funções públicas (formulários) - mesma lógica mas sem fallback restritivo
export function getPublicCorsHeaders(origin: string | null): Record<string, string> {
  // Para formulários públicos, aceitar qualquer origem permitida
  const allowedOrigin = isOriginAllowed(origin) ? origin! : ALLOWED_ORIGINS_EXACT[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin',
  };
}
