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
    console.log('[whatsapp-delete-instance] Iniciando...');

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
    const { instanceId } = await req.json();

    if (!instanceId) {
      throw new Error('instanceId é obrigatório');
    }

    console.log(`[whatsapp-delete-instance] Deletando instância: ${instanceId}`);

    // Buscar a instância para verificar propriedade e obter wuzapi_id e user_token
    const { data: instance, error: instanceError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('id, empresa_id, nome, numero, wuzapi_id, user_token')
      .eq('id', instanceId)
      .eq('empresa_id', perfil.empresa_id)
      .single();

    if (instanceError || !instance) {
      console.error('[whatsapp-delete-instance] Erro ao buscar instância:', instanceError);
      throw new Error('Instância não encontrada ou sem permissão');
    }

    console.log(`[whatsapp-delete-instance] Instância encontrada:`, {
      id: instance.id,
      wuzapi_id: instance.wuzapi_id,
      user_token: instance.user_token ? 'presente' : 'ausente',
      nome: instance.nome
    });

    // Tentar deletar na WUZAPI
    let wuzapiIdToDelete = instance.wuzapi_id;

    // Se não tiver wuzapi_id, tentar encontrar pelo user_token
    if (!wuzapiIdToDelete && instance.user_token) {
      try {
        console.log('[whatsapp-delete-instance] Buscando instância na WUZAPI pelo user_token...');
        
        const listResponse = await fetch(`${WHATSAPP_API_URL}/admin/users`, {
          headers: {
            'Authorization': WHATSAPP_ADMIN_TOKEN,
            'Content-Type': 'application/json',
          },
        });

        if (listResponse.ok) {
          const listResult = await listResponse.json();
          console.log('[whatsapp-delete-instance] Usuários na WUZAPI:', listResult.data?.length || 0);
          
          // Encontrar pelo token
          const wuzapiUser = listResult.data?.find((u: any) => u.token === instance.user_token);
          if (wuzapiUser) {
            wuzapiIdToDelete = wuzapiUser.id;
            console.log(`[whatsapp-delete-instance] Encontrado wuzapi_id via token: ${wuzapiIdToDelete}`);
          } else {
            console.log('[whatsapp-delete-instance] Usuário não encontrado na WUZAPI pelo token');
          }
        }
      } catch (searchError) {
        console.warn('[whatsapp-delete-instance] Erro ao buscar na WUZAPI:', searchError);
      }
    }

    // Deletar na WUZAPI se encontrou o ID
    if (wuzapiIdToDelete) {
      try {
        console.log(`[whatsapp-delete-instance] Deletando na WUZAPI: ${wuzapiIdToDelete}`);
        
        const deleteResponse = await fetch(
          `${WHATSAPP_API_URL}/admin/users/${wuzapiIdToDelete}/full`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': WHATSAPP_ADMIN_TOKEN,
              'Content-Type': 'application/json',
            },
          }
        );

        const deleteResult = await deleteResponse.json();
        console.log('[whatsapp-delete-instance] Resposta WUZAPI delete:', JSON.stringify(deleteResult));

        if (!deleteResponse.ok) {
          console.warn('[whatsapp-delete-instance] Aviso: Erro ao deletar na WUZAPI, continuando com remoção local');
        } else {
          console.log('[whatsapp-delete-instance] Instância deletada da WUZAPI com sucesso');
        }
      } catch (apiError) {
        console.warn('[whatsapp-delete-instance] Aviso: Falha ao conectar na WUZAPI:', apiError);
      }
    } else {
      console.log('[whatsapp-delete-instance] Sem wuzapi_id disponível, apenas removendo do banco');
    }

    // Deletar do banco Supabase
    const { error: deleteError } = await supabaseAdmin
      .from('whatsapp_instances')
      .delete()
      .eq('id', instanceId);

    if (deleteError) {
      console.error('[whatsapp-delete-instance] Erro ao deletar do banco:', deleteError);
      throw new Error('Erro ao deletar instância do banco');
    }

    console.log(`[whatsapp-delete-instance] Instância ${instanceId} deletada com sucesso`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Instância deletada com sucesso',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[whatsapp-delete-instance] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
