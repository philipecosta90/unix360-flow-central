import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WHATSAPP_API_URL = Deno.env.get('WHATSAPP_API_URL') || 'https://weeb.inoovaweb.com.br';
const WHATSAPP_ADMIN_TOKEN = Deno.env.get('WHATSAPP_ADMIN_TOKEN') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[whatsapp-create-instance] Iniciando...');

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

    // Buscar empresa_id do usuário
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

    // Salvar instância no banco
    const { data: instance, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert({
        empresa_id: perfil.empresa_id,
        nome,
        numero,
        user_token: userToken,
        status: 'disconnected',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[whatsapp-create-instance] Erro ao salvar:', insertError);
      throw new Error('Erro ao salvar instância no banco');
    }

    console.log(`[whatsapp-create-instance] Instância criada com ID: ${instance.id}`);

    // Iniciar conexão com WhatsApp
    const connectResponse = await fetch(`${WHATSAPP_API_URL}/session/connect`, {
      method: 'POST',
      headers: {
        'token': userToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const connectResult = await connectResponse.json();
    console.log('[whatsapp-create-instance] Conexão iniciada:', JSON.stringify(connectResult));

    // Atualizar status para connecting
    await supabase
      .from('whatsapp_instances')
      .update({ status: 'connecting' })
      .eq('id', instance.id);

    return new Response(
      JSON.stringify({
        success: true,
        instance: {
          ...instance,
          status: 'connecting',
        },
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
