#!/usr/bin/env node
/**
 * Alta one-off de Grupo MLIA en la capa de mantenimiento WP de PACAME.
 *
 * Replica EXACTAMENTE la lógica del endpoint POST /api/clients/[id]/websites
 * + POST /api/clients/[id]/websites/[wid]/test, pero como script reproducible
 * (no existe endpoint público para crear la fila `clients`).
 *
 * Qué hace (idempotente):
 *   1. Carga web/.env.local (SUPABASE + WP_SECRET_KEY + MLIA_*).
 *   2. Upsert en `clients` (por name) → client_id.
 *   3. Upsert en `client_websites` (por client_id+base_url) con la application
 *      password cifrada AES-256-GCM (misma rutina que web/lib/crypto-secrets.ts).
 *   4. Test de conexión real: GET {base}/wp-json/wp/v2/users/me?context=edit
 *      con Basic auth → exige rol `administrator`. Actualiza status.
 *   5. Imprime client_id, website_id, status y roles.
 *
 * USO:
 *   node clients/grupo-mlia/scripts/onboard.mjs              # alta + test
 *   node clients/grupo-mlia/scripts/onboard.mjs --test-only  # solo re-test
 *   node clients/grupo-mlia/scripts/onboard.mjs --dry-run    # no escribe en Supabase
 *
 * Requiere en web/.env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WP_SECRET_KEY (64 hex)
 *   MLIA_WP_BASE_URL  (ej: https://grupomlia.com)
 *   MLIA_WP_USER      (usuario admin WordPress)
 *   MLIA_WP_APP_PASS  (application password: "xxxx xxxx xxxx xxxx xxxx xxxx")
 *   MLIA_PACAME_SECRET (opcional — HMAC para futuro plugin MU)
 *
 * Sin dependencias externas (Node 18+: fetch + crypto nativos).
 */

