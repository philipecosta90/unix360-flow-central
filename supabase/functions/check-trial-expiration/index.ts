import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-TRIAL-EXPIRATION] ${step}${detailsStr}`);
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

    // Find trials that have expired
    const { data: expiredTrials, error: selectError } = await supabaseClient
      .from('perfis')
      .select('id, nome, trial_end_date, user_id')
      .eq('subscription_status', 'trial')
      .lt('trial_end_date', new Date().toISOString());

    if (selectError) {
      logStep('ERROR selecting expired trials', { error: selectError.message });
      throw new Error(`Erro ao buscar trials expirados: ${selectError.message}`);
    }

    if (!expiredTrials || expiredTrials.length === 0) {
      logStep('No expired trials found');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhum trial expirado encontrado',
        expiredCount: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    logStep('Found expired trials', { count: expiredTrials.length });

    // Update expired trials to 'expired' status
    const expiredIds = expiredTrials.map(trial => trial.id);
    const { error: updateError } = await supabaseClient
      .from('perfis')
      .update({
        subscription_status: 'expired'
      })
      .in('id', expiredIds);

    if (updateError) {
      logStep('ERROR updating expired trials', { error: updateError.message });
      throw new Error(`Erro ao atualizar trials expirados: ${updateError.message}`);
    }

    logStep('Successfully updated expired trials', { count: expiredTrials.length });

    // Optionally create notifications for expired users
    const notifications = expiredTrials.map(trial => ({
      user_id: trial.user_id,
      empresa_id: null, // Will need to get from profile if needed
      title: 'Trial Expirado',
      message: 'Seu período de trial de 7 dias expirou. Assine agora para continuar usando todas as funcionalidades.',
      type: 'subscription_expired',
      read: false
    }));

    // Insert notifications (if you have a notifications table)
    // Commented out as it depends on your notification system
    /*
    if (notifications.length > 0) {
      const { error: notificationError } = await supabaseClient
        .from('notifications')
        .insert(notifications);
      
      if (notificationError) {
        logStep('ERROR creating notifications', { error: notificationError.message });
      } else {
        logStep('Notifications created successfully', { count: notifications.length });
      }
    }
    */

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${expiredTrials.length} trials expirados foram atualizados`,
      expiredCount: expiredTrials.length,
      expiredTrials: expiredTrials.map(t => ({ id: t.id, nome: t.nome }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in check-trial-expiration', { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});