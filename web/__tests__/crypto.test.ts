import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptJSON, decryptJSON, rotateKey } from "@/lib/security/crypto";

/**
 * CRYPTO UNIT TESTS — estos son catastroficos si fallan.
 * Si una regresion rompe encrypt/decrypt, los tokens de clientes
 * quedan ilegibles permanentemente. Run en cada commit.
 */
describe("crypto AES-256-GCM", () => {
  const KEY1 = "a".repeat(64);
  const KEY2 = "b".repeat(64);
  let origKey: string | undefined;
  let origKeyNext: string | undefined;

  beforeEach(() => {
    origKey = process.env.SECRETS_ENCRYPTION_KEY;
    origKeyNext = process.env.SECRETS_ENCRYPTION_KEY_NEXT;
    process.env.SECRETS_ENCRYPTION_KEY = KEY1;
    process.env.SECRETS_ENCRYPTION_KEY_NEXT = KEY2;
  });

  afterEach(() => {
    if (origKey) process.env.SECRETS_ENCRYPTION_KEY = origKey;
    else delete process.env.SECRETS_ENCRYPTION_KEY;
    if (origKeyNext) process.env.SECRETS_ENCRYPTION_KEY_NEXT = origKeyNext;
    else delete process.env.SECRETS_ENCRYPTION_KEY_NEXT;
  });

  it("roundtrip simple JSON object", () => {
    const data = { whatsapp_access_token: "secret123", phone_id: "999" };
    const blob = encryptJSON(data);
    const out = decryptJSON<typeof data>(blob);
    expect(out).toEqual(data);
  });

  it("cifrado no es deterministico (IV aleatorio)", () => {
    const data = { key: "value" };
    const blob1 = encryptJSON(data);
    const blob2 = encryptJSON(data);
    expect(blob1.equals(blob2)).toBe(false);
    // pero ambos descifran al mismo plaintext
    expect(decryptJSON(blob1)).toEqual(data);
    expect(decryptJSON(blob2)).toEqual(data);
  });

  it("ciphertext tampering invalida el tag (GCM)", () => {
    const blob = encryptJSON({ a: 1 });
    const tampered = Buffer.from(blob);
    tampered[tampered.length - 1] ^= 0xff; // flip last byte
    expect(() => decryptJSON(tampered)).toThrow();
  });

  it("clave incorrecta rechaza el tag", () => {
    const blob = encryptJSON({ x: "y" });
    process.env.SECRETS_ENCRYPTION_KEY = "c".repeat(64);
    expect(() => decryptJSON(blob)).toThrow();
  });

  it("clave de longitud invalida lanza error claro", () => {
    process.env.SECRETS_ENCRYPTION_KEY = "short";
    expect(() => encryptJSON({})).toThrow(/64 hex/);
  });

  it("rotacion re-cifra con nueva key version", () => {
    const data = { token: "rotate-me" };
    const blob = encryptJSON(data, 1);
    const rotated = rotateKey(blob, 2);
    // Diferente blob, misma data al descifrar con v2
    expect(blob.equals(rotated)).toBe(false);
    const out = decryptJSON<typeof data>(rotated);
    expect(out).toEqual(data);
  });

  it("formato: prefijo v1 + key_version + IV(12) + TAG(16) + CT", () => {
    const blob = encryptJSON({ a: 1 });
    expect(blob.subarray(0, 2).toString("utf8")).toBe("v1");
    expect(blob[2]).toBe(1); // key_version default
    expect(blob.length).toBeGreaterThan(2 + 1 + 12 + 16);
  });

  it("JSON grande (10KB) roundtrip", () => {
    const data = { payload: "x".repeat(10_000), meta: { ts: Date.now() } };
    const blob = encryptJSON(data);
    const out = decryptJSON<typeof data>(blob);
    expect(out.payload.length).toBe(10_000);
    expect(out.meta.ts).toBe(data.meta.ts);
  });

  it("objetos anidados con unicode", () => {
    const data = { name: "José", company: "España SL 🚀", nested: { emoji: "✅" } };
    const blob = encryptJSON(data);
    expect(decryptJSON(blob)).toEqual(data);
  });
});
