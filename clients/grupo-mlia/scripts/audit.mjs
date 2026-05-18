#!/usr/bin/env node
/**
 * Auditoría read-only del WordPress de Grupo MLIA.
 *
 * No escribe NADA en el sitio. Recolecta vía REST API:
 *   - Identidad del sitio (name, description, settings, front page).
 *   - Post types / CPTs (revela el modelo de negocio: eventos, catering, etc.).
 *   - Páginas (jerarquía, slugs, estado) + SEO Yoast (yoast_head_json).
 *   - Posts, categorías, tags, totales de media.
 *   - HTML renderizado de la home + páginas clave (la propuesta de valor real
 *     suele vivir en el page builder, no en el campo content del REST).
 *
 * Salida: JSON completo a un fichero + resumen ejecutivo por stdout.
 *
 * USO:
 *   node clients/grupo-mlia/scripts/audit.mjs [--out=ruta.json]
 *
 * Lee credenciales de web/.env.local (MLIA_WP_*). Sin deps externas.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const ENV_PATH = process.env.MLIA_ENV_FILE || resolve(REPO_ROOT, "web/.env.local");

const outArg = process.argv.find((a) => a.startsWith("--out="));
const OUT = outArg ? outArg.split("=")[1] : "c:/tmp/mlia-audit.json";

function loadEnv(path) {
  let raw;
  try { raw = readFileSync(path, "utf8"); }
  catch { console.error(`No encuentro ${path}`); process.exit(1); }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnv(ENV_PATH);

const BASE = (process.env.MLIA_WP_BASE_URL || "").replace(/\/+$/, "");
const AUTH = "Basic " + Buffer.from(`${process.env.MLIA_WP_USER}:${process.env.MLIA_WP_APP_PASS}`).toString("base64");
const H = { Authorization: AUTH, "User-Agent": "PACAME-Bot/1.0 (+https://pacameagencia.com)" };

async function api(path) {
  const url = path.startsWith("http") ? path : `${BASE}/wp-json/${path}`;
  const res = await fetch(url, { headers: H });
  const total = res.headers.get("x-wp-total");
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, total, data };
}
async function html(path) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, { headers: { "User-Agent": H["User-Agent"] } });
  const t = await res.text();
  return { ok: res.ok, status: res.status, length: t.length, body: t };
}
function stripHtml(s = "") {
  return String(s)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "-")
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const report = { base: BASE, audited_at: new Date().toISOString() };

console.log(`\n🔎 Auditoría Grupo MLIA — ${BASE}\n`);

// 1. Identidad
const root = await api("");
report.site = {
  name: root.data?.name, description: root.data?.description,
  url: root.data?.url, home: root.data?.home,
  namespaces: root.data?.namespaces,
  timezone: root.data?.timezone_string, gmt_offset: root.data?.gmt_offset,
};
const settings = await api("wp/v2/settings");
if (settings.ok) {
  report.settings = {
    title: settings.data.title, description: settings.data.description,
    language: settings.data.language, timezone: settings.data.timezone_string,
    show_on_front: settings.data.show_on_front, page_on_front: settings.data.page_on_front,
    posts_per_page: settings.data.posts_per_page,
  };
}
console.log(`Sitio: ${report.site.name} — "${report.site.description}"`);
console.log(`Namespaces: ${(report.site.namespaces || []).join(", ")}`);

// 2. Post types (CPTs = modelo de negocio)
const types = await api("wp/v2/types");
report.types = {};
if (types.ok) {
  for (const [key, t] of Object.entries(types.data)) {
    report.types[key] = { name: t.name, rest_base: t.rest_base, slug: t.slug };
  }
}
console.log(`\nTipos de contenido: ${Object.keys(report.types).join(", ")}`);

// 3. Recolectar entradas por tipo relevante
const SKIP = new Set(["attachment", "wp_block", "wp_template", "wp_template_part", "wp_navigation", "nav_menu_item", "wp_global_styles", "wp_font_family", "wp_font_face"]);
report.content = {};
for (const [key, t] of Object.entries(report.types)) {
  if (SKIP.has(key) || !t.rest_base) continue;
  const r = await api(`wp/v2/${t.rest_base}?per_page=100&status=publish,draft,private,future&_fields=id,slug,status,link,parent,menu_order,title,excerpt,date,yoast_head_json`);
  if (!r.ok) { report.content[key] = { error: r.status }; continue; }
  const items = (Array.isArray(r.data) ? r.data : []).map((p) => ({
    id: p.id, slug: p.slug, status: p.status, link: p.link, parent: p.parent,
    title: stripHtml(p.title?.rendered || ""),
    excerpt: stripHtml(p.excerpt?.rendered || "").slice(0, 220),
    seo_title: p.yoast_head_json?.title || null,
    seo_desc: p.yoast_head_json?.description || null,
    og_image: p.yoast_head_json?.og_image?.[0]?.url || null,
  }));
  report.content[key] = { total: r.total || items.length, items };
  console.log(`  ${key}: ${items.length} entradas (X-WP-Total=${r.total ?? "?"})`);
}

// 4. Taxonomías
for (const tax of ["categories", "tags"]) {
  const r = await api(`wp/v2/${tax}?per_page=100&_fields=id,name,slug,count`);
  if (r.ok) report[tax] = (r.data || []).map((c) => ({ name: c.name, slug: c.slug, count: c.count }));
}
const media = await api("wp/v2/media?per_page=1&_fields=id");
report.media_total = media.total || null;

// 5. Menús de navegación (si REST los expone)
const menuItems = await api("wp/v2/menu-items?per_page=100&_fields=id,title,url,menu_order,parent,object,object_id");
if (menuItems.ok && Array.isArray(menuItems.data)) {
  report.menu = menuItems.data
    .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0))
    .map((m) => ({ title: stripHtml(m.title?.rendered || m.title || ""), url: m.url, object: m.object }));
}

// 6. HTML real de la home + páginas clave (propuesta de valor)
const keyPaths = new Set(["/"]);
for (const p of report.content.page?.items || []) {
  try { keyPaths.add(new URL(p.link).pathname); } catch {}
}
report.pages_html = {};
let n = 0;
for (const path of keyPaths) {
  if (n++ > 12) break;
  const h = await html(path);
  if (!h.ok) { report.pages_html[path] = { status: h.status }; continue; }
  const titleM = h.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descM = h.body.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const h1s = [...h.body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripHtml(m[1])).filter(Boolean);
  const h2s = [...h.body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => stripHtml(m[1])).filter(Boolean).slice(0, 12);
  report.pages_html[path] = {
    http: h.status, html_title: titleM ? stripHtml(titleM[1]) : null,
    meta_description: descM ? descM[1] : null,
    h1: h1s.slice(0, 5), h2: h2s,
    text_excerpt: stripHtml(h.body).slice(0, 1500),
  };
}

writeFileSync(OUT, JSON.stringify(report, null, 2), "utf8");
console.log(`\n📄 JSON completo → ${OUT}`);
console.log(`\n──── DIGEST ────`);
console.log(`Páginas: ${report.content.page?.items?.length || 0} | Posts: ${report.content.post?.items?.length || 0} | Media: ${report.media_total}`);
console.log(`CPTs no estándar: ${Object.keys(report.types).filter((k) => !["post","page","attachment","nav_menu_item","wp_block","wp_template","wp_template_part","wp_navigation","wp_global_styles","wp_font_family","wp_font_face"].includes(k)).join(", ") || "(ninguno)"}`);
console.log(`Home <title>: ${report.pages_html["/"]?.html_title || "?"}`);
console.log(`Home H1: ${(report.pages_html["/"]?.h1 || []).join(" | ") || "(sin H1)"}`);
console.log(`────────────────\n`);
