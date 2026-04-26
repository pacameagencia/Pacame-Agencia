---
type: self-project
title: Proyectos Propios
tags:
  - type/self-project
  - capa/3
  - capability/self-project-registry
created: '2026-04-26T19:23:08.510Z'
source_path: >-
  C:\Users\Pacame24\Downloads\PACAME
  AGENCIA\PacameCueva\10-Proyectos-Propios\_README.md
neural_id: a86d0bf6-825a-4c9d-a891-158e690850b9
updated: '2026-04-26T19:23:08.510Z'
---
# 10 — Proyectos Propios (Capa 3)

Negocios propios de Pablo construidos por la factoría PACAME (Capa 1) pero **aislados** de PACAME y de clientes B2B (Capa 2). Su marca, infra, datos, dinero y users no se cruzan con el resto.

Referencia maestra: [[arquitectura-3-capas]]. Regla 0: "la potencia se comparte, los datos no".

## Cómo añadir un proyecto propio

1. En Obsidian: `Templater: Insert template` → `proyecto-propio` (o copiar `_templates/proyecto-propio.md` a `10-Proyectos-Propios/<slug>.md`).
2. Rellenar frontmatter mínimo y la tabla de "Infra aislada".
3. Etiquetar recursos en Vercel/Supabase con `[SELF:<slug>] *` para no confundirlos con factoría.

## Diferencia con `06-Clientes`

| | `06-Clientes/` | `10-Proyectos-Propios/` |
|---|---|---|
| Capa | 2 | 3 |
| Owner | Cliente B2B externo | Pablo |
| Revenue | Fee de servicios PACAME | MRR / pricing al user final |
| Marca | Del cliente | Del proyecto (sin mención PACAME pública si hay riesgo legal) |
| Datos | PACAME guarda solo metadata del encargo | Aislados en infra propia del proyecto |
| Acceso de PACAME | Colaborador (revocable) | Owner total |

## Cartera actual

```dataview
TABLE WITHOUT ID
  file.link as "Proyecto",
  status as "Estado",
  sector as "Sector",
  mrr_eur as "MRR €"
FROM "10-Proyectos-Propios"
WHERE type = "self-project"
SORT mrr_eur desc
```

