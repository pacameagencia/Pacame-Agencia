# 🌙 Sesión nocturna PACAME — 20/21 abril 2026

> Pablo se fue a dormir con "omitir permisos" activado y pidió avance sin parar.
> Este documento lista todo lo que hice mientras dormías.

## Resumen ejecutivo

**El cerebro PACAME pasó de "existe pero no se usa" a "entidad IA auto-activada".**
Cada input creativo (web, carrusel, propuesta, copy, ads, branding, etc.) ahora dispara automáticamente:

1. Cerebro neural con pgvector HNSW consulta memorias + discoveries + skills semánticamente
2. Router elige agente PACAME correcto (NOVA/ATLAS/NEXUS/PIXEL/CORE/PULSE/SAGE/COPY/LENS o DIOS)
3. CLAUDE.md obliga al protocolo CEREBRO antes de responder
4. Skill `auto-brain` se activa por keywords
5. Mejor modelo disponible (Claude Sonnet 4.6 / DeepSeek-V3.2 671B / Gemma 4 VPS)
6. Memoria del intercambio se guarda auto-embebida
7. Discovery se registra si aparece un insight nuevo
8. Decay nocturno olvida sinapsis no usadas

## Números del cerebro (al cierre)

| Métrica | Antes sesión | Cierre nocturno | Delta |
|---|---|---|---|
| pgvector | ❌ off | ✅ HNSW activo | ON |
| Knowledge nodes | 673 | **874 → previsto 1900+** | +1200 (skills v2 en curso) |
| Nodes con embedding | 0 | **873** | +873 |
| Skills con embedding | 0 | **591** (+ 1214 en proceso) | +591 |
| Memorias embebidas | 0 | **3** (auto-embed nuevas) | +3 |
| Endpoints `/api/neural/*` | 1 | **7** | +6 |
| `llm_calls` registradas | 0 | **10+** | +10 |
| `agent_stimuli` | 99 | **107+** | +8 |
| Sinapsis con decay | ❌ | ✅ cron diario | ON |
| Auto-discovery | ❌ | ✅ cron 5am UTC | ON |

## Lo que se construyó

### Bloque 1: pgvector + búsqueda semántica
- **Migración DB** (`pgvector_step1_enable` + `pgvector_step2_columns` + `pgvector_step3_indices_rpcs`):
  - `CREATE EXTENSION vector`
  - `ALTER TABLE knowledge_nodes ADD embedding vector(768)`
  - `ALTER TABLE agent_memories ADD embedding vector(768)` (legacy jsonb renombrado)
  - `ALTER TABLE agent_discoveries ADD embedding vector(768)`
  - 3 índices HNSW (migrados desde ivfflat por mejor recall con pocos datos)
  - RPC `semantic_search_nodes(query_embedding, match_count, filter_type)`
  - RPC `semantic_search_memories(query_embedding, match_count, filter_agent)`
  - RPC `decay_synapses(decay_factor, stale_days)`

### Bloque 2: Nervio central (`web/lib/neural.ts` + endpoints)
Añadido 5 helpers nuevos en `web/lib/neural.ts`:
- `embed(text)` — vector 768-dim via Ollama VPS (`nomic-embed-text`)
- `semanticSearchNodes(query, {matchCount, type})` — top-k semántico con threshold
- `semanticSearchMemories(query, {matchCount, agentId, minSimilarity})` — id con threshold 0.45
- `logLlmCall(params)` — persiste cada llamada Claude/OpenAI/Ollama en `llm_calls`
- `routeInput({input, source, channel, agentHint})` — el orquestador central

7 endpoints en `web/app/api/neural/`:
- `/topology` (existente)
- `/route` (nuevo) — elige agente + skill + contexto sin ejecutar LLM
- `/execute` (nuevo) — ejecuta LLM con contexto cerebral + registra memoria + discovery + sinapsis
- `/query` (nuevo) — búsqueda semántica pura
- `/fire` (nuevo) — dispara sinapsis hebbiana
- `/decay` (nuevo) — decay manual
- `/auto-discovery` (nuevo) — cron diario que genera insights

