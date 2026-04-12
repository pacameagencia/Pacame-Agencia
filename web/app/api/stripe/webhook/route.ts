import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Use service-level Supabase client for webhook (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  // If webhook secret is configured, verify signature
  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Webhook signature verification failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } else {
    // In development or before webhook secret is set, parse directly
    event = JSON.parse(body) as Stripe.Event;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const amount = (session.amount_total || 0) / 100;

        // Record payment in finances
        await supabase.from("finances").insert({
          type: "income",
          category: metadata.product || "stripe",
          amount,
          description: `Pago Stripe: ${metadata.client_name || session.customer_email} — ${metadata.product || "servicio"}`,
          client_id: metadata.client_id || null,
          invoice_number: session.invoice ? String(session.invoice) : null,
        });

        // Create notification
        await supabase.from("notifications").insert({
          type: "payment_received",
          priority: "high",
          title: "Pago recibido",
          message: `${metadata.client_name || session.customer_email} ha pagado ${amount}€ por ${metadata.product || "servicio"}`,
          data: {
            session_id: session.id,
            client_id: metadata.client_id,
            amount,
            product: metadata.product,
          },
        });

        // If client_id exists, update client status to active
        if (metadata.client_id) {
          await supabase
            .from("clients")
            .update({ status: "active", onboarded_at: new Date().toISOString() })
            .eq("id", metadata.client_id)
            .eq("status", "onboarding");
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const amount = (invoice.amount_paid || 0) / 100;
        const customerEmail = invoice.customer_email || "cliente";

        // Record recurring payment
        if (invoice.billing_reason === "subscription_cycle") {
          await supabase.from("finances").insert({
            type: "income",
            category: "subscription",
            amount,
            description: `Renovacion suscripcion: ${customerEmail}`,
            invoice_number: invoice.number || null,
          });

          await supabase.from("notifications").insert({
            type: "subscription_renewed",
            priority: "normal",
            title: "Suscripcion renovada",
            message: `Cobro mensual de ${amount}€ de ${customerEmail}`,
            data: { invoice_id: invoice.id, amount },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerEmail = typeof subscription.customer === "string"
          ? subscription.customer
          : "";

        await supabase.from("notifications").insert({
          type: "subscription_cancelled",
          priority: "high",
          title: "Suscripcion cancelada",
          message: `Un cliente ha cancelado su suscripcion: ${customerEmail}`,
          data: { subscription_id: subscription.id },
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const error = paymentIntent.last_payment_error?.message || "Error desconocido";

        await supabase.from("notifications").insert({
          type: "payment_failed",
          priority: "critical",
          title: "Pago fallido",
          message: `Un pago ha fallido: ${error}`,
          data: { payment_intent_id: paymentIntent.id, error },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
