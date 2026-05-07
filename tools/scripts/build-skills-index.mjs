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

  // Audio / Voice — chequeo temprano por nombre de skill (último segmento), evita falsos
  // positivos de "video-toolkit/.claude/skills/elevenlabs" cayendo en Visual/Design.
  const skillName = p.split('/').filter(Boolean).slice(-2, -1)[0] || '';
  if (skillName === 'elevenlabs' || skillName === 'asr-transcribe-to-text' ||
      skillName === 'audio-transcribe' || skillName === 'google-tts' ||
      skillName === 'transcript-fixer' || skillName === 'youtube-transcript' ||
      skillName.includes('elevenlabs')) return 'Audio / Voice';

  // Composio = ~842 skills, una categoría aparte (servicios externos vía Rube MCP)
  if (p.includes('composio-skills/')) return 'Integraciones';

  // Markdowns sueltos en raíz .claude/skills/*.md → custom PACAME (cmd-, etc.)
  if (/^\.claude\/skills\/[^/]+\.md$/.test(p)) return 'PACAME Custom';

  // PACAME y proyectos propios
  if (p.includes('pacame') || p.includes('darkroom') || p.includes('royo') || p.includes('caleta') ||
      p.includes('higgsfield') || p.includes('nano-banana') || p.includes('auto-brain') ||
      p.includes('cerebro') || p.includes('synapse') || p.includes('discover') ||
      p.includes('neural-report') || p.includes('brain-sync') || p.includes('pedir')) return 'PACAME Custom';

  // Web scraping / browser automation
  if (p.includes('firecrawl') || p.includes('scrapling') || p.includes('browser-automation') ||
      p.includes('just-scrape') || p.includes('twitter-reader')) return 'Web Scraping';

  // Research / Content investigation
  if (p.includes('notebooklm') || p.includes('youtube') || p.includes('twitter') || p.includes('x-twitter') ||
      p.includes('deep-research') || p.includes('autoresearch') || p.includes('research-summarizer') ||
      p.includes('content-research') || p.includes('competitive-intel') || p.includes('competitive-teardown') ||
      p.includes('competitors-analysis') || p.includes('competitive-matrix') ||
      p.includes('fact-checker') || p.includes('web_researcher')) return 'Research / Content';

  // DevOps / Infra
  if (p.includes('docker') || p.includes('helm') || p.includes('terraform') || p.includes('vercel') ||
      p.includes('cloudflare') || p.includes('aws-') || p.includes('azure-') || p.includes('gcp-') ||
      p.includes('runpod') || p.includes('deploy-') || p.includes('observability') ||
      p.includes('ci-cd') || p.includes('runbook')) return 'DevOps / Infra';

  // Git / Release
  if (p.includes('git-worktree') || p.includes('github-') || p.includes('release-manager') ||
      p.includes('changelog') || p.includes('using-git')) return 'Git / Release';

  // Data / DB
  if (p.includes('database') || p.includes('sql-') || p.includes('snowflake') ||
      p.includes('schema-markup') || p.includes('csv-data') || p.includes('rag-architect') ||
      p.includes('data-quality') || p.includes('senior-data')) return 'Data / DB';

  // Security
  if (p.includes('security') || p.includes('iso27001') || p.includes('isms-') ||
      p.includes('soc2-') || p.includes('gdpr') || p.includes('threat-detection') ||
      p.includes('red-team') || p.includes('cloud-security') || p.includes('ai-security') ||
      p.includes('skill-security')) return 'Security';

  // Agencia y subespecialistas
  if (p.includes('agency-agents')) return 'Agency Subspecialists';
  if (p.includes('senior-') || /\/cs-[a-z]/.test(p)) return 'Agency Subspecialists';

  // Categorías generales del repo (estructura por carpeta)
  if (p.includes('engineering-team')) return 'Engineering Team';
  if (p.includes('engineering')) return 'Engineering';
  if (p.includes('marketing')) return 'Marketing';
  if (p.includes('product-team') || p.includes('product/') || p.includes('product-manager') ||
      p.includes('product-strategist') || p.includes('product-analytics') || p.includes('product-discovery')) return 'Product';
  if (p.includes('c-level') || p.includes('advisor') || p.includes('founder-coach') ||
      p.includes('chief-of-staff') || p.includes('board-')) return 'C-Level / Strategy';
  if (p.includes('finance') || p.includes('financial-')) return 'Finance';
  if (p.includes('ra-qm')) return 'Regulatory & QM';
  if (p.includes('project-management') || p.includes('atlassian') || p.includes('jira-') ||
      p.includes('confluence') || p.includes('linear-')) return 'Project Management';
  if (p.includes('business-growth')) return 'Business Growth';

  // Meta / Tooling — orquestación, claude-code, mcp
  if (p.includes('skill-creator') || p.includes('mcp-builder') || p.includes('mcp-server') ||
      p.includes('claude-code') || p.includes('claude-export') || p.includes('claude-skills') ||
      p.includes('agent-designer') || p.includes('agent-workflow') || p.includes('agenthub') ||
      p.includes('agent-protocol') || p.includes('subagent-driven') || p.includes('dispatching-parallel') ||
      p.includes('skills-init') || p.includes('skills-search') || p.includes('skills-status') ||
      p.includes('skill-tester') || p.includes('skill-reviewer') || p.includes('plugin-audit') ||
      p.includes('find-skills') || p.includes('claude-md-') || p.includes('update-config') ||
      p.includes('keybindings') || p.includes('statusline')) return 'Meta / Tooling';

  // Visual / Design
  if (p.includes('canvas') || p.includes('image') || p.includes('video') || p.includes('frontend-design') ||
      p.includes('algorithmic-art') || p.includes('theme-factory') || p.includes('ui-design') ||
      p.includes('imagen') || p.includes('remotion') || p.includes('hig-') || p.includes('apple-hig') ||
      p.includes('design-system') || p.includes('brand-guidelines') || p.includes('epic-design') ||
      p.includes('web-design') || p.includes('web-artifacts') || p.includes('3d-scroll') ||
      p.includes('landing-page-generator') || p.includes('mermaid') || p.includes('pdf-creator') ||
      p.includes('ppt-creator') || p.includes('pptx') || p.includes('slack-gif')) return 'Visual / Design';

  // Audio / Voice
  if (p.includes('audio') || p.includes('asr') || p.includes('elevenlabs') || p.includes('tts') ||
      p.includes('google-tts') || p.includes('transcribe') || p.includes('transcript')) return 'Audio / Voice';

  // Testing / QA
  if (p.includes('test') || p.includes('playwright') || p.includes('/qa/') || p.includes('qa-expert') ||
      p.includes('a11y-audit') || p.includes('webapp-testing') || p.includes('coverage') ||
      p.includes('tdd') || p.includes('promptfoo') || p.includes('eval')) return 'Testing / QA';

  // SEO
  if (p.includes('seo') || p.includes('app-store-optimization')) return 'SEO';

  // Social / Content
  if (p.includes('social') || p.includes('content-creator') || p.includes('content-strategy') ||
      p.includes('content-production') || p.includes('content-humanizer') || p.includes('copywriting') ||
      p.includes('copy-editing') || p.includes('content-strategist') || p.includes('cold-email') ||
      p.includes('email-sequence') || p.includes('referral-program') || p.includes('viral')) return 'Social / Content';

  // Engineering catch-all (debug, refactor, code review)
  if (p.includes('debug') || p.includes('refactor') || p.includes('code-review') || p.includes('karpathy') ||
      p.includes('senior-architect') || p.includes('senior-backend') || p.includes('senior-frontend') ||
      p.includes('senior-fullstack') || p.includes('senior-ml') || p.includes('senior-prompt') ||
      p.includes('api-') || p.includes('react-') || p.includes('terraform-patterns') ||
      p.includes('architecture-patterns') || p.includes('migration-architect') || p.includes('monorepo-') ||
      p.includes('dependency-auditor') || p.includes('performance-profiler') || p.includes('postmortem') ||
      p.includes('incident-')) return 'Engineering';

  // Jezweb plugins — clasificar por sub-carpeta de plugin
  if (p.includes('jezweb-skills/plugins/writing/')) return 'Social / Content';
  if (p.includes('jezweb-skills/plugins/design-assets/') ||
      p.includes('jezweb-skills/plugins/frontend/')) return 'Visual / Design';
  if (p.includes('jezweb-skills/plugins/dev-tools/')) return 'Engineering';
  if (p.includes('jezweb-skills/plugins/integrations/')) return 'Integraciones';
  if (p.includes('jezweb-skills/plugins/shopify/') ||
      p.includes('jezweb-skills/plugins/wordpress/')) return 'CMS / Ecommerce';

  // career-ops y huérfanos
  if (p.includes('career-ops')) return 'Meta / Tooling';

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
