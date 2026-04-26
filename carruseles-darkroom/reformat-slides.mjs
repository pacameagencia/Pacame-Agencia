#!/usr/bin/env node
/**
 * Reformatea los 5 slides RAW (1024×1536) a 1080×1350 (IG feed 4:5)
 * con estrategia POR SLIDE para preservar el texto crítico de cada uno.
 *
 * Slides 1-4: position:top (headers de texto arriba)
 * Slide 5: position:center (URL + sub críticos en zona media-baja)
 *
 * Adicionalmente: añade watermark "@darkroom" sintético en cada slide
 * con Sharp SVG overlay en esquina superior-derecha (zona libre en raws).
 *
 * También genera versión Story 1080×1920 con padding negro.
 *
 * Cero coste API · solo Sharp local.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "output", "carrusel-gpt-image-2");
const RAW_DIR = path.join(OUT_DIR, "raw");
const FEED_DIR = path.join(OUT_DIR, "feed");
const STORY_DIR = path.join(OUT_DIR, "story");
fs.mkdirSync(FEED_DIR, { recursive: true });
fs.mkdirSync(STORY_DIR, { recursive: true });

const DARK_BG = { r: 10, g: 10, b: 10, alpha: 1 };

// Estrategia por slide
const SLIDE_CONFIG = [
  { n: 1, position: "top",    role: "HOOK"        },
  { n: 2, position: "top",    role: "DOLOR"       },
  { n: 3, position: "top",    role: "REVELACION"  },
  { n: 4, position: "top",    role: "SOLUCION"    },
  { n: 5, position: "center", role: "CTA"         }, // preserva URL
];

// SVG overlay watermark "@darkroom" en esquina superior-derecha · sutil pero legible
function watermarkSvg(width = 1080, height = 1350) {
  const fontSize = 22;
  const padding = 36;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <text
    x="${width - padding}"
    y="${padding + fontSize}"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-size="${fontSize}"
    font-weight="500"
    letter-spacing="3"
    fill="#CFFF00"
    fill-opacity="0.65"
    text-anchor="end">@darkroom</text>
</svg>`.trim();
}

async function reformatFeed(rawPath, outPath, position) {
  const watermark = Buffer.from(watermarkSvg(1080, 1350));
  await sharp(rawPath)
    .resize(1080, 1350, { fit: "cover", position })
    .composite([{ input: watermark, top: 0, left: 0 }])
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(outPath);
  return fs.statSync(outPath).size;
}

async function reformatStory(rawPath, outPath) {
  const watermark = Buffer.from(watermarkSvg(1080, 1920));
  await sharp(rawPath)
    .resize(1080, 1920, { fit: "contain", background: DARK_BG })
    .composite([{ input: watermark, top: 0, left: 0 }])
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(outPath);
  return fs.statSync(outPath).size;
}

async function main() {
  console.log("Reformateando 5 slides con estrategia per-slide + watermark @darkroom sintético\n");

  console.log("=== FEED (1080×1350 · 4:5) ===");
  for (const cfg of SLIDE_CONFIG) {
    const raw = path.join(RAW_DIR, `slide-${cfg.n}.png`);
    if (!fs.existsSync(raw)) {
      console.log(`  ✗ slide-${cfg.n} raw missing`);
      continue;
    }
    const out = path.join(FEED_DIR, `slide-${cfg.n}.png`);
    const sz = await reformatFeed(raw, out, cfg.position);
    console.log(`  ✓ feed/slide-${cfg.n}.png  (${(sz / 1024).toFixed(0)} KB · ${cfg.role} · position=${cfg.position})`);
  }

  console.log("\n=== STORY (1080×1920 · 9:16) ===");
  for (const cfg of SLIDE_CONFIG) {
    const raw = path.join(RAW_DIR, `slide-${cfg.n}.png`);
    if (!fs.existsSync(raw)) continue;
    const out = path.join(STORY_DIR, `slide-${cfg.n}.png`);
    const sz = await reformatStory(raw, out);
    console.log(`  ✓ story/slide-${cfg.n}.png (${(sz / 1024).toFixed(0)} KB)`);
  }

  console.log("\n=== Reemplazando slides en output/ root con feed/ ===");
  for (const cfg of SLIDE_CONFIG) {
    const src = path.join(FEED_DIR, `slide-${cfg.n}.png`);
    const dst = path.join(OUT_DIR, `slide-${cfg.n}.png`);
    fs.copyFileSync(src, dst);
    console.log(`  ✓ slide-${cfg.n}.png`);
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
