import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase/server";
import { logAgentActivity } from "@/lib/agent-logger";
import { sendEmail, notifyPablo, wrapEmailTemplate } from "@/lib/resend";
import { notifyPayment } from "@/lib/telegram";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const supabase = createServerSupabase();

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  let event: Stripe.Event;

  // SECURITY (Sprint 24): fail-fast en producción si falta el secret;
  // rechazar request sin signature; verificar HMAC siempre que sea posible.
  if (!webhookSecret) {
    if (isProd) {
      console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET not configured in production");
      return NextResponse.json({ error: "webhook_misconfigured" }, { status: 500 });
    }
    console.warn("[stripe webhook] STRIPE_WEBHOOK_SECRET missing — accepting unsigned event (dev only)");
    event = JSON.parse(body) as Stripe.Event;
  } else if (!sig) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  } else {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Webhook signature verification failed";
      console.error("[stripe webhook] signature verification failed:", message);
      return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const amount = (session.amount_total || 0) / 100;
        const isMarketplace =
          metadata.pacame_source === "marketplace" && !!metadata.service_slug;
        const isSubscription =
          metadata.pacame_source === "subscription" && !!metadata.plan_slug;
        const isAppPurchase =
          metadata.pacame_source === "app" && !!metadata.app_slug;

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

              // Auto-create account with temporary password
              const tempPassword = crypto.randomBytes(4).toString("hex"); // 8 chars
              const passwordHash = await bcrypt.hash(tempPassword, 10);
              await supabase.from("clients").update({
                password_hash: passwordHash,
                onboarding_completed: false,
              }).eq("id", clientId);

              // Send account credentials email
              const clientEmail = lead.email || session.customer_email;
              if (clientEmail) {
                await sendEmail({
                  to: clientEmail,
                  subject: "Tu cuenta PACAME esta lista",
                  html: wrapEmailTemplate(
                    `Hola ${lead.name.split(" ")[0]},\n\n` +
                    `Tu cuenta en el portal PACAME ha sido creada automaticamente.\n\n` +
                    `<strong>Email:</strong> ${clientEmail}\n` +
                    `<strong>Password temporal:</strong> ${tempPassword}\n\n` +
                    `Te recomendamos cambiar tu password la primera vez que accedas.\n\n` +
                    `Un saludo,\nPablo Calleja\nPACAME`,
                    {
                      cta: "Acceder a mi portal",
                      ctaUrl: "https://pacameagencia.com/portal",
                      preheader: "Tu cuenta PACAME esta lista — accede a tu portal de cliente",
                    }
                  ),
                  tags: [
                    { name: "type", value: "account_created" },
                    { name: "client_id", value: clientId },
                  ],
                });
              }
            }
          }
        }

        // ============================================================
        // MARKETPLACE PATH: create order row (idempotent via stripe_session_id UNIQUE)
        // ============================================================
        let marketplaceOrderId: string | null = null;
        if (isMarketplace) {
          try {
            // Auto-create client if we still don't have one (guest checkout)
            if (!clientId) {
              const guestEmail = session.customer_email || metadata.client_email || null;
              if (guestEmail) {
                // Reuse existing client by email if present
                const { data: existing } = await supabase
                  .from("clients")
                  .select("id")
                  .eq("email", guestEmail)
                  .maybeSingle();

                if (existing?.id) {
                  clientId = existing.id as string;
                } else {
                  const stripeCustomerId =
                    typeof session.customer === "string" ? session.customer : null;
                  const tempPassword = crypto.randomBytes(4).toString("hex");
                  const passwordHash = await bcrypt.hash(tempPassword, 10);
                  const { data: newClient } = await supabase
                    .from("clients")
                    .insert({
                      name: metadata.client_name || guestEmail.split("@")[0],
                      email: guestEmail,
                      plan: "marketplace",
                      monthly_fee: 0,
                      status: "active",
                      password_hash: passwordHash,
                      onboarding_completed: false,
                      notes: `Auto-creado desde marketplace (${metadata.service_slug}).`,
                      onboarding_data: { stripe_customer_id: stripeCustomerId },
                    })
                    .select("id")
                    .single();

                  if (newClient?.id) {
                    clientId = newClient.id as string;
                    // Send credentials
                    await sendEmail({
                      to: guestEmail,
                      subject: "Tu cuenta PACAME esta lista",
                      html: wrapEmailTemplate(
                        `Hola,\n\n` +
                          `Hemos creado tu cuenta para acceder a tu pedido y su seguimiento.\n\n` +
                          `<strong>Email:</strong> ${guestEmail}\n` +
                          `<strong>Password temporal:</strong> ${tempPassword}\n\n` +
                          `Puedes cambiarlo cuando quieras desde tu portal.\n\n` +
                          `Un saludo,\nEquipo PACAME`,
                        {
                          cta: "Acceder a mi portal",
                          ctaUrl: "https://pacameagencia.com/portal",
                          preheader: "Tu cuenta PACAME esta lista",
                        }
                      ),
                      tags: [
                        { name: "type", value: "account_created" },
                        { name: "client_id", value: clientId },
                      ],
                    });
                  }
                }
              }
            }

            // Insert order — UNIQUE(stripe_session_id) ensures idempotency
            const amountCents = session.amount_total || 0;
            const { data: existingOrder } = await supabase
              .from("orders")
              .select("id")
              .eq("stripe_session_id", session.id)
              .maybeSingle();

            if (existingOrder?.id) {
              marketplaceOrderId = existingOrder.id as string;
              await supabase.from("order_events").insert({
                order_id: marketplaceOrderId,
                event_type: "webhook_duplicate",
                title: "Webhook duplicado",
                message: "Stripe envio un webhook repetido para esta session.",
                payload: { session_id: session.id },
              });
            } else {
              const { data: newOrder, error: orderErr } = await supabase
                .from("orders")
                .insert({
                  client_id: clientId || null,
                  lead_id: metadata.lead_id || null,
                  service_slug: metadata.service_slug,
                  service_catalog_id: metadata.service_catalog_id || null,
                  stripe_session_id: session.id,
                  stripe_payment_intent:
                    typeof session.payment_intent === "string"
                      ? session.payment_intent
                      : null,
                  amount_cents: amountCents,
                  currency: session.currency || "eur",
                  status: "inputs_pending",
                  customer_email: session.customer_email || metadata.client_email || null,
                  customer_name: metadata.client_name || null,
                  metadata: {
                    pacame_source: metadata.pacame_source,
                    product: metadata.product,
                  },
                })
                .select("id")
                .single();

              if (orderErr) {
                // Log to reconciliation table; do NOT 500 to Stripe
                await supabase.from("pending_reconciliation").insert({
                  source: "stripe_webhook_marketplace",
                  reference_id: session.id,
                  error_message: orderErr.message,
                  payload: { session_id: session.id, metadata },
                });
                await notifyPablo(
                  `Reconciliation: order failed for session ${session.id}`,
                  `Error: ${orderErr.message}`
                );
              } else if (newOrder?.id) {
                marketplaceOrderId = newOrder.id as string;

                // Referral attribution — si vino con ?ref=CODE, registra comision
                const refCode = (metadata.referral_code || "").toString().toUpperCase();
                if (refCode && amountCents > 0) {
                  try {
                    const { data: rc } = await supabase
                      .from("referral_codes")
                      .select("code, referrer_client_id:client_id, commission_pct")
                      .eq("code", refCode)
                      .eq("is_active", true)
                      .maybeSingle();
                    if (rc && rc.referrer_client_id !== clientId) {
                      const commissionCents = Math.round(
                        (amountCents * (rc.commission_pct as number)) / 100
                      );
                      await supabase.from("referrals").insert({
                        referral_code: rc.code,
                        referrer_client_id: rc.referrer_client_id,
                        referred_client_id: clientId || null,
                        order_id: marketplaceOrderId,
                        referred_email:
                          session.customer_email || metadata.client_email || null,
                        amount_cents: amountCents,
                        commission_cents: commissionCents,
                        status: "pending",
                      });
                    }
                  } catch (err) {
                    // No rompemos el flujo de order si falla la attribution
                    await supabase.from("pending_reconciliation").insert({
                      source: "referral_attribution",
                      reference_id: marketplaceOrderId,
                      error_message: (err as Error).message,
                      payload: { session_id: session.id, refCode },
                    });
                  }
                }

                // Record initial events
                await supabase.from("order_events").insert([
                  {
                    order_id: marketplaceOrderId,
                    event_type: "paid",
                    title: "Pago recibido",
                    message: `Stripe ha confirmado el pago de ${amount}€.`,
                    payload: { session_id: session.id, amount_cents: amountCents },
                  },
                  {
                    order_id: marketplaceOrderId,
                    event_type: "inputs_requested",
                    title: "Necesitamos tus detalles",
                    message: "Rellena el brief para que el agente comience a trabajar.",
                  },
                ]);

                // Send "complete your brief" email
                const targetEmail = session.customer_email || metadata.client_email;
                if (targetEmail) {
                  await sendEmail({
                    to: targetEmail,
                    subject: `Completa tu brief — Pedido ${metadata.service_slug}`,
                    html: wrapEmailTemplate(
                      `Hola,\n\n` +
                        `Hemos recibido tu pago de <strong>${amount}€</strong>. Para arrancar tu entregable solo necesitamos que rellenes un breve brief (60 segundos).\n\n` +
                        `Una vez completado, nuestro agente comenzara a generarlo inmediatamente.\n\n` +
                        `Gracias por confiar en PACAME.`,
                      {
                        cta: "Rellenar mi brief",
                        ctaUrl: `https://pacameagencia.com/portal/orders/${marketplaceOrderId}/form`,
                        preheader: "Solo un paso mas para arrancar tu pedido",
                      }
                    ),
                    tags: [
                      { name: "type", value: "order_brief_request" },
                      { name: "order_id", value: marketplaceOrderId },
                    ],
                  });
                }

                // Link finance record to client
                if (clientId && financeRecord?.id) {
                  await supabase
                    .from("finances")
                    .update({ client_id: clientId })
                    .eq("id", financeRecord.id);
                }
              }
            }
          } catch (mkErr) {
            // Never 500 to Stripe; log for reconciliation
            const msg = mkErr instanceof Error ? mkErr.message : String(mkErr);
            await supabase.from("pending_reconciliation").insert({
              source: "stripe_webhook_marketplace",
              reference_id: session.id,
              error_message: msg,
              payload: { metadata },
            });
            await notifyPablo(
              `Marketplace order creation failed: ${session.id}`,
              `Error: ${msg}`
            );
          }
        }

        // ============================================================
        // SUBSCRIPTION PATH: create subscriptions row
        // ============================================================
        if (isSubscription) {
          try {
            // Auto-create client from email if needed
            if (!clientId) {
              const guestEmail = session.customer_email || metadata.client_email || null;
              if (guestEmail) {
                const { data: existing } = await supabase
                  .from("clients")
                  .select("id")
                  .eq("email", guestEmail)
                  .maybeSingle();

                if (existing?.id) {
                  clientId = existing.id as string;
                } else {
                  const stripeCustomerId =
                    typeof session.customer === "string" ? session.customer : null;
                  const tempPassword = crypto.randomBytes(4).toString("hex");
                  const passwordHash = await bcrypt.hash(tempPassword, 10);
                  const { data: newClient } = await supabase
                    .from("clients")
                    .insert({
                      name: metadata.client_name || guestEmail.split("@")[0],
                      email: guestEmail,
                      plan: metadata.plan_slug || "subscription",
                      monthly_fee: amount,
                      status: "active",
                      password_hash: passwordHash,
                      onboarding_completed: false,
                      notes: `Auto-creado desde suscripcion (${metadata.plan_slug}).`,
                      onboarding_data: { stripe_customer_id: stripeCustomerId },
                    })
                    .select("id")
                    .single();

                  if (newClient?.id) {
                    clientId = newClient.id as string;
                    await sendEmail({
                      to: guestEmail,
                      subject: "Bienvenido a PACAME — Tu cuenta esta lista",
                      html: wrapEmailTemplate(
                        `Hola,\n\n` +
                          `Tu suscripcion ${metadata.plan_slug?.toUpperCase() || ""} ha sido activada.\n\n` +
                          `<strong>Email:</strong> ${guestEmail}\n` +
                          `<strong>Password temporal:</strong> ${tempPassword}\n\n` +
                          `Puedes gestionar tu suscripcion desde el portal.`,
                        {
                          cta: "Acceder a mi portal",
                          ctaUrl: "https://pacameagencia.com/portal",
                          preheader: "Tu suscripcion PACAME esta activa",
                        }
                      ),
                      tags: [
                        { name: "type", value: "account_created" },
                        { name: "client_id", value: clientId },
                      ],
                    });
                  }
                }
              }
            }

            // Resolve plan
            const { data: plan } = await supabase
              .from("subscription_plans")
              .select("id, name, price_monthly_cents, price_yearly_cents, trial_days, included_apps, quotas")
              .eq("slug", metadata.plan_slug)
              .maybeSingle();

            if (!plan || !clientId) {
              await supabase.from("pending_reconciliation").insert({
                source: "stripe_webhook_subscription",
                reference_id: session.id,
                error_message: plan
                  ? "No client_id resolved"
                  : `Plan not found: ${metadata.plan_slug}`,
                payload: { session_id: session.id, metadata },
              });
            } else {
              const stripeSubId =
                typeof session.subscription === "string" ? session.subscription : null;
              const stripeCustomerId =
                typeof session.customer === "string" ? session.customer : null;
              const billingInterval = metadata.billing_interval === "year" ? "year" : "month";
              const now = new Date();
              const periodEnd = new Date(now);
              if (billingInterval === "year") periodEnd.setFullYear(now.getFullYear() + 1);
              else periodEnd.setMonth(now.getMonth() + 1);

              // Idempotency: check existing row for this stripe_subscription_id
              const { data: existingSub } = await supabase
                .from("subscriptions")
                .select("id")
                .eq("stripe_subscription_id", stripeSubId || "")
                .maybeSingle();

              let subscriptionRowId: string | null = existingSub?.id as string | null;

              if (!existingSub) {
                const { data: newSub } = await supabase
                  .from("subscriptions")
                  .insert({
                    client_id: clientId,
                    plan_id: plan.id,
                    stripe_subscription_id: stripeSubId,
                    stripe_customer_id: stripeCustomerId,
                    status: "active",
                    billing_interval: billingInterval,
                    current_period_start: now.toISOString(),
                    current_period_end: periodEnd.toISOString(),
                    started_at: now.toISOString(),
                    amount_cents: session.amount_total || 0,
                    quota_usage: {},
                    quota_reset_at: periodEnd.toISOString(),
                    metadata: {
                      checkout_session_id: session.id,
                      plan_slug: metadata.plan_slug,
                    },
                  })
                  .select("id")
                  .single();

                subscriptionRowId = newSub?.id as string | null;
              }

              // Auto-provision included apps (status=provisioning for client to configure)
              const includedApps = Array.isArray(plan.included_apps) ? plan.included_apps : [];
              for (const appSlug of includedApps) {
                if (!appSlug || typeof appSlug !== "string") continue;
                const { data: appRow } = await supabase
                  .from("apps_catalog")
                  .select("id, slug")
                  .eq("slug", appSlug)
                  .maybeSingle();
                if (!appRow) continue;
                const { data: existingInstance } = await supabase
                  .from("app_instances")
                  .select("id")
                  .eq("client_id", clientId)
                  .eq("app_id", appRow.id)
                  .maybeSingle();
                if (existingInstance) continue;
                await supabase.from("app_instances").insert({
                  client_id: clientId,
                  app_id: appRow.id,
                  app_slug: appRow.slug,
                  subscription_id: subscriptionRowId,
                  stripe_subscription_id: stripeSubId,
                  status: "provisioning",
                  config: {},
                  secrets: {},
                  usage: {},
                  metadata: { source: "plan_included", plan_slug: metadata.plan_slug },
                });
              }

              // Welcome email
              const targetEmail = session.customer_email || metadata.client_email;
              if (targetEmail) {
                await sendEmail({
                  to: targetEmail,
                  subject: `Bienvenido a ${plan.name}`,
                  html: wrapEmailTemplate(
                    `Hola,\n\n` +
                      `Tu suscripcion <strong>${plan.name}</strong> esta activa. Ya puedes acceder a todo lo incluido desde tu portal.\n\n` +
                      (includedApps.length
                        ? `Apps incluidas: ${includedApps.join(", ")}. Configuralas desde "Mis apps".\n\n`
                        : "") +
                      `Cobramos ${(session.amount_total || 0) / 100}€ cada ${billingInterval === "year" ? "ano" : "mes"}. Puedes cancelar cuando quieras.`,
                    {
                      cta: "Acceder a mi portal",
                      ctaUrl: "https://pacameagencia.com/portal/subscription",
                      preheader: `${plan.name} activada`,
                    }
                  ),
                  tags: [
                    { name: "type", value: "subscription_welcome" },
                    { name: "plan_slug", value: metadata.plan_slug },
                  ],
                });
              }

              await notifyPablo(
                `Nueva suscripcion: ${plan.name} (${amount}€/${billingInterval === "year" ? "ano" : "mes"})`,
                wrapEmailTemplate(
                  `<strong>${metadata.client_name || targetEmail}</strong> se ha suscrito a <strong>${plan.name}</strong>.\n\n` +
                    `Email: ${targetEmail || "N/A"}\n` +
                    `Apps incluidas: ${includedApps.length ? includedApps.join(", ") : "ninguna"}`,
                  { cta: "Ver cliente", ctaUrl: "https://pacameagencia.com/dashboard/clients" }
                )
              );
            }
          } catch (subErr) {
            const msg = subErr instanceof Error ? subErr.message : String(subErr);
            await supabase.from("pending_reconciliation").insert({
              source: "stripe_webhook_subscription",
              reference_id: session.id,
              error_message: msg,
              payload: { metadata },
            });
            await notifyPablo(
              `Subscription creation failed: ${session.id}`,
              `Error: ${msg}`
            );
          }
        }

        // ============================================================
        // APP PURCHASE PATH: create app_instance row (provisioning)
        // ============================================================
        if (isAppPurchase) {
          try {
            if (!clientId) {
              const guestEmail = session.customer_email || metadata.client_email || null;
              if (guestEmail) {
                const { data: existing } = await supabase
                  .from("clients")
                  .select("id")
                  .eq("email", guestEmail)
                  .maybeSingle();

                if (existing?.id) {
                  clientId = existing.id as string;
                } else {
                  const stripeCustomerId =
                    typeof session.customer === "string" ? session.customer : null;
                  const tempPassword = crypto.randomBytes(4).toString("hex");
                  const passwordHash = await bcrypt.hash(tempPassword, 10);
                  const { data: newClient } = await supabase
                    .from("clients")
                    .insert({
                      name: metadata.client_name || guestEmail.split("@")[0],
                      email: guestEmail,
                      plan: `app:${metadata.app_slug}`,
                      monthly_fee: amount,
                      status: "active",
                      password_hash: passwordHash,
                      onboarding_completed: false,
                      notes: `Auto-creado desde compra app (${metadata.app_slug}).`,
                      onboarding_data: { stripe_customer_id: stripeCustomerId },
                    })
                    .select("id")
                    .single();

                  if (newClient?.id) {
                    clientId = newClient.id as string;
                    await sendEmail({
                      to: guestEmail,
                      subject: "Tu cuenta PACAME esta lista",
                      html: wrapEmailTemplate(
                        `Hola,\n\n` +
                          `Tu app ${metadata.app_slug} ha sido activada.\n\n` +
                          `<strong>Email:</strong> ${guestEmail}\n` +
                          `<strong>Password temporal:</strong> ${tempPassword}\n\n`,
                        {
                          cta: "Configurar mi app",
                          ctaUrl: "https://pacameagencia.com/portal/apps",
                          preheader: "Tu app PACAME esta lista para configurar",
                        }
                      ),
                      tags: [{ name: "type", value: "account_created" }],
                    });
                  }
                }
              }
            }

            const { data: appRow } = await supabase
              .from("apps_catalog")
              .select("id, slug, name")
              .eq("slug", metadata.app_slug)
              .maybeSingle();

            if (!appRow || !clientId) {
              await supabase.from("pending_reconciliation").insert({
                source: "stripe_webhook_app",
                reference_id: session.id,
                error_message: appRow
                  ? "No client_id resolved"
                  : `App not found: ${metadata.app_slug}`,
                payload: { session_id: session.id, metadata },
              });
            } else {
              const stripeSubId =
                typeof session.subscription === "string" ? session.subscription : null;
              const { data: existingInstance } = await supabase
                .from("app_instances")
                .select("id")
                .eq("stripe_subscription_id", stripeSubId || "")
                .maybeSingle();

              let instanceId: string | null = existingInstance?.id as string | null;

              if (!existingInstance) {
                const { data: newInstance } = await supabase
                  .from("app_instances")
                  .insert({
                    client_id: clientId,
                    app_id: appRow.id,
                    app_slug: appRow.slug,
                    stripe_subscription_id: stripeSubId,
                    status: "provisioning",
                    config: {},
                    secrets: {},
                    usage: {},
                    metadata: {
                      checkout_session_id: session.id,
                      source: "direct_purchase",
                    },
                  })
                  .select("id")
                  .single();

                instanceId = newInstance?.id as string | null;
              }

              const targetEmail = session.customer_email || metadata.client_email;
              if (targetEmail && instanceId) {
                await sendEmail({
                  to: targetEmail,
                  subject: `Configura tu ${appRow.name}`,
                  html: wrapEmailTemplate(
                    `Hola,\n\n` +
                      `Tu app <strong>${appRow.name}</strong> esta pagada. Solo necesitamos 60 segundos de configuracion para activarla.\n\n` +
                      `Accede al enlace y completa el formulario — nuestro asistente se encargara del resto.`,
                    {
                      cta: "Configurar mi app",
                      ctaUrl: `https://pacameagencia.com/portal/apps/${instanceId}/setup`,
                      preheader: `Tu ${appRow.name} esta lista para configurar`,
                    }
                  ),
                  tags: [
                    { name: "type", value: "app_provisioning" },
                    { name: "app_slug", value: metadata.app_slug },
                  ],
                });
              }

              await notifyPablo(
                `Nueva app vendida: ${appRow.name} (${amount}€/mes)`,
                wrapEmailTemplate(
                  `<strong>${metadata.client_name || targetEmail}</strong> ha comprado <strong>${appRow.name}</strong>.\n\n` +
                    `Email: ${targetEmail || "N/A"}\n` +
                    `Instance: ${instanceId || "N/A"}`,
                  { cta: "Ver dashboard", ctaUrl: "https://pacameagencia.com/dashboard/clients" }
                )
              );
            }
          } catch (appErr) {
            const msg = appErr instanceof Error ? appErr.message : String(appErr);
            await supabase.from("pending_reconciliation").insert({
              source: "stripe_webhook_app",
              reference_id: session.id,
              error_message: msg,
              payload: { metadata },
            });
            await notifyPablo(
              `App instance creation failed: ${session.id}`,
              `Error: ${msg}`
            );
          }
        }

        // Auto-launch agency onboarding ONLY for non-marketplace/sub/app flows
        if (!isMarketplace && !isSubscription && !isAppPurchase && clientId && serviceTypes.length > 0) {
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
              const { error: obError } = await supabase.from("onboarding_checklist").insert(items);
              if (obError) {
                console.warn("[stripe/webhook] onboarding_checklist insert failed:", obError.message);
              }
              await supabase.from("clients").update({ status: "onboarding" }).eq("id", clientId);
            }
          } catch (err) {
            console.warn("[stripe/webhook] onboarding auto-launch failed:", err instanceof Error ? err.message : "unknown");
          }
        } else if (clientId) {
          // No service types specified — just activate
          await supabase
            .from("clients")
            .update({ status: "active", onboarded_at: new Date().toISOString() })
            .eq("id", clientId);
        }

        // Send welcome email to the customer (skip for marketplace — brief email already sent)
        const customerEmail = session.customer_email || metadata.client_email;
        const customerName = (metadata.client_name || "cliente").replace(/[\r\n]/g, "");
        const firstName = customerName.split(" ")[0] || customerName;
        if (customerEmail && !isMarketplace && !isSubscription && !isAppPurchase) {
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
        const pabloCtaUrl = isMarketplace && marketplaceOrderId
          ? `https://pacameagencia.com/dashboard/orders/${marketplaceOrderId}`
          : "https://pacameagencia.com/dashboard/clients";
        const pabloFooter = isMarketplace
          ? `Pedido marketplace (${metadata.service_slug}). Esperando brief del cliente.`
          : clientId
            ? "Cliente creado y onboarding iniciado automaticamente."
            : "Sin cliente asociado — revisar manualmente.";
        if (!isSubscription && !isAppPurchase) {
          await notifyPablo(
            `Nuevo pago: ${amount}€ de ${customerName}`,
            wrapEmailTemplate(
              `<strong>${customerName}</strong> ha pagado <strong>${amount}€</strong> por ${metadata.product || "servicio"}.\n\n` +
              `Email: ${customerEmail || "N/A"}\n` +
              pabloFooter,
              { cta: "Ver en dashboard", ctaUrl: pabloCtaUrl }
            )
          );
        }
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

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubId = subscription.id;

        // Map stripe status to our status
        const rawStatus = subscription.status; // active, trialing, past_due, canceled, unpaid, etc.
        const updatePayload: Record<string, unknown> = {
          status: rawStatus,
          cancel_at_period_end: subscription.cancel_at_period_end ?? false,
          updated_at: new Date().toISOString(),
        };

        // @ts-expect-error stripe types mismatch for period fields
        if (subscription.current_period_end) {
          updatePayload.current_period_end = new Date(
            // @ts-expect-error accessing raw stripe field
            (subscription.current_period_end as number) * 1000
          ).toISOString();
        }
        // @ts-expect-error stripe types mismatch for period fields
        if (subscription.current_period_start) {
          updatePayload.current_period_start = new Date(
            // @ts-expect-error accessing raw stripe field
            (subscription.current_period_start as number) * 1000
          ).toISOString();
        }

        await supabase
          .from("subscriptions")
          .update(updatePayload)
          .eq("stripe_subscription_id", stripeSubId);

        // Also update any app_instance tied to this subscription
        if (rawStatus === "past_due" || rawStatus === "unpaid") {
          await supabase
            .from("app_instances")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", stripeSubId);
        } else if (rawStatus === "active" || rawStatus === "trialing") {
          // Reactivate suspended instances
          await supabase
            .from("app_instances")
            .update({ updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", stripeSubId)
            .in("status", ["past_due", "suspended"]);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeSubId = subscription.id;
        const now = new Date().toISOString();

        // Mark subscription row canceled
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: now,
            cancel_at_period_end: false,
            updated_at: now,
          })
          .eq("stripe_subscription_id", stripeSubId);

        // Mark any app_instance tied to this subscription canceled
        await supabase
          .from("app_instances")
          .update({ status: "canceled", canceled_at: now, updated_at: now })
          .eq("stripe_subscription_id", stripeSubId);

        await supabase.from("notifications").insert({
          type: "subscription_cancelled",
          priority: "high",
          title: "Suscripcion cancelada",
          message: `Un cliente ha cancelado su suscripcion (${stripeSubId})`,
          data: { subscription_id: stripeSubId },
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
