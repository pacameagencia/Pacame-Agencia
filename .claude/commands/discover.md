---
description: Registra un discovery (insight, tendencia, patrón) en la red neuronal.
argument-hint: "<agente> <tipo> <titulo> | <descripcion>"
---

Crea un registro en `agent_discoveries` que aparecerá en `PacameCueva/09-Discoveries/` tras el siguiente pull.

Parseo:
- $1 = agente (lowercase).
- $2 = tipo: `trend | service_idea | technique | competitor_insight | optimization | market_signal | content_idea | pattern | anomaly`.
- Resto split por ` | `: antes = title, después = description.

Heurísticas:
- `impact`: si title contiene "urgente" o "crítico" → `critical`. Si contiene "quick-win" → `high`. Default `medium`.
- `confidence`: 0.7 por defecto.
- `actionable`: true por defecto, false si title empieza con "observación:".

Inserción:
```typescript
await supabase.from('agent_discoveries').insert({
  agent_id,
  type,
  title,
  description,
  impact,
  confidence,
  actionable,
  status: 'new',
});
```

Después:
1. Corre `npx tsx tools/obsidian-sync/pull.ts`.
2. Devuelve el ID + ruta del .md generado.
3. Recuerda: discoveries con `status=new` salen en el dashboard `_dashboards/Actividad`.

Respuesta ≤ 80 palabras.
