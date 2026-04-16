# PACAME — Agencia Digital de Agentes IA

## Proyecto
Agencia digital que resuelve problemas digitales para PYMEs en Espana. 10 agentes IA + 120 subespecialistas, supervisados por Pablo Calleja.

## Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS, Radix UI, Framer Motion
- **Backend:** Supabase (Postgres + RLS + Realtime), Stripe, Claude API
- **Infra:** VPS Hostinger KVM2 (72.62.185.125), 8GB RAM, 2 cores AMD EPYC, Docker, n8n, Nginx, Ollama + Gemma 4
- **Deployment:** Vercel (web), VPS (n8n + Gemma 4 + automations)

## Estructura del proyecto
```
web/               → Next.js app (frontend + API routes)
agents/            → Prompts completos de cada agente PACAME
agency-agents/     → 120+ subespecialistas (referencia)
workflows/         → SOPs en Markdown (WAT framework)
tools/             → Scripts Python para automatizaciones
infra/             → Scripts de despliegue y VPS
strategy/          → Roadmap, pricing, personas
.claude/skills/    → 346+ skills instalados (custom .md + carpetas descargadas)
.claude/agents/    → Subagentes con model routing
```

## Routing Rules (Progressive Disclosure)

### Agentes PACAME + Skills custom
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
- Vibe coding/MVP rapido → usa skill `vibe-coding` (`.claude/skills/vibe-coding.md`)
- Figma a codigo → usa skill `figma-to-code` (`.claude/skills/figma-to-code.md`)
- Design system/tokens → usa skill `design-system` (`.claude/skills/design-system.md`)
- Prototipos interactivos → usa skill `interactive-prototyping`
- Exploracion visual/estetica → usa skill `visual-design-exploration`
- Deploy/produccion → usa skill `deploy-workflow` (`.claude/skills/deploy-workflow.md`)

### Estrategia y decision ejecutiva
- Consejo de administracion virtual / decision estrategica → skill `c-level-advisor`
- Decision irreversible (pivot, despido, cambio de modelo) → skill `hard-call`
- Antes de cualquier implementacion creativa → skill `brainstorming` (OBLIGATORIO)
- Segunda opinion sobre arquitectura o decision critica → skill `second-opinion`
- Post-mortem de proyecto o incidencia → skill `postmortem`

### Investigacion y analisis de mercado
- Investigacion profunda (mercado, competencia, tendencias) → skill `deep-research`
- Informe de mercado 50+ paginas estilo consultora → skill `market-research-reports`
- Auditoria de producto / UX / arquitectura → skill `product-analysis`
- Analisis financiero, valoracion, forecasting → skill `finance-skills`

### Marketing digital avanzado (42 sub-skills)
- Estrategia de marketing completa (contenido, SEO, CRO, canales, growth) → skill `marketing-skills`
- Crecimiento empresarial, ventas, customer success, RFPs → skill `business-growth-skills`

### Gestion de producto
- Priorización RICE, OKRs, agile, UX research → skill `product-skills`

### Comunicacion interna y con clientes
- Updates 3P, newsletters, FAQs, informes de incidencia → skill `internal-comms`
- Redaccion tecnica avanzada, articulos, guias → skill `writing-skills`
- Infografias profesionales para clientes o RRSS → skill `infographics`

### Visualizacion de datos / dashboards
- Dashboards interactivos, KPIs, graficos D3 → skill `d3-viz`

### Diseno UI/UX
- Extraer design system de capturas y generar prompts de UI → skill `ui-designer`
- Revision de UI contra Web Interface Guidelines / accesibilidad → skill `web-design-guidelines`

### Planificacion y ejecucion de proyectos
- Plan de implementacion con tareas detalladas → skill `writing-plans`
- Planificacion con ficheros (task_plan.md, findings.md) → skill `planning-with-files`
- Ejecutar plan paso a paso con checkpoints → skill `executing-plans`

### Orquestacion de agentes paralelos
- 2+ tareas independientes en paralelo → skill `dispatching-parallel-agents`
- Implementar plan con subagentes + revision en 2 fases → skill `subagent-driven-development`
- Lanzar N subagentes en worktrees aislados → skill `spawn`
- Fusionar rama ganadora y limpiar → skill `merge`

### Desarrollo autonomo MVP
- PRD → producto desplegado sin supervision → skill `loki-mode`

### Testing y QA (Playwright)
- Setup infraestructura de tests → skill `init`
- Generar tests desde historias de usuario → skill `generate`
- Diagnosticar y arreglar tests fallidos/flaky → skill `fix`
- Migrar Cypress/Selenium a Playwright → skill `migrate`
- Automatizacion browser / scraping / forms → skill `agent-browser`

### Meta: factory de skills y optimizacion
- Crear o mejorar un skill desde cero → skill `skill-creator`
- Disenar workflow-skills con fases y decision trees → skill `designing-workflow-skills`
- Optimizar un prompt con metodologia EARS → skill `prompt-optimizer`
- Extraer patron probado como skill reutilizable → skill `extract`
- Promover aprendizajes de memoria a reglas CLAUDE.md → skill `promote`

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
