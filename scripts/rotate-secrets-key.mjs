#!/usr/bin/env node
/**
 * scripts/rotate-secrets-key.mjs
 *
 * Rota la clave de cifrado de secrets. Descifra con la actual, recifra con la nueva.
 *
 * PRE-REQUISITOS:
 *   - SECRETS_ENCRYPTION_KEY        (actual, key_version=1)
 *   - SECRETS_ENCRYPTION_KEY_NEXT   (nueva, key_version=2)
 *   - NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * USO:
 *   node scripts/rotate-secrets-key.mjs --dry
 *   node scripts/rotate-secrets-key.mjs --apply
 *
 * POST-ROTACION (manual):
 *   1. Confirma que todo funciona con key_version=2 (test login en portal cliente).
 *   2. Mueve SECRETS_ENCRYPTION_KEY_NEXT -> SECRETS_ENCRYPTION_KEY en Vercel.
 *   3. Elimina SECRETS_ENCRYPTION_KEY_NEXT.
 */

import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;
const HEADER_LEN = 2;
const KEY_VERSION_LEN = 1;

function getKey(hex, label) {
  if (!hex) {
    console.error(`ERROR: ${label} no configurada.`);
    process.exit(1);
  }
  if (hex.length !== 64) {
    console.error(`ERROR: ${label} debe ser 64 hex chars. Recibido ${hex.length}.`);
    process.exit(1);
  }
  return Buffer.from(hex, "hex");
}

function decryptBlob(blob) {
  const version = blob.subarray(0, HEADER_LEN).toString("utf8");
  if (version !== "v1") throw new Error(`Unknown crypto version: ${version}`);
  const keyVersion = blob[HEADER_LEN];
  const iv = blob.subarray(HEADER_LEN + KEY_VERSION_LEN, HEADER_LEN + KEY_VERSION_LEN + IV_LEN);
  const tag = blob.subarray(
    HEADER_LEN + KEY_VERSION_LEN + IV_LEN,
    HEADER_LEN + KEY_VERSION_LEN + IV_LEN + TAG_LEN
  );
  const ct = blob.subarray(HEADER_LEN + KEY_VERSION_LEN + IV_LEN + TAG_LEN);
  const currentHex =
    keyVersion === 1
      ? process.env.SECRETS_ENCRYPTION_KEY
      : process.env.SECRETS_ENCRYPTION_KEY_NEXT;
  const key = getKey(currentHex, `SECRETS_ENCRYPTION_KEY${keyVersion > 1 ? "_NEXT" : ""}`);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return JSON.parse(pt.toString("utf8"));
}

function encryptJSON(data, keyVersion = 2) {
  const hex =
    keyVersion === 1
      ? process.env.SECRETS_ENCRYPTION_KEY
      : process.env.SECRETS_ENCRYPTION_KEY_NEXT;
  const key = getKey(hex, `SECRETS_ENCRYPTION_KEY${keyVersion > 1 ? "_NEXT" : ""}`);
  const plaintext = Buffer.from(JSON.stringify(data), "utf8");
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const header = Buffer.from("v1", "utf8");
  const kv = Buffer.from([keyVersion]);
  return Buffer.concat([header, kv, iv, tag, ct]);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const apply = args.includes("--apply");
if (!dryRun && !apply) {
  console.error("Uso: node scripts/rotate-secrets-key.mjs [--dry | --apply]");
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERROR: SUPABASE envvars requeridas.");
  process.exit(1);
}

// Validar ambas keys
getKey(process.env.SECRETS_ENCRYPTION_KEY, "SECRETS_ENCRYPTION_KEY");
getKey(process.env.SECRETS_ENCRYPTION_KEY_NEXT, "SECRETS_ENCRYPTION_KEY_NEXT");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log(`Modo: ${dryRun ? "DRY RUN" : "APPLY"}`);

  const { data, error } = await supabase
    .from("app_instances")
    .select("id, app_slug, secrets_ciphertext, secrets_key_version")
    .not("secrets_ciphertext", "is", null)
    .eq("secrets_key_version", 1);

  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }

  const rows = data || [];
  console.log(`Filas a rotar: ${rows.length}`);

  let rotated = 0;
  let errors = 0;

  for (const row of rows) {
    const raw = row.secrets_ciphertext;
    let blob;
    if (typeof raw === "string") {
      blob = raw.startsWith("\\x") ? Buffer.from(raw.slice(2), "hex") : Buffer.from(raw, "base64");
    } else {
      blob = Buffer.from(raw);
    }

    try {
      const data = decryptBlob(blob);
      const newBlob = encryptJSON(data, 2);
      const hex = `\\x${newBlob.toString("hex")}`;

      console.log(`  instance=${row.id} app=${row.app_slug} -> key_version=2`);
      if (dryRun) continue;

      const { error: updErr } = await supabase
        .from("app_instances")
        .update({
          secrets_ciphertext: hex,
          secrets_encrypted_at: new Date().toISOString(),
          secrets_key_version: 2,
        })
        .eq("id", row.id);
      if (updErr) {
        console.error(`    FAIL: ${updErr.message}`);
        errors++;
      } else {
        rotated++;
      }
    } catch (err) {
      console.error(`    EXCEPTION:`, err.message);
      errors++;
    }
  }

  console.log(`\nResultado: rotated=${rotated} errors=${errors}`);
  if (!dryRun && rotated > 0) {
    console.log("\nOK. Ahora:");
    console.log("  1. Verifica que todo funciona con la nueva key.");
    console.log("  2. En Vercel: mueve SECRETS_ENCRYPTION_KEY_NEXT -> SECRETS_ENCRYPTION_KEY.");
    console.log("  3. Elimina SECRETS_ENCRYPTION_KEY_NEXT.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
