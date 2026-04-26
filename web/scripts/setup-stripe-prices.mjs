#!/usr/bin/env node
/**
 * setup-stripe-prices.mjs
 *
 * Crea los 6 precios Stripe (3 AsesorPro + 3 PromptForge) y los persiste
 * en pacame_products.pricing[i].stripe_price_id en Supabase.
 *
 * Idempotente: si ya hay stripe_price_id en BD, lo reutiliza y no crea otro.
 *
 * Uso:
 *   STRIPE_SECRET_KEY=sk_test_... NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node tools/setup-stripe-prices.mjs
 *
 * Por defecto crea precios en TEST mode (la SECRET_KEY decide el entorno).
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_KEY) {
  console.error("Falta STRIPE_SECRET_KEY");
  process.exit(1);
}
if (!SUPA_URL || !SUPA_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_KEY);
const supabase = createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: false } });

const PRODUCTS_TO_SETUP = ["asesor-pro", "promptforge"];

async function ensureStripeProduct(slug, name, tagline) {
  const list = await stripe.products.list({ limit: 100 });
  const existing = list.data.find((p) => p.metadata?.pacame_product_id === slug);
  if (existing) return existing;
  return stripe.products.create({
    name: `${name} · PACAME`,
    description: tagline,
    metadata: { pacame_product_id: slug },
  });
}

async function ensurePrice(stripeProduct, slug, tier) {
  if (tier.stripe_price_id) {
    try {
      const price = await stripe.prices.retrieve(tier.stripe_price_id);
      if (price && price.active) return price;
    } catch {
      // continuar y crear nuevo
    }
  }
  const price = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: Math.round(tier.price_eur * 100),
    currency: "eur",
    recurring: { interval: tier.interval === "year" ? "year" : "month" },
    metadata: {
      pacame_product_id: slug,
      pacame_tier: tier.tier,
    },
    nickname: `${slug} · ${tier.tier}`,
  });
  return price;
}

async function setup(slug) {
  const { data: product, error } = await supabase
    .from("pacame_products")
    .select("id, name, tagline, pricing")
    .eq("id", slug)
    .single();
  if (error || !product) {
    console.error(`Producto ${slug} no encontrado:`, error?.message);
    return;
  }

  const stripeProduct = await ensureStripeProduct(product.id, product.name, product.tagline);
  console.log(`✓ Stripe product ${product.id} → ${stripeProduct.id}`);

  const updatedPricing = [];
  for (const tier of product.pricing) {
    const price = await ensurePrice(stripeProduct, slug, tier);
    updatedPricing.push({ ...tier, stripe_price_id: price.id });
    console.log(`  → tier ${tier.tier} ${tier.price_eur}€ ⇒ ${price.id}`);
  }

  await supabase
    .from("pacame_products")
    .update({ pricing: updatedPricing })
    .eq("id", slug);
  console.log(`✓ Persistido pricing en Supabase para ${slug}\n`);
}

(async () => {
  for (const slug of PRODUCTS_TO_SETUP) {
    await setup(slug);
  }
  console.log("Listo. Recuerda:");
  console.log("  1. Crear webhook Stripe: dashboard → developers → webhooks → URL /api/stripe/webhook");
  console.log("     Eventos: checkout.session.completed, customer.subscription.{created,updated,deleted}, invoice.payment_failed");
  console.log("  2. Guardar el signing secret en STRIPE_WEBHOOK_SECRET");
})();
