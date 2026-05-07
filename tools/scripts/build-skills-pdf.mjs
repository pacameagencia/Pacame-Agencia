#!/usr/bin/env node
/**
 * build-skills-pdf.mjs
 *
 * Lee `.claude/skills/INDEX.json` (generado por build-skills-index.mjs)
 * y genera un PDF compacto (1 línea por skill) organizado por categoría
 * con índice clicable.
 *
 * Stack: HTML autocontenido + Chrome/Edge headless `--print-to-pdf`.
 * Cero dependencias npm. Detecta Chrome o Edge instalado en Windows.
 *
 * Uso:
 *   node tools/scripts/build-skills-pdf.mjs
 *
 * Salida:
 *   tools/output/skills-catalog-pacame.pdf
 *   tools/output/skills-catalog-pacame.html (intermedio, queda como backup)
 */

import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const INDEX_JSON = join(ROOT, '.claude', 'skills', 'INDEX.json');
const OUTPUT_DIR = join(ROOT, 'tools', 'output');
const OUTPUT_HTML = join(OUTPUT_DIR, 'skills-catalog-pacame.html');
const OUTPUT_PDF = join(OUTPUT_DIR, 'skills-catalog-pacame.pdf');

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];
const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

function findBrowser() {
  for (const p of [...CHROME_PATHS, ...EDGE_PATHS]) {
    if (existsSync(p)) return p;
  }
  return null;
}

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildHTML(data) {
  const { generatedAt, total, scanned, duplicatesSkipped, invalidFrontmatter, categories, skills } = data;

  const grouped = {};
  for (const s of skills) {
    (grouped[s.category] = grouped[s.category] || []).push(s);
  }
  const cats = Object.keys(grouped).sort();

  const dateStr = new Date(generatedAt).toLocaleString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const toc = cats.map((c) => {
    const slug = slugify(c);
    const count = grouped[c].length;
    return `<li><a href="#cat-${slug}">${escapeHTML(c)}</a> <span class="count">${count} skills</span></li>`;
  }).join('\n');

  const sections = cats.map((c) => {
    const slug = slugify(c);
    const rows = grouped[c]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => {
        const desc = (s.description || '').slice(0, 220);
        return `<tr><td class="name"><code>${escapeHTML(s.name)}</code></td><td class="desc">${escapeHTML(desc)}</td></tr>`;
      })
      .join('\n');

    return `
<section class="category" id="cat-${slug}">
  <h2>${escapeHTML(c)} <span class="cat-count">${grouped[c].length}</span></h2>
  <table>
    <thead>
      <tr><th class="col-name">Skill</th><th class="col-desc">Para qué sirve</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
</section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>PACAME · Catálogo de Skills</title>
<style>
  @page {
    size: A4 portrait;
    margin: 14mm 12mm 16mm;
    @bottom-center {
      content: "PACAME · Catálogo de Skills · " counter(page) " / " counter(pages);
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 8pt;
      color: #888;
    }
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    font-size: 9pt;
    line-height: 1.4;
    color: #1a1a1a;
    margin: 0;
  }
  h1 {
    font-size: 28pt;
    margin: 0 0 4pt;
    letter-spacing: -0.02em;
    font-weight: 800;
  }
  h2 {
    font-size: 16pt;
    margin: 0 0 8pt;
    padding-bottom: 4pt;
    border-bottom: 2pt solid #1a1a1a;
    page-break-before: always;
    page-break-after: avoid;
    font-weight: 700;
  }
  h2 .cat-count {
    font-size: 10pt;
    font-weight: 400;
    color: #666;
    margin-left: 6pt;
  }
  .cover {
    text-align: left;
    padding-top: 40mm;
    page-break-after: always;
  }
  .cover .subtitle {
    font-size: 12pt;
    color: #666;
    margin-bottom: 30pt;
  }
  .cover .meta {
    margin-top: 40pt;
    font-size: 9pt;
    color: #666;
    border-top: 1pt solid #ddd;
    padding-top: 12pt;
    line-height: 1.7;
  }
  .cover .meta strong { color: #1a1a1a; }
  .cover .stats {
    display: flex;
    gap: 24pt;
    margin: 24pt 0;
  }
  .cover .stat {
    flex: 0 0 auto;
  }
  .cover .stat .num {
    font-size: 36pt;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.03em;
  }
  .cover .stat .lbl {
    font-size: 8pt;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 2pt;
  }
  .toc {
    page-break-after: always;
  }
  .toc h2 {
    page-break-before: avoid;
    border-bottom: 2pt solid #1a1a1a;
  }
  .toc ul {
    list-style: none;
    padding: 0;
    columns: 2;
    column-gap: 18pt;
  }
  .toc li {
    margin: 4pt 0;
    padding: 4pt 8pt;
    border: 1pt solid #e5e5e5;
    border-radius: 3pt;
    break-inside: avoid;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .toc a {
    color: #1a1a1a;
    text-decoration: none;
    font-weight: 600;
  }
  .toc .count {
    font-size: 8pt;
    color: #666;
    font-weight: 400;
  }
  .category h2 {
    color: #1a1a1a;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 4pt;
  }
  thead tr {
    background: #1a1a1a;
    color: #fff;
  }
  th {
    text-align: left;
    padding: 4pt 6pt;
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  th.col-name { width: 28%; }
  th.col-desc { width: 72%; }
  td {
    padding: 3pt 6pt;
    border-bottom: 0.5pt solid #eee;
    vertical-align: top;
  }
  tr { page-break-inside: avoid; }
  tbody tr:nth-child(even) { background: #fafafa; }
  td.name code {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 8pt;
    background: transparent;
    color: #0066cc;
    word-break: break-all;
  }
  td.desc {
    color: #333;
    font-size: 8.5pt;
  }
  .footer {
    margin-top: 30pt;
    font-size: 8pt;
    color: #888;
    text-align: center;
  }
  /* Cover gradient strip */
  .cover-strip {
    height: 6pt;
    background: linear-gradient(90deg, #ff4d00 0%, #ff8a00 50%, #1a1a1a 100%);
    margin-bottom: 24pt;
  }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-strip"></div>
  <h1>Catálogo de Skills</h1>
  <div class="subtitle">PACAME · Agencia Digital de Agentes IA</div>

  <div class="stats">
    <div class="stat">
      <div class="num">${total}</div>
      <div class="lbl">Skills únicas</div>
    </div>
    <div class="stat">
      <div class="num">${cats.length}</div>
      <div class="lbl">Categorías</div>
    </div>
    <div class="stat">
      <div class="num">${grouped['PACAME Custom'] ? grouped['PACAME Custom'].length : 0}</div>
      <div class="lbl">PACAME Custom</div>
    </div>
  </div>

  <div class="meta">
    <div><strong>Generado:</strong> ${dateStr}</div>
    <div><strong>Archivos escaneados:</strong> ${scanned}</div>
    <div><strong>Duplicados saltados:</strong> ${duplicatesSkipped} · <strong>Sin frontmatter:</strong> ${invalidFrontmatter}</div>
    <div><strong>Regenerar índice:</strong> <code>node tools/scripts/build-skills-index.mjs</code></div>
    <div><strong>Regenerar PDF:</strong> <code>node tools/scripts/build-skills-pdf.mjs</code></div>
  </div>
</div>

<div class="toc">
  <h2>Índice por categoría</h2>
  <p style="font-size:8.5pt; color:#666; margin-bottom:12pt;">Click en cualquier categoría para saltar a ella. Dentro de cada sección, busca con <code>Ctrl+F</code> el nombre de la skill.</p>
  <ul>
${toc}
  </ul>
</div>

${sections}

</body>
</html>
`;
}

async function generatePDF(htmlPath, browserPath) {
  const fileURL = pathToFileURL(htmlPath).href;
  // Usamos directorio temporal único para user-data-dir → evita colisiones con Chrome abierto
  const userDataDir = join(tmpdir(), `pacame-skills-pdf-${Date.now()}`);
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--no-pdf-header-footer',
    '--virtual-time-budget=10000',
    `--user-data-dir=${userDataDir}`,
    `--print-to-pdf=${OUTPUT_PDF}`,
    fileURL,
  ];

  console.log(`  Browser: ${browserPath}`);
  console.log(`  Args: --print-to-pdf=${OUTPUT_PDF}`);

  const result = spawnSync(browserPath, args, {
    stdio: 'inherit',
    timeout: 120000,
  });

  if (result.status !== 0) {
    throw new Error(`Browser exited with code ${result.status}: ${result.error?.message || 'unknown'}`);
  }
}

