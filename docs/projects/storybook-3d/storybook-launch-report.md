# Launch report — Storybook 3D V1

> Template a rellenar tras el lanzamiento (D+7) con métricas baseline reales.

## Status

- **Día del lanzamiento (D)**: TBD (a fijar en Fase 7 cuando Pablo dé green light)
- **Flag activado por**: TBD
- **Commit en producción al lanzar**: TBD
- **Estado actual**: ⏳ pre-launch (todas las fases mergeadas en main)

## PRs mergeados (camino completo)

| Fase | PR | Commit merge | Fecha | Tema |
|---|---|---|---|---|
| 0 | #142 | `c9d1ab5` | 2026-05-07 | Skill local + plan + wireframes + 6 mockups + hook |
| 1 | #154 | `f8268e2` | 2026-05-07 | Stack R3F + Canvas + SSR shell + flag |
| 2 | #158 | `196d407` | 2026-05-08 | 5 islas + HUD + a11y teclado |
| 3 | #160 | `d48db54` | 2026-05-08 | Galería casos 3D rotables |
| 4 | #161 | `9715d10` | 2026-05-08 | Email capture + form auditoría |
| 5 | #163 | `66ecdab` | 2026-05-08 | SEO + a11y + OG image custom |
| 6 | #164 | `63140a4` | 2026-05-08 | Migración legacy + /clasica + sitemap + runbook |
| 7 | #?? | TBD | TBD | E2E tests + launch comms + report |

## Métricas baseline (rellenar D+7)

### Web Analytics (Vercel Analytics)

| Métrica | Pre-launch (clásica) | Post-launch (Storybook) | Δ |
|---|---|---|---|
| Visitas únicas / día `/` | TBD | TBD | TBD |
| Bounce rate `/` | TBD | TBD | TBD |
| Avg time on page `/` | TBD | TBD | TBD |
| % visitas → `/auditoria-3d` | n/a | TBD | n/a |
| % visitas → `/casos-3d` | n/a | TBD | n/a |

### Conversión (Supabase `leads`)

| Métrica | Pre-launch | Post-launch | Δ |
|---|---|---|---|
| Leads totales / semana | TBD | TBD | TBD |
| Leads desde Storybook (`source LIKE 'storybook%'`) | 0 | TBD | TBD |
| Score promedio de leads | TBD | TBD | TBD |
| Conversión scroll → form submit | TBD | TBD | TBD |

### Performance (Lighthouse CI sobre preview/prod)

| Métrica | Mobile (target ≥85) | Desktop (target ≥90) |
|---|---|---|
| Performance | TBD | TBD |
| Accessibility | TBD | TBD |
| Best Practices | TBD | TBD |
| SEO | TBD | TBD |
| LCP | TBD | TBD |
| CLS | TBD | TBD |

### Errores

| Métrica | Pre-launch | Post-launch | Δ |
|---|---|---|---|
| Errores Sentry / día | TBD | TBD | TBD |
| 4xx en `/api/leads` | TBD | TBD | TBD |
| 5xx en cualquier ruta | TBD | TBD | TBD |

### Mobile real (BrowserStack o devices físicos)

| Device | Carga (s) | FPS Scene | UX issues |
|---|---|---|---|
| iPhone 13 Safari | TBD | TBD | TBD |
| Pixel 7 Chrome | TBD | TBD | TBD |
| iPad Air Safari | TBD | TBD | TBD |

## Feedback cualitativo (rellenar D+7)

- **Comentarios positivos** (RRSS, email): TBD
- **Comentarios negativos / quejas**: TBD
- **Bugs reportados por usuarios reales**: TBD
- **Bugs reportados por Pablo en uso diario**: TBD

## Decisiones post-launch

Al cierre del D+7, decidir:

1. **Mantener flag en producción** (Storybook 3D queda como home oficial).
2. **Rollback a clásica** (flag OFF, esperar fixes y relanzar D+30).
3. **A/B test 50/50** durante 2 semanas con `web/lib/ab/` ya disponible.

Decisión registrada aquí: TBD

## Lecciones aprendidas

Rellenar cada lección como item separado:

- **Técnica**: TBD
- **Diseño**: TBD
- **Comunicación**: TBD
- **Coste/timing**: TBD

## Próxima iteración (post-V1.1, V1.2)

Backlog declarado en `docs/projects/storybook-3d/README.md` sección "Marcado post-V1":

- Spline runtime para animaciones cinematográficas custom
- Audio ambiental procedural avanzado
- Multi-idioma EN
- Casos 3D con escena dedicada (continuación del mapa, no grid separado)
- A/B test Storybook vs home clásica con `web/lib/ab/*`
- Captcha (solo si supera umbral spam)
- Phone field opcional con WhatsApp send
- Postprocessing tier-aware (SMAA + bloom sutil) — Sub-fase 5.5
- Modelos `.glb` reales para piezas icónicas (sustituir primitives R3F)
