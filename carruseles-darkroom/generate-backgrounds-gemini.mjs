#!/usr/bin/env node
/**
 * Genera 6 backgrounds Dark Room con Gemini 2.5 Flash Image (nano-banana).
 * 3 variaciones por prompt → 18 imágenes totales.
 * Uso: node generate-backgrounds-gemini.mjs
 *
 * Gratis durante preview. Modelo: gemini-2.5-flash-image (preview).
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

const API_KEY = env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY missing in web/.env.local");
  process.exit(1);
}

const VARIATIONS = 3;

const BACKGROUNDS = [
  {
    id: "BG-01-tickets",
    prompt: `Editorial magazine photograph, vertical aspect ratio 2:3.
Composition: top-down 45 degree angle view, asymmetric framing, strong negative space.
Lighting: single acid green neon practical light slashing across from the left side, deep chiaroscuro shadows, theatrical film noir lighting, color graded cold black-green.
Subject: dark wooden table in dim room, covered with many crumpled thermal paper receipts printed with blurry illegible numbers scattered across the surface.
Atmosphere: cinematic noir mood, quiet tension, heavy 35mm film grain, subtle vignette, very dark high contrast exposure. Shot on Leica, editorial.`,
  },
  {
    id: "BG-02-puerta",
    prompt: `Cinematic noir photograph, vertical aspect ratio 2:3.
Composition: centered symmetric framing with slight off-kilter tilt, ultra-wide perspective.
Lighting: intense acid green practical neon light spilling from inside a slightly ajar door, strong backlight silhouette, deep black shadows, theatrical film noir lighting, color graded cold green-black.
Subject: narrow dark hallway with pitch black concrete walls, subtle texture, a single black door at the end slightly open revealing bright green glow inside.
Atmosphere: heavy volumetric fog drifting near the floor, mysterious threshold moment, 35mm film grain, moody editorial.`,
  },
  {
    id: "BG-03-billetes",
    prompt: `Editorial slow-motion photograph, vertical aspect ratio 2:3.
Composition: medium close-up, asymmetric framing, dramatic negative space.
Lighting: single hard acid green practical rim light from the right, deep chiaroscuro black shadows, one soft spotlight from above, cinematic color grading cool green-black.
Subject: several 50 euro banknotes suspended mid-air falling toward a matte pitch black surface, paper edges slightly curled with subtle warm orange highlights at the tips.
Atmosphere: stillness and tension, 35mm film grain, high contrast editorial magazine style.`,
  },
  {
    id: "BG-04-escritorio",
    prompt: `Dark editorial photograph, vertical aspect ratio 2:3.
Composition: top-down 60 degree angle, shallow depth of field, clean editorial framing.
Lighting: single acid green practical LED strip under the laptop spilling onto desk surface, green rim light on objects, theatrical dim ambient, color graded green-black.
Subject: matte black wooden desk surface, closed black laptop, ceramic black coffee mug with soft steam rising, one minimalist notebook, one matte black pen.
Atmosphere: subtle 35mm film grain, premium editorial mood, late-night creative studio vibe, expensive quiet feel.`,
  },
  {
    id: "BG-05-cinta",
    prompt: `Flat lay editorial photograph, vertical aspect ratio 2:3.
Composition: close-up overhead, diagonal dynamic framing, stark composition.
Lighting: practical soft overhead light with hard shadows, one subtle acid green neon reflection in corner, high contrast lighting, color graded black-yellow-green.
Subject: pitch black background surface with bright yellow and black construction caution tape ripped and placed diagonally across the frame, small acid green paint splash in one corner.
Atmosphere: textured paper feel, heavy analog photography grain, industrial raw mood, bold graphic tension.`,
  },
  {
    id: "BG-06-reloj",
    prompt: `Dark cinematic macro photograph, vertical aspect ratio 2:3.
Composition: centered subject with strong negative space, macro lens framing.
Lighting: subject self-illuminated by red LED display glow, single acid green practical rim light on metal casing from the side, pitch black ambient, noir chiaroscuro.
Subject: red LED digital clock display floating in pure black space, numbers glowing sharp crimson red, subtle polished metal casing edge visible.
Atmosphere: subtle volumetric smoke drifting around, urgent quiet tension, countdown feel, very dark exposure, 35mm film grain, editorial magazine style.`,
  },
];

const MODEL = "gemini-2.5-flash-image";

async function generateOne(prompt, outPath, retries = 2) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };
  for (let a = 0; a <= retries; a++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (!res.ok) {
      if (a < retries) {
        await new Promise((r) => setTimeout(r, 2500));
        continue;
      }
      throw new Error(`Gemini ${res.status}: ${JSON.stringify(j.error || j).slice(0, 300)}`);
    }
    const parts = j?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
    if (!imgPart) {
      if (a < retries) {
        await new Promise((r) => setTimeout(r, 2500));
        continue;
      }
      throw new Error(`No image in response: ${JSON.stringify(j).slice(0, 200)}`);
    }
    const b64 = imgPart.inlineData?.data || imgPart.inline_data?.data;
    fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
    return;
  }
}

async function main() {
  console.log(`Gemini 2.5 Flash Image — ${BACKGROUNDS.length} backgrounds × ${VARIATIONS} variations = ${BACKGROUNDS.length * VARIATIONS} images\n`);
  let ok = 0,
    fail = 0;
  for (const bg of BACKGROUNDS) {
    for (let v = 1; v <= VARIATIONS; v++) {
      const outPath = path.join(OUT_DIR, `${bg.id}-v${v}.png`);
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10000) {
        console.log(`  ✓ ${bg.id}-v${v} (cached)`);
        ok++;
        continue;
      }
      process.stdout.write(`→ ${bg.id}-v${v} ... `);
      try {
        await generateOne(bg.prompt, outPath);
        const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
        console.log(`ok (${kb} KB)`);
        ok++;
      } catch (err) {
        console.log(`FAIL: ${err.message.slice(0, 200)}`);
        fail++;
      }
    }
  }
  console.log(`\nDone. ok=${ok} fail=${fail}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
