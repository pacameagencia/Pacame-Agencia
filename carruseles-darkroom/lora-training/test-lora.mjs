#!/usr/bin/env node
// Test 3 imágenes con LoRA Pablo · 1 Dark Room noir + 1 PACAME violet + 1 behind scenes
// Lee lora-output.json (creado por train-lora.mjs) y genera 3 imgs en output/avatar-test/lora-final/

import fs from "node:fs";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ""));
const ENV_PATH = path.resolve(ROOT, "../../web/.env.local");

const env = Object.fromEntries(
  fs.readFileSync(ENV_PATH, "utf8")
    .split("\n")
    .filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);

const FAL_KEY = env.FAL_API_KEY;
const lora = JSON.parse(fs.readFileSync(path.resolve(ROOT, "lora-output.json"), "utf8"));
const LORA_URL = lora.diffusers_lora_file?.url;
const TRIGGER = lora.trigger_word;
if (!LORA_URL) { console.error("lora-output.json sin diffusers_lora_file"); process.exit(1); }

const OUT_DIR = path.resolve(ROOT, "../output/avatar-test/lora-final");
fs.mkdirSync(OUT_DIR, { recursive: true });

const PABLO_DESC = `${TRIGGER} man, late 20s, 1.78m slim athletic, voluminous dark brown hair styled upward back 5cm pomp quiff with tight undercut fade sides, short light stubble + thin candado goatee mustache, small black metal hoop nose ring on LEFT NOSTRIL only`;

const tests = [
  {
    name: "1-darkroom-noir",
    prompt: `cinematic portrait, ${PABLO_DESC}, wearing black hoodie, sitting in dark room with green acid CFFF00 LED light strip behind him, multiple monitors glowing in background, deep shadows, moody, photorealistic 35mm film grain, intense gaze, hands on keyboard, neon reflection on face, ultra detailed`
  },
  {
    name: "2-pacame-violet",
    prompt: `professional editorial portrait, ${PABLO_DESC}, wearing black turtleneck, standing in modern minimalist studio with violet 7C3AED gradient lighting, soft volumetric haze, looking confidently at camera, slight smirk, executive vibe, magazine cover quality, sharp eyes, cinematic lighting`
  },
  {
    name: "3-behind-scenes",
    prompt: `candid documentary photo, ${PABLO_DESC}, sitting at standing desk with macbook open, wearing dark grey sweatshirt, natural daylight from window left side, drinking coffee, slight laugh, real moment authentic, 50mm prime lens shallow depth, journalistic feel`
  }
];

for (const t of tests) {
  console.log(`generando ${t.name}...`);
  const res = await fetch("https://queue.fal.run/fal-ai/flux-lora", {
    method: "POST",
    headers: { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: t.prompt,
      loras: [{ path: LORA_URL, scale: 1.0 }],
      image_size: "portrait_4_3",
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: false
    })
  });
  if (!res.ok) { console.error(`fail ${t.name}:`, await res.text()); continue; }
  const job = await res.json();

  let result = null;
  while (true) {
    await new Promise(r => setTimeout(r, 5000));
    const sRes = await fetch(job.status_url, { headers: { "Authorization": `Key ${FAL_KEY}` } });
    const s = await sRes.json();
    if (s.status === "COMPLETED") {
      const rRes = await fetch(job.response_url, { headers: { "Authorization": `Key ${FAL_KEY}` } });
      result = await rRes.json();
      break;
    }
    if (s.status === "FAILED") { console.error("failed"); break; }
  }

  if (result?.images?.[0]?.url) {
    const img = await (await fetch(result.images[0].url)).arrayBuffer();
    const out = path.join(OUT_DIR, `${t.name}.jpg`);
    fs.writeFileSync(out, Buffer.from(img));
    console.log(`  ok: ${out}`);
  }
}

console.log(`\n3 tests guardados en ${OUT_DIR}`);
