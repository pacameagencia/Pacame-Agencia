#!/usr/bin/env node
/**
 * Genera 6 backgrounds Dark Room con OpenAI gpt-image-2 (lanzado 2026-04-21).
 * 3 variaciones por background → 18 imágenes totales.
 * Cascade: gpt-image-2 → gpt-image-1.5 → gpt-image-1 → gpt-image-1-mini.
 * Parámetros: size 1024x1536 (ratio 2:3, cercano a 4:5 IG), quality high, output webp.
 * Coste estimado (gpt-image-2 high 1024x1536 ≈ ~$0.05/img × 18) ≈ $0.90.
 *
 * Uso: node generate-backgrounds.mjs
 * Sólo regenera lo que falta (idempotente — los archivos existentes >10KB se respetan).
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

const MODELS_CASCADE = [
  { id: "gpt-image-2", quality: "high" },
  { id: "gpt-image-1.5", quality: "high" },
  { id: "gpt-image-1", quality: "high" },
  { id: "gpt-image-1-mini", quality: "medium" },
];

const SIZE = "1024x1536";
const VARIATIONS = 3;
const FORMAT = "webp"; // -25% peso vs png, calidad idéntica

// Variation seeds: 3 micro-prompts de variación que añadimos al final de cada prompt
// para forzar interpretaciones distintas sin cambiar la esencia.
const VARIATION_SUFFIXES = [
  " Camera angle: slightly tilted, cinematic offset framing.",
  " Camera angle: dead-center symmetric, classical composition.",
  " Camera angle: extreme low perspective, dramatic foreshortening.",
];

const BACKGROUNDS = [
  {
    id: "BG-01-tickets",
    prompt: `Editorial magazine photograph, vertical 2:3 aspect.
Composition: top-down 45 degree view, asymmetric framing, strong negative space at top.
Lighting: single acid green neon practical light slashing across from the left side, deep chiaroscuro shadows, theatrical film noir lighting, color graded cold black-green.
Subject: dark wooden table in dim room, covered with many crumpled thermal paper receipts printed with blurry illegible numbers scattered across the surface.
Atmosphere: cinematic noir mood, quiet tension, heavy 35mm film grain, subtle vignette, very dark high contrast exposure. Shot on Leica.`,
  },
  {
    id: "BG-02-puerta",
    prompt: `Cinematic noir photograph, vertical 2:3 aspect.
Composition: centered symmetric framing, ultra-wide perspective, strong vertical negative space.
Lighting: intense acid green practical neon light spilling from inside a slightly ajar door, strong backlight silhouette, deep black shadows, theatrical noir lighting, color graded cold green-black.
Subject: narrow dark hallway with pitch black concrete walls, subtle texture, a single black metal door at the end slightly open revealing bright acid green glow inside.
Atmosphere: heavy volumetric fog drifting near the floor, mysterious threshold moment, 35mm film grain, moody editorial.`,
  },
  {
    id: "BG-03-billetes",
    prompt: `Editorial slow-motion photograph, vertical 2:3 aspect.
Composition: medium close-up, asymmetric framing, dramatic negative space at the top half.
Lighting: single hard acid green practical rim light from the right, deep chiaroscuro black shadows, one soft spotlight from above, cinematic color grading cool green-black.
Subject: several 50 euro banknotes suspended mid-air falling toward a matte pitch black surface, paper edges slightly curled with subtle warm orange highlights at the tips.
Atmosphere: stillness and tension, 35mm film grain, high contrast editorial magazine style.`,
  },
  {
    id: "BG-04-escritorio",
    prompt: `Dark editorial photograph, vertical 2:3 aspect.
Composition: top-down 60 degree angle, shallow depth of field, clean editorial framing.
Lighting: single acid green practical LED strip under the laptop spilling onto desk surface, green rim light on objects, theatrical dim ambient, color graded green-black.
Subject: matte black wooden desk surface, closed black laptop, ceramic black coffee mug with soft steam rising, one minimalist notebook, one matte black pen.
Atmosphere: subtle 35mm film grain, premium editorial mood, late-night creative studio vibe, expensive quiet feel.`,
  },
  {
    id: "BG-05-cinta",
    prompt: `Flat lay editorial photograph, vertical 2:3 aspect.
Composition: close-up overhead, diagonal dynamic framing, stark composition.
Lighting: practical soft overhead light with hard shadows, one subtle acid green neon reflection in corner, high contrast lighting, color graded black-yellow-green.
Subject: pitch black background surface with bright yellow and black construction caution tape ripped and placed diagonally across the frame, small acid green paint splash in one corner.
Atmosphere: textured paper feel, heavy analog photography grain, industrial raw mood, bold graphic tension.`,
  },
  {
    id: "BG-06-reloj",
    prompt: `Dark cinematic macro photograph, vertical 2:3 aspect.
Composition: centered subject with strong negative space, macro lens framing.
Lighting: subject self-illuminated by red LED display glow, single acid green practical rim light on metal casing from the side, pitch black ambient, noir chiaroscuro.
Subject: red LED digital clock display floating in pure black space, numbers glowing sharp crimson red, subtle polished metal casing edge visible.
Atmosphere: subtle volumetric smoke drifting around, urgent quiet tension, countdown feel, very dark exposure, 35mm film grain.`,
  },
];

async function tryModel({ model, quality }, prompt, outPath) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size: SIZE,
      n: 1,
      quality,
      output_format: FORMAT,
    }),
  });
  const j = await res.json();
  if (!res.ok) {
    const code = j?.error?.code || j?.error?.type || res.status;
    const msg = (j?.error?.message || JSON.stringify(j)).slice(0, 200);
    throw new Error(`[${model}] ${res.status} ${code}: ${msg}`);
  }
  const item = j.data[0];
  if (item.b64_json) {
    fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  } else if (item.url) {
    const img = await fetch(item.url);
    fs.writeFileSync(outPath, Buffer.from(await img.arrayBuffer()));
  } else {
    throw new Error("[${model}] No image data in response");
  }
}

async function generate(prompt, outPath) {
  const errors = [];
  for (const m of MODELS_CASCADE) {
    try {
      await tryModel(m, prompt, outPath);
      return m.id;
    } catch (err) {
      errors.push(err.message);
      // If billing-blocked or hard limit on first model, skip rest fast (same root cause)
      if (/billing_hard_limit/i.test(err.message)) {
        // try next anyway, all OpenAI models share the same billing
        continue;
      }
    }
  }
  throw new Error(errors.join(" | "));
}

async function main() {
  const total = BACKGROUNDS.length * VARIATIONS;
  console.log(
    `OpenAI image cascade [${MODELS_CASCADE.map((m) => m.id).join(" → ")}]\n` +
      `${BACKGROUNDS.length} backgrounds × ${VARIATIONS} variations = ${total} images\n` +
      `Size ${SIZE} · format ${FORMAT}\n`
  );
  let ok = 0,
    fail = 0;
  const usedModels = new Map();
  for (const bg of BACKGROUNDS) {
    for (let v = 1; v <= VARIATIONS; v++) {
      const outPath = path.join(OUT_DIR, `${bg.id}-v${v}.${FORMAT}`);
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10000) {
        console.log(`  ✓ ${bg.id}-v${v} (cached)`);
        ok++;
        continue;
      }
      const fullPrompt = bg.prompt + (VARIATION_SUFFIXES[v - 1] || "");
      process.stdout.write(`→ ${bg.id}-v${v} ... `);
      try {
        const used = await generate(fullPrompt, outPath);
        const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
        console.log(`ok via ${used} (${kb} KB)`);
        usedModels.set(used, (usedModels.get(used) || 0) + 1);
        ok++;
      } catch (err) {
        console.log(`FAIL`);
        console.log(`     ${err.message.slice(0, 400)}`);
        fail++;
      }
    }
  }
  console.log(`\nDone. ok=${ok} fail=${fail}`);
  if (usedModels.size) {
    console.log("Models used:");
    for (const [m, n] of usedModels) console.log(`  - ${m}: ${n} images`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
