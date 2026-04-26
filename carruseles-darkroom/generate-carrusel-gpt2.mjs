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
    prompt: `MAXIMUM-IMPACT cinematic magazine cover photograph, vertical 2:3 aspect ratio (1024×1536 px). SCROLL-STOPPING editorial cover designed to dominate the Instagram feed with a premium NYT-Magazine × David-Fincher aesthetic.

LAYOUT (strict safe areas):
- Top 12% (0–185 px): empty cinematic dark space (no objects, no text) for safe header padding.
- Top 12–45% (185–690 px): RESERVED for HEADLINE typography only. Subject must NOT enter this zone.
- Middle 45–88% (690–1350 px): subject area (table + receipts).
- Bottom 12% (1350–1536 px): empty for footer/safe area, subtle vignette darkening only.

Composition: dramatic high-angle 60-degree shot of a dark wooden table covered in crumpled thermal paper receipts. Subject CONFINED TO LOWER 60% of the frame. Cinematic depth with foreground receipts slightly out of focus and a sharp midground.

Lighting: single intense acid green neon practical light beam cutting horizontally from the left across the lower portion only, creating volumetric god-rays through floating dust particles. Deep chiaroscuro black shadows. Color graded cinematic teal-green-black with extreme contrast.

Subject: a worn dark wooden table dramatically covered with crumpled thermal paper receipts printed with blurry illegible euro amounts. Realistic paper texture with curl, dust particles, faint volumetric smoke. Premium magazine product photography quality.

Atmosphere: heavy 35mm film grain, subtle deep vignette around the very edges, cinematic noir editorial.

PSYCHOLOGICAL TRIGGER: pattern interrupt + loss aversion + curiosity gap.

TYPOGRAPHY — render in the dedicated safe zone with proper padding:
Headline (top 12–45% safe zone), render exactly: "¿CUÁNTO PAGAS AL AÑO EN IA?" — bold condensed sans-serif (Anton style, ALL CAPS), clean off-white #F2F2F2. Three lines maximum. The Spanish inverted "¿" at the start and "?" at the end. Accent mark on Á in CUÁNTO must be visible and crisp. Generous letter-spacing. Left-aligned starting at 80 px from the left edge, ending at least 80 px from the right edge. NEVER touches edges. Generous line-height with full letter visibility (no clipping at top or bottom of letters).
Subtitle directly below the headline (still inside top safe zone), render exactly: "Suma. No estimes. Suma." in acid green #CFFF00, single line, letter-spaced, smaller scale.

Quality directives: editorial magazine cover quality, professional clean typography, NO character overlap, NO spelling errors, NO typos, perfect kerning, GENEROUS padding around all text blocks (minimum 80 px from any edge), balanced composition, scroll-stopping WOW factor for Instagram feed. Text must NEVER touch image edges and must NOT overlap with paper receipts.`,
  },
  {
    n: 2,
    role: "DOLOR · ANCHOR PRICING",
    label: "308 € AL MES",
    prompt: `Cinematic editorial slow-motion photograph, vertical 2:3 aspect ratio (1024×1536 px). Editorial magazine product-shot quality.

LAYOUT (strict safe areas):
- Top 10% (0–155 px): empty cinematic dark space, no objects no text.
- Top 10–48% (155–740 px): RESERVED for typography (price + sub). Subject must NOT enter.
- Middle 48–92% (740–1410 px): subject area (banknotes).
- Bottom 8% (1410–1536 px): empty / vignette only.

Composition: dramatic medium close-up shot of banknotes frozen mid-air falling toward a matte black surface, confined to the LOWER 60% of the frame. One banknote softly out of focus in the foreground for depth.

Lighting: hard acid green practical rim light from the right, deep chiaroscuro black shadows, single soft spotlight from above creating volumetric god rays through dust particles. Subtle warm orange highlights at paper edges. Color graded cool green-black with dramatic teal contrast.

Subject: several real 50 euro banknotes suspended mid-air, frozen in slow-motion, falling toward a matte pitch-black surface. Paper edges slightly curled, realistic banknote textures with engraved details and security threads.

Atmosphere: heavy 35mm film grain, high contrast editorial magazine, stillness and tension.

PSYCHOLOGICAL TRIGGER: anchor pricing high + loss aversion (money slipping away).

TYPOGRAPHY — render only inside the top safe zone, with strict padding:
Headline (top 10–48% safe zone), render exactly: "308 €" in MASSIVE bold condensed sans-serif (Anton ALL CAPS), color acid green #CFFF00. Perfect Euro symbol with exactly one space (3-0-8-SPACE-€). Left-aligned at 80 px from left, never touching top or right edges.
Below the price: "AL MES" in off-white #F2F2F2, letter-spaced ALL CAPS, smaller scale.
Smallest subtitle below: "(suma de las 12 herramientas premium)" in muted gray #8E8E8E, Spanish parentheses, single line.

Quality directives: editorial magazine cover quality, PERFECT Euro symbol "€" rendering, NO character overlap, NO spelling errors, NO typos, perfect kerning, generous padding (min 80 px from any edge), balanced composition. Text must NEVER touch image edges. Subject (banknotes) must NEVER overlap or touch the typography zone.`,
  },
  {
    n: 3,
    role: "REVELACIÓN · PATTERN INTERRUPT",
    label: "ENTRA EN DARK ROOM",
    prompt: `MAXIMUM-IMPACT cinematic editorial photograph of a HACKER CONTROL ROOM, vertical 2:3 aspect ratio (1024×1536 px). Premium technology editorial cover (Wired × Mr. Robot aesthetic).

LAYOUT (strict safe areas):
- Top 10% (0–155 px): empty cinematic dark space.
- Top 10–55% (155–845 px): control panel monitors area (subject).
- Middle 55–88% (845–1350 px): RESERVED for typography (headline + sub).
- Bottom 12% (1350–1536 px): empty / subtle vignette.

Composition: dramatic over-shoulder POV looking at a dark desk with multiple curved monitors arranged in semicircle. Mid-back of an anonymous figure in dark hoodie barely visible at bottom of frame edge. Multiple screens displaying interface UI fragments and code in acid green text on black background. Subject confined to UPPER 55%.

Lighting: monitor screens emit cold acid green glow as primary light source, illuminating dust particles and subtle smoke in the air. Warm orange amber rim light from a single hidden practical lamp on the right adding cinematic complexity. Dark hallway visible in deep background. Color graded cinematic teal-green-black with high contrast.

Subject: dark wooden modern desk, three to four black-framed curved monitors with green-on-black interface (no readable specific text, abstract code lines and UI), mechanical keyboard, ceramic black coffee mug, dark headphones. Anonymous hooded figure silhouette at the bottom of frame, viewed from behind, only top of shoulders and back of hooded head visible.

Atmosphere: 35mm film grain, mysterious tech-hacker moment, editorial Wired-magazine cover, cinematic David Fincher aesthetic.

PSYCHOLOGICAL TRIGGER: curiosity gap + pattern interrupt + insider authority (you're seeing inside the room).

TYPOGRAPHY — render only inside the bottom safe zone (middle 55–88%), with strict padding:
Headline (in the lower middle safe zone), render exactly two lines:
Line 1: "ENTRA EN"
Line 2: "DARK ROOM."
Bold condensed sans-serif (Anton ALL CAPS), color clean off-white #F2F2F2, MASSIVE scale, perfectly centered horizontally with at least 80 px padding from left and right edges.
Below the title, subtitle: "12 herramientas. 1 acceso." in acid green #CFFF00, single line, perfectly centered, letter-spaced.

Quality directives: editorial magazine cover quality, professional clean typography, NO character overlap, NO spelling errors, NO typos, perfect kerning, GENEROUS padding (minimum 80 px from any edge). The period after "ROOM." must be visible. Text never overlaps with the monitor/desk subject. The Á accent must be visible. Two text blocks vertically stacked with proper line height.`,
  },
  {
    n: 4,
    role: "SOLUCIÓN · CONTRAST ANCHOR",
    label: "24,90 €/MES",
    prompt: `Dark cinematic macro close-up photograph, vertical 2:3 aspect ratio (1024×1536 px). Premium product editorial (Wallpaper* / Monocle) crossed with cinematic noir.

LAYOUT (strict safe areas):
- Top 10% (0–155 px): empty.
- Top 10–48% (155–740 px): RESERVED for typography (price + sub). Subject must NOT enter.
- Middle 48–92% (740–1410 px): subject area (key + tag).
- Bottom 8% (1410–1536 px): empty / vignette.

Composition: centered subject with strong negative space in upper third reserved for typography. Macro lens shot, shallow depth of field with creamy background bokeh, subject sharp. Subject confined to LOWER 50%.

Lighting: subject self-illuminated by a warm soft key light from above-front, with a single acid green practical rim light on the metal casing edges from the side. Pitch black ambient. Noir chiaroscuro. Color graded black with green accent.

Subject: a single matte black metal vintage skeleton key lying diagonally on a pitch-black matte velvet surface. A small rectangular acid green glowing tag with subtle neon halo attached via a thin black braided string. Tag has paper texture, slightly worn. Realistic metallic shine on key bow.

Atmosphere: subtle 35mm film grain, premium editorial mood, quiet expensive luxury.

PSYCHOLOGICAL TRIGGER: contrast anchor (308 € → 24,90 € feels free) + visual metaphor (key = access).

TYPOGRAPHY — render only inside top safe zone, strict padding:
Headline (top safe zone), render exactly: "24,90 €" in MASSIVE bold condensed sans-serif (Anton ALL CAPS), color acid green #CFFF00. The European decimal COMMA "," must be visible (NOT a period). Perfect Euro symbol with one space (2-4-comma-9-0-SPACE-€). Centered horizontally with min 80 px from left and right edges.
Below the price: "/ MES" in off-white #F2F2F2 ALL CAPS bold, letter-spaced, smaller scale, centered.
Sub-subtitle below: "o 349 € PARA SIEMPRE." in editorial sans-serif, off-white #F2F2F2, with "PARA SIEMPRE" highlighted in acid green #CFFF00.
On the green tag attached to the key (tiny text on the tag itself), render exactly: "LIFETIME" in dark #0A0A0A on green, letter-spaced ALL CAPS.

Quality directives: editorial magazine cover quality, PERFECT Euro symbol "€" rendering, PERFECT comma in "24,90", NO character overlap, NO typos, perfect kerning, generous padding (min 80 px from any edge). Three text blocks vertically stacked in the safe zone plus tag text on the key. Text never overlaps key subject.`,
  },
  {
    n: 5,
    role: "CTA · SCARCITY + AUTHORITY",
    label: "darkroomcreative.cloud",
    prompt: `Cinematic editorial close-up photograph of a SMARTPHONE displaying Dark Room interface, vertical 2:3 aspect ratio (1024×1536 px). Premium tech product editorial (Apple keynote × Wired aesthetic).

LAYOUT (strict safe areas):
- Top 10% (0–155 px): empty cinematic dark space.
- Top 10–35% (155–540 px): RESERVED for headline typography. Subject must NOT enter.
- Middle 35–80% (540–1230 px): subject area (smartphone in hand).
- Bottom 20% (1230–1536 px): RESERVED for URL + sub typography.

Composition: dramatic 45-degree top-down view of a hand holding a modern matte-black smartphone (no visible logos), thumb hovering over the screen. Phone CENTERED in middle 45% of frame. Background out of focus dark wooden surface with subtle acid green neon reflection.

Lighting: the smartphone screen emits acid green light as primary source, illuminating fingers and casting subtle green glow on the surrounding dark surface. Single warm rim light on the side of the phone case from a hidden practical lamp. Color graded cinematic green-black.

Subject: matte-black modern smartphone (no brand visible) held vertically by an anonymous hand (no skin tone identifiable, just shadow form), thumb hovering. The phone screen displays a clean dark interface with a single line of acid green text "darkroomcreative.cloud" centered, plus a small green circular dot (cursor) below — minimal app-style UI.

Atmosphere: 35mm film grain, cinematic editorial product moment, premium tech mood.

PSYCHOLOGICAL TRIGGER: scarcity ("últimas plazas") + authority (crossing into exclusive) + immediacy (you can act NOW with your phone).

TYPOGRAPHY — render only in dedicated safe zones, strict padding:
Top headline (top 10–35% safe zone), render exactly two lines centered:
Line 1: "ÚLTIMAS PLAZAS"
Line 2: "LIFETIME"
Bold condensed sans-serif (Anton ALL CAPS), color clean off-white #F2F2F2, MASSIVE scale, perfectly centered horizontally with min 80 px padding. The accent on Ú must be perfectly visible.
Below the smartphone, in the bottom safe zone, render exactly:
URL line: "darkroomcreative.cloud" in monospace JetBrains-Mono style, acid green #CFFF00, single line, centered.
Below it: "LINK EN BIO" smaller, off-white #F2F2F2 ALL CAPS letter-spaced.

Quality directives: editorial premium product photography quality, PERFECT URL rendering letter by letter (d-a-r-k-r-o-o-m-c-r-e-a-t-i-v-e-DOT-c-l-o-u-d), PERFECT Ú accent in ÚLTIMAS, NO character overlap, NO typos, generous padding (min 80 px from any edge). Text never overlaps the smartphone subject. URL must be visible and readable both on the phone screen AND in the bottom typography zone.`,
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
