# PACAME — Agencia Digital de Agentes IA

> Agencia digital que resuelve problemas digitales para PYMEs en España.
> 10 agentes IA + 120 subespecialistas, supervisados por Pablo Calleja.
> Visión y obsesión actual: ver [`IDENTIDAD-PABLO.md`](IDENTIDAD-PABLO.md).

---

## 🚨 Protocolos OBLIGATORIOS (cargar antes de generar)

| Cuándo aplica | Protocolo |
|---------------|-----------|
| Antes de tocar cualquier `.tsx/.jsx/.css/.html/.svg/.png` o asset visual | [`docs/protocols/visual-first.md`](docs/protocols/visual-first.md) |
| Antes de responder a CUALQUIER petición creativa/estratégica | [`docs/protocols/cerebro-pacame.md`](docs/protocols/cerebro-pacame.md) |
| Para cualquier ejecución / deploy / config | [`docs/protocols/autonomia-total.md`](docs/protocols/autonomia-total.md) |
| Al cerrar un bloque de trabajo entregable | [`docs/protocols/pr-merge-automatico.md`](docs/protocols/pr-merge-automatico.md) |
| Para elegir qué agente/skill cargar | [`docs/protocols/routing-rules.md`](docs/protocols/routing-rules.md) |

> **Regla dura:** si saltas del input a generar sin cargar el protocolo aplicable, estás rompiendo el contrato PACAME. Para y vuelve aquí.

---

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS, Radix UI, Framer Motion.
- **Backend:** Supabase (Postgres + RLS + Realtime), Stripe, Claude API.
- **Infra:** VPS Hostinger KVM2 (`72.62.185.125`), 8GB RAM, 2 cores AMD EPYC, Docker, n8n, Nginx, Ollama + Gemma 4.
- **Deployment:** Vercel (web), VPS (n8n + Gemma 4 + automations).

## Estructura del repo

```
web/                   → Next.js app (frontend + API routes)
agents/                → Prompts completos de los 10 agentes PACAME
agency-agents/         → 120+ subespecialistas (referencia)
clients/               → Capa 2 — clientes B2B (royo, talleresjaula, ecomglobalbox, casa-marisol)
workflows/             → SOPs en Markdown (WAT framework)
strategy/              → Roadmap, pricing, personas, visual-toolkit
infra/                 → Scripts de despliegue y VPS
tools/                 → Scripts internos PACAME (incluye scripts/ con build-skills-index.mjs)
docs/                  → Protocolos, identidad, integraciones (cargados bajo demanda)
.claude/skills/        → 959 skills indexadas en INDEX.md (autogenerado)
.claude/agents/        → Subagentes con model routing (incluye visual-reviewer)
```

## Identidad y contacto

- **Pablo Calleja** (fundador): visión y estilo en [`IDENTIDAD-PABLO.md`](IDENTIDAD-PABLO.md).
- **Datos públicos PACAME:** [`docs/identity/contacto.md`](docs/identity/contacto.md).
- **Arquitectura 4 capas (PACAME / Clientes / SaaS propios / Personal Pablo):** [`strategy/arquitectura-3-capas.md`](strategy/arquitectura-3-capas.md).

## Coding conventions

- TypeScript strict mode, no `any`.
- Componentes React: functional, props tipados, composition pattern.
- API routes: validar input, Supabase-first, error handling estructurado.
- Secrets en `.env.local`, nunca en código.
- Mobile-first CSS, Lighthouse 90+.
- Commits en español, descriptivos.

## Comunicación con el usuario

- Tutear siempre.
- Tono directo, cercano, sin humo.
- Frases cortas. Verbos activos. Números concretos.
- Cada respuesta cierra con próximo paso accionable.

## Inventarios autogenerados

- **Skills disponibles:** [`.claude/skills/INDEX.md`](.claude/skills/INDEX.md) (regenerar con `node tools/scripts/build-skills-index.mjs`).
- **Visual toolkit completo:** [`strategy/visual-toolkit.md`](strategy/visual-toolkit.md).

## Clientes activos (Capa 2)

| Cliente | Carpeta | Estado |
|---------|---------|--------|
| Joyería Royo | [`clients/royo/`](clients/royo/) | Activo (mantenimiento + enrichment) |
| Talleres Jaula | [`clients/talleresjaula/`](clients/talleresjaula/) | Activo (PIVOT 2026-04-29 a Shopify) |
| Ecomglobalbox | [`clients/ecomglobalbox/`](clients/ecomglobalbox/) | Activo (Stripe+Lauth, Laravel 12) |
| Casa Marisol | [`clients/casa-marisol/`](clients/casa-marisol/) | Test E2E Factoría completado |

> Convención de carpeta cliente: ver [`clients/README.md`](clients/README.md).
