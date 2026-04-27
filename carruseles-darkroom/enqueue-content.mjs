#!/usr/bin/env node
/**
 * Encolar un carrusel/post para auto-publish.
 *
 * Sube los slide-N.png de una carpeta a catbox.moe y crea una fila en
 * la tabla content_queue de Supabase. El cron /api/agents/auto-publish
 * la consumirá en la ventana programada.
 *
 * Uso:
 *   node enqueue-content.mjs <carpeta> --brand=darkroom --slot=morning --when=2026-04-28T09:00
 *   node enqueue-content.mjs <carpeta> --brand=pacame --slot=evening --when=2026-04-28T19:00
 *
 * Requisitos en la carpeta:
 *   - slide-1.png ... slide-N.png  (1-10 imágenes)
 *   - CAPTION.md (primer bloque ``` ``` se usa como caption + hashtags)
 *
 * Defaults:
 *   --format=carousel  (carousel | post | story)
 *   --source=manual
 *   --brand=darkroom
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, "web", ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);

const args = process.argv.slice(2);
const folder = args.find((a) => !a.startsWith("--"));
if (!folder) { console.error("uso: enqueue-content.mjs <carpeta> [--brand=...] [--slot=...] [--when=ISO] [--format=carousel|post|story]"); process.exit(1); }

const opts = Object.fromEntries(
  args.filter((a) => a.startsWith("--")).map((a) => { const [k, v] = a.slice(2).split("="); return [k, v ?? "true"]; })
);

const BRAND = opts.brand || "darkroom";
const SLOT = opts.slot || "adhoc";
const FORMAT = opts.format || "carousel";
const SOURCE = opts.source || "manual";
const WHEN = opts.when ? new Date(opts.when).toISOString() : new Date().toISOString();

if (!["darkroom", "pacame"].includes(BRAND)) { console.error("brand debe ser darkroom o pacame"); process.exit(1); }
if (!["morning", "evening", "adhoc"].includes(SLOT)) { console.error("slot debe ser morning|evening|adhoc"); process.exit(1); }
if (!["carousel", "post", "story"].includes(FORMAT)) { console.error("format debe ser carousel|post|story"); process.exit(1); }

const folderPath = path.resolve(folder);
if (!fs.existsSync(folderPath)) { console.error(`no existe: ${folderPath}`); process.exit(1); }

const slides = fs
  .readdirSync(folderPath)
  .filter((f) => /^slide-\d+\.(png|jpe?g)$/i.test(f))
  .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));
if (slides.length === 0) { console.error("no slides en carpeta"); process.exit(1); }

let caption = "", hashtags = "";
const captionPath = path.join(folderPath, "CAPTION.md");
if (fs.existsSync(captionPath)) {
  const raw = fs.readFileSync(captionPath, "utf8");
  const m = raw.match(/```[a-z]*\s*\n([\s\S]*?)\n```/);
  if (m) {
    const full = m[1].trim();
    const idx = full.lastIndexOf("\n#");
    if (idx > 0 && full.slice(idx + 1).match(/^#\w+/)) {
      caption = full.slice(0, idx).trim();
      hashtags = full.slice(idx + 1).trim();
    } else {
      caption = full;
    }
  }
}
if (!caption) { console.error("CAPTION.md vacío o sin bloque ```"); process.exit(1); }

console.log(`📋 ${slides.length} slides · brand=${BRAND} · slot=${SLOT} · when=${WHEN}`);

async function uploadCatbox(localPath) {
  const buf = await sharp(localPath)
    .jpeg({ quality: 90, progressive: false, mozjpeg: false, chromaSubsampling: "4:2:0" })
    .toBuffer();
  const fd = new FormData();
  fd.append("reqtype", "fileupload");
  fd.append("fileToUpload", new Blob([buf], { type: "image/jpeg" }), path.basename(localPath));
  const r = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: fd });
  if (!r.ok) throw new Error(`catbox ${r.status}`);
  const url = (await r.text()).trim();
  if (!url.startsWith("https://")) throw new Error(`catbox bad: ${url.slice(0, 100)}`);
  return url;
}

const urls = [];
for (const s of slides) {
  const local = path.join(folderPath, s);
  process.stdout.write(`  ↑ ${s} ... `);
  const u = await uploadCatbox(local);
  console.log(u);
  urls.push(u);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase
  .from("content_queue")
  .insert({
    scheduled_at: WHEN,
    brand: BRAND,
    slot: SLOT,
    format: FORMAT,
    image_urls: urls,
    caption,
    hashtags: hashtags || null,
    source: SOURCE,
    notes: `folder=${path.basename(folderPath)}`,
  })
  .select("id")
  .single();

if (error) { console.error("insert fail:", error.message); process.exit(1); }

console.log(`\nencolado · id=${data.id} · scheduled=${WHEN}`);
console.log(`   el cron /api/agents/auto-publish lo recogerá en la próxima pasada (cada ${SLOT === "morning" ? "11:00 ES" : SLOT === "evening" ? "21:00 ES" : "5 min via dispatcher manual"})`);
