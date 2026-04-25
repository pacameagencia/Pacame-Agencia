#!/usr/bin/env node
/**
 * Carrusel Dark Room · 5 imágenes 100% gpt-image-2-developer · ahorro económico
 *
 * Modelo: openai/gpt-image-2-developer/text-to-image (vía Atlas Cloud)
 * Quality: high · Size: 1024x1536 (2:3 vertical)
 * Output original: carruseles-darkroom/output/carrusel-gpt-image-2/raw/slide-{N}.png
 * Output publicación: carruseles-darkroom/output/carrusel-gpt-image-2/slide-{N}.png (1080x1350 · 4:5)
 *
 * Coste estimado: 5 × $0.032 = $0.16 (alta) o sub si Atlas tiene tier diferente.
 *
 * Uso:
 *   node generate-carrusel-gpt2.mjs               # genera los 5
 *   node generate-carrusel-gpt2.mjs 1 3           # genera solo slide 1 y 3 (reroll)
 *   node generate-carrusel-gpt2.mjs --dry-run     # imprime prompts y sale (Gate 1)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(__dirname, "output", "carrusel-gpt-image-2");
const RAW_DIR = path.join(OUT_DIR, "raw");
fs.mkdirSync(RAW_DIR, { recursive: true });

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(ROOT, "web", ".env.local"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const KEY = env.ATLAS_API_KEY;
if (!KEY) {
  console.error("ATLAS_API_KEY missing in web/.env.local");
  process.exit(1);
}

const BASE = "https://api.atlascloud.ai/api/v1";
const MODEL = "openai/gpt-image-2-developer/text-to-image";
const SIZE = "1024x1536";
const QUALITY = "high";

// ─────────────────────────────────────────────
// 5 PROMPTS · Carrusel Dark Room · ahorro económico
// Cada uno: composición → iluminación → estética → sujeto → TEXTO EXACTO ESP →
//           atmósfera → typography directives → anti-overlap guards
// ─────────────────────────────────────────────

const SLIDES = [
  {
    n: 1,
    role: "HOOK",
    label: "¿CUÁNTO PAGAS AL AÑO EN IA?",
    prompt: `Editorial magazine cover photograph, vertical 2:3 aspect ratio.
Composition: top-down 45-degree angle view of a dark wooden table in a dim noir-style room. Strong negative space at the top half reserved for typography. Asymmetric framing.
Lighting: a single acid green neon practical light slashing horizontally across the scene from the left side, casting deep chiaroscuro shadows. Color graded cold black-green with subtle warmth only on the brightest highlights. Cinematic film noir.
Subject: a worn dark wooden table covered with many crumpled thermal paper receipts printed with blurry illegible numbers, scattered organically. Receipts have slight curl and worn edges. Realistic paper texture.
Atmosphere: heavy 35mm film grain, subtle vignette, cinematic noir editorial mood, quiet tension.

TYPOGRAPHY (CRITICAL — render exactly):
At the top third of the image, render the Spanish text exactly: "¿CUÁNTO PAGAS AL AÑO EN IA?" in three lines maximum, using a bold condensed sans-serif typeface (Anton style, ALL CAPS), color clean off-white #F2F2F2. The Spanish inverted question mark "¿" must appear at the start and "?" at the end. The accent mark on Á in CUÁNTO must be visible and crisp. Generous letter-spacing, perfectly aligned center-left.
Below it, a smaller subtitle in clean sans-serif, render exactly: "Suma. No estimes. Suma." in acid green #CFFF00 color, single line.
At the bottom right corner, in tiny clean caps, render: "DARK ROOM" in acid green #CFFF00 with letter-spacing.

Quality directives: editorial magazine cover quality, professional clean typography, no character overlap, no spelling errors, no typos, perfect kerning, generous padding around all text, balanced composition. The text must NOT touch image edges. Three vertically stacked text blocks with proper spacing.`,
  },
  {
    n: 2,
    role: "DOLOR",
    label: "308 € AL MES",
    prompt: `Editorial slow-motion photograph, vertical 2:3 aspect ratio.
Composition: medium close-up shot, asymmetric framing with strong dramatic negative space on the upper portion reserved for typography. Subject sits in the lower-right two-thirds.
Lighting: hard acid green practical rim light from the right side, deep chiaroscuro black shadows, a single soft spotlight from above creating volumetric god rays. Subtle warm orange ember highlights at paper edges. Cinematic color grading cool green-black.
Subject: several 50 euro banknotes suspended mid-air, frozen in slow-motion, falling toward a matte pitch-black surface below. Paper edges slightly curled with tiny warm orange glowing highlights at the tips. Realistic banknote textures with visible details.
Atmosphere: heavy 35mm film grain, high contrast editorial magazine style, stillness and tension.

TYPOGRAPHY (CRITICAL — render exactly):
At the upper-left negative space, render the Spanish text exactly: "308 €" in massive bold condensed sans-serif (Anton style, ALL CAPS), color acid green #CFFF00, dominant largest element. The Euro symbol "€" must be perfectly rendered with exactly one space between "308" and "€".
Directly below it, smaller bold sans-serif text in off-white #F2F2F2: "AL MES".
Below that, even smaller editorial sans-serif in gray #8E8E8E, render exactly: "(suma de las 12 herramientas premium)" with Spanish parentheses.
At the bottom right corner, tiny: "DARK ROOM" in acid green #CFFF00 ALL CAPS with letter-spacing.

Quality directives: editorial magazine cover quality, perfect Euro symbol rendering, no character overlap, no spelling errors, no typos, perfect kerning, generous padding. Three text blocks vertically stacked, no overlap with banknotes.`,
  },
  {
    n: 3,
    role: "REVELACION",
    label: "ENTRA EN DARK ROOM",
    prompt: `Cinematic noir photograph, vertical 2:3 aspect ratio.
Composition: centered symmetric framing with one-point perspective converging at a door at the end of the hallway. Ultra-wide cinematic feel. Vertical negative space at the lower third reserved for typography.
Lighting: intense acid green practical neon light spilling outward from inside a slightly ajar metal door at the end of the dark hallway. Strong backlight silhouette effect, deep black shadows on hallway walls. Color graded cold green-black. Theatrical noir lighting climax.
Subject: narrow dark hallway with pitch black concrete walls (subtle texture visible), a single black metal door at the far end slightly open revealing bright acid green neon glow inside. Heavy volumetric fog drifting near the floor, lit by the green glow.
Atmosphere: 35mm film grain, mysterious threshold moment, editorial moody, cinematic.

TYPOGRAPHY (CRITICAL — render exactly):
At the lower third of the image (the negative space below the door), render the Spanish text exactly:
Line 1: "ENTRA EN"
Line 2: "DARK ROOM."
Use bold condensed sans-serif (Anton style, ALL CAPS), color clean off-white #F2F2F2, massive scale, perfectly centered horizontally.
Below the title, smaller subtitle in acid green #CFFF00, render exactly: "12 herramientas. 1 acceso." single line, perfectly centered.
At the bottom right corner, tiny: "darkroomcreative.cloud" in clean monospace JetBrains Mono style, color #8E8E8E.

Quality directives: editorial magazine quality, professional clean typography, no character overlap, no spelling errors, no typos, perfect kerning, generous padding. The dot/period after "ROOM." must be visible. The text must NOT overlap with the hallway/door image. The "DARK ROOM" must be properly kerned with even letter-spacing.`,
  },
  {
    n: 4,
    role: "SOLUCION",
    label: "24,90 €/MES",
    prompt: `Dark cinematic macro close-up photograph, vertical 2:3 aspect ratio.
Composition: centered subject with strong negative space at the top half reserved for typography. Macro lens shot, shallow depth of field.
Lighting: subject self-illuminated subtly by a warm soft key light, with a single acid green practical rim light on the metal casing edges from the side. Pitch black ambient. Noir chiaroscuro. Color graded black with green accent.
Subject: a single matte black metal vintage key lying diagonally on a pitch-black matte velvet surface. A small rectangular acid green tag with neon glow is attached to it via a tiny black string. The tag has subtle paper texture, slightly worn, with reflective edges. The key has realistic metallic shine on its bow.
Atmosphere: subtle 35mm film grain, premium editorial mood, quiet expensive vibe.

TYPOGRAPHY (CRITICAL — render exactly):
At the upper third of the image, render the Spanish text exactly: "24,90 €" in massive bold condensed sans-serif (Anton style), color acid green #CFFF00, dominant largest element. The European decimal comma must be visible (",") not a period. The Euro symbol "€" must be perfectly rendered with exactly one space after "90".
Directly below it, smaller text "/MES" in clean off-white #F2F2F2 ALL CAPS bold sans-serif.
Below the price block, in editorial sans-serif color off-white #F2F2F2, render exactly: "o 349 € PARA SIEMPRE" — with "PARA SIEMPRE" slightly emphasized in acid green #CFFF00.
On the green tag attached to the key (small text), render exactly: "LIFETIME" in dark color, letter-spaced ALL CAPS.
At the bottom right corner, tiny: "DARK ROOM" in acid green #CFFF00 ALL CAPS letter-spaced.

Quality directives: editorial magazine cover quality, perfect Euro symbol rendering, perfect comma in "24,90", no character overlap, no spelling errors, no typos, perfect kerning, generous padding. Three text blocks vertically stacked plus tag text, no overlap with key subject.`,
  },
  {
    n: 5,
    role: "CTA",
    label: "darkroomcreative.cloud",
    prompt: `Cinematic noir climax photograph, vertical 2:3 aspect ratio.
Composition: centered symmetric framing with strong perspective. Door fills the upper two-thirds of the frame. Lower third reserved for typography negative space.
Lighting: a black metal door now FULLY OPEN at the end of a dark hallway, brilliant acid green neon light flooding outward like a beacon, creating dramatic god-rays through heavy volumetric fog. Strong glow halo around the door frame. Theatrical maximum lighting climax. Color graded green-black with dramatic light contrast.
Subject: silhouette of an anonymous human figure (no facial features visible, just a shape) standing at the threshold about to step through the door into the green light. The hallway frames the silhouette dramatically.
Atmosphere: 35mm film grain, cinematic climax, editorial moody, sense of arrival.

TYPOGRAPHY (CRITICAL — render exactly):
In the lower third of the image (the negative space below the silhouette), render exactly: "darkroomcreative.cloud" in clean monospace typeface (JetBrains Mono style), color acid green #CFFF00, medium scale, single line, perfectly centered horizontally. Each letter must be character-perfect — no missing characters, no extra characters.
Directly below it, smaller text in clean off-white #F2F2F2 sans-serif ALL CAPS: "LINK EN BIO" with letter-spacing.
At the very top corner (small), render: "DARK ROOM" in acid green #CFFF00 ALL CAPS letter-spaced.

Quality directives: editorial magazine cover quality, perfect URL rendering letter by letter, no character overlap, no spelling errors, no typos, generous padding. The URL must be readable and complete: d-a-r-k-r-o-o-m-c-r-e-a-t-i-v-e-dot-c-l-o-u-d. No overlap with figure silhouette.`,
  },
];

// ─────────────────────────────────────────────
// Pipeline functions
// ─────────────────────────────────────────────

async function createPrediction(prompt) {
  const res = await fetch(`${BASE}/model/generateImage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      size: SIZE,
      quality: QUALITY,
      n: 1,
      output_format: "png",
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`Atlas POST ${res.status}: ${JSON.stringify(j).slice(0, 300)}`);
  return j.data;
}

async function pollPrediction(predId, maxAttempts = 60, intervalMs = 5000) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${BASE}/model/prediction/${predId}`, {
      headers: { Authorization: `Bearer ${KEY}` },
    });
    const j = await res.json();
    const data = j.data || j;
    const status = (data.status || "").toLowerCase();
    if (status === "completed" || status === "succeeded") return data;
    if (status === "failed" || status === "error") {
      throw new Error(`Prediction failed: ${data.error || JSON.stringify(data).slice(0, 300)}`);
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Polling timeout");
}

async function downloadPng(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
}

function extractImageUrl(result) {
  return (
    result.outputs?.[0] ||
    result.output?.[0] ||
    result.urls?.[0] ||
    result.image_url ||
    (typeof result.output === "string" ? result.output : null)
  );
}

async function generateSlide(slide) {
  const rawPath = path.join(RAW_DIR, `slide-${slide.n}.png`);
  console.log(`\n→ Slide ${slide.n} · ${slide.role} · "${slide.label}"`);
  process.stdout.write("  creating prediction... ");
  const task = await createPrediction(slide.prompt);
  const predId = task.id || task.prediction_id;
  console.log(`id=${predId}`);
  process.stdout.write("  polling");
  const done = await pollPrediction(predId);
  const imgUrl = extractImageUrl(done);
  if (!imgUrl) throw new Error(`No image URL in completed prediction: ${JSON.stringify(done).slice(0, 300)}`);
  await downloadPng(imgUrl, rawPath);
  const kb = (fs.statSync(rawPath).size / 1024).toFixed(0);
  console.log(`\n  ✓ raw saved: ${rawPath} (${kb} KB)`);
  return rawPath;
}

async function reformatToPublication(rawPath, slideN) {
  const finalPath = path.join(OUT_DIR, `slide-${slideN}.png`);
  // 1024x1536 (2:3) → resize/cover to 1080x1350 (4:5) preserving central composition
  await sharp(rawPath)
    .resize(1080, 1350, { fit: "cover", position: "center" })
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(finalPath);
  const kb = (fs.statSync(finalPath).size / 1024).toFixed(0);
  console.log(`  ✓ publishable saved: ${finalPath} (${kb} KB · 1080×1350)`);
  return finalPath;
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyArgs = args.filter((a) => /^[1-5]$/.test(a)).map(Number);
  const targets = onlyArgs.length ? SLIDES.filter((s) => onlyArgs.includes(s.n)) : SLIDES;

  console.log(`Carrusel Dark Room · gpt-image-2-developer · high · ${SIZE}`);
  console.log(`Slides a procesar: ${targets.map((s) => s.n).join(", ")}`);
  console.log(`Coste estimado: ${targets.length} × $0.032 = $${(targets.length * 0.032).toFixed(3)}\n`);

  if (dryRun) {
    console.log("=".repeat(70));
    console.log("DRY RUN · imprimiendo prompts (no se llama a la API)");
    console.log("=".repeat(70));
    for (const s of targets) {
      console.log(`\n[Slide ${s.n} · ${s.role} · "${s.label}"]`);
      console.log("-".repeat(70));
      console.log(s.prompt);
    }
    console.log("\n" + "=".repeat(70));
    console.log("Para ejecutar de verdad: node generate-carrusel-gpt2.mjs");
    return;
  }

  const startedAt = Date.now();
  let cost = 0;
  let ok = 0;
  let fail = 0;

  for (const slide of targets) {
    try {
      const rawPath = await generateSlide(slide);
      await reformatToPublication(rawPath, slide.n);
      cost += 0.032;
      ok++;
    } catch (err) {
      fail++;
      console.error(`\n  ✗ Slide ${slide.n} FAIL: ${err.message.slice(0, 400)}`);
    }
  }

  const dur = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n${"=".repeat(70)}`);
  console.log(`Done · ok=${ok}/${targets.length} fail=${fail} · ${dur}s · cost ≈ $${cost.toFixed(3)}`);
  console.log(`Output: ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
