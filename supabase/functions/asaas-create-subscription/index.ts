import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ASAAS-CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    logStep("Function started");
    
    const { customerId, subscriptionId, selectedMethod } = await req.json()
    logStep("Request data received", { customerId, subscriptionId, selectedMethod });

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

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current subscription data to determine nextDueDate
    const { data: currentSubscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('trial_end_date, monthly_value')
      .eq('id', subscriptionId)
      .single()

    if (subscriptionError || !currentSubscription) {
      throw new Error('Subscription not found')
    }

    logStep("Current subscription found", { 
      trialEndDate: currentSubscription.trial_end_date,
      monthlyValue: currentSubscription.monthly_value 
    });

    // Calculate next due date (after trial ends)
    const nextDueDate = new Date(currentSubscription.trial_end_date);
    const nextDueDateStr = nextDueDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    logStep("Calculated next due date", { nextDueDate: nextDueDateStr });

    // Create subscription in Asaas
    const subscriptionData = {
      customer: customerId,
      billingType: selectedMethod, // Use the selected method (PIX, BOLETO)
      value: currentSubscription.monthly_value,
      nextDueDate: nextDueDateStr,
      cycle: 'MONTHLY',
      description: 'Assinatura UniX360 - Gestão Empresarial',
      endDate: null,
      maxPayments: null
    };

    logStep("Creating Asaas subscription", subscriptionData);

    const asaasResponse = await fetch(`${apiBaseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify(subscriptionData)
    });

    if (!asaasResponse.ok) {
      const errorData = await asaasResponse.text()
      logStep('Asaas API Error', { status: asaasResponse.status, error: errorData });
      throw new Error(`Failed to create Asaas subscription: ${asaasResponse.status} - ${errorData}`)
    }

    const asaasSubscription = await asaasResponse.json()
    logStep("Asaas subscription created", { asaasId: asaasSubscription.id });

    // Generate first payment charge
    const paymentData = {
      customer: customerId,
      billingType: selectedMethod,
      value: currentSubscription.monthly_value,
      dueDate: nextDueDateStr,
      description: 'Primeira cobrança - Assinatura UniX360',
      externalReference: subscriptionId,
    };

    logStep("Creating first payment charge", paymentData);

    const paymentResponse = await fetch(`${apiBaseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify(paymentData)
    });

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.text()
      logStep('Payment creation error', { status: paymentResponse.status, error: errorData });
      throw new Error(`Failed to create payment: ${paymentResponse.status} - ${errorData}`)
    }

    const payment = await paymentResponse.json()
    logStep("Payment created", { paymentId: payment.id, billingType: payment.billingType });

    // Update subscription in database with Asaas IDs - keep status as 'trial' until payment
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        asaas_customer_id: customerId,
        asaas_subscription_id: asaasSubscription.id,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
        // Keep status as 'trial' - will be updated to 'active' by webhook after payment
      })
      .eq('id', subscriptionId)

    if (updateError) {
      logStep('Database update error', updateError);
      throw new Error('Failed to update subscription in database')
    }

    // Create invoice record
    const invoiceData = {
      subscription_id: subscriptionId,
      asaas_payment_id: payment.id,
      amount: currentSubscription.monthly_value,
      due_date: nextDueDateStr,
      status: 'pending',
      ...(payment.bankSlipUrl && { boleto_url: payment.bankSlipUrl }),
      ...(payment.invoiceUrl && { invoice_url: payment.invoiceUrl }),
      ...(payment.pixTransaction && { pix_qr_code: payment.pixTransaction.qrCode?.payload })
    };

    logStep("Creating invoice record", invoiceData);

    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)

    if (invoiceError) {
      logStep('Invoice creation error', invoiceError);
      throw new Error('Failed to create invoice record')
    }

    // Prepare response data based on payment method
    const responseData = {
      success: true,
      subscription: asaasSubscription,
      payment: {
        id: payment.id,
        billingType: payment.billingType,
        status: payment.status,
        dueDate: payment.dueDate,
        ...(payment.bankSlipUrl && { boleto_url: payment.bankSlipUrl }),
        ...(payment.invoiceUrl && { invoice_url: payment.invoiceUrl }),
        ...(payment.pixTransaction && { 
          pix_qr_code: payment.pixTransaction.qrCode?.payload,
          pix_copy_paste: payment.pixTransaction.qrCode?.payload 
        })
      }
    };

    logStep("Success response prepared", { billingType: payment.billingType });

    return new Response(
      JSON.stringify(responseData),
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
