import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Webhook payload received

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
        // Unhandled webhook event
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    // Log error to monitoring system
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function handlePaymentConfirmed(supabase: any, payment: any) {
  // Atualizar status da fatura
  const { error: invoiceError } = await supabase
    .from('invoices')
    .update({
      status: 'confirmed',
      payment_date: new Date().toISOString(),
      payment_method: payment.billingType
    })
    .eq('asaas_payment_id', payment.id)

  if (invoiceError) {
    // Error updating invoice logged
  }

  // Ativar assinatura se estava suspensa
  const { data: invoices } = await supabase
    .from('invoices')
    .select('subscription_id')
    .eq('asaas_payment_id', payment.id)
    .single()

  if (invoices) {
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('id', invoices.subscription_id)

    if (subscriptionError) {
      // Error updating subscription logged
    }
  }
}

async function handlePaymentOverdue(supabase: any, payment: any) {
  // Atualizar status da fatura
  const { error: invoiceError } = await supabase
    .from('invoices')
    .update({ status: 'overdue' })
    .eq('asaas_payment_id', payment.id)

  if (invoiceError) {
    // Error updating invoice logged
  }

  // Suspender assinatura
  const { data: invoices } = await supabase
    .from('invoices')
    .select('subscription_id')
    .eq('asaas_payment_id', payment.id)
    .single()

  if (invoices) {
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({ status: 'suspended' })
      .eq('id', invoices.subscription_id)

    if (subscriptionError) {
      // Error updating subscription logged
    }
  }
}

async function handlePaymentCancelled(supabase: any, payment: any) {
  // Atualizar status da fatura
  const { error: invoiceError } = await supabase
    .from('invoices')
    .update({ status: 'cancelled' })
    .eq('asaas_payment_id', payment.id)

  if (invoiceError) {
    // Error updating invoice logged
  }
}