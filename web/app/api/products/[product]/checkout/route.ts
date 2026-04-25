/**
 * POST /api/products/[product]/checkout
 *
 * Crea Stripe Checkout Session para el upgrade trial → paid.
 * Necesita el `tier` (solo|pro|despacho) que mapea a un Stripe price_id.
 *
 * Si STRIPE_SECRET_KEY no está configurada o el tier no tiene
 * stripe_price_id en el catálogo, devuelve el setup-link a Stripe Pricing
 * Table de PACAME para que Pablo cree el price y lo asigne.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentProductUser } from "@/lib/products/session";
import { getProduct, findTier } from "@/lib/products/registry";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface CheckoutBody {
  tier: string;
  return_url?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ product: string }> }
) {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { product: productId } = await params;
  const product = await getProduct(productId);
  if (!product) return NextResponse.json({ error: "product not found" }, { status: 404 });

  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const tier = findTier(product, body.tier);
  if (!tier) return NextResponse.json({ error: "tier not found" }, { status: 400 });

  if (!tier.stripe_price_id) {
    return NextResponse.json(
      {
        error: "stripe_price_id missing for this tier",
        instructions: `Crea un price en Stripe (modo recurrente, ${tier.price_eur}€/${tier.interval}) y guárdalo en pacame_products.pricing[${body.tier}].stripe_price_id.`,
      },
      { status: 503 }
    );
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY missing en env" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeKey);

  // Buscar customer existente en Stripe (por email) o crear uno nuevo
  const supabase = createServerSupabase();
  const { data: existingSub } = await supabase
    .from("pacame_product_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  let customerId = existingSub?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name ?? undefined,
      metadata: {
        pacame_user_id: user.id,
        pacame_product_id: productId,
      },
    });
    customerId = customer.id;
    await supabase
      .from("pacame_product_subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id)
      .eq("product_id", productId);
  }

  const origin = request.nextUrl.origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: tier.stripe_price_id, quantity: 1 }],
    subscription_data: {
      metadata: {
        pacame_user_id: user.id,
        pacame_product_id: productId,
        pacame_tier: tier.tier,
      },
    },
    success_url: `${origin}/app/${productId}?checkout=success`,
    cancel_url: body.return_url ?? `${origin}/p/${productId}?checkout=cancel`,
    allow_promotion_codes: true,
    locale: "es",
  });

  return NextResponse.json({
    ok: true,
    checkout_url: session.url,
    session_id: session.id,
  });
}
