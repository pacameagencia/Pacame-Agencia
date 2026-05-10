#!/usr/bin/env python3
"""
knowledge-gate-hook.py — Hook UserPromptSubmit que detecta intent de generación
visual/video Dark Room y FUERZA la carga del KNOWLEDGE-INTEGRATION-v2 antes
de cualquier ejecución.

Razón: Pablo demanda explícitamente que TODO contenido Dark Room esté creado
con el conocimiento del CONOCIMIENTO PROMPT IA.txt (6907 lines). Sin enforcement
automático, el modelo olvida las 21 reglas duras y genera output sub-óptimo.

Este hook:
1. Lee prompt vía stdin (formato Claude Code UserPromptSubmit).
2. Detecta intent generación (Higgsfield models, Soul, Pro, video models).
3. Si match → emite system-reminder con CHECKLIST 16-item PRE-GENERATION
   + reglas R1-R21 aplicables al modelo detectado + obligación cargar v2.
4. Si no match → silencio.

Trigger phrases:
  - hf generate, higgsfield generate, generate create
  - nano_banana, text2image_soul, cinematic_studio, seedance, kling
  - "genera con higgsfield", "Pablo PACAME", "Soul Character", "DARK_FRAMES"
  - "concept 005", "concept 00X", "render reel", "frame hero"
  - "stories darkroom", "story Pablo", "carrusel darkroom"

Uso (en .claude/settings.json):

  "UserPromptSubmit": [
    { "matcher": "*", "hooks": [
      { "type": "command", "command": "python infra/scripts/knowledge-gate-hook.py" }
    ]}
  ]
"""

from __future__ import annotations

import io
import json
import re
import sys

# Forzar UTF-8 en stdout (Windows defaultea a cp1252 y rompe con emojis/flechas)
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


# ---------------------------------------------------------------------------
# Trigger detection: any match → emit knowledge gate reminder
# ---------------------------------------------------------------------------

KNOWLEDGE_GATE_TRIGGERS = [
    # Higgsfield CLI / models
    r"\b(hf|higgsfield)\s+generate\b",
    r"\bgenerate\s+create\b",
    r"\bnano[_\s-]?banana(_2|_pro)?\b",
    r"\btext2image_soul(_v\d)?\b",
    r"\bcinematic_studio(_video)?(_v\d|_3_0)?\b",
    r"\bseedance(_2_0)?\b",
    r"\bkling(_3_0)?\b",
    r"\bveo(_3_1)?\b",
    r"\bsoul[_\s-]?cast\b",

    # Dark Room concepts / brand
    r"\bDARK[\s_-]?FRAMES\b",
    r"\bdarkroomcreative\.cloud\b",
    r"\bdark[\s_-]?frames[\s_-]?\d+\b",  # dark-frames-005 etc
    r"\bconcept[\s_-]?\d{3}\b",          # concept 005 etc
    r"\b(soul[\s_-]?character|Pablo[\s_-]?PACAME)\b",

    # Output types
    r"\b(genera|render|crea|creo|construir)\s+(reel|story|stories|carrusel|carruseles|frame|frames|video|imagen|im[aá]genes)\b",
    r"\b(reel|story|carrusel)[\s_-]?(darkroom|dark[\s_-]?room|pablo)\b",
    r"\bphase[\s_-]?(2|3|3\.5|4|5)\b",  # workflow 4-fase

    # 5 formatos canónicos NUEVOS (DARK-ROOM-PLAYBOOK §1)
    r"\b1[_\s-]?act\b",                       # 1-act 8s single shot
    r"\b2[_\s-]?act\b",                       # 2-act 14s chained
    r"\b3[_\s-]?act\b",                       # 3-act 20-30s trailer
    r"\bformato[_\s-]?(1|2|3)[_\s-]?act\b",   # formato 1-act/2-act/3-act
    r"\b(story|stories)[_\s-]?(5s|5\s?seconds|vertical|ig)\b",
    r"\bcarrusel[_\s-]?(7|siete)?[_\s-]?slides?\b",

    # Outfit / character work
    r"\b(outfit[\s_-]?(swap|transform|change))\b",
    r"\b(character[\s_-]?(consistency|substitution|sheet))\b",
    r"\b360[\s_-]?(consistency|sheet|object)\b",
    r"\b(character[\s_-]?bible|wardrobe[\s_-]?library)\b",

    # Video specific
    r"\b(start[\s_-]?frame|last[\s_-]?frame|end[\s_-]?image|--medias)\b",
    r"\b3-?act\s+(structure|trailer|video)\b",

    # Validation / pipeline gates (NUEVO)
    r"\bvalidate[_\s-]?concept\b",
    r"\brender[_\s-]?and[_\s-]?enqueue\b",
    r"\bconcept[_\s-]?reviewer\b",

    # Pricing / sales
    r"\b(commercial[\s_-]?package|pitch[\s_-]?deck|service[\s_-]?package)\b",
    r"\b(starter[\s_-]?package|professional[\s_-]?package|enterprise[\s_-]?package|retainer)\b",
]


