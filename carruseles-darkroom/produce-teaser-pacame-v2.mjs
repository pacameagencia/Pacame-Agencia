#!/usr/bin/env node
/**
 * Producción teaser PACAME v2 · "El despertar de la inteligencia".
 *
 * Pipeline TOP (vs v1 amateur):
 *   1. Hero images: Wan-2.7 Pro text-to-image ($0.064/img × 5 = $0.32)
 *   2. Video clips: Veo 3.1 image-to-video ($0.2/seg × 6s × 5 = $6.00)
 *   3. Voiceover: ElevenLabs Juan Carlos castellano deep ($0)
 *   4. Música: ElevenLabs Music orquestal ($0.40)
 *   5. Edit: ffmpeg PRO con xfade + lut3d color grade + audio ducking + film grain
 *
 * 5 escenas × 6s = 30s exactos (Veo solo soporta 4/6/8s)
 *
 * Costo objetivo: ~$6.72 USD
 * Output: output/teaser-pacame-v2/teaser-pacame-v2-final.mp4 (1080x1920, 30s)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertVideoApproved } from "./lib/cost-guard.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "output", "teaser-pacame-v2");
fs.mkdirSync(OUT, { recursive: true });

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, "web", ".env.local"), "utf8")
    .split("\n").filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g, "")]; })
);
const ATLAS = env.ATLAS_API_KEY;
const ELEVEN = env.ELEVENLABS_API_KEY;

const VOICE_JUAN_CARLOS = "RyfjEHnKbtma4Srae2za";  // castellano deep warm

// ─── 5 escenas × 6s = 30s ──────────────────────────────────────

const SCENES = [
  {
    id: "S1-liquid-violet",
    imgPrompt: "Cinematic vertical 9:16, extreme close-up macro shot of dark violet purple ink droplet falling into pure black ink water, organic swirling tendrils, suspended particles glowing, deep blacks, ultra-detailed liquid dynamics, premium product reveal aesthetic, Phantom high-speed camera, 35mm anamorphic.",
    videoPrompt: "Slow continuous dolly-in extreme close-up on the violet ink swirling in black water, organic flow expanding outward, particles drifting suspended in slow motion, photorealistic.",
  },
  {
    id: "S2-chip-cracking",
    imgPrompt: "Cinematic vertical 9:16, extreme close-up macro of a black silicon microchip cracking open, brilliant cyan light bursting from the fractures, glowing circuit traces emerging, dramatic chiaroscuro, deep blacks, ultra-sharp detail, Apple keynote aesthetic, 35mm.",
    videoPrompt: "Slow camera push-in on the cracking chip, light intensifying through fractures expanding outward, energy waves emanating from the fissures, photorealistic cinematic.",
  },
  {
    id: "S3-neural-network",
    imgPrompt: "Cinematic vertical 9:16, abstract wireframe neural network of glowing nodes, cyan and violet light connections cascading like firing neurons, deep void background, particle dust drifting, premium tech brand aesthetic, ultra-detailed, 35mm.",
    videoPrompt: "Slow upward crane reveal showing the neural network expanding, more nodes lighting up in cascade pattern, connections multiplying organically, photorealistic.",
  },
  {
    id: "S4-geometric-orbit",
    imgPrompt: "Cinematic vertical 9:16, ten geometric wireframe holograms floating in deep black void, an icosahedron, torus, dodecahedron, sphere, octahedron, cube, pyramid, helix, lattice, star, connected by violet purple light beams, particle dust, lens flare, premium sci-fi aesthetic.",
    videoPrompt: "Slow rotation of the geometric formation in orbit, beams of light connecting the shapes pulsing in rhythm, particles drifting around, photorealistic cinematic.",
  },
  {
    id: "S5-light-convergence",
    imgPrompt: "Cinematic vertical 9:16, abstract glowing violet and cyan light beams converging at a single bright point center, motion blur whip-pan effect, chromatic aberration on edges, deep black void, Hollywood climax shot, anamorphic, dramatic, ready for logo overlay.",
    videoPrompt: "Light beams converging at center accelerating, motion blur intensifying, energy buildup peaking, then settling into a soft glow, photorealistic cinematic.",
  },
];

// Voiceover sobre los 30s · 5 frases que coinciden con los cuts
const VOICEOVER_TEXT = "Hubo un tiempo... en que las ideas tardaban semanas. Hasta que algo cambió. Diez agentes. Mil habilidades. PACAME.";

const MUSIC_PROMPT = "Cinematic orchestral build, slow piano intro evolving into dramatic strings and percussion climax, Hans Zimmer Inception 'Time' style, premium tech brand teaser score, mysterious and powerful, fade ending with reverb tail";

// ─── Helpers ────────────────────────────────────────────────────

async function atlasImage(prompt) {
  const r = await fetch("https://api.atlascloud.ai/api/v1/model/generateImage", {
    method: "POST",
    headers: { "Authorization": `Bearer ${ATLAS}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "alibaba/wan-2.7-pro/text-to-image", prompt }),
  });
  const j = await r.json();
  if (!j.data?.id) throw new Error(`img: ${JSON.stringify(j).slice(0, 200)}`);
  return j.data.id;
}

async function atlasImageFallback(prompt) {
  const r = await fetch("https://api.atlascloud.ai/api/v1/model/generateImage", {
    method: "POST",
    headers: { "Authorization": `Bearer ${ATLAS}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/nano-banana-2/text-to-image", prompt }),
  });
  const j = await r.json();
  if (!j.data?.id) throw new Error(`img-fb: ${JSON.stringify(j).slice(0, 200)}`);
  return j.data.id;
}

async function atlasVideo(prompt, imageUrl) {
  const r = await fetch("https://api.atlascloud.ai/api/v1/model/generateVideo", {
    method: "POST",
    headers: { "Authorization": `Bearer ${ATLAS}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/veo3.1/image-to-video",
      prompt,
      image: imageUrl,
      duration: 6,
      aspect_ratio: "9:16",
    }),
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
  return buf.byteLength;
}

// ─── PHASE 1: Hero images Wan-2.7 Pro (con fallback nano-banana) ─

console.log(`PHASE 1 · ${SCENES.length} hero shots Wan-2.7 Pro`);
const heroes = [];
const heroPromises = SCENES.map(async (s) => {
  return withRetry(async () => {
    let url;
    try {
      const id = await atlasImage(s.imgPrompt);
      url = await poll(id, `wan-${s.id}`, 240);
    } catch (e) {
      console.log(`  fallback nano-banana ${s.id}: ${e.message.slice(0, 80)}`);
      const id2 = await atlasImageFallback(s.imgPrompt);
      url = await poll(id2, `nb-${s.id}`, 240);
    }
    const file = path.join(OUT, `hero-${s.id}.png`);
    const size = await downloadTo(url, file);
    console.log(`  ✓ ${s.id} → ${path.basename(file)} (${(size/1024).toFixed(0)}KB)`);
    return { ...s, heroFile: file, heroUrl: url };
  }, s.id);
});
const heroResults = await Promise.allSettled(heroPromises);
for (let i = 0; i < heroResults.length; i++) {
  const r = heroResults[i];
  if (r.status === "fulfilled") heroes.push(r.value);
  else console.log(`  ✗ ${SCENES[i].id} FAILED: ${r.reason?.message?.slice(0, 200)}`);
}
if (heroes.length < 4) throw new Error(`solo ${heroes.length}/${SCENES.length} heroes — abortando`);
console.log(`PHASE 1 done · ${heroes.length} heroes`);

// ─── PHASE 2: Veo 3.1 Image-to-Video ───────────────────────────

// COST GUARD · Veo 3.1 es modelo premium top ($0.20/seg). Sin token, abortamos.
await assertVideoApproved({
  model: "google/veo3.1/image-to-video",
  scenes: heroes.length,
  durationPerScene: 6,
  purpose: "produce-teaser-pacame-v2.mjs · Veo 3.1 6s × N clips",
});

console.log(`\nPHASE 2 · ${heroes.length} clips Veo 3.1 image-to-video (6s c/u)`);
const clips = [];
const clipPromises = heroes.map(async (s) => {
  return withRetry(async () => {
    const id = await atlasVideo(s.videoPrompt, s.heroUrl);
    const url = await poll(id, `veo-${s.id}`, 600);
    const file = path.join(OUT, `clip-${s.id}.mp4`);
    const size = await downloadTo(url, file);
    console.log(`  ✓ ${s.id} → ${path.basename(file)} (${(size/1024/1024).toFixed(2)}MB)`);
    return { ...s, clipFile: file };
  }, `vid-${s.id}`);
});
const clipResults = await Promise.allSettled(clipPromises);
for (let i = 0; i < clipResults.length; i++) {
  const r = clipResults[i];
  if (r.status === "fulfilled") clips.push(r.value);
  else console.log(`  ✗ ${heroes[i].id} VID FAILED: ${r.reason?.message?.slice(0, 200)}`);
}
if (clips.length < 4) throw new Error(`solo ${clips.length}/${heroes.length} clips — abortando`);
console.log(`PHASE 2 done · ${clips.length} clips`);

// ─── PHASE 3: Voiceover Juan Carlos ────────────────────────────

console.log("\nPHASE 3 · voiceover Juan Carlos (castellano deep)");
const voRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_JUAN_CARLOS}`, {
  method: "POST",
  headers: { "xi-api-key": ELEVEN, "Content-Type": "application/json", "Accept": "audio/mpeg" },
  body: JSON.stringify({
    text: VOICEOVER_TEXT,
    model_id: "eleven_multilingual_v2",
    voice_settings: { stability: 0.45, similarity_boost: 0.85, style: 0.65, use_speaker_boost: true },
  }),
});
if (!voRes.ok) throw new Error(`voiceover: ${voRes.status} ${(await voRes.text()).slice(0, 200)}`);
const voBuf = await voRes.arrayBuffer();
const voFile = path.join(OUT, "voiceover.mp3");
fs.writeFileSync(voFile, Buffer.from(voBuf));
console.log(`  ✓ voiceover.mp3 (${(voBuf.byteLength/1024).toFixed(1)}KB)`);

// ─── PHASE 4: Música ElevenLabs Music ──────────────────────────

console.log("\nPHASE 4 · música orquestal ElevenLabs Music (30s)");
const musicRes = await fetch("https://api.elevenlabs.io/v1/music/compose", {
  method: "POST",
  headers: { "xi-api-key": ELEVEN, "Content-Type": "application/json", "Accept": "audio/mpeg" },
  body: JSON.stringify({
    prompt: MUSIC_PROMPT,
    music_length_ms: 30000,
  }),
});
if (!musicRes.ok) {
  console.log(`  music fail: ${musicRes.status} ${(await musicRes.text()).slice(0, 200)}`);
  console.log("  continuando sin música, solo voiceover");
} else {
  const musicBuf = await musicRes.arrayBuffer();
  const musicFile = path.join(OUT, "music.mp3");
  fs.writeFileSync(musicFile, Buffer.from(musicBuf));
  console.log(`  ✓ music.mp3 (${(musicBuf.byteLength/1024).toFixed(1)}KB · ${(musicBuf.byteLength/1024/1024*8/0.128).toFixed(1)}s @128kbps)`);
}

// ─── Output summary ────────────────────────────────────────────

console.log(`\n✅ Producción assets completa.`);
console.log(`   Heroes: ${heroes.length} en ${OUT}/hero-*.png`);
console.log(`   Clips: ${clips.length} en ${OUT}/clip-*.mp4`);
console.log(`   Voiceover: ${OUT}/voiceover.mp3`);
console.log(`   Música: ${OUT}/music.mp3 (si OK)`);
console.log(`\nSiguiente paso: node teaser-v2-compose.mjs (compose final ffmpeg PRO)`);
