---
type: client
status: <% tp.system.prompt("Estado (prospect/onboarding/active/churn)", "prospect") %>
industry: <% tp.system.prompt("Industria") %>
mrr: 0
tags:
  - type/client
created: <% tp.date.now("YYYY-MM-DD") %>
---

# 🏢 <% tp.file.title %>

## Perfil

- **Empresa:** 
- **Contacto:** 
- **Email:** 
- **WhatsApp:** 
- **Web:** 

## Oportunidad

- **Dolor:** 
- **Objetivo:** 
- **Presupuesto:** 

## Servicio PACAME

- **Pack:** Starter / Growth / Custom
- **Agente asignado:** [[ ]]
- **MRR estimado:** €

## Historial

- <% tp.date.now("YYYY-MM-DD") %> — Nota inicial
