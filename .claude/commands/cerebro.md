---
description: Abre una sesión de trabajo con el cerebro PACAME (memoria + sinapsis activas).
argument-hint: "<tarea breve>"
---

Prepara el contexto del cerebro para una tarea nueva usando la red neuronal PACAME.

Pasos:
1. Analiza la tarea ($1) e identifica el agente principal (dios, sage, atlas, nexus, pixel, core, pulse, nova, copy, lens) mediante el routing del `CLAUDE.md`.
2. Consulta Supabase:
   - Top 3 memorias del agente con `importance > 0.6` y tags relevantes a la tarea.
   - Sinapsis salientes con `weight > 0.6` (colaboradores potenciales).
   - Discoveries relevantes con `status != dismissed` de los últimos 30 días.
3. Lee el agente correspondiente: `agents/<XX>-<AGENTE>.md`.
4. Si la tarea requiere skills, carga los top 3 skills referenciados en las memorias.
5. Presenta a Pablo:
   - **Agente principal:** X con razón.
   - **Colaboradores sugeridos:** Y, Z (con weight).
   - **Memorias relevantes:** 3 con link al .md de `08-Memorias/`.
   - **Skills cargados:** 3 con ruta.
   - **Primer paso concreto** de la tarea.
6. Al terminar la tarea, ofrece `/remember` + `/synapse success=true` para reforzar.

Respuesta ≤ 200 palabras.
