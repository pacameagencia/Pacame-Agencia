---
type: client
title: Clientes
tags:
  - type/client
  - capability/client-registry
created: '2026-04-26T08:05:44.225Z'
source_path: 'C:\Users\Pacame24\Downloads\PACAME AGENCIA\PacameCueva\06-Clientes\_README.md'
neural_id: 95991fbd-88fe-48cc-9d80-7fe71c459274
updated: '2026-04-26T08:05:44.214Z'
---
# 06 — Clientes

Fichas de clientes activos y prospectos. Cada cliente es una nota propia con frontmatter estructurado para que dataview, kanban y el grafo lo enlacen.

## Cómo añadir un cliente

1. En Obsidian: abrir cualquier nota → `Templater: Insert template` → `cliente`.
2. O manual: copiar `_templates/cliente.md` a `06-Clientes/<slug>.md` y rellenar el frontmatter.

Slug convention: `<empresa-en-kebab-case>` (ej. `casa-marisol`, `ecomglobalbox`).

## Frontmatter mínimo

```yaml
---
type: client
title: <Nombre cliente>
status: prospect | active | paused | churn
tier: standard | premium | titan
mrr_eur: 0
agentes_principales: [SAGE, NEXUS]
sector: hosteleria | ecommerce | servicios | ...
contacto: email@cliente.com
fecha_alta: YYYY-MM-DD
---
```

## Aislamiento de datos (regla dura)

Datos sensibles del cliente (credenciales, accesos a sistemas, contenidos privados) **NUNCA** entran en este vault ni en `knowledge_nodes`. Solo metadata (nombre, sector, MRR, estado, fechas, métricas agregadas).

Detalles operativos del cliente viven en su propio repo o en el vault privado del cliente. Ver `feedback_client_data_isolation` en memoria.

## Vista actual

```dataview
TABLE WITHOUT ID
  file.link as "Cliente",
  status as "Estado",
  tier as "Tier",
  mrr_eur as "MRR €",
  agentes_principales as "Agentes"
FROM "06-Clientes"
WHERE type = "client"
SORT mrr_eur desc
```
