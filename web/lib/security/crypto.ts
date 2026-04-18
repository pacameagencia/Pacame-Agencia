// Helper crypto AES-256-GCM para secrets de aplicaciones.
// Formato binario: HEADER(2 bytes ASCII "v1") || KEY_VERSION(1 byte) || IV(12) || TAG(16) || CIPHERTEXT
// La clave se deriva de SECRETS_ENCRYPTION_KEY (hex de 64 chars = 32 bytes).
// Rotacion: SECRETS_ENCRYPTION_KEY_NEXT permite recifrar con version 2 sin downtime.

import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;
const FORMAT_VERSION = "v1";
const HEADER_LEN = 2; // "v1"
const KEY_VERSION_LEN = 1;

function getKey(keyVersion = 1): Buffer {
  const hex =
    keyVersion === 1
      ? process.env.SECRETS_ENCRYPTION_KEY
      : process.env.SECRETS_ENCRYPTION_KEY_NEXT;
  if (!hex) {
    throw new Error(
      `SECRETS_ENCRYPTION_KEY${keyVersion > 1 ? "_NEXT" : ""} not configured`
    );
  }
  if (hex.length !== 64) {
    throw new Error(
      `SECRETS_ENCRYPTION_KEY must be 64 hex chars (32 bytes). Got ${hex.length}`
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Cifra un objeto JSON. Devuelve un Buffer binario apto para BYTEA.
 * @param data objeto serializable a JSON
 * @param keyVersion 1 (default, SECRETS_ENCRYPTION_KEY) o 2 (SECRETS_ENCRYPTION_KEY_NEXT)
 */
export function encryptJSON(data: unknown, keyVersion = 1): Buffer {
  const plaintext = Buffer.from(JSON.stringify(data), "utf8");
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, getKey(keyVersion), iv);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const header = Buffer.from(FORMAT_VERSION, "utf8"); // 2 bytes
  const versionByte = Buffer.from([keyVersion & 0xff]);
  return Buffer.concat([header, versionByte, iv, tag, ct]);
}

/**
 * Descifra un blob producido por encryptJSON.
 * Throws si el formato/tag no casa (integridad GCM).
 */
export function decryptJSON<T = unknown>(blob: Buffer): T {
  if (blob.length < HEADER_LEN + KEY_VERSION_LEN + IV_LEN + TAG_LEN) {
    throw new Error("Crypto blob too short");
  }
  const version = blob.subarray(0, HEADER_LEN).toString("utf8");
  if (version !== FORMAT_VERSION) {
    throw new Error(`Unknown crypto version: ${version}`);
  }
  const keyVersion = blob[HEADER_LEN];
  const ivStart = HEADER_LEN + KEY_VERSION_LEN;
  const tagStart = ivStart + IV_LEN;
  const ctStart = tagStart + TAG_LEN;
  const iv = blob.subarray(ivStart, tagStart);
  const tag = blob.subarray(tagStart, ctStart);
  const ct = blob.subarray(ctStart);
  const decipher = createDecipheriv(ALGO, getKey(keyVersion), iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return JSON.parse(pt.toString("utf8")) as T;
}

/**
 * Rotacion: descifra con la clave actual y recifra con la nueva version.
 * Requiere que ambas env vars esten disponibles en el proceso.
 */
export function rotateKey(blob: Buffer, newKeyVersion = 2): Buffer {
  const data = decryptJSON(blob);
  return encryptJSON(data, newKeyVersion);
}

/**
 * Helper opcional: serializa a string "\\x<hex>" que Postgres acepta
 * como literal BYTEA. Util si el driver JS rechaza Buffer directo.
 */
export function toHexLiteral(blob: Buffer): string {
  return `\\x${blob.toString("hex")}`;
}

/**
 * Heuristica: dadas las keys de un objeto, separa cuales son secrets.
 * Reglas:
 *  - whitelist explicita (whatsapp_access_token, api_key, access_token, oauth_token, secret, password)
 *  - sufijos "_token" o "_secret"
 */
export function isSecretKey(key: string): boolean {
  const k = key.toLowerCase();
  if (
    k === "whatsapp_access_token" ||
    k === "api_key" ||
    k === "access_token" ||
    k === "oauth_token" ||
    k === "secret" ||
    k === "password"
  ) {
    return true;
  }
  if (k.endsWith("_token") || k.endsWith("_secret")) return true;
  return false;
}

/**
 * Separa un objeto plano en {publicConfig, secrets} segun isSecretKey.
 */
export function splitSecrets(input: Record<string, unknown>): {
  publicConfig: Record<string, unknown>;
  secrets: Record<string, unknown>;
} {
  const publicConfig: Record<string, unknown> = {};
  const secrets: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (isSecretKey(k)) secrets[k] = v;
    else publicConfig[k] = v;
  }
  return { publicConfig, secrets };
}
