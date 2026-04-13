# PACAME — Agencia Digital de Agentes IA

## Proyecto
Agencia digital que resuelve problemas digitales para PYMEs en Espana. 10 agentes IA + 120 subespecialistas, supervisados por Pablo Calleja.

## Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS, Radix UI, Framer Motion
- **Backend:** Supabase (Postgres + RLS + Realtime), Stripe, Claude API
- **Infra:** VPS Hetzner (200.234.238.94), Docker, n8n, Nginx
- **Deployment:** Vercel (web), VPS (n8n + automations)

## Estructura del proyecto
```
web/               → Next.js app (frontend + API routes)
agents/            → Prompts completos de cada agente PACAME
agency-agents/     → 120+ subespecialistas (referencia)
workflows/         → SOPs en Markdown (WAT framework)
tools/             → Scripts Python para automatizaciones
infra/             → Scripts de despliegue y VPS
strategy/          → Roadmap, pricing, personas
.claude/skills/    → Skills con YAML frontmatter
.claude/agents/    → Subagentes con model routing
```

## Routing Rules (Progressive Disclosure)
- Branding/identidad visual → lee `agents/01-NOVA.md` y `.claude/skills/branding.md`
- SEO/contenido organico → lee `agents/02-ATLAS.md` y `.claude/skills/seo-audit.md`
- Ads/embudos/CRO → lee `agents/03-NEXUS.md` y `.claude/skills/ads-campaign.md`
- Frontend/web → lee `agents/04-PIXEL.md` y `.claude/skills/web-development.md`
- Backend/APIs/infra → lee `agents/05-CORE.md`
- Social media → lee `agents/06-PULSE.md` y `.claude/skills/social-media.md`
- Estrategia/pricing → lee `agents/07-SAGE.md` y `.claude/skills/client-proposal.md`
- Copywriting → lee `agents/08-COPY.md` y `.claude/skills/copywriting.md`
- Analytics → lee `agents/09-LENS.md` y `.claude/skills/analytics-report.md`
- Lead gen outbound → lee `workflows/lead-gen-pipeline.md`
- Orquestacion multi-agente → lee `agents/DIOS.md`
- Vibe coding/MVP rapido → lee `.claude/skills/vibe-coding.md`
- Figma a codigo → lee `.claude/skills/figma-to-code.md`
- Design system/tokens → lee `.claude/skills/design-system.md`
- Prototipos interactivos → lee `.claude/skills/interactive-prototyping.md`
- Exploracion visual/estetica → lee `.claude/skills/visual-design-exploration.md`
- Deploy/produccion → lee `.claude/skills/deploy-workflow.md`

## Coding Conventions
- TypeScript strict mode, no `any`
- Componentes React: functional, props tipados, composition pattern
- API routes: validar input, Supabase-first, error handling estructurado
- Secrets en `.env.local`, nunca en codigo
- Mobile-first CSS, Lighthouse 90+
- Commits en espanol, descriptivos

## Comunicacion
- Tutear siempre. Tono directo, cercano, sin humo.
- Frases cortas. Verbos activos. Numeros concretos.
- Cada respuesta cierra con proximo paso accionable.

## Contacto PACAME
- Web: pacameagencia.com | Email: hola@pacameagencia.com | WhatsApp: +34 722 669 381
