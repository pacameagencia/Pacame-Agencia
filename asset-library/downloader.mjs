#!/usr/bin/env node
// Freepik asset-library downloader (standalone, for Pablo's personal library).
// Reads categories.json, searches Freepik, downloads each result, indexes metadata.
//
// Usage:
//   node downloader.mjs            → downloads whatever count is set in categories.json
//   node downloader.mjs --dry-run  → searches only, no downloads (useful to preview)

import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(ROOT, "..", "web", ".env.local");
const CATALOG_FILE = path.join(ROOT, "catalog", "index.json");
const CATEGORIES_FILE = path.join(ROOT, "categories.json");
const ASSETS_DIR = path.join(ROOT, "assets");
const DRY_RUN = process.argv.includes("--dry-run");

const BASE = "https://api.freepik.com/v1";
const REQUEST_GAP_MS = 1500;

// ── env loader (no dotenv dep) ─────────────────────────────────────
async function loadEnv() {
  const raw = await fs.readFile(ENV_PATH, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    if (!process.env[k]) process.env[k] = v.replace(/^["']|["']$/g, "");
  }
}

// ── helpers ────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function headers() {
  const key = process.env.FREEPIK_API_KEY;
  if (!key) throw new Error("FREEPIK_API_KEY missing in web/.env.local");
  return { "x-freepik-api-key": key.trim() };
}

async function loadCatalog() {
  try {
    return JSON.parse(await fs.readFile(CATALOG_FILE, "utf8"));
  } catch {
    return { items: {}, lastRun: null };
  }
}

async function saveCatalog(catalog) {
  catalog.lastRun = new Date().toISOString();
  await fs.writeFile(CATALOG_FILE, JSON.stringify(catalog, null, 2));
}

function sanitize(name) {
  return name.replace(/[^\w\-.]+/g, "_").slice(0, 80);
}

function guessExt(urlOrCtype) {
  const m = urlOrCtype.match(/\.(jpe?g|png|webp|zip|psd|eps|ai|svg|mp4|mov|mp3|wav|pdf|ttf|otf)(\?|$)/i);
  return m ? `.${m[1].toLowerCase()}` : ".bin";
}

// ── Freepik API ────────────────────────────────────────────────────
async function searchStock(cat, page = 1, perPage = 50) {
  const params = new URLSearchParams({
    term: cat.term,
    page: String(page),
    limit: String(perPage),
  });
  if (cat.order_by) params.set("order", cat.order_by);
  if (cat.content_type) params.append("filters[content_type][]", cat.content_type);
  if (cat.license) params.append("filters[license][]", cat.license);

  const url = `${BASE}/resources?${params}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`search failed ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function getDownloadUrl(resourceId) {
  const res = await fetch(`${BASE}/resources/${resourceId}/download`, { headers: headers() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`download endpoint failed ${res.status}: ${body.slice(0, 200)}`);
  }
  const j = await res.json();
  return j?.data?.url || j?.data?.download_url || j?.url;
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`file fetch ${res.status} for ${url}`);
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await pipeline(res.body, createWriteStream(destPath));
}

// ── main per-category loop ─────────────────────────────────────────
async function processCategory(cat, catalog) {
  console.log(`\n━━ ${cat.slug}  (${cat.term})`);
  const targetDir = path.join(ASSETS_DIR, cat.slug);
  await fs.mkdir(targetDir, { recursive: true });

  let collected = 0;
  let page = 1;
  const perPage = Math.min(50, cat.count);

  while (collected < cat.count) {
    await sleep(REQUEST_GAP_MS);
    let result;
    try {
      result = await searchStock(cat, page, perPage);
    } catch (err) {
      console.warn(`  search error page ${page}: ${err.message}`);
      break;
    }
    const items = result?.data || [];
    if (!items.length) {
      console.log(`  no more results at page ${page}`);
      break;
    }

    for (const item of items) {
      if (collected >= cat.count) break;
      const id = String(item.id);
      if (catalog.items[id]) {
        console.log(`  skip (have) ${id}`);
        continue;
      }

      const title = item.title || item.name || `item-${id}`;
      const entry = {
        id,
        title,
        category: cat.slug,
        term: cat.term,
        content_type: item?.image?.type || cat.content_type,
        license: item?.licenses?.[0]?.type || cat.license,
        source: item?.url || item?.image?.source?.url,
        preview: item?.image?.source?.url || item?.thumbnails?.[0]?.url,
        downloaded_at: null,
        file: null,
      };

      if (DRY_RUN) {
        console.log(`  [dry] ${id}  ${title.slice(0, 60)}`);
        catalog.items[id] = entry;
        collected++;
        continue;
      }

      try {
        await sleep(REQUEST_GAP_MS);
        const url = await getDownloadUrl(id);
        if (!url) throw new Error("no download url returned");
        const ext = guessExt(url);
        const fname = `${id}_${sanitize(title)}${ext}`;
        const fullPath = path.join(targetDir, fname);
        await downloadFile(url, fullPath);
        entry.downloaded_at = new Date().toISOString();
        entry.file = path.relative(ROOT, fullPath).replace(/\\/g, "/");
        catalog.items[id] = entry;
        collected++;
        console.log(`  ✓ ${collected}/${cat.count}  ${fname}`);
        await saveCatalog(catalog);
      } catch (err) {
        console.warn(`  ✗ ${id}  ${err.message}`);
      }
    }

    if (page >= (result?.meta?.last_page || page)) break;
    page++;
  }

  console.log(`  done: ${collected} new`);
  return collected;
}

// ── entrypoint ─────────────────────────────────────────────────────
async function main() {
  await loadEnv();
  const config = JSON.parse(await fs.readFile(CATEGORIES_FILE, "utf8"));
  const catalog = await loadCatalog();

  console.log(`Freepik downloader${DRY_RUN ? "  [DRY-RUN]" : ""}`);
  console.log(`Key: ${process.env.FREEPIK_API_KEY ? "loaded" : "MISSING"}`);
  console.log(`Categories: ${config.categories.length}`);
  console.log(`Already in catalog: ${Object.keys(catalog.items).length} items`);

  let total = 0;
  for (const cat of config.categories) {
    total += await processCategory(cat, catalog);
  }

  await saveCatalog(catalog);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`TOTAL new items: ${total}`);
  console.log(`Catalog size:    ${Object.keys(catalog.items).length}`);
  console.log(`Catalog file:    ${path.relative(process.cwd(), CATALOG_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
