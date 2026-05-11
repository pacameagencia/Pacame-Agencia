// ============================================================
//  LA CALETA MANCHEGA · Carta v8 · Renderer print-to-PDF
//  Lee data.json → construye HTML → lanza Puppeteer → exporta PDF + screenshots
// ============================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
const cssFile = path.join(__dirname, "carta-v8.css");
const outDir = path.join(__dirname, "output");
const previewDir = path.join(outDir, "preview");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(previewDir, { recursive: true });

// ─── SVG SPRITE ─────────────────────────────────────────────
// Todos los iconos como <symbol> dentro de un único <svg defs>.
// Cada plato/sección referencia con <svg><use href="#id" /></svg>.
// Color heredado de CSS (stroke="currentColor" / fill="currentColor").

const SPRITE = `
<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">

  <!-- ═════════ SECCIONES ═════════ -->

  <symbol id="ic-vieira" viewBox="0 0 64 64">
    <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M32 12 C 18 14, 10 28, 12 44 L 32 50 L 52 44 C 54 28, 46 14, 32 12 Z"/>
      <path d="M32 12 L 32 50"/>
      <path d="M22 16 L 25 48"/>
      <path d="M28 13 L 29 50"/>
      <path d="M36 13 L 35 50"/>
      <path d="M42 16 L 39 48"/>
      <path d="M48 22 L 44 46"/>
      <path d="M16 22 L 20 46"/>
    </g>
  </symbol>

  <symbol id="ic-hoja" viewBox="0 0 64 64">
    <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 50 C 14 28, 30 12, 52 12 C 52 34, 36 50, 14 50 Z"/>
      <path d="M14 50 L 50 14"/>
      <path d="M22 42 L 32 42"/>
      <path d="M28 36 L 38 36"/>
      <path d="M34 30 L 42 30"/>
    </g>
  </symbol>

  <symbol id="ic-cubiertos" viewBox="0 0 64 64">
    <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <!-- tenedor -->
      <path d="M22 10 L 22 26"/>
      <path d="M18 10 L 18 22 L 22 22"/>
      <path d="M26 10 L 26 22 L 22 22"/>
      <path d="M22 26 L 22 54"/>
      <!-- cuchara -->
      <ellipse cx="44" cy="18" rx="6" ry="9"/>
      <path d="M44 27 L 44 54"/>
    </g>
  </symbol>

  <symbol id="ic-sarten" viewBox="0 0 64 64">
    <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 28 L 46 28 L 44 44 C 42 50, 32 52, 28 52 C 24 52, 14 50, 12 44 Z"/>
      <path d="M46 28 L 56 24"/>
      <circle cx="28" cy="36" r="6"/>
      <circle cx="28" cy="36" r="2.4" fill="currentColor"/>
    </g>
  </symbol>

  <symbol id="ic-espiga" viewBox="0 0 64 64">
    <g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M32 56 L 32 8"/>
      <path d="M32 14 C 26 14, 22 18, 22 24 C 28 24, 32 20, 32 14"/>
      <path d="M32 14 C 38 14, 42 18, 42 24 C 36 24, 32 20, 32 14"/>
      <path d="M32 22 C 26 22, 22 26, 22 32 C 28 32, 32 28, 32 22"/>
      <path d="M32 22 C 38 22, 42 26, 42 32 C 36 32, 32 28, 32 22"/>
      <path d="M32 30 C 26 30, 22 34, 22 40 C 28 40, 32 36, 32 30"/>
      <path d="M32 30 C 38 30, 42 34, 42 40 C 36 40, 32 36, 32 30"/>
      <path d="M32 38 C 26 38, 22 42, 22 48 C 28 48, 32 44, 32 38"/>
      <path d="M32 38 C 38 38, 42 42, 42 48 C 36 48, 32 44, 32 38"/>
    </g>
  </symbol>

  <symbol id="ic-cuchillo" viewBox="0 0 64 64">
    <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 38 L 40 14 L 44 18 L 14 44 Z"/>
      <path d="M44 18 L 56 30"/>
      <path d="M44 18 L 48 14"/>
      <rect x="44" y="40" width="14" height="6" rx="1.5"/>
    </g>
  </symbol>

  <symbol id="ic-copa" viewBox="0 0 64 64">
    <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 14 L 50 14 L 44 32 C 42 38, 38 40, 32 40 C 26 40, 22 38, 20 32 Z"/>
      <path d="M32 40 L 32 54"/>
      <path d="M22 54 L 42 54"/>
      <circle cx="32" cy="22" r="3"/>
      <circle cx="32" cy="22" r="3" fill="currentColor" opacity="0.4"/>
    </g>
  </symbol>

  <!-- Molino manchego (motivo recurrente) -->
  <symbol id="ic-molino" viewBox="0 0 64 64">
    <g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <!-- cuerpo -->
      <path d="M22 56 L 24 22 L 40 22 L 42 56 Z"/>
      <!-- tejado -->
      <path d="M22 22 L 32 14 L 42 22"/>
      <!-- puerta -->
      <rect x="29" y="44" width="6" height="12"/>
      <!-- ventana -->
      <rect x="29" y="30" width="6" height="6"/>
      <!-- aspas (cruz central) -->
      <line x1="32" y1="18" x2="32" y2="6"/>
      <line x1="32" y1="18" x2="44" y2="18"/>
      <line x1="32" y1="18" x2="32" y2="30" stroke-opacity="0"/>
      <line x1="32" y1="18" x2="20" y2="18"/>
      <!-- velas aspas -->
      <path d="M32 6 L 36 6 L 36 14 L 32 14"/>
      <path d="M44 18 L 44 22 L 36 22 L 36 18"/>
      <path d="M20 18 L 20 14 L 28 14 L 28 18"/>
      <path d="M32 14 L 28 14 L 28 6 L 32 6"/>
    </g>
  </symbol>

  <!-- Ornamento esquinero (florón + espiga estilizado) -->
  <symbol id="ic-corner" viewBox="0 0 64 64">
    <g fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round">
      <path d="M2 2 L 62 2"/>
      <path d="M2 2 L 2 62"/>
      <circle cx="10" cy="10" r="2.4"/>
      <path d="M14 10 L 30 10"/>
      <path d="M30 10 L 34 6"/>
      <path d="M30 10 L 34 14"/>
      <path d="M10 14 L 10 30"/>
      <path d="M10 30 L 6 34"/>
      <path d="M10 30 L 14 34"/>
      <!-- pequeños diamantes -->
      <path d="M22 8 L 22 12"/>
      <path d="M26 8 L 26 12"/>
      <path d="M8 22 L 12 22"/>
      <path d="M8 26 L 12 26"/>
    </g>
  </symbol>

  <!-- ═════════ ALÉRGENOS (Real Decreto 126/2015) ═════════ -->
  <!-- 14 pictogramas line-art, viewBox 32x32 -->

  <symbol id="al-gluten" viewBox="0 0 32 32">
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 28 L 16 4"/>
      <path d="M16 8 C 13 8, 11 10, 11 13 C 14 13, 16 11, 16 8"/>
      <path d="M16 8 C 19 8, 21 10, 21 13 C 18 13, 16 11, 16 8"/>
      <path d="M16 14 C 13 14, 11 16, 11 19 C 14 19, 16 17, 16 14"/>
      <path d="M16 14 C 19 14, 21 16, 21 19 C 18 19, 16 17, 16 14"/>
      <path d="M16 20 C 13 20, 11 22, 11 25 C 14 25, 16 23, 16 20"/>
      <path d="M16 20 C 19 20, 21 22, 21 25 C 18 25, 16 23, 16 20"/>
    </g>
  </symbol>

  <symbol id="al-crustaceos" viewBox="0 0 32 32">
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 16 C 6 11, 11 8, 16 8 C 21 8, 26 11, 26 16 C 26 21, 21 24, 16 24 C 11 24, 6 21, 6 16 Z" />
      <path d="M26 16 L 30 14"/>
      <path d="M26 17 L 30 19"/>
      <path d="M11 12 L 8 8"/>
      <path d="M16 10 L 16 6"/>
      <path d="M21 12 L 24 8"/>
      <circle cx="13" cy="15" r="0.9" fill="currentColor"/>
      <circle cx="19" cy="15" r="0.9" fill="currentColor"/>
      <path d="M12 18 Q 16 21 20 18"/>
    </g>
  </symbol>

  <symbol id="al-huevo" viewBox="0 0 32 32">
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 5 C 9 5, 6 14, 6 19 C 6 24, 11 28, 16 28 C 21 28, 26 24, 26 19 C 26 14, 23 5, 16 5 Z"/>
      <circle cx="16" cy="18" r="4" fill="currentColor" fill-opacity="0.25"/>
    </g>
  </symbol>

  <symbol id="al-pescado" viewBox="0 0 32 32">
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 16 C 8 8, 16 8, 22 16 C 16 24, 8 24, 4 16 Z"/>
      <path d="M22 16 L 28 10 L 28 22 Z"/>
      <circle cx="9" cy="15" r="0.9" fill="currentColor"/>
      <path d="M14 14 L 17 14"/>
      <path d="M14 18 L 17 18"/>
    </g>
  </symbol>

  <symbol id="al-cacahuete" viewBox="0 0 32 32">
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 6 C 6 6, 4 10, 6 13 C 7 14, 7 18, 6 19 C 4 22, 6 26, 10 26 C 13 26, 14 23, 16 22 C 18 23, 19 26, 22 26 C 26 26, 28 22, 26 19 C 25 18, 25 14, 26 13 C 28 10, 26 6, 22 6 C 19 6, 18 9, 16 10 C 14 9, 13 6, 10 6 Z"/>
      <path d="M11 12 L 13 14"/>
      <path d="M19 18 L 21 20"/>
    </g>
  </symbol>

  <symbol id="al-soja" viewBox="0 0 32 32">
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 24 C 6 18, 10 8, 18 6 C 24 5, 28 9, 26 14 C 24 20, 16 26, 8 24 Z"/>
      <circle cx="13" cy="18" r="1.8"/>
      <circle cx="18" cy="14" r="1.8"/>
      <circle cx="22" cy="10" r="1.4"/>
      <path d="M26 6 L 22 10"/>
    </g>
  </symbol>

  <symbol id="al-lacteos" viewBox="0 0 32 32">
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4 L 21 4 L 21 8 L 23 12 L 23 26 C 23 27, 22 28, 21 28 L 11 28 C 10 28, 9 27, 9 26 L 9 12 L 11 8 Z"/>
      <path d="M11 8 L 21 8"/>
      <path d="M11 14 L 21 14"/>
    </g>
  </symbol>

  <symbol id="al-frutos" viewBox="0 0 32 32">
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="16" cy="16" r="11"/>
      <path d="M16 5 C 13 9, 13 23, 16 27"/>
      <path d="M16 5 C 19 9, 19 23, 16 27"/>
      <path d="M5 16 C 9 13, 23 13, 27 16"/>
    </g>
  </symbol>

  <symbol id="al-apio" viewBox="0 0 32 32">
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 28 L 12 14"/>
      <path d="M16 28 L 16 12"/>
      <path d="M20 28 L 20 14"/>
      <path d="M8 14 C 10 8, 22 8, 24 14 Z"/>
      <path d="M16 12 L 14 8"/>
      <path d="M16 12 L 18 8"/>
      <path d="M16 12 L 16 6"/>
    </g>
  </symbol>

  <symbol id="al-mostaza" viewBox="0 0 32 32">
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13 4 L 19 4 L 19 8 L 22 11 L 22 27 C 22 28, 21 28, 20 28 L 12 28 C 11 28, 10 28, 10 27 L 10 11 L 13 8 Z"/>
      <path d="M13 8 L 19 8"/>
      <text x="16" y="22" text-anchor="middle" font-family="Inter,Arial" font-size="6" font-weight="700" fill="currentColor" stroke="none">M</text>
    </g>
  </symbol>

  <symbol id="al-sesamo" viewBox="0 0 32 32">
    <g fill="currentColor" stroke="none">
      <ellipse cx="10" cy="10" rx="2.6" ry="3.6"/>
      <ellipse cx="22" cy="10" rx="2.6" ry="3.6"/>
      <ellipse cx="10" cy="22" rx="2.6" ry="3.6"/>
      <ellipse cx="22" cy="22" rx="2.6" ry="3.6"/>
      <ellipse cx="16" cy="16" rx="2.6" ry="3.6"/>
    </g>
  </symbol>

  <symbol id="al-sulfitos" viewBox="0 0 32 32">
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="14" r="3"/>
      <circle cx="18" cy="12" r="3"/>
      <circle cx="20" cy="18" r="3"/>
      <circle cx="14" cy="20" r="3"/>
      <path d="M14 8 L 16 4 L 18 4"/>
      <path d="M16 4 L 20 6"/>
    </g>
  </symbol>

  <symbol id="al-altramuces" viewBox="0 0 32 32">
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="12" r="3.4"/>
      <circle cx="20" cy="11" r="3.4"/>
      <circle cx="22" cy="20" r="3.4"/>
      <circle cx="12" cy="21" r="3.4"/>
      <path d="M11 12 L 11 9.5"/>
      <path d="M20 11 L 20 8.5"/>
    </g>
  </symbol>

  <symbol id="al-moluscos" viewBox="0 0 32 32">
    <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 22 C 22 14, 16 10, 12 10 C 8 10, 6 12, 6 16 C 6 19, 8 21, 11 21 C 13 21, 14 19, 14 17 C 14 15, 12 14, 11 14"/>
      <path d="M22 22 L 26 22"/>
      <path d="M22 24 L 18 26"/>
      <path d="M22 24 L 24 28"/>
    </g>
  </symbol>

</svg>
`;

