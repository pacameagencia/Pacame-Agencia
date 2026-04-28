#!/usr/bin/env node
/**
 * Fix S3 final: regenerar hero CON prompt anti-pendientes + clip Seedance FULL (no fast)
 * Si sigue saliendo el pendiente, cambiamos plano completamente.
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
const PABLO_REF = fs.readFileSync(path.join(OUT, "pablo-ref-url.txt"), "utf8").trim();

async function call(endpoint, body, label) {
  const r = await fetch(`https://api.atlascloud.ai/api/v1/model/${endpoint}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${ATLAS}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.data?.id) throw new Error(`${label}: ${JSON.stringify(j).slice(0, 200)}`);
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

// ─── Nuevo prompt S3: composición distinta evita oreja, foco en monitores ───

const S3_NEW_PROMPT = "Cinematic vertical 9:16. The same man from reference photo, seated facing forward toward camera in a dark control room with 6 ultrawide curved monitors arranged in a hemisphere around him. Intense violet purple glow from screens lights his face from front and below. He is wearing a black turtleneck with high collar covering both ears completely. Hands on a sleek black mechanical keyboard. Focused intense gaze locked on lens. He has clean bare ears with absolutely no earrings, no piercings on ears, no jewelry. Only a small black hoop nose ring on his left nostril. 35mm anamorphic film, deep chiaroscuro, violet-cyan grading.";

console.log("FIX S3 v2 · regenerando hero con prompt anti-pendientes...");

const heroS3Url = await withRetry(async () => {
  const id = await call("generateImage", { model: "google/nano-banana-2/edit", prompt: S3_NEW_PROMPT, images: [PABLO_REF] }, "img-S3");
  return await poll(id, "hero-S3");
}, "hero-S3");

await downloadTo(heroS3Url, path.join(OUT, "hero-S3-pablo-monitors.jpg"));
console.log("  ✓ hero-S3 regenerado");

// Re-subir para que Seedance lo coja con URL fresca y estable
const heroBuf = fs.readFileSync(path.join(OUT, "hero-S3-pablo-monitors.jpg"));
const filename = `hero-S3-fix3-${Date.now()}.jpg`;
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
await fetch(`${SUPA}/storage/v1/object/social-public/${filename}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, "Content-Type": "image/jpeg" },
  body: heroBuf,
});
const supaUrl = `${SUPA}/storage/v1/object/public/social-public/${filename}`;
console.log(`  ↑ supabase: ${supaUrl}`);

// COST GUARD · Seedance 2.0 FULL (no fast) → más caro: 5s × $0.127 = $0.64
await assertVideoApproved({
  model: "bytedance/seedance-2.0/image-to-video",
  scenes: 1,
  durationPerScene: 5,
  purpose: "teaser-fix-3-s3.mjs · regenerar clip S3 con Seedance FULL (mejor prompt-following)",
});

console.log("\nFIX S3 v2 · clip Seedance 2.0 FULL (mejor prompt-following)...");
const clipS3Url = await withRetry(async () => {
  const id = await call("generateVideo", {
    model: "bytedance/seedance-2.0/image-to-video",
    prompt: "Slow cinematic dolly-in toward the man at the keyboard. Photorealistic. The man has bare clean ears with absolutely NO earrings, NO ear piercings, NO jewelry on ears.",
    image: supaUrl,
    duration: 5,
    aspect_ratio: "9:16",
  }, "vid-S3");
  return await poll(id, "vid-S3", 600);
}, "vid-S3");
await downloadTo(clipS3Url, path.join(OUT, "clip-S3-pablo-monitors.mp4"));
console.log("  ✓ clip-S3 regenerado");

// ─── Recompose ────────────────────────────────────────────────

console.log("\nRecomponiendo final...");

const ORDER = [
  "S1-silhouette-city",
  "S2-empty-office",
  "S3-pablo-monitors",
  "S4-hologram-agents",
  "S5-fast-cuts-screens",
  "S6-pablo-hero-final",
];

const normalized = [];
for (const id of ORDER) {
  const src = path.join(OUT, `clip-${id}.mp4`);
  const dst = path.join(OUT, `norm-${id}.mp4`);
  execSync(`ffmpeg -y -i "${src}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -an -t 5 "${dst}"`, { stdio: "ignore" });
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
execSync(`ffmpeg -y -i "${concatVideo}" -i "${audioFile}" -filter_complex "[0:v]${textFilter}[v]" -map "[v]" -map 1:a -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "${finalFile}"`, { stdio: "ignore" });

const stat = fs.statSync(finalFile);
const dur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalFile}"`).toString().trim();
console.log(`\nFINAL · ${(stat.size/1024/1024).toFixed(2)}MB · ${parseFloat(dur).toFixed(2)}s`);

for (const p of normalized) fs.unlinkSync(p);
fs.unlinkSync(listFile);
fs.unlinkSync(concatVideo);
fs.unlinkSync(audioFile);
console.log("Cleanup ok.");
