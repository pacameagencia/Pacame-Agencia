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
.claude/skills/    → 374 skills del proyecto + 424 globales (798 totales)
.claude/agents/    → Subagentes con model routing
```

## Routing Rules (Progressive Disclosure)

### Agentes PACAME + Skills custom
- **Crear CUALQUIER web (landing, portfolio, ecommerce, blog, SaaS, editor tipo Canva, dashboard, marketplace) → usa skill `pacame-web` (`.claude/skills/pacame-web/SKILL.md`) ← META-ORQUESTADOR POR DEFECTO**
- **Crear fotos/carruseles/reels virales inspirados en IG (no genéricos) → usa skill `pacame-viral-visuals` (`.claude/skills/pacame-viral-visuals/SKILL.md`) ← OBLIGATORIO antes de imagen/qwen/remotion**
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

### dotskills (vincentkoc, AGPL-3.0)
- Limpiar diff de ruido IA antes de PR → skill `dotskills/technical-deslop`
- Generar docs tecnicas dev-ready → skill `dotskills/technical-documentation`
- Disenar integraciones vendor-agnostic con rollout → skill `dotskills/technical-integrations`
- Detectar patrones repetidos en logs y proponer nuevos skills → skill `dotskills/technical-skill-finder`

### Tooling CLI
- tokenjuice (npm global): compactador de output ruidoso (git, pnpm, docker, rg) para ahorrar tokens en Claude Code. Instalado globalmente, integracion con Claude Code via `tokenjuice install claude-code` si se activa.

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

## Modo de ejecucion (autonomia total)

**Regla maestra:** Ejecuta TU MISMO todo lo que el entorno permita. Pedir a Pablo que haga algo manualmente es el ULTIMO recurso, solo cuando no exista forma programatica.

**Capacidades activas en este proyecto (uselas antes de delegar):**
- Bash + Vercel CLI (`vercel deploy`, `vercel env add`, `vercel env pull`, `vercel link`)
- GitHub CLI (`gh pr create`, `gh pr merge`, `gh release create`, `gh secret set`)
- Supabase MCP (migraciones, SQL, edge functions, branches, advisors)
- Cloudflare MCP (D1, KV, R2, Workers, Hyperdrive)
- Hostinger API para DNS y dominios — key en memoria `reference_apis_pacame`
- SSH al VPS Hostinger 72.62.185.125 (n8n, Gemma 4, Ollama, Nginx)
- npm scripts (`dev`, `build`, `test`, `lint`) y git completo (commit, push, merge)
- Scripts del repo: `infra/scripts/apply-migration.py`, generadores de la Factoria

**Ejecuta SIN preguntar:**
- Commits, push a ramas feature, abrir/mergear PRs
- `npm run dev/build/test`, deploys a Vercel preview Y produccion
- `vercel env add/rm` en cualquier entorno (development, preview, production)
- Aplicar migraciones a Supabase via script o MCP
- Configurar webhooks, rotar tokens, conectar repos a Vercel
- Crear/editar archivos, instalar/actualizar dependencias
- Lanzar workflows n8n, scripts Python, cron jobs

**Pausa y confirma SOLO en estos 3 casos irreversibles:**
1. **Pagos reales con dinero** — `stripe charge`, transferencias, compra de creditos en APIs externas
2. **Borrado masivo en produccion** — `DROP TABLE`, `DELETE` sin WHERE, vaciar buckets, `rm -rf` sobre datos
3. **Push --force a main** o cualquier reescritura de historia compartida

**Si falta una credencial que Pablo aun NO te ha dado:** intenta primero todas las alternativas (otra API equivalente, workaround, schema adaptado). Si realmente no hay opcion, escala con el comando exacto listo para ejecutar en cuanto te la pase — no le pidas que ejecute el comando el mismo.

**Anti-patron prohibido:** Frases como "ahora ejecuta tu `npm run build`", "añade esta env var en Vercel", "lanza este SQL en Supabase", "haz push tu" son una violacion de esta regla. Hazlo tu primero. Si tres intentos fallan, escala con error exacto.

## Inteligencia neural (cerebro PACAME activo)

Extension de la regla de autonomia: para que las acciones autonomas sean **inteligentes**, no solo rapidas, usa la red neuronal PACAME. La DB Supabase + el vault `PacameCueva/` son memoria viva del proyecto — consulta antes de actuar y registra despues.

**Recursos disponibles (uselos antes de improvisar):**
- **Vault Obsidian `PacameCueva/`** — 10 carpetas (00-Dios, 01-Agentes, 02-Subespecialistas, 03-Skills, 04-Workflows, 05-Strategy, 06-Clientes, 07-Sinapsis, 08-Memorias/<AGENTE>, 09-Discoveries) + `_dashboards` + `_templates`. Sync vault↔Supabase via Watcher Windows + cron VPS cada 5min.
- **MCP `pacame-vault`** registrado en `.claude/mcp.json` (Obsidian Local REST API HTTPS:27124) — leer/escribir notas del vault programaticamente.
- **18 endpoints `web/app/api/neural/*`**: `topology`, `route`, `query` (busqueda semantica pgvector HNSW sobre 996+ knowledge_nodes), `fire`, `decay`, `execute`, `auto-discovery`, `opportunity-scanner`, `learn`, `tools`, `tool-gap`, `draft-tool`, `invoke-tool`, `promote-tools`, `factoria-metrics`, `factoria-package`, `factoria-products`, `factoria-stats`.
- **Skill `auto-brain`** (`.claude/skills/auto-brain/SKILL.md`) — protocolo de 9 pasos que routea input → agente PACAME (DIOS/SAGE/ATLAS/NEXUS/PIXEL/CORE/PULSE/NOVA/COPY/LENS) + carga skills + brand + MCPs.
- **Slash commands neurales**: `/cerebro <tarea>`, `/discover <agente> <tipo> <titulo> | <desc>`, `/synapse <from> <to> [tipo] [success]`, `/remember <agente> <titulo> | <contenido>`, `/neural-report [agente]`, `/brain-sync`.
- **Crons activos**: `neural-decay` 3am UTC, `auto-discovery` 5am UTC (Vercel), pull vault VPS `*/5 * * * *`.

**Workflow de tarea no trivial:**
1. **Antes de empezar:** invoca `/cerebro <tarea>` (carga top-3 memorias + sinapsis fuertes + discoveries recientes del agente) **o** `POST /api/neural/query {"query":"<tarea>","type":"skill","count":3}` para busqueda semantica directa. Si la tarea es creativa/estrategica, el skill `auto-brain` ya activa esto por keyword.
2. **Durante:** lee notas existentes en `PacameCueva/` antes de inventar. Reutiliza patrones de `07-Sinapsis/`, soluciones de `09-Discoveries/`, prompts de `01-Agentes/`. Modulo Factoria tiene endpoints listos (`factoria-package`, `factoria-products`) — uselos antes de generar a mano.
3. **Si dos agentes colaboran** (ej: NOVA + PIXEL en una landing): `/synapse nova pixel collaborates_with true` refuerza la sinapsis (+0.02 hebbiano).
4. **Si descubres algo no obvio** (workaround, patron repetido, oportunidad de servicio, anomalia): `/discover <agente> <tipo: trend|service_idea|technique|optimization|pattern|...> <titulo> | <desc>`. Crea entrada en `09-Discoveries/` tras siguiente pull.
5. **Al cerrar:** `/remember <agente> <titulo> | <contenido>` para persistir el aprendizaje en `agent_memories` (decay semanal aplica). Memoria episodic por defecto, `PATRON:` → procedural, `HECHO:` → semantic.

**Routing por agente (auto-brain mapping):**
- web/landing/UI/React/Next → **PIXEL** | logo/identidad/brand → **NOVA** | SEO/blog/keyword → **ATLAS** | ads/funnel/CRO → **NEXUS** | API/Supabase/deploy/VPS/n8n → **CORE** | carrusel/Instagram/social → **PULSE** | propuesta/pricing/OKR → **SAGE** | copy/hook/email → **COPY** | dashboard/KPI/GA4 → **LENS** | multi-agente/ambiguo → **DIOS**.

**Workflows end-to-end ya operativos (no reimplementar):**
- **Factoria Hosteleria** (FASES A-G shipped): `dashboard/factoria` UI → SAGE auto-empaquetado → materializador (`/api/factoria/package`) → deploy automatizado (`/api/factoria/deploy` con Vercel + Vapi + n8n) → activate-n8n con creds cliente + connect-git Vercel. Casa Marisol shipped 3/3.
- **Lead-gen outbound:** Apify Google Maps → `/api/leads/scan` → Vapi calls (+34 604 190 129 via Twilio) + Telegram notifs.
- **Generacion contenido:** `pacame-viral-visuals` skill (Apify IG + Freepik + Gemini + Nebius) — OBLIGATORIO antes de imagen/qwen/remotion.

**Si el cerebro detecta algo critico** (sinapsis en decay severo, memorias huerfanas, oportunidad alta confidence en `agent_discoveries.actionable=true`): no esperes a que Pablo lo pida — registralo, propon accion, y si entra en autonomia total → ejecutala.

**Anti-patron neural:** generar contenido/codigo "desde cero" cuando el vault ya tiene un patron, una sinapsis ya prueba que dos agentes colaboran bien, o un discovery anterior resuelve el caso. Consulta primero, crea despues.

## Contacto PACAME
- Web: pacameagencia.com | Email: hola@pacameagencia.com | WhatsApp: +34 722 669 381
