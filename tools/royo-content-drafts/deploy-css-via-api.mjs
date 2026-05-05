#!/usr/bin/env node
/**
 * Deploy del CSS custom luxury al WP de Royo via REST endpoint /pacame/v1/css/set.
 * Pablo no toca Customizer.
 *
 * USO:
 *   ROYO_PACAME_SECRET="..." node tools/royo-content-drafts/deploy-css-via-api.mjs
 *
 *   Flags:
 *     --file=<path>   CSS a subir (default: css-custom-luxury.css)
 *     --clear         Borra el CSS guardado (--file ignorado)
 */

import fs from "node:fs";
import crypto from "node:crypto";

const SITE = "https://joyeriaroyo.com";
const NAMESPACE = "/wp-json/pacame/v1";

const args = process.argv.slice(2);
const fileArg = args.find((a) => a.startsWith("--file="));
const clear = args.includes("--clear");
const CSS_PATH = fileArg
  ? fileArg.split("=")[1]
  : "C:\\Users\\Pacame24\\Downloads\\PACAME AGENCIA\\tools\\royo-content-drafts\\css-custom-luxury.css";

const SECRET = process.env.ROYO_PACAME_SECRET;
if (!SECRET) {
  console.error("ERROR: define ROYO_PACAME_SECRET en env.");
  process.exit(1);
}

function signRequest(routePath, body) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const payload = `${ts}:${routePath}:${body}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return { ts, sig };
}

async function pacameCall(method, routePath, payload = null) {
  const body = payload ? JSON.stringify(payload) : "";
  const { ts, sig } = signRequest(routePath, body);
  const res = await fetch(SITE + NAMESPACE + routePath, {
    method,
    headers: {
      "X-PACAME-Timestamp": ts,
      "X-PACAME-Signature": sig,
      "Content-Type": "application/json",
      "User-Agent": "PACAME-Bot/1.0 (+https://pacameagencia.com)",
    },
    body: payload ? body : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { _raw: text }; }
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  if (clear) {
    console.log("[clear] borrando CSS guardado en pacame_custom_css ...");
    const r = await pacameCall("POST", "/css/clear");
    console.log(r.ok ? "[done] CSS borrado" : `[FAIL] ${r.status}: ${JSON.stringify(r.data)}`);
    process.exit(r.ok ? 0 : 1);
  }

  if (!fs.existsSync(CSS_PATH)) {
    console.error(`ERROR: archivo no encontrado: ${CSS_PATH}`);
    process.exit(1);
  }
  const css = fs.readFileSync(CSS_PATH, "utf8");
  console.log(`[deploy] archivo: ${CSS_PATH} · ${css.length} chars · ${css.split("\n").length} líneas`);

  const r = await pacameCall("POST", "/css/set", { css });
  if (!r.ok) {
    console.error(`[FAIL] /css/set HTTP ${r.status}:`, r.data);
    process.exit(2);
  }
  console.log(`  ✓ CSS guardado · ${r.data.length} chars en wp_options('pacame_custom_css')`);

  // Verificación: pedir la home y comprobar que el <style id="pacame-custom-css"> aparece
  console.log("\n[verify] comprobando inyección en home ...");
  const home = await fetch(SITE + "/?_=" + Date.now(), {
    headers: { "User-Agent": "PACAME-Bot/1.0" },
  }).then((r) => r.text());
  if (home.includes('id="pacame-custom-css"')) {
    console.log("  ✓ <style id=\"pacame-custom-css\"> presente en home");
  } else {
    console.warn("  [warn] el <style> no aparece — posible caché LiteSpeed. Espera 30s y recarga.");
  }

  console.log("\n[done] CSS luxury aplicado en producción Royo.");
}

main().catch((e) => { console.error("FATAL:", e); process.exit(99); });
