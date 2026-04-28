#!/usr/bin/env node
/**
 * Fix 2 problemas detectados en teaser:
 *  - S5 hero+clip: logos Mr Robot/Apple visibles → regenerar SIN marcas reales
 *  - S3 clip: Seedance añadió pendiente que Pablo no lleva → regenerar clip con prompt anti-jewelry
 *    (la hero S3 estaba OK, solo se regenera el video)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { assertVideoApproved } from "./lib/cost-guard.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "output", "teaser-pacame");

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, "web", ".env.local"), "utf8")
    .split("\n").filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g, "")]; })
);
const ATLAS = env.ATLAS_API_KEY;

async function generateImage(body) {
  const r = await fetch("https://api.atlascloud.ai/api/v1/model/generateImage", {
    method: "POST",
    headers: { "Authorization": `Bearer ${ATLAS}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.data?.id) throw new Error(`img: ${JSON.stringify(j).slice(0, 200)}`);
  return j.data.id;
}

async function generateVideo(body) {
  const r = await fetch("https://api.atlascloud.ai/api/v1/model/generateVideo", {
    method: "POST",
    headers: { "Authorization": `Bearer ${ATLAS}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.data?.id) throw new Error(`vid: ${JSON.stringify(j).slice(0, 200)}`);
  return j.data.id;
}

async function poll(id, label, maxSec = 600) {
  for (let t = 0; t < maxSec; t += 5) {
    await new Promise(r => setTimeout(r, 5000));
    const r = await fetch(`https://api.atlascloud.ai/api/v1/model/prediction/${id}`, {
      headers: { "Authorization": `Bearer ${ATLAS}` },
    });
    const j = await r.json();
    const s = j.data?.status;
    if (s === "completed" || s === "succeeded") return j.data?.outputs?.[0];
    if (s === "failed") throw new Error(`${label}: ${j.data?.error}`);
    if ((t/5) % 6 === 0) process.stdout.write(`  ${label} t+${t}s ${s}\n`);
  }
  throw new Error(`${label}: timeout`);
}

async function withRetry(fn, label, max = 3) {
  let lastErr;
  for (let i = 1; i <= max; i++) {
    try { return await fn(); }
    catch (e) { lastErr = e; console.log(`  retry ${i}/${max} ${label}: ${e.message.slice(0, 100)}`); await new Promise(r => setTimeout(r, 3000)); }
  }
  throw lastErr;
}

async function downloadTo(url, file) {
  const buf = await (await fetch(url)).arrayBuffer();
  fs.writeFileSync(file, Buffer.from(buf));
}

// ─── FIX S5: nuevo hero + clip sin marcas reales ──────────────

console.log("FIX S5 · regenerando hero sin logos de marcas...");

const S5_HERO_PROMPT = "Cinematic vertical 9:16, extreme close-up macro of glossy black computer monitor screen filling frame. On the screen: original abstract holographic UI made of generic violet purple and cyan light, scrolling generic code lines with random programming syntax (no readable brand words), floating wireframe UI panels with simple shapes (circles, rectangles, charts, graphs), no logos, no recognizable brands, no text words, only abstract data visualization. Vertical scan-lines, screen reflections, motion blur. 35mm anamorphic, shallow DOF, deep blacks, violet-cyan color grading.";

const heroS5Url = await withRetry(async () => {
  const id = await generateImage({ model: "google/nano-banana-2/text-to-image", prompt: S5_HERO_PROMPT });
  return await poll(id, "hero-S5");
}, "hero-S5");
await downloadTo(heroS5Url, path.join(OUT, "hero-S5-fast-cuts-screens.jpg"));
console.log("  ✓ hero-S5 regenerado (sin marcas)");

// COST GUARD · 2 regeneraciones Seedance fast (S5 + S3) = ~10s total
await assertVideoApproved({
  model: "bytedance/seedance-2.0-fast/image-to-video",
  scenes: 2,
  durationPerScene: 5,
  purpose: "teaser-fix-2.mjs · regenerar clips S5 (sin marcas) + S3 (sin pendientes)",
});

console.log("FIX S5 · clip Seedance con nuevo hero...");
const clipS5Url = await withRetry(async () => {
  const id = await generateVideo({
    model: "bytedance/seedance-2.0-fast/image-to-video",
    prompt: "Slow cinematic camera dolly-in toward the screen, subtle digital data flow animation, photorealistic, no logos, no brands, abstract sci-fi UI only.",
    image: heroS5Url,
    duration: 5,
    aspect_ratio: "9:16",
  });
  return await poll(id, "vid-S5", 600);
}, "vid-S5");
await downloadTo(clipS5Url, path.join(OUT, "clip-S5-fast-cuts-screens.mp4"));
console.log("  ✓ clip-S5 regenerado");

// ─── FIX S3: solo regenerar clip Seedance con anti-jewelry ────

console.log("\nFIX S3 · regenerando clip con prompt anti-pendientes...");

// Re-subir hero-S3 a Supabase para que Seedance lo pueda fetch (URL fresca)
const heroS3Buf = fs.readFileSync(path.join(OUT, "hero-S3-pablo-monitors.jpg"));
const filename = `hero-S3-${Date.now()}.jpg`;
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const upRes = await fetch(`${SUPA}/storage/v1/object/social-public/${filename}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, "Content-Type": "image/jpeg" },
  body: heroS3Buf,
});
if (!upRes.ok) throw new Error(`supabase up: ${await upRes.text()}`);
const heroS3Url = `${SUPA}/storage/v1/object/public/social-public/${filename}`;
console.log(`  ↑ heroS3 → ${heroS3Url}`);

const clipS3Url = await withRetry(async () => {
  const id = await generateVideo({
    model: "bytedance/seedance-2.0-fast/image-to-video",
    prompt: "Slow cinematic camera dolly-in toward the man typing on keyboard. The man has plain ears with NO earrings, NO jewelry, NO ear piercings. He has only a small black hoop nose ring on his left nostril. Photorealistic Hollywood quality.",
    image: heroS3Url,
    duration: 5,
    aspect_ratio: "9:16",
  });
  return await poll(id, "vid-S3", 600);
}, "vid-S3");
await downloadTo(clipS3Url, path.join(OUT, "clip-S3-pablo-monitors.mp4"));
console.log("  ✓ clip-S3 regenerado (sin pendiente)");

// ─── Recompose final ───────────────────────────────────────────

console.log("\nRecomponiendo teaser final 30s...");

const ORDER = [
  "S1-silhouette-city",
  "S2-empty-office",
  "S3-pablo-monitors",
  "S4-hologram-agents",
  "S5-fast-cuts-screens",
  "S6-pablo-hero-final",
];

console.log("Re-encoding clips...");
const normalized = [];
for (const id of ORDER) {
  const src = path.join(OUT, `clip-${id}.mp4`);
  const dst = path.join(OUT, `norm-${id}.mp4`);
  execSync(
    `ffmpeg -y -i "${src}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -an -t 5 "${dst}"`,
    { stdio: "ignore" }
  );
  normalized.push(dst);
}

const listFile = path.join(OUT, "concat-norm.txt");
fs.writeFileSync(listFile, normalized.map(p => `file '${p.replaceAll("\\", "/")}'`).join("\n"));
const concatVideo = path.join(OUT, "concat-30s.mp4");
execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -an "${concatVideo}"`, { stdio: "ignore" });

const voSrc = path.join(OUT, "voiceover.mp3");
const audioFile = path.join(OUT, "audio-30s.m4a");
execSync(`ffmpeg -y -i "${voSrc}" -f lavfi -t 16.5 -i "anullsrc=r=44100:cl=stereo" -filter_complex "[0:a]apad=pad_dur=16.5,atrim=0:30,afade=t=out:st=29:d=1[a]" -map "[a]" -c:a aac -b:a 192k "${audioFile}"`, { stdio: "ignore" });

const fontPath = "C\\:/Windows/Fonts/arialbd.ttf";
const textFilter =
  `fade=t=in:st=0:d=0.5,fade=t=out:st=29:d=1,` +
  `drawtext=fontfile='${fontPath}':text='PACAME':fontcolor=white:fontsize=130:x=(w-text_w)/2:y=h*0.45:enable='between(t,27,30)':alpha='if(lt(t,27.3),(t-27)/0.3,1)',` +
  `drawtext=fontfile='${fontPath}':text='pacameagencia.com':fontcolor=0xCFCFCF:fontsize=46:x=(w-text_w)/2:y=h*0.58:enable='between(t,27.5,30)':alpha='if(lt(t,27.8),(t-27.5)/0.3,1)'`;

const finalFile = path.join(OUT, "teaser-pacame-final.mp4");
execSync(
  `ffmpeg -y -i "${concatVideo}" -i "${audioFile}" -filter_complex "[0:v]${textFilter}[v]" -map "[v]" -map 1:a -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "${finalFile}"`,
  { stdio: "ignore" }
);

const stat = fs.statSync(finalFile);
const dur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalFile}"`).toString().trim();
console.log(`\nFINAL · ${(stat.size/1024/1024).toFixed(2)}MB · ${parseFloat(dur).toFixed(2)}s`);

// Cleanup
for (const p of normalized) fs.unlinkSync(p);
fs.unlinkSync(listFile);
fs.unlinkSync(concatVideo);
fs.unlinkSync(audioFile);
console.log("Cleanup ok.");
