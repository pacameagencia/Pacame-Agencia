---
type: skill
title: neural-report
tags:
  - type/skill
  - capability/neural
  - capability/observability
created: '2026-04-26T08:08:03.942Z'
source_path: >-
  C:\Users\Pacame24\Downloads\PACAME
  AGENCIA\PacameCueva\03-Skills\neural-report.md
neural_id: d1699f0e-2659-42c3-abc0-7d17c1f6af13
updated: '2026-04-26T08:08:03.942Z'
---
# 📊 neural-report

Genera un informe del estado actual de la red neuronal PACAME. Slash command: `/neural-report`.

## Qué envuelve

Endpoint `POST /api/neural/topology` que devuelve:

```json
{
  "agentes": 10,
  "sinapsis_activas": 35,
  "memorias": 216,
  "discoveries": 152,
  "knowledge_nodes": 996,
  "knowledge_edges": <N>,
  "decay_pending": <count>,
  "last_fire": "<timestamp>",
  "hubs_top5": [...],
  "weak_synapses": [...]
}
```

## Qué reportar al usuario

- Estado general: zonas muertas (Decay.md), hubs sobrecargados.
- Crecimiento: nuevas memorias/discoveries vs semana anterior.
- Salud del cron: último run de `decay_synapses` + `auto-discovery` + `learn`.
- Sugerencias: sinapsis que merecen refuerzo manual con `/synapse`.

## Cuándo invocarlo

- Inicio de sesión semanal estratégica.
- Antes de un periodo intenso de uso para confirmar que todo está vivo.
- Tras una semana de baja actividad para entender qué decayó.

## Dashboards relacionados

[[Red]] — vista global del grafo
[[Hubs]] — agentes con más conexiones
[[Decay]] — sinapsis y memorias en zona muerta
[[Actividad]] — flujo reciente de eventos

## Agentes relacionados

[[01-LENS]] — owner natural (analytics + observabilidad)
[[01-DIOS]] — consumidor del informe
