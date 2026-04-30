---
description: Dispara una sinapsis (fire_synapse) entre dos agentes PACAME.
argument-hint: "<from> <to> [tipo] [success=true]"
---

Ejecuta `fire_synapse()` en Supabase para reforzar/crear una sinapsis.

Parseo:
- $1 = from_agent (lowercase: dios, sage, atlas, nexus, pixel, core, pulse, nova, copy, lens).
- $2 = to_agent (lowercase).
- $3 = tipo (opcional): `collaborates_with | reports_to | delegates_to | consults | reviews | orchestrates | learns_from | supervises`. Default: `collaborates_with`.
- $4 = success (opcional): `true | false`. Default: `true`.

Llamada:
```typescript
const { data } = await supabase.rpc('fire_synapse', {
  p_from: $1,
  p_to: $2,
  p_type: $3 ?? 'collaborates_with',
  p_success: $4 !== 'false',
});
```

Tras la llamada:
1. Devuelve el `weight` nuevo (success=true → +0.02, success=false → -0.01, máx 1.0, mín 0.0).
2. Corre `npx tsx tools/obsidian-sync/pull.ts` para refrescar el .md en `07-Sinapsis/`.
3. Responde con: `<FROM> → <TO> (<tipo>) ahora peso X.XX tras Y disparos (Z éxitos).`

Respuesta ≤ 60 palabras.
