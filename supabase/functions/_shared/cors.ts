// Configuração de CORS segura para Edge Functions
// Substitui os headers genéricos "*" por domínios específicos permitidos

const ALLOWED_ORIGINS = [
  'https://app.unix360.com.br',
  'https://unix360-flow-central.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

export function getCorsHeaders(origin: string | null): Record<string, string> {
  // Verificar se a origem é permitida
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0]; // Fallback para o domínio principal

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400', // Cache preflight por 24h
  };
}

export function handleCorsPreflightRequest(origin: string | null): Response {
  return new Response(null, { 
    headers: getCorsHeaders(origin),
    status: 204 // No Content
  });
}

// Para funções que precisam aceitar qualquer origem (formulários públicos)
// Ainda assim, não usamos "*" - usamos o fallback para o domínio principal
export function getPublicCorsHeaders(origin: string | null): Record<string, string> {
  // Para formulários públicos, permitimos qualquer origem mas ainda retornamos
  // o domínio principal como fallback para segurança do browser
  const allowedOrigin = origin || ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
}
