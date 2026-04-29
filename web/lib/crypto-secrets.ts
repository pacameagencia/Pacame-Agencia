import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * AES-256-GCM symmetric encryption for storing third-party credentials
 * (WordPress app passwords, Stripe keys, Meta tokens, etc.) in Supabase.
 *
 * Key source: env var WP_SECRET_KEY (32 bytes, hex-encoded → 64 chars).
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Output: { ciphertext, iv, tag } all hex-encoded. Store the three columns.
 */

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;

function getKey(): Buffer {
  const hex = process.env.WP_SECRET_KEY;
  if (!hex) {
    throw new Error("WP_SECRET_KEY is not set. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
  }
  if (hex.length !== 64) {
    throw new Error(`WP_SECRET_KEY must be 64 hex chars (32 bytes). Got ${hex.length}.`);
  }
  return Buffer.from(hex, "hex");
}

export type EncryptedSecret = {
  ciphertext: string;
  iv: string;
  tag: string;
};

export function encryptSecret(plaintext: string): EncryptedSecret {
  if (!plaintext) throw new Error("encryptSecret: plaintext is empty");
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decryptSecret(secret: EncryptedSecret): string {
  if (!secret.ciphertext || !secret.iv || !secret.tag) {
    throw new Error("decryptSecret: incomplete payload (need ciphertext+iv+tag)");
  }
  const key = getKey();
  const iv = Buffer.from(secret.iv, "hex");
  const tag = Buffer.from(secret.tag, "hex");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(secret.ciphertext, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

export function isCryptoConfigured(): boolean {
  const hex = process.env.WP_SECRET_KEY;
  return Boolean(hex && hex.length === 64);
}
