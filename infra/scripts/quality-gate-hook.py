#!/usr/bin/env python3
"""
quality-gate-hook.py — Hook UserPromptSubmit que detecta intent de creación
en 5 dominios (frontend, copy, video, branding, backend) y FUERZA la
carga del protocolo quality-gate antes de generar.

Razón: el modelo, por defecto, va a la salida más rápida y produce output
"AI genérico". El protocolo `docs/protocols/quality-gate.md` define las 3
capas obligatorias (skill curada + checklist + revisor crítico), pero el
modelo no lo carga si nadie lo fuerza.

Este hook:
1. Lee prompt vía stdin (formato Claude Code UserPromptSubmit).
2. Detecta dominio (frontend/copy/video/branding/backend) por regex.
3. Si match → emite system-reminder con la skill obligatoria + checklist
   + reminder del revisor crítico.
4. Si no match → silencio.

Uso (en .claude/settings.json):

  "UserPromptSubmit": [
    { "matcher": "*", "hooks": [
      { "type": "command", "command": "python infra/scripts/quality-gate-hook.py" }
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
# Detección de dominio: cada lista es ES + EN, un match basta.
# ---------------------------------------------------------------------------

DOMAIN_TRIGGERS: dict[str, list[str]] = {
    "frontend": [
        r"\b(landing|landings|landing page)\b",
        r"\b(homepage|home page|p[áa]gina principal)\b",
        r"\b(componente|componentes|component|components)\b",
        r"\b(maqueta|maquetar|mockup|mockups|wireframe)\b",
        r"\b(UI|UX|interfaz|interface)\b",
        r"\b(hero section|hero)\b",
        r"\b(web|website|sitio web|p[áa]gina web)\b",
        r"\b(react|next\.?js|tailwind|shadcn)\b",
        r"\b(frontend|front-?end)\b",
        r"\b(scroll|animaci[óo]n|transition|transici[óo]n)\b",
        r"\b(dashboard|panel|admin)\b",
        r"\b(crea (una|un) (web|landing|p[áa]gina|sitio))\b",
    ],
    "copy": [
        r"\b(copy|copywriting|texto|textos)\b",
        r"\b(escribe|redacta|redactar|writing)\b",
        r"\b(headline|hook|claim|slogan|tagline)\b",
        r"\b(naming|nombre de marca|brand name)\b",
        r"\b(post|caption|descripci[óo]n|bio)\b",
        r"\b(email (de venta|comercial|cold)|cold email)\b",
        r"\b(landing copy|texto landing)\b",
        r"\b(an[úu]ncio|ad|ads) (copy|text)\b",
    ],
    "video": [
        r"\b(reel|reels)\b",
        r"\b(video|v[íi]deo|videos)\b",
        r"\b(cinem[áa]tico|cinem[áa]tica|cinematic)\b",
        r"\b(short(s|-form)?|tiktok|short-?form)\b",
        r"\b(trailer|teaser|spot|ad video)\b",
        r"\b(seedance|veo|kling|runway|pika|cinema studio)\b",
        r"\b(dark[\s_-]?frames|darkframes)\b",
        r"\b(prompt video|video prompt)\b",
    ],
    "branding": [
        r"\b(branding|brand|marca)\b",
        r"\b(logo|logotipo|isotipo|imagotipo|wordmark)\b",
        r"\b(identidad|identity)\s+(visual|de marca|corporativa|brand)\b",
        r"\b(brand pack|brand guidelines|brand book|guia de estilo)\b",
        r"\b(paleta|palette|color system)\b",
        r"\b(tipograf[íi]a|typography|font system)\b",
        r"\b(design tokens|design system)\b",
        r"\b(moodboard|mood board)\b",
    ],
    "backend": [
        r"\b(api|endpoint|endpoints|route handler)\b",
        r"\b(supabase|postgres|sql)\b",
        r"\b(migraci[óo]n|migration|schema)\b",
        r"\b(webhook|webhooks)\b",
        r"\b(stripe|paypal) (integration|integraci[óo]n|webhook)\b",
        r"\b(backend|back-?end|servidor|server)\b",
        r"\b(crea (un|una) (api|endpoint|webhook|integraci[óo]n))\b",
        r"\b(database|base de datos|tabla)\b",
        r"\b(rls|row level security)\b",
    ],
}


# ---------------------------------------------------------------------------
# Reminder por dominio
# ---------------------------------------------------------------------------

REMINDERS: dict[str, str] = {
    "frontend": """
