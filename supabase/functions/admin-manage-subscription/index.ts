import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Check if user is super admin
    const { data: isSuperAdmin } = await userSupabase.rpc('is_super_admin');
    if (!isSuperAdmin) {
      return new Response('Unauthorized', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const { subscription_id, action, days } = await req.json();

    if (!subscription_id || !action) {
      return new Response('subscription_id and action are required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Get current subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .single();

    if (subError || !subscription) {
      return new Response('Subscription not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    const oldStatus = subscription.status;
    let updateData: any = { updated_at: new Date().toISOString() };

    switch (action) {
      case 'activate':
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + (days || 30));
        
        updateData = {
          ...updateData,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: endDate.toISOString(),
        };

        // Activate users
        await supabaseClient
          .from('perfis')
          .update({ ativo: true })
          .eq('empresa_id', subscription.empresa_id);
        break;

      case 'suspend':
        updateData.status = 'suspended';
        
        // Deactivate users
        await supabaseClient
          .from('perfis')
          .update({ ativo: false })
          .eq('empresa_id', subscription.empresa_id);
        break;

      case 'cancel':
        updateData.status = 'cancelled';
        updateData.cancel_at = new Date().toISOString();
        
        // Deactivate users
        await supabaseClient
          .from('perfis')
          .update({ ativo: false })
          .eq('empresa_id', subscription.empresa_id);
        break;

      case 'delete':
        // Delete subscription
        const { error: deleteError } = await supabaseClient
          .from('subscriptions')
          .delete()
          .eq('id', subscription_id);

        if (deleteError) {
          console.error('Delete subscription error:', deleteError);
          return new Response('Failed to delete subscription', { 
            status: 500, 
            headers: corsHeaders 
          });
        }

        // Deactivate users
        await supabaseClient
          .from('perfis')
          .update({ ativo: false })
          .eq('empresa_id', subscription.empresa_id);

        // Log the action
        await supabaseClient.rpc('log_subscription_action', {
          p_subscription_id: subscription_id,
          p_action: 'ADMIN_DELETE_SUBSCRIPTION'
        });

        return new Response(JSON.stringify({ 
          success: true, 
          action: 'deleted' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response('Invalid action', { 
          status: 400, 
          headers: corsHeaders 
        });
    }

    // Update subscription
    const { error: updateError } = await supabaseClient
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription_id);

    if (updateError) {
      console.error('Update subscription error:', updateError);
      return new Response('Failed to update subscription', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Log the action
    await supabaseClient.rpc('log_subscription_action', {
      p_subscription_id: subscription_id,
      p_action: `ADMIN_${action.toUpperCase()}_SUBSCRIPTION`,
      p_old_status: oldStatus,
      p_new_status: updateData.status || oldStatus
    });

    console.log('Subscription updated successfully:', { subscription_id, action, oldStatus, newStatus: updateData.status });

    return new Response(JSON.stringify({ 
      success: true, 
      action,
      old_status: oldStatus,
      new_status: updateData.status || oldStatus
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Admin manage subscription error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});