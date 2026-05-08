#!/usr/bin/env node
/**
 * Session Initializer · SOP §5 Script 1
 *
 * Carga Mega Prompt + Style Anchor + Consistency Checklist + benchmarks aprobados
 * en el contexto del agente al inicio de cada sesión creativa Dark Room.
 *
 * Sin esto = riesgo de drift = outputs off-brand (lo que pasó en concept 005 v1).
 *
 * Uso:
 *   node strategy/darkroom/studio-config/session-initializer.mjs [--variant=<canónico|vice-city|br2049>]
 *
 * Output:
 *   - Imprime el contexto completo a stdout (copy-paste al inicio del chat)
 *   - O escribe a `tools/dark-frames/.session-context.txt` para autoload via hook
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const VARIANT =
  (args.find((a) => a.startsWith("--variant=")) || "").split("=")[1] || "canónico";

const MEGA_PROMPT_PATH = path.join(__dirname, "MEGA-PROMPT-v1.md");
const STYLE_ANCHOR_PATH = path.join(__dirname, "STYLE-ANCHOR-v1.md");
const CHECKLIST_PATH = path.join(__dirname, "CONSISTENCY-CHECKLIST-v1.md");
const APPROVED_DIR = path.join(ROOT, "strategy", "darkroom", "style-library", "approved");

function readSafe(p) {
  if (!fs.existsSync(p)) {
    console.error(`⚠️  WARNING: ${p} no existe`);
    return null;
  }
  return fs.readFileSync(p, "utf8");
}

const megaPrompt = readSafe(MEGA_PROMPT_PATH);
const styleAnchor = readSafe(STYLE_ANCHOR_PATH);
const checklist = readSafe(CHECKLIST_PATH);

// Load latest 3 approved benchmarks (if any exist)
let benchmarks = [];
if (fs.existsSync(APPROVED_DIR)) {
  benchmarks = fs
    .readdirSync(APPROVED_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .slice(-3)
    .map((f) => ({
      name: f,
      content: fs.readFileSync(path.join(APPROVED_DIR, f), "utf8"),
    }));
}

const ctx = `# Dark Room · Session Context (auto-loaded)

> Cargado: ${new Date().toISOString()}
> Variant: ${VARIANT}

---

## 1 · MEGA PROMPT v1

${megaPrompt || "⚠️ Mega Prompt no encontrado · revisar studio-config/"}

---

## 2 · STYLE ANCHOR v1

${styleAnchor || "⚠️ Style Anchor no encontrado · revisar studio-config/"}

---

## 3 · CONSISTENCY CHECKLIST v1

${checklist || "⚠️ Consistency Checklist no encontrada · revisar studio-config/"}

---

## 4 · APPROVED BENCHMARKS (top ${benchmarks.length} recent)

${
  benchmarks.length > 0
    ? benchmarks.map((b) => `### ${b.name}\n\n${b.content}\n\n---\n`).join("")
    : "⚠️ No hay benchmarks aprobados todavía · primera pieza published-y-viral será el benchmark inicial"
}

---

## RECORDATORIOS OPERATIVOS antes de cada gen

1. ✅ Mega Prompt v1 cargado
2. ✅ Style Anchor v1 cargado (variant: ${VARIANT})
3. ✅ Consistency Checklist disponible para visual-reviewer
4. ⚠️ Antes de gen video premium: 2 SÍ Pablo formato exacto + emit-cost-guard.mjs (NO openssl)
5. ⚠️ Antes de gen: anchor Soul PACAME (text2image_soul_v2 + soul-id 55ac4b3b...)
6. ⚠️ Pasar anchor como --medias start_image al video model
7. ⚠️ Cero IP marks en prompts (GTA · Vice City · Ducati · Rockstar · Stranger Things · etc)
8. ⚠️ Three-Pass Review obligatorio antes de publicar

---

**FIN session context.** Procede con la conversación creativa.
`;

// Output to stdout
console.log(ctx);

// Also write to .session-context.txt for hook autoload
const ctxFile = path.join(ROOT, "tools", "dark-frames", ".session-context.txt");
fs.mkdirSync(path.dirname(ctxFile), { recursive: true });
fs.writeFileSync(ctxFile, ctx);
console.error(`\n✅ Session context escrito a: ${ctxFile}\n`);
