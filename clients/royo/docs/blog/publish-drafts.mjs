#!/usr/bin/env node
/**
 * Publica los 3 borradores blog como DRAFT en WordPress de Royo.
 *
 * Cada post se sube con status=draft. Pablo los revisa en wp-admin y
 * decide si publicar / editar / borrar. Cero impacto público (drafts no
 * se ven).
 *
 * USO:
 *   ROYO_WP_USER=... ROYO_WP_APP_PASS=... node publish-drafts.mjs --apply
 */

import fs from "fs";
import path from "path";

const WP_BASE = "https://joyeriaroyo.com";
const USER_AGENT = "PACAME-Bot/1.0";
const dryRun = !process.argv.includes("--apply");
const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
if (!dryRun && (!wpUser || !wpPass)) { console.error("ERROR: env"); process.exit(1); }
const auth = wpUser ? `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}` : null;

const POSTS = [
  { file: "01-cuidar-joyas-oro-18kt.md" },
  { file: "02-cuarzo-vs-automatico-vs-solar.md" },
  { file: "03-elegir-solitario-pedida.md" },
];

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  match[1].split("\n").forEach((line) => {
    const m = line.match(/^([a-z_]+):\s*(.+)$/);
    if (m) meta[m[1]] = m[2].trim();
  });
  return { meta, body: match[2] };
}

// Markdown → HTML simple (h1, h2, h3, p, ul, table, strong, em, links)
function mdToHtml(md) {
  let html = md;
  // Tablas
  html = html.replace(/^\|(.+)\|\n\|([-: ]+\|)+\n((?:\|.+\|\n?)+)/gm, (m, header, _sep, rows) => {
    const headers = header.split("|").map((s) => s.trim()).filter(Boolean);
    const ths = headers.map((h) => `<th>${h}</th>`).join("");
    const trs = rows.trim().split("\n").map((row) => {
      const cells = row.replace(/^\||\|$/g, "").split("|").map((s) => s.trim());
      return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
    }).join("\n");
    return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  });
  // Headings
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  // Bold + italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Listas (líneas que empiezan con - o *)
  html = html.replace(/^([-*])\s+(.+)$/gm, "<LI>$2</LI>");
  html = html.replace(/(<LI>[^<]+<\/LI>(?:\n<LI>[^<]+<\/LI>)*)/g, (m) => `<ul>${m.replace(/\n/g, "")}</ul>`);
  html = html.replace(/<LI>/g, "<li>").replace(/<\/LI>/g, "</li>");
  // Párrafos: dobles saltos → <p>
  html = html.split(/\n\n+/).map((block) => {
    if (block.match(/^<(h\d|ul|ol|table|p|div|figure|blockquote)/i)) return block;
    if (!block.trim()) return "";
    return `<p>${block.replace(/\n/g, " ").trim()}</p>`;
  }).join("\n\n");
  return html;
}

async function findCategoryId(slug) {
  const r = await fetch(`${WP_BASE}/wp-json/wp/v2/categories?slug=${slug}`, { headers: { "User-Agent": USER_AGENT } });
  const d = await r.json();
  return Array.isArray(d) && d.length > 0 ? d[0].id : null;
}

async function main() {
  console.log(`[init] mode=${dryRun ? "DRY-RUN" : "APPLY"}`);
  let updated = 0, errors = 0;

  for (const post of POSTS) {
    const file = path.join(import.meta.dirname, post.file);
    if (!fs.existsSync(file)) { console.log(`  [skip] ${post.file} no existe`); continue; }
    const text = fs.readFileSync(file, "utf8");
    const { meta, body } = parseFrontmatter(text);
    const html = mdToHtml(body);
    console.log(`\n[${dryRun ? "DRY" : "DO "}] ${post.file}`);
    console.log(`  slug: ${meta.slug}`);
    console.log(`  title: ${meta.title}`);
    console.log(`  yoast_title: ${meta.yoast_title}`);
    console.log(`  yoast_desc: ${meta.yoast_description}`);
    console.log(`  focuskw: ${meta.target_keyword}`);
    console.log(`  body length: ${html.length} chars`);

    if (dryRun) continue;

    try {
      const res = await fetch(`${WP_BASE}/wp-json/wp/v2/posts`, {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json", "User-Agent": USER_AGENT },
        body: JSON.stringify({
          title: meta.title,
          slug: meta.slug,
          content: html,
          excerpt: meta.yoast_description,
          status: meta.status || "draft",
          meta: {
            _yoast_wpseo_focuskw: meta.target_keyword,
            _yoast_wpseo_title: meta.yoast_title,
            _yoast_wpseo_metadesc: meta.yoast_description,
          },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error(`  ERROR: ${res.status} ${t.slice(0, 200)}`);
        errors++;
      } else {
        const p = await res.json();
        console.log(`  ✓ posted id=${p.id} url=${p.link}`);
        updated++;
      }
    } catch (err) {
      console.error(`  FATAL: ${err.message}`);
      errors++;
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\n[done] published=${updated} errors=${errors}`);
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
