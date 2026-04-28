#!/usr/bin/env node
/**
 * Regenera escenas S2 y S6 que fallaron en producción inicial.
 * Genera hero + clip video + integra con clips existentes y rehace el final.
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

const SCENES = [
  {
    id: "S2-empty-office",
    type: "abstract",
    prompt: "Cinematic vertical photo of empty 1990s corporate office at twilight, dusty old computers, scattered papers, cold blue moonlight, deep shadows, melancholic, Severance aesthetic, 35mm film grain.",
  },
  {
    id: "S6-pablo-hero-final",
    type: "edit",
    prompt: "Cinematic close-up portrait, vertical, the same man from reference, slight confident smirk, intense direct gaze. Violet key light from below, cyan rim light behind, black background. Black turtleneck. 35mm anamorphic, Hollywood biopic.",
  },
];

async function generateImage(s) {
  const body = s.type === "edit"
    ? { model: "google/nano-banana-2/edit", prompt: s.prompt, images: [PABLO_REF] }
    : { model: "google/nano-banana-2/text-to-image", prompt: s.prompt };
  const r = await fetch("https://api.atlascloud.ai/api/v1/model/generateImage", {
    method: "POST",
    headers: { "Authorization": `Bearer ${ATLAS}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.data?.id) throw new Error(`img create: ${JSON.stringify(j).slice(0, 200)}`);
  return j.data.id;
}

async function generateVideo(scene) {
  const body = {
    model: "bytedance/seedance-2.0-fast/image-to-video",
    prompt: scene.prompt + " Slow cinematic camera, gentle dolly-in, photorealistic.",
    image: scene.heroUrl,
    duration: 5,
    aspect_ratio: "9:16",
  };
  const r = await fetch("https://api.atlascloud.ai/api/v1/model/generateVideo", {
    method: "POST",
    headers: { "Authorization": `Bearer ${ATLAS}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.data?.id) throw new Error(`vid create: ${JSON.stringify(j).slice(0, 200)}`);
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
    if (s === "completed" || s === "succeeded") {
      const url = j.data?.outputs?.[0];
      if (typeof url === "string") return url;
      throw new Error(`${label}: no output`);
    }
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

console.log("Regenerando S2 + S6...");

const heroes = [];
for (const s of SCENES) {
  const r = await withRetry(async () => {
    const id = await generateImage(s);
    const url = await poll(id, `img-${s.id}`);
    const file = path.join(OUT, `hero-${s.id}.jpg`);
    await downloadTo(url, file);
    console.log(`  ✓ hero-${s.id}.jpg`);
    return { ...s, heroFile: file, heroUrl: url };
  }, s.id);
  heroes.push(r);
}

// COST GUARD · Seedance 2.0 Fast × N escenas
await assertVideoApproved({
  model: "bytedance/seedance-2.0-fast/image-to-video",
  scenes: heroes.length,
  durationPerScene: 5,
  purpose: `teaser-fix-missing.mjs · regenerar ${heroes.length} clip(s) Seedance Fast`,
});

console.log("\nGenerando clips...");
for (const s of heroes) {
  await withRetry(async () => {
    const id = await generateVideo(s);
    const url = await poll(id, `vid-${s.id}`, 600);
    const file = path.join(OUT, `clip-${s.id}.mp4`);
    await downloadTo(url, file);
    console.log(`  ✓ clip-${s.id}.mp4`);
  }, `vid-${s.id}`);
}

console.log("\nFFmpeg compose 30s final...");

// Orden narrativo
const ORDER = [
  "S1-silhouette-city",
  "S2-empty-office",
  "S3-pablo-monitors",
  "S4-hologram-agents",
  "S5-fast-cuts-screens",
  "S6-pablo-hero-final",
];

const concatList = path.join(OUT, "concat.txt");
fs.writeFileSync(concatList, ORDER.map(id => `file '${path.join(OUT, `clip-${id}.mp4`).replaceAll("\\", "/")}'`).join("\n"));

const concatVideo = path.join(OUT, "concat-video.mp4");
execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c:v copy -an "${concatVideo}"`, { stdio: "ignore" });

const voFile = path.join(OUT, "voiceover.mp3");
const finalVideo = path.join(OUT, "teaser-pacame-final.mp4");

execSync(`ffmpeg -y -i "${concatVideo}" -i "${voFile}" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "${finalVideo}"`, { stdio: "ignore" });

const stat = fs.statSync(finalVideo);
console.log(`\nDONE · ${(stat.size/1024/1024).toFixed(2)}MB`);
console.log(finalVideo);