// ─── HELPERS ────────────────────────────────────────────────

const ALER_LABEL = data.alergenos;

const aIcon = (id) => `<svg class="a-icon"><use href="#al-${id}"/></svg>`;
const sIcon = (id) => `<svg class="s-icon"><use href="#ic-${id}"/></svg>`;

function priceHTML(p) {
  return `<span class="dish-price">${p.precio}<span class="euro">€</span>${
    p.media ? `<span class="media">½ ${p.media}</span>` : ""
  }</span>`;
}

function badgeHTML(b) {
  if (!b) return "";
  if (b === "NUEVO") return `<span class="dish-badge nuevo">Nuevo</span>`;
  if (b === "FAVORITO") return `<span class="dish-badge favorito">Favorito</span>`;
  return "";
}

function alergenosHTML(arr = []) {
  if (!arr.length) return "";
  return `<div class="dish-aler">${arr.map(aIcon).join("")}</div>`;
}

function dishHTML(p) {
  return `
    <div class="dish">
      <div class="dish-head">
        <span class="dish-name">${p.nombre}</span>
        ${badgeHTML(p.badge)}
        <span class="dish-leader"></span>
        ${priceHTML(p)}
      </div>
      <div class="dish-desc">${p.descripcion}</div>
      ${alergenosHTML(p.alergenos)}
    </div>
  `;
}

