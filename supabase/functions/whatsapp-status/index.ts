import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHATSAPP_API_URL = Deno.env.get('WHATSAPP_API_URL') || 'https://weeb.inoovaweb.com.br';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[whatsapp-status] Iniciando...');

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

    // Parse query params
    const url = new URL(req.url);
    const instanceId = url.searchParams.get('instanceId');

    if (!instanceId) {
      throw new Error('instanceId é obrigatório');
    }

    console.log(`[whatsapp-status] Verificando status da instância: ${instanceId}`);

    // Buscar instância do banco (RLS garante que é da empresa do usuário)
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
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

    // Mapear status da WUZAPI para nosso padrão
    let newStatus = 'disconnected';
    let jid = null;

    if (statusResult.Connected || statusResult.connected) {
      newStatus = 'connected';
      jid = statusResult.Jid || statusResult.jid || statusResult.JID;
    } else if (statusResult.LoggedIn === false || statusResult.logged_in === false) {
      newStatus = 'connecting';
    }

    // Atualizar status no banco se mudou
    if (newStatus !== instance.status || jid !== instance.jid) {
      await supabase
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
