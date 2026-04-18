/**
 * Helper para leer/escribir secrets cifrados de app_instances.
 * Reemplaza el acceso directo a `app_instances.secrets` (plaintext jsonb).
 * Fase de migracion: lee de `secrets_ciphertext` (nuevo) con fallback a `secrets` legacy.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { encryptJSON, decryptJSON } from "./crypto";
import { getLogger } from "@/lib/observability/logger";

export type AppSecrets = Record<string, unknown>;

/**
 * Keys que DEBEN cifrarse si aparecen en el body de setup.
 * Patron: coincidencia suffix (case-insensitive).
 */
const SECRET_KEY_PATTERNS = [
  /token$/i,
  /secret$/i,
  /password$/i,
  /api_?key$/i,
  /access_?token$/i,
  /private_?key$/i,
  /^(whatsapp|instagram|telegram|meta)_(phone_id|business_id)$/i, // ids que pueden ser sensibles segun caso
];

export function isSecretKey(key: string): boolean {
  return SECRET_KEY_PATTERNS.some((re) => re.test(key));
}

/**
 * Separa un objeto de config en:
 *  - `config`: valores no sensibles (se guardan en app_instances.config)
 *  - `secrets`: valores sensibles (se cifran en app_instances.secrets_ciphertext)
 */
export function splitConfigAndSecrets(obj: Record<string, unknown>): {
  config: Record<string, unknown>;
  secrets: AppSecrets;
} {
  const config: Record<string, unknown> = {};
  const secrets: AppSecrets = {};
  for (const [k, v] of Object.entries(obj)) {
    if (isSecretKey(k)) {
      secrets[k] = v;
    } else {
      config[k] = v;
    }
  }
  return { config, secrets };
}

/**
 * Lee y descifra los secrets de un app_instance.
 * Fallback a `secrets` legacy (plaintext) si ciphertext no existe.
 */
export async function getAppSecrets<T extends AppSecrets = AppSecrets>(
  instanceId: string
): Promise<T | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("app_instances")
    .select("secrets, secrets_ciphertext, secrets_key_version")
    .eq("id", instanceId)
    .maybeSingle();

  if (error || !data) return null;

  const ciphertext = data.secrets_ciphertext as
    | string
    | ArrayBuffer
    | Uint8Array
    | null;

  if (ciphertext) {
    try {
      let buf: Buffer;
      if (typeof ciphertext === "string") {
        // Supabase PostgREST devuelve bytea como "\\x..." hex o base64
        if (ciphertext.startsWith("\\x")) {
          buf = Buffer.from(ciphertext.slice(2), "hex");
        } else {
          buf = Buffer.from(ciphertext, "base64");
        }
      } else {
        buf = Buffer.from(ciphertext as ArrayBuffer);
      }
      return decryptJSON<T>(buf);
    } catch (err) {
      getLogger().error({ err, instanceId }, "app-secrets decrypt failed");
      return null;
    }
  }

  // Legacy fallback (pre-backfill)
  const legacy = (data.secrets || {}) as Record<string, unknown>;
  if (Object.keys(legacy).length > 0) {
    getLogger().warn({ instanceId }, "app-secrets read from legacy plaintext column");
    return legacy as T;
  }

  return null;
}

/**
 * Cifra y guarda secrets. Limpia la columna legacy `secrets`.
 */
export async function setAppSecrets(
  instanceId: string,
  secrets: AppSecrets
): Promise<void> {
  const supabase = createServerSupabase();
  const blob = encryptJSON(secrets);
  // Supabase JS acepta Buffer para BYTEA columnas
  const payload: Record<string, unknown> = {
    secrets_ciphertext: blob,
    secrets_encrypted_at: new Date().toISOString(),
    secrets_key_version: 1,
    secrets: {}, // limpia legacy
  };
  const { error } = await supabase.from("app_instances").update(payload).eq("id", instanceId);
  if (error) {
    // Fallback: algunos clientes PostgREST necesitan bytea como "\\x<hex>"
    const hex = `\\x${blob.toString("hex")}`;
    const { error: err2 } = await supabase
      .from("app_instances")
      .update({ ...payload, secrets_ciphertext: hex })
      .eq("id", instanceId);
    if (err2) throw new Error(`setAppSecrets failed: ${err2.message}`);
  }
}
