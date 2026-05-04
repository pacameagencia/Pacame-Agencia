/**
 * POST /api/darkroom/checkout
 *
 * Crea una Stripe Checkout Session para Dark Room.
 * Pasa metadata `darkroom_brand=darkroom` + `dr_ref` (cookie) que el webhook
 * espera (web/lib/darkroom/crew-stripe-handler.ts) para atribuir referrals.
 *
 * Body:
 *   {
 *     plan: 'pro' | 'lifetime',
 *     customer_email?: string,
 *     success_url?: string,
 *     cancel_url?: string,
 *     dr_ref?: string  // override cookie · útil para testing
 *   }
 *
 * Response 200: { url, session_id }
 *
 * Pro: subscription mode con trial 2 días (cliente mete tarjeta, no se cobra
 * hasta día 2, cancela antes y no se cobra).
 * Lifetime: payment mode one-time 349€.
 *
 * Cookie `dr_ref` se lee del request (mismo patrón que /api/darkroom/lead).
 * Si Pablo tiene checkout web cliente-side puede pasar dr_ref en body
 * (override). Si la cookie no existe y body no la pasa, se omite (referral
 * no atribuido pero cliente paga igualmente).
 *
 * NO requiere auth (endpoint público).
 */

import { NextRequest, NextResponse } from "next/server";
import { stripe, PACAME_PRODUCTS } from "@/lib/stripe";
import { getLogger } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const maxDuration = 15;

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const SITE_URL = "https://darkroomcreative.cloud";

interface CheckoutInput {
  plan?: "pro" | "lifetime";
  customer_email?: string;
  success_url?: string;
  cancel_url?: string;
  dr_ref?: string;
}

export async function POST(request: NextRequest) {
  const log = getLogger();
  let body: CheckoutInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const plan = body.plan;
  if (plan !== "pro" && plan !== "lifetime") {
    return NextResponse.json({ error: "plan must be 'pro' or 'lifetime'" }, { status: 400 });
  }

  const product = plan === "pro" ? PACAME_PRODUCTS.darkroom_pro : PACAME_PRODUCTS.darkroom_lifetime;
  const priceId = product.stripePriceId;
  if (!priceId) {
    log.error({ plan }, "[darkroom-checkout] price_id missing for plan");
    return NextResponse.json({ error: "checkout not configured · contact support" }, { status: 500 });
  }

  // Cookie dr_ref (mismo patrón que /api/darkroom/lead/route.ts:50-54)
  const cookieRef = request.cookies.get("dr_ref")?.value;
  const drRef = body.dr_ref?.trim().toLowerCase() || cookieRef || "";

  // Validar email opcional
  let customerEmail: string | undefined;
  if (body.customer_email) {
    const e = body.customer_email.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) {
      return NextResponse.json({ error: "invalid customer_email" }, { status: 400 });
    }
    customerEmail = e;
  }

  // URLs default · con session_id placeholder en success
  const successUrl =
    body.success_url ||
    `${SITE_URL}/welcome?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`;
  const cancelUrl = body.cancel_url || `${SITE_URL}/${plan === "pro" ? "trial" : "lifetime"}`;

  // Metadata canónica que el webhook handler espera
  const checkoutMetadata: Record<string, string> = {
    darkroom_brand: "darkroom",
    plan,
  };
  if (drRef) checkoutMetadata.dr_ref = drRef;

  try {
    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: plan === "pro" ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: checkoutMetadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: "es",
      allow_promotion_codes: true,
    };

    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    if (plan === "pro") {
      // Trial 2 días + propagar metadata a la subscription
      // (necesario para que customer.subscription.deleted/refunded llegue
      // al handler crew con el dr_ref correcto)
      sessionParams.subscription_data = {
        trial_period_days: 2,
        metadata: checkoutMetadata,
      };
    } else {
      // Lifetime · activar invoice para reporting + tax compliance
      sessionParams.invoice_creation = { enabled: true };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      log.error({ sessionId: session.id }, "[darkroom-checkout] session created without url");
      return NextResponse.json({ error: "session url missing" }, { status: 500 });
    }

    log.info(
      { plan, sessionId: session.id, drRef: drRef || "(none)" },
      "[darkroom-checkout] session created"
    );

    return NextResponse.json({ url: session.url, session_id: session.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "stripe error";
    log.error({ err: msg, plan }, "[darkroom-checkout] session create failed");
    return NextResponse.json({ error: msg.slice(0, 200) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "darkroom-checkout", method: "POST" });
}
