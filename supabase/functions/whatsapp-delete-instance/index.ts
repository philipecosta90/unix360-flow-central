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

    // Buscar a instância para verificar propriedade e obter wuzapi_id
    const { data: instance, error: instanceError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('empresa_id', perfil.empresa_id)
      .single();

    if (instanceError || !instance) {
      throw new Error('Instância não encontrada ou sem permissão');
    }

    console.log(`[whatsapp-delete-instance] Instância encontrada:`, {
      id: instance.id,
      wuzapi_id: instance.wuzapi_id,
      nome: instance.nome
    });

    // Tentar deletar na WUZAPI se tiver o wuzapi_id
    if (instance.wuzapi_id) {
      try {
        console.log(`[whatsapp-delete-instance] Deletando na WUZAPI: ${instance.wuzapi_id}`);
        
        const deleteResponse = await fetch(
          `${WHATSAPP_API_URL}/admin/users/${instance.wuzapi_id}/full`,
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
        }
      } catch (apiError) {
        console.warn('[whatsapp-delete-instance] Aviso: Falha ao conectar na WUZAPI:', apiError);
        // Continua para deletar do banco mesmo se falhar na API
      }
    } else {
      console.log('[whatsapp-delete-instance] Instância sem wuzapi_id, pulando delete na API');
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
