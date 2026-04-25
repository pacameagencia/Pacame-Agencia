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
    role: "HOOK · COVER WOW",
    label: "¿CUÁNTO PAGAS AL AÑO EN IA?",
    prompt: `MAXIMUM-IMPACT cinematic magazine cover photograph, vertical 2:3 aspect ratio. SCROLL-STOPPING editorial cover designed to dominate the Instagram feed.
Composition: dramatic low-angle wide shot of a dark wooden table covered in crumpled thermal paper receipts and small crumpled euro bills, shot with extreme depth and atmospheric perspective. Strong vertical negative space at the top reserved for the headline. Cinematic depth with foreground receipt elements out of focus blurred and a sharp midground subject.
Lighting: a single intense acid green neon practical light beam cutting horizontally across the scene from the left, creating dramatic god-rays through floating dust particles and faint smoke. Deep chiaroscuro black shadows. One subtle warm rim light on the top-most receipt. Color graded cinematic teal-green-black, EXTREME contrast.
Subject: a worn dark wooden table dramatically covered with dozens of crumpled thermal paper receipts printed with blurry illegible euro amounts, scattered organically with realistic paper texture, slight curl, dust particles in the air, faint volumetric atmosphere.
Atmosphere: heavy 35mm film grain, deep vignette, cinematic noir editorial mood, quiet psychological tension, premium magazine quality (think NYT Magazine cover crossed with David Fincher film still).

PSYCHOLOGICAL TRIGGER: pattern interrupt + loss aversion + curiosity gap.

TYPOGRAPHY (CRITICAL — render exactly):
At the top half of the image, render the Spanish text exactly: "¿CUÁNTO PAGAS AL AÑO EN IA?" in MASSIVE bold condensed sans-serif typeface (Anton style, ALL CAPS), color clean off-white #F2F2F2, three lines maximum, perfectly readable. The Spanish inverted question mark "¿" at the start and standard "?" at the end. The accent mark on Á in CUÁNTO must be visible, crisp and properly placed. Generous letter-spacing, perfectly aligned center-left, dominant element.
Directly below the headline, smaller bold sans-serif subtitle, render exactly: "Suma. No estimes. Suma." in acid green #CFFF00, single line, letter-spaced.
At the bottom-LEFT corner, in tiny clean letter-spaced caps, render: "DARK ROOM" in acid green #CFFF00.
At the bottom-RIGHT corner, very small subtle watermark, render exactly: "@ PACAME" in muted off-white #6F6F6F, ALL CAPS letter-spaced, like a creator credit on editorial photography. Maximum 4% of image height.

Quality directives: editorial magazine cover quality at the level of a premium publication, professional clean typography, NO character overlap, NO spelling errors, NO typos, perfect kerning, generous padding around all text blocks, balanced composition, scroll-stopping WOW factor for Instagram feed. Text must NOT touch image edges and must NOT overlap with paper receipts.`,
  },
  {
    n: 2,
    role: "DOLOR · ANCHOR PRICING",
    label: "308 € AL MES",
    prompt: `Cinematic slow-motion editorial photograph, vertical 2:3 aspect ratio. Editorial magazine quality.
Composition: dramatic medium close-up shot, asymmetric framing with strong dramatic negative space on the upper-LEFT reserved for typography. Subject (banknotes) sits in the lower-right two-thirds, with one banknote slightly out of focus in the foreground for cinematic depth.
Lighting: hard acid green practical rim light from the right side, deep chiaroscuro black shadows, a single soft spotlight from above creating volumetric god rays through dust particles. Subtle warm orange ember-like highlights at paper edges suggesting heat. Cinematic color grading cool green-black with dramatic teal contrast.
Subject: several real-looking 50 euro banknotes suspended mid-air, frozen in slow-motion, falling toward a matte pitch-black surface below. Paper edges slightly curled with tiny warm orange glowing highlights at the tips. Realistic banknote textures with visible engraved details, security threads, and color depth.
Atmosphere: heavy 35mm film grain, high contrast editorial magazine style, stillness and tension, premium photography.

PSYCHOLOGICAL TRIGGER: anchor pricing high (so next slides feel cheap) + loss aversion (money slipping away).

TYPOGRAPHY (CRITICAL — render exactly):
At the upper-left negative space, render the Spanish text exactly: "308 €" in MASSIVE bold condensed sans-serif (Anton style, ALL CAPS), color acid green #CFFF00, dominant largest element on the image. The Euro symbol "€" must be perfectly rendered with exactly one space between "308" and "€" (eight-character total: 3-0-8-space-€).
Directly below it, smaller bold sans-serif text in clean off-white #F2F2F2: "AL MES" letter-spaced.
Below that, even smaller editorial sans-serif in muted gray #8E8E8E, render exactly: "(suma de las 12 herramientas premium)" with Spanish parentheses.
At the bottom-LEFT corner, tiny: "DARK ROOM" in acid green #CFFF00 ALL CAPS with letter-spacing.
At the bottom-RIGHT corner, very small subtle watermark: "@ PACAME" in muted off-white #6F6F6F, ALL CAPS letter-spaced, creator credit style.

Quality directives: editorial magazine cover quality, perfect Euro symbol "€" rendering, perfect comma if used, NO character overlap, NO spelling errors, NO typos, perfect kerning, generous padding. Three text blocks vertically stacked plus two corner credits, no overlap with banknotes.`,
  },
  {
    n: 3,
    role: "REVELACIÓN · PATTERN INTERRUPT",
    label: "ENTRA EN DARK ROOM",
    prompt: `MAXIMUM-IMPACT cinematic noir photograph, vertical 2:3 aspect ratio. Editorial magazine cover quality.
Composition: centered symmetric framing with strong one-point perspective converging at a door at the end of a dark hallway. Ultra-wide cinematic anamorphic feel with subtle barrel distortion. Vertical negative space at the lower third reserved for typography. Foreground frame edges slightly darker (vignette).
Lighting: intense acid green practical neon light spilling outward from inside a slightly ajar matte black metal door at the end of the dark hallway, creating dramatic god-rays through volumetric fog. Strong backlight silhouette effect on the door frame, deep black shadows on hallway walls. Color graded cold green-black. Theatrical noir lighting climax with one warm rim light hint.
Subject: narrow dark hallway with pitch black concrete walls (subtle texture and stains visible), a single matte black metal door at the far end slightly open revealing bright acid green neon glow inside. Heavy volumetric fog drifting low near the floor, illuminated by the green glow. Visible dust particles floating in the light beam.
Atmosphere: 35mm film grain, mysterious threshold moment, editorial moody, cinematic David Fincher / Denis Villeneuve aesthetic.

PSYCHOLOGICAL TRIGGER: curiosity gap + pattern interrupt (visual reveal mid-carousel breaks scroll rhythm).

TYPOGRAPHY (CRITICAL — render exactly):
At the lower third of the image (the negative space below the door), render the Spanish text exactly:
Line 1: "ENTRA EN"
Line 2: "DARK ROOM."
Use MASSIVE bold condensed sans-serif (Anton style, ALL CAPS), color clean off-white #F2F2F2, perfectly centered horizontally, dominant element.
Below the title, smaller subtitle in acid green #CFFF00 letter-spaced, render exactly: "12 herramientas. 1 acceso." single line, perfectly centered.
At the bottom-LEFT corner, tiny: "darkroomcreative.cloud" in clean monospace JetBrains Mono style, color muted #8E8E8E.
At the bottom-RIGHT corner, very small subtle watermark: "@ PACAME" in muted off-white #6F6F6F, ALL CAPS letter-spaced, creator credit style.

Quality directives: editorial magazine cover quality, professional clean typography, NO character overlap, NO spelling errors, NO typos, perfect kerning, generous padding. The period after "ROOM." must be visible. Text must NOT overlap with the hallway/door image subject. "DARK ROOM" properly kerned with even letter-spacing. The Á accent in any Spanish text must be perfect.`,
  },
  {
    n: 4,
    role: "SOLUCIÓN · CONTRAST ANCHOR",
    label: "24,90 €/MES",
    prompt: `Dark cinematic macro close-up photograph, vertical 2:3 aspect ratio. Editorial magazine quality (think Wallpaper* or Monocle product shot crossed with cinematic noir).
Composition: centered subject with strong negative space at the top half reserved for typography. Macro lens shot, shallow depth of field with creamy background bokeh, subject sharp.
Lighting: subject self-illuminated subtly by a warm soft key light from above-front, with a single acid green practical rim light on the metal casing edges from the side. Pitch black ambient. Noir chiaroscuro with one warm warm point and one acid green rim. Color graded black with green accent.
Subject: a single matte black metal vintage skeleton key lying diagonally on a pitch-black matte velvet/leather surface. A small rectangular acid green glowing tag with subtle neon halo is attached to it via a tiny black braided string. The tag has subtle paper texture, slightly worn edges. The key has realistic metallic shine on its bow with subtle reflections.
Atmosphere: subtle 35mm film grain, premium editorial mood, quiet expensive luxury vibe.

PSYCHOLOGICAL TRIGGER: contrast anchor (308 € → 24,90 € feels free) + reciprocity/value reveal + visual metaphor (key = access).

TYPOGRAPHY (CRITICAL — render exactly):
At the upper third of the image, render the Spanish text exactly: "24,90 €" in MASSIVE bold condensed sans-serif (Anton style, ALL CAPS), color acid green #CFFF00, dominant largest element. The European decimal comma must be visible (",") NOT a period. The Euro symbol "€" must be perfectly rendered with exactly one space after "90" (seven-character total: 2-4-comma-9-0-space-€).
Directly below it, smaller text "/MES" in clean off-white #F2F2F2 ALL CAPS bold sans-serif letter-spaced.
Below the price block, in editorial sans-serif color off-white #F2F2F2, render exactly: "o 349 € PARA SIEMPRE." — with "PARA SIEMPRE" emphasized in acid green #CFFF00.
On the green tag attached to the key (tiny text on the tag itself), render exactly: "LIFETIME" in dark #0A0A0A on the green tag, letter-spaced ALL CAPS.
At the bottom-LEFT corner, tiny: "DARK ROOM" in acid green #CFFF00 ALL CAPS letter-spaced.
At the bottom-RIGHT corner, very small subtle watermark: "@ PACAME" in muted off-white #6F6F6F, ALL CAPS letter-spaced, creator credit style.

Quality directives: editorial magazine cover quality, PERFECT Euro symbol "€" rendering, PERFECT comma in "24,90", NO character overlap, NO spelling errors, NO typos, perfect kerning, generous padding. Three text blocks vertically stacked plus tag text plus two corner credits, no overlap with key subject.`,
  },
  {
    n: 5,
    role: "CTA · SCARCITY + AUTHORITY",
    label: "darkroomcreative.cloud",
    prompt: `MAXIMUM-IMPACT cinematic noir climax photograph, vertical 2:3 aspect ratio. Editorial magazine final-page closing image.
Composition: centered symmetric framing with strong one-point perspective. Door fills the upper two-thirds of the frame. Lower third reserved for typography negative space. Slight low-angle for hero feel.
Lighting: a matte black metal door now FULLY OPEN at the end of a dark hallway, brilliant acid green neon light flooding outward like a beacon, creating dramatic god-rays through heavy volumetric fog and dust particles. Strong glow halo around the door frame creating bloom effect. Theatrical maximum lighting climax. Color graded green-black with dramatic high-key acid green inside the door frame.
Subject: silhouette of an anonymous human figure (no facial features, no recognisable shape — just a dark anonymous human form from behind) standing at the threshold about to step through the door into the green light. The hallway frames the silhouette dramatically.
Atmosphere: 35mm film grain, cinematic climax, editorial moody, sense of arrival and inevitability.

PSYCHOLOGICAL TRIGGER: scarcity ("últimas plazas lifetime") + authority (sense of crossing into something exclusive) + commitment ("quienes entran no salen").

TYPOGRAPHY (CRITICAL — render exactly):
In the lower third of the image (the negative space below the silhouette), render the URL exactly: "darkroomcreative.cloud" in clean monospace typeface (JetBrains Mono style), color acid green #CFFF00, medium scale, single line, perfectly centered horizontally. Each character must be precisely rendered — no missing chars, no extra chars: d-a-r-k-r-o-o-m-c-r-e-a-t-i-v-e-(dot)-c-l-o-u-d.
Directly below it, smaller text in clean off-white #F2F2F2 sans-serif ALL CAPS letter-spaced: "LINK EN BIO".
Above the URL, smaller text in muted gray #8E8E8E render exactly: "ÚLTIMAS PLAZAS LIFETIME — 349 €" all-caps letter-spaced.
At the top-LEFT corner, small: "DARK ROOM" in acid green #CFFF00 ALL CAPS letter-spaced.
At the top-RIGHT corner, very small subtle watermark: "@ PACAME" in muted off-white #6F6F6F, ALL CAPS letter-spaced, creator credit style.

Quality directives: editorial magazine cover quality, PERFECT URL rendering letter by letter, PERFECT Á accent in ÚLTIMAS, NO character overlap, NO spelling errors, NO typos, generous padding. Text must NOT overlap with figure silhouette. The URL must be readable and complete with no character missing.`,
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
