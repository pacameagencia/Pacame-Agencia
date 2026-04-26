---
type: self-project
title: asesor-pro
tags:
  - type/self-project
  - capa/3
  - sector/b2b-saas
created: '2026-04-26T19:23:08.684Z'
source_path: >-
  C:\Users\Pacame24\Downloads\PACAME
  AGENCIA\PacameCueva\10-Proyectos-Propios\asesor-pro.md
neural_id: 25f6a8a3-55bb-486c-8864-616b8f3dc530
updated: '2026-04-26T19:23:08.684Z'
---
# 🚀 Asesor Pro

> Proyecto propio capa 3. Mini-SaaS para asesores fiscales/laborales — primer micronicho. Foundation 2026-04-25.

## Identidad y marca

- **Marca pública:** Asesor Pro (TBD final)
- **Dominio:** (TBD)
- **Email ops:** (TBD)
- **Tagline:** (rellenar)

## Modelo de negocio

- **Categoría:** Mini-SaaS B2B vertical (asesorías)
- **Pricing:** (TBD — modelo Hormozi tier por número de clientes del asesor)
- **MRR actual:** 0 € · **Objetivo 6 meses:** validar PMF

## Infra aislada (Capa 3)

| Recurso | Estado | Ref |
|---|---|---|
| Supabase schema | ✅ Migraciones 016 + 017 | `016_asesorpro_schema.sql`, `017_asesorpro_realtime.sql` |
| Supabase project | (TBD — verificar si propio o reutiliza factoría) |  |
| Vercel project | (TBD) |  |
| Stripe | (TBD) |  |
| Endpoints API | ✅ `/api/products/asesor-pro/*` |  |

## Cómo lo construye PACAME (la factoría)

- **Agentes principales:** [[01-DIOS]] · [[01-CORE]] · [[01-PIXEL]] · [[01-SAGE]]
- **Skills clave:** [[saas-scaffolder]] · [[client-proposal]]
- **Foundation:** commit `b994e30 feat(asesor-pro): foundation primer micronicho mini-SaaS (AS-1)`
- **AS-2:** commit `58e5cea feat(asesor-pro): panel del asesor con pipeline + clientes + dashboard`
- **AS-3+4:** commit `e47dc89 feat(asesor-pro): panel cliente + facturacion + PDF + Stripe checkout`

## Estado y métricas

- Última sesión de trabajo: 2026-04-25 (panel cliente + Stripe checkout)
- Próximo hito: (rellenar)

## Riesgos

- ⚠️ Sin verificación de aislamiento Supabase/Stripe respecto a PACAME factoría.

## Decisiones registradas

- 2026-04-25 — AS-1 a AS-4 implementados.

