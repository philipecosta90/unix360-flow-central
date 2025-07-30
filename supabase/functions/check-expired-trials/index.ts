import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-EXPIRED-TRIALS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get current date
    const now = new Date();
    logStep("Current timestamp", { now: now.toISOString() });

    // Find all trial subscriptions that have expired
    const { data: expiredTrials, error: selectError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, empresa_id, trial_end_date, status')
      .eq('status', 'trial')
      .lt('trial_end_date', now.toISOString());

    if (selectError) {
      logStep("Error fetching expired trials", { error: selectError });
      throw selectError;
    }

    logStep("Found expired trials", { count: expiredTrials?.length || 0 });

    let updatedCount = 0;

    if (expiredTrials && expiredTrials.length > 0) {
      // Update all expired trials to suspended status
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({ 
          status: 'suspended',
          updated_at: now.toISOString()
        })
        .in('id', expiredTrials.map(sub => sub.id));

      if (updateError) {
        logStep("Error updating expired trials", { error: updateError });
        throw updateError;
      }

      updatedCount = expiredTrials.length;
      logStep("Successfully updated expired trials", { updatedCount });

      // Create notifications for each expired trial
      const notifications = expiredTrials.map(trial => ({
        empresa_id: trial.empresa_id,
        user_id: null, // Will be handled by admin notifications
        type: 'subscription_expired',
        title: 'Trial Expirado',
        message: 'Seu período de trial expirou. Para continuar usando o sistema, realize o pagamento da assinatura.',
        read: false,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }));

      // Insert notifications (if there are users to notify)
      if (notifications.length > 0) {
        const { error: notificationError } = await supabaseAdmin
          .from('notifications')
          .insert(notifications);

        if (notificationError) {
          logStep("Error creating notifications", { error: notificationError });
          // Don't throw here, notifications are not critical
        } else {
          logStep("Created notifications for expired trials", { count: notifications.length });
        }
      }
    }

    // Also check for trials that will expire soon (next 3 days) and create warning notifications
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    const { data: expiringSoon, error: expiringSoonError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, empresa_id, trial_end_date, status')
      .eq('status', 'trial')
      .gte('trial_end_date', now.toISOString())
      .lte('trial_end_date', threeDaysFromNow.toISOString());

    if (expiringSoonError) {
      logStep("Error fetching trials expiring soon", { error: expiringSoonError });
    } else if (expiringSoon && expiringSoon.length > 0) {
      logStep("Found trials expiring soon", { count: expiringSoon.length });

      // Create warning notifications for trials expiring soon
      const warningNotifications = expiringSoon.map(trial => {
        const daysLeft = Math.ceil((new Date(trial.trial_end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          empresa_id: trial.empresa_id,
          user_id: null,
          type: 'trial_expiring',
          title: 'Trial Expirando',
          message: `Seu trial expira em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}. Assine agora para manter o acesso ao sistema.`,
          read: false,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        };
      });

      const { error: warningNotificationError } = await supabaseAdmin
        .from('notifications')
        .insert(warningNotifications);

      if (warningNotificationError) {
        logStep("Error creating warning notifications", { error: warningNotificationError });
      } else {
        logStep("Created warning notifications", { count: warningNotifications.length });
      }
    }

    logStep("Function completed successfully", { 
      expiredTrialsUpdated: updatedCount,
      trialsExpiringSoon: expiringSoon?.length || 0
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Trial check completed successfully',
      expiredTrialsUpdated: updatedCount,
      trialsExpiringSoon: expiringSoon?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-expired-trials", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});