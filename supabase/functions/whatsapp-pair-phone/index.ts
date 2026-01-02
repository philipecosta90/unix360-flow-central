import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS seguro - domínios específicos permitidos
const ALLOWED_ORIGINS = [
  'https://app.unix360.com.br',
  'https://unix360-flow-central.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o.replace('/**', '')))
    ? origin 
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

const WHATSAPP_API_URL = Deno.env.get('WHATSAPP_API_URL') || 'https://weeb.inoovaweb.com.br';

serve(async (req) => {
  // Handle CORS preflight requests
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[whatsapp-pair-phone] Iniciando...');

    // Criar cliente Supabase com token do usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Parse do body
    const { instanceId, phone } = await req.json();

    if (!instanceId || !phone) {
      throw new Error('instanceId e phone são obrigatórios');
    }

    console.log(`[whatsapp-pair-phone] Pareando instância ${instanceId} com telefone ${phone}`);

    // Buscar instância do banco (RLS garante que é da empresa do usuário)
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) {
      throw new Error('Instância não encontrada');
    }

    // Solicitar código de pareamento da WUZAPI
    const pairResponse = await fetch(`${WHATSAPP_API_URL}/session/pairphone`, {
      method: 'POST',
      headers: {
        'token': instance.user_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Phone: phone.replace(/\D/g, ''),
      }),
    });

    const pairResult = await pairResponse.json();
    console.log('[whatsapp-pair-phone] Resposta WUZAPI:', JSON.stringify(pairResult));

    if (!pairResponse.ok) {
      throw new Error(pairResult.message || 'Erro ao solicitar código de pareamento');
    }

    return new Response(
      JSON.stringify({
        success: true,
        pairCode: pairResult.PairCode || pairResult.pairCode || pairResult.code,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[whatsapp-pair-phone] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
