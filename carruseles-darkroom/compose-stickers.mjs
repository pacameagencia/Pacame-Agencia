#!/usr/bin/env node
/**
 * Pack 4 · 12 stickers 512×512 PNG transparentes.
 * Compatibles con Telegram, WhatsApp, Discord.
 * Output: ugc-kit/pack-4-stickers/SK01..SK12.png
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import opentype from "opentype.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, "fonts");
const OUT_DIR = path.join(__dirname, "ugc-kit", "pack-4-stickers");
fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 512;
const H = 512;

const C = {
  acid: "#CFFF00",
  red: "#FF3B3B",
  white: "#FFFFFF",
  bg: "#0A0A0A",
  yellow: "#FFD500",
};

const FONTS = {
  anton: opentype.loadSync(path.join(FONTS_DIR, "Anton-Regular.ttf")),
  sgB: opentype.loadSync(path.join(FONTS_DIR, "SpaceGrotesk-Bold.ttf")),
  jbmB: opentype.loadSync(path.join(FONTS_DIR, "JetBrainsMono-Bold.ttf")),
};

function fitSize(font, text, maxW, startSize, minSize = 24, step = 2) {
  let s = startSize;
  while (font.getAdvanceWidth(text, s) > maxW && s > minSize) s -= step;
  return s;
}

function tp({ text, font, size, x, y, fill, anchor = "start", letterSpacing = 0, stroke = null, strokeW = 0 }) {
  if (!text) return "";
  let drawX = x;
  if (letterSpacing === 0) {
    const w = font.getAdvanceWidth(text, size);
    if (anchor === "end") drawX = x - w;
    else if (anchor === "middle") drawX = x - w / 2;
    let s = font.getPath(text, drawX, y, size).toSVG(2);
    if (stroke) {
      s = s.replace(/<path /, `<path stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round" paint-order="stroke" fill="${fill}" `);
    } else {
      s = s.replace(/<path /, `<path fill="${fill}" `);
    }
    return s;
  } else {
    const widths = [...text].map((ch) => font.getAdvanceWidth(ch, size));
    const totalW = widths.reduce((a, b) => a + b, 0) + letterSpacing * Math.max(0, text.length - 1);
    if (anchor === "end") drawX = x - totalW;
    else if (anchor === "middle") drawX = x - totalW / 2;
    let cur = drawX;
    let out = "";
    [...text].forEach((ch, i) => {
      let s = font.getPath(ch, cur, y, size).toSVG(2);
      if (stroke) {
        s = s.replace(/<path /, `<path stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round" paint-order="stroke" fill="${fill}" `);
      } else {
        s = s.replace(/<path /, `<path fill="${fill}" `);
      }
      out += s;
      cur += widths[i] + letterSpacing;
    });
    return out;
  }
}

function svgWrap(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${inner}
</svg>`;
}

// Sticker generators (each returns SVG with transparent bg)

// SK01 · "DARK ROOM" logo
function sk01() {
  return svgWrap(`
    <rect x="40" y="180" width="432" height="152" rx="20" fill="${C.bg}" stroke="${C.acid}" stroke-width="6"/>
    ${tp({ text: "DARK", font: FONTS.anton, size: 96, x: W / 2, y: 250, fill: C.white, anchor: "middle" })}
    ${tp({ text: "ROOM", font: FONTS.anton, size: 96, x: W / 2, y: 320, fill: C.acid, anchor: "middle" })}
  `);
}

// SK02 · "24,90€" gigante
function sk02() {
  return svgWrap(`
    <rect x="20" y="120" width="472" height="280" rx="30" fill="${C.bg}" stroke="${C.acid}" stroke-width="8"/>
    ${tp({ text: "24,90", font: FONTS.anton, size: 200, x: W / 2 - 30, y: 320, fill: C.acid, anchor: "middle" })}
    ${tp({ text: "€", font: FONTS.anton, size: 200, x: W / 2 + 170, y: 320, fill: C.acid, anchor: "middle" })}
    ${tp({ text: "/MES", font: FONTS.sgB, size: 32, x: W / 2, y: 380, fill: C.white, anchor: "middle", letterSpacing: 6 })}
  `);
}

// SK03 · "LIFETIME" sello rotado
function sk03() {
  return svgWrap(`
    <g transform="translate(${W / 2} ${H / 2}) rotate(-12)">
      <circle r="200" fill="${C.bg}" stroke="${C.acid}" stroke-width="10"/>
      <circle r="180" fill="none" stroke="${C.acid}" stroke-width="2" stroke-dasharray="8 4"/>
      <g transform="translate(${-W / 2} ${-H / 2})">
        ${tp({ text: "LIFETIME", font: FONTS.anton, size: 90, x: W / 2, y: H / 2, fill: C.acid, anchor: "middle" })}
        ${tp({ text: "349 €", font: FONTS.anton, size: 64, x: W / 2, y: H / 2 + 70, fill: C.white, anchor: "middle" })}
        ${tp({ text: "PARA SIEMPRE", font: FONTS.sgB, size: 22, x: W / 2, y: H / 2 - 50, fill: C.acid, anchor: "middle", letterSpacing: 5 })}
      </g>
    </g>
  `);
}

// SK04 · Puerta verde icónica
function sk04() {
  // door silhouette with green glow
  return svgWrap(`
    <defs>
      <radialGradient id="glow" cx="0.5" cy="0.5" r="0.8">
        <stop offset="0" stop-color="${C.acid}" stop-opacity="1"/>
        <stop offset="1" stop-color="${C.acid}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="${W / 2}" cy="${H / 2}" r="240" fill="url(#glow)" opacity="0.4"/>
    <!-- door frame -->
    <rect x="170" y="80" width="172" height="380" rx="6" fill="${C.bg}" stroke="${C.acid}" stroke-width="6"/>
    <!-- door open detail (shows green glow inside) -->
    <rect x="180" y="90" width="60" height="360" fill="${C.acid}"/>
    <!-- handle -->
    <circle cx="320" cy="270" r="10" fill="${C.acid}"/>
    ${tp({ text: "DARK ROOM", font: FONTS.anton, size: 28, x: W / 2, y: 490, fill: C.acid, anchor: "middle", letterSpacing: 4 })}
  `);
}

// SK05 · "ESTO DEBERÍA SER ILEGAL" cinta diagonal
function sk05() {
  return svgWrap(`
    <g transform="translate(${W / 2} ${H / 2}) rotate(-15)">
      <rect x="-260" y="-65" width="520" height="130" fill="${C.yellow}" stroke="${C.bg}" stroke-width="4"/>
      <!-- diagonal stripes -->
      ${Array.from({ length: 12 }, (_, i) => `<rect x="${-260 + i * 50}" y="-65" width="20" height="130" fill="${C.bg}" transform="skewX(-20)"/>`).join("")}
      <g transform="translate(0 0)">
        ${tp({ text: "ESTO DEBERÍA", font: FONTS.anton, size: 38, x: 0, y: -10, fill: C.bg, anchor: "middle", letterSpacing: 2 })}
        ${tp({ text: "SER ILEGAL", font: FONTS.anton, size: 38, x: 0, y: 38, fill: C.bg, anchor: "middle", letterSpacing: 2 })}
      </g>
    </g>
  `);
}

// SK06 · Reloj LED rojo urgencia
function sk06() {
  return svgWrap(`
    <rect x="60" y="160" width="392" height="200" rx="16" fill="${C.bg}" stroke="${C.red}" stroke-width="4"/>
    <rect x="80" y="180" width="352" height="160" rx="6" fill="#1a0000"/>
    ${tp({ text: "00:35", font: FONTS.jbmB, size: 130, x: W / 2, y: 295, fill: C.red, anchor: "middle" })}
    ${tp({ text: "DÍAS PARA AMORTIZAR", font: FONTS.sgB, size: 20, x: W / 2, y: 410, fill: C.acid, anchor: "middle", letterSpacing: 3 })}
    ${tp({ text: "EL LIFETIME 349 €", font: FONTS.sgB, size: 20, x: W / 2, y: 440, fill: C.white, anchor: "middle", letterSpacing: 3 })}
  `);
}

// SK07 · Llave con tag
function sk07() {
  return svgWrap(`
    <g transform="translate(${W / 2} ${H / 2})">
      <!-- key shaft -->
      <rect x="-180" y="-15" width="240" height="30" rx="4" fill="${C.acid}"/>
      <!-- key teeth -->
      <rect x="40" y="0" width="20" height="40" fill="${C.acid}"/>
      <rect x="-10" y="0" width="20" height="40" fill="${C.acid}"/>
      <!-- key bow (circle) -->
      <circle cx="-180" cy="0" r="60" fill="none" stroke="${C.acid}" stroke-width="20"/>
      <!-- tag -->
      <rect x="60" y="-100" width="160" height="80" rx="8" fill="${C.bg}" stroke="${C.acid}" stroke-width="4"/>
      <line x1="50" y1="-60" x2="60" y2="-60" stroke="${C.acid}" stroke-width="4"/>
      ${tp({ text: "DARK", font: FONTS.anton, size: 28, x: 140, y: -68, fill: C.white, anchor: "middle" })}
      ${tp({ text: "ROOM", font: FONTS.anton, size: 28, x: 140, y: -38, fill: C.acid, anchor: "middle" })}
    </g>
  `);
}

// SK08 · Candado abierto
function sk08() {
  return svgWrap(`
    <g transform="translate(${W / 2} ${H / 2 + 30})">
      <!-- shackle abierto -->
      <path d="M -75 -150 Q -75 -240 0 -240 Q 75 -240 75 -150" fill="none" stroke="${C.acid}" stroke-width="22"/>
      <line x1="-75" y1="-150" x2="-75" y2="-100" stroke="${C.acid}" stroke-width="22" stroke-linecap="round"/>
      <line x1="75" y1="-150" x2="75" y2="-200" stroke="${C.acid}" stroke-width="22" stroke-linecap="round"/>
      <!-- body -->
      <rect x="-110" y="-100" width="220" height="180" rx="20" fill="${C.bg}" stroke="${C.acid}" stroke-width="8"/>
      <!-- keyhole -->
      <circle cx="0" cy="-30" r="20" fill="${C.acid}"/>
      <rect x="-8" y="-30" width="16" height="40" fill="${C.acid}"/>
      ${tp({ text: "ABIERTO", font: FONTS.sgB, size: 24, x: 0, y: 60, fill: C.acid, anchor: "middle", letterSpacing: 4 })}
    </g>
    ${tp({ text: "DARK ROOM", font: FONTS.anton, size: 28, x: W / 2, y: 490, fill: C.acid, anchor: "middle", letterSpacing: 4 })}
  `);
}

// SK09 · "POV" + ojos sorprendidos
function sk09() {
  return svgWrap(`
    <rect x="40" y="120" width="432" height="280" rx="24" fill="${C.bg}" stroke="${C.acid}" stroke-width="6"/>
    ${tp({ text: "POV:", font: FONTS.anton, size: 96, x: W / 2, y: 220, fill: C.acid, anchor: "middle" })}
    <!-- eyes (cartoon) -->
    <circle cx="${W / 2 - 60}" cy="290" r="38" fill="${C.white}"/>
    <circle cx="${W / 2 + 60}" cy="290" r="38" fill="${C.white}"/>
    <circle cx="${W / 2 - 60}" cy="290" r="14" fill="${C.bg}"/>
    <circle cx="${W / 2 + 60}" cy="290" r="14" fill="${C.bg}"/>
    ${tp({ text: "LO ENCONTRASTE", font: FONTS.sgB, size: 22, x: W / 2, y: 380, fill: C.white, anchor: "middle", letterSpacing: 4 })}
  `);
}

// SK10 · "AHORRASTE 287€" con check
function sk10() {
  return svgWrap(`
    <rect x="40" y="120" width="432" height="280" rx="24" fill="${C.acid}"/>
    ${tp({ text: "AHORRASTE", font: FONTS.sgB, size: 28, x: W / 2, y: 200, fill: C.bg, anchor: "middle", letterSpacing: 4 })}
    ${tp({ text: "287 €", font: FONTS.anton, size: 130, x: W / 2 - 30, y: 320, fill: C.bg, anchor: "middle" })}
    <!-- check mark -->
    <path d="M ${W / 2 + 100} 280 l 30 30 l 60 -60" stroke="${C.bg}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${tp({ text: "AL MES", font: FONTS.sgB, size: 22, x: W / 2, y: 370, fill: C.bg, anchor: "middle", letterSpacing: 4 })}
  `);
}

// SK11 · "Shhh..." dedo silencio
function sk11() {
  return svgWrap(`
    <circle cx="${W / 2}" cy="${H / 2}" r="200" fill="${C.bg}" stroke="${C.acid}" stroke-width="8"/>
    <!-- finger silueta simple sobre boca -->
    <ellipse cx="${W / 2}" cy="${H / 2 + 20}" rx="120" ry="80" fill="none" stroke="${C.acid}" stroke-width="4"/>
    <rect x="${W / 2 - 12}" y="${H / 2 - 90}" width="24" height="160" rx="12" fill="${C.acid}"/>
    ${tp({ text: "SHHH...", font: FONTS.anton, size: 70, x: W / 2, y: 110, fill: C.acid, anchor: "middle", letterSpacing: 3 })}
    ${tp({ text: "NO SE LO DIGAS A NADIE", font: FONTS.sgB, size: 20, x: W / 2, y: 470, fill: C.white, anchor: "middle", letterSpacing: 3 })}
  `);
}

// SK12 · "349€ FOREVER" badge
function sk12() {
  return svgWrap(`
    <g transform="translate(${W / 2} ${H / 2})">
      <!-- starburst -->
      ${Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const x1 = Math.cos(a) * 180, y1 = Math.sin(a) * 180;
        const x2 = Math.cos(a) * 230, y2 = Math.sin(a) * 230;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.acid}" stroke-width="14" stroke-linecap="round"/>`;
      }).join("")}
      <circle r="180" fill="${C.acid}"/>
      <circle r="160" fill="${C.bg}"/>
      <g transform="translate(${-W / 2} ${-H / 2})">
        ${tp({ text: "349 €", font: FONTS.anton, size: 100, x: W / 2, y: H / 2 + 10, fill: C.acid, anchor: "middle" })}
        ${tp({ text: "FOREVER", font: FONTS.sgB, size: 30, x: W / 2, y: H / 2 - 40, fill: C.white, anchor: "middle", letterSpacing: 6 })}
        ${tp({ text: "DARK ROOM", font: FONTS.sgB, size: 18, x: W / 2, y: H / 2 + 60, fill: C.white, anchor: "middle", letterSpacing: 4 })}
      </g>
    </g>
  `);
}

const STICKERS = [
  { id: "SK01-logo", fn: sk01 },
  { id: "SK02-precio", fn: sk02 },
  { id: "SK03-lifetime", fn: sk03 },
  { id: "SK04-puerta", fn: sk04 },
  { id: "SK05-ilegal", fn: sk05 },
  { id: "SK06-reloj", fn: sk06 },
  { id: "SK07-llave", fn: sk07 },
  { id: "SK08-candado", fn: sk08 },
  { id: "SK09-pov", fn: sk09 },
  { id: "SK10-ahorraste", fn: sk10 },
  { id: "SK11-shhh", fn: sk11 },
  { id: "SK12-forever", fn: sk12 },
];

async function render(svg, outPath) {
  // Transparent canvas + composite SVG → PNG with alpha
  const transparent = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).png().toBuffer();
  const out = await sharp(transparent)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png({ quality: 95, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(outPath, out);
}

async function main() {
  console.log(`Pack 4 · Stickers · ${STICKERS.length} PNGs (512×512 transparente)\n`);
  let ok = 0;
  for (const s of STICKERS) {
    process.stdout.write(`→ ${s.id} ... `);
    try {
      const svg = s.fn();
      const outPath = path.join(OUT_DIR, `${s.id}.png`);
      await render(svg, outPath);
      const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
      console.log(`ok (${kb} KB)`);
      ok++;
    } catch (err) {
      console.log(`FAIL ${err.message.slice(0, 200)}`);
    }
  }
  console.log(`\nDone: ${ok}/${STICKERS.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
