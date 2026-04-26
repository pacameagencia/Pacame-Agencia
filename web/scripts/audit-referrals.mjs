#!/usr/bin/env node
/**
 * Auditoría completa del sistema de referidos PACAME.
 * No modifica datos. Solo lee y reporta.
 *
 * Uso: cd web && node scripts/audit-referrals.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  const raw = readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const [k, ...v] = t.split("=");
    if (!process.env[k]) process.env[k] = v.join("=").replace(/^"|"$/g, "");
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL;
const tenant = process.env.REFERRAL_TENANT_ID || "pacame";
if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const s = createClient(url, key, { auth: { persistSession: false } });

const checks = [];
const fail = (msg) => checks.push({ ok: false, msg });
const ok = (msg) => checks.push({ ok: true, msg });
const warn = (msg) => checks.push({ ok: "warn", msg });

console.log("\n══════════ AUDITORÍA REFERIDOS PACAME ══════════\n");

// 1. Tablas
const tables = ["aff_campaigns","aff_affiliates","aff_visits","aff_referrals","aff_commissions","aff_content_assets"];
for (const t of tables) {
  const { count, error } = await s.from(t).select("id", { head: true, count: "exact" });
  if (error) fail(`tabla ${t}: ${error.message}`);
  else ok(`tabla ${t} accesible (${count} filas totales)`);
}

// 2. Columnas críticas en aff_affiliates (vía pg si tenemos)
if (dbUrl) {
  try {
    const { Client } = await import("pg");
    const c = new Client({ connectionString: dbUrl });
    await c.connect();
    const required = [
      "password_hash", "full_name", "phone", "country", "tax_id",
      "payout_method", "payout_iban", "payout_paypal", "payout_phone",
      "marketing_consent", "approved_at", "source", "last_login_at",
      "metadata", "campaign_id",
    ];
    const r = await c.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'aff_affiliates'`,
    );
    const have = new Set(r.rows.map((x) => x.column_name));
    for (const col of required) {
      if (col === "metadata") continue; // metadata is in aff_referrals, not affiliates
      if (have.has(col)) ok(`aff_affiliates.${col} existe`);
      else fail(`aff_affiliates.${col} FALTA`);
    }
    // metadata jsonb en referrals + commissions
    for (const tab of ["aff_referrals", "aff_commissions"]) {
      const r2 = await c.query(
        `SELECT data_type FROM information_schema.columns
         WHERE table_name = $1 AND column_name = 'metadata'`,
        [tab],
      );
      if (r2.rows.length && r2.rows[0].data_type === "jsonb")
        ok(`${tab}.metadata jsonb`);
      else fail(`${tab}.metadata FALTA o no es jsonb`);
    }
    // utm columns en visits
    for (const col of ["http_referer", "utm_source", "utm_medium", "utm_campaign"]) {
      const r3 = await c.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_name = 'aff_visits' AND column_name = $1`,
        [col],
      );
      if (r3.rows.length) ok(`aff_visits.${col}`);
      else fail(`aff_visits.${col} FALTA`);
    }
    // unique constraints
    const r4 = await c.query(
      `SELECT indexname FROM pg_indexes
       WHERE tablename IN ('aff_affiliates', 'aff_commissions')
         AND indexname IN (
           'idx_aff_affiliates_code',
           'idx_aff_affiliates_email_with_password',
           'idx_aff_commissions_idempotent'
         )`,
    );
    const idx = new Set(r4.rows.map((x) => x.indexname));
    for (const ix of [
      "idx_aff_affiliates_code",
      "idx_aff_affiliates_email_with_password",
      "idx_aff_commissions_idempotent",
    ]) {
      if (idx.has(ix)) ok(`index ${ix}`);
      else fail(`index ${ix} FALTA`);
    }
    // RPC counter
    const r5 = await c.query(
      `SELECT 1 FROM pg_proc WHERE proname = 'aff_content_increment_counter'`,
    );
    if (r5.rows.length) ok("RPC aff_content_increment_counter");
    else fail("RPC aff_content_increment_counter FALTA");
    // RLS
    const r6 = await c.query(
      `SELECT relname, relrowsecurity FROM pg_class
       WHERE relname IN ('aff_affiliates','aff_visits','aff_referrals','aff_commissions','aff_campaigns','aff_content_assets')`,
    );
    for (const row of r6.rows) {
      if (row.relrowsecurity) ok(`RLS habilitado en ${row.relname}`);
      else warn(`RLS NO habilitado en ${row.relname}`);
    }
    await c.end();
  } catch (e) {
    warn("pg check skipped: " + e.message);
  }
} else {
  warn("DATABASE_URL no set; saltando checks de columnas/indices");
}

// 3. Default campaign config
const { data: camp } = await s
  .from("aff_campaigns")
  .select("*")
  .eq("tenant_id", tenant)
  .eq("is_default", true)
  .maybeSingle();
if (!camp) fail(`campaña default para tenant '${tenant}' FALTA`);
else {
  ok(`campaña default: ${camp.commission_percent}% × ${camp.max_commission_period_months}m`);
  if (camp.commission_percent !== 20) warn(`commission_percent != 20 (${camp.commission_percent})`);
  if (camp.cookie_days !== 30) warn(`cookie_days != 30 (${camp.cookie_days})`);
  if (camp.max_commission_period_months !== 12)
    warn(`max_commission_period_months != 12 (${camp.max_commission_period_months})`);
  if (camp.attribution !== "last_click") warn(`attribution != last_click (${camp.attribution})`);
}

// 4. Env vars
const envChecks = [
  ["NEXT_PUBLIC_SUPABASE_URL", true],
  ["SUPABASE_SERVICE_ROLE_KEY", true],
  ["STRIPE_SECRET_KEY", true],
  ["STRIPE_WEBHOOK_SECRET", true],
  ["CRON_SECRET", true],
  ["AFFILIATE_AUTH_SECRET", true],
  ["REFERRAL_TENANT_ID", true],
  ["REFERRAL_COMMISSION_PERCENT", false],
  ["REFERRAL_COOKIE_DAYS", false],
  ["REFERRAL_MAX_MONTHS", false],
];
for (const [k, required] of envChecks) {
  if (process.env[k]) ok(`env ${k}`);
  else if (required) fail(`env ${k} FALTA`);
  else warn(`env ${k} no set (usa default)`);
}

// 5. Contenido sembrado
const { count: assetsCount } = await s
  .from("aff_content_assets")
  .select("id", { head: true, count: "exact" })
  .eq("tenant_id", tenant)
  .eq("active", true);
if ((assetsCount ?? 0) >= 1) ok(`${assetsCount} assets de contenido activos`);
else fail("biblioteca de contenido vacía — ejecuta npm run referrals:seed-content");

// 6. Afiliados activos
const { count: affCount } = await s
  .from("aff_affiliates")
  .select("id", { head: true, count: "exact" })
  .eq("tenant_id", tenant)
  .eq("status", "active");
ok(`${affCount} afiliados activos en tenant ${tenant}`);

// 7. Cron config
try {
  const v = JSON.parse(readFileSync(path.join(__dirname, "..", "vercel.json"), "utf8"));
  const has = (v.crons || []).some((c) => c.path === "/api/referrals/approve-pending");
  if (has) ok("cron approve-pending configurado en vercel.json");
  else fail("cron approve-pending FALTA en vercel.json");
} catch {
  warn("vercel.json no encontrado");
}

// === Reporte ===
console.log();
const total = checks.length;
const failed = checks.filter((c) => c.ok === false).length;
const warned = checks.filter((c) => c.ok === "warn").length;
const passed = checks.filter((c) => c.ok === true).length;

for (const c of checks) {
  const icon = c.ok === true ? "✓" : c.ok === "warn" ? "⚠" : "✗";
  const color = c.ok === true ? "\x1b[32m" : c.ok === "warn" ? "\x1b[33m" : "\x1b[31m";
  console.log(`  ${color}${icon}\x1b[0m ${c.msg}`);
}
console.log(
  `\n══════════ ${passed}/${total} OK · ${warned} warnings · ${failed} failures ══════════\n`,
);
process.exit(failed > 0 ? 1 : 0);
