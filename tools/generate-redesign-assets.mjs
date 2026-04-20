#!/usr/bin/env node
/**
 * PACAME — Generación de assets Spanish Modernism
 * OpenAI DALL-E 3 (calidad HD, style natural para evitar AI-smell saturado)
 *
 * Ejecución:
 *   cd "PACAME AGENCIA" && node --env-file=web/.env.local tools/generate-redesign-assets.mjs
 */

import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "web", "public", "redesign");

const KEY = process.env.OPENAI_API_KEY?.trim();
if (!KEY) {
  console.error("OPENAI_API_KEY missing");
  process.exit(1);
}

const PALETTE = "Color palette: warm sand background #E8DDC7, terracotta accent #B54E30, deep indigo #283B70, mustard yellow #E8B730. Do NOT use purple, cyan, neon colors.";

const ASSETS = [
  {
    filename: "hero-poster.png",
    size: "1792x1024",
    quality: "hd",
    style: "natural",
    prompt: `Spanish modernist graphic poster, flat geometric composition, inspired by Cruz Novillo and Joan Miró late period. Composition: a large stylized sun with thick radial rays in terracotta on the left, three stacked Mediterranean archway silhouettes in deep indigo on the right, a single mustard yellow geometric shape floating between them. Clean linework, flat vector-style shapes, subtle printed paper texture with grain. ${PALETTE} No text, no letters. Mid-century Spanish graphic design, museum poster quality.`,
  },
  {
    filename: "pattern-azulejo.png",
    size: "1024x1024",
    quality: "hd",
    style: "natural",
    prompt: `Spanish azulejo tile pattern, modernist geometric interpretation. Octagonal 8-pointed star motif repeating on a grid, flat vector style, crisp hard edges. Tile composed of terracotta 8-point stars, deep indigo square frames, mustard yellow small circles, all on warm sand background. Clean, symmetric, high resolution. ${PALETTE} No text, no letters, no logos.`,
  },
  {
    filename: "arch-mediterranean.png",
    size: "1792x1024",
    quality: "hd",
    style: "natural",
    prompt: `Photorealistic minimalist Mediterranean architecture. A white-washed stone wall with a single deep-blue arched window, noon sunlight casting a sharp geometric shadow across the wall. Sand-colored stone ground in foreground. A small terracotta clay pot in the corner. Extreme minimalism, shadow as main compositional element. ${PALETTE} Editorial photography, film aesthetic, subtle grain, no people.`,
  },
  {
    filename: "agent-nova-portrait.png",
    size: "1024x1792",
    quality: "hd",
    style: "natural",
    prompt: `Editorial portrait photography, Spanish woman in her 30s seen from the side, painting a geometric pattern on a terracotta-colored clay wall with a wide brush held in her hand. Natural Mediterranean afternoon light, warm tones. She wears a simple mustard-yellow linen shirt. Kinfolk and Apartamento magazine aesthetic. Shallow depth of field, film photography style, subtle grain. ${PALETTE} No text. Calm, focused expression.`,
  },
  {
    filename: "agent-atlas-map.png",
    size: "1024x1024",
    quality: "hd",
    style: "natural",
    prompt: `1960s Spanish tourism poster illustration. Abstract modernist cartography of the Mediterranean coast, stylized with flat geometric shapes. Deep indigo contour lines and paths tracing a coastline over warm sand background. A geometric terracotta compass rose on the lower right. Small mustard yellow dots marking three locations. Screen-printed texture, generous negative space. ${PALETTE} No text, no letters, flat design, sophisticated editorial illustration.`,
  },
  {
    filename: "seal-pacame.png",
    size: "1024x1024",
    quality: "hd",
    style: "natural",
    prompt: `Traditional Spanish ceramic maker's stamp, circular seal design. Central 8-pointed modernist sun motif, a thin concentric ring around it, hand-stamped artisanal appearance with slight ink imperfections and bleed. Terracotta ink on warm sand-colored paper background. No text, no letters, no logos—pure symbol. Minimal, crafted look. ${PALETTE}`,
  },
];

async function gen(asset) {
  console.log(`[${asset.filename}] POST dall-e-3 ${asset.size} ${asset.quality}...`);
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: asset.prompt,
      n: 1,
      size: asset.size,
      quality: asset.quality,
      style: asset.style,
      response_format: "b64_json",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err}`);
  }
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("no b64_json");
  const buf = Buffer.from(b64, "base64");
  await writeFile(join(OUTPUT_DIR, asset.filename), buf);
  console.log(`[${asset.filename}] ✅ ${Math.round(buf.length / 1024)}KB`);
  return { filename: asset.filename, bytes: buf.length };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Generating ${ASSETS.length} assets (parallel)...\n`);

  const results = await Promise.allSettled(ASSETS.map(gen));
  console.log("\n─── Summary ───");
  results.forEach((r, i) => {
    const a = ASSETS[i];
    if (r.status === "fulfilled") console.log(`✅ ${a.filename}  ${Math.round(r.value.bytes / 1024)}KB`);
    else console.log(`❌ ${a.filename}  →  ${r.reason.message}`);
  });
  const ok = results.filter((r) => r.status === "fulfilled").length;
  console.log(`\n${ok}/${ASSETS.length} succeeded`);
  process.exit(ok === ASSETS.length ? 0 : 1);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
