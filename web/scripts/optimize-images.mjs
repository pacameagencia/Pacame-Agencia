#!/usr/bin/env node
/**
 * PACAME — Optimize generated PNGs to WebP + AVIF responsive sizes.
 *
 * Reads web/public/generated/**\/*.png and writes to web/public/generated/optimized/<slug>.{webp,avif}
 * with responsive sizes 640w / 1024w / 1536w when source is large enough.
 *
 * Requires sharp installed (web/node_modules).
 *
 * Usage:
 *   node web/scripts/optimize-images.mjs                       # optimize all PNGs not yet optimized
 *   node web/scripts/optimize-images.mjs --force               # re-optimize even if WebP exists
 *   node web/scripts/optimize-images.mjs --slug=hero-poster    # one slug
 */

import fs from "node:fs/promises";
import path from "node:path";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(WEB_ROOT, "public", "generated");
const OUT_DIR = path.join(WEB_ROOT, "public", "generated", "optimized");

const args = process.argv.slice(2);
const flags = {
  force: args.includes("--force"),
  slug: null,
};
for (const a of args) if (a.startsWith("--slug=")) flags.slug = a.slice(7);

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("✖ sharp not installed. Run: cd web && npm i sharp");
  process.exit(1);
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === "optimized") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && e.name.endsWith(".png")) yield p;
  }
}

const SIZES = [640, 1024, 1536];

async function optimizeOne(srcPath) {
  const rel = path.relative(SRC_DIR, srcPath).replace(/\\/g, "/").replace(/\.png$/, "");
  const baseDir = path.join(OUT_DIR, path.dirname(rel));
  const baseName = path.basename(rel);
  await fs.mkdir(baseDir, { recursive: true });

  const meta = await sharp(srcPath).metadata();
  const srcWidth = meta.width || 1024;

  const widths = SIZES.filter((w) => w <= srcWidth);
  if (!widths.length) widths.push(srcWidth);

  const written = [];
  for (const w of widths) {
    for (const fmt of ["webp", "avif"]) {
      const out = path.join(baseDir, `${baseName}-${w}w.${fmt}`);
      if (existsSync(out) && !flags.force) continue;
      await sharp(srcPath)
        .resize({ width: w, withoutEnlargement: true })
        [fmt]({ quality: fmt === "webp" ? 85 : 70 })
        .toFile(out);
      written.push(out);
    }
  }

  // Also write a base WebP (full source size) for next/image fallback
  const baseWebp = path.join(baseDir, `${baseName}.webp`);
  if (!existsSync(baseWebp) || flags.force) {
    await sharp(srcPath).webp({ quality: 88 }).toFile(baseWebp);
    written.push(baseWebp);
  }

  return { slug: rel, written: written.length };
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`✖ source dir not found: ${SRC_DIR}`);
    process.exit(1);
  }

  const files = [];
  for await (const f of walk(SRC_DIR)) {
    if (flags.slug && !f.includes(flags.slug)) continue;
    files.push(f);
  }

  if (!files.length) {
    console.log(`▸ no PNGs to optimize${flags.slug ? ` (slug=${flags.slug})` : ""}`);
    return;
  }

  console.log(`▸ optimizing ${files.length} PNGs → WebP + AVIF (sizes: ${SIZES.join(", ")}w)\n`);

  const start = Date.now();
  let totalWritten = 0;
  let totalSrcBytes = 0;
  let totalOutBytes = 0;

  for (const f of files) {
    try {
      totalSrcBytes += statSync(f).size;
      const r = await optimizeOne(f);
      totalWritten += r.written;
      console.log(`  ✓ ${r.slug} → ${r.written} files`);
    } catch (err) {
      console.error(`  ✖ ${f}: ${err.message}`);
    }
  }

  // Compute optimized total size
  for await (const f of walk(OUT_DIR)) totalOutBytes += statSync(f).size;

  console.log(`\n▸ Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  console.log(`  ⌬ src   : ${(totalSrcBytes / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  ⌬ out   : ${(totalOutBytes / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  → ${totalWritten} files written`);
}

main().catch((err) => {
  console.error("✖ optimize failed:", err);
  process.exit(1);
});
