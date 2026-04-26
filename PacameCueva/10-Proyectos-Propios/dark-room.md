---
type: self-project
title: dark-room
tags:
  - type/self-project
  - capa/3
  - sector/creative
created: '2026-04-26T19:23:08.675Z'
source_path: >-
  C:\Users\Pacame24\Downloads\PACAME
  AGENCIA\PacameCueva\10-Proyectos-Propios\dark-room.md
neural_id: 7d6dd73a-11a8-4581-b6f4-5752dc992ddc
updated: '2026-04-26T19:23:08.675Z'
---
# 🚀 Dark Room

> Proyecto propio capa 3. SaaS de cuentas premium compartidas para creativos. Marca separada sin referencia pública a PACAME por riesgo legal del modelo "group buy".

## Identidad y marca

- **Marca pública:** Dark Room
- **Dominio:** darkroomcreative.cloud
- **Email ops:** ops@darkroomcreative.cloud (pendiente activar)
- **Único buzón real activo:** support@darkroomcreative.cloud

## Modelo de negocio

- **Categoría:** SaaS — group buy de herramientas premium
- **Pricing:** (rellenar)
- **MRR actual:** (rellenar) · **Objetivo 6 meses:** >1k€ (umbral para Stripe propio)

## Infra aislada (Capa 3)

| Recurso | Estado | Ref |
|---|---|---|
| Supabase project | ✅ aislado | `dark-room-prod` (`kxqcyukivvfygvrxxant`) |
| Supabase org | ✅ aislada | `Dark Room IO` (`vlznxeibibkaqqfvnivz`) |
| Vercel project | ⚠️ aún en team `pacames-projects` | `dark-room` |
| Vercel team | ✅ creado | `Dark Room IO` (`team_ApmnOAs00bIX6Kt1gTWPbRpm`) — transfer pendiente |
| Stripe cuenta | ⚠️ reutiliza PACAME LIVE | Pendiente Stripe propio cuando MRR>1k€ |
| Email transaccional | ✅ Resend separado | `re_ZPx6dkfB_...` |
| Dominio | ✅ Hostinger Pablo | darkroomcreative.cloud |
| VPS adicional | 🟡 Contabo EU Windows | pendiente S4 |
| AdsPower | ⚠️ cuenta personal Pablo | ideal cuenta `ops@darkroomcreative.cloud` dedicada |

## Cómo lo construye PACAME (la factoría)

- **Agentes principales:** [[01-DIOS]] · [[01-PIXEL]] · [[01-CORE]] · [[01-NOVA]]
- **Skills clave:** [[deploy-workflow]] · [[branding]]

## Estado y métricas

- Última actualización infra: 2026-04-24 (separación Supabase + Vercel team)
- Próximo hito: transfer del proyecto Vercel `dark-room` al team `Dark Room IO` cuando Vercel ofrezca API sin downtime, o cuando MRR>1k€.
- KPIs vivos: (rellenar — usuarios, churn, MRR, tickets)

## Riesgos

- 🔴 **Stripe compartido con PACAME LIVE**: cualquier ban por modelo "group buy" puede congelar facturación a clientes B2B PACAME. Crítico separar antes de escalar.
- 🟡 **Vercel team compartido**: si Dark Room entra en disputa legal, Vercel podría bloquear el team `pacames-projects` completo. Transfer pendiente.
- 🟡 **AdsPower personal**: si Pablo cambia rol, lío de acceso. Cuenta dedicada pendiente.

## Decisiones registradas

- 2026-04-24 — Supabase org y proyecto separados de PACAME (`Dark Room IO`).
- 2026-04-24 — Vercel team `Dark Room IO` creado, transfer aplazado.
- 2026-04-24 — Resend separado activo.

