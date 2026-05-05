#!/usr/bin/env node
/**
 * Auditor de cadenas EN residuales en Royo tras deploy del plugin pacame-connect.
 *
 * Curla 8 URLs (bypass cache con timestamp), busca cadenas EN del whitelist,
 * reporta tabla URL → cuántas EN siguen + cuántas ES detectadas.
 *
 * USO:
 *   node tools/royo-content-drafts/audit-i18n-residual.mjs
 */

const SITE = "https://joyeriaroyo.com";

// Whitelist de cadenas que esperamos en español tras v0.6.0.
// La pareja [EN, ES] permite contar ambos en cada página.
const PAIRS = [
  ["Add to wishlist", "Añadir a favoritos"],
  ["Added to wishlist", "Añadido a favoritos"],
  ["View wishlist", "Ver favoritos"],
  ["Browse wishlist", "Ver favoritos"],
  ["Remove from wishlist", "Quitar de favoritos"],
  ["Share wishlist", "Compartir lista"],
  ["Add to compare", "Añadir a comparar"],
  ["Compare products", "Comparar productos"],
  ["View compare", "Ver comparativa"],
  ["Browse compare", "Ver comparativa"],
  ["Remove from compare", "Quitar de comparar"],
  ["Search our site", "Buscar en la tienda"],
  ["View cart", "Ver carrito"],
  ["View all", "Ver todo"],
  ["Quick view", "Vista rápida"],
  ["Recently viewed", "Vistos recientemente"],
  ["Continue shopping", "Seguir comprando"],
  ["Show more", "Ver más"],
  ["Show less", "Ver menos"],
  ["Read more", "Leer más"],
  ["Sort by", "Ordenar por"],
  ["Apply", "Aplicar"],
  ["Clear All", "Limpiar todo"],
  ["Reset Filter", "Restablecer filtros"],
  ["In stock", "En stock"],
  ["Out of stock", "Agotado"],
  ["Description", "Descripción"],
  ["Additional information", "Información adicional"],
  ["Reviews", "Reseñas"],
  ["My account", "Mi cuenta"],
  ["Login", "Iniciar sesión"],
  ["Logout", "Cerrar sesión"],
  ["Forgot password?", "¿Olvidaste tu contraseña?"],
];

const URLS = [
  ["HOME", "/"],
  ["PRODUCTO Tissot", "/producto/tradition-piel-negra-t0636101605800/"],
  ["CATEG. Tissot", "/categoria-producto/marcas/tissot/"],
  ["CATEG. Joyas", "/categoria-producto/joyas/"],
  ["CARRITO", "/cart/"],
  ["MI CUENTA", "/my-account/"],
  ["BLOG", "/blog/"],
  ["CONTACTO", "/contacto-joyeria-royo-albacete/"],
];

function countOccurrences(html, str) {
  let i = 0, count = 0;
  while ((i = html.indexOf(str, i)) !== -1) {
    count++;
    i += str.length;
  }
  return count;
}

async function audit(name, urlPath) {
  const url = SITE + urlPath + "?_=" + Date.now();
  let html;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (PACAME-audit-bot)" } });
    if (!res.ok) return { name, urlPath, status: res.status, en: -1, es: -1, error: `HTTP ${res.status}` };
    html = await res.text();
  } catch (e) {
    return { name, urlPath, status: 0, en: -1, es: -1, error: e.message };
  }

  let totalEN = 0, totalES = 0;
  const detail = [];
  for (const [en, es] of PAIRS) {
    const cEN = countOccurrences(html, en);
    const cES = countOccurrences(html, es);
    totalEN += cEN;
    totalES += cES;
    if (cEN > 0) detail.push(`'${en}'×${cEN}`);
  }
  return { name, urlPath, status: 200, en: totalEN, es: totalES, detail };
}

async function main() {
  console.log("[audit] Joyería Royo · cadenas EN residuales tras deploy plugin");
  console.log("[audit] " + new Date().toISOString());
  console.log("");
  console.log("URL                               | EN  | ES  | EN strings");
  console.log("─".repeat(95));

  const results = [];
  for (const [name, path] of URLS) {
    const r = await audit(name, path);
    results.push(r);
    const enStr = r.en === -1 ? "ERR" : String(r.en).padStart(3);
    const esStr = r.es === -1 ? "ERR" : String(r.es).padStart(3);
    const detail = r.detail && r.detail.length ? r.detail.slice(0, 5).join(", ") : "—";
    console.log(`${name.padEnd(33)} | ${enStr} | ${esStr} | ${detail}`);
  }

  console.log("─".repeat(95));
  const totalEN = results.reduce((s, r) => s + (r.en > 0 ? r.en : 0), 0);
  const totalES = results.reduce((s, r) => s + (r.es > 0 ? r.es : 0), 0);
  console.log(`TOTAL: ${totalEN} cadenas EN residuales · ${totalES} cadenas ES correctas`);
  console.log("");
  if (totalEN === 0) {
    console.log("[done] ✓ 0 cadenas EN residuales · i18n completo");
  } else {
    console.log(`[done] ⚠ ${totalEN} cadenas EN siguen visibles · revisar JS fallback o purgar caché`);
  }
}

main().catch((e) => { console.error("FATAL:", e); process.exit(99); });
