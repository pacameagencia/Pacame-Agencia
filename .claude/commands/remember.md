---
description: Guarda una memoria explícita en la red neuronal de un agente PACAME.
argument-hint: "<agente> <titulo> | <contenido>"
---

Crea una memoria episódica/semántica en `agent_memories` para el agente especificado.

Parseo:
- $1 = agente (dios, sage, atlas, nexus, pixel, core, pulse, nova, copy, lens) — lowercase.
- Resto = resto del argumento, split por ` | ` primer pipe: antes = title, después = content.
- Si el usuario no escribe pipe: usar todo como content y pedir título corto derivado.

Acción:
```typescript
await supabase.from('agent_memories').insert({
  agent_id: agente,
  memory_type: 'episodic',   // heurística: por defecto episódico salvo que title empiece con "PATRON:" → procedural o "HECHO:" → semantic
  title,
  content,
  importance: 0.7,
  tags: ['manual', 'pablo-input'],
});
```

Después:
1. Corre `npx tsx tools/obsidian-sync/pull.ts` para materializar la memoria en `PacameCueva/08-Memorias/<AGENTE>/`.
2. Devuelve el ID nuevo + ruta del .md generado.
3. Menciona que la memoria se reforzará cada vez que `fire_synapse` o `getMemory` la toquen.

Respuesta ≤ 80 palabras.
