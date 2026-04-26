---
type: dashboard
title: Cerebro Excalidraw
tags: [type/dashboard, capability/excalidraw]
---
# 🧠 Mapa visual del cerebro

> Pizarra Excalidraw para mapas mentales libres del cerebro PACAME.
>
> Comando palette: `Excalidraw: Create new drawing` → guardar como `_dashboards/Cerebro-Mapa.excalidraw.md`.

## Mapas activos

```dataview
LIST
FROM "_dashboards"
WHERE contains(file.name, "excalidraw") OR contains(tags, "excalidraw")
```

## Top 10 nodos del grafo (por inlinks)

```dataview
TABLE WITHOUT ID
  file.link as "Nota",
  length(file.inlinks) as "Entrantes",
  length(file.outlinks) as "Salientes"
FROM "01-Agentes" OR "03-Skills" OR "04-Workflows" OR "00-Dios"
SORT length(file.inlinks) desc
LIMIT 10
```

## Hubs por agente (memorias + discoveries enlazadas)

```dataview
TABLE WITHOUT ID
  file.link as "Agente",
  length(file.inlinks) as "Refs entrantes"
FROM "01-Agentes"
SORT length(file.inlinks) desc
```
