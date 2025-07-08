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
    const { name, email, phone, cpfCnpj } = await req.json()

    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY not found')
    }

    // Criar cliente no Asaas
    const customerResponse = await fetch('https://sandbox.asaas.com/api/v3/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        cpfCnpj,
        notificationDisabled: false
      })
    })

    if (!customerResponse.ok) {
      const errorData = await customerResponse.text()
      console.error('Asaas API Error:', errorData)
      throw new Error(`Failed to create customer: ${customerResponse.status}`)
    }

    const customer = await customerResponse.json()

    return new Response(
      JSON.stringify({ success: true, customer }),
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