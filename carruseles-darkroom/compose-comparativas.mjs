#!/usr/bin/env node
/**
 * Pack 3 · 3 comparativas rellenables 1080×1350.
 * - CMP01-factura: ticket de caja con suscripciones tachadas + Dark Room.
 * - CMP02-2col: comparativa 2 columnas Antes/Ahora.
 * - CMP03-lista: checklist suscripciones canceladas vs Dark Room ✓.
 * Cada una en 2 versiones: vacía (rellenable) + ejemplo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import opentype from "opentype.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, "fonts");
const OUT_DIR = path.join(__dirname, "ugc-kit", "pack-3-comparativas");
fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 1080;
const H = 1350;
const PAD = 80;

const C = {
  bg: "#0A0A0A",
  acid: "#CFFF00",
  red: "#FF3B3B",
  white: "#F2F2F2",
  ghost: "#8E8E8E",
  gray: "#4A4A4A",
  line: "#1E1E1E",
  fill: "#0F0F0F",
  empty: "#3A3A3A",
};

const FONTS = {
  anton: opentype.loadSync(path.join(FONTS_DIR, "Anton-Regular.ttf")),
  sgB: opentype.loadSync(path.join(FONTS_DIR, "SpaceGrotesk-Bold.ttf")),
  sgM: opentype.loadSync(path.join(FONTS_DIR, "SpaceGrotesk-Medium.ttf")),
  jbmR: opentype.loadSync(path.join(FONTS_DIR, "JetBrainsMono-Regular.ttf")),
  jbmB: opentype.loadSync(path.join(FONTS_DIR, "JetBrainsMono-Bold.ttf")),
};

function tp({ text, font, size, x, y, fill, anchor = "start", strike = false }) {
  if (!text) return "";
  let drawX = x;
  const w = font.getAdvanceWidth(text, size);
  if (anchor === "end") drawX = x - w;
  else if (anchor === "middle") drawX = x - w / 2;
  let s = font.getPath(text, drawX, y, size).toSVG(2).replace(/<path /, `<path fill="${fill}" `);
  if (strike) {
    const sy = y - size * 0.28;
    s += `<line x1="${drawX - size * 0.05}" y1="${sy}" x2="${drawX + w + size * 0.05}" y2="${sy}" stroke="${fill}" stroke-width="${Math.max(3, size * 0.08)}"/>`;
  }
  return s;
}

function svgWrap(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="0" y="0" width="${W}" height="${H}" fill="${C.bg}"/>
  ${inner}
</svg>`;
}

function brandMark(y = 90) {
  return tp({ text: "DARK ROOM", font: FONTS.anton, size: 28, x: W - PAD, y, fill: C.acid, anchor: "end" });
}

function handle(y = H - 60) {
  return tp({ text: "darkroomcreative.cloud · Link en bio", font: FONTS.jbmR, size: 22, x: PAD, y, fill: C.ghost });
}

// ── CMP01 · Factura tipo ticket de caja ──
function cmp01({ filled }) {
  const items = [
    ["ChatGPT Plus", "20.00"],
    ["Claude Pro", "18.00"],
    ["Gemini Advanced", "22.00"],
    ["Canva Pro", "12.00"],
    ["CapCut Pro", "8.00"],
    ["Freepik Premium+", "12.00"],
    ["Higgsfield", "15.00"],
    ["ElevenLabs", "22.00"],
    ["Minea", "49.00"],
    ["Dropsip.io", "30.00"],
    ["PiPiAds", "70.00"],
    ["Seedance", "30.00"],
  ];
  const ticketX = 130;
  const ticketY = 220;
  const ticketW = W - 260;
  const ticketH = 880;
  const total = filled ? "308.00 €" : "___ . __ €";

  const rows = items.map((it, i) => {
    const y = ticketY + 220 + i * 42;
    return `
      ${tp({ text: it[0], font: FONTS.jbmR, size: 22, x: ticketX + 30, y, fill: C.bg })}
      ${tp({ text: it[1] + " €", font: FONTS.jbmB, size: 22, x: ticketX + ticketW - 30, y, fill: C.red, anchor: "end", strike: true })}
    `;
  }).join("\n");

  return svgWrap(`
    ${brandMark()}
    ${tp({ text: "MI FACTURA IA", font: FONTS.anton, size: 76, x: PAD, y: 180, fill: C.white })}
    <!-- ticket simulado -->
    <rect x="${ticketX}" y="${ticketY}" width="${ticketW}" height="${ticketH}" fill="${C.white}"/>
    <!-- borde dentado superior -->
    ${Array.from({ length: 22 }, (_, i) => `<polygon points="${ticketX + i * (ticketW / 22)},${ticketY} ${ticketX + (i + 0.5) * (ticketW / 22)},${ticketY - 18} ${ticketX + (i + 1) * (ticketW / 22)},${ticketY}" fill="${C.white}"/>`).join("")}
    <!-- borde dentado inferior -->
    ${Array.from({ length: 22 }, (_, i) => `<polygon points="${ticketX + i * (ticketW / 22)},${ticketY + ticketH} ${ticketX + (i + 0.5) * (ticketW / 22)},${ticketY + ticketH + 18} ${ticketX + (i + 1) * (ticketW / 22)},${ticketY + ticketH}" fill="${C.white}"/>`).join("")}
    <!-- header del ticket -->
    ${tp({ text: "SUSCRIPCIONES IA · ABRIL 2026", font: FONTS.sgB, size: 22, x: ticketX + ticketW / 2, y: ticketY + 60, fill: "#1a1a1a", anchor: "middle" })}
    ${tp({ text: "─────────────────────────────", font: FONTS.jbmR, size: 18, x: ticketX + ticketW / 2, y: ticketY + 100, fill: "#666", anchor: "middle" })}
    <line x1="${ticketX + 30}" y1="${ticketY + 130}" x2="${ticketX + ticketW - 30}" y2="${ticketY + 130}" stroke="#999" stroke-width="1"/>
    ${tp({ text: "Concepto", font: FONTS.jbmB, size: 20, x: ticketX + 30, y: ticketY + 170, fill: "#1a1a1a" })}
    ${tp({ text: "Importe", font: FONTS.jbmB, size: 20, x: ticketX + ticketW - 30, y: ticketY + 170, fill: "#1a1a1a", anchor: "end" })}
    <line x1="${ticketX + 30}" y1="${ticketY + 190}" x2="${ticketX + ticketW - 30}" y2="${ticketY + 190}" stroke="#000" stroke-width="2"/>
    ${rows}
    <!-- total -->
    <line x1="${ticketX + 30}" y1="${ticketY + ticketH - 130}" x2="${ticketX + ticketW - 30}" y2="${ticketY + ticketH - 130}" stroke="#000" stroke-width="2"/>
    ${tp({ text: "TOTAL/MES", font: FONTS.sgB, size: 26, x: ticketX + 30, y: ticketY + ticketH - 80, fill: "#1a1a1a" })}
    ${tp({ text: total, font: FONTS.jbmB, size: 32, x: ticketX + ticketW - 30, y: ticketY + ticketH - 80, fill: C.red, anchor: "end" })}
    ${tp({ text: filled ? "× 12 = 3.696 € / año" : "× 12 = ___ € / año", font: FONTS.jbmR, size: 18, x: ticketX + ticketW - 30, y: ticketY + ticketH - 50, fill: "#666", anchor: "end" })}
    <!-- alternativa Dark Room debajo del ticket -->
    ${tp({ text: "→ DARK ROOM:", font: FONTS.sgB, size: 32, x: PAD, y: 1170, fill: C.acid, letterSpacing: 3 })}
    ${tp({ text: "24,90 €/mes · 349 € lifetime", font: FONTS.anton, size: 50, x: PAD, y: 1230, fill: C.white })}
    ${handle()}
  `);
}

// ── CMP02 · Comparativa 2 columnas ──
function cmp02({ filled }) {
  const colW = (W - 2 * PAD - 40) / 2;
  return svgWrap(`
    ${brandMark()}
    ${tp({ text: "ANTES vs AHORA", font: FONTS.anton, size: 76, x: PAD, y: 200, fill: C.white })}
    ${tp({ text: "MI FACTURA IA EN 60 SEGUNDOS", font: FONTS.sgB, size: 22, x: PAD, y: 248, fill: C.ghost, letterSpacing: 4 })}
    <!-- col antes -->
    <rect x="${PAD}" y="320" width="${colW}" height="800" fill="${C.fill}" stroke="${C.line}" stroke-width="2" rx="8"/>
    ${tp({ text: "ANTES", font: FONTS.anton, size: 84, x: PAD + colW / 2, y: 420, fill: C.red, anchor: "middle" })}
    ${tp({ text: "(sin Dark Room)", font: FONTS.sgM, size: 22, x: PAD + colW / 2, y: 460, fill: C.ghost, anchor: "middle" })}
    ${tp({ text: filled ? "312 €" : "___ €", font: FONTS.anton, size: 130, x: PAD + colW / 2, y: 650, fill: C.red, anchor: "middle" })}
    ${tp({ text: "AL MES", font: FONTS.sgB, size: 26, x: PAD + colW / 2, y: 700, fill: C.white, anchor: "middle", letterSpacing: 3 })}
    <line x1="${PAD + 40}" y1="760" x2="${PAD + colW - 40}" y2="760" stroke="${C.gray}" stroke-width="1"/>
    ${[
      "12 cuentas distintas",
      "12 facturas",
      "12 contraseñas",
      "Dolor de cabeza",
    ].map((t, i) => tp({ text: `· ${t}`, font: FONTS.sgM, size: 24, x: PAD + 40, y: 820 + i * 50, fill: C.white })).join("\n")}
    <!-- col ahora -->
    <rect x="${PAD + colW + 40}" y="320" width="${colW}" height="800" fill="${C.fill}" stroke="${C.acid}" stroke-width="3" rx="8"/>
    ${tp({ text: "AHORA", font: FONTS.anton, size: 84, x: PAD + colW + 40 + colW / 2, y: 420, fill: C.acid, anchor: "middle" })}
    ${tp({ text: "(con Dark Room)", font: FONTS.sgM, size: 22, x: PAD + colW + 40 + colW / 2, y: 460, fill: C.ghost, anchor: "middle" })}
    ${tp({ text: "24,90 €", font: FONTS.anton, size: 110, x: PAD + colW + 40 + colW / 2, y: 650, fill: C.acid, anchor: "middle" })}
    ${tp({ text: "AL MES", font: FONTS.sgB, size: 26, x: PAD + colW + 40 + colW / 2, y: 700, fill: C.white, anchor: "middle", letterSpacing: 3 })}
    <line x1="${PAD + colW + 40 + 40}" y1="760" x2="${PAD + colW + 40 + colW - 40}" y2="760" stroke="${C.gray}" stroke-width="1"/>
    ${[
      "Una cuenta",
      "Una factura",
      "Un acceso",
      "Mismo software",
    ].map((t, i) => tp({ text: `· ${t}`, font: FONTS.sgM, size: 24, x: PAD + colW + 40 + 40, y: 820 + i * 50, fill: C.white })).join("\n")}
    <!-- ahorro -->
    ${tp({ text: "AHORRO MENSUAL", font: FONTS.sgB, size: 24, x: W / 2, y: 1190, fill: C.ghost, anchor: "middle", letterSpacing: 4 })}
    ${tp({ text: filled ? "−287 €/mes" : "−___ €/mes", font: FONTS.anton, size: 90, x: W / 2, y: 1280, fill: C.acid, anchor: "middle" })}
    ${handle()}
  `);
}

// ── CMP03 · Checklist canceladas ──
function cmp03({ filled }) {
  const items = [
    "ChatGPT Plus",
    "Claude Pro",
    "Gemini Advanced",
    "Canva Pro",
    "CapCut Pro",
    "Freepik Premium+",
    "Higgsfield",
    "ElevenLabs",
    "Minea",
    "Dropsip.io",
    "PiPiAds",
  ];
  const startY = 280;

  const rows = items.map((it, i) => {
    const y = startY + i * 60;
    return `
      <rect x="${PAD}" y="${y - 26}" width="36" height="36" rx="6" fill="none" stroke="${C.gray}" stroke-width="2"/>
      <path d="M ${PAD + 7} ${y - 8} l 8 8 l 18 -18" stroke="${C.red}" stroke-width="3" fill="none"/>
      ${tp({ text: it, font: FONTS.sgM, size: 30, x: PAD + 60, y, fill: C.ghost, strike: true })}
      ${tp({ text: "CANCELADO", font: FONTS.jbmB, size: 18, x: W - PAD, y, fill: C.red, anchor: "end", letterSpacing: 2 })}
    `;
  }).join("\n");

  return svgWrap(`
    ${brandMark()}
    ${tp({ text: "MI LIMPIEZA DE", font: FONTS.anton, size: 60, x: PAD, y: 180, fill: C.white })}
    ${tp({ text: "SUSCRIPCIONES.", font: FONTS.anton, size: 60, x: PAD, y: 240, fill: C.acid })}
    ${rows}
    <!-- Dark Room marcado -->
    <rect x="${PAD}" y="${startY + items.length * 60 + 10}" width="${W - 2 * PAD}" height="120" fill="${C.fill}" stroke="${C.acid}" stroke-width="3" rx="8"/>
    <rect x="${PAD + 24}" y="${startY + items.length * 60 + 50}" width="36" height="36" rx="6" fill="${C.acid}"/>
    <path d="M ${PAD + 31} ${startY + items.length * 60 + 68} l 8 8 l 18 -18" stroke="${C.bg}" stroke-width="3" fill="none"/>
    ${tp({ text: "Dark Room · 24,90 €/mes", font: FONTS.sgB, size: 30, x: PAD + 80, y: startY + items.length * 60 + 76, fill: C.acid })}
    ${tp({ text: "ACTIVO", font: FONTS.jbmB, size: 18, x: W - PAD - 24, y: startY + items.length * 60 + 76, fill: C.acid, anchor: "end", letterSpacing: 2 })}
    ${tp({ text: filled ? "Total ahorro: 287 €/mes" : "Total ahorro: ___ €/mes", font: FONTS.sgM, size: 26, x: PAD, y: H - 130, fill: C.white })}
    ${handle()}
  `);
}

const TEMPLATES = [
  { id: "CMP01-factura", fn: cmp01 },
  { id: "CMP02-2col", fn: cmp02 },
  { id: "CMP03-lista", fn: cmp03 },
];

async function render(svg, outPath) {
  const bg = await sharp({ create: { width: W, height: H, channels: 3, background: C.bg } }).png().toBuffer();
  const out = await sharp(bg).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png({ quality: 95, compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(outPath, out);
}

async function main() {
  console.log(`Pack 3 · Comparativas · ${TEMPLATES.length} × 2 = ${TEMPLATES.length * 2} PNGs\n`);
  let ok = 0;
  for (const t of TEMPLATES) {
    for (const filled of [false, true]) {
      const suffix = filled ? "ejemplo" : "vacio";
      const outPath = path.join(OUT_DIR, `${t.id}-${suffix}.png`);
      process.stdout.write(`→ ${t.id}-${suffix} ... `);
      try {
        const svg = t.fn({ filled });
        await render(svg, outPath);
        const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
        console.log(`ok (${kb} KB)`);
        ok++;
      } catch (err) {
        console.log(`FAIL ${err.message.slice(0, 200)}`);
      }
    }
  }
  console.log(`\nDone: ${ok}/${TEMPLATES.length * 2}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
