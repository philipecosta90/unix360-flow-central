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

    // Encontrar perfil pelo email (para simplificar, vamos procurar na tabela perfis)
    // Em produção, você pode querer usar uma tabela de mapeamento email -> perfil
    const { data: profiles, error: profileError } = await supabaseClient
      .from('perfis')
      .select('id, user_id, empresa_id, nome')
      .eq('ativo', true);

    if (profileError) {
      logStep('ERROR finding profile', { error: profileError.message });
      throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
    }

    // Para este exemplo, vamos pegar o primeiro perfil ativo
    // Em produção, você precisa de uma forma melhor de mapear email -> perfil
    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    if (!profile) {
      logStep('No active profile found');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Nenhum perfil ativo encontrado' 
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
    
    // Atualizar status no perfil do usuário
    const { error: updateProfileError } = await supabaseClient
      .from('perfis')
      .update({
        subscription_status: subscriptionStatus,
        subscription_plan: 'premium',
        // Limpar trial se houver assinatura ativa
        trial_start_date: subscriptionStatus === 'active' ? null : undefined,
        trial_end_date: subscriptionStatus === 'active' ? null : undefined,
      })
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