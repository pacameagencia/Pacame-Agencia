#!/usr/bin/env node
/**
 * Genera 6 backgrounds Dark Room con OpenAI gpt-image-1.
 * Parámetros optimizados según research (abril 2026):
 *   size=1024x1536, quality=medium, output_format=webp, n=1
 *   → ~$0.016/imagen × 6 = $0.10 total
 *
 * Prompts estructurados: COMPOSICIÓN → ILUMINACIÓN → ESTÉTICA → MATERIALES → ATMÓSFERA
 * Evitan triggers de moderación (no "burning money", no "hazard tape", no "dangerous").
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(__dirname, "backgrounds");
fs.mkdirSync(OUT_DIR, { recursive: true });

const envPath = path.join(ROOT, "web", ".env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const API_KEY = env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("OPENAI_API_KEY missing");
  process.exit(1);
}

const BACKGROUNDS = [
  {
    id: "BG-01-tickets",
    prompt: `Top-down 45 degree angle shot, asymmetric composition, cinematic frame 2:3.
Single acid green neon practical light cutting across from left, deep black chiaroscuro shadows, editorial film noir lighting.
Color grading cyan-green-black, heavy 35mm grain, subtle vignette, moody magazine quality.
Dark wooden table in dim room, crumpled thermal paper receipts scattered across surface with blurry illegible numbers printed, matte textures.
Volumetric atmosphere, quiet tension, empty room feel.`,
  },
  {
    id: "BG-02-puerta",
    prompt: `Symmetric center composition with slight off-kilter tilt, ultra-wide cinematic shot 2:3.
Single black door at end of hallway slightly ajar, spilling intense acid green practical neon light from interior, strong backlight silhouette effect, deep black shadows, theatrical film noir lighting.
Color grading cold green-black, 35mm grain, editorial.
Narrow dark hallway, pitch black concrete walls with subtle texture, matte finish.
Heavy volumetric fog near the floor, mysterious atmosphere, quiet threshold moment.`,
  },
  {
    id: "BG-03-billetes",
    prompt: `Medium close-up slow-motion editorial shot, asymmetric composition 2:3.
Hard acid green practical rim light from right side, deep chiaroscuro black shadows, single soft spotlight from above, cinematic grading.
Heavy 35mm film grain, high contrast editorial magazine style, color graded cool green-black.
Several 50 euro banknotes suspended mid-air falling toward matte pitch black surface, paper edges slightly curled and softly glowing with subtle warm orange highlights at the tips.
Stillness and tension, moody cinematic atmosphere.`,
  },
  {
    id: "BG-04-escritorio",
    prompt: `Top-down 60 degree angle, shallow depth of field, editorial framing 2:3.
Single acid green practical LED strip light under the laptop spilling onto desk surface, rim light on objects, theatrical lighting, deep dark ambient, color graded green-black.
Subtle 35mm grain, premium editorial mood, expensive quiet vibe.
Matte black desk surface, closed black laptop, ceramic black coffee mug with soft steam rising, single notebook, one matte black pen, all minimal.
Volumetric air, late night creative studio atmosphere.`,
  },
  {
    id: "BG-05-cinta",
    prompt: `Flat lay close-up composition, diagonal framing, editorial 2:3.
Practical overhead soft light with hard shadows, single acid green neon reflection in corner, high contrast lighting, color graded black-yellow-green.
Heavy analog photography grain, textured paper feel, stark editorial composition.
Pitch black background surface, bright yellow and black construction caution tape ripped and placed diagonally across frame, matte surfaces, one small acid green paint splash in corner.
Industrial raw atmosphere, bold graphic tension.`,
  },
  {
    id: "BG-06-reloj",
    prompt: `Macro close-up shot, centered subject with negative space, cinematic 2:3.
Subject self-illuminated by red LED display glow, single acid green practical rim light on casing from side, pitch black ambient, noir chiaroscuro lighting.
Very dark exposure, 35mm film grain, editorial magazine style, color grade black-red-green.
Red LED digital clock display floating in pure black space, numbers glowing sharp crimson red, subtle polished metal casing edge.
Subtle volumetric smoke drifting, urgent quiet atmosphere, countdown tension.`,
  },
];

async function generateImage(prompt, outPath) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
      n: 1,
      quality: "medium",
      output_format: "webp",
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${JSON.stringify(j.error || j).slice(0, 300)}`);
  const item = j.data[0];
  if (item.b64_json) {
    fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  } else if (item.url) {
    const img = await fetch(item.url);
    fs.writeFileSync(outPath, Buffer.from(await img.arrayBuffer()));
  } else {
    throw new Error("No image data");
  }
}

async function main() {
  console.log(`Generating ${BACKGROUNDS.length} backgrounds via OpenAI gpt-image-1 (medium/webp/1024x1536)...\n`);
  let totalCost = 0;
  for (const bg of BACKGROUNDS) {
    const outPath = path.join(OUT_DIR, `${bg.id}.webp`);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10000) {
      console.log(`  ✓ ${bg.id} already exists`);
      continue;
    }
    process.stdout.write(`→ ${bg.id} ... `);
    try {
      await generateImage(bg.prompt, outPath);
      totalCost += 0.016;
      console.log(`ok (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.log(`FAIL`);
      console.log(`     ${err.message.slice(0, 500)}`);
    }
  }
  console.log(`\nDone. Estimated cost: $${totalCost.toFixed(3)}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