PROTOCOLO QUALITY GATE ACTIVADO — DOMINIO: FRONTEND

Antes de escribir CUALQUIER .tsx/.jsx/.css/.html/.svg:

CAPA 1 — Invoca skill curada PRIMERO:
  • pacame-web — meta-skill para web/landing/SaaS/dashboard/marketplace.
  • frontend-design — componentes con carácter visual real.
  • imagen — Google Gemini para mockups/heros (NO SVG genérico).
  • theme-factory — sistema de tokens/paleta.
  • brand-guidelines — branding existente del proyecto.

CAPA 2 — Checklist pre-entrega:
  □ Paleta del cliente o PACAME (NO from-blue-500 to-purple-600 random).
  □ Tipografía del brand pack (NO system-ui en branded).
  □ Imágenes generadas con imagen (NO SVG genérico, NO via.placeholder).
  □ Iconos Lucide/Radix consistentes.
  □ Mobile-first probado a 375px.
  □ Lighthouse 90+ esperable.

CAPA 3 — Antes de cerrar:
  → Invocar subagente visual-reviewer (.claude/agents/visual-reviewer.md).

REGLA DURA: si saco .tsx/.jsx sin invocar skill = output AI genérico = FALLO.
Protocolo completo: docs/protocols/quality-gate.md
""",
    "copy": """
PROTOCOLO QUALITY GATE ACTIVADO — DOMINIO: COPY

Antes de escribir cualquier texto persuasivo (claim, headline, post, email, ad):

CAPA 1 — Invoca skill curada PRIMERO:
  • copywriting — copy persuasivo principal.
  • copy-editing — refino y pulido.
  • content-humanizer — quitar tono AI.
  • marketing-psychology — palancas reales (escasez, prueba social, autoridad).

CAPA 2 — Checklist pre-entrega — PROHIBIDO usar:
  ✗ Palabras IA: desbloquea, embárcate, viaje, transformador, en última
    instancia, en el mundo actual, navegar, descubre el potencial.
  ✗ Fórmulas trilladas: "X no es solo Y, es Z", "imagina un futuro donde...".
  ✗ Adjetivos vacíos: increíble, asombroso, único, especial, perfecto.

  ✓ Frases cortas, verbos activos, números concretos.
  ✓ Tutea (alineado IDENTIDAD-PABLO.md).
  ✓ Hook real en primer beat (no introducción vaga).
  ✓ Cierra con CTA o próximo paso accionable.

CAPA 3 — Antes de cerrar:
  → Invocar subagente quality-reviewer con dominio=copy.

Protocolo completo: docs/protocols/quality-gate.md
""",
    "video": """
PROTOCOLO QUALITY GATE ACTIVADO — DOMINIO: VIDEO / CINEMÁTICO

Antes de generar reel, video, ad cinemático, trailer, short:

CAPA 1 — RESEARCH-FIRST OBLIGATORIO (regla dura):
  □ 5 datos reales de peli/juego/director referencia (lentes, LUT, ritmo,
    audio, estructura trailer 3-act).
  □ Sin research → BLOQUEA. NO generar prompts genéricos.
  □ Concept JSON requiere campo `research` con esos 5 datos.

CAPA 2 — Skill curada:
  • video-content-strategist — estrategia narrativa.
  • remotion — composición programática.
  • elevenlabs — voz en off.
  • ffmpeg — post-procesado.

CAPA 3 — Quality gate cinema (ya existente en tools/dark-frames):
  □ concept_id asignado y trackeado.
  □ cost-guard token validado.
  □ visual-reviewer pass.
  □ outro Dark Room presente.
  □ Caption con CTA real.

