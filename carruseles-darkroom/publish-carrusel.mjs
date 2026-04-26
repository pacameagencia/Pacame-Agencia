#!/usr/bin/env node
/**
 * Publish carrusel a Instagram Business autonomously.
 *
 * Pipeline:
 *   1. Sube los 5 PNG a Supabase Storage (bucket público "social-public") → 5 URLs HTTPS
 *   2. Llama a IG Graph API publishCarousel: 5 child containers → 1 carousel container → publish
 *   3. Devuelve post_id + URL del post
 *
 * Requiere:
 *   - SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL (para upload)
 *   - INSTAGRAM_ACCESS_TOKEN (vivo · no expirado) + INSTAGRAM_ACCOUNT_ID (publish)
 *
 * Uso:
 *   node publish-carrusel.mjs <carpeta_carrusel>      # ej: output/carrusel-gpt-image-2
 *   node publish-carrusel.mjs <carpeta_carrusel> --dry-run   # solo sube imgs, no publica
 *   node publish-carrusel.mjs <carpeta_carrusel> --upload-only  # solo upload Supabase
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Env ───────────────────────────────
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, "web", ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const IG_TOKEN = env.INSTAGRAM_ACCESS_TOKEN;
const IG_ACCOUNT = env.INSTAGRAM_ACCOUNT_ID;
const BUCKET = "social-public";
const GRAPH = "https://graph.facebook.com/v21.0";

if (!SUPA_URL || !SUPA_KEY) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

// ─── Supabase Storage helpers ───────────────────────────────

async function ensureBucket() {
  // Check if exists
  const r = await fetch(`${SUPA_URL}/storage/v1/bucket/${BUCKET}`, {
    headers: { Authorization: `Bearer ${SUPA_KEY}`, apikey: SUPA_KEY },
  });
  if (r.ok) return; // exists
  // Create public bucket
  const create = await fetch(`${SUPA_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPA_KEY}`,
      apikey: SUPA_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: 10 * 1024 * 1024,
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
    }),
  });
  if (!create.ok) {
    const err = await create.text();
    if (!/already exists/i.test(err)) {
      throw new Error(`Create bucket failed: ${err.slice(0, 300)}`);
    }
  }
  console.log(`  ✓ bucket "${BUCKET}" ready`);
}

async function uploadFile(localPath, remotePath) {
  // IG Graph API rejected Supabase Storage URLs (subcode 2207052).
  // Workaround: upload to catbox.moe (simpler CDN, IG-compatible).
  const buf = await sharp(localPath)
    .jpeg({ quality: 90, progressive: false, mozjpeg: false, chromaSubsampling: "4:2:0" })
    .toBuffer();
  const fd = new FormData();
  fd.append("reqtype", "fileupload");
  fd.append("fileToUpload", new Blob([buf], { type: "image/jpeg" }), "slide.jpg");
  const r = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: fd });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`catbox upload failed ${r.status}: ${err.slice(0, 200)}`);
  }
  const url = (await r.text()).trim();
  if (!url.startsWith("https://")) {
    throw new Error(`catbox unexpected response: ${url.slice(0, 200)}`);
  }
  return url;
}

// ─── Instagram Graph API helpers ───────────────────────────────

async function igCreateChildContainer(imageUrl) {
  const r = await fetch(`${GRAPH}/${IG_ACCOUNT}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      is_carousel_item: true,
      access_token: IG_TOKEN,
    }),
  });
  const j = await r.json();
  if (!r.ok || !j.id) throw new Error(`child container failed: ${JSON.stringify(j).slice(0, 300)}`);
  return j.id;
}

async function igCreateCarouselContainer(childIds, caption) {
  const r = await fetch(`${GRAPH}/${IG_ACCOUNT}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "CAROUSEL",
      caption,
      children: childIds.join(","),
      access_token: IG_TOKEN,
    }),
  });
  const j = await r.json();
  if (!r.ok || !j.id) throw new Error(`carousel container failed: ${JSON.stringify(j).slice(0, 300)}`);
  return j.id;
}

async function igPublish(creationId) {
  const r = await fetch(`${GRAPH}/${IG_ACCOUNT}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: IG_TOKEN,
    }),
  });
  const j = await r.json();
  if (!r.ok || !j.id) throw new Error(`publish failed: ${JSON.stringify(j).slice(0, 300)}`);
  return j.id;
}

async function igPostUrl(postId) {
  const r = await fetch(`${GRAPH}/${postId}?fields=permalink&access_token=${IG_TOKEN}`);
  const j = await r.json();
  return j.permalink;
}

// ─── Caption + hashtags loader ─────────────────────────────────

function loadCaption(carouselDir) {
  const captionMd = path.join(carouselDir, "CAPTION.md");
  if (!fs.existsSync(captionMd)) {
    return "Carrusel Dark Room · darkroomcreative.cloud · link en bio";
  }
  const md = fs.readFileSync(captionMd, "utf8");
  // Extract first triple-backtick block (Caption Instagram)
  const m = md.match(/```\n([\s\S]*?)\n```/);
  if (!m) return md.slice(0, 2200);
  return m[1].trim();
}

// ─── Main ───────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const carouselDir = path.resolve(args.find((a) => !a.startsWith("--")) || "output/carrusel-gpt-image-2");
  const dryRun = args.includes("--dry-run");
  const uploadOnly = args.includes("--upload-only");

  if (!fs.existsSync(carouselDir)) {
    console.error(`Carpeta no existe: ${carouselDir}`);
    process.exit(1);
  }

  console.log(`\n═══ PUBLISH CARRUSEL ═══`);
  console.log(`Source: ${carouselDir}`);
  console.log(`Dry run: ${dryRun} · Upload only: ${uploadOnly}\n`);

  // Find slide-1.png ... slide-N.png in root
  const slides = [];
  for (let n = 1; n <= 10; n++) {
    const p = path.join(carouselDir, `slide-${n}.png`);
    if (fs.existsSync(p)) slides.push({ n, path: p });
    else break;
  }
  if (slides.length < 2 || slides.length > 10) {
    throw new Error(`Necesito 2-10 slides · encontrados ${slides.length}`);
  }
  console.log(`Slides: ${slides.length}`);

  // 1. Ensure bucket + upload
  console.log(`\n[1/3] Subiendo ${slides.length} imágenes a Supabase Storage...`);
  await ensureBucket();
  const stamp = Date.now();
  const urls = [];
  for (const s of slides) {
    // Flat path (some CDNs / IG fetcher misbehave with nested paths)
    const remote = `s${s.n}-${stamp}.png`;
    process.stdout.write(`  → slide-${s.n} ... `);
    const url = await uploadFile(s.path, remote);
    console.log(`ok\n     ${url}`);
    urls.push(url);
  }

  if (uploadOnly) {
    console.log(`\n[done] Upload only · URLs:`);
    urls.forEach((u) => console.log(`  ${u}`));
    return;
  }

  // Verify token IG before continuing
  if (!IG_TOKEN || !IG_ACCOUNT) {
    console.error(`\n✗ Falta INSTAGRAM_ACCESS_TOKEN o INSTAGRAM_ACCOUNT_ID en .env.local`);
    console.error(`  URLs subidas (las puedes usar manual):`);
    urls.forEach((u) => console.log(`    ${u}`));
    process.exit(1);
  }

  // 2. Read caption
  const caption = loadCaption(carouselDir);
  console.log(`\n[2/3] Caption (${caption.length} chars): "${caption.slice(0, 80)}..."\n`);

  if (dryRun) {
    console.log(`[dry-run] Stop here · no se publica.`);
    console.log(`URLs subidas:`);
    urls.forEach((u) => console.log(`  ${u}`));
    return;
  }

  // 3. IG publish carousel
  console.log(`[3/3] Publicando en Instagram (account ${IG_ACCOUNT})...`);
  process.stdout.write(`  → child containers `);
  const childIds = [];
  for (const url of urls) {
    const id = await igCreateChildContainer(url);
    process.stdout.write(`✓ `);
    childIds.push(id);
  }
  console.log(`(${childIds.length})`);

  process.stdout.write(`  → carousel container ... `);
  const carContainerId = await igCreateCarouselContainer(childIds, caption);
  console.log(`ok (${carContainerId})`);

  // Wait a bit for IG to process
  await new Promise((r) => setTimeout(r, 5000));

  process.stdout.write(`  → publishing ... `);
  const postId = await igPublish(carContainerId);
  console.log(`ok\n`);

  console.log(`✅ POST PUBLISHED · id=${postId}`);
  try {
    const url = await igPostUrl(postId);
    if (url) console.log(`   ${url}`);
  } catch {}
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
