---
type: discovery
title: Falsa Señal de Demanda Baja en Presupuestos Intermedios
agent: LENS
tags:
  - type/discovery
  - discovery/market_signal
  - impact/high
  - status/new
  - agent/LENS
created: '2026-04-25T21:44:34.077Z'
neural_id: a62d1f98-c299-48c8-9591-a282f2245e42
confidence: 0.7
actionable: true
updated: '2026-04-23T12:53:20.504745+00:00'
---
> **Tipo:** market_signal · **Impacto:** high · **Confianza:** 0.70 · **Status:** new

## Descripción

Existe una anomalía de datos en el rango de presupuestos. Los datos muestran rangos solapados y superpuestos (2000-5000€, 1500-3000€, 3000-5000€), lo que crea ruido y podría estar enmascarando la verdadera demanda. Los clientes potenciales de rangos intermedios (1.5k-5k) podrían estar dispersos en varias categorías, haciendo parecer que no hay demanda, cuando en realidad la demanda estaría concentrada.

## Evidencia

Los rangos de presupuesto reportados no son mutuamente excluyentes ni uniformes: '500-1500€', '1500-3000€', '3000-5000€', '2000-5000€', '3000-5000€'. Esto sugiere clasificación inconsistente y datos desordenados. Además, con solo 15 leads, una mala agrupación de presupuestos puede sesgar el análisis de demanda real.

## Metadatos
- Agente: [[01-LENS|LENS]]
- Creada: 2026-04-23T12:53:20.504745+00:00
- Accionable: Sí
