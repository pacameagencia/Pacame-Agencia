#!/usr/bin/env node
/**
 * Loop seamless (boomerang) para reels virales.
 *
 * Convierte un .mp4 corto (4-8s) en un loop suave que se reproduce continuo:
 *   forward → reverse → forward → ... durante N segundos totales.
 *
 * Por qué: el santo grial visual dice que los reels que se reproducen en bucle
 * sin corte visible aumentan retention (repetitive viewing). Hasta 10s suele
 * ser el sweet spot para que no se note la repetición.
 *
 * Uso:
 *   node loop-seamless.mjs <input.mp4> [--target=10] [--mode=boomerang|copy] [--output=loop.mp4]
 *
 * Ejemplos:
 *   # Loop boomerang de 10s a partir de un clip Veo de 6s
 *   node loop-seamless.mjs clip-S1.mp4 --target=10 --mode=boomerang
 *
 *   # Loop copy (concat directo) — solo si el primer y último frame ya casan
 *   node loop-seamless.mjs clip.mp4 --target=10 --mode=copy
 *
 *   # Output explícito
 *   node loop-seamless.mjs clip.mp4 --output=output/clip-loop.mp4
 *
 * Notas:
 *   - boomerang elimina el "salto" entre último frame y primero invirtiendo el clip.
 *     El ojo no detecta la inversión si el motion es orgánico (humo, agua, partículas).
 *   - copy concatena el clip N veces. Solo funciona si el primer frame ≈ último frame
 *     (e.g., clips Kling con start frame == end frame, o clips ya pensados para loop).
 *   - El audio se descarta por defecto (los reels suelen llevar audio externo TTS+música).
 *     Si quieres preservar audio, pasa --keep-audio.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const input = args.find(a => !a.startsWith("--"));
if (!input) {
  console.error("uso: loop-seamless.mjs <input.mp4> [--target=10] [--mode=boomerang|copy] [--output=loop.mp4] [--keep-audio]");
  process.exit(1);
}
if (!fs.existsSync(input)) {
  console.error(`no existe: ${input}`);
  process.exit(1);
}

const opts = Object.fromEntries(
  args.filter(a => a.startsWith("--"))
    .map(a => { const [k, v] = a.slice(2).split("="); return [k, v ?? "true"]; })
);

const target = parseFloat(opts.target ?? "10");
const mode = opts.mode ?? "boomerang";
const keepAudio = opts["keep-audio"] === "true";
const output = opts.output ?? path.join(
  path.dirname(input),
  path.basename(input, path.extname(input)) + `-loop${target}s.mp4`
);

if (!["boomerang", "copy"].includes(mode)) {
  console.error(`mode debe ser boomerang|copy, no "${mode}"`);
  process.exit(1);
}

const srcDur = parseFloat(
  execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${input}"`).toString().trim()
);
console.log(`source: ${path.basename(input)} (${srcDur.toFixed(2)}s) → ${target}s loop ${mode}`);

const audioFlag = keepAudio ? "" : "-an";

if (mode === "boomerang") {
  // forward + reverse = ciclo de 2*srcDur sin discontinuidad. Repetimos hasta target.
  // ffmpeg: split → reverse → concat → loop con stream_loop hasta -t target
  const cycleDur = srcDur * 2;
  const repeats = Math.ceil(target / cycleDur);
  // -stream_loop solo funciona si el ciclo es un fichero. Componemos primero el ciclo.
  const tmpCycle = path.join(path.dirname(output), `.cycle-${Date.now()}.mp4`);
  console.log(`  building boomerang cycle (${cycleDur.toFixed(2)}s) × ${repeats} → ${target}s...`);
  execSync(
    `ffmpeg -y -i "${input}" -filter_complex "[0:v]split=2[fwd][b];[b]reverse[rev];[fwd][rev]concat=n=2:v=1:a=0[v]" -map "[v]" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p ${audioFlag} "${tmpCycle}"`,
    { stdio: "ignore" }
  );
  execSync(
    `ffmpeg -y -stream_loop ${repeats - 1} -i "${tmpCycle}" -t ${target} -c copy ${audioFlag} -movflags +faststart "${output}"`,
    { stdio: "ignore" }
  );
  fs.unlinkSync(tmpCycle);
} else {
  // mode == "copy": concat clip N veces. Solo válido si primer frame ≈ último frame.
  const repeats = Math.ceil(target / srcDur);
  console.log(`  copy concat × ${repeats} → ${target}s (solo válido si first frame ≈ last frame)...`);
  execSync(
    `ffmpeg -y -stream_loop ${repeats - 1} -i "${input}" -t ${target} -c copy ${audioFlag} -movflags +faststart "${output}"`,
    { stdio: "ignore" }
  );
}

const finalDur = parseFloat(
  execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${output}"`).toString().trim()
);
const finalSize = fs.statSync(output).size;
console.log(`✓ ${output}`);
console.log(`  duración: ${finalDur.toFixed(2)}s · tamaño: ${(finalSize / 1024 / 1024).toFixed(2)}MB`);
