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

    // Buscar dados da assinatura atual para calcular dias restantes do trial
    const { data: currentSubscription } = await supabase
      .from('subscriptions')
      .select('trial_end_date, status')
      .eq('id', subscriptionId)
      .single()

    let nextDueDate = new Date()
    
    // Se está em trial e ainda não expirou, usar a data de fim do trial como primeira cobrança
    if (currentSubscription?.status === 'trial') {
      const trialEndDate = new Date(currentSubscription.trial_end_date)
      const now = new Date()
      
      if (trialEndDate > now) {
        // Trial ainda ativo - primeira cobrança será na data de fim do trial
        nextDueDate = trialEndDate
      } else {
        // Trial expirado - cobrar imediatamente
        nextDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // Amanhã
      }
    } else {
      // Não é trial - cobrar imediatamente
      nextDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // Amanhã
    }

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
        nextDueDate: nextDueDate.toISOString().split('T')[0],
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
        status: 'active', // Muda para ativo imediatamente
        current_period_start: new Date().toISOString(),
        current_period_end: nextDueDate.toISOString() // Primeiro período vai até a próxima cobrança
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