def detect_knowledge_gate_intent(prompt: str) -> bool:
    """Return True if prompt triggers Dark Room knowledge gate."""
    prompt_lower = prompt.lower()
    for pattern in KNOWLEDGE_GATE_TRIGGERS:
        if re.search(pattern, prompt_lower, flags=re.IGNORECASE):
            return True
    return False


# ---------------------------------------------------------------------------
# Pre-generation checklist (TODO output Dark Room debe pasar)
# ---------------------------------------------------------------------------

CHECKLIST_REMINDER = """
🔒 KNOWLEDGE GATE Dark Room ACTIVO · Sistema definitivo v1

Detectado intent de generación Dark Room. ANTES de cualquier ejecución, carga la
fuente única de verdad:

  📘 PLAYBOOK (recipe card 1-página · entrada principal):
     strategy/darkroom/studio-config/DARK-ROOM-PLAYBOOK.md

  📚 REFERENCE (detalle completo · 14 secciones):
     strategy/darkroom/studio-config/DARK-ROOM-REFERENCE.md

  📐 TEMPLATE (schema canonical · validable):
     strategy/darkroom/studio-config/DARK-ROOM-TEMPLATE.json

═══════════════════════════════════════════════════════
PASO 0 OBLIGATORIO · Decision tree formato (PLAYBOOK §1)
═══════════════════════════════════════════════════════

Antes de cualquier prompt, declara EXPLÍCITAMENTE el formato canónico:
  ★ STORY 5s     → UGC daily / BTS / tendencia rápida (AUTHENTIC iPhone)
  ★ CARRUSEL     → 7 slides · weekly explainer / lead magnet
  ★ 1-ACT 8s     → DEFAULT · UNA acción evolutiva continua (recomendado empezar)
  ★ 2-ACT 14s    → 2 shots chained (last frame A = start frame B)
  ★ 3-ACT 20-30s → trailer Hook + Content + CTA (NUNCA "un día completo en 14s")

ANTI-PATRÓN #1 (caso concept 007): 4 escenas con cambios de localización en 14s.
Si tu idea requiere 4 momentos distintos, son 4 piezas 1-act, NO 1 trailer.

═══════════════════════════════════════════════════════
PASO 1 OBLIGATORIO · Validation gate de 3 capas
═══════════════════════════════════════════════════════

Antes de quemar créditos en Higgsfield/Seedance:

  Capa 1 (Schema)  · node tools/dark-frames/validate-concept.mjs <concept.json>
                     → debe exit 0
  Capa 2 (Hook)    · este reminder estás leyendo · honor checklist
  Capa 3 (Subagent)· spawn .claude/agents/concept-reviewer.md sobre concept
                     → debe APROBADO

Si CUALQUIER capa falla → PARAR · iterar concept · NO render.

═══════════════════════════════════════════════════════
CHECKLIST PRE-RENDER (16 items)
═══════════════════════════════════════════════════════

□ Formato canónico declarado (1-act / 2-act / 3-act / story / carrusel)
□ Tier declarado (CINEMATIC / AUTHENTIC / HYBRID) y modelo correcto al tier
□ R1 — Generando 3 image variations mínimo (60-80% success vs 30-40% single)
□ R5 — Video premium: last frame generado + `--end-image` pasado
□ R6 — Video prompt simple `[Subject]+[Action]+[Tone]+[Dialogue]` + "with subtle human mannerisms and natural timing"
□ R7 — CINEMATIC tier: texture stack pasted al final del prompt
□ R8 — Close-ups Pablo: skin realism prompt aplicado (pores, micro-imperfections, baby hairs, asymmetry)
□ R9 — Products/vehicles prominent: object texture prompt aplicado
□ R10 — Vehículo/producto cross-shot: Object Consistency Sheet existe
□ R11 — Prompt sigue DoP order: What MUST be correct → What → How → Where
□ R12 — Edits: "While keeping everything else identical" usado
□ R13 — Multi-image edits: "first/second uploaded picture" numbered
□ R14 — Stories/UGC: tier AUTHENTIC declarado (UGC outperforms 3-5x)
□ R16 — 10+ variations: parallel batch (no sequential · -80% time)
□ R17 — Video corto: 3-Act structure (Hook 1-2s + Content 3-4s + CTA 1-2s)
□ R19 — 3 prompt variations exploradas antes de execute

REGLAS RESTANTES (R2, R4, R15, R18, R20, R21): ver REFERENCE §9 21 reglas duras.

═══════════════════════════════════════════════════════
ANTI-PATRONES PROHIBIDOS (5 K1-K5)
═══════════════════════════════════════════════════════

K1: NO editar imagen mala intentando salvarla · regenerate desde cero
K2: NO single generations · siempre 3 mínimo
K3: NO chase perfection · diminishing returns
K4: NO over-refine 5+ edits · step back regenerate from scratch
K5: NO craft prompts manualmente cuando Custom GPT bot ahorra 10 min/prompt

═══════════════════════════════════════════════════════
DOBLE APROBACIÓN PABLO (regla dura · feedback_doble_aprobacion_videos.md)
═══════════════════════════════════════════════════════

Tier=CINEMATIC con video premium (Seedance/Veo/Kling/Cinematic Studio Video) requiere:
  1. Pablo dice exactamente: "SI aprueba video premium concept NNN · X shots · MODELO · COSTE"
  2. cost-guard token via emit-cost-guard.mjs (Supabase RPC · NUNCA openssl rand)
  3. approval.pablo_double_yes === true en el concept JSON
  4. validate-concept.mjs valida la combinación

Sin estos 4 puntos = render BLOQUEADO.

═══════════════════════════════════════════════════════
DOCS DE PROFUNDIDAD (consulta solo si REFERENCE no responde)
═══════════════════════════════════════════════════════

Histórico (consolidado en REFERENCE · sólo audit/legacy):
  - KNOWLEDGE-INTEGRATION-v2.md (TXT 6907 lines · audit)
  - MEGA-PROMPT-v2.md (workflow 4-fase original)
  - STYLE-ANCHOR-v2.md (6 variants original)
  - NARRATIVE-ARC-protocol-v1.md (4 pilares original)
  - CONSISTENCY-CHECKLIST-v1.md (Three-Pass Review original)
  - AUDIT-knowledge-gaps.md (gaps cubiertos)

FALLO CHECK = PARAR · resolver antes de execute. NUNCA bypass.
"""


# ---------------------------------------------------------------------------
# Hook entry point
# ---------------------------------------------------------------------------

def main() -> int:
    raw = sys.stdin.read()
    if not raw.strip():
        return 0

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        # Not Claude Code format · skip silently
        return 0

    user_prompt = payload.get("prompt", "")
    if not isinstance(user_prompt, str) or not user_prompt.strip():
        return 0

    if not detect_knowledge_gate_intent(user_prompt):
        return 0  # No match · silent

    # Match · emit system-reminder
    output = {
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": CHECKLIST_REMINDER.strip(),
        }
    }
    print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
