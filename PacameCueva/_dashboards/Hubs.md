---
type: dashboard
name: Hubs neurales
cssclasses:
  - brain-hud
tags:
  - dashboard
---
# 🎯 Hubs neurales

> Los 10 agentes PACAME y su centralidad en la red.

## 🔴 10 Agentes PACAME

```dataview
TABLE without id
  file.link as "Agente",
  length(file.inlinks) as "Entrantes",
  length(file.outlinks) as "Salientes",
  length(file.inlinks) + length(file.outlinks) as "Grado total"
FROM "01-Agentes"
SORT length(file.inlinks) + length(file.outlinks) desc
```

## 🟠 Top subespecialistas (por referencias)

```dataview
TABLE without id
  file.link as "Sub",
  length(file.inlinks) as "Referencias"
FROM "02-Subespecialistas"
SORT length(file.inlinks) desc
LIMIT 15
```

## 🔵 Top skills (por referencias)

```dataview
TABLE without id
  file.link as "Skill",
  length(file.inlinks) as "Referencias"
FROM "03-Skills"
SORT length(file.inlinks) desc
LIMIT 15
```

## 🟡 Workflows activos

```dataview
TABLE file.link as "Workflow", length(file.inlinks) as "Referencias"
FROM "04-Workflows"
SORT length(file.inlinks) desc
```
