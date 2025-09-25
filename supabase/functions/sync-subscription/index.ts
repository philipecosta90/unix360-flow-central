import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    );

    // Get webhook data from N8N
    const subscriptionData = await req.json();
    logStep('Received subscription data from N8N', { 
      id_assinatura: subscriptionData.id_assinatura,
      email: subscriptionData.email,
      status: subscriptionData.status 
    });

    if (!subscriptionData.email || !subscriptionData.id_assinatura) {
      throw new Error('Dados obrigatórios não fornecidos (email, id_assinatura)');
    }

    // Buscar perfil pelo email (incluindo inativos para permitir reativação)
    const { data: profile, error: profileError } = await supabaseClient
      .from('perfis')
      .select('id, user_id, empresa_id, nome, email')
      .eq('email', subscriptionData.email)
      .maybeSingle();

    if (profileError) {
      logStep('ERROR finding profile by email', { error: profileError.message, email: subscriptionData.email });
      throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
    }

    if (!profile) {
      logStep('No profile found for email', { email: subscriptionData.email });
      return new Response(JSON.stringify({ 
        success: false, 
        message: `Nenhum perfil encontrado para o email: ${subscriptionData.email}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    logStep('Found profile', { profileId: profile.id });

    // Inserir/atualizar dados na tabela assinaturas_cakto
    const { error: upsertError } = await supabaseClient
      .from('assinaturas_cakto')
      .upsert({
        perfil_id: profile.id,
        id_assinatura: subscriptionData.id_assinatura,
        nome: subscriptionData.nome || profile.nome,
        email: subscriptionData.email,
        whatsapp: subscriptionData.whatsapp,
        data_de_ativacao: subscriptionData.data_de_ativacao,
        data_de_expiracao: subscriptionData.data_de_expiracao,
        status: subscriptionData.status,
      }, {
        onConflict: 'id_assinatura'
      });

    if (upsertError) {
      logStep('ERROR upserting subscription', { error: upsertError.message });
      throw new Error(`Erro ao salvar assinatura: ${upsertError.message}`);
    }

    logStep('Subscription data saved successfully');

    // Mapear status do Cakto para nossos status internos
    const getSubscriptionStatus = (caktoStatus: string) => {
      switch (caktoStatus.toLowerCase()) {
        case 'ativo':
        case 'active':
        case 'pago':
          return 'active';
        case 'cancelado':
        case 'canceled':
          return 'canceled';
        case 'expirado':
        case 'expired':
        case 'vencido':
          return 'expired';
        default:
          return 'canceled';
      }
    };

    const subscriptionStatus = getSubscriptionStatus(subscriptionData.status);
    const isActive = subscriptionStatus === 'active';
    
    // Preparar dados de atualização
    const updateData: any = {
      subscription_status: subscriptionStatus,
      subscription_plan: 'premium',
    };

    // Se a assinatura está ativa, definir as datas de assinatura ativa e limpar trial
    if (isActive) {
      updateData.data_de_assinatura_ativa = subscriptionData.data_de_ativacao;
      updateData.data_de_expiracao_da_assinatura_ativa = subscriptionData.data_de_expiracao;
      updateData.trial_start_date = null; // Limpar trial se houver assinatura ativa
      updateData.trial_end_date = null;
      updateData.ativo = true; // Reativar perfil se assinatura ativa
    } else if (subscriptionStatus === 'expired') {
      // Para assinaturas expiradas, manter as datas mas marcar como inativo
      updateData.ativo = false;
      // Manter as datas de assinatura para referência histórica
      if (subscriptionData.data_de_ativacao) {
        updateData.data_de_assinatura_ativa = subscriptionData.data_de_ativacao;
      }
      if (subscriptionData.data_de_expiracao) {
        updateData.data_de_expiracao_da_assinatura_ativa = subscriptionData.data_de_expiracao;
      }
    }

    logStep('Updating profile with subscription data', { 
      profileId: profile.id, 
      updateData: updateData 
    });
    
    // Atualizar status no perfil do usuário
    const { error: updateProfileError } = await supabaseClient
      .from('perfis')
      .update(updateData)
      .eq('id', profile.id);

    if (updateProfileError) {
      logStep('ERROR updating profile', { error: updateProfileError.message });
      throw new Error(`Erro ao atualizar perfil: ${updateProfileError.message}`);
    }

    logStep('Profile updated successfully', { 
      profileId: profile.id, 
      newStatus: subscriptionStatus 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Assinatura sincronizada com sucesso',
      profileId: profile.id,
      subscriptionStatus 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in sync-subscription', { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});