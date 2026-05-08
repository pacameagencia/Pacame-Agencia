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

    # Outfit / character work
    r"\b(outfit[\s_-]?(swap|transform|change))\b",
    r"\b(character[\s_-]?(consistency|substitution|sheet))\b",
    r"\b360[\s_-]?(consistency|sheet|object)\b",
    r"\b(character[\s_-]?bible|wardrobe[\s_-]?library)\b",

    # Video specific
    r"\b(start[\s_-]?frame|last[\s_-]?frame|end[\s_-]?image|--medias)\b",
    r"\b3-?act\s+(structure|trailer|video)\b",

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
🔒 KNOWLEDGE GATE Dark Room ACTIVO

Detectado intent de generación visual/video/copy Dark Room. ANTES de cualquier
ejecución, DEBES cargar y honrar `strategy/darkroom/studio-config/KNOWLEDGE-INTEGRATION-v2.md`
(31 secciones · 21 reglas duras · derivado de CONOCIMIENTO PROMPT IA.txt 6907 lines).

PRE-GENERATION CHECKLIST (16 items obligatorios)

□ R1 — ¿Generando 3 images mínimo? (no single · 60-80% success vs 30-40%)
□ R3 — ¿Tier declarado? (CINEMATIC vs AUTHENTIC vs HYBRID)
□ R3 — ¿Modelo correcto al tier? (Higgsfield Soul para AUTHENTIC · Nano Banana Pro para CINEMATIC)
□ R5 — Para video premium: ¿last frame generado y pasado como --end-image?
□ R6 — Para video: ¿prompt sigue formula simple `[Subject]+[Action]+[Tone]+[Dialogue]` + "with subtle human mannerisms and natural timing"?
□ R7 — Para CINEMATIC: ¿texture stack pasted al final del prompt?
□ R8 — Para close-ups Pablo: ¿skin realism prompt aplicado (pores · micro-imperfections · baby hairs · asymmetry · camera artifacts)?
□ R9 — Para products/vehicles: ¿object texture prompt aplicado (scratches · fingerprints · fabric · contact shadows)?
□ R10 — ¿Vehículo/producto cross-shot? Object Consistency Sheet existe y referenciado.
□ R11 — ¿Prompt sigue DoP order? (What MUST be correct → What → How → Where)
□ R12 — Para edits: ¿"While keeping everything else identical" usado?
□ R13 — Para multi-image edits: ¿"first/second uploaded picture" numbered correctamente?
□ R14 — Para stories/UGC: ¿tier AUTHENTIC declarado? (UGC outperforms 3-5x)
□ R16 — ¿Si 10+ variations: parallel batch (no sequential · -80% time)?
□ R17 — Para video corto: ¿3-Act structure (Hook 1-2s + Content 3-4s + CTA 1-2s)?
□ R19 — ¿Generaron 3 prompt variations antes de execute?

REGLAS RESTANTES (R2, R4, R15, R18, R20, R21):
  - R2: Evaluate 4 criteria (Adherence + Quality + Impact + Usability) post-gen
  - R4: Workflow split Soul base → Pro substitution → Soul-quality animation
  - R15: Don't over-refine · 5+ edits → regenerate from scratch
  - R18: Posting cadence ≤2/día IG (algorithm penaliza 5+/día)
  - R20: Quarterly seasonal updates obligatorios (Q1-Q4 wardrobe + scenarios)
  - R21: Use Nodes WHEN 10+ variations · Manual OK 1-3 variations one-off

ANTI-PATRONES PROHIBIDOS (K1-K5):
  K1: Don't try to edit a bad image into being good · regenerate instead
  K2: Don't waste single generations · always 3 minimum
  K3: Don't chase perfection · diminishing returns
  K4: Don't over-refine 5+ edits · step back regenerate
  K5: Don't craft prompts manually when Custom GPT bot saves 10 min/prompt

DOCS REFERENCIA OBLIGATORIA (cargar antes de generar):
  - strategy/darkroom/studio-config/KNOWLEDGE-INTEGRATION-v2.md (master doc · 31 sections)
  - strategy/darkroom/studio-config/MEGA-PROMPT-v2.md (workflow 4-fase + master prompts)
  - strategy/darkroom/studio-config/STYLE-ANCHOR-v2.md (variant per concept)
  - strategy/darkroom/studio-config/CONSISTENCY-CHECKLIST-v1.md (Three-Pass Review · 26+17 markers)
  - strategy/darkroom/studio-config/NARRATIVE-ARC-protocol-v1.md (frame-to-frame continuity multi-shot)

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
