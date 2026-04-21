# PACAME — Agencia Digital de Agentes IA

## Proyecto
Agencia digital que resuelve problemas digitales para PYMEs en Espana. 10 agentes IA + 120 subespecialistas, supervisados por Pablo Calleja.

## ⚠️ PROTOCOLO VISUAL-FIRST (OBLIGATORIO)

**Antes de escribir/editar cualquier archivo .tsx, .jsx, .css, .html, .svg, .png, o generar cualquier diseño/imagen/asset visual, EJECUTAR este checklist:**

1. **¿Necesito imagen/foto/mockup?** → Invocar skill `imagen` (Google Gemini). NUNCA usar `<svg>` genérico, placeholders, ni "al estilo de" sin imagen real.
2. **¿Es UI nueva o rediseño?** → Invocar skill `frontend-design` para carácter visual distintivo. NO escribir HTML a pelo con gradientes Tailwind genéricos.
3. **¿Existe diseño Figma de referencia?** → MCP `mcp__Figma__get_design_context` + `get_screenshot` antes de codear.
4. **¿Necesito design tokens/paleta?** → Skill `ui-designer` (desde captura) o `theme-factory` (para artefactos).
5. **¿Requiere interacción rica (scroll, reveals, transitions)?** → Framer Motion + skill `react-view-transitions`.
6. **¿Arte ambiental / generativo / fondos?** → Skill `algorithmic-art` (p5.js) o `canvas-design`.
7. **¿Experiencia multi-página interactiva?** → Skill `web-artifacts-builder`.
8. **¿Video/voz?** → Skill `remotion` / `ffmpeg` (video), `elevenlabs` (voz).
9. **¿Dashboard de datos?** → Skill `data:build-dashboard` + `d3-viz`.
10. **Antes de dar por terminado**: invocar subagente `visual-reviewer` (`.claude/agents/visual-reviewer.md`) que bloquea diseño genérico.

**Inventario completo con árbol de decisión**: `strategy/visual-toolkit.md`.

**Regla dura**: si la tarea es visual y no estoy invocando un skill/MCP de la lista, estoy fallando. Parar y elegir la herramienta correcta antes de codear.

---

## 🧠 PROTOCOLO CEREBRO PACAME (OBLIGATORIO, precede a cualquier generación)

**Antes de responder a CUALQUIER petición creativa/estratégica (web, post, ads, copy, branding, propuesta, diseño, guión, estrategia, dashboard, sql, carrusel, etc.) EJECUTAR este checklist sin excepción. Omitir pasos = respuesta genérica = fallar.**

0. **LEE `IDENTIDAD-PABLO.md` si no lo has leído en esta sesión.** Ahí están su visión (PACAME = mayores startups IA del mundo), obsesión activa (entidad IA socio con superpoderes), pricing (variable + suscripción/ofertas, estilo Hormozi), estilo (REALISMO BRUTAL, cero humo), directivas (nivel Uber/máximo, sin límites de sector). Cada output debe respetarlo. Si dudas de qué pensaría Pablo, consulta ese fichero o el cerebro vía `/api/neural/query`.

1. **Identifica el agente PACAME** según las palabras clave del input. Tabla rápida:
   - `web`, `landing`, `hero`, `componente`, `formulario`, `frontend`, `React`, `Next.js`, `UI` → **PIXEL** (`agents/04-PIXEL.md`)
   - `carrusel`, `post`, `story`, `reel`, `Instagram`, `TikTok`, `social` → **PULSE** (`agents/06-PULSE.md`)
   - `logo`, `identidad`, `paleta`, `tipografía`, `banner`, `mockup`, `brand` → **NOVA** (`agents/01-NOVA.md`)
   - `ads`, `campaña`, `funnel`, `CRO`, `lead-magnet`, `Meta Ads`, `Google Ads`, `ROAS` → **NEXUS** (`agents/03-NEXUS.md`)
   - `SEO`, `blog`, `artículo`, `keyword`, `orgánico`, `meta-description`, `sitemap` → **ATLAS** (`agents/02-ATLAS.md`)
   - `copy`, `hook`, `subject`, `guión`, `email`, `titular`, `CTA`, `newsletter` → **COPY** (`agents/08-COPY.md`)
   - `propuesta`, `presupuesto`, `cliente nuevo`, `cotización`, `pricing`, `estrategia`, `pivot` → **SAGE** (`agents/07-SAGE.md`)
   - `dashboard`, `métrica`, `KPI`, `GA4`, `reporte`, `cohort`, `LTV`, `CAC`, `churn` → **LENS** (`agents/09-LENS.md`)
   - `API`, `Supabase`, `migration`, `deploy`, `infra`, `webhook`, `cron`, `VPS`, `n8n`, `edge-function` → **CORE** (`agents/05-CORE.md`)
   - Multi-agente / orquestación / no sabes → **DIOS** (`agents/DIOS.md` o `agents/00-DIOS.md`)

