#!/usr/bin/env node
/**
 * Producción teaser cinematográfico PACAME 30s.
 *
 * Pipeline:
 *  1. Genera 6 hero shots (1080x1920 vertical IG/TikTok).
 *     - Tipo "edit": con foto Pablo como reference (preserva identidad)
 *     - Tipo "abstract": text-to-image puro (escenas sin cara)
 *  2. Image-to-video Seedance 2.0 Fast (5s cada × 6 = 30s).
 *  3. Voiceover ElevenLabs Brian (narrador cinematográfico ES).
 *  4. ffmpeg final: concatena clips + voz + música + logo overlay.
 *
 * Cost target: ~$4.50 USD total Atlas.
 *
 * Output: output/teaser-pacame/
 *  - hero-{1..6}.jpg          (1080x1920)
 *  - clip-{1..6}.mp4          (5s 1080x1920)
 *  - voiceover.mp3            (ElevenLabs)
 *  - teaser-pacame-final.mp4  (30s 1080x1920 con todo)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertVideoApproved } from "./lib/cost-guard.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "output", "teaser-pacame");
fs.mkdirSync(OUT, { recursive: true });

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, "web", ".env.local"), "utf8")
    .split("\n").filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g, "")]; })
);

const ATLAS = env.ATLAS_API_KEY;
const ELEVEN = env.ELEVENLABS_API_KEY;
const PABLO_REF = fs.readFileSync(path.join(OUT, "pablo-ref-url.txt"), "utf8").trim();

const PABLO = "the same man from reference photo, late 20s Spanish, voluminous dark brown hair quiff styled up, undercut fade sides, light stubble with thin goatee, small black hoop nose ring on left nostril";

// Vertical 9:16 IG/TikTok. Prompts cortos para evitar 400 errors.

const SCENES = [
  {
    id: "S1-silhouette-city",
    type: "edit",
    prompt: `Cinematic vertical 9:16. ${PABLO}, back to camera at floor-to-ceiling window of high-rise penthouse at night, looking at illuminated city skyline. Wearing dark grey hoodie. Deep blue night, cold rim light, dramatic silhouette. 35mm anamorphic film grain, teal-orange noir grading, Hollywood cinematic.`,
  },
  {
    id: "S2-empty-office",
    type: "abstract",
    prompt: `Cinematic vertical 9:16, abandoned 1990s corporate office at twilight. Rows of empty desks, dusty beige CRT monitors, flickering fluorescents, scattered papers, cold blue moonlight through dirty windows. Melancholic, the death of an industry. Heavy 35mm film grain, deep shadows, Severance aesthetic, desaturated cold tones.`,
  },
  {
    id: "S3-pablo-monitors",
    type: "edit",
    prompt: `Cinematic vertical 9:16. ${PABLO}, seated in dark control room surrounded by 6 ultrawide curved monitors, intense violet purple glow from screens lighting face from below. Hands on black mechanical keyboard. Black turtleneck. Focused intense gaze. Sci-fi tech noir, holographic UI on screens. 35mm anamorphic, deep chiaroscuro, violet-cyan grading, ultra detailed.`,
  },
  {
    id: "S4-hologram-agents",
    type: "abstract",
    prompt: `Cinematic vertical 9:16. Ten glowing wireframe geometric holograms floating in a circle, violet purple and cyan light beams, deep black void, particle dust, lens flare. Apple keynote teaser sci-fi aesthetic.`,
  },
  {
    id: "S5-fast-cuts-screens",
    type: "abstract",
    prompt: `Cinematic vertical 9:16, extreme close-up macro of glossy black computer screen. Cascading code, holographic UI panels, design mockups, brand logos morphing in vibrant violet purple and cyan light. Vertical scan-lines, screen reflection particles, motion blur. Mr Robot meets Apple Vision Pro keynote. 35mm anamorphic, shallow DOF, deep blacks, violet-cyan grading.`,
  },
  {
    id: "S6-pablo-hero-final",
    type: "edit",
    prompt: `Cinematic extreme close-up portrait, vertical 9:16. ${PABLO}, facing camera directly, slight confident smirk, intense gaze. Violet purple key light from below, cyan rim light behind highlighting hair, deep black background. Black turtleneck. Founder presenting vision. 35mm anamorphic film grain, violet-cyan-black grading, Hollywood biopic quality, Apple keynote opening shot.`,
  },
];

// ─── Atlas helpers ─────────────────────────────────────────────

async function generateImage(scene) {
  const body = scene.type === "edit"
    ? { model: "google/nano-banana-2/edit", prompt: scene.prompt, images: [PABLO_REF] }
    : { model: "google/nano-banana-2/text-to-image", prompt: scene.prompt };
  const r = await fetch("https://api.atlascloud.ai/api/v1/model/generateImage", {
    method: "POST",
    headers: { "Authorization": `Bearer ${ATLAS}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.data?.id) throw new Error(`create img ${scene.id} fail: ${JSON.stringify(j).slice(0, 200)}`);
  return j.data.id;
}

async function pollPrediction(id, label, maxSec = 240) {
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
      throw new Error(`${label} no output url`);
    }
    if (s === "failed") throw new Error(`${label} failed: ${j.data?.error}`);
    if ((t/5) % 6 === 0) process.stdout.write(`  ${label} t+${t}s ${s}\n`);
  }
  throw new Error(`${label} timeout`);
}

async function downloadTo(url, file) {
  const buf = await (await fetch(url)).arrayBuffer();
  fs.writeFileSync(file, Buffer.from(buf));
  return buf.byteLength;
}

// ─── PHASE 1: hero images ──────────────────────────────────────

console.log("PHASE 1 · 6 hero shots con nano-banana-2");

async function withRetry(fn, label, max = 2) {
  let lastErr;
  for (let i = 1; i <= max; i++) {
    try { return await fn(); }
    catch (e) { lastErr = e; console.log(`  retry ${i}/${max} ${label}: ${e.message.slice(0, 100)}`); }
  }
  throw lastErr;
}

const imgPromises = SCENES.map(async (s) => {
  return withRetry(async () => {
    const id = await generateImage(s);
    const url = await pollPrediction(id, s.id);
    const file = path.join(OUT, `hero-${s.id}.jpg`);
    await downloadTo(url, file);
    console.log(`  ✓ ${s.id} → ${path.basename(file)}`);
    return { ...s, heroFile: file, heroUrl: url };
  }, s.id);
});
const heroResults = await Promise.allSettled(imgPromises);
const heroes = [];
for (let i = 0; i < heroResults.length; i++) {
  const r = heroResults[i];
  if (r.status === "fulfilled") heroes.push(r.value);
  else console.log(`  ✗ ${SCENES[i].id} FAILED: ${r.reason?.message?.slice(0, 150)}`);
}
if (heroes.length < 4) throw new Error(`solo ${heroes.length}/6 heroes generados — abortando`);
console.log(`PHASE 1 done · 6 heroes generated · ~$0.48`);

// ─── PHASE 2: image-to-video Seedance 2.0 Fast ─────────────────

async function generateVideo(scene) {
  // scene.heroUrl es URL Atlas (público)
  const body = {
    model: "bytedance/seedance-2.0-fast/image-to-video",
    prompt: scene.prompt + " Slow cinematic camera: gentle dolly-in, subtle parallax, no fast motion. Photorealistic.",
    image: scene.heroUrl,
    duration: 5,
    aspect_ratio: "9:16",
  };
  let r = await fetch("https://api.atlascloud.ai/api/v1/model/generateVideo", {
    method: "POST",
    headers: { "Authorization": `Bearer ${ATLAS}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let j = await r.json();
  if (!j.data?.id) {
    // try alt model id
    body.model = "bytedance/seedance-2.0/image-to-video";
    r = await fetch("https://api.atlascloud.ai/api/v1/model/generateVideo", {
      method: "POST",
      headers: { "Authorization": `Bearer ${ATLAS}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    j = await r.json();
  }
  if (!j.data?.id) throw new Error(`video ${scene.id} fail: ${JSON.stringify(j).slice(0, 200)}`);
  return j.data.id;
}

// COST GUARD · NO seguir a Seedance sin aprobación vigente
await assertVideoApproved({
  model: "bytedance/seedance-2.0-fast/image-to-video",
  scenes: heroes.length,
  durationPerScene: 5,
  purpose: "produce-teaser-pacame.mjs · Seedance 2.0 Fast 5s × N clips",
});

console.log(`\nPHASE 2 · ${heroes.length} clips video Seedance 2.0 Fast (5s c/u)`);
const vidPromises = heroes.map(async (s) => {
  return withRetry(async () => {
    console.log(`  → create video ${s.id}`);
    const id = await generateVideo(s);
    const url = await pollPrediction(id, `vid-${s.id}`, 600);
    const file = path.join(OUT, `clip-${s.id}.mp4`);
    await downloadTo(url, file);
    console.log(`  ✓ ${s.id} → ${path.basename(file)}`);
    return { ...s, clipFile: file };
  }, `vid-${s.id}`);
});
const clipResults = await Promise.allSettled(vidPromises);
const clips = [];
for (let i = 0; i < clipResults.length; i++) {
  const r = clipResults[i];
  if (r.status === "fulfilled") clips.push(r.value);
  else console.log(`  ✗ ${heroes[i].id} VID FAILED: ${r.reason?.message?.slice(0, 200)}`);
}
if (clips.length < 4) throw new Error(`solo ${clips.length}/${heroes.length} clips generados — abortando`);
console.log(`PHASE 2 done · ${clips.length} clips · ~$${(clips.length * 5 * 0.101).toFixed(2)}`);

// ─── PHASE 3: voiceover ElevenLabs Brian ────────────────────────

const FULL_VO = "Las agencias necesitaban cien personas. Semanas de trabajo. Hasta que descubrimos que la inteligencia podía hacerlo todo. Diez agentes. Mil habilidades. Tu equipo digital sin límites. PACAME.";

console.log("\nPHASE 3 · voiceover ElevenLabs Brian (multilingual_v2)");
const VOICE_BRIAN = "nPczCjzI2devNBz1zQrb"; // Brian premade
const voRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_BRIAN}`, {
  method: "POST",
  headers: { "xi-api-key": ELEVEN, "Content-Type": "application/json", "Accept": "audio/mpeg" },
  body: JSON.stringify({
    text: FULL_VO,
    model_id: "eleven_multilingual_v2",
    voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.45, use_speaker_boost: true },
  }),
});
if (!voRes.ok) throw new Error(`elevenlabs fail: ${voRes.status} ${(await voRes.text()).slice(0, 200)}`);
const voBuf = await voRes.arrayBuffer();
const voFile = path.join(OUT, "voiceover.mp3");
fs.writeFileSync(voFile, Buffer.from(voBuf));
console.log(`  ✓ voiceover.mp3 (${(voBuf.byteLength/1024).toFixed(1)}KB)`);

// ─── PHASE 4: ffmpeg compose ────────────────────────────────────

console.log("\nPHASE 4 · ffmpeg compose final");

const concatList = path.join(OUT, "concat.txt");
fs.writeFileSync(concatList, clips.map(c => `file '${c.clipFile.replace(/\\/g, "/")}'`).join("\n"));

const concatVideo = path.join(OUT, "concat-video.mp4");
const finalVideo = path.join(OUT, "teaser-pacame-final.mp4");

const { execSync } = await import("node:child_process");

// 1) Concatenar clips
execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c:v copy -an "${concatVideo}"`, { stdio: "ignore" });
console.log("  ✓ concat 30s sin audio");

// 2) Mezclar con voiceover (audio voz a 0.95, dejar -0.05 headroom)
execSync(`ffmpeg -y -i "${concatVideo}" -i "${voFile}" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "${finalVideo}"`, { stdio: "ignore" });
console.log(`  ✓ FINAL → ${path.basename(finalVideo)}`);

// 3) Stats
const stat = fs.statSync(finalVideo);
console.log(`\nDONE · ${(stat.size/1024/1024).toFixed(2)}MB · ${finalVideo}`);
console.log(`Coste estimado: ~$3.51 (6×$0.08 + 30×$0.101)`);
