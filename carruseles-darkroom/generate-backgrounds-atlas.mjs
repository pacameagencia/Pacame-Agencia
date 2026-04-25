#!/usr/bin/env node
/**
 * Genera 18 backgrounds Dark Room con Atlas Cloud (atlascloud.ai).
 * Endpoint: POST https://api.atlascloud.ai/api/v1/model/generateImage (async + polling).
 *
 * Cascade de modelos (mejor calidad/precio primero):
 *  - google/nano-banana-2/text-to-image  · $0.08/img · 18 imgs = $1.44
 *  - bytedance/seedream-v5.0-lite        · $0.032/img · 18 imgs = $0.58
 *  - qwen/qwen-image-2.0/text-to-image   · $0.028/img · 18 imgs = $0.50
 *
 * 6 backgrounds × 3 variaciones = 18 imágenes.
 * Uso:
 *   1. Regístrate en https://console.atlascloud.ai y obtén API key
 *   2. Añade ATLAS_API_KEY=... a web/.env.local
 *   3. node generate-backgrounds-atlas.mjs
 *      (opcional: --model="bytedance/seedream-v5.0-lite" para forzar uno)
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

const API_KEY = env.ATLAS_API_KEY || env.ATLASCLOUD_API_KEY;
if (!API_KEY) {
  console.error("Falta ATLAS_API_KEY en web/.env.local");
  console.error("Regístrate en https://console.atlascloud.ai → API Keys → copia la key");
  process.exit(1);
}

const BASE = "https://api.atlascloud.ai/api/v1";

const FORCED_MODEL = process.argv.find((a) => a.startsWith("--model="))?.split("=")[1];

const MODELS_CASCADE = FORCED_MODEL
  ? [{ id: FORCED_MODEL }]
  : [
      // 1. FREE — Baidu ERNIE Image Turbo. Si la calidad convence, coste $0.
      { id: "baidu/ERNIE-Image-Turbo/text-to-image" },
      // 2. $0.08/img — Google Nano Banana 2. Top calidad editorial.
      { id: "google/nano-banana-2/text-to-image" },
      // 3. $0.032/img — ByteDance Seedream v5 Lite. Excelente para typography/poster.
      { id: "bytedance/seedream-v5.0-lite" },
      // 4. $0.028/img — Qwen Image 2.0.
      { id: "qwen/qwen-image-2.0/text-to-image" },
      // 5. $0.026/img — Alibaba Wan-2.7. El más barato.
      { id: "alibaba/wan-2.7/text-to-image" },
    ];

const VARIATIONS = 3;

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

const HEADERS = () => ({
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
});

/**
 * Crea predicción. Atlas usa async pattern con prediction_id.
 * Probamos varios shapes posibles del body — el schema exacto se descubre
 * con el primer request real. El último fallback (input wrap estilo Replicate)
 * es el más usual cuando el primero da 400.
 */
