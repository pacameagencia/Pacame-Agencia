---
type: dashboard
name: Red Neuronal PACAME
cssclasses:
  - brain-hud
tags:
  - dashboard
---
# 🧠 Red Neuronal PACAME

> Vista general del cerebro: 10 agentes + 184 subespecialistas + skills + workflows + sinapsis activas.

## 📊 Resumen por carpeta

```dataview
TABLE length(rows) AS "Notas"
FROM "01-Agentes" OR "02-Subespecialistas" OR "03-Skills" OR "04-Workflows" OR "07-Sinapsis" OR "08-Memorias" OR "09-Discoveries"
GROUP BY file.folder
SORT length(rows) DESC
```

## 🔗 Sinapsis fuertes (weight > 0.5)

```dataview
TABLE weight AS "Weight", from_agent AS "Desde", to_agent AS "Hacia", relation AS "Tipo"
FROM "07-Sinapsis"
WHERE weight > 0.5
SORT weight DESC
LIMIT 20
```

## 🧬 Memorias recientes por agente

```dataview
TABLE file.ctime AS "Creada", owner_agent AS "Agente", importance AS "Peso"
FROM "08-Memorias"
SORT file.ctime DESC
LIMIT 30
```

## 💡 Discoveries sin revisar

```dataview
LIST
FROM "09-Discoveries"
WHERE !reviewed
SORT file.ctime DESC
LIMIT 20
```

## 🔴 Agentes núcleo (hubs)

```dataview
TABLE file.name AS "Agente", length(file.outlinks) AS "Links salientes"
FROM "01-Agentes"
SORT length(file.outlinks) DESC
```

## 📉 Nodos huérfanos (sin wikilinks)

```dataview
LIST
FROM "02-Subespecialistas" OR "03-Skills"
WHERE length(file.inlinks) = 0 AND length(file.outlinks) = 0
LIMIT 20
```
