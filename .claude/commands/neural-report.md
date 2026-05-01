---
description: Genera un informe del estado actual de la red neuronal PACAME (Supabase + vault).
argument-hint: "[agente opcional, ej: SAGE]"
---

Ejecuta `tools/obsidian-sync/verify.ts` y resume el estado actual del cerebro IA.

1. Corre `cd tools/obsidian-sync && npx tsx verify.ts` y captura el output.
2. Consulta Supabase para los KPIs:
   - `SELECT COUNT(*) FROM knowledge_nodes`
   - `SELECT COUNT(*) FROM knowledge_edges`
   - `SELECT COUNT(*) FROM agent_synapses WHERE weight > 0.65`
   - `SELECT COUNT(*) FROM agent_memories`
   - `SELECT COUNT(*) FROM agent_discoveries WHERE status = 'new' AND actionable = true`
3. Si el argumento $1 está presente (código de agente uppercase como SAGE, NEXUS…), incluye bloque específico:
   - Top 5 sinapsis salientes de $1 ordenadas por weight.
   - Últimas 5 memorias de $1.
   - Últimos 3 discoveries de $1.
4. Devuelve en markdown con:
   - Resumen numérico (nodos, edges, sinapsis fuertes, memorias, discoveries).
   - Top 5 sinapsis más fuertes global.
   - 3 observaciones: huérfanos críticos, sinapsis en decay, memorias de alta importancia.
   - Recomendación accionable corta.

Mantén respuesta < 300 palabras. Tutear a Pablo. Cierra con próximo paso.
