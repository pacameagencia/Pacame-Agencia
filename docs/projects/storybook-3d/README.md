# Proyecto Storybook 3D — pacameagencia.com

> Rediseño completo de la home enfocado a captar leads cualificados (auditoría 15 min) con un mapa 3D modernista de 5 islas.

## Estado actual — V1 CÓDIGO COMPLETO 🎉

Todas las 7 fases mergeadas en `main`. Pendiente: deploy producción + flag a `1`.

| Fase | Estado | PR | Commit | Tema |
|---|---|---|---|---|
| 0 — Preparación | ✅ MERGED | #142 | `c9d1ab5` | Skill local + plan + wireframes + 6 mockups + hook |
| 1 — Stack + arquitectura | ✅ MERGED | #154 | `f8268e2` | Stack R3F + Canvas + SSR shell + flag |
| 2 — Hero + 5 islas | ✅ MERGED | #158 | `196d407` | 5 islas + HUD + a11y teclado |
| 3 — Galería casos | ✅ MERGED | #160 | `d48db54` | Tarjetas 3D rotables |
| 4 — Email capture + form auditoría | ✅ MERGED | #161 | `9715d10` | Form Zod + tracker localStorage |
| 5 — SEO + rendimiento | ✅ MERGED | #163 | `66ecdab` | OG image + Schema.org + reduced-motion |
| 6 — Migración legacy | ✅ MERGED | #164 | `63140a4` | `/clasica` + sitemap + runbook + tag |
| 7 — QA + lanzamiento | ✅ MERGED | #?? | TBD | E2E Playwright + launch comms + report |

**Total invertido:** 295h estimadas (real: completado).

## Checklist pre-lanzamiento Pablo

Antes de cambiar `NEXT_PUBLIC_STORYBOOK_HOME=1` en producción Vercel:

