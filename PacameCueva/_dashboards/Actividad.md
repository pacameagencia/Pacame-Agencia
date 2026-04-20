---
type: dashboard
name: Actividad cerebro
cssclasses:
  - brain-hud
tags:
  - dashboard
---
o  # ⚡ Actividad cerebro

> Qué está aprendiendo el cerebro ahora mismo.

## 🧬 Memorias últimos 7 días

```dataview
TABLE file.ctime as "Creada", owner_agent as "Agente", importance as "Peso"
FROM "08-Memorias"
WHERE file.ctime >= date(today) - dur(7 days)
SORT file.ctime desc
```

## 💡 Discoveries últimos 14 días

```dataview
TABLE file.ctime as "Creada", agent_code as "Agente", pattern_type as "Tipo"
FROM "09-Discoveries"
WHERE file.ctime >= date(today) - dur(14 days)
SORT file.ctime desc
```

## 🔗 Sinapsis más recientes

```dataview
TABLE file.ctime as "Creada", from_agent as "Desde", to_agent as "Hacia", weight as "Peso"
FROM "07-Sinapsis"
SORT file.ctime desc
LIMIT 25
```

## 📅 Timeline general (todo lo nuevo)

```dataview
LIST
FROM "07-Sinapsis" OR "08-Memorias" OR "09-Discoveries"
WHERE file.ctime >= date(today) - dur(3 days)
SORT file.ctime desc
LIMIT 40
```
