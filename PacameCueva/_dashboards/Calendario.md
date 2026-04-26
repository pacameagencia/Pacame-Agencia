---
type: dashboard
title: Calendario neuronal
cssclasses: [brain-hud]
tags: [type/dashboard, capability/calendar]
---
# 📅 Calendario neuronal

> Activa el sidebar Calendar (View → Calendar) para navegar por días.
> Click en un día vacío crea una entrada usando `_templates/diario.md`.

## Hoy
```dataview
LIST file.link
FROM "08-Memorias" OR "09-Discoveries" OR "07-Sinapsis"
WHERE file.ctime >= date(today)
SORT file.ctime desc
```

## Esta semana — agregado por día
```dataview
TABLE WITHOUT ID
  dateformat(file.ctime, "yyyy-MM-dd") as "Día",
  length(rows) as "Eventos"
FROM "08-Memorias" OR "09-Discoveries" OR "07-Sinapsis"
WHERE file.ctime >= date(today) - dur(7 days)
GROUP BY dateformat(file.ctime, "yyyy-MM-dd")
SORT key desc
```

## Discoveries últimos 30 días
```dataview
TABLE WITHOUT ID
  file.link as "Discovery",
  dateformat(file.ctime, "yyyy-MM-dd HH:mm") as "Cuándo"
FROM "09-Discoveries"
WHERE file.ctime >= date(today) - dur(30 days)
SORT file.ctime desc
LIMIT 25
```

## Sinapsis disparadas últimos 7 días
```dataview
TABLE WITHOUT ID
  file.link as "Sinapsis",
  dateformat(file.mtime, "yyyy-MM-dd HH:mm") as "Última actividad"
FROM "07-Sinapsis"
WHERE file.mtime >= date(today) - dur(7 days)
SORT file.mtime desc
```
