import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import Stripe from "https://esm.sh/stripe@11.14.0?target=deno";

// Inicializa o cliente do Stripe (A chave secreta deve estar nas variáveis de ambiente do Supabase)
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
});

// A chave secreta do Webhook (Assinatura do Endpoint no Stripe Dashboard)
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') as string;

// Inicializa o cliente do Supabase usando as variáveis automáticas da plataforma
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No stripe-signature header', { status: 400 });
  }

  let event;

  try {
    const body = await req.text();
    // Verifica se o webhook veio realmente do Stripe
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Se o pagamento for completado com sucesso
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Pega o ID que enviamos no link (reg.id)
    const clientReferenceId = session.client_reference_id;

    if (clientReferenceId) {
      console.log(`Payment confirmed for registration ID: ${clientReferenceId}`);
      
      // Atualiza o status no banco de dados
      const { error } = await supabase
        .from('registrations')
        .update({ payment_status: 'paid' })
        .eq('id', clientReferenceId);

      if (error) {
        console.error(`Error updating Supabase: ${error.message}`);
        return new Response(`Error updating database: ${error.message}`, { status: 500 });
      }
      
      console.log('Database updated successfully!');
    } else {
      console.warn('Checkout session completed, but no client_reference_id was provided.');
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
