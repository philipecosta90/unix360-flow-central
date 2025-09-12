import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

// Initialize Supabase client with service role key for full access
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const webhookSecret = Deno.env.get('CAKTO_WEBHOOK_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CaktoEvent {
  type: string;
  id: string;
  data: {
    id?: string;
    subscription_id?: string;
    customer_email?: string;
    amount_cents?: number;
    currency?: string;
    payment_method?: string;
    status?: string;
    metadata?: {
      empresa_id?: string;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature
    const signature = req.headers.get('x-webhook-signature');
    if (!signature) {
      console.error('Missing webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.text();
    
    // Simple signature verification (adjust based on Cakto's implementation)
    const expectedSignature = webhookSecret; // Simplified - implement proper HMAC if needed
    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const event: CaktoEvent = JSON.parse(body);
    
    console.log('Cakto webhook received:', {
      event: event.type,
      external_event_id: event.id,
      empresa_id: event.data.metadata?.empresa_id
    });

    // Check for idempotency - ignore duplicate events
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('external_event_id', event.id)
      .single();

    if (existingPayment) {
      console.log('Event already processed, skipping:', event.id);
      return new Response(JSON.stringify({ success: true, message: 'Event already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const empresaId = event.data.metadata?.empresa_id;
    
    switch (event.type) {
      case 'pix_gerado':
        await handlePixGenerated(event, empresaId);
        break;
      
      case 'purchase_approved':
        await handlePurchaseApproved(event, empresaId);
        break;
      
      case 'purchase_refused':
        await handlePurchaseRefused(event, empresaId);
        break;
      
      case 'refund':
      case 'chargeback':
        await handleRefundOrChargeback(event, empresaId);
        break;
      
      case 'subscription_canceled':
        await handleSubscriptionCanceled(event, empresaId);
        break;
      
      default:
        console.log('Unhandled event type:', event.type);
        break;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handlePixGenerated(event: CaktoEvent, empresaId?: string) {
  await supabase.from('payments').insert({
    external_event_id: event.id,
    subscription_id: event.data.subscription_id,
    empresa_id: empresaId,
    customer_email: event.data.customer_email,
    amount_cents: event.data.amount_cents,
    currency: event.data.currency || 'BRL',
    method: 'pix',
    status: 'pending',
    occurred_at: new Date().toISOString()
  });
}

async function handlePurchaseApproved(event: CaktoEvent, empresaId?: string) {
  // Insert payment record
  await supabase.from('payments').insert({
    external_event_id: event.id,
    subscription_id: event.data.subscription_id,
    empresa_id: empresaId,
    customer_email: event.data.customer_email,
    amount_cents: event.data.amount_cents,
    currency: event.data.currency || 'BRL',
    method: event.data.payment_method || 'unknown',
    status: 'approved',
    occurred_at: new Date().toISOString()
  });

  // Update or create subscription
  if (empresaId) {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await supabase.from('subscriptions').upsert({
      empresa_id: empresaId,
      cakto_subscription_id: event.data.subscription_id,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: nextMonth.toISOString(),
      is_recurring: true,
      updated_at: now.toISOString()
    }, {
      onConflict: 'empresa_id'
    });

    console.log('Subscription activated for empresa:', empresaId);
  }
}

async function handlePurchaseRefused(event: CaktoEvent, empresaId?: string) {
  await supabase.from('payments').insert({
    external_event_id: event.id,
    subscription_id: event.data.subscription_id,
    empresa_id: empresaId,
    customer_email: event.data.customer_email,
    amount_cents: event.data.amount_cents,
    currency: event.data.currency || 'BRL',
    method: event.data.payment_method || 'unknown',
    status: 'refused',
    occurred_at: new Date().toISOString()
  });
}

async function handleRefundOrChargeback(event: CaktoEvent, empresaId?: string) {
  // Insert payment record
  await supabase.from('payments').insert({
    external_event_id: event.id,
    subscription_id: event.data.subscription_id,
    empresa_id: empresaId,
    customer_email: event.data.customer_email,
    amount_cents: event.data.amount_cents,
    currency: event.data.currency || 'BRL',
    method: event.data.payment_method || 'unknown',
    status: 'refunded',
    occurred_at: new Date().toISOString()
  });

  // Suspend subscription
  if (empresaId) {
    await supabase.from('subscriptions')
      .update({ 
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('empresa_id', empresaId);
      
    console.log('Subscription suspended for empresa:', empresaId);
  }
}

async function handleSubscriptionCanceled(event: CaktoEvent, empresaId?: string) {
  if (empresaId) {
    const now = new Date();
    await supabase.from('subscriptions')
      .update({ 
        status: 'cancelled',
        cancel_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('empresa_id', empresaId);
      
    console.log('Subscription cancelled for empresa:', empresaId);
  }
}