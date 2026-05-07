#!/usr/bin/env node
/**
 * generate-mockups.mjs — Genera los 6 mockups del Storybook 3D.
 *
 * Provider chain: Pollinations.ai (gratis, sin auth) → fallback futuro DALL-E si OPENAI_API_KEY.
 * (Freepik bloqueada por abuso, Gemini Imagen rate-limited en free tier.)
 *
 * Pollinations: https://image.pollinations.ai/prompt/{ENCODED}?width=1024&height=1024&nologo=true
 * Modelo flux por defecto, 1024x1024. Sin auth.
 *
 * Salida: docs/projects/storybook-3d/mockups/{slug}.png
 *
 * Uso: node tools/storybook-3d/generate-mockups.mjs [slug]
 *   Si pasas slug → genera solo ese mockup. Si no → genera los 6.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.join(ROOT, "docs", "projects", "storybook-3d", "mockups");

// ─── Pollinations helpers (no auth, free) ───────────────────────
const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

function buildPollinationsUrl(prompt, opts = {}) {
  const params = new URLSearchParams({
    width: String(opts.width || 1024),
    height: String(opts.height || 1024),
    model: opts.model || "flux", // flux es el más balanceado
    enhance: "true",
    nologo: "true",
    private: "true", // no aparece en feed público
    seed: String(opts.seed || Math.floor(Math.random() * 1_000_000)),
  });
  return `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;
}

async function downloadImage(url, outPath) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(120_000),
    headers: { "User-Agent": "PACAME-Storybook-Mockups/1.0" },
  });
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) throw new Error(`Image too small: ${buf.length} bytes`);
  fs.writeFileSync(outPath, buf);
  return buf.length;
}

// ─── 6 mockups ───────────────────────────────────────────────────
const MOCKUPS = [
  {
    slug: "hero-overview",
    prompt: `Isometric 3D miniature landscape diorama, ceramic modernist sculptural style. Floating ground plane in warm cream paper color (#F4EFE3) with subtle linen texture. On the ground arranged in a soft grid: 5 architectural island objects — (1) terracotta orange (#B54E30) two-story kiosk-house with small screen front, (2) deep indigo blue (#283B70) cylindrical lighthouse with translucent indigo light cone shooting upward, (3) mustard yellow (#E8B730) round circular plaza with 3 speaker cones pointing up in triangle, (4) olive green (#6B7535) modernist coin dispenser sculpture with falling olive coins, (5) terracotta and mustard mixed ceramic workshop with 3 pottery pieces on shelves. All materials: matte ceramic finish, roughness 0.75, NO glossy reflections, NO metallic surfaces, NO chrome. Soft warm directional sunlight from upper right at 35 degrees, subtle shadows. Atmospheric cream background, NOT blue sky. Inspired by: Loewe craft prize ceramics, Cruz Novillo modernist Spanish design, Catalan modernista architecture (Domènech), Joaquim Mir Iberian luminosity. Style: refined sculptural diorama by contemporary Spanish ceramic artist. Camera: isometric upper right at 35 degrees elevation. NO generic AI 3D render aesthetic, NO chrome-glass-tech look. Highly detailed, museum-quality miniature.`,
  },
  {
    slug: "isla-web-quiosco",
    prompt: `Single sculptural object: a modernist ceramic kiosk-house, 2 stories tall, terracotta orange color (#B54E30), matte ceramic finish, roughness 0.75. Front facade has a recessed rectangular screen showing minimal abstract UI lines. Cylindrical terracotta base. Sculptural, like a contemporary ceramic sculpture by Loewe craft prize artist. Floating on warm cream ceramic ground (#F4EFE3) with subtle texture. NO metallic surfaces, NO glossy reflections. Soft warm directional light from upper right at 35 degrees. Atmospheric cream background, NOT blue sky. Inspired by: Catalan modernista urban kiosks, Loewe craft, Cruz Novillo. Camera angle: 3/4 view from upper right. Style: refined sculptural ceramic art, NOT generic AI 3D render.`,
  },
  {
    slug: "isla-seo-faro",
    prompt: `Single sculptural object: a modernist ceramic lighthouse-observatory, cylindrical tall structure, deep indigo blue color (#283B70), matte ceramic finish, roughness 0.72. Top has a circular lantern room. From the top emanates a translucent indigo light cone shooting upward at slight angle, semi-transparent volumetric. Sculptural, like a contemporary ceramic sculpture. Floating on warm cream ceramic ground (#F4EFE3) with subtle texture. NO metallic surfaces, NO glossy reflections. Soft warm directional light from upper right at 35 degrees. Atmospheric cream background, NOT blue sky. Inspired by: Cantabrian coast lighthouses, Catalan modernist astronomical observatories, Loewe craft. Camera angle: 3/4 view from upper right. Style: refined sculptural ceramic art, NOT generic AI 3D render.`,
  },
  {
    slug: "isla-redes-plaza",
    prompt: `Single sculptural object: a modernist ceramic circular plaza with 3 dazibao-style speaker horns pointing upward in triangular formation. Mustard yellow color (#E8B730), matte ceramic finish, roughness 0.62. The plaza is a flat round disc with patterned tiling. The 3 cone speakers rise from the disc at different angles like bouquet. Sculptural, like a contemporary ceramic sculpture. Floating on warm cream ceramic ground (#F4EFE3) with subtle texture. NO metallic surfaces, NO glossy reflections. Soft warm directional light from upper right at 35 degrees. Atmospheric cream background, NOT blue sky. Inspired by: Catalan modernist urban plazas, sound art installations, Loewe craft. Camera angle: 3/4 view from upper right. Style: refined sculptural ceramic art, NOT generic AI 3D render.`,
  },
  {
    slug: "isla-ads-dispensador",
    prompt: `Single sculptural object: a modernist ceramic coin dispenser sculpture, like a stylized slot machine reinterpreted as art object. Olive green color (#6B7535), matte ceramic finish, roughness 0.75. Top has 3 horizontal rotating drums with abstract symbols. Center has a small display window. From the bottom slot, 4-5 olive ceramic coins falling/cascading downward, frozen mid-air. Sculptural, like a contemporary ceramic sculpture. Floating on warm cream ceramic ground (#F4EFE3) with subtle texture. NO metallic surfaces, NO glossy reflections. Soft warm directional light from upper right at 35 degrees. Atmospheric cream background, NOT blue sky. Inspired by: Cruz Novillo Spanish modernist design, Loewe craft, Bauhaus playfulness. Camera angle: 3/4 view from upper right. Style: refined sculptural ceramic art, NOT generic AI 3D render.`,
  },
  {
    slug: "isla-branding-taller",
    prompt: `Single sculptural object: a modernist ceramic workshop scene, mixed terracotta orange (#B54E30) and mustard yellow (#E8B730) colors, matte ceramic finish, roughness 0.72. Open shelving structure holding 3 distinct pottery pieces: a tall amphora (terracotta), a wide bowl (mustard), a thin cylindrical vase (terracotta with mustard band). The shelving is geometric and clean. Sculptural, like a contemporary ceramic sculpture museum piece. Floating on warm cream ceramic ground (#F4EFE3) with subtle texture. NO metallic surfaces, NO glossy reflections. Soft warm directional light from upper right at 35 degrees. Atmospheric cream background, NOT blue sky. Inspired by: Loewe craft prize, Catalan modernista pottery workshops. Camera angle: 3/4 view from upper right. Style: refined sculptural ceramic art, NOT generic AI 3D render.`,
  },
  {
    slug: "escena-auditoria",
    prompt: `Intimate warm interior scene, NOT a floating island. A close-up of a wooden table viewed from sitting position. On the table: a cream ceramic coffee cup with steam rising softly, a small open notebook with blank ruled pages on its left side, and a pencil resting nearby. Soft natural light coming from the upper right. Color palette dominated by warm cream tones (#F4EFE3) with terracotta accents (#B54E30) on cup details. Matte surfaces, NO glossy reflections, NO metallic. Wooden table grain visible but warm. Atmosphere: a quiet conversation about to begin, contemplative, NOT salesy. Background slightly out of focus, warm cream tones. Inspired by: morning Spanish café, Joaquim Mir luminosity, slow life aesthetic. Camera angle: 3/4 from sitting eye level (0, 1.5, 3) looking down at table. Style: editorial photography meets ceramic art, NOT generic AI render.`,
  },
];

// ─── Main ────────────────────────────────────────────────────────
async function generateOne(mockup) {
  const outPath = path.join(OUT_DIR, `${mockup.slug}.png`);
  if (fs.existsSync(outPath)) {
    console.log(`✓ ${mockup.slug}.png ya existe, skip`);
    return outPath;
  }
  console.log(`\n→ Generando ${mockup.slug}.png ...`);
  const url = buildPollinationsUrl(mockup.prompt, { width: 1024, height: 1024, model: "flux" });
  console.log(`  pollinations url len: ${url.length}`);
  const bytes = await downloadImage(url, outPath);
  const sizeMB = (bytes / 1024 / 1024).toFixed(2);
  console.log(`  ✓ saved → ${outPath} (${sizeMB} MB)`);
  return outPath;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const filterSlug = process.argv[2];
  const targets = filterSlug
    ? MOCKUPS.filter((m) => m.slug === filterSlug)
    : MOCKUPS;

  if (targets.length === 0) {
    console.error(`No mockup with slug "${filterSlug}". Available:`);
    MOCKUPS.forEach((m) => console.error(`  - ${m.slug}`));
    process.exit(1);
  }

  console.log(`📦 Generando ${targets.length} mockup(s) con Freepik Mystic`);
  console.log(`   Salida: ${OUT_DIR}\n`);

  const results = [];
  for (const mockup of targets) {
    try {
      const out = await generateOne(mockup);
      results.push({ slug: mockup.slug, status: "ok", path: out });
    } catch (err) {
      console.error(`  ✗ ${mockup.slug}: ${err.message}`);
      results.push({ slug: mockup.slug, status: "fail", error: err.message });
    }
    // Pausa entre llamadas para no saturar
    if (targets.indexOf(mockup) < targets.length - 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log("\n📊 Resumen:");
  const ok = results.filter((r) => r.status === "ok").length;
  const fail = results.filter((r) => r.status === "fail").length;
  console.log(`   ✓ ${ok} ok / ✗ ${fail} fail`);
  if (fail > 0) {
    console.log("\n   Fallos:");
    results.filter((r) => r.status === "fail").forEach((r) => {
      console.log(`     - ${r.slug}: ${r.error}`);
    });
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
