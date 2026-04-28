---
description: Convierte una idea/petición en un brief estructurado antes de ejecutar. Identifica agente líder + soporte, carga skills correctas, consulta cerebro PACAME. NO ejecuta hasta aprobación de Pablo.
argument-hint: "<idea/petición libre> [#capa1|2|3|4] [#urgencia:hoy|sprint|mes|reflexion]"
---

PEDIR — Skill maestra de intake PACAME.

Soluciona el cuello de botella histórico: "no sé pedir bien las cosas a los agentes". Convierte una idea de Pablo en un brief estructurado que cualquier agente del equipo puede ejecutar al máximo.

**Regla dura**: si Pablo dispara cualquier petición creativa/estratégica/técnica, esto se invoca ANTES de tocar nada. Saltarse el intake = romper el protocolo PACAME y producir output genérico.

---

## Pasos

### 1. Parsear input

- `$1` = idea/petición libre (puede tener varios párrafos).
- Tags opcionales detectados con regex: `#capa1` `#capa2` `#capa3` `#capa4`, `#urgencia:hoy` `#urgencia:sprint` `#urgencia:mes` `#urgencia:reflexion`, `#cliente:<slug>`.

### 2. Detectar info crítica faltante

Si faltan ≥ 2 de estos datos, pregunta vía `AskUserQuestion` (mínimas, no abrumes):

- **Objetivo de negocio**: qué problema resuelve, qué métrica mejora.
- **Capa PACAME** (1-4) si no detectada por keywords.
- **Urgencia**.
- **Cliente / proyecto específico** (si aplica).
- **Restricciones** (presupuesto, marca, legal, técnicas).
- **Referencias visuales** (si tarea visual).

Si Pablo trae info clara, salta este paso y avanza.

### 3. Identificar agente líder (matriz de routing)

Usa keywords del input contra esta matriz (idéntica a `CLAUDE.md` y `agents/DIOS.md`):

| Keywords | Líder |
|---|---|
| web, landing, hero, componente, formulario, frontend, React, Next.js, UI | **PIXEL** |
| carrusel, post, story, reel, Instagram, TikTok, social | **PULSE** |
| logo, identidad, paleta, tipografía, banner, mockup, brand | **NOVA** |
| ads, campaña, funnel, CRO, lead-magnet, Meta Ads, Google Ads, ROAS | **NEXUS** |
| SEO, blog, artículo, keyword, orgánico, meta-description, sitemap | **ATLAS** |
| copy, hook, subject, guión, email, titular, CTA, newsletter | **COPY** |
| propuesta, presupuesto, cliente nuevo, cotización, pricing, estrategia, pivot | **SAGE** |
| dashboard, métrica, KPI, GA4, reporte, cohort, LTV, CAC, churn | **LENS** |
| API, Supabase, migration, deploy, infra, webhook, cron, VPS, n8n, edge-function | **CORE** |
| multi-agente, no claro, orquestación | **DIOS** |

### 4. Asignar agentes soporte (1-3 máx)

Reglas de combinación:

- Web → Pixel + Nova + Atlas (+ Core si backend)
- Ads → Nexus + Pixel (landing) + Copy (hooks) + Sage (oferta)
- Carrusel/post → Pulse + Nova + Copy
- Branding → Nova + Sage + Pulse
- SaaS / app → Core + Pixel + Sage
- Estrategia / propuesta → Sage + Lens (datos) + COPY (formato)
- SEO → Atlas + Pixel (impl) + Sage (priorización)

### 5. Cargar skills relevantes (de los 944 disponibles, top 3-5 por tarea)

| Tipo de tarea | Skills a invocar |
|---|---|
| Branding | `branding`, `design-system`, `ui-designer`, `frontend-design`, `theme-factory` |
| Web/frontend | `web-development`, `frontend-design`, `figma-to-code`, `theme-factory`, `imagen` (Gemini), `react-best-practices` |
| Carrusel/post | `social-media`, `ad-creative`, `infographics`, `canvas-design`, `pacame-viral-visuals` |
| Ads/CRO | `ads-campaign`, `landing-page-generator`, `paid-ads`, `ab-test-setup`, `page-cro` |
| Copy | `copywriting`, `marketing-psychology`, `cold-email`, `content-humanizer` |
| Propuesta/pricing | `client-proposal`, `contract-and-proposal-writer`, `c-level-advisor`, `pricing-strategy` |
| SEO | `seo-audit`, `programmatic-seo`, `content-strategy`, `schema-markup` |
| Dashboard | `analytics-report`, `d3-viz`, `data:build-dashboard`, `csv-data-summarizer` |
| Backend/deploy | `deploy-workflow`, `docker-deployment`, `database-designer`, `api-endpoint-generator` |
| Estrategia | `c-level-advisor`, `brainstorming`, `second-opinion`, `hard-call`, `deep-research` |

