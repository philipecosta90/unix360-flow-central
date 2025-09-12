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

    const { empresa_id, status = 'active', monthly_value = 75.00, days = 30 } = await req.json();

    if (!empresa_id) {
      return new Response('empresa_id is required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Verify empresa exists
    const { data: empresa, error: empresaError } = await supabaseClient
      .from('empresas')
      .select('id, nome')
      .eq('id', empresa_id)
      .single();

    if (empresaError || !empresa) {
      return new Response('Empresa not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Check if subscription already exists
    const { data: existingSubscription } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('empresa_id', empresa_id)
      .single();

    if (existingSubscription) {
      return new Response('Subscription already exists for this company', { 
        status: 409, 
        headers: corsHeaders 
      });
    }

    // Calculate dates
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);

    // Create new subscription
    const subscriptionData = {
      empresa_id,
      status,
      monthly_value,
      current_period_start: now.toISOString(),
      current_period_end: endDate.toISOString(),
      trial_start_date: status === 'trial' ? now.toISOString() : null,
      trial_end_date: status === 'trial' ? endDate.toISOString() : null,
    };

    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (subscriptionError) {
      console.error('Create subscription error:', subscriptionError);
      return new Response('Failed to create subscription', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Log the action
    await supabaseClient.rpc('log_subscription_action', {
      p_subscription_id: subscription.id,
      p_action: 'ADMIN_CREATE_SUBSCRIPTION'
    });

    // If active status, activate users
    if (status === 'active') {
      await supabaseClient
        .from('perfis')
        .update({ ativo: true })
        .eq('empresa_id', empresa_id);
    }

    console.log('Subscription created successfully:', { subscription_id: subscription.id, empresa_id });

    return new Response(JSON.stringify({ 
      success: true, 
      subscription_id: subscription.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Admin create subscription error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});