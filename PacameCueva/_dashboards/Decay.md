---
type: dashboard
name: Decay - zonas muertas
cssclasses:
  - brain-hud
tags:
  - dashboard
---
# 🧊 Decay — zonas del cerebro que olvidan

> Nodos viejos, sinapsis débiles y memorias que se degradan.

## 📉 Sinapsis débiles (weight < 0.3)

```dataview
TABLE weight as "Peso", from_agent as "Desde", to_agent as "Hacia"
FROM "07-Sinapsis"
WHERE weight < 0.3
SORT weight asc
LIMIT 20
```

## 🗿 Memorias más antiguas sin acceso

```dataview
TABLE file.ctime as "Creada", owner_agent as "Agente"
FROM "08-Memorias"
SORT file.ctime asc
LIMIT 20
```

## 🌫️ Subespecialistas sin wikilinks entrantes

```dataview
LIST
FROM "02-Subespecialistas"
WHERE length(file.inlinks) = 0
LIMIT 30
```

## ⏱️ Discoveries no revisadas hace >14 días

```dataview
LIST
FROM "09-Discoveries"
WHERE !reviewed AND file.ctime < date(today) - dur(14 days)
SORT file.ctime asc
```
