---
type: dashboard
name: Agentes PACAME
cssclasses:
  - brain-hud
tags:
  - dashboard
---
# 🤖 Los 10 Agentes PACAME

| Código | Agente | Dominio |
|--------|--------|---------|
| 🟢 DIOS  | [[00-pacame-system\|DIOS]] | Orquestador global |
| 🔴 NOVA  | [[01-nova\|NOVA]]  | Branding e identidad |
| 🟠 ATLAS | [[02-atlas\|ATLAS]] | SEO + contenido orgánico |
| 🟡 NEXUS | [[03-nexus\|NEXUS]] | Ads / embudos / CRO |
| 🔵 PIXEL | [[04-pixel\|PIXEL]] | Frontend + diseño web |
| 🟣 CORE  | [[05-core\|CORE]]  | Backend + APIs + infra |
| 🟤 PULSE | [[06-pulse\|PULSE]] | Social media |
| ⚪ SAGE  | [[07-sage\|SAGE]]  | Estrategia + pricing |
| 🟦 COPY  | [[08-copy\|COPY]]  | Copywriting |
| 🟩 LENS  | [[09-lens\|LENS]]  | Analytics |

## 📝 Última memoria por agente

```dataview
TABLE WITHOUT ID
  owner_agent as "Agente",
  file.link as "Memoria",
  file.ctime as "Creada"
FROM "08-Memorias"
SORT file.ctime desc
GROUP BY owner_agent
```

## 💡 Últimos discoveries por agente

```dataview
TABLE WITHOUT ID
  agent_code as "Agente",
  file.link as "Discovery",
  pattern_type as "Tipo",
  file.ctime as "Cuándo"
FROM "09-Discoveries"
SORT file.ctime desc
LIMIT 15
```