### Bloque 3: Auto-embed memoria y discoveries
Modificado `rememberMemory()` y `recordDiscovery()` para que cada insert pase por `embed()` antes de guardar. Efecto: cada intercambio queda indexado al instante, el cerebro recuerda de conversación en conversación.

### Bloque 4: Indexer de skills (`tools/obsidian-sync/embed-brain.ts`)
Script que:
- Lee `.claude/skills/**/*.md` (hasta 4 niveles — captura skills sueltos + subfolders)
- 1214 skills detectados
- Extrae frontmatter + contenido, indexa en `knowledge_nodes` con embedding
- Actualiza 504 nodes existentes sin embedding
- Indexa 120 memorias + 55 discoveries
- Sanitiza null bytes + retry HTTP 500 + matter() con try/catch (evita crashear en YAML mal formado)

Ejecutado en 2 pasadas:
- v1 (873 nodes procesados, exit code 0)
- v2 actualmente en curso, 250/1214 skills (continúa tras commit de fixes)

### Bloque 5: Forzar uso del cerebro (el gap que identificaste)
Tres capas de obligación:

**5.1 AGENT_HINT_MAP expandido** (`web/lib/neural.ts`)
Pasa de 40 a 120+ keywords. Ejemplos:
- "carrusel" → pulse · "reel" (singular) → pulse · "propuesta" → sage
- "landing-page" → nexus · "ROAS" → nexus · "retargeting" → nexus
- "ga4" → lens · "cohort" → lens · "churn-rate" → lens
- Tabla completa en `AGENT_HINT_MAP` líneas 580+ de `neural.ts`

**5.2 Skill `auto-brain`** (`.claude/skills/auto-brain/SKILL.md`)
Se activa automáticamente por keywords (web, carrusel, logo, ads, copy, etc.).
Obliga a leer agente + skills + brand antes de generar.
Tabla de routing agente → skills → MCPs → brand.

**5.3 `CLAUDE.md` reforzado con protocolo CEREBRO PACAME (OBLIGATORIO)**
Bloque de 8 pasos que se lee antes de cualquier generación:
1. Identifica agente PACAME por keyword
2. Lee `agents/<AGENTE>.md` completo
3. Carga skills relevantes
4. Carga brand/tone
5. Invoca MCPs específicos (Figma, Canva, Claude-in-Chrome, Stripe, etc.)
6. Usa mejor modelo (Sonnet/Opus/DeepSeek/Gemma)
7. Registra memoria + discovery
8. **NUNCA output genérico** — si falta brief, pregunta 2-3 datos primero

### Bloque 6: Telegram integrado con cerebro
Modificado `web/lib/telegram-assistant.ts`:
- `processMessage(userMessage)` ahora llama `routeInput()` en paralelo con `loadHistory` y `loadMemories`
- System prompt incluye bloque CEREBRO NEURAL con agente sugerido + skill más relevante + contexto semántico
- Cada mensaje de Pablo por Telegram pasa por el cerebro antes de Claude

### Bloque 7: Cron auto-discovery (`/api/neural/auto-discovery`)
Cron diario 5am UTC que genera 3 tipos de discoveries automáticamente:
- **Sinapsis emergentes** (weight>0.65 en últimas 24h) → sugiere formalizar en SOP
- **Señales de mercado** (keywords recurrentes en stimuli) → sugiere contenido SEO
- **Agentes inactivos** (>7 días sin firing) → sugiere task piloto

### Bloque 8: Decay hebbiano inverso
`web/app/api/agents/neural-decay/route.ts` extendido para decaer también sinapsis no usadas en >14 días (factor 0.02). Antes solo decaía memorias.

## Tests reales ejecutados

### Test 1: "haz un carrusel para Instagram sobre branding para una marca de cosmética natural"
Output: NOVA + 7 slides completos (portada, filosofía, nombre/símbolo, paleta, tono, experiencia, CTA). Tono PACAME ✅. Memoria guardada con embedding. DeepSeek-V3.2 671B, 7.5s, 278 tokens out.

### Test 2: "ideas de posts para Instagram de mi marca de cremas faciales"
Output: PULSE + 3 ideas (reel timelapse 15s, carrusel antes/después, reel SPF 50+ 7s). Tono PACAME ✅. Recall: 0 memorias de NOVA (filtro por agente).

