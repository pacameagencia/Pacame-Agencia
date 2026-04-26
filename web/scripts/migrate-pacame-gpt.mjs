#!/usr/bin/env node
/**
 * Aplica la migración 019_pacame_gpt_product.sql contra Supabase.
 *
 * Uso:
 *   node scripts/migrate-pacame-gpt.mjs            # auto-apply
 *   node scripts/migrate-pacame-gpt.mjs --print    # solo imprime SQL para pegar
 *
 * Reutiliza el patrón de scripts/migrate-referrals.mjs:
 *   1. DATABASE_URL via `pg` (si está disponible)
 *   2. Supabase RPC exec_sql (si está creada en el proyecto)
 *   3. Fallback: imprime el SQL para que Pablo lo pegue en el SQL editor.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").replace(/^"|"$/g, "");
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL;

const migrationFile = path.join(__dirname, "..", "..", "infra", "migrations", "019_pacame_gpt_product.sql");
const sql = readFileSync(migrationFile, "utf8");

const argv = new Set(process.argv.slice(2));
if (argv.has("--print")) {
  const out = path.join(__dirname, "..", "..", "_pacame-gpt-migration.sql");
  writeFileSync(out, sql, "utf8");
  console.log(`Wrote SQL to ${out}`);
  console.log("Open Supabase dashboard → SQL editor → paste and run.");
  process.exit(0);
}

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Path 1: DATABASE_URL with `pg`
if (dbUrl) {
  try {
    const { Client } = await import("pg");
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    console.log("[migrate-pacame-gpt] applying 019_pacame_gpt_product.sql via DATABASE_URL…");
    await client.query(sql);
    await client.end();
    console.log("[migrate-pacame-gpt] OK via DATABASE_URL.");
    process.exit(0);
  } catch (e) {
    console.warn("[migrate-pacame-gpt] DATABASE_URL path failed:", e.message);
  }
}

// Path 2: Supabase RPC exec_sql
console.log("[migrate-pacame-gpt] trying Supabase RPC exec_sql…");
const r = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  },
  body: JSON.stringify({ query: sql }),
}).catch((e) => ({ ok: false, status: 0, text: () => Promise.resolve(String(e)) }));

if (r.ok) {
  console.log("[migrate-pacame-gpt] OK via exec_sql RPC.");
  process.exit(0);
}

const body = await r.text();
console.error(`[migrate-pacame-gpt] RPC failed (status ${r.status}): ${body.slice(0, 200)}`);
console.error("\n→ Re-run with --print to dump SQL and paste in dashboard:");
console.error(`  https://supabase.com/dashboard/project/_/sql/new\n`);
process.exit(2);
