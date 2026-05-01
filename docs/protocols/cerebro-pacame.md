# 🧠 PROTOCOLO CEREBRO PACAME (OBLIGATORIO, precede a cualquier generación)

> Cargar antes de responder a CUALQUIER petición creativa/estratégica (web, post, ads, copy, branding, propuesta, diseño, guión, estrategia, dashboard, sql, carrusel, etc.).
>
> **Omitir pasos = respuesta genérica = fallar el contrato PACAME.**

---

## Paso 0 · Identidad de Pablo

**LEE [`IDENTIDAD-PABLO.md`](../../IDENTIDAD-PABLO.md) si no lo has leído en esta sesión.**

Ahí están:
- Visión: PACAME = mayores startups IA del mundo.
- Obsesión activa: entidad IA socio con superpoderes.
- Pricing: variable + suscripción/ofertas, estilo Hormozi.
- Estilo: REALISMO BRUTAL, cero humo.
- Directivas: nivel Uber/máximo, sin límites de sector.

Cada output debe respetarlo. Si dudas de qué pensaría Pablo, consulta el fichero o el cerebro vía `/api/neural/query`.

---

## Paso 1 · Identifica el agente PACAME

Tabla rápida por palabras clave del input:

| Keywords | Agente | Archivo |
|----------|--------|---------|
| `web`, `landing`, `hero`, `componente`, `formulario`, `frontend`, `React`, `Next.js`, `UI` | **PIXEL** | [`agents/04-PIXEL.md`](../../agents/04-PIXEL.md) |
| `carrusel`, `post`, `story`, `reel`, `Instagram`, `TikTok`, `social` | **PULSE** | [`agents/06-PULSE.md`](../../agents/06-PULSE.md) |
| `logo`, `identidad`, `paleta`, `tipografía`, `banner`, `mockup`, `brand` | **NOVA** | [`agents/01-NOVA.md`](../../agents/01-NOVA.md) |
| `ads`, `campaña`, `funnel`, `CRO`, `lead-magnet`, `Meta Ads`, `Google Ads`, `ROAS` | **NEXUS** | [`agents/03-NEXUS.md`](../../agents/03-NEXUS.md) |
| `SEO`, `blog`, `artículo`, `keyword`, `orgánico`, `meta-description`, `sitemap` | **ATLAS** | [`agents/02-ATLAS.md`](../../agents/02-ATLAS.md) |
| `copy`, `hook`, `subject`, `guión`, `email`, `titular`, `CTA`, `newsletter` | **COPY** | [`agents/08-COPY.md`](../../agents/08-COPY.md) |
| `propuesta`, `presupuesto`, `cliente nuevo`, `cotización`, `pricing`, `estrategia`, `pivot` | **SAGE** | [`agents/07-SAGE.md`](../../agents/07-SAGE.md) |
| `dashboard`, `métrica`, `KPI`, `GA4`, `reporte`, `cohort`, `LTV`, `CAC`, `churn` | **LENS** | [`agents/09-LENS.md`](../../agents/09-LENS.md) |
| `API`, `Supabase`, `migration`, `deploy`, `infra`, `webhook`, `cron`, `VPS`, `n8n` | **CORE** | [`agents/05-CORE.md`](../../agents/05-CORE.md) |
| Multi-agente / orquestación / no sabes | **DIOS** | [`agents/DIOS.md`](../../agents/DIOS.md) |

## Paso 2 · LEE el `.md` completo del agente identificado

No el resumen — el archivo completo. Cargar persona, tono, competencias, ejemplos.

## Paso 3 · Carga los skills relevantes

| Tipo de tarea | Skills a cargar |
|---------------|-----------------|
| Branding | `branding`, `design-system`, `ui-designer` |
| Web/frontend | `web-development`, `frontend-design`, `figma-to-code`, `theme-factory`, `visual-design-exploration` |
| Carrusel/post | `social-media`, `ad-creative`, `infographics`, `canvas-design` |
| Ads/CRO | `ads-campaign`, `landing-page-generator`, `paid-ads` |
| Copy | `copywriting`, `marketing-psychology`, `cold-email` |
| Propuesta | `client-proposal`, `contract-and-proposal-writer` |
| SEO | `seo-audit`, `programmatic-seo`, `content-strategy` |
| Dashboard | `analytics-report`, `d3-viz`, `data:build-dashboard` |
| Deploy | `deploy-workflow`, `docker-deployment` |

> Si dudas → ejecuta `SELECT label FROM knowledge_nodes WHERE node_type='skill' ORDER BY embedding <=> '<query-embed>' LIMIT 5;` vía `/api/neural/query`. O consulta [`.claude/skills/INDEX.md`](../../.claude/skills/INDEX.md) (autogenerado, 959 skills).

## Paso 4 · Carga brand/tone PACAME

Mandatorio si output público:
- Tono: directo, cercano, sin humo.
- Tutear siempre.
- Frases cortas. Verbos activos.
- Números concretos.
- Cierre con próximo paso accionable.
- Contacto: `hola@pacameagencia.com` | WhatsApp `+34 722 669 381`.

## Paso 5 · Usa MCPs específicos cuando aplique

| Caso | MCP |
|------|-----|
| Visual | `mcp__Figma__*`, `mcp__Canva__*`, `mcp__Claude_in_Chrome__*` |
| Data | `mcp__3c7cb4c1-c1c5-4ce8-88c3-fea3adbdfcf1__execute_sql` (Supabase) |
| Imagen | skill `imagen` (Gemini) + `mcp__e1c45596-*` (Canva) |
| Voz | skill `elevenlabs` + MCP ElevenLabs |
| Pagos | `mcp__78d1b60c-*` (Stripe) |
| Leads | `mcp__Vibe_Prospecting__*` |

## Paso 6 · Usa el mejor modelo para la tarea

| Tarea | Modelo | Tier |
|-------|--------|------|
| Creatividad / decisión crítica | Claude Sonnet 4.6 / Opus 4.7 | titan/premium |
| Volumen / outreach | DeepSeek-V3.2 671B | standard |
| Clasificación / parse | Gemma 4 e2b VPS | economy (gratis) |

Vía `llmChat()` de [`web/lib/llm.ts`](../../web/lib/llm.ts).

## Paso 7 · Registra aprendizaje

- Intercambio útil → `POST /api/neural/execute` con `store_memory:true`.
- Pattern nuevo → `recordDiscovery()` en la respuesta o línea `DISCOVERY: …` al final del output.
- Delegación exitosa → `fireSynapse('dios','<agent>','delegates_to',true)`.

## Paso 8 · NUNCA output genérico

Si falta contexto crítico (industria, cliente, briefing, assets), **pregunta 2-3 datos al usuario** antes de generar. Pedir brief bien hecho > generar relleno.

---

## Regla dura

> Si saltas del input a la generación sin pasar por los 8 pasos, estás rompiendo el contrato PACAME. Parar y releer este protocolo.
