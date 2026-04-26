---
type: self-project
title: pacame-gpt
tags:
  - type/self-project
  - capa/3
  - sector/ai-saas
created: '2026-04-26T19:23:08.433Z'
source_path: >-
  C:\Users\Pacame24\Downloads\PACAME
  AGENCIA\PacameCueva\10-Proyectos-Propios\pacame-gpt.md
neural_id: 9051cc5b-d626-49ff-b389-4de7418ddc31
updated: '2026-04-26T19:23:08.433Z'
---
# 🚀 PacameGPT

> Proyecto propio capa 3. Producto IA propio de PACAME (a pesar del prefijo del nombre, opera como capa 3 con su propia infra y pricing).

## Identidad y marca

- **Marca pública:** PacameGPT (revisar si conviene marca sin "Pacame" para aislamiento legal puro)
- **Dominio:** (TBD)
- **Email ops:** (TBD)

## Modelo de negocio

- **Categoría:** SaaS / wrapper LLM con valor añadido
- **Pricing:** (TBD — atomic_gate sugiere modelo de gating de uso por créditos/atomic units)
- **MRR actual:** 0 €

## Infra aislada (Capa 3)

| Recurso | Estado | Ref |
|---|---|---|
| Supabase schema base | ✅ Migración 019 | `019_pacame_gpt_product.sql` |
| Supabase atomic gate | ✅ Migración 024 | `024_pacame_gpt_atomic_gate.sql` |
| Supabase project | (TBD) |  |
| Vercel project | (TBD) |  |
| Endpoints API | ✅ `/api/pacame-gpt/*` (carpeta nueva confirmada) |  |
| Stripe | (TBD) |  |

## Cómo lo construye PACAME (la factoría)

- **Agentes principales:** [[01-DIOS]] · [[01-CORE]] · [[01-LENS]]
- **Skills clave:** [[claude-api]] · [[llm-cost-optimizer]]

## Estado y métricas

- Última sesión: atomic gate migración 024.
- Próximo hito: (rellenar)

## Riesgos

- ⚠️ El nombre "PacameGPT" mezcla marca de la factoría con producto. Considerar rebrand para mantener separación pública (capa 3 limpia) y posiblemente reducir confusión legal.
- ⚠️ Sin verificación de aislamiento infra.

## Decisiones registradas

- 2026-04-26 — Migración `024_pacame_gpt_atomic_gate.sql` creada.

