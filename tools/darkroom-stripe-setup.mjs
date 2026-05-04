#!/usr/bin/env node
/**
 * darkroom-stripe-setup.mjs — crea (idempotentemente) los 2 products
 * Dark Room en Stripe LIVE:
 *   - DarkRoom Pro · 24,90€/mes recurring · trial 2 días (configurado en checkout)
 *   - DarkRoom Lifetime · 349€ one-time
 *
 * Uso:
 *   node tools/darkroom-stripe-setup.mjs            # crear si no existen
 *   node tools/darkroom-stripe-setup.mjs --dry-run  # solo lista lo que haría
 *
 * Lee STRIPE_SECRET_KEY de web/.env.local (rk_live_ restricted o sk_live_).
 * Si la key no tiene scope products:write o products:read → reporta y aborta.
 *
 * Idempotente: busca productos por metadata.darkroom_plan antes de crear.
 * Imprime price_xxx para copy-pastear a .env.local.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, "web", ".env.local");

if (!fs.existsSync(ENV_PATH)) {
  console.error(`[FATAL] no existe ${ENV_PATH}`);
  process.exit(1);
}

const env = Object.fromEntries(
  fs.readFileSync(ENV_PATH, "utf8")
    .split("\n").filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);

const STRIPE_KEY = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) {
  console.error("[FATAL] STRIPE_SECRET_KEY no encontrada");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const isLive = STRIPE_KEY.startsWith("rk_live_") || STRIPE_KEY.startsWith("sk_live_");

console.log("─── DarkRoom · Stripe products setup ───────────");
console.log(`Key prefix : ${STRIPE_KEY.slice(0, 16)}...`);
console.log(`Mode       : ${isLive ? "🔴 LIVE" : "🟡 TEST"}`);
console.log(`Dry run    : ${dryRun}`);
console.log("─────────────────────────────────────────────────\n");

const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2025-03-31.basil" });

// Probe scope · prefiero products.list (read scope · más permissive)
try {
  await stripe.products.list({ limit: 1 });
} catch (e) {
  if (e?.statusCode === 401 || e?.statusCode === 403 || e?.code === "rate_limit") {
    console.error(`[FATAL] La key ${STRIPE_KEY.slice(0, 12)}... NO tiene scope products:read.`);
    console.error(`Crea una key con scope 'products: write' en https://dashboard.stripe.com/apikeys`);
    console.error(`(o usa una sk_live_ temporal solo para este setup).`);
    console.error(`\nError: ${e.message}`);
    process.exit(2);
  }
  throw e;
}
console.log("✓ key tiene scope products:read · continuando\n");

const PLANS = [
  {
    plan: "pro",
    productName: "DarkRoom Pro",
    description: "Group buy legal · 12 herramientas IA premium · 24,90€/mes",
    unitAmount: 2490,
    recurring: { interval: "month" },
  },
  {
    plan: "lifetime",
    productName: "DarkRoom Lifetime",
    description: "Group buy legal · 12 herramientas IA premium · acceso de por vida · pago único",
    unitAmount: 34900,
    recurring: null,
  },
];

const results = [];

for (const p of PLANS) {
  console.log(`─── ${p.productName} (${p.plan}) ───`);

  // Buscar producto existente por metadata.darkroom_plan
  const existingProducts = await stripe.products.search({
    query: `metadata['darkroom_plan']:'${p.plan}'`,
    limit: 5,
  });

  let product;
  if (existingProducts.data.length > 0) {
    product = existingProducts.data[0];
    console.log(`  ✓ producto ya existe: ${product.id}`);
  } else if (dryRun) {
    console.log(`  [DRY-RUN] crearía producto con metadata.darkroom_plan=${p.plan}`);
    continue;
  } else {
    product = await stripe.products.create({
      name: p.productName,
      description: p.description,
      metadata: { darkroom_plan: p.plan },
      tax_code: "txcd_10103001", // SaaS · ajustable luego
    });
    console.log(`  ✓ producto creado: ${product.id}`);
  }

  // Buscar price existente activo del producto
  const existingPrices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 10,
  });

  // Match por unit_amount + recurring matching
  const matchPrice = existingPrices.data.find(pr => {
    const amountMatch = pr.unit_amount === p.unitAmount && pr.currency === "eur";
    const recurringMatch = p.recurring
      ? pr.recurring?.interval === p.recurring.interval
      : !pr.recurring;
    return amountMatch && recurringMatch;
  });

  let price;
  if (matchPrice) {
    price = matchPrice;
    console.log(`  ✓ price ya existe: ${price.id} (${price.unit_amount / 100}€${p.recurring ? "/mes" : ""})`);
  } else if (dryRun) {
    console.log(`  [DRY-RUN] crearía price ${p.unitAmount / 100}€${p.recurring ? "/" + p.recurring.interval : " one-time"}`);
    continue;
  } else {
    const priceParams = {
      product: product.id,
      unit_amount: p.unitAmount,
      currency: "eur",
      metadata: { darkroom_plan: p.plan },
    };
    if (p.recurring) priceParams.recurring = p.recurring;
    price = await stripe.prices.create(priceParams);
    console.log(`  ✓ price creado: ${price.id} (${price.unit_amount / 100}€${p.recurring ? "/mes" : ""})`);
  }

  results.push({
    plan: p.plan,
    productId: product.id,
    priceId: price.id,
    amount: price.unit_amount / 100,
    recurring: !!price.recurring,
  });
}

console.log("\n─── Resultado ──────────────────────────────────");
for (const r of results) {
  console.log(`${r.plan.padEnd(9)} · product=${r.productId} · price=${r.priceId} · ${r.amount}€${r.recurring ? "/mes" : " one-time"}`);
}
console.log("─────────────────────────────────────────────────\n");

if (results.length > 0) {
  console.log("Copy-paste a web/.env.local:\n");
  const proResult = results.find(r => r.plan === "pro");
  const lifeResult = results.find(r => r.plan === "lifetime");
  if (proResult) {
    console.log(`DARKROOM_PRO_PRODUCT_ID=${proResult.productId}`);
    console.log(`DARKROOM_PRO_PRICE_ID=${proResult.priceId}`);
  }
  if (lifeResult) {
    console.log(`DARKROOM_LIFETIME_PRODUCT_ID=${lifeResult.productId}`);
    console.log(`DARKROOM_LIFETIME_PRICE_ID=${lifeResult.priceId}`);
  }
  console.log("");
  console.log("Y a Vercel:\n");
  if (proResult) {
    console.log(`vercel env add DARKROOM_PRO_PRICE_ID production`);
    console.log(`vercel env add DARKROOM_PRO_PRICE_ID preview`);
  }
  if (lifeResult) {
    console.log(`vercel env add DARKROOM_LIFETIME_PRICE_ID production`);
    console.log(`vercel env add DARKROOM_LIFETIME_PRICE_ID preview`);
  }
}
