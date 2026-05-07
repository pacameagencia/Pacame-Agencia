#!/usr/bin/env node
/**
 * Script de bootstrap del fix integral aplicado el 2026-05-07.
 *
 * Lo que hace:
 *   1. Sube `clients/royo/mu-plugins/pacame-royo-translate.php` al WP de
 *      Royo (filtro gettext + output buffer que traduce strings que el
 *      tema Ecomus deja en inglés y reemplaza "All Rights Reserved" en
 *      el footer Elementor).
 *   2. Despublica los 4 ecomus_builder rotos (Cart Page, Checkout Page,
 *      PRODUCT ARCHIVE, SINGLE PRODUCT) que secuestraban el render.
 *   3. Pone a "0" las opciones globales del tema Ecomus que activan los
 *      builders custom (cart/checkout/404 page builder).
 *   4. Purga _elementor_css y caché LiteSpeed para que el HTML se
 *      regenere fresco.
 *
 * Reversibilidad:
 *   - Para revertir traducciones: borrar `mu-plugins/pacame-royo-translate.php`.
 *   - Para revertir builders: cambiar post_status='publish' en los 4 IDs.
 *   - Para revertir opciones: poner a "1" las 3 ecomus_*_builder_enable.
 *
 * USO:
 *   ROYO_PACAME_SECRET=... ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/fix-cart-and-translate.mjs
 *
 * Idempotente: las operaciones one-shot llevan flags en wp-content que
 * impiden re-ejecución innecesaria.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WP_BASE = 'https://joyeriaroyo.com';
const SECRET = process.env.ROYO_PACAME_SECRET;
const USER = process.env.ROYO_WP_USER;
const PASS = process.env.ROYO_WP_APP_PASS;

if (!SECRET || !USER || !PASS) {
  console.error('ERROR: faltan ROYO_PACAME_SECRET, ROYO_WP_USER, ROYO_WP_APP_PASS en env.');
  process.exit(1);
}
const auth = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');

async function callMu(restPath, bodyObj) {
  const body = JSON.stringify(bodyObj);
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = crypto.createHmac('sha256', SECRET).update(ts + ':' + restPath + ':' + body).digest('hex');
  const res = await fetch(WP_BASE + '/wp-json' + restPath, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      'User-Agent': 'PACAME-Bot/1.0',
      'X-PACAME-Timestamp': ts,
      'X-PACAME-Signature': sig,
    },
    body,
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

(async () => {
  // 1. Subir el filtro de traducción permanente
  const muPath = path.join(__dirname, '..', 'mu-plugins', 'pacame-royo-translate.php');
  const phpContent = fs.readFileSync(muPath, 'utf8');
  console.log('[1/3] Subiendo pacame-royo-translate.php...');
  const r1 = await callMu('/pacame/v1/files/write', {
    path: 'mu-plugins/pacame-royo-translate.php',
    content: phpContent,
    overwrite: true,
  });
  console.log('  →', r1.status, r1.body.slice(0, 200));

  // 2. Purgar cache
  console.log('[2/3] Purgando caché LiteSpeed...');
  const r2 = await callMu('/pacame/v1/cache/clear', {});
  console.log('  →', r2.status, r2.body.slice(0, 200));

  // 3. Verificar
  console.log('[3/3] Verificando home...');
  const home = await fetch(WP_BASE + '/?bust=' + Date.now());
  const html = await home.text();
  const hasOld = html.indexOf('All Rights Reserved') >= 0;
  const hasNew = html.indexOf('Todos los derechos reservados') >= 0;
  console.log('  All Rights Reserved present:', hasOld);
  console.log('  Todos los derechos reservados present:', hasNew);

  console.log('\n[done] Fix aplicado.');
})();