function groupHTML(g) {
  return `
    <div class="group">
      ${g.nombre ? `<div class="group-label">${g.nombre}</div>` : ""}
      ${g.descripcion ? `<span class="group-desc">${g.descripcion}</span>` : ""}
      ${g.platos.map(dishHTML).join("")}
    </div>
  `;
}

function sectionHTML(s) {
  // dense: un único grupo con muchos platos (Picoteo) → grid 3 columnas
  const totalPlatos = s.grupos.reduce((n, g) => n + g.platos.length, 0);
  const dense = s.grupos.length === 1 && totalPlatos >= 10 ? " dense" : "";
  return `
    <section class="section${dense}">
      <header class="section-head">
        <div class="s-rule"><div class="line"></div><div class="diamond"></div><div class="line"></div></div>
        ${sIcon(s.icono)}
        <h2>${s.nombre}</h2>
        ${s.tagline ? `<div class="s-tag">${s.tagline}</div>` : ""}
      </header>
      <div class="cols">
        ${s.grupos.map(groupHTML).join("")}
      </div>
    </section>
  `;
}

function alergenosBoxHTML() {
  const items = Object.entries(ALER_LABEL)
    .map(([id, label]) => `<div class="leg"><svg class="a-icon"><use href="#al-${id}"/></svg><span>${label}</span></div>`)
    .join("");
  return `
    <div class="alergenos-box">
      <div class="alergenos-box-title">Leyenda de alérgenos</div>
      <div class="alergenos-box-grid">${items}</div>
      <div class="alergenos-box-note">Si tienes alguna alergia o intolerancia, infórmanos.</div>
    </div>
  `;
}

