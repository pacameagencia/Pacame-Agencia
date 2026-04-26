---
type: skill
title: synapse
tags:
  - type/skill
  - capability/neural
  - capability/hebbian
created: '2026-04-26T08:08:02.134Z'
source_path: 'C:\Users\Pacame24\Downloads\PACAME AGENCIA\PacameCueva\03-Skills\synapse.md'
neural_id: a7035744-319e-46e5-8954-e0933bb73efc
updated: '2026-04-26T08:08:02.134Z'
---
# ⚡ synapse

Dispara una sinapsis entre dos agentes PACAME. Slash command: `/synapse <src> <dst> <type>`.

## Qué envuelve

`fireSynapse()` en [web/lib/neural.ts](../../web/lib/neural.ts) llama RPC Supabase:
```sql
SELECT fire_synapse(p_from, p_to, p_type, p_success);
```

Tipos válidos de `synapse_type`: `orchestrates`, `delegates_to`, `consults`, `collaborates_with`, `learns_from`, `reviews`, `reviewed_by`, `references`.

## Comportamiento hebbian

- Si la sinapsis no existe → la crea con `weight = 0.55`, `fire_count = 1`.
- Si existe → incrementa `weight` en `+0.02` (éxito) o `-0.01` (fallo), clamp `[0, 1]`.
- Cada fire actualiza `last_fired_at` → la sinapsis no decae hasta 14 días sin uso.
- Decay nocturno (`/api/agents/neural-decay` 03:00 UTC) baja peso de las que llevan ≥14 días sin disparar.

## Cuándo dispararla manualmente

- Patrón nuevo descubierto: `/synapse pixel core collaborates_with` cuando notas que ese par hace match repetido en el código.
- Refuerzo explícito: cuando un workflow en producción depende de esa colaboración y quieres priorizarla en el grafo.

## Estado actual (post catch-up 2026-04-25)

35 sinapsis activas en el vault. Top weights inicializados con seed `005_neural_seed.sql` (24 hub edges DIOS↔10).

## Agentes relacionados

[[01-DIOS]] — orquestador, owner del 70% de las sinapsis hub.
