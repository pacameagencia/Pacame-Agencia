#!/usr/bin/env node
/**
 * Pack 2 · Dark Room UGC Kit · 6 WhatsApp meme screenshots 1080×1350.
 * Simulación visual de chat WhatsApp (header verde, burbujas gris/verde claro).
 * Output: ugc-kit/pack-2-whatsapp/WA01..WA06.png
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import opentype from "opentype.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, "fonts");
const OUT_DIR = path.join(__dirname, "ugc-kit", "pack-2-whatsapp");
fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 1080;
const H = 1350;

// WhatsApp dark theme colors (más moderno 2026)
const C = {
  headerBg: "#1F2C34",
  chatBg: "#0B141A",
  bubbleIn: "#1F2C34",   // gris oscuro (recibido, izquierda)
  bubbleOut: "#005C4B",  // verde oscuro (enviado, derecha)
  textIn: "#E9EDEF",
  textOut: "#E9EDEF",
  meta: "#8696A0",
  accentGreen: "#00A884",
  white: "#FFFFFF",
};

const FONTS = {
  sgB: opentype.loadSync(path.join(FONTS_DIR, "SpaceGrotesk-Bold.ttf")),
  sgM: opentype.loadSync(path.join(FONTS_DIR, "SpaceGrotesk-Medium.ttf")),
};

function textPath({ text, font, size, x, y, fill, anchor = "start" }) {
  if (!text) return "";
  let drawX = x;
  const w = font.getAdvanceWidth(text, size);
  if (anchor === "end") drawX = x - w;
  else if (anchor === "middle") drawX = x - w / 2;
  return font.getPath(text, drawX, y, size).toSVG(2).replace(/<path /, `<path fill="${fill}" `);
}

function wrapTextLines(font, text, size, maxW) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (font.getAdvanceWidth(test, size) <= maxW) cur = test;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function multilineText({ lines, font, size, x, y, fill, lineHeight = 1.3 }) {
  return lines.map((l, i) =>
    font.getPath(l, x, y + i * size * lineHeight, size).toSVG(2).replace(/<path /, `<path fill="${fill}" `)
  ).join("\n");
}

// Render a single chat bubble. Returns SVG fragment + new Y position.
function bubble({ text, side, time, y, name = null, read = true }) {
  const font = FONTS.sgM;
  const size = 30;
  const padX = 24;
  const padY = 22;
  const margin = 50;
  const maxBubbleW = W - 2 * margin - 100;
  const lines = wrapTextLines(font, text, size, maxBubbleW);
  // Calculate bubble width based on widest line
  let widest = 0;
  for (const l of lines) widest = Math.max(widest, font.getAdvanceWidth(l, size));
  const bubbleW = Math.max(widest + padX * 2, 200);
  const bubbleH = lines.length * size * 1.3 + padY * 2 + (time ? 26 : 0);
  const x = side === "in" ? margin : W - margin - bubbleW;
  const fill = side === "in" ? C.bubbleIn : C.bubbleOut;
  const tail = side === "in"
    ? `<path d="M ${x} ${y + 14} L ${x - 16} ${y} L ${x} ${y + 0} Z" fill="${fill}"/>`
    : `<path d="M ${x + bubbleW} ${y + 14} L ${x + bubbleW + 16} ${y} L ${x + bubbleW} ${y + 0} Z" fill="${fill}"/>`;
  const txt = lines.map((l, i) =>
    textPath({
      text: l,
      font,
      size,
      x: x + padX,
      y: y + padY + (i + 1) * size * 1.05 - 4,
      fill: C.textIn,
    })
  ).join("\n");
  let timeBlock = "";
  if (time) {
    const timeText = time;
    const timeY = y + bubbleH - 16;
    const timeX = x + bubbleW - padX;
    timeBlock = textPath({
      text: timeText,
      font: FONTS.sgM,
      size: 20,
      x: timeX,
      y: timeY,
      fill: C.meta,
      anchor: "end",
    });
    if (side === "out" && read) {
      // double check marks blue
      const checkX = timeX - 50;
      const checkY = timeY - 4;
      timeBlock += `
        <path d="M ${checkX - 30} ${checkY} l 8 8 l 18 -18" stroke="#53BDEB" stroke-width="3" fill="none"/>
        <path d="M ${checkX - 16} ${checkY} l 8 8 l 18 -18" stroke="#53BDEB" stroke-width="3" fill="none"/>
      `;
    }
  }
  return {
    svg: `
      <rect x="${x}" y="${y}" width="${bubbleW}" height="${bubbleH}" rx="14" fill="${fill}"/>
      ${tail}
      ${txt}
      ${timeBlock}
    `,
    nextY: y + bubbleH + 22,
  };
}

function header({ contactName, status = "en línea" }) {
  const headerH = 160;
  return `
    <rect x="0" y="0" width="${W}" height="${headerH}" fill="${C.headerBg}"/>
    <!-- back arrow -->
    <path d="M 50 80 L 90 60 L 90 100 Z" fill="${C.white}"/>
    <!-- avatar circle -->
    <circle cx="170" cy="80" r="44" fill="${C.accentGreen}"/>
    ${textPath({ text: contactName.charAt(0).toUpperCase(), font: FONTS.sgB, size: 44, x: 170, y: 95, fill: C.white, anchor: "middle" })}
    <!-- name -->
    ${textPath({ text: contactName, font: FONTS.sgB, size: 38, x: 240, y: 75, fill: C.white })}
    ${textPath({ text: status, font: FONTS.sgM, size: 24, x: 240, y: 110, fill: C.meta })}
    <!-- icons (camera + phone + menu) -->
    <circle cx="${W - 200}" cy="80" r="18" fill="none" stroke="${C.white}" stroke-width="3"/>
    <circle cx="${W - 200}" cy="80" r="6" fill="${C.white}"/>
    <path d="M ${W - 130} 65 Q ${W - 110} 65, ${W - 110} 85 L ${W - 110} 95 Q ${W - 130} 95, ${W - 130} 75 Z" fill="${C.white}"/>
    <circle cx="${W - 50}" cy="70" r="5" fill="${C.white}"/>
    <circle cx="${W - 50}" cy="85" r="5" fill="${C.white}"/>
    <circle cx="${W - 50}" cy="100" r="5" fill="${C.white}"/>
  `;
}

function footer() {
  const footerY = H - 120;
  return `
    <rect x="0" y="${footerY}" width="${W}" height="120" fill="${C.headerBg}"/>
    <rect x="40" y="${footerY + 25}" width="${W - 240}" height="70" rx="35" fill="#2A3942"/>
    ${textPath({ text: "Escribe un mensaje", font: FONTS.sgM, size: 26, x: 90, y: footerY + 70, fill: C.meta })}
    <circle cx="${W - 80}" cy="${footerY + 60}" r="35" fill="${C.accentGreen}"/>
    <path d="M ${W - 95} ${footerY + 50} L ${W - 65} ${footerY + 60} L ${W - 95} ${footerY + 70} Z" fill="${C.white}"/>
  `;
}

function svgWrap(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="0" y="0" width="${W}" height="${H}" fill="${C.chatBg}"/>
  ${inner}
</svg>`;
}

function buildChat({ contactName, status, messages }) {
  let inner = header({ contactName, status });
  let y = 230;
  for (const m of messages) {
    const b = bubble({ text: m.text, side: m.side, time: m.time, y, read: m.read !== false });
    inner += b.svg;
    y = b.nextY;
  }
  inner += footer();
  return svgWrap(inner);
}

// ── 6 WhatsApp memes ──
const MEMES = [
  {
    id: "WA01-como-tienes",
    contact: "Carlos · colega",
    status: "en línea",
    messages: [
      { side: "in", text: "tío cómo cojones tienes ChatGPT Plus, Claude, Canva y Freepik premium a la vez", time: "14:22" },
      { side: "out", text: "Dark Room. 24,90 €/mes.", time: "14:22", read: true },
      { side: "in", text: "espera qué", time: "14:22" },
      { side: "in", text: "y eso es legal??", time: "14:23" },
      { side: "out", text: "12 herramientas. Todas oficiales. Sí.", time: "14:23", read: true },
      { side: "out", text: "Pásame tu paypal, te invito al primer mes.", time: "14:23", read: true },
    ],
  },
  {
    id: "WA02-no-me-lo-crees",
    contact: "Marta · clienta",
    status: "en línea",
    messages: [
      { side: "out", text: "te juro que pago menos de 1€ al día por todo el stack IA", time: "20:05", read: true },
      { side: "in", text: "no me lo creo", time: "20:05" },
      { side: "in", text: "demuéstralo 🙄", time: "20:05" },
      { side: "out", text: "darkroomcreative.cloud", time: "20:06", read: true },
      { side: "out", text: "pruébalo y me cuentas.", time: "20:06", read: true },
      { side: "in", text: "ostia tío", time: "20:11" },
      { side: "in", text: "POR QUÉ NO ME LO HABÍAS DICHO ANTES", time: "20:11" },
    ],
  },
  {
    id: "WA03-300-mes",
    contact: "Pablo · socio",
    status: "escribiendo…",
    messages: [
      { side: "in", text: "estoy revisando los gastos del mes…", time: "11:40" },
      { side: "in", text: "estoy gastando 312€ al mes en herramientas", time: "11:40" },
      { side: "in", text: "ChatGPT Claude Canva CapCut Freepik ElevenLabs Minea PiPiAds…", time: "11:41" },
      { side: "in", text: "esto no puede ser", time: "11:41" },
      { side: "out", text: "Para de hacer eso.", time: "11:42", read: true },
      { side: "out", text: "darkroomcreative.cloud", time: "11:42", read: true },
      { side: "out", text: "Las MISMAS por 24,90 €/mes. O 349 € lifetime.", time: "11:42", read: true },
    ],
  },
  {
    id: "WA04-encontre-group-buy",
    contact: "Andrea · creator",
    status: "en línea",
    messages: [
      { side: "in", text: "encontré el group buy de los buenos", time: "23:14" },
      { side: "out", text: "cuál?", time: "23:14", read: true },
      { side: "in", text: "Dark Room", time: "23:15" },
      { side: "in", text: "no me cae con saldo bajo, no falla, todo oficial", time: "23:15" },
      { side: "in", text: "y soporte real en Discord", time: "23:15" },
      { side: "out", text: "Probando ahora.", time: "23:15", read: true },
      { side: "in", text: "el lifetime de 349€ es la jugada. lo amortizas en mes y medio.", time: "23:16" },
    ],
  },
  {
    id: "WA05-cunyado-no-deja",
    contact: "Mamá ❤️",
    status: "en línea",
    messages: [
      { side: "in", text: "cariño tu primo no para de hablarme de no sé qué dark room", time: "18:30" },
      { side: "in", text: "que si pago menos al año por todas esas IAs que usas", time: "18:30" },
      { side: "in", text: "qué le digo??", time: "18:30" },
      { side: "out", text: "Mamá, déjale que te lo enseñe.", time: "18:31", read: true },
      { side: "out", text: "darkroomcreative.cloud", time: "18:31", read: true },
      { side: "out", text: "24,90€/mes. Tiene razón.", time: "18:31", read: true },
      { side: "in", text: "vale cariño 💚", time: "18:32" },
    ],
  },
  {
    id: "WA06-clienta-precio",
    contact: "Cliente · email",
    status: "visto a las 16:02",
    messages: [
      { side: "in", text: "el presupuesto del proyecto incluye herramientas?", time: "15:55" },
      { side: "out", text: "Sí. Va todo dentro.", time: "15:56", read: true },
      { side: "in", text: "qué herramientas usas?", time: "15:56" },
      { side: "out", text: "Stack completo IA: ChatGPT, Claude, Canva, CapCut, Freepik, ElevenLabs, Higgsfield, Seedance.", time: "15:57", read: true },
      { side: "in", text: "joder eso son 300€/mes solo en software", time: "15:58" },
      { side: "out", text: "Lo tengo en Dark Room por 24,90€.", time: "15:59", read: true },
      { side: "out", text: "Por eso mis precios son mejores que los de la agencia que te pasó presupuesto antes.", time: "15:59", read: true },
    ],
  },
];

async function renderMeme(meme) {
  const svg = buildChat({ contactName: meme.contact, status: meme.status, messages: meme.messages });
  const bg = await sharp({ create: { width: W, height: H, channels: 3, background: C.chatBg } }).png().toBuffer();
  const out = await sharp(bg).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png({ quality: 95, compressionLevel: 9 }).toBuffer();
  const outPath = path.join(OUT_DIR, `${meme.id}.png`);
  fs.writeFileSync(outPath, out);
  return outPath;
}

async function main() {
  console.log(`Pack 2 · WhatsApp memes · ${MEMES.length} PNGs\n`);
  let ok = 0;
  for (const m of MEMES) {
    process.stdout.write(`→ ${m.id} ... `);
    try {
      const p = await renderMeme(m);
      const kb = (fs.statSync(p).size / 1024).toFixed(0);
      console.log(`ok (${kb} KB)`);
      ok++;
    } catch (err) {
      console.log(`FAIL ${err.message.slice(0, 200)}`);
    }
  }
  console.log(`\nDone: ${ok}/${MEMES.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