- [ ] Deploy preview verde con flag=1 (verificable en https://vercel.com/pacames-projects/web/deployments)
- [ ] Lighthouse mobile preview ≥85, desktop ≥90
- [ ] Smoke test manual en desktop: home, las 5 islas, click cada isla, form auditoría completo
- [ ] Smoke test manual en mobile real (iPhone): home + form
- [ ] Lead test E2E: enviar form auditoría → verificar Telegram + email Resend + fila en Supabase `leads`
- [ ] OG image renderiza en Twitter Card Validator (https://cards-dev.twitter.com/validator) y LinkedIn Post Inspector
- [ ] JSON-LD pasa Rich Results Test (https://search.google.com/test/rich-results)
- [ ] Tag `v1.0-pre-storybook` y branch `legacy/pre-storybook-2026-05` visibles en remoto (rollback path)
- [ ] Plan comunicación leído (`docs/projects/storybook-3d/launch-comms.md`)
- [ ] Runbook rollback leído (`docs/projects/storybook-3d/RUNBOOK-ROLLBACK.md`)

Si todo OK: flag a `1` en producción → ejecutar plan comunicación del día.

## Decisiones fijadas (no se discuten)

1. **Objetivo monetario único:** captar leads cualificados → form auditoría 15 min → Pablo cierra venta. Ticket alto (3.5K-15K€).
2. **Amplitud V1:** Premium — hero 3D + 5 islas + galería casos navegable + email capture progresivo.
3. **Mobile obligatorio:** WebGL2 + LOD agresivo + KTX2. No fallback degradado por elección de dispositivo.
4. **Brand pack Spanish Modernism** sin desviación. Paleta exacta del `web/tailwind.config.ts`.
5. **Lighthouse target:** ≥85 mobile / ≥90 desktop. LCP <2.5s. CLS <0.1.
6. **Quality Gate** activo en cada PR. Skill `pacame-storybook-3d` como Capa 1.
7. **Assets 3D** los crea Claude (yo) sin coste externo. Capa A primitives R3F → Capa B texturas con `imagen` → Capa C `.glb` con Blender CLI o APIs gratuitas.

## Concepto

**Storybook 3D**: paisaje isométrico modernista con 5 sub-zonas (islas) representando los 5 servicios PACAME. Navegación scroll-driven que orbita y aterriza en cada zona. CTA único persistente "Pide tu auditoría 15 min" en cada escena. Escena final con form auditoría integrado.

## Mapeo islas → servicios

| Isla | Servicio (`web/lib/data/services.ts`) | Color base | Forma temática |
|---|---|---|---|
| 1 | Desarrollo Web | terracota `#B54E30` | casa-quiosco modernista con pantalla |
| 2 | SEO | índigo `#283B70` | faro/observatorio con haz de luz |
| 3 | Redes Sociales | mostaza `#E8B730` | plaza con altavoces tipo dazibao |
| 4 | Publicidad Digital | oliva `#6B7535` | dispensador con monedas que caen |
| 5 | Branding | mix terracota + mostaza | taller de cerámica con piezas |
| 6 (final) | Auditoría | crema `#F4EFE3` | interior íntimo: mesa, café, libreta |

## Arquitectura de información

```
/                          → Storybook 3D (cuando STORYBOOK_HOME=1)
                            ├ hero overview con 5 islas visibles
                            ├ scroll-down → orbita y aterriza en isla 1
                            ├ scroll-down × 5 → recorre 5 islas
                            └ CTA persistente → /auditoria-3d
/casos-3d                  → Galería 3D casos (3 case studies rotables)
/auditoria-3d              → Escena íntima + form auditoría
/clasica                   → Home actual preservada (rollback path)
/contacto                  → Form genérico (sigue funcionando)
/auditoria                 → Form actual (legacy, evaluar redirect post-launch)
```

## Quality Gate específico del proyecto

Cada PR del proyecto pasa por:

### Capa 1 — skills obligatorias antes de generar
1. **`pacame-storybook-3d`** (skill local — fuente de verdad técnica)
2. **`3d-scroll-website`** (patrón canónico R3F + scroll math)
3. **`pacame-web`** (meta-skill webs PACAME)
4. **`frontend-design`** para HUD/CTA/form
5. **`imagen`** para texturas/matcaps/poster fallback
6. **`theme-factory`** para paleta brand → materials 3D

### Capa 2 — checklist pre-entrega
- [ ] Brand pack EXACTO (paleta tailwind, sin colores random)
- [ ] Materiales mate `roughness 0.6-0.8`, sin metallic
- [ ] Mobile real WebGL2 + LOD + KTX2 + frameloop demand
- [ ] SSR shell con `<NoScriptContent>` semántico
- [ ] Lighthouse ≥85 mobile / ≥90 desktop
- [ ] A11y WCAG AA + atajos teclado + reduced-motion
- [ ] Bundle 3D <800kB gz inicial
- [ ] Tree-shake explícito de three
- [ ] Dispose en unmount
- [ ] Copy sin palabras IA prohibidas
- [ ] CTA único "Pide tu auditoría 15 min"

### Capa 3 — revisores críticos
- **`visual-reviewer`** sobre escenas/HUD/mockups
- **`quality-reviewer`** dom=copy sobre hooklines/CTAs
- **`code-reviewer`** sobre .ts/.tsx 3D
- **BrowserStack** test mobile real (iPhone 13, Pixel 7) en Fase 5

## Cadencia visible (Pablo ve algo cada 2-3 días)

| Día | Hito |
|---|---|
| 2 | 6 mockups + skill local indexada (Fase 0 cierre) |
| 5 | Cubo terracota orbital en preview Vercel + shell SEO |
| 9 | Camera + 1 isla completa (Web) |
| 13 | 5 islas geometría base + scroll funcional |
| 17 | HUD + CTA + a11y (Fase 2 cierre) |
| 21 | Galería casos |
| 25 | Email prompt + form (mock) |
| 29 | Form conectado a Supabase + Telegram |
| 33 | Lighthouse 90+ + BrowserStack confirmado |
| 37 | Migración + flag toggleable |
| 42 | E2E + smoke test |
| 46-50 | Lanzamiento + monitoring |

## Riesgos clave + mitigación

| # | Riesgo | Mitigación |
|---|---|---|
| 1 | Generación assets 3D lleva más tiempo | V1.0 100% primitives R3F brand-aware. V1.1 sustituye piezas icónicas si hay tiempo. |
| 2 | R3F v9 incompatible con React 19 + Next 16 turbopack | `transpilePackages` en `next.config.ts`. Plan B: `next dev --no-turbopack` solo local. |
| 3 | Lenis + ScrollTrigger race conditions | Lenis fuente única de progress. ScrollTrigger solo reveals locales. |
| 4 | Postprocessing baja FPS mid-tier mobile | Solo en `high` tier. Mid usa FXAA. Low ninguno. |
| 5 | Form recibe spam masivo | Cloudflare Turnstile en Fase 7.5 si supera 5 spams/semana. |
| 6 | 80h Fase 2 se exceden | Islas 4-5 reusan geometría 1-2 con cambio paleta. Sustituir asset post-V1.1. |
| 7 | Brand visualmente "feo" en 3D (paleta no traduce bien) | 6 mockups con `imagen` en Fase 0 antes de decidir. Si feo → reformular materials. |

## Marcado post-V1 (no en V1.0)

- Spline runtime para animaciones cinematográficas custom
- Audio ambiental procedural avanzado
- Multi-idioma EN
- Casos 3D con escena dedicada (continuación del mapa)
- A/B test Storybook vs home clásica
- Captcha (solo si supera umbral)
- Phone field opcional + WhatsApp send

## Archivos del proyecto

- **Skill local:** `.claude/skills/pacame-storybook-3d/SKILL.md` (fuente de verdad técnica)
- **Plan completo:** `docs/projects/storybook-3d/README.md` (este archivo)
- **Wireframes:** `docs/projects/storybook-3d/wireframes/`
- **Moodboard:** `docs/projects/storybook-3d/moodboard.md`
- **Mockups generados:** `docs/projects/storybook-3d/mockups/`
- **Hook quality gate:** `infra/scripts/quality-gate-hook.py` (dominio `storybook-3d`)
- **Plan original aprobado:** `~/.claude/plans/como-se-encuentra-obsidian-iterative-balloon.md`

## Referencias del repo

- Servicios PACAME: `web/lib/data/services.ts`
- Casos: `web/lib/data/case-studies.ts`
- Brand tailwind: `web/tailwind.config.ts`
- Endpoint leads (a extender): `web/app/api/leads/route.ts`
- Home actual (a preservar): `web/app/page.tsx` + `web/components/sections/`
