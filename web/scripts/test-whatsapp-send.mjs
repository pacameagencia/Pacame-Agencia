#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");

try {
  const envText = readFileSync(envPath, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      let v = m[2];
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
} catch (err) {
  console.error(`No pude leer ${envPath}:`, err.message);
  process.exit(1);
}

const phoneArg = process.argv[2];
const template = process.argv[3] || "hello_world";
const langCode = process.argv[4] || "en_US";

if (!phoneArg) {
  console.error("Uso: node scripts/test-whatsapp-send.mjs <telefono_e164_sin_+> [template] [lang]");
  console.error("Ej:  node scripts/test-whatsapp-send.mjs 34722669381 hello_world en_US");
  process.exit(1);
}

const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;

if (!PHONE_ID || !TOKEN) {
  console.error("Falta WHATSAPP_PHONE_ID o WHATSAPP_TOKEN en .env.local");
  process.exit(1);
}

const cleanPhone = phoneArg.replace(/[+\s\-()]/g, "");
const url = `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`;
const body = {
  messaging_product: "whatsapp",
  to: cleanPhone,
  type: "template",
  template: { name: template, language: { code: langCode } },
};

console.log(`→ POST ${url}`);
console.log(`→ to: ${cleanPhone}, template: ${template} (${langCode})`);

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TOKEN}`,
  },
  body: JSON.stringify(body),
});

const json = await res.json().catch(() => ({}));
console.log(`← HTTP ${res.status}`);
console.log(JSON.stringify(json, null, 2));

if (!res.ok) {
  console.error("\nFALLO. Causas habituales:");
  console.error("  - 401: token caducado/inválido → genera nuevo");
  console.error("  - 131030: número no existe en WhatsApp");
  console.error("  - 132000: template no aprobado o nombre/idioma incorrecto");
  console.error("  - 131056: ventana 24h cerrada (este script usa template, no debería pasar)");
  process.exit(1);
}

console.log("\n✓ Mensaje enviado. Revisa el WhatsApp del destinatario.");
