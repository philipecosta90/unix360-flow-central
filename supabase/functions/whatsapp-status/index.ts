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
    console.log('[whatsapp-status] Iniciando...');

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

    // Buscar empresa_id do usuário para validação
    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('empresa_id')
      .eq('user_id', user.id)
      .single();

    if (perfilError || !perfil) {
      throw new Error('Perfil não encontrado');
    }

    // Parse query params
    const url = new URL(req.url);
    const instanceId = url.searchParams.get('instanceId');

    if (!instanceId) {
      throw new Error('instanceId é obrigatório');
    }

    console.log(`[whatsapp-status] Verificando status da instância: ${instanceId}`);

    // Buscar instância do banco usando admin, mas validar empresa_id
    const { data: instance, error: instanceError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('empresa_id', perfil.empresa_id)
      .single();

    if (instanceError || !instance) {
      throw new Error('Instância não encontrada');
    }

    // Verificar status na WUZAPI
    const statusResponse = await fetch(`${WHATSAPP_API_URL}/session/status`, {
      method: 'GET',
      headers: {
        'token': instance.user_token,
      },
    });

    const statusResult = await statusResponse.json();
    console.log('[whatsapp-status] Resposta WUZAPI:', JSON.stringify(statusResult));

    // Extrair payload - WUZAPI retorna dados em statusResult.data
    const payload = statusResult?.data ?? statusResult;
    
    // Mapear status da WUZAPI para nosso padrão
    let newStatus = 'disconnected';
    let jid = null;

    // Verificar conexão (considerar variações de case)
    // IMPORTANTE: connected = websocket ativo, loggedIn = usuário escaneou QR
    const isConnected = payload.Connected === true || payload.connected === true;
    const isLoggedIn = payload.LoggedIn === true || payload.loggedIn === true || payload.logged_in === true;
    
    if (isConnected && isLoggedIn) {
      // Realmente autenticado - escaneou QR e está logado
      newStatus = 'connected';
      jid = payload.Jid || payload.jid || payload.JID;
    } else if (isConnected && !isLoggedIn) {
      // Websocket ativo mas aguardando scan do QR
      newStatus = 'connecting';
    } else {
      // Desconectado
      newStatus = 'disconnected';
    }
    
    console.log('[whatsapp-status] Status mapeado:', { isConnected, isLoggedIn, newStatus, jid });

    // Atualizar status no banco se mudou usando cliente admin
    if (newStatus !== instance.status || jid !== instance.jid) {
      await supabaseAdmin
        .from('whatsapp_instances')
        .update({
          status: newStatus,
          jid: jid || instance.jid,
          updated_at: new Date().toISOString(),
        })
        .eq('id', instanceId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: newStatus,
        jid,
        apiResponse: statusResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[whatsapp-status] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
