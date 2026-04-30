#!/usr/bin/env node
/**
 * build-skills-index.mjs
 *
 * Recorre .claude/skills/ (recursivo), parsea frontmatter de SKILL.md y .md
 * sueltos en raíz, agrupa por categoría y genera:
 *   - .claude/skills/INDEX.md  (tabla navegable)
 *   - .claude/skills/INDEX.json (estructurado)
 *
 * Detecta duplicados por nombre y los reporta.
 *
 * Uso:
 *   node tools/scripts/build-skills-index.mjs
 *
 * Regenerar tras añadir/quitar skills.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SKILLS_DIR = join(ROOT, '.claude', 'skills');

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(p);
    } else if (e.isFile() && e.name.endsWith('.md')) {
      yield p;
    }
  }
}

function parseFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  let currentKey = null;
  for (const rawLine of m[1].split(/\r?\n/)) {
    const line = rawLine.replace(/\r$/, '');
    if (/^\s/.test(line) && currentKey) {
      // multiline continuation
      fm[currentKey] += ' ' + line.trim();
      continue;
    }
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[key] = val;
    currentKey = key;
  }
  return fm;
}

function categorize(relPath) {
  const p = relPath.toLowerCase().replace(/\\/g, '/');
  if (p.includes('engineering-team')) return 'Engineering Team';
  if (p.includes('engineering')) return 'Engineering';
  if (p.includes('marketing')) return 'Marketing';
  if (p.includes('product-team') || p.includes('product/')) return 'Product';
  if (p.includes('c-level') || p.includes('advisor')) return 'C-Level / Strategy';
  if (p.includes('finance')) return 'Finance';
  if (p.includes('ra-qm')) return 'Regulatory & QM';
  if (p.includes('project-management')) return 'Project Management';
  if (p.includes('business-growth')) return 'Business Growth';
  if (p.includes('agency-agents')) return 'Agency Subspecialists';
  if (p.includes('pacame') || p.includes('darkroom') || p.includes('royo') || p.includes('caleta')) return 'PACAME Custom';
  if (p.includes('skill-creator') || p.includes('mcp-builder') || p.includes('claude-code')) return 'Meta / Tooling';
  if (p.includes('canvas') || p.includes('image') || p.includes('video') || p.includes('frontend-design') || p.includes('algorithmic-art') || p.includes('theme-factory') || p.includes('ui-design') || p.includes('imagen') || p.includes('remotion')) return 'Visual / Design';
  if (p.includes('audio') || p.includes('asr') || p.includes('elevenlabs') || p.includes('tts')) return 'Audio / Voice';
  if (p.includes('test') || p.includes('playwright') || p.includes('qa')) return 'Testing / QA';
  if (p.includes('seo')) return 'SEO';
  if (p.includes('social') || p.includes('content')) return 'Social / Content';
  return 'Other';
}

function isSkillEntry(file) {
  const p = file.replace(/\\/g, '/');
  // SKILL.md anywhere
  if (p.endsWith('/SKILL.md')) return true;
  // .md directly inside .claude/skills/ (custom PACAME root skills)
  const relSkillsDir = relative(SKILLS_DIR, file).replace(/\\/g, '/');
  if (!relSkillsDir.includes('/')) return true;
  return false;
}

async function main() {
  const skills = [];
  const seen = new Map();
  let duplicates = 0;
  let invalidFrontmatter = 0;
  let scanned = 0;

  for await (const file of walk(SKILLS_DIR)) {
    if (!isSkillEntry(file)) continue;
    scanned++;
    const content = await readFile(file, 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm || !fm.name) {
      invalidFrontmatter++;
      continue;
    }
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    const cat = categorize(rel);
    const entry = {
      name: fm.name,
      description: (fm.description || '').slice(0, 220),
      path: rel,
      category: cat,
      model: fm.model || null,
    };

    if (seen.has(fm.name)) {
      duplicates++;
      // keep first, skip dup
      continue;
    }
    seen.set(fm.name, entry);
    skills.push(entry);
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));

  const grouped = {};
  for (const s of skills) {
    (grouped[s.category] = grouped[s.category] || []).push(s);
  }
  const cats = Object.keys(grouped).sort();

  // JSON
  await writeFile(
    join(SKILLS_DIR, 'INDEX.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        scanned,
        total: skills.length,
        duplicatesSkipped: duplicates,
        invalidFrontmatter,
        categories: cats.map((c) => ({ name: c, count: grouped[c].length })),
        skills,
      },
      null,
      2
    )
  );

  // Markdown
  let md = `# .claude/skills/INDEX — autogenerado\n\n`;
  md += `> Generado: \`${new Date().toISOString()}\`\n>\n`;
  md += `> **Total skills únicos:** ${skills.length} | Archivos escaneados: ${scanned} | Duplicados saltados: ${duplicates} | Sin frontmatter: ${invalidFrontmatter}\n>\n`;
  md += `> **Regenerar:** \`node tools/scripts/build-skills-index.mjs\`\n\n`;
  md += `---\n\n## Tabla de contenidos\n\n`;
  for (const c of cats) {
    const anchor = c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    md += `- [${c}](#${anchor}) — ${grouped[c].length} skills\n`;
  }
  md += `\n---\n\n`;

  for (const c of cats) {
    md += `## ${c}\n\n`;
    md += `| Skill | Descripción | Path |\n|-------|-------------|------|\n`;
    for (const s of grouped[c]) {
      const desc = s.description.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').slice(0, 140);
      const safeName = String(s.name).replace(/\|/g, '\\|');
      md += `| \`${safeName}\` | ${desc} | \`${s.path}\` |\n`;
    }
    md += `\n`;
  }

  await writeFile(join(SKILLS_DIR, 'INDEX.md'), md);

  console.log(`✓ INDEX.md + INDEX.json generados`);
  console.log(`  Escaneados: ${scanned}`);
  console.log(`  Únicos:     ${skills.length}`);
  console.log(`  Duplicados: ${duplicates}`);
  console.log(`  Sin FM:     ${invalidFrontmatter}`);
  console.log(`  Categorías: ${cats.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
