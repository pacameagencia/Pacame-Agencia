---
type: skill
title: auto-aprende
tags:
  - type/skill
created: '2026-04-25T21:44:20.272Z'
source_path: 'C:/Users/Pacame24/Downloads/PACAME AGENCIA/.claude/skills/auto-aprende.md'
neural_id: 9ae4b41d-0980-4b73-962b-7e012beea0fd
---

# Skill `auto-aprende` — Loop de aprendizaje autónomo PACAME

## Para qué sirve

Llenar el cerebro PACAME (Supabase) y el vault Obsidian (`PacameCueva/`) con conocimiento de oro
recién investigado, segmentado por agente (NOVA, ATLAS, NEXUS, PIXEL, CORE, PULSE, SAGE, COPY, LENS).

Cada ejecución produce:
- 1 memoria semántica en `agent_memories` (importance 0.78, decay 0.02)
- 1 discovery en `agent_discoveries` (type technique/trend/etc.)
- 1 knowledge node en `knowledge_nodes` (skill/playbook)
- N sinapsis `learns_from` cross-agent
- 1 archivo `.md` en `PacameCueva/08-Memorias/<AGENTE>/`
- 1 archivo `.md` en `PacameCueva/09-Discoveries/`

## Componentes

| Pieza | Ruta | Qué hace |
|-------|------|----------|
| Endpoint cron | `web/app/api/neural/learn/route.ts` | Llama LLM titan, parsea JSON, guarda en Supabase |
| Cron Vercel | `web/vercel.json` (`15 */6 * * *`) | Auto-dispara 4×/día (00:15, 06:15, 12:15, 18:15 UTC) |
| Script pull | `web/scripts/brain-pull.mjs` | Materializa Supabase → vault Obsidian |
| Skill | `.claude/skills/auto-aprende.md` (este) | Documentación + invocación manual |

## Cuándo activarlo

- **Automático**: cron Vercel cada 6h → 4 piezas/día → ~120/mes.
- **Manual rápido** (un solo learning): `npm run brain:learn`
- **Manual de un agente concreto**: `npm run brain:learn -- --agent=nova`
- **Manual con tema custom**: `npm run brain:learn -- --agent=nexus --topic="creativos UGC IA Meta Ads marzo 2026"`
- **Sync vault**: `npm run brain:pull` (descarga últimas 72h al vault)
- **Sync vault + git commit**: `npm run brain:pull -- --commit`

## Flujo cuando Pablo te dice "aprende sobre X"

1. Identifica el agente PACAME dueño del dominio (tabla en `CLAUDE.md` paso 1 del protocolo cerebro).
2. Si es local (NODE_ENV dev): ejecuta directamente con `curl` al endpoint:
   ```bash
   curl "http://localhost:3000/api/neural/learn?agent=<id>&topic=<encoded>"
   ```
3. Si Pablo quiere ya verlo en Obsidian: corre `node web/scripts/brain-pull.mjs --hours 1`.
4. Si quiere persistirlo en repo: añade `--commit`.
5. Devuelve a Pablo: título de la pieza generada, 2-3 insights clave, ID de memoria, y dónde se escribió.

## Cuándo NO usarlo

- Tareas one-shot que no son aprendizaje (ej: "escribe un post"). El agente PACAME correspondiente ya tiene su skill propia.
- Si el tema es muy genérico y no aporta a clientes PYME (ej: "historia de la programación"). Conocimiento de oro = aplicable.
- Si Pablo pide acción urgente (deploy, fix, propuesta). Aprendizaje va en background.

## Reglas duras

1. **Tier titan** siempre — conocimiento de oro requiere Claude Opus/Sonnet, no Gemma. Coste asumido.
2. **Anti-bias**: el endpoint elige el agente con menos memorias en últimas 24h, así no se llena solo NEXUS.
3. **Idempotente**: re-ejecutar `brain-pull` sobreescribe archivos con la versión actualizada de Supabase (Supabase = fuente de verdad).
4. **Sin humo**: el prompt obliga al LLM a dar fuentes reales, números concretos, y a no inventar. Si una pieza es vaga o genérica, márcala con `importance=0.4` y déjala fuera del vault.
5. **Cross-agent obligatorio**: cada pieza dispara ≥1 sinapsis `learns_from`. Eso teje la red.

## Troubleshooting

- **Endpoint devuelve `invalid-payload`**: el LLM no devolvió JSON válido. Reintentar; si recurre, bajar `temperature` a 0.4.
- **Memorias duplicadas**: añadir filtro `embedding semantic distance < 0.85` antes de insertar (TODO).
- **Vault no se actualiza**: correr `node web/scripts/brain-pull.mjs --hours 168` (última semana) y verificar permisos de escritura.
- **CRON_SECRET en prod**: Vercel auto-añade `Authorization: Bearer $CRON_SECRET`. En local funciona sin él (fallback dev).

## Próximos pasos sugeridos

- [ ] Plugin Obsidian que muestre las memorias auto-aprendidas en un dashboard del vault.
- [ ] Endpoint `/api/neural/learn-batch` que rote por los 9 agentes en una sola llamada (dev local).
- [ ] Webhook que avise por Telegram cuando una pieza tenga `confidence > 0.85` y `impact = high`.
- [ ] Anti-duplicate: usar `semanticSearchMemories` antes de insertar para dedupe a 0.9 cosine.
