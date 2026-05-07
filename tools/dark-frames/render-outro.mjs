#!/usr/bin/env node
/**
 * Genera el outro Dark Room 2s reusable (concatenado al final de cada DARK_FRAMES).
 *
 * Output: tools/dark-frames/assets/outro-darkroom-2s.mp4 (1080×1920 9:16, 2s, 30fps)
 *
 * Componentes:
 *   - Fondo bg #0A0A0A puro con grano sutil 2%
 *   - Logo "DARK ROOM" en Anton ALL CAPS 160px color acid #CFFF00 centro
 *   - Línea inferior JetBrains Mono 32px color #F2F2F2: "darkroomcreative.cloud · 24,90€/mes"
 *   - Animación: fade-in 0.3s + hold 1.4s + fade-out 0.3s
 *
 * Genera UNA SOLA VEZ. Reusado en todas las piezas DARK_FRAMES.
 *
 * Uso:
 *   node tools/dark-frames/render-outro.mjs [--force]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORCE = process.argv.includes("--force");

const outroPath = path.join(__dirname, "assets", "outro-darkroom-2s.mp4");
const tmpDir = path.join(__dirname, "assets", ".tmp-outro");

if (fs.existsSync(outroPath) && !FORCE) {
  console.log(`✅ outro ya existe en ${outroPath}`);
  console.log("   Para regenerar: añade --force");
  process.exit(0);
}

fs.mkdirSync(tmpDir, { recursive: true });
fs.mkdirSync(path.dirname(outroPath), { recursive: true });

console.log("🎬 Generando outro Dark Room 2s…");

// ─── Generar frame estático PNG con Sharp ─────────────────────────

const W = 1080;
const H = 1920;

const fontAnton = path.resolve(__dirname, "..", "..", "carruseles-darkroom", "fonts", "Anton-Regular.ttf");
const fontMono = path.resolve(__dirname, "..", "..", "carruseles-darkroom", "fonts", "JetBrainsMono-Regular.ttf");

if (!fs.existsSync(fontAnton)) {
  console.error(`ERROR: font Anton no existe en ${fontAnton}`);
  console.error("       Verifica carruseles-darkroom/fonts/");
  process.exit(1);
}

const svgFrame = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style type="text/css">
      @font-face { font-family: 'Anton'; src: url('file://${fontAnton.replace(/\\/g, "/")}') format('truetype'); }
      @font-face { font-family: 'JetBrains Mono'; src: url('file://${fontMono.replace(/\\/g, "/")}') format('truetype'); }
    </style>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="#0A0A0A"/>
  <text x="${W / 2}" y="${H / 2 - 20}" font-family="Anton" font-size="200" font-weight="400"
        fill="#CFFF00" text-anchor="middle" dominant-baseline="middle"
        letter-spacing="-6">DARK ROOM</text>
  <text x="${W / 2}" y="${H / 2 + 100}" font-family="JetBrains Mono" font-size="32"
        fill="#F2F2F2" text-anchor="middle" dominant-baseline="middle"
        letter-spacing="3">darkroomcreative.cloud  ·  24,90€/mes</text>
</svg>
`;

const framePng = path.join(tmpDir, "frame.png");
await sharp(Buffer.from(svgFrame)).png().toFile(framePng);
console.log("  ✓ frame PNG generado");

// ─── ffmpeg: imagen estática → video 2s 30fps + grano sutil + fade ────

const cmd = [
  "ffmpeg -y",
  `-loop 1 -t 2 -framerate 30 -i "${framePng}"`,
  // Filter: noise grano 2% + fade in/out
  `-vf "noise=alls=10:allf=t,fade=t=in:st=0:d=0.3,fade=t=out:st=1.7:d=0.3,format=yuv420p"`,
  "-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p",
  "-r 30 -t 2",
  "-an", // sin audio (el outro es silencioso, pieza añade audio si quiere)
  `"${outroPath}"`,
].join(" ");

console.log("  ⏳ ffmpeg render outro…");
execSync(cmd, { stdio: "pipe" });

// Verificar dimensiones
const probe = execSync(
  `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of json "${outroPath}"`,
  { encoding: "utf8" },
);
const info = JSON.parse(probe).streams[0];
console.log(`  ✓ ${path.basename(outroPath)} · ${info.width}×${info.height} · ${parseFloat(info.duration).toFixed(2)}s`);

if (parseInt(info.width) !== W || parseInt(info.height) !== H) {
  console.error(`  ⚠️  dimensiones inesperadas (${info.width}×${info.height}, esperado ${W}×${H})`);
  process.exit(1);
}

// Cleanup tmp
fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(`\n✅ Outro generado: ${outroPath}`);
console.log("   Reusado por render-piece.mjs en todas las piezas DARK_FRAMES.");
console.log("   Verifica visualmente abriendo el MP4 antes de continuar.");
