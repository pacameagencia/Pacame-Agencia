---
type: skill
title: discover
tags:
  - type/skill
  - capability/neural
  - capability/discovery
created: '2026-04-26T08:08:02.090Z'
source_path: 'C:\Users\Pacame24\Downloads\PACAME AGENCIA\PacameCueva\03-Skills\discover.md'
neural_id: 73e67e62-2d7a-416c-9995-a492242b90cf
updated: '2026-04-26T08:08:02.090Z'
---
# 💡 discover

Registra un discovery (insight, tendencia, patrón) en la red neuronal. Slash command: `/discover <título>`.

## Qué envuelve

`recordDiscovery()` en [web/lib/neural.ts](../../web/lib/neural.ts) inserta en tabla `agent_discoveries` con:
- `title`: el argumento del slash command
- `content`: contexto de la conversación (primeros 4 KB del flujo actual)
- `agent_id`: agente activo (resuelto por keyword)
- `confidence`: 0.7 por defecto, ajustable según evidencia
- `discovery_type`: `pattern` · `trend` · `insight` · `anomaly` · `hypothesis`

`pull.ts` lo materializa en `09-Discoveries/YYYY-MM-DD-<slug>.md`.

## Promoción a knowledge_node

Si el discovery se cita en ≥3 conversaciones (vía `getDiscoveries(filter)`), `auto-discovery` cron lo promueve:
1. Crea `knowledge_node` con embedding pgvector.
2. Conecta al `knowledge_edges` con los nodos relacionados detectados por similarity.
3. Añade tag `promoted/<fecha>`.

## Cuándo registrar uno

- Aprendiste algo nuevo que cambia la forma de operar (no solo un dato puntual).
- Notaste una tendencia repetida que merece convertirse en regla.
- Descubriste una conexión inesperada entre dos áreas (sinapsis emergente).

## Estado actual

152 discoveries en el vault tras catch-up 2026-04-25. Cron `/api/neural/auto-discovery` corre diariamente a 05:00 UTC para promoción y detección.

## Agentes relacionados

[[01-DIOS]] · todos los demás agentes son productores potenciales de discoveries.