**Si tarea visual** (toca `.tsx`/`.jsx`/`.css`/`.svg`): AÑADIR siempre `imagen`, `frontend-design`, `theme-factory` antes de codear. NO ES NEGOCIABLE — está en CLAUDE.md como protocolo VISUAL-FIRST.

### 6. Consultar cerebro PACAME

Para tareas estratégicas o repetidas, consulta Supabase antes de generar:

```sql
-- Top 3 memorias relevantes del agente líder
SELECT title, content, importance, tags
FROM agent_memories
WHERE agent_id = '<lider>' AND importance > 0.6
ORDER BY created_at DESC LIMIT 3;

-- Sinapsis salientes con peso > 0.6 (colaboradores reforzados)
SELECT target_id, relation, weight
FROM agent_synapses
WHERE source_id = '<lider>' AND weight > 0.6;

-- Discoveries activos relevantes
SELECT title, type, impact
FROM agent_discoveries
WHERE status = 'new' AND created_at > NOW() - INTERVAL '30 days'
ORDER BY confidence DESC LIMIT 5;
```

Vía MCP Supabase (`mcp__claude_ai_Supabase__execute_sql`) o endpoint `/api/neural/query`.

### 7. Generar brief estructurado

Devuelve EXACTAMENTE este formato:

```
📋 BRIEF · <ulid corto>

**Objetivo de negocio**: <una frase>
**Capa**: <1 PACAME / 2 Cliente B2B / 3 SaaS Studios / 4 Personal>
**Urgencia**: <hoy / sprint / mes / reflexión>
**Cliente / Proyecto**: <slug o N/A>
**Restricciones**: <presupuesto, marca, legal, técnicas — o "ninguna conocida">

**Agente líder**: <NOMBRE> — porque <razón en 1 línea>
**Agentes soporte**: <lista>

**Skills a invocar**:
- `<skill-1>` — para <razón>
- `<skill-2>` — para <razón>
- `<skill-3>` — para <razón>

**MCPs / herramientas**: <Figma, Canva, Stripe, Supabase, ElevenLabs, etc. — solo los que aplican>

**Memorias del cerebro** (top 3): <bullets cortos con tag al .md de PacameCueva si lo encuentras>
**Discoveries activos**: <bullets cortos>

**Plan en 3-5 acciones**:
1. <acción concreta con responsable>
2. <…>
3. <…>

**Entregable**: <qué se va a producir, en qué formato>
**KPI primario**: <métrica medible>
**Riesgos**: <2-3 cosas que pueden salir mal>

**¿Apruebas este brief?**
- ✅ "sí" → ejecuto
- ✏️ "editar X" → regenero con cambio
- ➕ "ampliar Y" → más detalle en sección Y
- ❌ "no" → cancelo
```

### 8. Esperar aprobación

NUNCA ejecutar sin un "sí" explícito de Pablo. Si edita o pide ampliación, regenera el brief.

### 9. Tras aprobación, ejecutar

- Llama al agente líder con el brief como contexto.
- Carga las skills indicadas.
- Si tarea visual: invoca `frontend-design` / `imagen` ANTES de tocar archivos.
- Al cerrar: registra `recordDiscovery` + `fireSynapse(<lider>, <soporte>, 'collaborates_with', success=true)` + `rememberMemory` con lo aprendido.

---

## Reglas duras

- **NUNCA output genérico**. Si falta contexto crítico (industria, cliente, briefing, assets), pide 2-3 datos antes de generar.
- **Brand/tone PACAME** si output público: tono directo, cercano, sin humo, tutear siempre, frases cortas, verbos activos, números concretos, cierre con próximo paso.
- **Capa 4 (La Caleta) NUNCA mencionada con PACAME en público**.
- **Cliente B2B intocable**: datos cliente nunca en infra PACAME, solo metadata.
- **DarkRoom (Capa 3)**: pública pero NO asociada a PACAME. Si la tarea es DarkRoom, no mencionar PACAME en outputs públicos.
- **Si Pablo no aporta brief útil tras 1 ronda de preguntas**, sugiere que use `/cerebro <tarea breve>` para que la consulta neuronal le ayude a clarificar.

---

Respuesta ≤ 500 palabras (el brief). Si la tarea es trivial (1 línea de código, fix tipo), brief en 100 palabras y avanza.
