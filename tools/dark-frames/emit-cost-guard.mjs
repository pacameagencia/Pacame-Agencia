#!/usr/bin/env node
/**
 * Emite un cost_guard_token vinculado a un concept_id concreto (FIX CRITICAL #2).
 *
 * Reemplaza el flujo legacy de "openssl rand -hex 16" (sin verificación real).
 * Ahora cada token:
 *   - Se emite vía función Postgres `emit_cost_guard_token()` (atomic).
 *   - Vinculado a un concept_id (NO sirve para otro concept).
 *   - TTL 24h por default.
 *   - Single-use enforcement (función `consume_cost_guard_token`).
 *   - Loggea quién emitió + razón (audit trail mín 20 chars).
 *
 * Uso:
 *   node tools/dark-frames/emit-cost-guard.mjs \
 *     --concept=dark-frames-001 \
 *     --reason='Pablo aprueba HERO jueves Mad Max Tokio · doble OK confirmado en chat' \
 *     [--emitted-by=pablo] \
 *     [--ttl-hours=24]
 *
 * Output: el token se imprime en stdout (cópialo y pásalo a render-piece.mjs --cost-guard-token=<token>).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const args = process.argv.slice(2);
const opts = Object.fromEntries(
  args
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, ...v] = a.slice(2).split("=");
      return [k, v.join("=") || "true"];
    }),
);

const CONCEPT_ID = opts.concept;
const REASON = opts.reason;
const EMITTED_BY = opts["emitted-by"] || "pablo";
const TTL_HOURS = parseInt(opts["ttl-hours"] || "24", 10);

if (!CONCEPT_ID) {
  console.error("ERROR: --concept=<id> obligatorio");
  process.exit(1);
}
if (!REASON || REASON === "true" || REASON.length < 20) {
  console.error("ERROR: --reason='<min 20 chars>' obligatorio (audit trail)");
  process.exit(1);
}

// Verificar que el concept existe
const conceptPath = path.resolve(__dirname, "concepts", `${CONCEPT_ID}.json`);
if (!fs.existsSync(conceptPath)) {
  console.error(`ERROR: concept_id='${CONCEPT_ID}' no existe en tools/dark-frames/concepts/`);
  process.exit(1);
}

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, "web", ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.rpc("emit_cost_guard_token", {
  p_concept_id: CONCEPT_ID,
  p_emitted_by: EMITTED_BY,
  p_reason: REASON,
  p_ttl_hours: TTL_HOURS,
});

if (error) {
  console.error(`ERROR Supabase RPC: ${error.message}`);
  process.exit(1);
}

const token = data;

console.log(`✅ Cost-guard token emitido`);
console.log(`   concept_id:   ${CONCEPT_ID}`);
console.log(`   emitted_by:   ${EMITTED_BY}`);
console.log(`   reason:       ${REASON.slice(0, 80)}${REASON.length > 80 ? "…" : ""}`);
console.log(`   expires_at:   ${new Date(Date.now() + TTL_HOURS * 3600 * 1000).toISOString()}`);
console.log(``);
console.log(`   token:        ${token}`);
console.log(``);
console.log(`   Úsalo con:`);
console.log(`     node tools/dark-frames/render-piece.mjs --concept=${CONCEPT_ID} \\`);
console.log(`       --approved-by-pablo \\`);
console.log(`       --cost-guard-token=${token}`);
