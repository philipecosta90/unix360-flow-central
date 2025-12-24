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

    // Parse do body ou query params
    const url = new URL(req.url);
    const instanceId = url.searchParams.get('instanceId');

    if (!instanceId) {
      throw new Error('instanceId é obrigatório');
    }

    console.log(`[whatsapp-qrcode] Buscando QR Code para instância: ${instanceId}`);

    // Buscar instância do banco (RLS garante que é da empresa do usuário)
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) {
      throw new Error('Instância não encontrada');
    }

    // Buscar QR Code da WUZAPI
    const qrResponse = await fetch(`${WHATSAPP_API_URL}/session/qr`, {
      method: 'GET',
      headers: {
        'token': instance.user_token,
      },
    });

    const qrResult = await qrResponse.json();
    console.log('[whatsapp-qrcode] Resposta WUZAPI:', JSON.stringify(qrResult).substring(0, 200));

    if (!qrResponse.ok) {
      throw new Error(qrResult.message || 'Erro ao obter QR Code');
    }

    return new Response(
      JSON.stringify({
        success: true,
        qrcode: qrResult.QRCode || qrResult.qrcode || qrResult.data,
        status: instance.status,
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
