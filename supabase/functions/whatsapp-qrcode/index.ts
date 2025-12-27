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
    console.log('[whatsapp-qrcode] Iniciando...');

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

    console.log(`[whatsapp-qrcode] Buscando QR Code para instância: ${instanceId}`);

    // Buscar instância do banco usando admin, mas validar empresa_id
    const { data: instance, error: instanceError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('empresa_id', perfil.empresa_id)
      .single();

    if (instanceError || !instance) {
      console.error('[whatsapp-qrcode] Instância não encontrada:', instanceError);
      throw new Error('Instância não encontrada');
    }

    console.log(`[whatsapp-qrcode] Instância encontrada, status: ${instance.status}, token: ${instance.user_token.substring(0, 4)}...`);

    // Primeiro, verificar status atual da sessão na WUZAPI
    const statusResponse = await fetch(`${WHATSAPP_API_URL}/session/status`, {
      method: 'GET',
      headers: {
        'token': instance.user_token,
      },
    });

    const statusResult = await statusResponse.json();
    console.log('[whatsapp-qrcode] Status da sessão:', JSON.stringify(statusResult));

    // Se não estiver conectado, iniciar a conexão primeiro
    if (!statusResult.data?.Connected && !statusResult.Connected) {
      console.log('[whatsapp-qrcode] Sessão não conectada, iniciando conexão...');
      
      const connectResponse = await fetch(`${WHATSAPP_API_URL}/session/connect`, {
        method: 'POST',
        headers: {
          'token': instance.user_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const connectResult = await connectResponse.json();
      console.log('[whatsapp-qrcode] Resposta connect:', JSON.stringify(connectResult));

      // Atualizar status para connecting
      await supabaseAdmin
        .from('whatsapp_instances')
        .update({ status: 'connecting' })
        .eq('id', instanceId);

      // Aguardar um pouco para o QR ser gerado
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Buscar QR Code da WUZAPI
    const qrResponse = await fetch(`${WHATSAPP_API_URL}/session/qr`, {
      method: 'GET',
      headers: {
        'token': instance.user_token,
      },
    });

    const qrResult = await qrResponse.json();
    console.log('[whatsapp-qrcode] Resposta QR:', JSON.stringify(qrResult).substring(0, 200));

    if (!qrResponse.ok) {
      throw new Error(qrResult.message || 'Erro ao obter QR Code');
    }

    return new Response(
      JSON.stringify({
        success: true,
        qrcode: qrResult.data?.QRCode || qrResult.QRCode || qrResult.qrcode,
        status: 'connecting',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[whatsapp-qrcode] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