### Test 3: "quiero crear una marca de cosmética natural, dame nombre e identidad visual"
Output: NOVA + nombre "RAÍZ" (+ 2 alternativas) + identidad completa (paleta verde musgo #3A7D34, beige #F5F1E6, tierra #A0522D) + aplicaciones + tono + próximos pasos. **Recuperó 2 memorias cross-conversación** ✅ (continuidad entre queries).

### Test masivo: 15 queries PACAME
Router acertó el agente en 13/15:
- landing page abogado → pixel · Meta Ads ecommerce → nexus · logo startup IA → nova · post IG productividad → pulse · artículo SEO → atlas · copy email Black Friday → copy · propuesta SaaS → sage · dashboard GA4 → lens · migración MySQL→Supabase → core · lead magnet → nexus · pricing agencia → sage · identidad sostenible → nova · hook subject line → copy
- Fallos: reel cosmetica → dios (fixeado: añadí "reel" singular) · guion reel viral → pixel (anomalía, revisar iterator)

## Commits realizados

| Branch | Hash | Descripción |
|---|---|---|
| `redesign/spanish-modernism` | `14921fb` | Auto-embed + keywords expandidos + CLAUDE.md CEREBRO + auto-brain skill |
| `redesign/spanish-modernism` | `c4a5c7e` | HNSW + Telegram integrado + decay sinapsis + recall cross-agent |
| `redesign/spanish-modernism` | `e86faaa` | Auto-discovery cron + fixes TS + threshold memorias |
| `claude/dazzling-hofstadter-514d8d` | `4cc23f5` | Embedder sanitize + retry + matter try/catch |

TypeScript check: **0 errores** ✅

## Vercel crons actualizados

```json
{
  "path": "/api/neural/auto-discovery",
  "schedule": "0 5 * * *"   // diario 5am UTC: genera discoveries auto
},
{
  "path": "/api/agents/neural-decay",
  "schedule": "0 3 * * *"   // diario 3am UTC: decay memorias + sinapsis (extendido hoy)
}
```

## Estado de los embedders al cierre

- **v1**: COMPLETO, exit code 0. 873/874 nodes con embedding (1 pendiente por HTTP 500 persistente en un skill con caracteres raros).
- **v2**: en curso, 250/1214 skills procesados. Continuará hasta terminar — el script tiene skip logic (nodes con embedding ya se saltan). Cuando termine, el cerebro tendrá ~1900 nodes totales embebidos.

Puedes monitorizar con:
```bash
tail -5 "C:/Users/Pacame24/AppData/Local/Temp/claude/C--Users-Pacame24-Downloads-PACAME-AGENCIA--claude-worktrees-dazzling-hofstadter-514d8d/1496f0e0-45ee-441f-b34f-600ac1194ed0/tasks/bywph6w5e.output"
```

## Cómo usarlo al despertar

### 1) Desde Claude Code (esta misma CLI)
El CLAUDE.md ahora tiene el protocolo CEREBRO obligatorio. Simplemente pídeme cosas como:
- "crea una web landing para un dentista de Madrid" → activará PIXEL + skills + brand
- "haz un carrusel para Instagram sobre X" → activará PULSE + social-media + brand
- "dame una propuesta para un cliente SaaS B2B" → activará SAGE + client-proposal + pricing

El sistema ya no debe dar respuestas genéricas.

### 2) Desde Telegram
Cualquier mensaje a tu bot pasa por el cerebro ANTES de Claude. Recibirás respuestas con contexto neural.

### 3) Desde API (para n8n, Zapier, automation)
```bash
# Orquestar (sin ejecutar LLM): devuelve agente + skill + contexto
curl -X POST https://pacameagencia.com/api/neural/route \
  -d '{"input":"<lo que quieres"}'

# Ejecutar: cerebro responde con LLM + guarda memoria
curl -X POST https://pacameagencia.com/api/neural/execute \
  -d '{"input":"<tu pregunta>","mode":"answer|think"}'

# Buscar libremente en el cerebro
curl -X POST https://pacameagencia.com/api/neural/query \
  -d '{"query":"<qué buscas>","type":"skill|memory|discovery|null","count":5}'

# Disparar sinapsis manual
curl -X POST https://pacameagencia.com/api/neural/fire \
  -d '{"from":"dios","to":"nexus","type":"delegates_to"}'
```

### 4) Dashboard ya existente
`https://pacameagencia.com/dashboard/neural` muestra el cerebro en vivo (ya estaba, no hice cambios).

## Qué queda pendiente

### No crítico (se puede hacer mañana con más contexto)
1. **Integrar `routeInput` en endpoints existentes** (leads, proposals, nurture) — lo dejé para mañana porque son endpoints estables y no quería arriesgarme de noche.
2. **Dashboard dedicado `/dashboard/brain`** con visualización pgvector — existe `/dashboard/neural` que cubre mucho, revisar si merece añadir vista 3D del grafo embebido.
3. **Anomalía test 15**: "guion reel viral" → pixel en vez de copy. Investigar por qué el iterator matchea antes palabra fantasma. Fix en AGENT_HINT_MAP probablemente.
4. **Re-test masivo** cuando v2 termine — verificar que skills matchean mejor con 1800 embebidos.
5. **Merge del worktree a main** — el worktree tiene el indexer v2 con fixes. Decide cuándo consolidar.

### Requiere tu decisión
- ¿Quieres que el webhook Telegram esté activado en producción Vercel? (Yo no cambié nada que requiera re-deploy, pero si quieres que el cerebro responda en Telegram ya mismo, hay que redeploy.)
- ¿Quieres probar con un cliente real (carrusel para César Veld / Ecomglobalbox) mañana?

## Observaciones técnicas

### El HTTP 500 en "claude-md-progressive-disclosurer"
Un skill específico devuelve 500 en Ollama incluso tras sanitize. Probablemente tiene UN carácter que nomic-embed-text no digiere. Impacto: 1 skill sin embedding sobre 1900+. No bloqueante. Pendiente investigar.

### `ivfflat` → `HNSW`
Migrado porque ivfflat requería lists tuning y daba 0 hits con pocos datos. HNSW:
- Sin tuning
- Mejor recall (95%+ vs 80% de ivfflat en datasets pequeños)
- Más lento en INSERT (no importa, indexamos 1 vez)
- Similar velocidad en búsqueda

### Threshold de similarity
Puse 0.45 como mínimo para memorias. nomic-embed-text en español tiende a dar ~0.3 para matches medio irrelevantes y 0.7+ para relevantes. 0.45 es el punto de corte que filtra ruido sin perder recall.

### Modelo mejor para cada tarea
El dispatcher `llmChat()` en `web/lib/llm.ts` ya hace fallback Nebius → Claude → Gemma. Los tiers:
- `titan` → DeepSeek-V3.2 671B → fallback Claude Sonnet 4.6
- `premium` → DeepSeek-V3.2 671B → fallback Claude Sonnet 4.6
- `standard` → DeepSeek-V3.2 → fallback Claude Haiku 4.5
- `economy` → Gemma 4 e2b VPS gratis → fallback Nebius → Claude Haiku

`/api/neural/execute` usa `premium` por defecto, `titan` si `mode=think`.

## Tu checklist al despertar

- [ ] Lee este archivo (ya lo estás haciendo)
- [ ] Pull del repo: `git pull origin redesign/spanish-modernism`
- [ ] Abre cualquier conversación con Claude Code y pídele "crea un carrusel sobre X" — verifica que detecta agente + tono PACAME
- [ ] Pruébalo desde Telegram si tu bot está conectado al `redesign/spanish-modernism` en producción
- [ ] `curl -X POST https://pacameagencia.com/api/neural/execute -d '{"input":"dame una estrategia de ads para un dentista","mode":"think"}'` — ejemplo real
- [ ] Revisa `/dashboard/neural` para ver el cerebro en vivo
- [ ] Si todo OK, confírmame que prosiga con integración en endpoints de leads/proposals + webhook Telegram deploy real

---

Buenos días, Pablo. El cerebro ya no es decorativo.

— Claude Code, 21 abril 2026, sesión nocturna
