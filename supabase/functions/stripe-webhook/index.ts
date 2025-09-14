import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    logStep('Webhook received');

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey || !webhookSecret) {
      throw new Error('Missing Stripe configuration');
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-08-27.basil' });
    
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      throw new Error('Missing Stripe signature');
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep('Webhook signature verified', { type: event.type, id: event.id });
    } catch (err) {
      logStep('Webhook signature verification failed', { error: err.message });
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    // Check for idempotency - avoid processing same event twice
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('external_event_id', event.id)
      .maybeSingle();

    if (existingPayment) {
      logStep('Event already processed - idempotency check', { eventId: event.id });
      return new Response(JSON.stringify({ received: true, message: 'Already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    let empresaId: string | null = null;
    let customerEmail: string | null = null;

    // Process different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep('Processing checkout.session.completed', { sessionId: session.id });

        empresaId = session.client_reference_id || session.metadata?.empresaId || null;
        customerEmail = session.customer_email || session.customer_details?.email || null;

        if (!empresaId && customerEmail) {
          // Try to find empresa by user email
          const { data: profile } = await supabase
            .from('perfis')
            .select('empresa_id')
            .eq('user_id', (await supabase.auth.admin.getUserById(session.customer || '')).data.user?.id || '')
            .maybeSingle();
          
          if (profile) {
            empresaId = profile.empresa_id;
          }
        }

        // Insert payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            external_event_id: event.id,
            status: 'approved',
            amount_cents: session.amount_total || 0,
            currency: (session.currency || 'brl').toUpperCase(),
            method: 'stripe_checkout',
            empresa_id: empresaId,
            customer_email: customerEmail,
            occurred_at: new Date(session.created * 1000).toISOString(),
            raw: session
          });

        if (paymentError) {
          logStep('Error inserting payment', { error: paymentError });
        } else {
          logStep('Payment record created for checkout session');
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep('Processing invoice.payment_succeeded', { invoiceId: invoice.id });

        // Get customer info
        const customer = await stripe.customers.retrieve(invoice.customer as string);
        customerEmail = (customer as Stripe.Customer).email;

        // Find empresa by customer email using a more efficient approach
        if (customerEmail) {
          const { data: profile } = await supabase
            .from('perfis')
            .select('empresa_id, user_id')
            .eq('user_id', (await supabase.rpc('get_user_by_email', { user_email: customerEmail })) || '')
            .maybeSingle();
          
          if (profile) {
            empresaId = profile.empresa_id;
          }
        }

        // Insert payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            external_event_id: event.id,
            status: 'approved',
            amount_cents: invoice.amount_paid || 0,
            currency: (invoice.currency || 'brl').toUpperCase(),
            method: invoice.payment_method_types?.[0] || 'stripe',
            empresa_id: empresaId,
            customer_email: customerEmail,
            occurred_at: invoice.status_transitions?.paid_at ? 
              new Date(invoice.status_transitions.paid_at * 1000).toISOString() : 
              new Date().toISOString(),
            raw: invoice
          });

        if (paymentError) {
          logStep('Error inserting payment', { error: paymentError });
        }

        // Update subscription status
        if (empresaId) {
          const periodStart = invoice.lines.data[0]?.period?.start;
          const periodEnd = invoice.lines.data[0]?.period?.end;

          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .upsert({
              empresa_id: empresaId,
              status: 'active',
              is_recurring: true,
              current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
              current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'empresa_id'
            });

          if (subscriptionError) {
            logStep('Error updating subscription', { error: subscriptionError });
          } else {
            logStep('Subscription activated', { empresaId });

            // Activate users for this empresa
            const { error: userActivationError } = await supabase
              .from('perfis')
              .update({ ativo: true })
              .eq('empresa_id', empresaId);

            if (userActivationError) {
              logStep('Error activating users', { error: userActivationError });
            } else {
              logStep('Users activated for empresa', { empresaId });
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logStep('Processing invoice.payment_failed', { invoiceId: invoice.id });

        // Get customer info
        const customer = await stripe.customers.retrieve(invoice.customer as string);
        customerEmail = (customer as Stripe.Customer).email;

        // Insert payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            external_event_id: event.id,
            status: 'refused',
            amount_cents: invoice.amount_due || 0,
            currency: (invoice.currency || 'brl').toUpperCase(),
            method: invoice.payment_method_types?.[0] || 'stripe',
            customer_email: customerEmail,
            occurred_at: new Date().toISOString(),
            raw: invoice
          });

        if (paymentError) {
          logStep('Error inserting failed payment', { error: paymentError });
        } else {
          logStep('Failed payment record created');
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep(`Processing ${event.type}`, { subscriptionId: subscription.id });

        // Get customer info
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        customerEmail = (customer as Stripe.Customer).email;

        // Find empresa by customer email
        if (customerEmail) {
          const { data: user } = await supabase.auth.admin.listUsers();
          const matchingUser = user.users.find(u => u.email === customerEmail);
          
          if (matchingUser) {
            const { data: profile } = await supabase
              .from('perfis')
              .select('empresa_id')
              .eq('user_id', matchingUser.id)
              .maybeSingle();
            
            if (profile) {
              empresaId = profile.empresa_id;
            }
          }
        }

        if (empresaId && subscription.status === 'active') {
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .upsert({
              empresa_id: empresaId,
              status: 'active',
              is_recurring: true,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'empresa_id'
            });

          if (subscriptionError) {
            logStep('Error updating subscription', { error: subscriptionError });
          } else {
            logStep('Subscription updated', { empresaId, status: subscription.status });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep('Processing customer.subscription.deleted', { subscriptionId: subscription.id });

        // Get customer info
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        customerEmail = (customer as Stripe.Customer).email;

        // Find empresa by customer email
        if (customerEmail) {
          const { data: user } = await supabase.auth.admin.listUsers();
          const matchingUser = user.users.find(u => u.email === customerEmail);
          
          if (matchingUser) {
            const { data: profile } = await supabase
              .from('perfis')
              .select('empresa_id')
              .eq('user_id', matchingUser.id)
              .maybeSingle();
            
            if (profile) {
              empresaId = profile.empresa_id;
            }
          }
        }

        if (empresaId) {
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .update({
              status: 'cancelled',
              cancel_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('empresa_id', empresaId);

          if (subscriptionError) {
            logStep('Error canceling subscription', { error: subscriptionError });
          } else {
            logStep('Subscription canceled', { empresaId });
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        logStep('Processing charge.refunded', { chargeId: charge.id });

        // Update payment status to refunded
        const { error: paymentError } = await supabase
          .from('payments')
          .update({ status: 'refunded' })
          .eq('external_event_id', charge.id);

        if (paymentError) {
          logStep('Error updating refunded payment', { error: paymentError });
        }

        // Find and suspend related subscription
        if (charge.customer) {
          const customer = await stripe.customers.retrieve(charge.customer as string);
          customerEmail = (customer as Stripe.Customer).email;

          if (customerEmail) {
            const { data: user } = await supabase.auth.admin.listUsers();
            const matchingUser = user.users.find(u => u.email === customerEmail);
            
            if (matchingUser) {
              const { data: profile } = await supabase
                .from('perfis')
                .select('empresa_id')
                .eq('user_id', matchingUser.id)
                .maybeSingle();
              
              if (profile) {
                const { error: subscriptionError } = await supabase
                  .from('subscriptions')
                  .update({
                    status: 'suspended',
                    updated_at: new Date().toISOString()
                  })
                  .eq('empresa_id', profile.empresa_id);

                if (subscriptionError) {
                  logStep('Error suspending subscription after refund', { error: subscriptionError });
                } else {
                  logStep('Subscription suspended after refund', { empresaId: profile.empresa_id });
                }
              }
            }
          }
        }
        break;
      }

      default:
        logStep('Unhandled event type', { type: event.type });
        break;
    }

    logStep('Webhook processing completed', { type: event.type, empresaId });

    return new Response(JSON.stringify({ received: true, processed: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in webhook processing', { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});