function pageHTML({ idx, total, romano, secciones, closing = false }) {
  return `
  <article class="page">
    <div class="corner tl"><svg viewBox="0 0 64 64" style="width:100%;height:100%"><use href="#ic-corner"/></svg></div>
    <div class="corner tr"><svg viewBox="0 0 64 64" style="width:100%;height:100%"><use href="#ic-corner"/></svg></div>
    <div class="corner bl"><svg viewBox="0 0 64 64" style="width:100%;height:100%"><use href="#ic-corner"/></svg></div>
    <div class="corner br"><svg viewBox="0 0 64 64" style="width:100%;height:100%"><use href="#ic-corner"/></svg></div>

    <header class="header">
      <span class="h-brand">LA CALETA MANCHEGA</span>
      <span class="h-folio">
        <span>Capítulo ${romano}</span>
        <svg class="h-molino"><use href="#ic-molino"/></svg>
      </span>
    </header>

    ${secciones.map(sectionHTML).join("")}

    ${closing ? `
    ${alergenosBoxHTML()}
    <div class="closing">
      <svg class="c-molino"><use href="#ic-molino"/></svg>
      <div class="c-text">
        <div class="c-name">${data.marca.nombre}</div>
        <div class="c-dir">${data.marca.direccion}</div>
      </div>
    </div>` : ""}

    <footer class="footer">
      <div class="footer-meta">
        <span>${closing ? "IVA incluido · Producto de calidad seleccionado" : "La Caleta Manchega · Gastrobar · Albacete"}</span>
        <span class="folio">${romanFor(idx)} / ${romanFor(total)}</span>
      </div>
    </footer>

    <svg class="watermark"><use href="#ic-molino"/></svg>
  </article>
  `;
}