async function main() {
  console.log('→ Leyendo INDEX.json...');
  const json = JSON.parse(await readFile(INDEX_JSON, 'utf8'));
  console.log(`  ${json.total} skills en ${json.categories.length} categorías`);

  console.log('→ Generando HTML...');
  await mkdir(OUTPUT_DIR, { recursive: true });
  const html = buildHTML(json);
  await writeFile(OUTPUT_HTML, html, 'utf8');
  const htmlSize = (await stat(OUTPUT_HTML)).size;
  console.log(`  HTML: ${OUTPUT_HTML} (${(htmlSize / 1024).toFixed(1)} KB)`);

  console.log('→ Localizando navegador headless...');
  const browser = findBrowser();
  if (!browser) {
    console.error('  ✗ No se encontró Chrome ni Edge. Instala Google Chrome o Microsoft Edge.');
    console.error(`    HTML disponible en: ${OUTPUT_HTML}`);
    console.error(`    Abre en navegador → Imprimir → Guardar como PDF.`);
    process.exit(1);
  }

  console.log('→ Generando PDF (Chrome/Edge headless)...');
  await generatePDF(OUTPUT_HTML, browser);

  if (!existsSync(OUTPUT_PDF)) {
    throw new Error(`PDF no se creó en ${OUTPUT_PDF}`);
  }
  const pdfSize = (await stat(OUTPUT_PDF)).size;
  console.log('');
  console.log(`✓ PDF generado: ${OUTPUT_PDF} (${(pdfSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log('');
  console.log('  Abrir con:');
  console.log(`    start "" "${OUTPUT_PDF}"`);
}

main().catch((e) => {
  console.error('✗ Error:', e.message);
  process.exit(1);
});
