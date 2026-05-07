#!/usr/bin/env python3
"""
frontend-trigger-hook.py — Hook UserPromptSubmit que detecta intención
frontend/visual en el prompt de Pablo y FUERZA la carga del protocolo
visual-first antes de generar.

Razón: el modelo, por defecto, va directo a Tailwind+HTML genérico cuando
recibe "haz una landing", "componente UI", "diseña X". Esto produce
frontends básicos. El protocolo `docs/protocols/visual-first.md` ya define
las skills que hay que invocar (pacame-web, frontend-design, imagen, etc.),
pero el modelo no lo carga si nadie le obliga.

Este hook lee el prompt vía stdin (formato Claude Code UserPromptSubmit),
matchea regex contra trigger phrases y emite stdout con un system-reminder
que Claude Code inyecta al contexto antes de procesar el turno.

Uso (en .claude/settings.json):

  "UserPromptSubmit": [
    { "matcher": "*", "hooks": [
      { "type": "command", "command": "python infra/scripts/frontend-trigger-hook.py" }
    ]}
  ]

El hook solo emite stdout cuando hay match. En cualquier otro caso, exit 0
silencioso.
"""

from __future__ import annotations

import io
import json
import re
import sys
from pathlib import Path

# Forzar UTF-8 en stdout (Windows defaultea a cp1252 y rompe con emojis/flechas)
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


# Triggers en español + inglés. Cualquier match dispara el reminder.
FRONTEND_TRIGGERS = [
    r"\b(landing|landings|landing page)\b",
    r"\b(homepage|home page|p[áa]gina principal)\b",
    r"\b(componente|componentes|component|components)\b",
    r"\b(dise[ñn]a|dise[ñn]o|design|designed)\b",
    r"\b(maqueta|maquetar|mockup|mockups|wireframe)\b",
    r"\b(UI|UX|interfaz|interface)\b",
    r"\b(hero section|hero)\b",
    r"\b(web|website|sitio web|p[áa]gina web)\b",
    r"\b(react|next\.?js|tailwind|shadcn)\b",
    r"\b(frontend|front-?end)\b",
    r"\b(theme|tema visual|paleta|colores|tipograf[íi]a)\b",
    r"\b(scroll|animaci[óo]n|transition|transici[óo]n)\b",
    r"\b(dashboard|panel|admin)\b",
    r"\b(crea (una|un) (web|landing|p[áa]gina|sitio))\b",
]

# Skills clave del protocolo visual-first y cuándo usar cada una.
SKILL_HINTS = """
Skills disponibles (úsalas, NO empieces a codear sin elegir):

  • pacame-web — META-skill. Construye CUALQUIER web (landing, SaaS, ecom, dashboard, marketplace).
    Detecta tipo, scaffolding, encadena sub-skills. Usar cuando Pablo pide cualquier pieza web.

  • frontend-design — Distintive UI premium. Evita "AI generic look" (Tailwind random + gradientes).
    Usar para componentes, secciones, layouts con carácter visual real.

  • imagen — Google Gemini. Genera imágenes/mockups/heros reales. NO usar SVG genérico ni placeholders.

  • theme-factory — Design tokens, paletas, tipografía. Usar para sistema visual nuevo.

  • brand-guidelines — Aplica branding consistente. Usar si proyecto branded.

  • react-view-transitions — Animaciones modernas (View Transitions API). Usar para flows ricos.

  • web-artifacts-builder — Multi-página interactivo. Usar para artifacts complejos.

  • canvas-design — Posters, arte estático con código. PNG/PDF.

  • algorithmic-art — p5.js para fondos generativos, art ambiental.
"""


REMINDER_TEMPLATE = """<system-reminder priority="high">
PROTOCOLO VISUAL-FIRST ACTIVADO (detectado intent frontend)

Antes de escribir CUALQUIER .tsx/.jsx/.css/.html o generar diseño:

1. Cargar y leer: docs/protocols/visual-first.md
2. Decidir qué skill del catálogo aplica (NO escribir HTML directo).
3. Si es web/landing/SaaS/dashboard → invocar pacame-web (meta-skill).
4. Si es componente/sección con carácter visual → invocar frontend-design.
5. Si necesitas imagen real (hero, mockup, ilustración) → invocar imagen.
6. Si es sistema visual/paleta/tokens → invocar theme-factory.
7. Antes de cerrar la tarea → invocar subagente visual-reviewer.

REGLA DURA: si la salida es .tsx/.jsx/.css y NO has invocado skill del catálogo,
estás haciendo frontend genérico ("AI generic look"). PARA y elige herramienta.

Anti-patrones que el visual-reviewer bloquea:
  - SVG inline genérico como placeholder
  - Gradientes Tailwind random sin paleta marca
  - via.placeholder.com / dummyimage.com
  - "Al estilo de Apple/Linear/Stripe" sin captura ref
  - HTML plano para landing nueva sin pasar por frontend-design
  - System-ui en proyecto branded
{skill_hints}
</system-reminder>"""


def matches_frontend_intent(prompt: str) -> bool:
    """True si el prompt contiene cualquier trigger frontend."""
    p = prompt.lower()
    for pattern in FRONTEND_TRIGGERS:
        if re.search(pattern, p, re.IGNORECASE):
            return True
    return False


def main() -> int:
    # Claude Code UserPromptSubmit pasa JSON por stdin con: {"prompt": "..."}
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            return 0
        data = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return 0

    prompt = data.get("prompt", "") or data.get("user_prompt", "") or ""
    if not prompt or not matches_frontend_intent(prompt):
        return 0

    reminder = REMINDER_TEMPLATE.format(skill_hints=SKILL_HINTS)
    print(reminder)
    return 0


if __name__ == "__main__":
    sys.exit(main())
