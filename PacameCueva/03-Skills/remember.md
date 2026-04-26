---
type: skill
title: remember
tags:
  - type/skill
  - capability/neural
  - capability/memory
created: '2026-04-26T08:07:29.870Z'
source_path: 'C:\Users\Pacame24\Downloads\PACAME AGENCIA\PacameCueva\03-Skills\remember.md'
neural_id: 54010625-ffd7-4f15-a8e0-ece8536bc1b1
updated: '2026-04-26T08:07:29.870Z'
---
# 💾 remember

Guarda una memoria explícita en la red neuronal del agente activo. Slash command: `/remember <agente> <titulo> | <contenido>`.

## Qué envuelve

`rememberMemory()` en [web/lib/neural.ts](../../web/lib/neural.ts) inserta en tabla `agent_memories` con:
- `agent_id`: lowercase (dios, sage, atlas, nexus, pixel, core, pulse, nova, copy, lens)
- `memory_type`: `episodic` por defecto · `semantic` si título empieza por `HECHO:` · `procedural` si empieza por `PATRON:`
- `importance`: 0.7
- `tags`: `['manual', 'pablo-input']`

Tras insertar, `pull.ts` materializa el `.md` en `08-Memorias/<AGENTE>/`.

## Patrón de uso

```
/remember sage Pricing premium tier | Tier titan empieza en 5k€/mes con commit de 6 meses; descuento 15% si pagan año adelantado
```

## Refuerzo

La memoria se refuerza (importance ↑) cada vez que:
- `fire_synapse()` engancha al agente owner
- `getMemory()` la lee desde un endpoint neural
- Una sesión `/cerebro` la incluye en el contexto

Sin acceso, decae a las 7 días vía `decay_memories()` (cron 03:00 UTC).

## Agentes relacionados

[[01-DIOS]] · [[01-SAGE]] · [[01-ATLAS]] · [[01-NEXUS]] · [[01-PIXEL]] · [[01-CORE]] · [[01-PULSE]] · [[01-NOVA]] · [[01-COPY]] · [[01-LENS]]
