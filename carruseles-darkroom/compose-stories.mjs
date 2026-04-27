#!/usr/bin/env node
/**
 * Pack 1 · Dark Room UGC Kit · 10 Stories templates 1080×1920
 * Cada template en 2 versiones: vacío (para rellenar) + ejemplo (con datos demo).
 *
 * Reutiliza opentype.js + Sharp del composer principal.
 * Output: ugc-kit/pack-1-stories/{ID}-vacio.png + {ID}-ejemplo.png
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import opentype from "opentype.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, "fonts");
const OUT_DIR = path.join(__dirname, "ugc-kit", "pack-1-stories");
fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 1080;
const H = 1920;
// IG Story safe areas (ver IG-SAFE-AREAS.md)
// Top 250px y Bottom 250px reservados para UI de IG (progress bar + responder)
const TOP_UNSAFE = 250;
const BOT_UNSAFE = 250;
const MARGIN_X = 80;
const PAD = MARGIN_X;
const SAFE_Y = TOP_UNSAFE;
const SAFE_H_BOTTOM = H - BOT_UNSAFE;  // y máxima para texto = 1670

const C = {
  bg: "#0A0A0A",
  acid: "#CFFF00",
  red: "#FF3B3B",
  white: "#F2F2F2",
  ghost: "#8E8E8E",
  gray: "#4A4A4A",
  line: "#1E1E1E",
  fill: "#0F0F0F",
  emptyDash: "#3A3A3A",
};

const FONTS = {
  anton: opentype.loadSync(path.join(FONTS_DIR, "Anton-Regular.ttf")),
  sgB: opentype.loadSync(path.join(FONTS_DIR, "SpaceGrotesk-Bold.ttf")),
  sgM: opentype.loadSync(path.join(FONTS_DIR, "SpaceGrotesk-Medium.ttf")),
  jbmR: opentype.loadSync(path.join(FONTS_DIR, "JetBrainsMono-Regular.ttf")),
  jbmB: opentype.loadSync(path.join(FONTS_DIR, "JetBrainsMono-Bold.ttf")),
};

// ── Text → SVG path helpers (idénticos al composer principal) ──
function textPath({ text, font, size, x, y, fill = "#fff", anchor = "start", strike = false, letterSpacing = 0 }) {
  if (!text) return "";
  let drawX = x;
  let paths = "";
  let totalW = 0;
  if (letterSpacing === 0) {
    totalW = font.getAdvanceWidth(text, size);
    if (anchor === "end") drawX = x - totalW;
    else if (anchor === "middle") drawX = x - totalW / 2;
    paths = font.getPath(text, drawX, y, size).toSVG(2).replace(/<path /, `<path fill="${fill}" `);
  } else {
    const widths = [...text].map((ch) => font.getAdvanceWidth(ch, size));
    totalW = widths.reduce((a, b) => a + b, 0) + letterSpacing * Math.max(0, text.length - 1);
    if (anchor === "end") drawX = x - totalW;
    else if (anchor === "middle") drawX = x - totalW / 2;
    let cur = drawX;
    [...text].forEach((ch, i) => {
      paths += font.getPath(ch, cur, y, size).toSVG(2).replace(/<path /, `<path fill="${fill}" `);
      cur += widths[i] + letterSpacing;
    });
  }
  if (strike) {
    const sy = y - size * 0.28;
    paths += `<line x1="${drawX - size * 0.05}" y1="${sy}" x2="${drawX + totalW + size * 0.05}" y2="${sy}" stroke="${fill}" stroke-width="${Math.max(3, size * 0.08)}"/>`;
  }
  return paths;
}

function multilinePath({ lines, font, size, x, y, fill, anchor = "start", lineHeight = 1.12 }) {
  return lines.map((l, i) => textPath({ text: l, font, size, x, y: y + i * size * lineHeight, fill, anchor })).join("\n");
}

function fitSize(font, text, maxW, startSize, minSize = 30, step = 4) {
  let s = startSize;
  while (font.getAdvanceWidth(text, s) > maxW && s > minSize) s -= step;
  return s;
}

function svgWrap(inner, defs = "") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${defs}</defs>
  ${inner}
</svg>`;
}

function brandMark(y = 90) {
  return textPath({
    text: "DARK ROOM",
    font: FONTS.anton,
    size: 28,
    x: W - PAD,
    y,
    fill: C.acid,
    anchor: "end",
    letterSpacing: 6,
  });
}

function handle(y = H - 60) {
  return textPath({
    text: "darkroomcreative.cloud",
    font: FONTS.jbmR,
    size: 22,
    x: PAD,
    y,
    fill: C.ghost,
  });
}

// Empty rectangle with dashed border (zona rellenable)
function emptyZone({ x, y, w, h, label, labelSize = 32 }) {
  const lblY = y + h / 2 + labelSize * 0.35;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${C.emptyDash}" stroke-width="3" stroke-dasharray="14 10" rx="8"/>
    ${textPath({
      text: label,
      font: FONTS.sgM,
      size: labelSize,
      x: x + w / 2,
      y: lblY,
      fill: C.gray,
      anchor: "middle",
    })}
  `;
}

// ── Templates (10) ──

const TOOLS_12 = ["CHATGPT", "CLAUDE", "GEMINI", "CANVA", "CAPCUT", "FREEPIK+", "HIGGSFIELD", "ELEVENLABS", "MINEA", "DROPSIP", "PIPIADS", "SEEDANCE"];

function gridTools12({ y = 760, h = 600 }) {
  const cols = 3, rows = 4;
  const cellW = (W - 2 * PAD) / cols;
  const cellH = h / rows;
  return TOOLS_12.map((t, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = PAD + c * cellW;
    const yy = y + r * cellH;
    return `
      <rect x="${x + 8}" y="${yy + 8}" width="${cellW - 16}" height="${cellH - 16}" fill="${C.fill}" stroke="${C.line}" stroke-width="1" rx="4"/>
      ${textPath({ text: t, font: FONTS.sgB, size: 22, x: x + cellW / 2, y: yy + cellH / 2 + 8, fill: C.acid, anchor: "middle" })}
    `;
  }).join("\n");
}

// ID 01 · "MI STACK IA 2026 = 24,90€"
function tpl01({ filled = false }) {
  return svgWrap(`
    ${brandMark()}
    ${textPath({ text: "MI STACK IA 2026", font: FONTS.anton, size: 96, x: PAD, y: 320, fill: C.white })}
    <rect x="${PAD}" y="370" width="160" height="8" fill="${C.acid}"/>
    ${textPath({ text: "= 24,90 €/mes", font: FONTS.anton, size: 130, x: PAD, y: 540, fill: C.acid })}
    ${textPath({ text: "Las 12 herramientas que uso TODOS los días.", font: FONTS.sgM, size: 32, x: PAD, y: 640, fill: C.white })}
    ${gridTools12({ y: 760, h: 600 })}
    ${textPath({ text: filled ? "@tu_handle" : "@tu_handle aquí", font: FONTS.jbmR, size: 28, x: PAD, y: H - 240, fill: C.ghost })}
    ${textPath({ text: "Link en bio", font: FONTS.sgB, size: 32, x: PAD, y: H - 180, fill: C.acid, letterSpacing: 4 })}
    ${handle()}
  `);
}

// ID 02 · "Antes pagaba ___ · Ahora 24,90€"
function tpl02({ filled = false }) {
  const anteVal = filled ? "312 €" : "___ €";
  return svgWrap(`
    ${brandMark()}
    ${textPath({ text: "ANTES PAGABA", font: FONTS.sgB, size: 38, x: PAD, y: 360, fill: C.ghost, letterSpacing: 4 })}
    ${textPath({ text: anteVal, font: FONTS.anton, size: 220, x: PAD, y: 600, fill: C.red, strike: true })}
    ${textPath({ text: "AL MES", font: FONTS.sgB, size: 36, x: PAD, y: 680, fill: C.white, letterSpacing: 3 })}
    <line x1="${PAD}" y1="800" x2="${W - PAD}" y2="800" stroke="${C.gray}" stroke-width="2"/>
    ${textPath({ text: "AHORA PAGO", font: FONTS.sgB, size: 38, x: PAD, y: 920, fill: C.acid, letterSpacing: 4 })}
    ${textPath({ text: "24,90 €", font: FONTS.anton, size: 280, x: PAD, y: 1230, fill: C.acid })}
    ${textPath({ text: "AL MES", font: FONTS.sgB, size: 36, x: PAD, y: 1310, fill: C.white, letterSpacing: 3 })}
    ${textPath({ text: "Mismo acceso. 12 herramientas. Dark Room.", font: FONTS.sgM, size: 30, x: PAD, y: 1480, fill: C.white })}
    ${textPath({ text: filled ? "Llevo 3 meses." : "[escribe tu testimonio]", font: FONTS.sgM, size: 28, x: PAD, y: 1540, fill: C.ghost })}
    ${textPath({ text: "Link en bio →", font: FONTS.sgB, size: 32, x: PAD, y: H - 200, fill: C.acid, letterSpacing: 3 })}
    ${handle()}
  `);
}

// ID 03 · "POV: Acabo de descubrir Dark Room"
function tpl03({ filled = false }) {
  return svgWrap(`
    ${brandMark()}
    ${textPath({ text: "POV:", font: FONTS.anton, size: 200, x: PAD, y: 460, fill: C.acid })}
    ${multilinePath({ lines: ["ACABO DE", "DESCUBRIR", "DARK ROOM."], font: FONTS.anton, size: 130, x: PAD, y: 700, fill: C.white })}
    <rect x="${PAD}" y="${1180}" width="160" height="8" fill="${C.acid}"/>
    ${multilinePath({
      lines: [
        "12 herramientas IA premium.",
        "24,90 €/mes. O 349 € lifetime.",
        "Llevo 30 minutos sin cerrar pestaña.",
      ],
      font: FONTS.sgM,
      size: 32,
      x: PAD,
      y: 1260,
      fill: C.white,
      lineHeight: 1.4,
    })}
    ${textPath({ text: filled ? "Y todavía no he probado ni la mitad." : "[añade tu reacción]", font: FONTS.sgM, size: 30, x: PAD, y: 1500, fill: C.ghost })}
    ${textPath({ text: "Link en bio", font: FONTS.sgB, size: 32, x: PAD, y: H - 180, fill: C.acid, letterSpacing: 4 })}
    ${handle()}
  `);
}

// ID 04 · "Pregúntame por qué uso Dark Room"
function tpl04({ filled = false }) {
  return svgWrap(`
    ${brandMark()}
    ${textPath({ text: "PREGÚNTAME", font: FONTS.anton, size: 130, x: PAD, y: 460, fill: C.white })}
    ${textPath({ text: "POR QUÉ USO", font: FONTS.anton, size: 130, x: PAD, y: 600, fill: C.white })}
    ${textPath({ text: "DARK ROOM.", font: FONTS.anton, size: 130, x: PAD, y: 740, fill: C.acid })}
    <rect x="${PAD}" y="850" width="200" height="8" fill="${C.acid}"/>
    ${multilinePath({
      lines: [
        "Pista: pago menos de un café",
        "al día por las 12 herramientas",
        "que antes me costaban 308 €.",
      ],
      font: FONTS.sgM,
      size: 36,
      x: PAD,
      y: 970,
      fill: C.white,
      lineHeight: 1.35,
    })}
    ${emptyZone({
      x: PAD,
      y: 1280,
      w: W - 2 * PAD,
      h: 360,
      label: filled ? "PREGÚNTAME EN DM" : "[añade un sticker de pregunta IG aquí]",
      labelSize: filled ? 56 : 30,
    })}
    ${textPath({ text: "Te respondo todas.", font: FONTS.sgB, size: 32, x: PAD, y: H - 200, fill: C.acid })}
    ${handle()}
  `);
}

// ID 05 · "Lo que pagaba en 2025 vs 2026" — 2 columnas
function tpl05({ filled = false }) {
  const colW = (W - 2 * PAD - 40) / 2;
  return svgWrap(`
    ${brandMark()}
    ${textPath({ text: "2025 vs 2026", font: FONTS.anton, size: 110, x: PAD, y: 360, fill: C.white })}
    ${textPath({ text: "MI FACTURA IA, ANTES Y DESPUÉS", font: FONTS.sgB, size: 28, x: PAD, y: 420, fill: C.ghost, letterSpacing: 3 })}
    <rect x="${PAD}" y="500" width="${colW}" height="1100" fill="${C.fill}" stroke="${C.line}" stroke-width="2" rx="6"/>
    <rect x="${PAD + colW + 40}" y="500" width="${colW}" height="1100" fill="${C.fill}" stroke="${C.acid}" stroke-width="3" rx="6"/>
    ${textPath({ text: "2025", font: FONTS.anton, size: 80, x: PAD + colW / 2, y: 600, fill: C.red, anchor: "middle" })}
    ${textPath({ text: "2026", font: FONTS.anton, size: 80, x: PAD + colW + 40 + colW / 2, y: 600, fill: C.acid, anchor: "middle" })}
    ${[
      ["ChatGPT Plus", "20 €", "—"],
      ["Claude Pro", "18 €", "—"],
      ["Canva Pro", "12 €", "—"],
      ["CapCut", "8 €", "—"],
      ["Gemini", "22 €", "—"],
      ["Freepik+", "12 €", "—"],
      ["...8 más", "216 €", "—"],
    ].map((row, i) => {
      const y = 720 + i * 80;
      return `
        ${textPath({ text: row[0], font: FONTS.jbmR, size: 22, x: PAD + 30, y, fill: C.white })}
        ${textPath({ text: row[1], font: FONTS.jbmB, size: 24, x: PAD + colW - 30, y, fill: C.red, anchor: "end", strike: true })}
      `;
    }).join("\n")}
    ${textPath({ text: "DARK ROOM", font: FONTS.anton, size: 50, x: PAD + colW + 40 + colW / 2, y: 900, fill: C.white, anchor: "middle" })}
    ${textPath({ text: "(las 12 herramientas)", font: FONTS.sgM, size: 22, x: PAD + colW + 40 + colW / 2, y: 940, fill: C.ghost, anchor: "middle" })}
    ${textPath({ text: "24,90 €", font: FONTS.anton, size: 110, x: PAD + colW + 40 + colW / 2, y: 1140, fill: C.acid, anchor: "middle" })}
    ${textPath({ text: "/ MES", font: FONTS.sgB, size: 28, x: PAD + colW + 40 + colW / 2, y: 1180, fill: C.white, anchor: "middle" })}
    <line x1="${PAD + colW + 40 + 40}" y1="1240" x2="${W - PAD - 40}" y2="1240" stroke="${C.gray}" stroke-width="1"/>
    ${textPath({ text: filled ? "ahorro" : "tu ahorro", font: FONTS.sgB, size: 26, x: PAD + colW + 40 + colW / 2, y: 1300, fill: C.ghost, anchor: "middle", letterSpacing: 4 })}
    ${textPath({ text: filled ? "−283 €/mes" : "−___ €/mes", font: FONTS.anton, size: 78, x: PAD + colW + 40 + colW / 2, y: 1400, fill: C.acid, anchor: "middle" })}
    ${textPath({ text: filled ? "(3.396 € al año)" : "(_____ € al año)", font: FONTS.sgM, size: 28, x: PAD + colW + 40 + colW / 2, y: 1450, fill: C.white, anchor: "middle" })}
    ${textPath({ text: "Link en bio", font: FONTS.sgB, size: 32, x: PAD, y: H - 180, fill: C.acid, letterSpacing: 4 })}
    ${handle()}
  `);
}

// ID 06 · "Esto debería ser ilegal" + zona screenshot
function tpl06({ filled = false }) {
  return svgWrap(`
    ${brandMark()}
    ${multilinePath({ lines: ["ESTO", "DEBERÍA", "SER ILEGAL."], font: FONTS.anton, size: 156, x: PAD, y: 460, fill: C.white })}
    <rect x="${PAD}" y="950" width="160" height="8" fill="${C.acid}"/>
    ${textPath({ text: filled ? "Mira mi panel:" : "[pega tu screenshot del panel Dark Room aquí]", font: FONTS.sgM, size: filled ? 38 : 26, x: PAD, y: 1030, fill: filled ? C.white : C.ghost })}
    ${emptyZone({
      x: PAD,
      y: 1100,
      w: W - 2 * PAD,
      h: 540,
      label: filled ? "[panel Dark Room]" : "ARRASTRA TU CAPTURA",
      labelSize: filled ? 30 : 36,
    })}
    ${textPath({ text: "12 herramientas. 24,90 €/mes.", font: FONTS.sgB, size: 34, x: PAD, y: 1740, fill: C.acid })}
    ${textPath({ text: "Link en bio", font: FONTS.jbmB, size: 28, x: PAD, y: H - 200, fill: C.acid })}
    ${handle()}
  `);
}

// ID 07 · "Mi setup creador 2026"
function tpl07({ filled = false }) {
  return svgWrap(`
    ${brandMark()}
    ${textPath({ text: "MI SETUP", font: FONTS.anton, size: 130, x: PAD, y: 360, fill: C.white })}
    ${textPath({ text: "CREADOR 2026.", font: FONTS.anton, size: 130, x: PAD, y: 500, fill: C.acid })}
    <rect x="${PAD}" y="570" width="200" height="8" fill="${C.acid}"/>
    ${textPath({ text: "12 herramientas. Un solo sitio.", font: FONTS.sgM, size: 32, x: PAD, y: 660, fill: C.white })}
    ${gridTools12({ y: 760, h: 720 })}
    ${textPath({ text: filled ? "0,83 €/día." : "Pago menos al día que un café.", font: FONTS.anton, size: 56, x: PAD, y: H - 280, fill: C.acid })}
    ${textPath({ text: "Link en bio", font: FONTS.sgB, size: 32, x: PAD, y: H - 180, fill: C.white, letterSpacing: 4 })}
    ${handle()}
  `);
}

// ID 08 · "Recomendación: Dark Room (sin patrocinio)"
function tpl08({ filled = false }) {
  return svgWrap(`
    ${brandMark()}
    ${textPath({ text: "RECOMENDACIÓN", font: FONTS.sgB, size: 30, x: PAD, y: 360, fill: C.acid, letterSpacing: 6 })}
    ${textPath({ text: "DARK ROOM.", font: FONTS.anton, size: 180, x: PAD, y: 560, fill: C.white })}
    <rect x="${PAD}" y="610" width="200" height="8" fill="${C.acid}"/>
    ${multilinePath({
      lines: [
        "(Sin patrocinio.",
        "Sólo lo recomiendo",
        "porque lo uso yo.)",
      ],
      font: FONTS.sgM,
      size: 40,
      x: PAD,
      y: 760,
      fill: C.white,
      lineHeight: 1.35,
    })}
    <rect x="${PAD}" y="1020" width="${W - 2 * PAD}" height="2" fill="${C.gray}"/>
    ${textPath({ text: "LO QUE INCLUYE", font: FONTS.sgB, size: 26, x: PAD, y: 1090, fill: C.ghost, letterSpacing: 4 })}
    ${[
      "12 herramientas premium",
      "Acceso oficial real",
      "Soporte Discord 24/7",
      "Lifetime: 349 € una vez",
    ].map((t, i) => textPath({ text: `· ${t}`, font: FONTS.sgM, size: 36, x: PAD, y: 1180 + i * 70, fill: C.white })).join("\n")}
    ${textPath({ text: filled ? "Llevo 6 meses. No vuelvo atrás." : "[escribe tu experiencia]", font: FONTS.sgB, size: 30, x: PAD, y: 1540, fill: C.acid })}
    ${textPath({ text: "Link en bio", font: FONTS.sgB, size: 32, x: PAD, y: H - 180, fill: C.acid, letterSpacing: 4 })}
    ${handle()}
  `);
}

// ID 09 · "Reto: cuenta tus suscripciones IA"
function tpl09({ filled = false }) {
  return svgWrap(`
    ${brandMark()}
    ${textPath({ text: "RETO:", font: FONTS.anton, size: 200, x: PAD, y: 460, fill: C.acid })}
    ${multilinePath({ lines: ["CUENTA TUS", "SUSCRIPCIONES", "DE IA."], font: FONTS.anton, size: 110, x: PAD, y: 660, fill: C.white })}
    <rect x="${PAD}" y="1000" width="160" height="8" fill="${C.acid}"/>
    ${multilinePath({
      lines: [
        "Suma TODO lo que pagas",
        "al mes en herramientas IA.",
        "Comparte el número.",
      ],
      font: FONTS.sgM,
      size: 38,
      x: PAD,
      y: 1080,
      fill: C.white,
      lineHeight: 1.35,
    })}
    ${emptyZone({ x: PAD, y: 1340, w: W - 2 * PAD, h: 280, label: filled ? "312 €/mes" : "[stiker numero IG aquí]", labelSize: filled ? 96 : 28 })}
    ${textPath({ text: filled ? "Yo pagaba ESTO." : "Pega aquí tu total.", font: FONTS.sgB, size: 32, x: PAD, y: 1700, fill: C.acid })}
    ${handle()}
  `);
}

// ID 10 · "Si supieras lo que pago al año…"
function tpl10({ filled = false }) {
  return svgWrap(`
    ${brandMark()}
    ${multilinePath({ lines: ["SI SUPIERAS", "LO QUE PAGO", "AL AÑO POR IA…"], font: FONTS.anton, size: 110, x: PAD, y: 460, fill: C.white })}
    <rect x="${PAD}" y="900" width="160" height="8" fill="${C.acid}"/>
    ${textPath({ text: "Pista:", font: FONTS.sgB, size: 38, x: PAD, y: 1000, fill: C.acid })}
    ${textPath({ text: filled ? "298,80 €" : "____,__ €", font: FONTS.anton, size: 200, x: PAD, y: 1240, fill: C.acid })}
    ${textPath({ text: "AL AÑO. NO al mes.", font: FONTS.sgB, size: 36, x: PAD, y: 1320, fill: C.white })}
    ${multilinePath({
      lines: [
        "12 herramientas premium.",
        "Acceso oficial.",
        "Lifetime opcional 349 €.",
      ],
      font: FONTS.sgM,
      size: 34,
      x: PAD,
      y: 1480,
      fill: C.white,
      lineHeight: 1.4,
    })}
    ${textPath({ text: filled ? "Dark Room. Pruébalo." : "Adivina dónde →", font: FONTS.sgB, size: 32, x: PAD, y: 1700, fill: C.acid })}
    ${handle()}
  `);
}

const TEMPLATES = [
  { id: "ST01-stack", fn: tpl01 },
  { id: "ST02-antes-ahora", fn: tpl02 },
  { id: "ST03-pov", fn: tpl03 },
  { id: "ST04-preguntame", fn: tpl04 },
  { id: "ST05-2025-vs-2026", fn: tpl05 },
  { id: "ST06-ilegal", fn: tpl06 },
  { id: "ST07-setup", fn: tpl07 },
  { id: "ST08-recomendacion", fn: tpl08 },
  { id: "ST09-reto", fn: tpl09 },
  { id: "ST10-si-supieras", fn: tpl10 },
];

async function renderTpl(svg, outPath) {
  const bg = await sharp({ create: { width: W, height: H, channels: 3, background: C.bg } }).png().toBuffer();
  const out = await sharp(bg).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png({ quality: 95, compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(outPath, out);
}

async function main() {
  console.log(`Pack 1 · Stories templates · ${TEMPLATES.length} × 2 versions = ${TEMPLATES.length * 2} PNGs\n`);
  let ok = 0;
  for (const t of TEMPLATES) {
    for (const filled of [false, true]) {
      const suffix = filled ? "ejemplo" : "vacio";
      const outPath = path.join(OUT_DIR, `${t.id}-${suffix}.png`);
      process.stdout.write(`→ ${t.id}-${suffix} ... `);
      try {
        const svg = t.fn({ filled });
        await renderTpl(svg, outPath);
        const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
        console.log(`ok (${kb} KB)`);
        ok++;
      } catch (err) {
        console.log(`FAIL ${err.message.slice(0, 200)}`);
      }
    }
  }
  console.log(`\nDone: ${ok}/${TEMPLATES.length * 2} stories`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
