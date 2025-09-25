import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request): Promise<Response> => {
  console.log('🚀 [SIGNUP-COMPLETE] Função iniciada');
  
  if (req.method === 'OPTIONS') {
    console.log('📋 [SIGNUP-COMPLETE] Respondendo preflight CORS');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ [SIGNUP-COMPLETE] Authorization header ausente');
      return new Response(
        JSON.stringify({ success: false, error: 'Token necessário' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Verificar usuário autenticado
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ [SIGNUP-COMPLETE] Usuário não autenticado:', userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('✅ [SIGNUP-COMPLETE] Usuário autenticado:', user.id);

    // Verificar se perfil já existe
    const { data: existingProfile } = await supabaseAdmin
      .from('perfis')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      console.log('⚠️ [SIGNUP-COMPLETE] Perfil já existe para usuário:', user.id);
      return new Response(
        JSON.stringify({ success: true, message: 'Usuário já configurado' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const nome = user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário';
    const nomeEmpresa = user.user_metadata?.nome_empresa || 'Empresa';

    // INÍCIO DA TRANSAÇÃO
    let newEmpresaId: string | null = null;

    try {
      // 1. Criar empresa
      console.log('🏢 [SIGNUP-COMPLETE] Criando empresa...');
      const { data: empresaData, error: empresaError } = await supabaseAdmin
        .from('empresas')
        .insert({
          nome: nomeEmpresa,
          email: user.email,
          plano: 'gratuito', // Plano padrão para novos cadastros
          ativa: true
        })
        .select()
        .single();

      if (empresaError || !empresaData) {
        throw new Error(`Erro ao criar empresa: ${empresaError?.message}`);
      }

      newEmpresaId = empresaData.id;
      console.log('✅ [SIGNUP-COMPLETE] Empresa criada:', newEmpresaId);

      // Criar etapas padrão do CRM para a nova empresa
      console.log('🎯 [SIGNUP-COMPLETE] Criando etapas padrão do CRM...');
      const { error: stagesError } = await supabaseAdmin.rpc('create_default_crm_stages_for_company', {
        p_empresa_id: newEmpresaId
      });

      if (stagesError) {
        console.error('❌ [SIGNUP-COMPLETE] Erro ao criar etapas padrão do CRM:', stagesError.message);
        // Não lançar erro aqui para não interromper o processo de criação do usuário
      } else {
        console.log('✅ [SIGNUP-COMPLETE] Etapas padrão do CRM criadas com sucesso');
      }

      // 2. Criar perfil com trial de 7 dias
      console.log('👤 [SIGNUP-COMPLETE] Criando perfil com trial de 7 dias...');
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialStartDate.getDate() + 7); // 7 dias de trial
      
      const { error: profileError } = await supabaseAdmin
        .from('perfis')
        .insert({
          user_id: user.id,
          empresa_id: newEmpresaId,
          nome: nome,
          nivel_permissao: 'operacional', // Usuários começam com nível operacional
          ativo: true,
          trial_start_date: trialStartDate.toISOString(),
          trial_end_date: trialEndDate.toISOString(),
          subscription_status: 'trial',
          subscription_plan: 'free'
        });

      if (profileError) {
        throw new Error(`Erro ao criar perfil: ${profileError.message}`);
      }

      console.log('✅ [SIGNUP-COMPLETE] Perfil criado com sucesso com trial de 7 dias');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Cadastro completado com sucesso',
          user: {
            id: user.id,
            email: user.email,
            nome: nome,
            empresa_id: newEmpresaId,
            nome_empresa: nomeEmpresa
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );

    } catch (transactionError: any) {
      console.error('💥 [SIGNUP-COMPLETE] Erro na transação, fazendo rollback...', transactionError);
      
      // Rollback: Remover empresa se foi criada
      if (newEmpresaId) {
        console.log('🧹 [SIGNUP-COMPLETE] Removendo empresa...');
        try {
          await supabaseAdmin
            .from('empresas')
            .delete()
            .eq('id', newEmpresaId);
          console.log('✅ [SIGNUP-COMPLETE] Empresa removida');
        } catch (deleteError) {
          console.error('❌ [SIGNUP-COMPLETE] Erro ao remover empresa:', deleteError);
        }
      }

      throw transactionError;
    }

  } catch (error: any) {
    console.error('💥 [SIGNUP-COMPLETE] Erro inesperado:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});