DOBLE APROBACIÓN PABLO si Veo/Seedance/Kling (regla dura por coste 1.20$/6s).
NO usar Veo 3.1 Lite como default cinemático (es batch, no SOTA).

Protocolo completo: docs/protocols/quality-gate.md
""",
    "branding": """
PROTOCOLO QUALITY GATE ACTIVADO — DOMINIO: BRANDING

Antes de entregar cualquier pieza de identidad visual (logo, paleta, sistema):

CAPA 1 — Invoca skill curada PRIMERO:
  • brand-guidelines — sistema completo branded.
  • theme-factory — tokens, escala, variables.
  • imagen — mockups de aplicación (no presentar logo solo).
  • ui-design-system — sistema visual extendido.
  • canvas-design — piezas estáticas branded (PNG/PDF).

CAPA 2 — Checklist pre-entrega:
  □ NO entregar solo logo. Sistema completo: paleta + tipografía + escala
    + tokens + 3-5 ejemplos de aplicación reales.
  □ Justificación racional: por qué estos colores, por qué esta tipo,
    por qué este nombre. Nada arbitrario.
  □ Variantes: claro/oscuro, primary/secondary, hover/active.
  □ Antifragilidad: funciona en blanco/negro, en favicon 16px, en print.

CAPA 3 — Antes de cerrar:
  → Invocar subagente quality-reviewer con dominio=branding.
  → Aplicar a un mockup real (web, IG, business card) para validar.

Protocolo completo: docs/protocols/quality-gate.md
""",
    "backend": """
PROTOCOLO QUALITY GATE ACTIVADO — DOMINIO: BACKEND

Antes de escribir API, endpoint, schema SQL, integración, webhook:

CAPA 1 — Invoca skill curada PRIMERO:
  • architecture-patterns — Clean/Hexagonal/DDD para sistemas complejos.
  • api-endpoint-generator — CRUD con validación y typing consistente.
  • database-schema-designer — schemas Postgres con índices y RLS.
  • senior-backend — APIs robustas con error handling.

CAPA 2 — Checklist pre-entrega:
  □ TypeScript strict mode, NO `any` (cero tolerancia).
  □ Validación de input en boundaries (Zod o manual explícito).
  □ Error handling estructurado (códigos HTTP correctos + mensajes útiles).
  □ RLS enabled si la tabla es sensible.
  □ Secrets en .env.local, nunca hardcoded.
  □ Test de smoke: `npx tsc --noEmit` + curl básico al endpoint.
  □ Observabilidad: log estructurado o recordLlmCall si llama LLM.
  □ Idempotencia donde aplique (webhooks, retries).

CAPA 3 — Antes de cerrar:
  → Invocar subagente Code_Reviewer (.claude/agents/Code_Reviewer.md).
  → Verificar contra OWASP top 10 si toca auth/input público.

Protocolo completo: docs/protocols/quality-gate.md
""",
}


WRAPPER = """<system-reminder priority="high">
{body}
</system-reminder>"""


def detect_domains(prompt: str) -> list[str]:
    """Devuelve lista de dominios que matchean (puede haber varios)."""
    p = prompt.lower()
    matched: list[str] = []
    for domain, patterns in DOMAIN_TRIGGERS.items():
        for pattern in patterns:
            if re.search(pattern, p, re.IGNORECASE):
                matched.append(domain)
                break
    return matched


def main() -> int:
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            return 0
        data = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return 0

    prompt = data.get("prompt", "") or data.get("user_prompt", "") or ""
    if not prompt:
        return 0

    domains = detect_domains(prompt)
    if not domains:
        return 0

    # Combinar reminders de TODOS los dominios matched (puede haber 2+)
    bodies = [REMINDERS[d].strip() for d in domains]
    combined = "\n\n---\n\n".join(bodies)
    print(WRAPPER.format(body=combined))
    return 0


if __name__ == "__main__":
    sys.exit(main())
