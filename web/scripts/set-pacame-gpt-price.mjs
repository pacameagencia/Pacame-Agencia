#!/usr/bin/env node
/**
 * Setea el stripe_price_id del tier 'premium' de pacame-gpt en Supabase.
 * Idempotente: vuelve a ejecutarlo cambia el price_id sin tocar otros tiers.
 *
 * Uso: node scripts/set-pacame-gpt-price.mjs <price_id>
 *      node scripts/set-pacame-gpt-price.mjs price_1TQXpsLILWpOzDaiiCV4l45n
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...rest] = trimmed.split("=");
    if (!process.env[k]) process.env[k] = rest.join("=").replace(/^"|"$/g, "");
  }
} catch {}

const priceId = process.argv[2];
if (!priceId || !priceId.startsWith("price_")) {
  console.error("Uso: node scripts/set-pacame-gpt-price.mjs <price_id>");
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}

const { Client } = await import("pg");
const client = new Client({ connectionString: dbUrl });
await client.connect();

const sql = `
UPDATE pacame_products
   SET pricing = (
     SELECT jsonb_agg(
       CASE WHEN tier->>'tier' = 'premium'
            THEN tier || jsonb_build_object('stripe_price_id', $1::text)
            ELSE tier END
     )
     FROM jsonb_array_elements(pricing) AS tier
   )
 WHERE id = 'pacame-gpt'
RETURNING pricing;
`;

const { rows } = await client.query(sql, [priceId]);
await client.end();

if (rows.length === 0) {
  console.error("No row updated. Producto pacame-gpt no encontrado.");
  process.exit(2);
}

const tiers = rows[0].pricing;
const premium = tiers.find((t) => t.tier === "premium");
console.log("OK. Tier premium tras update:");
console.log(JSON.stringify(premium, null, 2));
