#!/usr/bin/env node
/**
 * Session Initializer · Dark Room v2
 *
 * Carga el sistema definitivo unificado (PLAYBOOK + REFERENCE + TEMPLATE)
 * + benchmarks WOW al inicio de cada sesión creativa.
 *
 * Sin esto = riesgo de drift = outputs off-brand (lo que pasó en concept 005 v1 + concept 007).
 *
 * Uso:
 *   node strategy/darkroom/studio-config/session-initializer.mjs [--variant=<canonico|vice_city_sunset_v2|br2049_v2|mad_max_v2|authentic_iphone_v2|miami_vice_2006_v2>]
 *
 * Output:
 *   - Imprime el contexto completo a stdout (copy-paste al inicio del chat)
 *   - Escribe a `tools/dark-frames/.session-context.txt` para autoload via hook
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const VARIANT =
  (args.find((a) => a.startsWith("--variant=")) || "").split("=")[1] || "canonico";

// Sistema definitivo v1 (consolidado · single source of truth)
const PLAYBOOK_PATH = path.join(__dirname, "DARK-ROOM-PLAYBOOK.md");
const REFERENCE_PATH = path.join(__dirname, "DARK-ROOM-REFERENCE.md");
const TEMPLATE_PATH = path.join(__dirname, "DARK-ROOM-TEMPLATE.json");

// Benchmarks WOW + anti-patterns
const BENCHMARKS_INDEX = path.join(ROOT, "tools", "dark-frames", "benchmarks", "BENCHMARKS-INDEX.md");
const WOW_REFERENCES_DIR = path.join(ROOT, "tools", "dark-frames", "benchmarks", "wow-references");

function readSafe(p) {
  if (!fs.existsSync(p)) {
    console.error(`⚠️  WARNING: ${p} no existe`);
    return null;
  }
  return fs.readFileSync(p, "utf8");
}

const playbook = readSafe(PLAYBOOK_PATH);
const reference = readSafe(REFERENCE_PATH);
const template = readSafe(TEMPLATE_PATH);
const benchmarksIndex = readSafe(BENCHMARKS_INDEX);

// Load up to 3 wow-references más recientes (si existen)
let wowRefs = [];
if (fs.existsSync(WOW_REFERENCES_DIR)) {
  wowRefs = fs
    .readdirSync(WOW_REFERENCES_DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort()
    .slice(-3)
    .map((f) => ({
      name: f,
      content: fs.readFileSync(path.join(WOW_REFERENCES_DIR, f), "utf8"),
    }));
}

const ctx = `# Dark Room · Session Context v2 (auto-loaded)

> Cargado: ${new Date().toISOString()}
> Variant declarado: ${VARIANT}

═══════════════════════════════════════════════════════════
1 · DARK-ROOM-PLAYBOOK (recipe card 1-página · 5 formatos canónicos)
═══════════════════════════════════════════════════════════

${playbook || "⚠️ DARK-ROOM-PLAYBOOK.md no encontrado · ABORT · sistema definitivo no instalado"}

═══════════════════════════════════════════════════════════
2 · DARK-ROOM-REFERENCE (detalle 14 secciones · fuente única de verdad)
═══════════════════════════════════════════════════════════

${reference || "⚠️ DARK-ROOM-REFERENCE.md no encontrado · revisar studio-config/"}

═══════════════════════════════════════════════════════════
3 · DARK-ROOM-TEMPLATE (schema canonical concept JSON · validable con ajv)
═══════════════════════════════════════════════════════════

\`\`\`json
${template || "⚠️ DARK-ROOM-TEMPLATE.json no encontrado · revisar studio-config/"}
\`\`\`

═══════════════════════════════════════════════════════════
4 · BENCHMARKS WOW (calibración visual-reviewer + concept-reviewer)
═══════════════════════════════════════════════════════════

${benchmarksIndex || "⚠️ BENCHMARKS-INDEX.md no encontrado"}

${
  wowRefs.length > 0
    ? `### Top ${wowRefs.length} wow-references cargadas:\n\n${wowRefs.map((b) => `#### ${b.name}\n\n${b.content}\n\n---\n`).join("")}`
    : "ℹ️ wow-references/ vacío · pendiente input Pablo (5-10 piezas reference)"
}

═══════════════════════════════════════════════════════════
RECORDATORIOS OPERATIVOS antes de cada generación
═══════════════════════════════════════════════════════════

1. ✅ PLAYBOOK + REFERENCE + TEMPLATE cargados (sistema definitivo v1)
2. ✅ Variant declarado: ${VARIANT}
3. ⚠️ PASO 0 · Declarar formato canónico (1-act / 2-act / 3-act / story / carrusel)
4. ⚠️ PASO 1 · Validation gate de 3 capas:
   - Capa 1: \`node tools/dark-frames/validate-concept.mjs <concept.json>\` → exit 0
   - Capa 2: knowledge-gate-hook.py emite reminder · honor checklist 16-item
   - Capa 3: spawn .claude/agents/concept-reviewer.md → APROBADO obligatorio
5. ⚠️ Antes de Phase 4 video premium: 2 SÍ Pablo formato exacto + emit-cost-guard.mjs (NO openssl)
6. ⚠️ Antes de Phase 3: Soul Character PACAME anchor (text2image_soul_v2 + soul-id 55ac4b3b-51f7-497a-8150-87563a969915)
7. ⚠️ Pasar anchor como --medias start_image + --end-image al video model
8. ⚠️ Cero IP marks en prompts · usar sustituciones safe del REFERENCE §4.2
9. ⚠️ Three-Pass Review obligatorio antes de publicar (26+7 markers)

═══════════════════════════════════════════════════════════

**FIN session context.** Procede con la conversación creativa.
`;

// Output to stdout
console.log(ctx);

// Also write to .session-context.txt for hook autoload
const ctxFile = path.join(ROOT, "tools", "dark-frames", ".session-context.txt");
fs.mkdirSync(path.dirname(ctxFile), { recursive: true });
fs.writeFileSync(ctxFile, ctx);
console.error(`\n✅ Session context escrito a: ${ctxFile}\n`);
