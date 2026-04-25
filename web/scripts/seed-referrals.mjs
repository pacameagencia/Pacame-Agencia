#!/usr/bin/env node
/**
 * Seed de afiliados de prueba en aff_affiliates (idempotente).
 *
 * Uso:
 *   cd web
 *   node scripts/seed-referrals.mjs
 *
 * Lee NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY de .env.local.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

try {
  const envRaw = readFileSync(envPath, "utf8");
  for (const line of envRaw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").replace(/^"|"$/g, "");
  }
} catch {
  console.warn("[seed] no .env.local found, relying on shell env");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tenant = process.env.REFERRAL_TENANT_ID || "pacame";

if (!url || !key) {
  console.error("[seed] missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const fixtures = [
  { email: "demo-affiliate-1@pacame.test", referral_code: "demo-uno" },
  { email: "demo-affiliate-2@pacame.test", referral_code: "demo-dos" },
  { email: "demo-affiliate-3@pacame.test", referral_code: "demo-tres" },
];

let inserted = 0;
let skipped = 0;

for (const f of fixtures) {
  const { data: existing } = await supabase
    .from("aff_affiliates")
    .select("id")
    .eq("tenant_id", tenant)
    .eq("referral_code", f.referral_code)
    .maybeSingle();

  if (existing) {
    skipped += 1;
    continue;
  }

  const { error } = await supabase.from("aff_affiliates").insert({
    tenant_id: tenant,
    user_id: null,
    email: f.email,
    referral_code: f.referral_code,
    status: "active",
  });

  if (error) {
    console.error(`[seed] ${f.referral_code}:`, error.message);
  } else {
    inserted += 1;
    console.log(`[seed] inserted ${f.referral_code}`);
  }
}

console.log(`\n[seed] done — inserted=${inserted} skipped=${skipped}`);