import { createCipheriv, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const ENV_PATH = resolve(REPO_ROOT, "web/.env.local");

const args = process.argv.slice(2);
const testOnly = args.includes("--test-only");
const dryRun = args.includes("--dry-run");

// ---------------------------------------------------------------------------
// 1. Cargar web/.env.local (parser mínimo, sin deps). process.env tiene prioridad.
// ---------------------------------------------------------------------------
function loadEnv(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    fail(`No encuentro ${path}. Las credenciales viven en web/.env.local (gitignored).`);
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

loadEnv(ENV_PATH);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WP_SECRET_KEY = process.env.WP_SECRET_KEY;
const BASE_URL_RAW = process.env.MLIA_WP_BASE_URL;
const WP_USER = process.env.MLIA_WP_USER;
const WP_APP_PASS = process.env.MLIA_WP_APP_PASS;
const PACAME_SECRET = process.env.MLIA_PACAME_SECRET || null;

const missing = [];
if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
if (!SERVICE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
if (!WP_SECRET_KEY) missing.push("WP_SECRET_KEY");
if (!BASE_URL_RAW) missing.push("MLIA_WP_BASE_URL");
if (!WP_USER) missing.push("MLIA_WP_USER");
if (!WP_APP_PASS) missing.push("MLIA_WP_APP_PASS");
if (missing.length) fail(`Faltan variables en web/.env.local: ${missing.join(", ")}`);
if (WP_SECRET_KEY.length !== 64) {
  fail(`WP_SECRET_KEY debe ser 64 hex (32 bytes). Tiene ${WP_SECRET_KEY.length}.`);
}

const BASE_URL = BASE_URL_RAW.replace(/\/+$/, "");

// ---------------------------------------------------------------------------
// 2. Cifrado AES-256-GCM (idéntico a web/lib/crypto-secrets.ts)
// ---------------------------------------------------------------------------
function encryptSecret(plaintext) {
  const key = Buffer.from(WP_SECRET_KEY, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext: enc.toString("hex"), iv: iv.toString("hex"), tag: tag.toString("hex") };
}

// ---------------------------------------------------------------------------
// 3. Helper PostgREST (Supabase service role)
// ---------------------------------------------------------------------------
async function sb(path, { method = "GET", body, prefer } = {}) {
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    throw new Error(`Supabase ${method} ${path} → ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// 4. Test de conexión WordPress (réplica de wpPing)
// ---------------------------------------------------------------------------
async function wpTest() {
  const auth = Buffer.from(`${WP_USER}:${WP_APP_PASS}`).toString("base64");
  const url = `${BASE_URL}/wp-json/wp/v2/users/me?context=edit`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      "User-Agent": "PACAME-Bot/1.0 (+https://pacameagencia.com)",
    },
  });
  const text = await res.text();
  let me;
  try { me = JSON.parse(text); } catch { me = text; }
  if (!res.ok) {
    throw new Error(`WP GET users/me → ${res.status}: ${String(typeof me === "string" ? me : JSON.stringify(me)).slice(0, 300)}`);
  }
  return { id: me.id, name: me.name, roles: me.roles || [] };
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
(async () => {
  console.log(`\n🟦 Grupo MLIA — onboarding capa WP PACAME`);
  console.log(`   Supabase: ${SUPABASE_URL}`);
  console.log(`   WP base:  ${BASE_URL}`);
  console.log(`   WP user:  ${WP_USER}`);
  console.log(`   Modo:     ${dryRun ? "DRY-RUN (no escribe)" : testOnly ? "TEST-ONLY" : "ALTA + TEST"}\n`);

  // --- localizar/crear cliente ---
  let clientId;
  const existingClients = await sb(`clients?name=eq.${encodeURIComponent("Grupo MLIA")}&select=id,name,status`);
  if (existingClients.length) {
    clientId = existingClients[0].id;
    console.log(`✔ clients: ya existe (${clientId}) status=${existingClients[0].status}`);
  } else if (testOnly) {
    fail("--test-only pero no existe la fila clients. Ejecuta el alta primero.");
  } else if (dryRun) {
    console.log(`• [dry-run] crearía clients{name:"Grupo MLIA", business_name:"Grupo MLIA", website:"${BASE_URL}", status:"active"}`);
    clientId = "(dry-run-client-id)";
  } else {
    const inserted = await sb(`clients`, {
      method: "POST",
      prefer: "return=representation",
      body: {
        name: "Grupo MLIA",
        business_name: "Grupo MLIA",
        website: BASE_URL,
        status: "active",
        source: "pacame-capa2",
        notes: "Cliente Capa 2 — mantenimiento WP + SEO + contenido (modelo Royo). Alta 2026-05-18.",
      },
    });
    clientId = inserted[0].id;
    console.log(`✔ clients: creado ${clientId}`);
  }

  // --- localizar/crear website ---
  let websiteId;
  let websiteStatus = "pending";
  if (clientId && clientId !== "(dry-run-client-id)") {
    const sites = await sb(
      `client_websites?client_id=eq.${clientId}&base_url=eq.${encodeURIComponent(BASE_URL)}&select=id,status`
    );
    if (sites.length) {
      websiteId = sites[0].id;
      websiteStatus = sites[0].status;
      console.log(`✔ client_websites: ya existe (${websiteId}) status=${websiteStatus}`);
    }
  }

  if (!websiteId && !testOnly) {
    const enc = encryptSecret(WP_APP_PASS);
    const row = {
      client_id: clientId,
      platform: "wordpress",
      base_url: BASE_URL,
      label: "Web principal",
      wp_user: WP_USER,
      wp_app_password_ciphertext: enc.ciphertext,
      wp_app_password_iv: enc.iv,
      wp_app_password_tag: enc.tag,
      wp_api_namespace: "wp/v2",
      seo_plugin: "yoast",
      woocommerce_enabled: false,
      webhook_secret: PACAME_SECRET,
      status: "pending",
    };
    if (dryRun) {
      console.log(`• [dry-run] insertaría client_websites (app password cifrada AES-256-GCM, seo_plugin=yoast)`);
      websiteId = "(dry-run-website-id)";
    } else {
      const inserted = await sb(`client_websites`, {
        method: "POST",
        prefer: "return=representation",
        body: row,
      });
      websiteId = inserted[0].id;
      console.log(`✔ client_websites: creado ${websiteId} (credenciales cifradas)`);
    }
  } else if (websiteId && !testOnly && !dryRun) {
    // re-cifrar credenciales por si rotaron
    const enc = encryptSecret(WP_APP_PASS);
    await sb(`client_websites?id=eq.${websiteId}`, {
      method: "PATCH",
      body: {
        wp_user: WP_USER,
        wp_app_password_ciphertext: enc.ciphertext,
        wp_app_password_iv: enc.iv,
        wp_app_password_tag: enc.tag,
        seo_plugin: "yoast",
        woocommerce_enabled: false,
        webhook_secret: PACAME_SECRET,
      },
    });
    console.log(`✔ client_websites: credenciales actualizadas/re-cifradas`);
  }

  // --- test de conexión ---
  if (dryRun) {
    console.log(`\n• [dry-run] omito test real. Resumen simulado.`);
    console.log(`\nclient_id: ${clientId}\nwebsite_id: ${websiteId}\n`);
    return;
  }

  console.log(`\n🔌 Probando conexión WordPress…`);
  let result;
  try {
    const me = await wpTest();
    const isAdmin = (me.roles || []).includes("administrator");
    if (websiteId && websiteId !== "(dry-run-website-id)") {
      await sb(`client_websites?id=eq.${websiteId}`, {
        method: "PATCH",
        body: {
          status: "connected",
          last_sync_at: new Date().toISOString(),
          last_error: null,
        },
      });
    }
    websiteStatus = "connected";
    result = { ok: true, user: me, isAdmin };
    console.log(`✔ Conectado como "${me.name}" (id ${me.id}) — roles: ${me.roles.join(", ")}`);
    if (!isAdmin) {
      console.log(`⚠️  El usuario NO tiene rol administrator. Algunas operaciones fallarán.`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (websiteId && websiteId !== "(dry-run-website-id)") {
      await sb(`client_websites?id=eq.${websiteId}`, {
        method: "PATCH",
        body: { status: "error", last_error: message.slice(0, 500) },
      }).catch(() => {});
    }
    websiteStatus = "error";
    result = { ok: false, error: message };
    console.log(`❌ Test de conexión falló: ${message}`);
  }

  // --- resumen para README / memoria ---
  console.log(`\n──────── RESUMEN ────────`);
  console.log(`clients.id         : ${clientId}`);
  console.log(`client_websites.id : ${websiteId}`);
  console.log(`status             : ${websiteStatus}`);
  if (result.ok) {
    console.log(`WP user            : ${result.user.name} (roles: ${result.user.roles.join(", ")})`);
  }
  console.log(`─────────────────────────\n`);

  process.exit(result.ok ? 0 : 2);
})().catch((e) => fail(e instanceof Error ? e.stack || e.message : String(e)));
