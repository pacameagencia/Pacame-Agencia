#!/usr/bin/env node
/**
 * Aplica migraciones SQL del módulo referrals contra Supabase.
 *
 * Uso:
 *   node scripts/migrate-referrals.mjs           # intenta auto-aplicar
 *   node scripts/migrate-referrals.mjs --print   # imprime SQL combinado para pegar en el editor
 *
 * Auto-apply requiere una RPC `exec_sql(query text) returns void` en Supabase
 * (o connection string de Postgres en DATABASE_URL).
 * Si falla, vuelve al modo --print para copy/paste manual.
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

const sqlDir = path.join(__dirname, "..", "lib", "modules", "referrals", "sql");
const files = [
  "001_schema.sql",
  "002_rls.sql",
  "003_admin_extensions.sql",
  "004_public_signup.sql",
];

const combined = files
  .map((f) => `-- =====[ ${f} ]=====\n${readFileSync(path.join(sqlDir, f), "utf8")}`)
  .join("\n\n");

const argv = new Set(process.argv.slice(2));

if (argv.has("--print")) {
  const out = path.join(__dirname, "..", "..", "_referrals-migration-combined.sql");
  writeFileSync(out, combined, "utf8");
  console.log(`Wrote combined SQL to ${out}`);
  console.log("Open Supabase dashboard → SQL editor → paste and run.");
  process.exit(0);
}

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Path 1: try DATABASE_URL with `pg` if available
if (dbUrl) {
  try {
    const { Client } = await import("pg");
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    for (const f of files) {
      const sql = readFileSync(path.join(sqlDir, f), "utf8");
      console.log(`[migrate] applying ${f} via DATABASE_URL…`);
      await client.query(sql);
      console.log(`[migrate] ${f} OK`);
    }
    await client.end();
    console.log("\n[migrate] All migrations applied via DATABASE_URL.");
    process.exit(0);
  } catch (e) {
    console.warn("[migrate] DATABASE_URL path failed:", e.message);
  }
}

// Path 2: try Supabase RPC exec_sql
console.log("[migrate] Trying Supabase RPC exec_sql…");
const r = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  },
  body: JSON.stringify({ query: combined }),
}).catch((e) => ({ ok: false, status: 0, text: () => Promise.resolve(String(e)) }));

if (r.ok) {
  console.log("[migrate] All migrations applied via exec_sql RPC.");
  process.exit(0);
}

const body = await r.text();
console.error("[migrate] exec_sql RPC unavailable (status", r.status, ").");
console.error("[migrate] body:", body.slice(0, 200));
console.error("\n→ Falling back to printable mode. Run again with --print to dump SQL.");
console.error("→ Or paste this in your Supabase dashboard SQL editor:\n");
console.error("https://supabase.com/dashboard/project/_/sql/new\n");
console.error(combined.slice(0, 2000) + "\n...");
process.exit(2);
