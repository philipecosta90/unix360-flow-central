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
const WHATSAPP_ADMIN_TOKEN = Deno.env.get('WHATSAPP_ADMIN_TOKEN') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[whatsapp-create-instance] Iniciando...');

    // Criar cliente Supabase com token do usuário para autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Cliente admin para operações de banco (bypassa RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Buscar empresa_id do usuário (usando cliente do usuário para RLS)
    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('empresa_id')
      .eq('user_id', user.id)
      .single();

    if (perfilError || !perfil) {
      throw new Error('Perfil não encontrado');
    }

    // Parse do body
    const { nome, numero } = await req.json();

    if (!nome || !numero) {
      throw new Error('Nome e número são obrigatórios');
    }

    console.log(`[whatsapp-create-instance] Criando instância: ${nome} - ${numero}`);

    // Gerar token único para a instância
    const userToken = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();

    // Criar usuário na WUZAPI
    const createUserResponse = await fetch(`${WHATSAPP_API_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': WHATSAPP_ADMIN_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${nome}_${numero}`,
        token: userToken,
        events: 'All',
        history: 0,
      }),
    });

    const createUserResult = await createUserResponse.json();
    console.log('[whatsapp-create-instance] Resposta WUZAPI:', JSON.stringify(createUserResult));

    if (!createUserResponse.ok) {
      throw new Error(createUserResult.message || 'Erro ao criar usuário na API WhatsApp');
    }

    // Capturar o ID retornado pela WUZAPI
    const wuzapiId = createUserResult.data?.id?.toString() || createUserResult.id?.toString() || null;
    console.log('[whatsapp-create-instance] WUZAPI ID capturado:', wuzapiId);

    // Salvar instância no banco usando cliente admin
    const { data: instance, error: insertError } = await supabaseAdmin
      .from('whatsapp_instances')
      .insert({
        empresa_id: perfil.empresa_id,
        nome,
        numero,
        user_token: userToken,
        wuzapi_id: wuzapiId,
        status: 'disconnected',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[whatsapp-create-instance] Erro ao salvar:', insertError);
      throw new Error('Erro ao salvar instância no banco');
    }

    console.log(`[whatsapp-create-instance] Instância criada com ID: ${instance.id}`);

    // NÃO iniciar conexão automaticamente - isso será feito quando o usuário solicitar o QR Code
    // Cada instância fica isolada pelo seu user_token único

    return new Response(
      JSON.stringify({
        success: true,
        instance: instance,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[whatsapp-create-instance] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