async function createPrediction(model, prompt) {
  const candidateBodies = [
    // Shape A: flat (más común en endpoints inspirados en OpenAI)
    { model, prompt, aspect_ratio: "2:3", width: 1024, height: 1536 },
    // Shape B: input wrap estilo Replicate
    { model, input: { prompt, aspect_ratio: "2:3", width: 1024, height: 1536 } },
    // Shape C: solo prompt con size
    { model, prompt, size: "1024x1536" },
    // Shape D: minimal
    { model, prompt },
  ];
  let lastErr;
  for (const body of candidateBodies) {
    const res = await fetch(`${BASE}/model/generateImage`, {
      method: "POST",
      headers: HEADERS(),
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) return { task: j, body };
    lastErr = `[${res.status}] ${(j?.msg || j?.error || JSON.stringify(j)).slice(0, 200)}`;
    // Si es 401/403, parar (auth issue, no schema issue)
    if (res.status === 401 || res.status === 403) throw new Error(lastErr);
  }
  throw new Error(`No body shape worked: ${lastErr}`);
}

function extractPredictionId(task) {
  // Probar varios names comunes
  return (
    task?.prediction_id ||
    task?.id ||
    task?.data?.prediction_id ||
    task?.data?.id ||
    task?.task_id ||
    task?.data?.task_id
  );
}

async function pollPrediction(predId, maxAttempts = 60, intervalMs = 5000) {
  // Probar varios endpoints de polling
  const candidates = [
    `${BASE}/predictions/${predId}`,
    `${BASE}/model/generateImage/${predId}`,
    `${BASE}/model/getImage?id=${predId}`,
    `${BASE}/predictions?id=${predId}`,
  ];
  let workingUrl = null;
  for (const url of candidates) {
    const res = await fetch(url, { headers: HEADERS() });
    if (res.status !== 404) {
      workingUrl = url;
      const j = await res.json().catch(() => ({}));
      if (j?.status === "completed" || j?.status === "succeeded") return j;
      break;
    }
  }
  if (!workingUrl) throw new Error("No polling endpoint found");

  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(workingUrl, { headers: HEADERS() });
    const j = await res.json().catch(() => ({}));
    const status = j?.status || j?.data?.status;
    if (status === "completed" || status === "succeeded" || status === "COMPLETED") return j;
    if (status === "failed" || status === "error" || status === "FAILED") {
      throw new Error(`Prediction failed: ${JSON.stringify(j).slice(0, 200)}`);
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Polling timeout");
}

function extractImageUrl(result) {
  return (
    result?.output ||
    result?.data?.output ||
    result?.image_url ||
    result?.data?.image_url ||
    result?.urls?.[0] ||
    result?.output?.[0] ||
    result?.data?.urls?.[0] ||
    result?.images?.[0]
  );
}

async function downloadImage(url, outPath) {
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

async function generateOne(modelId, prompt, outPath) {
  const { task, body } = await createPrediction(modelId, prompt);
  const predId = extractPredictionId(task);
  if (!predId) throw new Error(`No prediction_id in: ${JSON.stringify(task).slice(0, 200)}`);
  const result = await pollPrediction(predId);
  const url = extractImageUrl(result);
  if (!url) throw new Error(`No image URL in: ${JSON.stringify(result).slice(0, 200)}`);
  if (typeof url === "string" && url.startsWith("http")) {
    await downloadImage(url, outPath);
  } else if (typeof url === "string" && url.startsWith("data:")) {
    const b64 = url.split(",")[1];
    fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
  } else if (typeof url === "string") {
    // assume base64 raw
    fs.writeFileSync(outPath, Buffer.from(url, "base64"));
  } else {
    throw new Error(`Unknown image format: ${JSON.stringify(url).slice(0, 100)}`);
  }
}

async function generate(prompt, outPath) {
  const errors = [];
  for (const m of MODELS_CASCADE) {
    try {
      await generateOne(m.id, prompt, outPath);
      return m.id;
    } catch (err) {
      errors.push(`${m.id}: ${err.message}`);
    }
  }
  throw new Error(errors.join(" | "));
}

async function main() {
  const total = BACKGROUNDS.length * VARIATIONS;
  console.log(
    `Atlas Cloud · ${BACKGROUNDS.length} backgrounds × ${VARIATIONS} variations = ${total} imgs\n` +
      `Cascade: ${MODELS_CASCADE.map((m) => m.id).join(" → ")}\n`
  );
  let ok = 0,
    fail = 0;
  const usedModels = new Map();
  for (const bg of BACKGROUNDS) {
    for (let v = 1; v <= VARIATIONS; v++) {
      const outPath = path.join(OUT_DIR, `${bg.id}-v${v}.png`);
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10000) {
        console.log(`  ✓ ${bg.id}-v${v} (cached)`);
        ok++;
        continue;
      }
      const fullPrompt = bg.prompt + (VARIATION_SUFFIXES[v - 1] || "");
      process.stdout.write(`→ ${bg.id}-v${v} `);
      try {
        const used = await generate(fullPrompt, outPath);
        const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
        console.log(`ok via ${used} (${kb} KB)`);
        usedModels.set(used, (usedModels.get(used) || 0) + 1);
        ok++;
      } catch (err) {
        console.log(`FAIL`);
        console.log(`     ${err.message.slice(0, 500)}`);
        fail++;
      }
    }
  }
  console.log(`\nDone. ok=${ok} fail=${fail}`);
  if (usedModels.size) {
    console.log("Models used:");
    for (const [m, n] of usedModels) console.log(`  - ${m}: ${n} imgs`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
