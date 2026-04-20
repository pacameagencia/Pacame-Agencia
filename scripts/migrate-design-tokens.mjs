#!/usr/bin/env node
/**
 * Migra tokens legacy → nuevos tokens semanticos (Sprint 18).
 * One-shot: los aliases en tailwind.config.ts garantizan que el build
 * sigue funcionando durante la transicion, este script limpia las clases
 * para que usen los tokens semanticos directos.
 *
 * Run: node scripts/migrate-design-tokens.mjs [--dry]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "web");
const DRY = process.argv.includes("--dry");

// Mapeo legacy → nuevo. ORDEN CRITICO: matches mas especificos PRIMERO.
const REPLACEMENTS = [
  // Colores dark con opacity Tailwind class → mantener opacidad
  { from: /text-pacame-white\/(\d+)/g, to: "text-ink/$1" },
  { from: /bg-pacame-white\/(\d+)/g, to: "bg-paper/$1" },
  { from: /border-pacame-white\/(\d+)/g, to: "border-ink/$1" },
  { from: /text-pacame-black\/(\d+)/g, to: "text-paper/$1" },
  { from: /bg-pacame-black\/(\d+)/g, to: "bg-ink/$1" },

  // bg-white/X con /X en dark UI → bg-ink/X (invert en dark)
  // Dejo para manual porque ambiguo — solo migro bg-dark-card
  { from: /bg-dark-card/g, to: "bg-paper-deep" },
  { from: /bg-dark-elevated/g, to: "bg-paper-soft" },
  { from: /bg-dark-surface/g, to: "bg-paper" },

  // Border white con opacity → ink (invert)
  { from: /border-white\/\[0\.06\]/g, to: "border-ink/[0.06]" },
  { from: /border-white\/\[0\.08\]/g, to: "border-ink/[0.08]" },
  { from: /border-white\/\[0\.1\]/g, to: "border-ink/[0.1]" },
  { from: /border-white\/\[0\.12\]/g, to: "border-ink/[0.12]" },

  // Accent colors
  { from: /\belectric-violet\b/g, to: "brand-primary" },
  { from: /\bdeep-indigo\b/g, to: "brand-700" },
  { from: /\bslate-brand\b/g, to: "ink-subtle" },
  { from: /\bsoft-gray\b/g, to: "ink-faint" },
  { from: /\bneon-cyan\b/g, to: "mint" },
  { from: /\blime-pulse\b/g, to: "mint" },
  { from: /\bamber-signal\b/g, to: "accent-gold" },
  { from: /\brose-alert\b/g, to: "accent-burgundy-soft" },

  // Olympus gold
  { from: /\bolympus-gold-light\b/g, to: "accent-gold-soft" },
  { from: /\bolympus-gold-dark\b/g, to: "accent-gold-deep" },
  { from: /\bolympus-gold\b/g, to: "accent-gold" },
  { from: /\bbronze-divine\b/g, to: "accent-gold-deep" },

  // Celestial / aether / void
  { from: /\bcelestial-silver\b/g, to: "ink-subtle" },
  { from: /\baether-blue\b/g, to: "brand-900" },
  { from: /\bvoid-purple\b/g, to: "ink" },
  { from: /\baurora-pink\b/g, to: "accent-burgundy-soft" },
  { from: /\baurora-teal\b/g, to: "mint" },

  // Agent colors
  { from: /\bagent-nova\b/g, to: "brand-primary" },
  { from: /\bagent-atlas\b/g, to: "brand-700" },
  { from: /\bagent-nexus\b/g, to: "accent-burgundy" },
  { from: /\bagent-pixel\b/g, to: "mint" },
  { from: /\bagent-core\b/g, to: "mint-700" },
  { from: /\bagent-pulse\b/g, to: "accent-burgundy-soft" },
  { from: /\bagent-sage\b/g, to: "accent-gold-deep" },

  // Base tokens (al final para no pisar prefijados)
  { from: /\bpacame-white\b/g, to: "ink" },
  { from: /\bpacame-black\b/g, to: "paper" },
];

function findFiles(dir, extensions = [".ts", ".tsx", ".js", ".jsx", ".css", ".mdx"]) {
  const results = [];
  function walk(d) {
    if (
      d.includes("node_modules") ||
      d.includes(".next") ||
      d.includes(".git") ||
      d.endsWith("tailwind.config.ts") ||
      d.endsWith("tokens.ts")
    ) return;
    let entries;
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const name of entries) {
      const full = join(d, name);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) {
        walk(full);
      } else if (extensions.includes(extname(name))) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

function migrate() {
  const files = findFiles(ROOT);
  let totalMatches = 0;
  let filesChanged = 0;
  const fileReport = {};

  for (const file of files) {
    // Skip el propio tokens.ts + config
    if (file.endsWith("tokens.ts") || file.endsWith("tailwind.config.ts")) continue;

    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }

    let modified = content;
    let fileMatches = 0;

    for (const { from, to } of REPLACEMENTS) {
      const matches = modified.match(from);
      if (matches) {
        fileMatches += matches.length;
        modified = modified.replace(from, to);
      }
    }

    if (fileMatches > 0) {
      totalMatches += fileMatches;
      filesChanged += 1;
      fileReport[file.replace(ROOT, "web")] = fileMatches;
      if (!DRY) {
        writeFileSync(file, modified, "utf8");
      }
    }
  }

  const action = DRY ? "WOULD UPDATE" : "UPDATED";
  // eslint-disable-next-line no-console
  console.log(`\n${action} ${filesChanged} files · ${totalMatches} replacements\n`);
  // Top 15 files con mas cambios
  const top = Object.entries(fileReport)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  // eslint-disable-next-line no-console
  console.log("Top files:");
  for (const [file, count] of top) {
    // eslint-disable-next-line no-console
    console.log(`  ${String(count).padStart(4)}  ${file}`);
  }

  if (DRY) {
    // eslint-disable-next-line no-console
    console.log("\n(dry run — no files written. Remove --dry to apply.)");
  } else {
    // eslint-disable-next-line no-console
    console.log("\n✓ Migration done. Run `npx tsc --noEmit` to verify.");
  }
}

migrate();
