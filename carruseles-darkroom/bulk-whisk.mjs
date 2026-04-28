#!/usr/bin/env node
/**
 * bulk-whisk.mjs — Mass-gen GRATIS de imágenes vía Google Whisk Labs.
 *
 * POR QUÉ EXISTE
 *   El santo grial visual recomienda AutoWhisk (extension Chrome) para mass-gen
 *   sin gastar API. Whisk Labs es gratis (~100 attempts/día) y excelente para
 *   B-roll, variaciones, moodboards. Este script replica el comportamiento de
 *   AutoWhisk pero auto-contenido en el repo PACAME, sin extension.
 *
 *   Coste: $0. Rate-limit: ~100 attempts/día en cuenta Google estándar.
 *
 * REQUISITOS
 *   1. Sesión Google viva en el skill notebooklm:
 *        python ~/.claude/skills/notebooklm/scripts/run.py auth_manager.py setup
 *      (la cuenta Google debe tener acceso a labs.google.com/fx/tools/whisk)
 *
 *   2. Playwright instalado en carruseles-darkroom:
 *        cd carruseles-darkroom && npm install playwright && npx playwright install chromium
 *
 * USO
 *
 *   # Lista de prompts en un .txt (1 por línea, líneas vacías ignoradas)
 *   node carruseles-darkroom/bulk-whisk.mjs --prompts=prompts.txt --output=whisk-out/
 *
 *   # Prompt único inline
 *   node carruseles-darkroom/bulk-whisk.mjs --prompt="cinematic violet ink in black water" --count=3 --output=whisk-out/
 *
 *   # Debug visual (browser visible) — útil para ver qué pasa la primera vez
 *   node carruseles-darkroom/bulk-whisk.mjs --prompts=prompts.txt --output=whisk-out/ --show-browser
 *
 *   # Dry-run: solo verifica auth, no genera nada
 *   node carruseles-darkroom/bulk-whisk.mjs --dry-run
 *
 * FORMATO DEL ARCHIVO DE PROMPTS
 *   Una línea por prompt. Líneas vacías y comentarios `# ...` ignorados.
 *   Ejemplo:
 *
 *     # Hero shots para teaser PACAME
 *     cinematic vertical close-up of dark violet ink in black water
 *     cinematic vertical macro of cracking silicon chip with cyan light
 *     # ...
 *
 * SALIDA
 *   <output>/01-<slug>.png, <output>/02-<slug>.png, ...
 *   <output>/manifest.json con {prompt, urls[], files[], duration_ms}
 */
import fs from "node:fs";
import path from "node:path";
import { openWhisk, submitPrompt, waitForResults, downloadImage } from "./lib/whisk-browser.mjs";

const args = process.argv.slice(2);
const opts = Object.fromEntries(
  args.filter(a => a.startsWith("--"))
    .map(a => { const [k, v] = a.slice(2).split("="); return [k, v ?? "true"]; })
);

if (opts.help || opts.h) {
  console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 50).join("\n"));
  process.exit(0);
}

const showBrowser = opts["show-browser"] === "true";
const dryRun = opts["dry-run"] === "true";
const output = opts.output ?? "carruseles-darkroom/output/whisk-bulk";
const expectedPerPrompt = parseInt(opts.count ?? "1", 10);  // Whisk genera por defecto 1-2 imágenes por prompt

// ─── Lectura de prompts ────────────────────────────────────────

let prompts = [];
if (opts.prompt) {
  prompts = [opts.prompt];
} else if (opts.prompts) {
  if (!fs.existsSync(opts.prompts)) {
    console.error(`no existe: ${opts.prompts}`);
    process.exit(1);
  }
  prompts = fs.readFileSync(opts.prompts, "utf8")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"));
} else if (!dryRun) {
  console.error("usa --prompts=<file> o --prompt=<text> o --dry-run");
  process.exit(1);
}

if (prompts.length > 0) {
  console.log(`Bulk Whisk · ${prompts.length} prompt(s) · output: ${output}`);
} else if (dryRun) {
  console.log(`Bulk Whisk · DRY RUN (solo verificar auth)`);
}

fs.mkdirSync(output, { recursive: true });

// ─── Slug helper ───────────────────────────────────────────────

function slug(text, max = 40) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}

// ─── Run ───────────────────────────────────────────────────────

const startTotal = Date.now();
const { browser, context, page } = await openWhisk({ headless: !showBrowser });

if (dryRun) {
  console.log("✓ DRY RUN — Whisk cargado correctamente, sesión Google viva. No se han generado imágenes.");
  await browser.close();
  process.exit(0);
}

const manifest = [];

try {
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const idx = String(i + 1).padStart(2, "0");
    console.log(`\n[${idx}/${prompts.length}] ${prompt.slice(0, 80)}${prompt.length > 80 ? "…" : ""}`);

    const t0 = Date.now();
    let urls = [];
    let files = [];
    try {
      await submitPrompt(page, prompt);
      urls = await waitForResults(page, expectedPerPrompt, 120000);

      // Descarga las primeras N
      for (let k = 0; k < Math.min(expectedPerPrompt, urls.length); k++) {
        const ext = (urls[k].match(/\.(png|jpg|webp)/i) || [, "png"])[1];
        const filename = `${idx}-${slug(prompt)}-${k + 1}.${ext}`;
        const dest = path.join(output, filename);
        const size = await downloadImage(urls[k], dest);
        files.push(filename);
        console.log(`  ↓ ${filename} (${(size / 1024).toFixed(0)}KB)`);
      }
    } catch (e) {
      console.error(`  ✗ FALLO: ${e.message}`);
    }

    manifest.push({
      idx,
      prompt,
      urls,
      files,
      duration_ms: Date.now() - t0,
    });

    // Pausa entre prompts para no agitar el rate-limiter de Whisk
    if (i < prompts.length - 1) {
      await page.waitForTimeout(3000);
    }
  }
} finally {
  fs.writeFileSync(path.join(output, "manifest.json"), JSON.stringify(manifest, null, 2));
  await browser.close();
}

const totalMs = Date.now() - startTotal;
const totalImgs = manifest.reduce((s, m) => s + m.files.length, 0);
const failed = manifest.filter(m => m.files.length === 0).length;

console.log(`\n✅ DONE · ${totalImgs} imágenes generadas · ${failed} fallos · ${(totalMs / 1000).toFixed(0)}s total`);
console.log(`   manifest: ${path.join(output, "manifest.json")}`);
