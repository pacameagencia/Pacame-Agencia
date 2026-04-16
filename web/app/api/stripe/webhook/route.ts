import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity } from "@/lib/agent-logger";
import { sendEmail, notifyPablo, wrapEmailTemplate } from "@/lib/resend";
import { notifyPayment } from "@/lib/telegram";

const supabase = createServerSupabase();

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
        const { data: financeRecord } = await supabase.from("finances").insert({
          type: "income",
          category: metadata.product || "stripe",
          amount,
          description: `Pago Stripe: ${metadata.client_name || session.customer_email} — ${metadata.product || "servicio"}`,
          client_id: metadata.client_id || null,
          invoice_number: session.invoice ? String(session.invoice) : null,
        }).select("id").single();

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

        // Auto-create client from lead if lead_id provided but no client_id
        let clientId = metadata.client_id;
        const serviceTypes = metadata.services?.split(",") || [];

        if (!clientId && metadata.lead_id) {
          const { data: lead } = await supabase
            .from("leads")
            .select("id, name, email, phone, business_name, business_type, city")
            .eq("id", metadata.lead_id)
            .single();

          if (lead) {
            const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;
            const { data: newClient } = await supabase.from("clients").insert({
              name: lead.name,
              email: lead.email || session.customer_email,
              phone: lead.phone || null,
              business_name: lead.business_name || null,
              business_type: lead.business_type || null,
              plan: metadata.product || "custom",
              monthly_fee: session.mode === "subscription" ? amount : 0,
              status: "onboarding",
              notes: `Auto-creado desde pago Stripe. Lead ID: ${lead.id}`,
              onboarding_data: { stripe_customer_id: stripeCustomerId },
            }).select("id").single();

            if (newClient) {
              clientId = newClient.id;

              // Mark lead as won
              await supabase.from("leads").update({ status: "won" }).eq("id", lead.id);

              // Link payment to client
              if (financeRecord?.id) {
                await supabase.from("finances").update({ client_id: clientId }).eq("id", financeRecord.id);
              }
            }
          }
        }

        // Auto-launch onboarding if we have a client
        if (clientId && serviceTypes.length > 0) {
          try {
            const items: { client_id: string; item: string; category: string }[] = [];
            const templates: Record<string, { category: string; items: string[] }[]> = {
              web: [
                { category: "Briefing", items: ["Briefing recibido", "Estructura de paginas definida", "Contenido recopilado", "Recursos visuales recibidos"] },
                { category: "Desarrollo", items: ["Web en desarrollo", "SEO basico implementado", "Test responsive completado"] },
                { category: "Lanzamiento", items: ["Dominio configurado", "Web en produccion"] },
              ],
              seo: [
                { category: "Setup", items: ["Auditoria SEO completada", "Keyword research entregado", "Search Console vinculado"] },
                { category: "Optimizacion", items: ["Meta tags optimizados", "Schema markup implementado", "Primeros articulos publicados"] },
              ],
              social: [
                { category: "Setup", items: ["Acceso a cuentas obtenido", "Perfiles optimizados", "Templates creados"] },
                { category: "Contenido", items: ["Calendario editorial creado", "Primera semana programada"] },
              ],
              ads: [
                { category: "Setup", items: ["Cuenta publicitaria verificada", "Pixel instalado", "Audiencias definidas"] },
                { category: "Lanzamiento", items: ["Creativos disenados", "Campana lanzada"] },
              ],
            };

            for (const svc of serviceTypes) {
              const tpl = templates[svc.trim()];
              if (!tpl) continue;
              for (const group of tpl) {
                for (const item of group.items) {
                  items.push({ client_id: clientId, item, category: `${svc.trim().toUpperCase()} — ${group.category}` });
                }
              }
            }

            if (items.length > 0) {
              await supabase.from("onboarding_checklist").insert(items);
              await supabase.from("clients").update({ status: "onboarding" }).eq("id", clientId);
            }
          } catch {
            // Non-blocking
          }
        } else if (clientId) {
          // No service types specified — just activate
          await supabase
            .from("clients")
            .update({ status: "active", onboarded_at: new Date().toISOString() })
            .eq("id", clientId);
        }

        // Send welcome email to the customer
        const customerEmail = session.customer_email || metadata.client_email;
        const customerName = (metadata.client_name || "cliente").replace(/[\r\n]/g, "");
        const firstName = customerName.split(" ")[0] || customerName;
        if (customerEmail) {
          sendEmail({
            to: customerEmail,
            subject: `Bienvenido a PACAME, ${firstName}!`,
            html: wrapEmailTemplate(
              `Hola ${firstName},\n\n` +
              `Tu pago de <strong>${amount}€</strong> se ha procesado correctamente.\n\n` +
              `Nuestro equipo ya esta trabajando en tu proyecto. Puedes seguir el progreso en tu portal de cliente.\n\n` +
              `Si tienes cualquier duda, respondeme directamente a este email o escribeme por WhatsApp al +34 722 669 381.\n\n` +
              `Un saludo,\nPablo Calleja\nPACAME`,
              {
                cta: "Acceder a mi portal",
                ctaUrl: "https://pacameagencia.com/portal",
                preheader: `Pago de ${amount}€ confirmado — tu proyecto esta en marcha`,
              }
            ),
            tags: [
              { name: "type", value: "welcome" },
              { name: "client_id", value: clientId || "" },
            ],
          });
        }

        // Notify Pablo (email + Telegram) — MUST await in serverless
        await notifyPablo(
          `Nuevo pago: ${amount}€ de ${customerName}`,
          wrapEmailTemplate(
            `<strong>${customerName}</strong> ha pagado <strong>${amount}€</strong> por ${metadata.product || "servicio"}.\n\n` +
            `Email: ${customerEmail || "N/A"}\n` +
            `${clientId ? "Cliente creado y onboarding iniciado automaticamente." : "Sin cliente asociado — revisar manualmente."}`,
            { cta: "Ver en dashboard", ctaUrl: "https://pacameagencia.com/dashboard/clients" }
          )
        );
        await notifyPayment(customerName, amount, metadata.product || "servicio");

        await logAgentActivity({
          agentId: "sage",
          type: "delivery",
          title: `Pago recibido: ${amount}€`,
          description: `${customerName} — ${metadata.product || "servicio"}. ${clientId ? "Onboarding auto-iniciado." : "Sin onboarding."}`,
          metadata: { client_id: clientId, amount, product: metadata.product },
        });

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
