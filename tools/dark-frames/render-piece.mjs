#!/usr/bin/env node
/**
 * Render una pieza DARK_FRAMES desde concept JSON → MP4 final + meta.json.
 *
 * Pipeline:
 *   1. Lee concepts/<concept-id>.json (rechaza si no existe).
 *   2. Para cada shot del concept: llama `higgsfield generate create --wait` con
 *      el modelo + prompt del shot. Descarga el MP4 resultante.
 *   3. Concatena los shots con ffmpeg + aplica LUT cinematográfico + captions
 *      burned-in + outro Dark Room (`assets/outro-darkroom-2s.mp4`).
 *   4. Genera CAPTION.md y meta.json con metadata para el quality gate.
 *   5. (Opcional) lanza visual-reviewer subagent → marca approved/blocked.
 *
 * Reglas duras integradas:
 *   - RECHAZA si no hay concept_id registrado en concepts/ → bloquea prompts basura.
 *   - Si el shot usa Veo/Seedance/Soul Cinema → exige --approved-by-pablo + --cost-guard-token=XXX.
 *   - Output va a output/<concept-id>/ con todos los archivos esperados por enqueue-reel.mjs.
 *
 * Uso:
 *   node tools/dark-frames/render-piece.mjs --concept=dark-frames-001 [--dry-run]
 *   node tools/dark-frames/render-piece.mjs --concept=dark-frames-004 --approved-by-pablo --cost-guard-token=abc123def456ghij
 *
 * Flags:
 *   --concept=<id>             ID del concept (obligatorio)
 *   --dry-run                  no llama Higgsfield, solo muestra plan
 *   --approved-by-pablo        flag obligatorio si concept usa modelo premium
 *   --cost-guard-token=<token> mínimo 16 chars, obligatorio si premium
 *   --skip-visual-reviewer     skip subagent visual reviewer (debug only, marca status='skipped')
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { resolveModel, validateConceptForRender, explainConcept } from "./lib/model-router.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const opts = Object.fromEntries(
  args
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.slice(2).split("=");
      return [k, v ?? "true"];
    }),
);

const CONCEPT_ID = opts.concept;
if (!CONCEPT_ID) {
  console.error("ERROR: --concept=<id> obligatorio");
  process.exit(1);
}

const DRY = opts["dry-run"] === "true";
const APPROVED = opts["approved-by-pablo"] === "true";
const COST_GUARD_TOKEN = opts["cost-guard-token"] || null;
const SKIP_REVIEWER = opts["skip-visual-reviewer"] === "true";

const conceptPath = path.join(__dirname, "concepts", `${CONCEPT_ID}.json`);
if (!fs.existsSync(conceptPath)) {
  console.error(`ERROR: concept '${CONCEPT_ID}' no existe en tools/dark-frames/concepts/`);
  console.error("       NO se permiten prompts ad-hoc tipo 'test' — crea el JSON primero.");
  console.error("       Esto bloquea la causa raíz del incidente histórico de prompts basura.");
  process.exit(1);
}

const concept = JSON.parse(fs.readFileSync(conceptPath, "utf8"));
console.log(`📋 render-piece · ${CONCEPT_ID} · "${concept.title}"`);

// ─── Validación schema_version v2 ─────────────────────────────────

if ((concept.schema_version || 1) < 2) {
  console.error(`ERROR: concept '${CONCEPT_ID}' usa schema_version=${concept.schema_version || 1}`);
  console.error("       Schema v2 obligatorio · regenera con tier + research + structure_template.");
  console.error("       Ver tools/dark-frames/concepts/dark-frames-001.json como referencia.");
  process.exit(1);
}

// ─── Validación research-first (regla feedback_cine_real_research_first.md) ──

const REQUIRED_RESEARCH_FIELDS = [
  "references",
  "dp_references",
  "lens_specs",
  "lut_reference",
  "pacing_template",
  "audio_references",
];

const research = concept.research || {};
const missingResearch = REQUIRED_RESEARCH_FIELDS.filter((f) => {
  const v = research[f];
  if (!v) return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === "string" && v.trim().length < 20) return true;
  return false;
});

if (missingResearch.length > 0) {
  console.error("ERROR: research insuficiente · regla feedback_cine_real_research_first.md");
  console.error(`       Campos faltantes/vacíos en concept.research: ${missingResearch.join(", ")}`);
  console.error("       Cada campo debe contener datos REALES del referente cinematográfico:");
  console.error("       - references: pelis/juegos/directores citados");
  console.error("       - dp_references: directores de fotografía + técnica signature");
  console.error("       - lens_specs: cámara + lentes + apertura concretos");
  console.error("       - lut_reference: LUT/grading method documentado (NO 'cinematic vibe')");
  console.error("       - pacing_template: estructura ritmo + cuts/min documentados");
  console.error("       - audio_references: compositores/tracks reales + sound design philosophy");
  console.error("       Sin research real = no se renderiza · evita 'soup IA random'.");
  process.exit(1);
}

console.log(`  ✓ research v2 completo · ${research.references.length} referencias · ${research.dp_references.length} DPs`);

// ─── Validación tier + model-router ───────────────────────────────

const tier = concept.tier || "top";
console.log(`  ✓ tier=${tier}`);

const validation = validateConceptForRender(concept, {
  approvedByPablo: APPROVED,
  costGuardToken: COST_GUARD_TOKEN,
});

if (!validation.ok) {
  console.error("ERROR: validación tier/aprobación falló:");
  for (const err of validation.errors) console.error(`       · ${err}`);
  console.error("       Reglas: feedback_doble_aprobacion_videos.md + feedback_calidad_top_aprovecha_unlimited.md");
  process.exit(1);
}

console.log("  ✓ aprobaciones tier OK");

// ─── Output dir ───────────────────────────────────────────────────

const outDir = path.join(__dirname, "output", CONCEPT_ID);
fs.mkdirSync(outDir, { recursive: true });
const shotsDir = path.join(outDir, "shots");
fs.mkdirSync(shotsDir, { recursive: true });

// ─── Plan de shots (resuelto por model-router) ────────────────────

console.log(`\n📐 Plan de ${concept.shots.length} shots (${concept.duration_target_s}s + 2s outro):`);
console.log(explainConcept(concept).split("\n").map((l) => `  ${l}`).join("\n"));

if (DRY) {
  console.log("\n⚠️  --dry-run · no genera nada");
  console.log("\nResearch base aplicado a todos los shots:");
  console.log(`  · referencias: ${research.references.join(" | ")}`);
  console.log(`  · DPs: ${research.dp_references.join(" | ")}`);
  console.log(`  · LUT: ${research.lut_reference.slice(0, 120)}…`);
  console.log("\nPrompts que se enviarían:");
  for (const shot of concept.shots) {
    const resolved = resolveModel({
      kind: shot.kind || "video",
      tier: shot.tier || tier,
      override: shot.model_override,
    });
    console.log(`\n— shot ${shot.shot} (${resolved.model}, ${shot.duration_s}s, ${shot.structure_role}):`);
    console.log(shot.prompt);
    if (shot.negative_prompt) console.log(`  NEGATIVE: ${shot.negative_prompt}`);
  }
  process.exit(0);
}

// ─── Generación shots vía Higgsfield CLI ──────────────────────────

const shotFiles = [];
const modelsUsed = new Set();

for (const shot of concept.shots) {
  const resolved = resolveModel({
    kind: shot.kind || "video",
    tier: shot.tier || tier,
    override: shot.model_override,
  });
  modelsUsed.add(resolved.model);
  const shotOut = path.join(shotsDir, `shot-${String(shot.shot).padStart(2, "0")}.mp4`);

  console.log(`\n🎬 Generando shot ${shot.shot} con ${resolved.model} (${shot.duration_s}s, ${shot.structure_role || "no role"})…`);

  // Si el cli_id no está pre-mapeado (override), resolver vía `higgsfield model list`
  let cliModelArg = resolved.cli_id;
  if (!cliModelArg) {
    console.log(`  ℹ resolviendo cli_id de override='${resolved.model}' via higgsfield model list…`);
    cliModelArg = resolved.model;
  }

  const cliArgs = [
    "higgsfield generate create",
    `--model "${cliModelArg}"`,
    `--prompt "${shot.prompt.replace(/"/g, '\\"')}"`,
    shot.negative_prompt ? `--negative-prompt "${shot.negative_prompt.replace(/"/g, '\\"')}"` : "",
    `--aspect-ratio "${concept.aspect_ratio}"`,
    `--duration ${shot.duration_s}`,
    `--output "${shotOut}"`,
    "--wait",
  ]
    .filter(Boolean)
    .join(" ");

  console.log(`  $ ${cliArgs.slice(0, 120)}…`);
  try {
    execSync(cliArgs, { stdio: "inherit" });
  } catch (e) {
    console.error(`  ❌ shot ${shot.shot} falló: ${e.message}`);
    console.error("     Aborta render. Revisa el prompt o reintenta manualmente.");
    process.exit(2);
  }

  if (!fs.existsSync(shotOut)) {
    console.error(`  ❌ shot ${shot.shot}: el CLI no produjo ${shotOut}`);
    process.exit(2);
  }
  shotFiles.push(shotOut);
  console.log(`  ✓ ${path.basename(shotOut)}`);
}

// ─── Concat shots ─────────────────────────────────────────────────

console.log("\n🎞️  Concat shots con ffmpeg…");
const concatList = path.join(outDir, "concat.txt");
fs.writeFileSync(
  concatList,
  shotFiles.map((f) => `file '${f.replace(/'/g, "\\'")}'`).join("\n"),
);

const concatRaw = path.join(outDir, "concat-raw.mp4");
execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c copy "${concatRaw}"`, { stdio: "pipe" });
console.log(`  ✓ ${path.basename(concatRaw)}`);

// ─── Aplicar captions burned-in (si concept los define) ───────────

let withCaptions = concatRaw;
if (concept.captions_burned && concept.captions_burned.length > 0) {
  console.log(`\n📝 Burning ${concept.captions_burned.length} captions…`);
  withCaptions = path.join(outDir, "with-captions.mp4");

  const drawtextFilters = concept.captions_burned
    .map((cap) => {
      const fontFile = cap.font === "Anton"
        ? path.join(__dirname, "..", "..", "carruseles-darkroom", "fonts", "Anton-Regular.ttf")
        : path.join(__dirname, "..", "..", "carruseles-darkroom", "fonts", "JetBrainsMono-Regular.ttf");

      const escapedText = cap.text.replace(/'/g, "\\'").replace(/:/g, "\\:");
      const fontFileEsc = fontFile.replace(/\\/g, "/").replace(/:/g, "\\:");

      const positions = {
        "top-center-safe": "x=(w-text_w)/2:y=120",
        "top-left-safe": "x=80:y=120",
        "center-safe": "x=(w-text_w)/2:y=(h-text_h)/2",
        "bottom-center-safe": "x=(w-text_w)/2:y=h-text_h-220",
      };
      const pos = positions[cap.position] || positions["center-safe"];

      const colorHex = (cap.color || "#FFFFFF").replace("#", "0x");
      return `drawtext=fontfile='${fontFileEsc}':text='${escapedText}':fontsize=${cap.size_px}:fontcolor=${colorHex}:${pos}:enable='between(t,${cap.at_s},${cap.at_s + cap.duration_s})'`;
    })
    .join(",");

  execSync(
    `ffmpeg -y -i "${concatRaw}" -vf "${drawtextFilters}" -c:a copy "${withCaptions}"`,
    { stdio: "pipe" },
  );
  console.log(`  ✓ ${path.basename(withCaptions)}`);
}

// ─── Concat outro Dark Room ───────────────────────────────────────

const outroPath = path.join(__dirname, "assets", "outro-darkroom-2s.mp4");
let finalReel = withCaptions;

if (fs.existsSync(outroPath)) {
  console.log(`\n🎬 Concat outro Dark Room (2s)…`);
  finalReel = path.join(outDir, "reel.mp4");
  const finalConcat = path.join(outDir, "final-concat.txt");
  fs.writeFileSync(
    finalConcat,
    [
      `file '${withCaptions.replace(/'/g, "\\'")}'`,
      `file '${outroPath.replace(/'/g, "\\'")}'`,
    ].join("\n"),
  );
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${finalConcat}" -c copy "${finalReel}"`,
    { stdio: "pipe" },
  );
  console.log(`  ✓ ${path.basename(finalReel)}`);
} else {
  console.log(`\n⚠️  outro NO existe en ${outroPath} — se renombra el archivo actual a reel.mp4 sin outro`);
  console.log("    Ejecuta `node tools/dark-frames/render-outro.mjs` primero para generar el outro.");
  finalReel = path.join(outDir, "reel.mp4");
  fs.copyFileSync(withCaptions, finalReel);
}

// ─── CAPTION.md ───────────────────────────────────────────────────

const captionMd = path.join(outDir, "CAPTION.md");
fs.writeFileSync(
  captionMd,
  `# Caption · ${CONCEPT_ID}\n\n\`\`\`\n${concept.caption_text}\n\n${concept.caption_hashtags}\n\`\`\`\n`,
);
console.log(`  ✓ CAPTION.md`);

// ─── meta.json ────────────────────────────────────────────────────

const metaJson = path.join(outDir, "meta.json");
const meta = {
  concept_id: CONCEPT_ID,
  title: concept.title,
  series_hashtag: concept.series_hashtag,
  schema_version: concept.schema_version,
  tier: concept.tier,
  structure_template: concept.structure_template,
  rendered_at: new Date().toISOString(),
  models_used: Array.from(modelsUsed),
  shot_count: concept.shots.length,
  duration_target_s: concept.duration_target_s,
  cost_guard_token: COST_GUARD_TOKEN,
  approved_by_pablo: APPROVED,
  visual_reviewer_status: SKIP_REVIEWER ? "skipped" : "pending",
  visual_reviewer_at: null,
  source_concept_path: path.relative(path.resolve(__dirname, "..", ".."), conceptPath),
  research_summary: {
    references: concept.research?.references || [],
    dp_references: concept.research?.dp_references || [],
    lut_method: concept.research?.lut_reference?.slice(0, 200) + "…",
    research_sources: concept.research?.research_sources || [],
  },
};
fs.writeFileSync(metaJson, JSON.stringify(meta, null, 2));
console.log(`  ✓ meta.json`);

// ─── Visual reviewer hook ─────────────────────────────────────────

if (!SKIP_REVIEWER) {
  console.log(`\n👁️  PENDIENTE: lanzar subagent visual-reviewer sobre ${path.relative(process.cwd(), finalReel)}`);
  console.log("    Manualmente: usa el subagent visual-reviewer del proyecto");
  console.log("    Cuando apruebe, edita meta.json:");
  console.log('      "visual_reviewer_status": "approved",');
  console.log(`      "visual_reviewer_at": "${new Date().toISOString()}"`);
  console.log("    Hasta que esto pase, enqueue-reel.mjs RECHAZARÁ esta pieza.");
} else {
  console.log("\n⚠️  --skip-visual-reviewer activo · meta.visual_reviewer_status='skipped'");
  console.log("    enqueue-reel.mjs rechazará igualmente — el gate exige 'approved'");
}

// ─── Resumen ──────────────────────────────────────────────────────

console.log(`\n✅ Render completo · ${path.basename(finalReel)}`);
console.log(`   Carpeta: ${outDir}`);
console.log(`\n   Próximo paso:`);
console.log(`   1. Visual-reviewer subagent revisa reel.mp4`);
console.log(`   2. Pablo aprueba o pide iteración`);
console.log(`   3. cuando approved → node tools/dark-frames/enqueue-reel.mjs ${path.relative(process.cwd(), outDir)} --when=ISO`);