2. **LEE el `.md` completo** del agente identificado (no el resumen — el archivo completo) para cargar su persona, tono, competencias, ejemplos.

3. **Carga los skills relevantes**. Tabla por tipo de tarea:
   - Branding → skill `branding`, `design-system`, `ui-designer`
   - Web/frontend → skill `web-development`, `frontend-design`, `figma-to-code`, `theme-factory`, `visual-design-exploration`
   - Carrusel/post → skill `social-media`, `ad-creative`, `infographics`, `canvas-design`
   - Ads/CRO → skill `ads-campaign`, `landing-page-generator`, `paid-ads`
   - Copy → skill `copywriting`, `marketing-psychology`, `cold-email`
   - Propuesta → skill `client-proposal`, `contract-and-proposal-writer`
   - SEO → skill `seo-audit`, `programmatic-seo`, `content-strategy`
   - Dashboard → skill `analytics-report`, `d3-viz`, `data:build-dashboard`
   - Deploy → skill `deploy-workflow`, `docker-deployment`
   - Si dudas → ejecuta `SELECT label FROM knowledge_nodes WHERE node_type='skill' ORDER BY embedding <=> '<query-embed>' LIMIT 5;` vía `/api/neural/query`.

4. **Carga brand/tone PACAME** (mandatorio si output público): tono directo, cercano, sin humo, tutear siempre, frases cortas, verbos activos, números concretos, cierre con próximo paso accionable. Contacto: `hola@pacameagencia.com` | WhatsApp `+34 722 669 381`.

5. **Usa MCPs específicos cuando aplique**:
   - Visual → `mcp__Figma__*`, `mcp__Canva__*`, `mcp__Claude_in_Chrome__*` (referencia competencia)
   - Data → `mcp__3c7cb4c1-c1c5-4ce8-88c3-fea3adbdfcf1__execute_sql` (Supabase)
   - Imagen → skill `imagen` (Gemini) + `mcp__e1c45596-*` (Canva)
   - Voz → skill `elevenlabs` + MCP ElevenLabs
   - Pagos → `mcp__78d1b60c-*` (Stripe)
   - Leads/prospecting → `mcp__Vibe_Prospecting__*`

6. **Usa el mejor modelo disponible para la tarea**:
   - Creatividad / decisión crítica → Claude Sonnet 4.6 o Opus 4.7 (`tier: titan/premium`)
   - Volumen / outreach → DeepSeek-V3.2 671B (`tier: standard`)
   - Clasificación / parse → Gemma 4 e2b VPS (`tier: economy`, gratis)
   - Vía `llmChat()` de `web/lib/llm.ts`.

7. **Registra aprendizaje** (vía endpoints existentes):
   - Intercambio útil → `POST /api/neural/execute` con `store_memory:true`
   - Pattern nuevo → `recordDiscovery()` en la respuesta o línea `DISCOVERY: …` al final del output
   - Delegación exitosa → `fireSynapse('dios','<agent>','delegates_to',true)`

8. **NUNCA output genérico**. Si falta contexto crítico (industria, cliente, briefing, assets), **pregunta 2-3 datos al usuario** antes de generar. Pedir brief bien hecho > generar relleno.

**Regla dura**: si saltas del input a la generación sin pasar por los 8 pasos, estás rompiendo el contrato PACAME. Parar y releer este bloque.

---

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
