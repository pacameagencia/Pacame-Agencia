---
type: skill
title: cerebro
tags:
  - type/skill
  - capability/neural
  - capability/orchestration
created: '2026-04-26T08:08:16.645Z'
source_path: 'C:\Users\Pacame24\Downloads\PACAME AGENCIA\PacameCueva\03-Skills\cerebro.md'
neural_id: bd4ec905-1950-47cb-b677-d8724f1752b5
updated: '2026-04-26T08:08:16.645Z'
---
# 🧠 cerebro

Abre una sesión de trabajo con el cerebro PACAME (memoria + sinapsis + skills + brand cargados). Slash command: `/cerebro <tarea>`.

## Qué envuelve

Orquestación completa por `auto-brain` skill:

1. **Routing** (`/api/neural/route`) — keyword + embedding clasifica `<tarea>` al agente principal.
2. **Memorias relevantes** (`/api/neural/query`) — pgvector HNSW recupera top-K memorias del agente con `agent_id` matching.
3. **Sinapsis activas** (`agent_synapses` weight > 0.5) — identifica colaboradores secundarios.
4. **Skills cargadas** — el agente principal carga `.md` propio + skills relevantes según `routing_rules` de CLAUDE.md.
5. **Brand/tone** — tono PACAME directo, tutear, frases cortas.
6. **Ejecución** (`/api/neural/execute`) — LLM tier titán (Claude Sonnet/Opus) con todo el contexto + opción `store_memory:true` post-ejecución.

## Patrón de uso

```
/cerebro Necesito un guion de carrusel para Casa Marisol enfocado a captar bodas
```

Resultado típico:
- Agente principal: PULSE (carrusel/Instagram)
- Colaboradores: COPY (texto), NOVA (visual), SAGE (estrategia comercial)
- Memorias cargadas: 5 sobre hostelería + bodas + voz de marca PACAME
- Output: 9-10 slides con copy + brief visual + CTA

## Cuándo usarlo

- **Siempre** al inicio de una tarea creativa/estratégica nueva.
- Cuando dudes qué agente toca: `/cerebro` lo decide por ti.
- Cuando quieras que la memoria del agente se reactive antes de pedirle algo concreto.

## Cuándo NO usarlo

- Para tareas puramente técnicas/CLI (debug, refactor) que no necesitan contexto neural.
- Si ya estás en una conversación con el agente correcto cargado y solo iteras.

## Agentes relacionados

[[01-DIOS]] — siempre el orquestador raíz.
Todos los 10 agentes principales pueden ser destino del routing.
