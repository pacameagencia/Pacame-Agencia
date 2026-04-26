---
type: self-project
title: la-caleta
tags:
  - type/self-project
  - capa/3
  - sector/hosteleria
created: '2026-04-26T19:23:08.490Z'
source_path: >-
  C:\Users\Pacame24\Downloads\PACAME
  AGENCIA\PacameCueva\10-Proyectos-Propios\la-caleta.md
neural_id: 71d3b38e-e37f-49b8-8168-51cbb11bf510
updated: '2026-04-26T19:23:08.490Z'
---
# 🚀 La Caleta Manchega

> Proyecto propio de Pablo (Capa 3). Negocio de hostelería que Pablo gestiona bajo paraguas PACAME. Aislado de la factoría PACAME y de los clientes B2B.

## Identidad y marca

- **Marca pública:** La Caleta Manchega
- **Dominios:** lacaletamanchega.com · lacaletamanchega.es · lacaletamanchega.online
- **Email ops:** (TBD — ideal `ops@lacaletamanchega.com`)
- **Tagline:** (rellenar)

## Modelo de negocio

- **Categoría:** Negocio físico digitalizado (gestión hostelería + presencia online)
- **Pricing:** (rellenar — tickets restaurante / eventos / catering)
- **MRR actual:** 0 € · **Objetivo 6 meses:** (rellenar)

## Infra aislada (Capa 3)

| Recurso | Estado | Ref |
|---|---|---|
| Vercel projects | ✅ 4 proyectos | `caleta-gestiona`, `caleta-gestiona-n1x7`, `lacaletamanchegaalbacete`, `lacaleta-gestion` |
| Vercel team | ⚠️ usa `pacames-projects` | Pendiente migrar a team propio cuando aplique |
| Supabase project | (TBD — verificar si existe propio o reutiliza factoría) |  |
| Supabase org | (TBD — separar de `pacameagencia` si comparte) |  |
| Stripe cuenta | (TBD — confirmar si reutiliza PACAME LIVE o tiene propia) |  |
| Email transaccional | (TBD) |  |
| Dominios | ✅ Hostinger Pablo | lacaletamanchega.com · .es · .online |
| Repo git | (TBD — listar repos asociados) |  |

## Cómo lo construye PACAME (la factoría)

- **Agentes principales:** [[01-DIOS]] · [[01-PIXEL]] (web/frontend) · [[01-NEXUS]] (ads locales) · [[01-PULSE]] (RRSS)
- **Skills clave:** [[seo-audit]] · [[social-media]] · [[ads-campaign]]
- **Workflows reutilizados:** lead-gen-pipeline, seo-content-cluster, website-delivery

## Estado y métricas

- Última sesión de trabajo: 2026-04-26
- Próximo hito: completar tabla "Infra aislada" verificando si comparte Supabase/Stripe con PACAME factoría (debería separarse).
- KPIs vivos: (rellenar — reservas, tráfico orgánico, conversión)

## Riesgos

- ⚠️ Si comparte Stripe con PACAME LIVE, cualquier incidente fiscal/legal del negocio físico afecta la facturación a clientes B2B PACAME. **Pendiente verificar y separar.**
- ⚠️ Si comparte Supabase org `pacameagencia`, datos de La Caleta y de la factoría conviven. Pendiente verificar y aislar.

## Decisiones registradas

- 2026-04-26 — Reclasificada de Capa 2 (cliente externo) a Capa 3 (proyecto propio). Pablo aclaró: "es otro negocio que gestiono por lo que pertenece a PACAME". Datos deben aislarse como cliente.

