import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ASAAS-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    logStep("Webhook payload received", { event: payload.event, paymentId: payload.payment?.id });
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Processar webhook baseado no evento
    switch (payload.event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        await handlePaymentConfirmed(supabase, payload.payment)
        break
      
      case 'PAYMENT_OVERDUE':
        await handlePaymentOverdue(supabase, payload.payment)
        break
      
      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
        await handlePaymentCancelled(supabase, payload.payment)
        break

      default:
        logStep("Unhandled webhook event", { event: payload.event });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function handlePaymentConfirmed(supabase: any, payment: any) {
  logStep("Processing payment confirmation", { paymentId: payment.id });

  // First, try to update existing invoice
  const { error: invoiceError } = await supabase
    .from('invoices')
    .update({
      status: 'confirmed',
      payment_date: new Date().toISOString(),
      payment_method: payment.billingType
    })
    .eq('asaas_payment_id', payment.id)

  if (invoiceError) {
    logStep("Error updating invoice", invoiceError);
    
    // If invoice doesn't exist, try to create it (upsert behavior)
    const { error: upsertError } = await supabase
      .from('invoices')
      .upsert({
        asaas_payment_id: payment.id,
        amount: payment.value,
        status: 'confirmed',
        payment_date: new Date().toISOString(),
        payment_method: payment.billingType,
        due_date: payment.dueDate
      }, { 
        onConflict: 'asaas_payment_id',
        ignoreDuplicates: false 
      })

    if (upsertError) {
      logStep("Error upserting invoice", upsertError);
    } else {
      logStep("Invoice created via upsert");
    }
  } else {
    logStep("Invoice updated successfully");
  }

  // Find and activate subscription
  const { data: invoices } = await supabase
    .from('invoices')
    .select('subscription_id')
    .eq('asaas_payment_id', payment.id)
    .single()

  if (invoices) {
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoices.subscription_id)

    if (subscriptionError) {
      logStep("Error updating subscription to active", subscriptionError);
    } else {
      logStep("Subscription activated", { subscriptionId: invoices.subscription_id });
    }
  }
}

async function handlePaymentOverdue(supabase: any, payment: any) {
  logStep("Processing payment overdue", { paymentId: payment.id });

  // Update invoice status
  const { error: invoiceError } = await supabase
    .from('invoices')
    .update({ status: 'overdue' })
    .eq('asaas_payment_id', payment.id)

  if (invoiceError) {
    logStep("Error updating invoice to overdue", invoiceError);
  }

  // Suspend subscription
  const { data: invoices } = await supabase
    .from('invoices')
    .select('subscription_id')
    .eq('asaas_payment_id', payment.id)
    .single()

  if (invoices) {
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoices.subscription_id)

    if (subscriptionError) {
      logStep("Error suspending subscription", subscriptionError);
    } else {
      logStep("Subscription suspended", { subscriptionId: invoices.subscription_id });
    }
  }
}

async function handlePaymentCancelled(supabase: any, payment: any) {
  logStep("Processing payment cancellation", { paymentId: payment.id });

  // Update invoice status
  const { error: invoiceError } = await supabase
    .from('invoices')
    .update({ status: 'cancelled' })
    .eq('asaas_payment_id', payment.id)

  if (invoiceError) {
    logStep("Error updating invoice to cancelled", invoiceError);
  }
}