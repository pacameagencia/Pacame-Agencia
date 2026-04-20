---
type: diary
date: <% tp.date.now("YYYY-MM-DD") %>
tags:
  - type/diary
cssclasses:
  - brain-hud
---

# 📅 <% tp.date.now("dddd D [de] MMMM, YYYY") %>

## 🎯 Foco del día

- [ ] 

## ⚡ Aprendizajes

- 

## 💡 Ideas / Discoveries

- 

## 🔗 Sinapsis nuevas

- 

## 📊 Métricas

```dataview
LIST
FROM "08-Memorias" OR "09-Discoveries"
WHERE file.ctime >= date(<% tp.date.now("YYYY-MM-DD") %>)
```
