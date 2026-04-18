#!/usr/bin/env node
/**
 * scripts/encrypt-secrets.mjs
 *
 * Backfill: lee app_instances con `secrets` en plano y escribe `secrets_ciphertext`.
 * NO BORRA `secrets` — eso lo hace migracion 019 tras 30d de validacion.
 *
 * PRE-REQUISITOS:
 *   - SECRETS_ENCRYPTION_KEY=<64 hex chars> (puedes generar con: openssl rand -hex 32)
 *   - NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en env
 *   - Snapshot de Supabase previo (EN SERIO — si pierdes la key, los datos NO se recuperan)
 *
 * USO:
 *   node scripts/encrypt-secrets.mjs --dry   # solo reporta que cifraria
 *   node scripts/encrypt-secrets.mjs --apply # ejecuta el cifrado
 */

import { randomBytes, createCipheriv } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// ─── Encrypt (duplicado de lib/security/crypto.ts para no depender de tsc) ───

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const FORMAT_VERSION = "v1";

function getKey() {
  const hex = process.env.SECRETS_ENCRYPTION_KEY;
  if (!hex) {
    console.error("ERROR: SECRETS_ENCRYPTION_KEY no configurada.");
    console.error("Genera una: openssl rand -hex 32");
    process.exit(1);
  }
  if (hex.length !== 64) {
    console.error(`ERROR: SECRETS_ENCRYPTION_KEY debe ser 64 hex chars. Recibido ${hex.length}.`);
    process.exit(1);
  }
  return Buffer.from(hex, "hex");
}

function encryptJSON(data, keyVersion = 1) {
  const plaintext = Buffer.from(JSON.stringify(data), "utf8");
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const header = Buffer.from(FORMAT_VERSION, "utf8"); // 2 bytes
  const kv = Buffer.from([keyVersion]);
  return Buffer.concat([header, kv, iv, tag, ct]);
}

// ─── Main ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const apply = args.includes("--apply");

if (!dryRun && !apply) {
  console.error("Uso: node scripts/encrypt-secrets.mjs [--dry | --apply]");
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas en env.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log(`Modo: ${dryRun ? "DRY RUN" : "APPLY"}`);

  // Verify key works ANTES de tocar nada
  getKey();

  const { data, error } = await supabase
    .from("app_instances")
    .select("id, app_slug, secrets, secrets_ciphertext, secrets_encrypted_at")
    .is("secrets_ciphertext", null);

  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }

  const rows = (data || []).filter((r) => r.secrets && Object.keys(r.secrets).length > 0);
  console.log(`Filas a cifrar: ${rows.length}`);

  let encrypted = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const keys = Object.keys(row.secrets);
    console.log(`  instance=${row.id} app=${row.app_slug} keys=[${keys.join(", ")}]`);

    if (dryRun) {
      skipped++;
      continue;
    }

    try {
      const blob = encryptJSON(row.secrets);
      // Convertir a formato hex \\x para bytea PostgREST
      const hex = `\\x${blob.toString("hex")}`;
      const { error: updErr } = await supabase
        .from("app_instances")
        .update({
          secrets_ciphertext: hex,
          secrets_encrypted_at: new Date().toISOString(),
          secrets_key_version: 1,
        })
        .eq("id", row.id);
      if (updErr) {
        console.error(`    FAIL: ${updErr.message}`);
        errors++;
      } else {
        encrypted++;
      }
    } catch (err) {
      console.error(`    EXCEPTION:`, err.message);
      errors++;
    }
  }

  console.log(`\nResultado: encrypted=${encrypted} skipped=${skipped} errors=${errors}`);
  if (dryRun) {
    console.log("\nPara ejecutar el cifrado real:");
    console.log("  node scripts/encrypt-secrets.mjs --apply");
  } else if (encrypted > 0) {
    console.log("\nOK. La columna `secrets` plaintext sigue ahi como fallback.");
    console.log("Tras 30 dias de validacion, aplica migracion 019 para DROP-la.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
