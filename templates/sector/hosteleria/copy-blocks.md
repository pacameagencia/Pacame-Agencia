---
type: copy_blocks
template: hosteleria-v1
language: es-ES
tone: directo · cercano · sin clichés · tutea
---

# Copy Blocks reutilizables — Plantilla hostelería

Bloques de texto preescritos por COPY que se inyectan en cada despliegue de la plantilla. Personalización vía variables `{{...}}`.

## Hero web

### Variante A — autoridad gastronómica
```
{{cocina}} con alma en {{barrio}}.
{{seats_count}} mesas. {{years_open}} años. Sin filtros.
```

### Variante B — experiencia
```
Comer aquí no es una casualidad.
Es una decisión que querrás repetir.
```

### Variante C — local-first
```
Donde {{city}} viene a comer
cuando le importa lo que come.
```

## CTA reservas

- "Reserva en 30 segundos"
- "Mesa esta semana"
- "Reservar ahora →"
- "Ver disponibilidad"

NO usar:
- ❌ "¡Reserva ya!"
- ❌ "¡No te lo pierdas!"
- ❌ "Apúrate, plazas limitadas"
- ❌ Emojis en CTAs

## About / sobre nosotros

```
{{business_name}} abrió en {{year_opened}} con una idea simple:
servir {{cocina}} sin pretensiones, con producto bueno y sin atajos.

{{owner_name}} se encarga de la cocina. {{co_owner_name_or_empty}}{{front_house_role}}.
La carta cambia cada {{menu_change_frequency}} porque cambia el mercado.
La carta de vinos también, por la misma razón.

No tenemos estrellas. Tenemos clientes que vuelven.
Esa es nuestra métrica.
```

## Sección "Eventos privados"

```
Cierra el local para {{seats_count}} personas.
Cumpleaños, despedidas, cenas de empresa, presentaciones.

Menú cerrado o degustación, según prefieras.
Disponibilidad real {{event_availability_days}}.

Cuéntanos qué buscas y te respondemos en menos de 24 horas con propuesta cerrada.
```

## Confirmación reserva (WhatsApp)

```
Hola {{customer_name}}, tu reserva está confirmada:

📅 {{booking_date_human}} ({{booking_day_of_week}})
🕐 {{booking_time}}
👥 {{party_size}} personas
📍 {{address}}, {{city}}

{{deposit_clause_or_empty}}

Si necesitas modificar algo, responde a este mensaje.
Te recordamos 2 horas antes.

¡Hasta el {{booking_day_of_week}}!
{{business_name}}
```

## Recordatorio 2h antes (WhatsApp)

```
{{customer_name}}, en 2 horas te esperamos en {{business_name}}.

📅 Hoy {{booking_time}} · {{party_size}} personas

📍 {{address_short}}
🚗 {{parking_info_short}}
🚇 {{public_transport_short}}

Si no puedes venir, avísanos cuanto antes para liberar la mesa.
{{business_name_short}} ❤️
```

## Encuesta NPS post-visita (WhatsApp, 30 min después de horario reserva)

```
{{customer_name}}, gracias por venir.

Del 0 al 10, ¿qué tal la experiencia hoy en {{business_name}}?

(0 = nunca volvería · 10 = ya estoy mirando cuándo volver)

Tu respuesta nos ayuda a mejorar mucho.
```

### Si NPS >= 9
```
🙏 Mil gracias, {{customer_name}}.

Si tienes 30 segundos, una reseña en Google nos ayuda a llegar a más gente como tú:
👉 {{google_review_link}}

Y esperamos verte pronto otra vez.
{{business_name}}
```

### Si NPS 7-8
```
Gracias {{customer_name}}.

¿Qué podríamos haber hecho mejor? Te leemos.
(Solo si quieres — sin compromiso.)

{{business_name}}
```

### Si NPS <= 6 → ESCALATE (no auto-respuesta)

## Recuperación clientes inactivos (WhatsApp, 60+ días sin volver)

### Variante A — directa
```
{{customer_name}}, hace {{days_since_last_visit}} días que no te vemos.

¿Reservamos mesa esta semana? Como de costumbre, {{usual_party_size}} personas.

Pasamos esta semana copa de bienvenida si vienes martes/miércoles.
Responde "ok" y te bloqueo la mesa.

{{business_name}}
```

### Variante B — referencia evento estacional
```
{{customer_name}}, esta semana entra {{seasonal_dish}} en la carta — ese plato que te gustó la última vez vuelve hasta {{end_date}}.

¿Mesa este finde? Te bloqueo y avisas.

{{business_name}}
```

## Captación Meta Ads (variantes para A/B test)

### Variante A — turistas
```
HEADLINE: "Donde come {{city}} cuando viene en plan"
PRIMARY TEXT: "{{cocina}} sin postureo en {{barrio}}. Reserva mesa en 30 segundos. {{seats_count}} mesas, las mejores se van rápido."
CTA: "Ver disponibilidad"
```

### Variante B — locales
```
HEADLINE: "{{barrio}}, esto es lo que te estás perdiendo"
PRIMARY TEXT: "{{plato_signature}}, vinos {{wine_origin}}, terraza {{terrace_capacity}} personas. {{years_open}} años haciéndolo bien."
CTA: "Ver carta"
```

### Variante C — eventos
```
HEADLINE: "Cumpleaños cerca · {{seats_count}} pax · Local cerrado"
PRIMARY TEXT: "Eventos privados en {{barrio}}: cocina abierta, menú cerrado, sin sorpresas. Propuesta en 24h."
CTA: "Pedir propuesta"
```

## Respuestas a reseñas Google (asistido por COPY, supervisado por humano)

### Reseña 5★
```
Gracias {{reviewer_name}} 🙏 Nos alegra que disfrutaras de {{specific_dish_or_moment_referenced}}. Te esperamos pronto.
```

### Reseña 4★ con sugerencia
```
Gracias {{reviewer_name}}. Tomamos nota de {{specific_feedback}} — vamos a revisarlo. Te esperamos pronto para que lo pruebes mejorado.
```

### Reseña 3★ o menos (usar como base, customizar siempre)
```
{{reviewer_name}}, lamentamos mucho que la experiencia no fuera la que esperabas. Si te parece, escríbenos a {{email_contact}} con el detalle de lo ocurrido y nos ponemos en contacto contigo. Queremos saber qué pasó y resolverlo.
```

NUNCA:
- ❌ Defenderse en público
- ❌ Discutir hechos
- ❌ Respuestas genéricas tipo "lamentamos su experiencia"
- ❌ Pasar al ataque ("si esperabas mejor servicio en un local de 12€/persona...")

## Pie de página web (compliance + tono)

```
{{business_name}} · {{business_legal_name}}
{{address}}, {{city}} {{postal_code}}
{{phone}} · {{email}}

Reservas online disponibles 24h. Atención humana en horario de apertura.

[Aviso legal] [Política privacidad] [Cookies] [Política de cancelación]

© {{year}} {{business_name}}. Hecho con cariño en {{city}}.
```

## Variables que controla el cliente (parametrizables)

Todas las variables `{{...}}` se rellenan al desplegar la plantilla. Si alguna falta, COPY la marca como `[FALTA: nombre_variable]` y avisa antes de publicar.
