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
    const { customerId, subscriptionId } = await req.json()

    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY not found')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Criar assinatura no Asaas
    const subscriptionResponse = await fetch('https://sandbox.asaas.com/api/v3/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: 'UNDEFINED', // Permite todos os métodos
        value: 75.00,
        nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias de trial
        cycle: 'MONTHLY',
        description: 'Assinatura UniX360 - Plano Mensal'
      })
    })

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.text()
      console.error('Asaas Subscription API Error:', errorData)
      throw new Error(`Failed to create subscription: ${subscriptionResponse.status}`)
    }

    const subscription = await subscriptionResponse.json()

    // Atualizar assinatura no Supabase
    const { error } = await supabase
      .from('subscriptions')
      .update({
        asaas_customer_id: customerId,
        asaas_subscription_id: subscription.id,
        status: 'trial',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', subscriptionId)

    if (error) {
      console.error('Supabase error:', error)
      throw new Error('Failed to update subscription in database')
    }

    return new Response(
      JSON.stringify({ success: true, subscription }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})