#!/usr/bin/env node
/**
 * Compone 30 slides Dark Room (3 carruseles × 10 slides) a PNG 1080×1350.
 * Usa opentype.js para convertir texto a paths SVG — evita el problema de
 * librsvg en Windows que NO honra @font-face data URL.
 *
 * Pipeline:
 *  1. Lee background WebP/PNG (o fondo sólido negro)
 *  2. Genera SVG con todos los textos como <path>, además de overlay y decorativos
 *  3. Sharp compone: background → SVG overlay → PNG 1080×1350
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import opentype from "opentype.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BG_DIR = path.join(__dirname, "backgrounds");
const FONTS_DIR = path.join(__dirname, "fonts");
const OUT_DIR = path.join(__dirname, "output");
fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 1080;
const H = 1350;
// IG Safe areas (ver IG-SAFE-AREAS.md)
// Top 100px y Bottom 260px reservados para UI de IG · NO poner texto crítico ahí
const TOP_UNSAFE = 100;
const BOT_UNSAFE = 260;
const MARGIN_X = 60;
const PAD = MARGIN_X;          // alias para retrocompatibilidad
const SAFE_Y = TOP_UNSAFE;     // y mínima para texto
const SAFE_H_BOTTOM = H - BOT_UNSAFE;  // y máxima para texto = 1090

const C = {
  bg: "#0A0A0A",
  acid: "#CFFF00",
  acidDim: "#9FC700",
  red: "#FF3B3B",
  white: "#F2F2F2",
  ghost: "#8E8E8E",
  gray: "#4A4A4A",
  line: "#1E1E1E",
};

// ───────────── Font loading (sync at startup) ─────────────

const FONTS = {
  anton: opentype.loadSync(path.join(FONTS_DIR, "Anton-Regular.ttf")),
  sgB: opentype.loadSync(path.join(FONTS_DIR, "SpaceGrotesk-Bold.ttf")),
  sgM: opentype.loadSync(path.join(FONTS_DIR, "SpaceGrotesk-Medium.ttf")),
  jbmR: opentype.loadSync(path.join(FONTS_DIR, "JetBrainsMono-Regular.ttf")),
  jbmB: opentype.loadSync(path.join(FONTS_DIR, "JetBrainsMono-Bold.ttf")),
};

// ───────────── Text → SVG path helpers ─────────────

/** getAdvance: total horizontal advance of a text at fontSize */
function getAdvance(font, text, fontSize) {
  return font.getAdvanceWidth(text, fontSize);
}

/**
 * textPath: returns <path d="..."> (and optionally a decoration line)
 * options: { text, font, size, x, y, fill, anchor ('start'|'middle'|'end'), strike, letterSpacing }
 */
function textPath({ text, font, size, x, y, fill = "#fff", anchor = "start", strike = false, letterSpacing = 0 }) {
  if (!text) return "";
  let drawX = x;
  let paths = "";
  let totalW = 0;

  if (letterSpacing === 0) {
    const advance = getAdvance(font, text, size);
    totalW = advance;
    if (anchor === "end") drawX = x - advance;
    else if (anchor === "middle") drawX = x - advance / 2;
    const p = font.getPath(text, drawX, y, size);
    paths = p.toSVG(2);
    paths = paths.replace(/<path /, `<path fill="${fill}" `);
  } else {
    // letter-by-letter with spacing
    let widths = [];
    for (const ch of text) widths.push(getAdvance(font, ch, size));
    totalW = widths.reduce((a, b) => a + b, 0) + letterSpacing * Math.max(0, text.length - 1);
    if (anchor === "end") drawX = x - totalW;
    else if (anchor === "middle") drawX = x - totalW / 2;
    let cursor = drawX;
    const chars = [...text];
    for (let i = 0; i < chars.length; i++) {
      const g = font.getPath(chars[i], cursor, y, size);
      let s = g.toSVG(2).replace(/<path /, `<path fill="${fill}" `);
      paths += s;
      cursor += widths[i] + letterSpacing;
    }
  }

  if (strike) {
    const strikeY = y - size * 0.28;
    const x1 = drawX - size * 0.05;
    const x2 = drawX + totalW + size * 0.05;
    paths += `<line x1="${x1}" y1="${strikeY}" x2="${x2}" y2="${strikeY}" stroke="${fill}" stroke-width="${Math.max(3, size * 0.08)}"/>`;
  }

  return paths;
}

