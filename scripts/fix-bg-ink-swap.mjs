#!/usr/bin/env node
/**
 * Post-hotfix fix: tras invertir paper/ink tokens para volver a dark mode,
 * los componentes que usaban bg-ink esperando fondo OSCURO ahora lo tienen
 * CLARO (porque ink = #F5F5F7). Similar con text-paper.
 *
 * Swap:
 *   bg-ink        → bg-paper         (ambos casos: card/section oscura)
 *   bg-ink/XX     → bg-paper/XX
 *   bg-ink-soft   → bg-paper-soft
 *   bg-ink-mute   → bg-paper-soft
 *   text-paper    → text-ink         (texto claro sobre dark card)
 *   text-paper/XX → text-ink/XX
 *
 * NO toca text-ink (queremos texto claro) ni bg-paper (canvas ya oscuro).
 * NO toca border-ink/X (border claro transparente sobre dark = OK).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "web");
const DRY = process.argv.includes("--dry");

const REPLACEMENTS = [
  // bg-ink family → bg-paper family (color oscuro para cards/sections)
  { from: /\bbg-ink-soft\b/g, to: "bg-paper-soft" },
  { from: /\bbg-ink-mute\b/g, to: "bg-paper-soft" },
  { from: /\bbg-ink-subtle\b/g, to: "bg-paper-deep" },
  { from: /\bbg-ink\/(\d+)\b/g, to: "bg-paper/$1" },
  { from: /\bbg-ink\/\[([^\]]+)\]/g, to: "bg-paper/[$1]" },
  { from: /\bbg-ink\b/g, to: "bg-paper" },
  { from: /\bhover:bg-ink\/(\d+)/g, to: "hover:bg-paper/$1" },
  { from: /\bhover:bg-ink\b/g, to: "hover:bg-paper" },

  // text-paper family → text-ink family (texto claro sobre dark)
  { from: /\btext-paper-soft\b/g, to: "text-ink-soft" },
  { from: /\btext-paper-deep\b/g, to: "text-ink" },
  { from: /\btext-paper\/(\d+)\b/g, to: "text-ink/$1" },
  { from: /\btext-paper\/\[([^\]]+)\]/g, to: "text-ink/[$1]" },
  { from: /\btext-paper\b/g, to: "text-ink" },
  { from: /\bhover:text-paper\/(\d+)/g, to: "hover:text-ink/$1" },
  { from: /\bhover:text-paper\b/g, to: "hover:text-ink" },

  // gradients: from-paper → from-ink (si era fondo oscuro gradiente)
  // nota: la mayoria de componentes quieren "fade to dark canvas" que ahora es bg-paper=#0A0A0A
  // → los componentes que decian from-paper (claro) en realidad querian from-[dark canvas] → mejor dejar from-paper (#0A0A0A) como está
  // los que usen from-ink/via-ink/to-ink sí quieren dark (OK) pero el color ink=claro ahora → swap:
  { from: /\b(from|via|to)-ink\/(\d+)\b/g, to: "$1-paper/$2" },
  { from: /\b(from|via|to)-ink\b/g, to: "$1-paper" },

  // fill-ink / stroke-ink (SVG) — si componentes lo usan como "negro" → paper
  { from: /\bfill-ink\b/g, to: "fill-paper" },
  { from: /\bstroke-ink\b(?!-)/g, to: "stroke-paper" },

  // placeholder:text-ink con opacidad no se toca (esta bien, placeholder claro sobre input dark)
  // Queremos solo text-ink como color explícito sobre un fondo claro → no aplica aquí

  // border-paper → border-ink donde era border visible claro (hasta ahora invisible)
  { from: /\bborder-paper\/(\d+)\b/g, to: "border-ink/$1" },
  { from: /\bborder-paper\b/g, to: "border-ink" },
];

function findFiles(dir) {
  const out = [];
  function walk(d) {
    if (/node_modules|\.next|\.git/.test(d)) return;
    if (/tailwind\.config\.ts$|tokens\.ts$/.test(d)) return;
    let entries;
    try { entries = readdirSync(d); } catch { return; }
    for (const name of entries) {
      const full = join(d, name);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) { walk(full); continue; }
      if ([".ts", ".tsx", ".js", ".jsx", ".css", ".mdx"].includes(extname(name))) out.push(full);
    }
  }
  walk(dir);
  return out;
}

const files = findFiles(ROOT);
let totalMatches = 0;
let filesChanged = 0;
const report = {};

for (const file of files) {
  if (/tailwind\.config\.ts$|\/tokens\.ts$/.test(file)) continue;
  let content;
  try { content = readFileSync(file, "utf8"); } catch { continue; }
  let modified = content;
  let matches = 0;
  for (const { from, to } of REPLACEMENTS) {
    const m = modified.match(from);
    if (m) { matches += m.length; modified = modified.replace(from, to); }
  }
  if (matches > 0) {
    totalMatches += matches;
    filesChanged += 1;
    report[file.replace(ROOT, "web")] = matches;
    if (!DRY) writeFileSync(file, modified, "utf8");
  }
}

const action = DRY ? "WOULD UPDATE" : "UPDATED";
// eslint-disable-next-line no-console
console.log(`\n${action} ${filesChanged} files · ${totalMatches} replacements\n`);
const top = Object.entries(report).sort((a, b) => b[1] - a[1]).slice(0, 15);
// eslint-disable-next-line no-console
console.log("Top files:");
for (const [f, c] of top) console.log(`  ${String(c).padStart(4)}  ${f}`);
