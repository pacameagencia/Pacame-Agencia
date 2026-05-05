#!/usr/bin/env node
/**
 * Deploy automatizado del plugin pacame-connect.php al WP de Joyería Royo
 * usando los endpoints REST del propio plugin (POST /files/write + /cache/clear).
 *
 * Pablo no tiene que volver a subir nada por File Manager.
 *
 * USO:
 *   ROYO_PACAME_SECRET="xK7mP4vN2qR9wL5tF8jH3bY6cZ1aE0sD" \
 *     node tools/royo-content-drafts/deploy-plugin-via-api.mjs
 *
 *   Flags:
 *     --file=<path>   Archivo a subir (default: el plugin compilado en tmp)
 *     --no-purge      No purgar caché LiteSpeed después
 */

import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

const SITE = "https://joyeriaroyo.com";
const NAMESPACE = "/wp-json/pacame/v1";
const TARGET_REL = "mu-plugins/pacame-connect.php";

const args = process.argv.slice(2);
const fileArg = args.find((a) => a.startsWith("--file="));
const PLUGIN_PATH = fileArg
  ? fileArg.split("=")[1]
  : "C:\\Users\\Pacame24\\Downloads\\PACAME AGENCIA\\infra\\wordpress-plugin\\pacame-connect\\pacame-connect.php";
const purge = !args.includes("--no-purge");

const SECRET = process.env.ROYO_PACAME_SECRET;
if (!SECRET) {
  console.error("ERROR: define ROYO_PACAME_SECRET en env (el mismo PACAME_WEBHOOK_SECRET de wp-config.php).");
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
  const url = SITE + NAMESPACE + routePath;
  const res = await fetch(url, {
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
  if (!fs.existsSync(PLUGIN_PATH)) {
    console.error(`ERROR: archivo no encontrado: ${PLUGIN_PATH}`);
    process.exit(1);
  }
  const stats = fs.statSync(PLUGIN_PATH);
  const content = fs.readFileSync(PLUGIN_PATH, "utf8");
  const md5 = crypto.createHash("md5").update(content).digest("hex");
  console.log(`[deploy] archivo: ${PLUGIN_PATH}`);
  console.log(`[deploy] tamaño: ${stats.size} bytes · líneas: ${content.split("\n").length}`);
  console.log(`[deploy] md5: ${md5}`);

  // 1) Smoke test: ¿plugin actual responde?
  console.log("\n[1/4] smoke test /system/info ...");
  const smoke = await pacameCall("GET", "/system/info");
  if (!smoke.ok) {
    console.error(`[FATAL] smoke test fallido HTTP ${smoke.status}:`, smoke.data);
    process.exit(2);
  }
  console.log(`  ✓ WP ${smoke.data.wordpress} · PHP ${smoke.data.php}`);

  // 2) Subir archivo via /files/write
  console.log("\n[2/4] subiendo archivo via /files/write ...");
  const write = await pacameCall("POST", "/files/write", {
    path: TARGET_REL,
    content,
    overwrite: true,
  });
  if (!write.ok) {
    console.error(`[FATAL] /files/write HTTP ${write.status}:`, write.data);
    process.exit(3);
  }
  console.log(`  ✓ escrito ${write.data.bytes} bytes en ${write.data.path}`);

  // 3) Verificar que el nuevo plugin responde (siguiente petición carga ya el código nuevo)
  console.log("\n[3/4] verificación post-deploy /system/info ...");
  await new Promise((r) => setTimeout(r, 1000));
  const post = await pacameCall("GET", "/system/info");
  if (!post.ok) {
    console.error(`[FATAL] el nuevo plugin no responde HTTP ${post.status}:`, post.data);
    console.error("[FATAL] revisa el archivo, posible syntax error PHP. Plugin puede estar caído.");
    process.exit(4);
  }
  console.log(`  ✓ plugin responde tras update`);

  // 4) Purgar caché LiteSpeed
  if (purge) {
    console.log("\n[4/4] purga caché LiteSpeed ...");
    const cache = await pacameCall("POST", "/cache/clear");
    if (cache.ok) {
      console.log(`  ✓ caché purgada: ${(cache.data.cleared || []).join(", ")}`);
    } else {
      console.warn(`  [warn] purga falló HTTP ${cache.status}:`, cache.data);
    }
  } else {
    console.log("\n[4/4] purga skipeada (--no-purge)");
  }

  console.log("\n[done] deploy OK · plugin actualizado en producción Royo");
}

main().catch((e) => { console.error("FATAL:", e); process.exit(99); });