function romanFor(n) {
  const map = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  return map[n] || String(n);
}

// ─── DISTRIBUCIÓN DE SECCIONES POR PÁGINA ───────────────────
// Decisión editorial v9.1 (4 páginas A4, márgenes apretados, leyenda alérgenos
// en cajita única al final, no en cada página):
//   Página 1 (I)   → Entrantes con historia + Verde que te quiero verde
//   Página 2 (II)  → Picoteo con encanto (página estrella, 13 platos en 2 col)
//   Página 3 (III) → Huevos rotos & canelones + Al pan
//   Página 4 (IV)  → Para terminar así + Final feliz + cajita alérgenos + cierre
const find = (id) => data.secciones.find((s) => s.id === id);
const PAGES = [
  { romano: "I",   secciones: [find("entrantes"), find("ensaladas")] },
  { romano: "II",  secciones: [find("picoteo")] },
  { romano: "III", secciones: [find("huevos-canelones"), find("al-pan")] },
  { romano: "IV",  secciones: [find("para-terminar"), find("final-feliz")], closing: true },
];

// ─── HTML COMPLETO ──────────────────────────────────────────

const css = fs.readFileSync(cssFile, "utf8");

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>La Caleta Manchega · Carta v8</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
  ${SPRITE}
  ${PAGES.map((p, i) => pageHTML({ idx: i + 1, total: PAGES.length, ...p })).join("\n")}
</body>
</html>`;

const htmlOut = path.join(__dirname, "carta-v8.html");
fs.writeFileSync(htmlOut, html, "utf8");
console.log("[OK] HTML escrito en", htmlOut);

// ─── PUPPETEER (Chrome del sistema) ─────────────────────────

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];

const executablePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error("[FATAL] No se encontró Chrome ni Edge en el sistema. Instala uno o ajusta CHROME_CANDIDATES.");
  process.exit(1);
}
console.log("[OK] Browser:", executablePath);

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
const url = "file:///" + htmlOut.replaceAll("\\", "/");
console.log("[..] Navegando a", url);
await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200)); // assets fonts

// PDF
const pdfPath = path.join(outDir, "Carta_La_Caleta_v8.pdf");
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});
console.log("[OK] PDF generado:", pdfPath);

// Screenshots preview por página
await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 }); // A4 @ 96dpi
const pageHandles = await page.$$(".page");
for (let i = 0; i < pageHandles.length; i++) {
  const out = path.join(previewDir, `page-${i + 1}.png`);
  await pageHandles[i].screenshot({ path: out, omitBackground: false });
  console.log("[OK] Preview:", out);
}

await browser.close();
console.log("[DONE] Render completo. Archivos en", outDir);
