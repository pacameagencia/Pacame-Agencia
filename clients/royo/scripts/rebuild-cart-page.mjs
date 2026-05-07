#!/usr/bin/env node
/**
 * Sprint Carrito alta gama — Royo
 *
 * Resetea la página /carrito-compra-joyeria-royo/ (id 10822) a Gutenberg
 * con:
 *   - shortcode [woocommerce_cart] limpio (sin Elementor wrapper que rompía el render).
 *   - bloque "Royo trust grid" (3 cards reales: tienda física, atención
 *     al cliente, garantía oficial) — sin financiación, sin reclamos
 *     legales inventados. Estilos definidos en css-custom-luxury.css §16.3.
 *   - sin demo Ecomus en inglés ("Happy Clients", "Best Online Fashion
 *     Site", "Robert Smith").
 *
 * USO:
 *   ROYO_PACAME_SECRET=... ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node clients/royo/scripts/rebuild-cart-page.mjs
 */
import crypto from 'node:crypto';

const WP_BASE = 'https://joyeriaroyo.com';
const PAGE_ID = 10822; // /carrito-compra-joyeria-royo/

const SECRET = process.env.ROYO_PACAME_SECRET;
const USER = process.env.ROYO_WP_USER;
const PASS = process.env.ROYO_WP_APP_PASS;
if (!SECRET || !USER || !PASS) {
  console.error('ERROR: faltan ROYO_PACAME_SECRET, ROYO_WP_USER, ROYO_WP_APP_PASS en env.');
  process.exit(1);
}
const auth = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');

// Contenido nuevo de la página /carrito/. Gutenberg admite HTML directo.
// Las clases royo-trust-* viven en css-custom-luxury.css §16.3.
const CONTENT = `
[woocommerce_cart]

<div class="royo-trust-grid">

  <div class="royo-trust-card">
    <span class="royo-trust-card__icon">
      <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-7-10a7 7 0 1 1 14 0c0 5.5-7 10-7 10z"/><circle cx="12" cy="11" r="2.5"/></svg>
    </span>
    <div>
      <p class="royo-trust-card__title">Tienda física en Albacete</p>
      <p class="royo-trust-card__text">C. Tesifonte Gallego, 2.<br/>Recoge tu pedido en mano si lo prefieres.</p>
    </div>
  </div>

  <div class="royo-trust-card">
    <span class="royo-trust-card__icon">
      <svg viewBox="0 0 24 24"><path d="M22 16.92V21a1 1 0 0 1-1.1 1A19.86 19.86 0 0 1 2 3.1 1 1 0 0 1 3 2h4.09a1 1 0 0 1 1 .75l1 4a1 1 0 0 1-.27 1L7.21 9.21a16 16 0 0 0 7.58 7.58l1.46-1.61a1 1 0 0 1 1-.27l4 1a1 1 0 0 1 .75 1z"/></svg>
    </span>
    <div>
      <p class="royo-trust-card__title">Atención personalizada</p>
      <p class="royo-trust-card__text">Llama al <a href="tel:+34967217903">967 21 79 03</a> o escribe a <a href="mailto:jroyo@joyeriaroyo.com">jroyo@joyeriaroyo.com</a>.</p>
    </div>
  </div>

  <div class="royo-trust-card">
    <span class="royo-trust-card__icon">
      <svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z"/><path d="m9 12 2 2 4-4"/></svg>
    </span>
    <div>
      <p class="royo-trust-card__title">Garantía oficial de marca</p>
      <p class="royo-trust-card__text">Distribuidor autorizado.<br/>Cada pieza incluye la garantía oficial de su fabricante.</p>
    </div>
  </div>

</div>
`.trim();

async function callMu(path, bodyObj) {
  const body = JSON.stringify(bodyObj);
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = crypto.createHmac('sha256', SECRET).update(ts + ':' + path + ':' + body).digest('hex');
  const res = await fetch(WP_BASE + '/wp-json' + path, {
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
  console.log(`[init] Reset página id=${PAGE_ID} a Gutenberg con shortcode + trust grid.`);

  const r = await callMu(`/pacame/v1/page/${PAGE_ID}/reset-to-gutenberg`, {
    title: 'Carrito de compra',
    content: CONTENT,
    remove_elementor: true,
    status: 'publish',
  });
  console.log('reset status:', r.status);
  console.log(r.body.slice(0, 400));

  if (r.status !== 200) {
    console.error('ERROR reset, abortando.');
    process.exit(1);
  }

  // Purgar cache LiteSpeed
  const c = await callMu('/pacame/v1/cache/clear', {});
  console.log('cache_clear:', c.status, c.body.slice(0, 200));
})();