function multilinePath({ lines, font, size, x, y, fill = "#fff", anchor = "start", lineHeight = 1.02, letterSpacing = 0 }) {
  return lines
    .map((line, i) => textPath({
      text: line, font, size,
      x, y: y + i * size * lineHeight,
      fill, anchor, letterSpacing,
    }))
    .join("\n");
}

// ───────────── Background loading ─────────────

async function loadBg(bgId) {
  if (!bgId) return null;
  for (const ext of ["webp", "png", "jpg"]) {
    const p = path.join(BG_DIR, `${bgId}.${ext}`);
    if (fs.existsSync(p)) {
      return await sharp(p).resize(W, H, { fit: "cover", position: "center" }).toBuffer();
    }
  }
  return null;
}

async function solidBg() {
  return await sharp({ create: { width: W, height: H, channels: 3, background: C.bg } }).png().toBuffer();
}

// ───────────── SVG helpers (non-text) ─────────────

function svgWrap(inner, extraDefs = "") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${extraDefs}</defs>
  ${inner}
</svg>`;
}

function overlayGradient(strength = 0.65, direction = "bottom") {
  const y1 = direction === "bottom" ? 0 : 1;
  const y2 = direction === "bottom" ? 1 : 0;
  return `
    <defs><linearGradient id="dg" x1="0" y1="${y1}" x2="0" y2="${y2}">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="${strength}"/>
    </linearGradient></defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#dg)"/>`;
}

function fullOverlay(opacity = 0.55) {
  return `<rect x="0" y="0" width="${W}" height="${H}" fill="#000" opacity="${opacity}"/>`;
}

