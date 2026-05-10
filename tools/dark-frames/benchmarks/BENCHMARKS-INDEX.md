# Dark Room · Benchmark Library

> **Punto de calibración WOW para visual-reviewer y concept-reviewer.**
> Sin esta library, los revisores no tienen referencia objetiva de qué es WOW vs qué no lo es.
> Pablo: pasa 5-10 piezas de la academia o creators IA top que consideres WOW · las analizamos y se vuelven calibración.

---

## Estructura

```
tools/dark-frames/benchmarks/
├── BENCHMARKS-INDEX.md          ← este archivo (catálogo completo)
├── wow-references/              ← piezas que SÍ son WOW
│   ├── README.md                ← qué hace cada referencia
│   └── [N piezas reference]     ← URLs / mp4 / análisis
└── anti-patterns/               ← piezas que NO son WOW
    ├── README.md                ← qué falla en cada caso
    └── concept-007-master-analysis.md  ← caso real interno
```

---

## WOW References (input pendiente Pablo)

Pendiente: Pablo pasa 5-10 piezas que considere WOW. Por cada una, registramos en `wow-references/` el siguiente análisis estructurado:

| Campo | Valor a recopilar |
|---|---|
| `pieza_id` | Slug único `wow-NN-descriptor` |
| `source_url` | Link IG/TikTok/YouTube/Vimeo/etc |
| `creator` | Handle o nombre del creator |
| `formato_canónico` | 1-act / 2-act / 3-act / story / carrusel (mapear a PLAYBOOK §1) |
| `duración_exacta_s` | Duration medida con ffprobe |
| `num_shots` | Número de shots distinguibles |
| `duración_por_shot` | Lista por shot (ej: 3.2 + 4.1 + 2.7) |
| `tipo_transiciones` | cut · last_frame_chain · J-cut audio · whip pan · color match · etc |
| `audio` | música? voiceover? SFX? license? |
| `lens_references_identificables` | Drive 2011 Sigel / Miami Vice 2006 Beebe / BR2049 Deakins / etc |
| `motion_priority_dominante` | subject / camera / both |
| `por_qué_funciona_1_frase` | Hipótesis de por qué la pieza es WOW |

Status hoy: 0 piezas registradas · Pablo pasa input.

---

## Anti-patterns (calibración inversa · qué evitar)

### #1 — Concept 007 master "Pablo GTA VI Day"

- **Pieza**: `tools/dark-frames/output/dark-frames-007-pablo-gta-vi-day/final/reel_v1_30fps_master.mp4` (48MB · 14:51 2026-05-10)
- **Análisis completo**: [`anti-patterns/concept-007-master-analysis.md`](anti-patterns/concept-007-master-analysis.md)
- **Por qué falla en 1 frase**: 4 escenas con cambios de localización en 14s · imposible que fluya como trailer narrativo · transiciones técnicas (J-cut/whip/color-match) intentan compensar narrativa rota.

---

## Cómo usar la library

### Para visual-reviewer (output visual generado)

Antes de aprobar un reel/carrusel/story:
1. Identifica formato canónico declarado
2. Compara contra 2-3 wow-references del mismo formato
3. Si la pieza nueva NO aguanta side-by-side con benchmarks WOW → 🟡 OBSERVACIONES o 🔴 BLOQUEADO

### Para concept-reviewer (concept JSON pre-render)

Antes de aprobar un concept:
1. Verifica formato declarado
2. Compara estructura (shots / transitions / audio plan) con benchmarks del mismo formato
3. Si concept está más cerca del anti-pattern (concept 007) que de los wow-references → 🔴 BLOQUEADO

### Para Pablo (autoría de concepts)

Antes de redactar un concept JSON:
1. Lee 1-2 wow-references del formato que quieres usar
2. Modela tu concept según patrón identificado
3. Si tu idea exige 4 cambios de localización en 14s → no es 3-act, es montage · pivota a 4 piezas 1-act distintas

---

## Maintenance

- Cuando una pieza Dark Room publica con engagement >benchmark medio (≥2× promedio cuenta) → añadir a `wow-references/` como benchmark interno
- Cuando una pieza falla en publish (engagement <50% promedio o feedback negativo) → análisis en `anti-patterns/` con learning
- Quarterly: re-leer `wow-references/` y verificar que siguen siendo WOW (estética cambia · sin update, calibración drift)
- Cuando creators IA top (Pikalabs / RunwayML showcase / Higgsfield community) publican algo masivo viral → registrar en wow-references/ con análisis estructurado

---

## Version log

- **v1.0** (2026-05-10) — Estructura inicial + concept 007 como primer anti-pattern · pendiente input Pablo para wow-references
