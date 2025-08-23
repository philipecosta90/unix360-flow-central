import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ASAAS-CREATE-CUSTOMER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    logStep("Function started");

    const { name, email, phone, cpfCnpj } = await req.json()
    logStep("Request data received", { email, name });

    // Determine environment and API key
    const asaasEnv = Deno.env.get('ASAAS_ENV') || 'sandbox';
    const asaasApiKey = asaasEnv === 'production' 
      ? Deno.env.get('ASAAS_PRODUCTION_API_KEY') 
      : Deno.env.get('ASAAS_API_KEY');
    
    if (!asaasApiKey) {
      throw new Error(`ASAAS API key not found for environment: ${asaasEnv}`)
    }

    // Define API base URL based on environment
    const apiBaseUrl = asaasEnv === 'production' 
      ? 'https://api.asaas.com/api/v3' 
      : 'https://sandbox.asaas.com/api/v3';

    logStep("Using environment", { env: asaasEnv, baseUrl: apiBaseUrl });

    // Criar cliente no Asaas
    const customerResponse = await fetch(`${apiBaseUrl}/customers`, {
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
      logStep('Asaas API Error', { status: customerResponse.status, error: errorData });
      throw new Error(`Failed to create customer: ${customerResponse.status} - ${errorData}`)
    }

    const customer = await customerResponse.json()
    logStep("Customer created successfully", { customerId: customer.id });

    return new Response(
      JSON.stringify({ success: true, customer }),
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