function vignette() {
  return `<defs><radialGradient id="vg" cx="0.5" cy="0.5" r="0.7">
    <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.5"/>
  </radialGradient></defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#vg)"/>`;
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

function pageDot(idx, total, cLabel) {
  return textPath({
    text: `${cLabel} · ${String(idx).padStart(2, "0")}/${String(total).padStart(2, "0")}`,
    font: FONTS.jbmR,
    size: 22,
    x: PAD,
    y: H - 60,
    fill: C.ghost,
  });
}

// ───────────── Slide templates ─────────────

function heroTitleSVG({ title, sub, counter, titleSize = 130, titleFill = C.white, accentLine = true, subColor = C.white }) {
  const titleLines = title.split("\n");
  const maxW = W - 2 * PAD;
  let actualSize = titleSize;
  for (const l of titleLines) {
    while (FONTS.anton.getAdvanceWidth(l, actualSize) > maxW && actualSize > 40) {
      actualSize -= 6;
    }
  }
  const LH = 1.12;
  const totalTitleH = titleLines.length * actualSize * LH;
  // center the title block vertically around y=820
  const titleY = Math.max(480, 820 - totalTitleH + actualSize);
  const subY = titleY + totalTitleH + 40;

  return svgWrap(`
    ${overlayGradient(0.75, "bottom")}
    ${brandMark()}
    ${multilinePath({
      lines: titleLines,
      font: FONTS.anton,
      size: actualSize,
      x: PAD,
      y: titleY,
      fill: titleFill,
      lineHeight: LH,
    })}
    ${accentLine ? `<rect x="${PAD}" y="${subY - 55}" width="120" height="6" fill="${C.acid}"/>` : ""}
    ${textPath({
      text: sub || "",
      font: FONTS.sgM,
      size: 34,
      x: PAD,
      y: subY,
      fill: subColor,
    })}
    ${counter || ""}
  `);
}

function numberHeroSVG({ number, over, under, counter, invert = false, numSize = 380 }) {
  const bg = invert ? `<rect x="0" y="0" width="${W}" height="${H}" fill="${C.acid}"/>` : overlayGradient(0.5, "bottom");
  const numFill = invert ? C.bg : C.acid;
  const textFill = invert ? C.bg : C.white;
  const brand = invert ? "" : brandMark();

  // Auto-fit: reduce numSize until number fits safely in width
  const maxW = W - 2 * PAD;
  let actualSize = numSize;
  while (FONTS.anton.getAdvanceWidth(number, actualSize) > maxW && actualSize > 100) {
    actualSize -= 10;
  }
  const numY = 900;

  return svgWrap(`
    ${bg}
    ${brand}
    ${textPath({
      text: over || "",
      font: FONTS.sgB,
      size: 38,
      x: PAD,
      y: 340,
      fill: textFill,
      letterSpacing: 4,
    })}
    ${textPath({
      text: number,
      font: FONTS.anton,
      size: actualSize,
      x: PAD,
      y: numY,
      fill: numFill,
    })}
    ${textPath({
      text: under || "",
      font: FONTS.sgB,
      size: 36,
      x: PAD,
      y: 1020,
      fill: textFill,
      letterSpacing: 2,
    })}
    ${counter || ""}
  `);
}

function ticketListSVG({ kicker, items, totalLabel, totalValue, counter, footnote }) {
  const startY = 260;
  const rowH = 56;
  const leftX = PAD + 40;
  const rightX = W - PAD - 40;
  const boxX = PAD;
  const boxW = W - 2 * PAD;
  const boxH = items.length * rowH + 220;

  const rows = items
    .map((it, i) => {
      const y = startY + 140 + i * rowH;
      return `
      ${textPath({ text: it[0], font: FONTS.jbmR, size: 28, x: leftX, y, fill: C.white })}
      ${textPath({ text: it[1], font: FONTS.jbmB, size: 28, x: rightX, y, fill: C.red, anchor: "end", strike: true })}
    `;
    })
    .join("\n");

  return svgWrap(`
    ${fullOverlay(0.8)}
    ${brandMark()}
    <rect x="${boxX}" y="${startY}" width="${boxW}" height="${boxH}" fill="#0F0F0F" stroke="${C.line}" stroke-width="2" rx="6"/>
    ${textPath({
      text: kicker,
      font: FONTS.sgB,
      size: 26,
      x: leftX,
      y: startY + 70,
      fill: C.acid,
      letterSpacing: 3,
    })}
    ${rows}
    <line x1="${leftX}" y1="${startY + boxH - 100}" x2="${rightX}" y2="${startY + boxH - 100}" stroke="${C.gray}" stroke-width="1"/>
    ${textPath({ text: totalLabel, font: FONTS.sgB, size: 30, x: leftX, y: startY + boxH - 40, fill: C.white })}
    ${textPath({ text: totalValue, font: FONTS.jbmB, size: 40, x: rightX, y: startY + boxH - 40, fill: C.acid, anchor: "end" })}
    ${footnote ? textPath({
      text: footnote,
      font: FONTS.sgM,
      size: 28,
      x: W / 2,
      y: H - 150,
      fill: C.ghost,
      anchor: "middle",
    }) : ""}
    ${counter || ""}
  `);
}

function sectionListSVG({ num, title, items, counter, subTitle }) {
  const kickerY = 260;
  const titleY = 430;
  const itemsY = 700;
  const itemH = 140;

  const rows = items
    .map((it, i) => {
      const y = itemsY + i * itemH;
      return `
      <line x1="${PAD}" y1="${y - 60}" x2="${W - PAD}" y2="${y - 60}" stroke="${C.gray}" stroke-width="1" opacity="0.5"/>
      ${textPath({ text: it[0], font: FONTS.sgB, size: 40, x: PAD, y, fill: C.acid })}
      ${textPath({ text: it[1], font: FONTS.sgM, size: 28, x: PAD, y: y + 45, fill: C.white })}
    `;
    })
    .join("\n");

  return svgWrap(`
    ${fullOverlay(0.72)}
    ${brandMark()}
    <g opacity="0.18">
      ${textPath({ text: num, font: FONTS.anton, size: 220, x: W - PAD, y: kickerY + 140, fill: C.acid, anchor: "end" })}
    </g>
    ${textPath({ text: subTitle || "", font: FONTS.sgB, size: 26, x: PAD, y: kickerY, fill: C.acid, letterSpacing: 6 })}
    ${textPath({ text: title, font: FONTS.anton, size: 110, x: PAD, y: titleY, fill: C.white })}
    ${rows}
    <line x1="${PAD}" y1="${itemsY + items.length * itemH - 60}" x2="${W - PAD}" y2="${itemsY + items.length * itemH - 60}" stroke="${C.gray}" stroke-width="1" opacity="0.5"/>
    ${counter || ""}
  `);
}

function gridToolsSVG({ title, tools, counter, footnote }) {
  const cols = 3;
  const rows = 4;
  const gridTop = 380;
  const gridBottom = 1150;
  const cellW = (W - 2 * PAD) / cols;
  const cellH = (gridBottom - gridTop) / rows;

  const cells = tools
    .map((t, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = PAD + c * cellW;
      const y = gridTop + r * cellH;
      return `
      <rect x="${x + 8}" y="${y + 8}" width="${cellW - 16}" height="${cellH - 16}" fill="#0F0F0F" stroke="${C.line}" stroke-width="1" rx="4"/>
      ${textPath({
        text: t,
        font: FONTS.sgB,
        size: 22,
        x: x + cellW / 2,
        y: y + cellH / 2 + 8,
        fill: C.acid,
        anchor: "middle",
      })}
    `;
    })
    .join("\n");

  return svgWrap(`
    ${fullOverlay(0.82)}
    ${brandMark()}
    ${textPath({ text: title, font: FONTS.anton, size: 96, x: PAD, y: 280, fill: C.white })}
    ${cells}
    ${footnote ? textPath({
      text: footnote,
      font: FONTS.sgM,
      size: 26,
      x: W / 2,
      y: H - 120,
      fill: C.ghost,
      anchor: "middle",
    }) : ""}
    ${counter || ""}
  `);
}

function priceRevealSVG({ kicker, oldPrice, newPrice, sub, counter }) {
  return svgWrap(`
    ${overlayGradient(0.75, "bottom")}
    ${brandMark()}
    ${textPath({ text: kicker, font: FONTS.sgB, size: 32, x: PAD, y: 320, fill: C.acid, letterSpacing: 4 })}
    ${textPath({ text: oldPrice, font: FONTS.jbmB, size: 80, x: PAD, y: 500, fill: C.red, strike: true })}
    ${textPath({ text: newPrice, font: FONTS.anton, size: 240, x: PAD, y: 850, fill: C.acid })}
    ${multilinePath({
      lines: (sub || "").split("\n"),
      font: FONTS.sgM,
      size: 32,
      x: PAD,
      y: 940,
      fill: C.white,
      lineHeight: 1.2,
    })}
    ${counter || ""}
  `);
}

function faqSVG({ question, answer, counter, accent = "?" }) {
  return svgWrap(`
    ${fullOverlay(0.7)}
    ${brandMark()}
    <g opacity="0.18">
      ${textPath({ text: accent, font: FONTS.anton, size: 420, x: W - PAD + 40, y: 480, fill: C.acid, anchor: "end" })}
    </g>
    ${textPath({ text: question, font: FONTS.anton, size: 112, x: PAD, y: 550, fill: C.white })}
    <rect x="${PAD}" y="610" width="120" height="6" fill="${C.acid}"/>
    ${multilinePath({
      lines: answer.split("\n"),
      font: FONTS.sgM,
      size: 34,
      x: PAD,
      y: 730,
      fill: C.white,
      lineHeight: 1.3,
    })}
    ${counter || ""}
  `);
}

function ctaSVG({ title, sub, url, counter }) {
  return svgWrap(`
    ${overlayGradient(0.55, "bottom")}
    ${brandMark()}
    ${multilinePath({
      lines: title.split("\n"),
      font: FONTS.anton,
      size: 150,
      x: PAD,
      y: 700,
      fill: C.white,
      lineHeight: 1.02,
    })}
    <rect x="${PAD}" y="990" width="180" height="8" fill="${C.acid}"/>
    ${textPath({ text: url, font: FONTS.jbmB, size: 38, x: PAD, y: 1070, fill: C.acid })}
    ${textPath({ text: sub || "", font: FONTS.sgM, size: 30, x: PAD, y: 1130, fill: C.white })}
    <g transform="translate(${PAD + 280}, 1107)">
      <path d="M 0 15 L 40 15 M 28 3 L 40 15 L 28 27" stroke="${C.acid}" stroke-width="4" fill="none" stroke-linecap="square"/>
    </g>
    ${counter || ""}
  `);
}

// ───────────── Slides (30) ─────────────

const SLIDES = [
  // ───── C1 · "La factura que no sabías que pagabas"
  { id: "C1-S01", bg: "BG-01-tickets", render: (c) => heroTitleSVG({
      title: "¿CUÁNTO PAGAS\nAL AÑO EN IA?",
      sub: "Suma. No estimes. Suma.",
      counter: c,
      titleSize: 128,
    })
  },
  { id: "C1-S02", bg: "BG-01-tickets", render: (c) => ticketListSVG({
      kicker: "PRECIO OFICIAL · ABRIL 2026",
      items: [
        ["ChatGPT Plus", "20 €"], ["Claude Pro", "18 €"],
        ["Gemini Advanced", "22 €"], ["Canva Pro", "12 €"],
        ["CapCut Pro", "8 €"], ["Freepik Premium+", "12 €"],
        ["Higgsfield", "15 €"], ["ElevenLabs", "22 €"],
        ["Minea", "49 €"], ["Dropsip.io", "30 €"],
        ["PiPiAds", "70 €"], ["Seedance", "30 €"],
      ],
      totalLabel: "TOTAL AL MES",
      totalValue: "308 €",
      counter: c,
      footnote: "Y aún no has empezado a trabajar.",
    })
  },
  { id: "C1-S03", bg: null, render: (c) => numberHeroSVG({
      number: "308 €",
      over: "TOTAL MENSUAL",
      under: "AL MES. SÓLO PARA EMPEZAR.",
      counter: c,
      invert: true,
    })
  },
  { id: "C1-S04", bg: "BG-03-billetes", render: (c) => heroTitleSVG({
      title: "3.696 €\nAL AÑO.",
      sub: "Un MacBook. La entrada de un coche. 14 meses de Netflix.",
      counter: c,
      titleSize: 156,
      titleFill: C.acid,
    })
  },
  { id: "C1-S05", bg: "BG-02-puerta", render: (c) => heroTitleSVG({
      title: "ENTRA EN\nDARK ROOM.",
      sub: "12 herramientas. Un solo sitio. 0,83 € al día.",
      counter: c,
      titleSize: 140,
    })
  },
  { id: "C1-S06", bg: null, render: (c) => gridToolsSVG({
      title: "TODO ESTO DENTRO",
      tools: ["CHATGPT", "CLAUDE", "GEMINI", "CANVA", "CAPCUT", "FREEPIK+", "HIGGSFIELD", "ELEVENLABS", "MINEA", "DROPSIP", "PIPIADS", "SEEDANCE"],
      counter: c,
      footnote: "Un login. Una web. Cero cuotas cruzadas.",
    })
  },
  { id: "C1-S07", bg: null, render: (c) => priceRevealSVG({
      kicker: "DARK ROOM PLAN",
      oldPrice: "308 € / mes",
      newPrice: "24,90 €",
      sub: "Al mes. Lo que pagabas sólo por Claude.\nCon 11 herramientas extra.",
      counter: c,
    })
  },
  { id: "C1-S08", bg: null, render: (c) => heroTitleSVG({
      title: "O PAGA 349 €\nUNA VEZ.",
      sub: "Amortiza en 35 días. 10.373 € ahorrados en 3 años.",
      counter: c,
      titleSize: 140,
      titleFill: C.acid,
    })
  },
  { id: "C1-S09", bg: null, render: (c) => faqSVG({
      question: "¿Y LA TRAMPA?",
      answer: "Licencias reales compartidas.\nSoporte en Discord 24/7.\nLifetime es lifetime. Sin letra pequeña.\nContrato por escrito antes de pagar.",
      counter: c,
    })
  },
  { id: "C1-S10", bg: "BG-02-puerta", render: (c) => ctaSVG({
      title: "ABRE LA\nPUERTA.",
      sub: "Link en bio.",
      url: "darkroomcreative.cloud",
      counter: c,
    })
  },

  // ───── C2 · "Stack Creador 2026"
  { id: "C2-S01", bg: "BG-04-escritorio", render: (c) => heroTitleSVG({
      title: "EL STACK IA\nDEL CREADOR 2026.",
      sub: "12 herramientas premium. 0,83 € al día.",
      counter: c,
      titleSize: 108,
    })
  },
  { id: "C2-S02", bg: null, render: (c) => heroTitleSVG({
      title: "ANTES GASTABA\n308 € AL MES.",
      sub: "Y ni usaba la mitad. Ahora pago 24,90 € y uso TODO.",
      counter: c,
      titleSize: 118,
      titleFill: C.acid,
    })
  },
  { id: "C2-S03", bg: null, render: (c) => sectionListSVG({
      num: "01",
      subTitle: "TEXTO / RAZONAMIENTO",
      title: "ESCRIBIR.",
      items: [
        ["ChatGPT Plus", "Guiones, prompts, análisis rápido"],
        ["Claude Pro", "Redacción larga, razonamiento duro"],
        ["Gemini Advanced", "Búsqueda en vivo + documentos"],
      ],
      counter: c,
    })
  },
  { id: "C2-S04", bg: null, render: (c) => sectionListSVG({
      num: "02",
      subTitle: "DISEÑO & EDICIÓN",
      title: "DISEÑAR.",
      items: [
        ["Canva Pro", "Posts, carruseles, documentos"],
        ["CapCut Pro", "Reels, TikToks, subtítulos"],
        ["Freepik Premium+", "Fotos, vectores, mockups"],
      ],
      counter: c,
    })
  },
  { id: "C2-S05", bg: null, render: (c) => sectionListSVG({
      num: "03",
      subTitle: "IA GENERATIVA",
      title: "GENERAR.",
      items: [
        ["Higgsfield", "Video IA cinemático"],
        ["Seedance", "Animación de producto"],
        ["ElevenLabs", "Voz IA realista"],
      ],
      counter: c,
    })
  },
  { id: "C2-S06", bg: null, render: (c) => sectionListSVG({
      num: "04",
      subTitle: "ECOMMERCE & ADS",
      title: "VENDER.",
      items: [
        ["Minea", "Spy ads ganadores"],
        ["Dropsip.io", "Auto-sourcing productos"],
        ["PiPiAds", "Spy TikTok ads"],
      ],
      counter: c,
    })
  },
  { id: "C2-S07", bg: null, render: (c) => gridToolsSVG({
      title: "PAGARLO APARTE:",
      tools: ["20€ GPT", "18€ CLAUDE", "22€ GEMINI", "12€ CANVA", "8€ CAPCUT", "12€ FREEPIK", "15€ HIGGSF.", "22€ 11LABS", "49€ MINEA", "30€ DROPSIP", "70€ PIPIADS", "30€ SEEDANCE"],
      counter: c,
      footnote: "308 € al mes. Y la mitad sin usar.",
    })
  },
  { id: "C2-S08", bg: "BG-02-puerta", render: (c) => priceRevealSVG({
      kicker: "O TODO EN DARK ROOM",
      oldPrice: "308 € / mes",
      newPrice: "24,90 €",
      sub: "Un solo login. Un solo sitio. Un solo precio.",
      counter: c,
    })
  },
  { id: "C2-S09", bg: "BG-06-reloj", render: (c) => heroTitleSVG({
      title: "349 €\nPARA SIEMPRE.",
      sub: "Amortizado en 35 días. 10.373 € ahorrados en 3 años.",
      counter: c,
      titleSize: 156,
      titleFill: C.acid,
    })
  },
  { id: "C2-S10", bg: "BG-02-puerta", render: (c) => ctaSVG({
      title: "ENTRA.",
      sub: "Link en bio.",
      url: "darkroomcreative.cloud",
      counter: c,
    })
  },

  // ───── C3 · "Esto debería ser ilegal"
  { id: "C3-S01", bg: "BG-05-cinta", render: (c) => heroTitleSVG({
      title: "ESTO DEBERÍA\nSER ILEGAL.",
      sub: "Lee hasta el final. Luego decides.",
      counter: c,
      titleSize: 128,
    })
  },
  { id: "C3-S02", bg: null, render: (c) => heroTitleSVG({
      title: "12 HERRAMIENTAS.\n24,90 €/MES.\nO 349 € PARA SIEMPRE.",
      sub: "Valor oficial sumado: 3.696 €/año. No es bait.",
      counter: c,
      titleSize: 84,
      titleFill: C.acid,
    })
  },
  { id: "C3-S03", bg: null, render: (c) => faqSVG({
      question: "¿ES LEGAL?",
      answer: "Sí. Licencias multi-usuario legítimas.\nDark Room compra y comparte según ToS.\nNo es cracking. Es group buy de toda la vida.",
      counter: c,
    })
  },
  { id: "C3-S04", bg: null, render: (c) => faqSVG({
      question: "¿VA LENTO?",
      answer: "Infraestructura escalada en Europa.\nSesión propia por usuario.\nNo es un Telegram con 300 tíos\ncompartiendo 1 login.",
      counter: c,
    })
  },
  { id: "C3-S05", bg: null, render: (c) => faqSVG({
      question: "¿Y SI CAMBIAN?",
      answer: "Si una herramienta deja de ser compartible,\nentra otra equivalente.\nEl stack evoluciona contigo.\nSin coste extra.",
      counter: c,
    })
  },
  { id: "C3-S06", bg: null, render: (c) => faqSVG({
      question: "¿SOPORTE?",
      answer: "Discord 24/7 + WhatsApp directo.\nMedia de respuesta: menos de 15 minutos.\nNo tickets de mierda que tardan 3 días.",
      counter: c,
    })
  },
  { id: "C3-S07", bg: null, render: (c) => faqSVG({
      question: "¿LIFETIME ES LIFETIME?",
      answer: "Un solo pago de 349 €.\nAcceso al catálogo mientras Dark Room exista.\nContrato por escrito antes de pagar.",
      counter: c,
    })
  },
  { id: "C3-S08", bg: null, render: (c) => faqSVG({
      question: "¿POR QUÉ TAN BARATO?",
      answer: "1.000 usuarios a 24,90 € cubren\n12 cuentas premium compartidas.\nEl margen está en el volumen.\nNo en tu bolsillo.",
      counter: c,
    })
  },
  { id: "C3-S09", bg: "BG-06-reloj", render: (c) => heroTitleSVG({
      title: "EL LIFETIME\nNO DURA\nA ESTE PRECIO.",
      sub: "Al llegar a 500 lifetime sube a 499 €. Hoy: 349 €.",
      counter: c,
      titleSize: 104,
      titleFill: C.acid,
    })
  },
  { id: "C3-S10", bg: "BG-02-puerta", render: (c) => ctaSVG({
      title: "ABRE LA PUERTA\nANTES QUE EL RESTO.",
      sub: "Link en bio.",
      url: "darkroomcreative.cloud",
      counter: c,
    })
  },
];

// ───────────── Render pipeline ─────────────

async function renderSlide(slide) {
  const carruselNum = parseInt(slide.id.slice(1, 2), 10);
  const slideNum = parseInt(slide.id.slice(4, 6), 10);
  const cLabel = `C${carruselNum}`;
  const counter = pageDot(slideNum, 10, cLabel);

  let bgBuf = await loadBg(slide.bg);
  if (!bgBuf) bgBuf = await solidBg();

  const svg = slide.render(counter);
  const svgBuf = Buffer.from(svg);

  const out = await sharp(bgBuf)
    .composite([{ input: svgBuf, top: 0, left: 0 }])
    .png({ quality: 95, compressionLevel: 9 })
    .toBuffer();

  const outPath = path.join(OUT_DIR, `${slide.id}.png`);
  fs.writeFileSync(outPath, out);
  return outPath;
}

async function main() {
  console.log(`Composing ${SLIDES.length} slides (opentype.js → paths)...\n`);
  let ok = 0;
  const only = process.argv[2];
  for (const s of SLIDES) {
    if (only && !s.id.startsWith(only)) continue;
    process.stdout.write(`→ ${s.id} ... `);
    try {
      const p = await renderSlide(s);
      const kb = (fs.statSync(p).size / 1024).toFixed(0);
      console.log(`ok (${kb} KB)`);
      ok++;
    } catch (err) {
      console.log(`FAIL ${err.message.slice(0, 200)}`);
    }
  }
  console.log(`\nDone: ${ok} slides rendered.\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
