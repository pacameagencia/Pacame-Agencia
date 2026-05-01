#!/usr/bin/env node
/**
 * Sprint 6D — Publica los 3 borradores de blog Markdown como WP drafts.
 *
 * Lee los .md con frontmatter de tools/royo-content-drafts/blog/, los convierte
 * a HTML simple (sin librerías externas) y crea posts WP con status=draft +
 * Yoast meta_data (focus keyword, title, description) ya en su sitio.
 *
 * Pablo los revisa en wp-admin → Entradas → Borradores y publica cuando le encaje.
 *
 * USO:
 *   ROYO_WP_USER=... ROYO_WP_APP_PASS=... \
 *     node tools/royo-content-drafts/blog/publish-drafts.mjs --apply
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WP_BASE = "https://joyeriaroyo.com";
const USER_AGENT = "PACAME-Bot/1.0 (+https://pacameagencia.com)";

const args = process.argv.slice(2);
const dryRun = !args.includes("--apply");

const wpUser = process.env.ROYO_WP_USER;
const wpPass = process.env.ROYO_WP_APP_PASS;
if (!dryRun && (!wpUser || !wpPass)) {
  console.error("ERROR: para --apply necesito ROYO_WP_USER y ROYO_WP_APP_PASS en env.");
  process.exit(1);
}
const authHeader = wpUser && wpPass
  ? `Basic ${Buffer.from(`${wpUser}:${wpPass}`).toString("base64")}`
  : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = __dirname;

// Parser frontmatter YAML simplificado (key: value, listas con [a, b])
function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: text };
  const fm = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^([a-z_]+):\s*(.+)$/i);
    if (!m) continue;
    let value = m[2].trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((s) => s.trim());
    }
    fm[m[1]] = value;
  }
  return { frontmatter: fm, body: match[2] };
}

// Markdown→HTML simplificado (h2/h3, p, ul, blockquote, links, table, em, strong)
function mdToHtml(md) {
  const lines = md.split("\n");
  const html = [];
  let inUl = false, inP = false, inTable = false, tableRows = [];

  function closeP() {
    if (inP) { html.push("</p>"); inP = false; }
  }
  function closeUl() {
    if (inUl) { html.push("</ul>"); inUl = false; }
  }
  function closeTable() {
    if (inTable && tableRows.length) {
      html.push("<table>");
      html.push("<thead><tr>" + tableRows[0].map(c => `<th>${c}</th>`).join("") + "</tr></thead>");
      html.push("<tbody>");
      for (const row of tableRows.slice(2)) {
        html.push("<tr>" + row.map(c => `<td>${inlineFmt(c)}</td>`).join("") + "</tr>");
      }
      html.push("</tbody></table>");
      tableRows = [];
      inTable = false;
    }
  }
  function inlineFmt(s) {
    // links [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    // bold **x**
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // italics *x* (cuidado de no romper bold ya cerrado)
    s = s.replace(/(^|[^*])\*([^*\n]+)\*([^*]|$)/g, "$1<em>$2</em>$3");
    return s;
  }

  for (const raw of lines) {
    const line = raw.trim();

    // Tabla detection
    if (line.startsWith("|") && line.endsWith("|")) {
      closeP(); closeUl();
      inTable = true;
      tableRows.push(line.slice(1, -1).split("|").map(c => c.trim()));
      continue;
    } else if (inTable) {
      closeTable();
    }

    if (line === "") { closeP(); closeUl(); continue; }

    if (line.startsWith("## ")) {
      closeP(); closeUl();
      html.push(`<h2>${inlineFmt(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      closeP(); closeUl();
      html.push(`<h3>${inlineFmt(line.slice(4))}</h3>`);
    } else if (line.startsWith("> ")) {
      closeP(); closeUl();
      html.push(`<blockquote><p>${inlineFmt(line.slice(2))}</p></blockquote>`);
    } else if (line.startsWith("- ") || line.match(/^\d+\.\s/)) {
      closeP();
      if (!inUl) { html.push("<ul>"); inUl = true; }
      const item = line.startsWith("- ") ? line.slice(2) : line.replace(/^\d+\.\s/, "");
      html.push(`<li>${inlineFmt(item)}</li>`);
    } else {
      closeUl();
      if (!inP) { html.push("<p>"); inP = true; }
      else html.push(" ");
      html.push(inlineFmt(line));
    }
  }
  closeP(); closeUl(); closeTable();

  return html.join("\n");
}

async function createPost({ title, content, excerpt, slug, status, meta }) {
  const url = `${WP_BASE}/wp-json/wp/v2/posts`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({ title, content, excerpt, slug, status, meta }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`post create: ${res.status} ${text.slice(0, 300)}`);
  }
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`[init] mode=${dryRun ? "DRY-RUN" : "APPLY"}`);
  const files = fs.readdirSync(BLOG_DIR).filter((f) => /^\d+-.+\.md$/.test(f));
  console.log(`[fetch] ${files.length} markdown encontrados.`);

  let created = 0, errors = 0;
  for (const file of files.sort()) {
    const fullPath = path.join(BLOG_DIR, file);
    const text = fs.readFileSync(fullPath, "utf8");
    const { frontmatter, body } = parseFrontmatter(text);

    const html = mdToHtml(body);
    const meta = {
      _yoast_wpseo_focuskw: frontmatter.target_keyword || "",
      _yoast_wpseo_title: frontmatter.yoast_title || frontmatter.title || "",
      _yoast_wpseo_metadesc: frontmatter.yoast_description || "",
      "_yoast_wpseo_meta-robots-noindex": "0",
      "_yoast_wpseo_meta-robots-nofollow": "0",
    };
    const excerpt = (frontmatter.yoast_description || "").toString().slice(0, 200);

    console.log(`[${dryRun ? "DRY" : "DO "}] ${file}`);
    console.log(`     title="${frontmatter.title}" kw="${frontmatter.target_keyword}"`);
    console.log(`     html=${html.length}ch excerpt=${excerpt.length}ch`);

    if (!dryRun) {
      try {
        const result = await createPost({
          title: frontmatter.title,
          content: html,
          excerpt,
          slug: frontmatter.slug,
          status: "draft",
          meta,
        });
        console.log(`     ✓ creado id=${result.id} link=${result.link}`);
        created++;
        await sleep(500);
      } catch (err) {
        console.error(`     ERROR: ${err.message}`);
        errors++;
      }
    } else {
      created++;
    }
  }

  console.log(`\n[done] created=${created} errors=${errors}`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
