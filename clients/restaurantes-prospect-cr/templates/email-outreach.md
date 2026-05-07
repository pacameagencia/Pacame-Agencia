# Email outreach restaurantes — Plantilla v1

Tono: cercano, directo, sin humo. **No vende, regala**. Asunto y primer párrafo son lo único que se lee — todo entrenado para abrir.

---

## Variables a sustituir

- `{{NAME}}` — Nombre del restaurante (ej. "El Ventero")
- `{{CITY}}` — Ciudad (ej. "Ciudad Real")
- `{{DEMO_URL}}` — URL pública de la demo (ej. https://el-ventero.demos.pacameagencia.com)
- `{{PHONE_LAST_DIGITS}}` — últimos 4 del teléfono (verificación visual)

---

## Asunto (A/B testing — usar 50/50)

**A:** Os hice una web a {{NAME}} (échale un vistazo)

**B:** Hola {{NAME}} — esto es lo que se me ocurrió para vosotros

---

## Cuerpo del email (texto plano, sin HTML floreado)

```
Hola, equipo de {{NAME}}!

Soy Pablo, de PACAME (agencia digital pequeña, 1 fundador, sin
intermediarios). Ayer estaba viendo la oferta de restaurantes en {{CITY}}
y me llamó la atención el vuestro: por las reseñas que tiene en Google,
y por el sitio en sí.

Os he hecho una propuesta de web sin que me la pidierais. Está aquí:

   {{DEMO_URL}}

La he montado con datos reales que encontré (vuestra dirección, teléfono,
horario, valoración Google) y le he puesto una carta digital de ejemplo
con platos típicos para que veáis cómo quedaría. Lo de la carta lo
adapto a vuestros platos reales y vuestras fotos en cuanto me lo digáis.

Lo que incluye:
• Hero con foto grande y datos clave
• Carta digital navegable (ahorra el cartel impreso del bar)
• Reseñas de Google integradas (refuerza confianza al que entra)
• Botón reservar por WhatsApp con un solo toque
• Mapa para llegar al sitio
• Optimizado para móvil — el 78 % de la gente que busca restaurante
  en Google está en el móvil

El precio:

  - 390 € de alta (web montada, dominio, hosting, fotos, todo)
  - 19 € al mes de mantenimiento (cambios de carta, fotos, reseñas)

Si queréis algo más a medida (reservas con calendario, pedidos online,
diseño totalmente custom, integración con TPV, etc.) me escribís y
hablamos sin compromiso.

Si os mola, contestad este email o me escribís por WhatsApp:

   https://wa.me/34722669381

Y si no es lo vuestro, no pasa nada — borráis este email y aquí no ha
pasado nada.

Un saludo,
Pablo
PACAME · pacameagencia.com
+34 722 669 381

P.D. Si abrís la demo desde el móvil se ve mejor que en el ordenador.
Tarda 2 segundos en cargar y se navega entera con el dedo.
```

---

## Reglas de envío

1. **No más de 30 emails al día** desde el mismo dominio (si no, Google penaliza)
2. **Espaciar 2-3 minutos** entre envíos (parece humano)
3. **Personalizar** asunto y primera línea con datos reales del local
4. **No CC ni BCC masivo** — uno a uno, parece manual
5. **Hora**: martes-jueves 10:00-12:00 o 17:00-19:00 (mejor open rate B2B España)
6. **Sender**: `hola@pacameagencia.com` con SPF + DKIM bien configurados (verificar en Resend o el ESP que uses)

## Métricas a trackear

- Open rate esperado: 25-35% (asunto curioso + nombre propio)
- Click rate al demo: 8-12%
- Respuesta WhatsApp/email: 3-6%
- Cierre comercial: 1-2% del total enviado

Para 137 emails: ~3 cierres esperados = 3 × 390 = **1.170 € primer mes**, después 3 × 19 = 57 €/mes recurrente.

## Variantes

### Variante "más cercana" (para barrios pequeños, locales viejos)

Cambiar el inicio:

```
Hola!

Mira, voy directo. Soy Pablo, vivo en La Mancha, monto webs sencillas
para restaurantes. Le tenía echado el ojo al vuestro y me ha dado
por hacer una propuesta yo solo, sin pedirla.

Aquí está, échale un vistazo: {{DEMO_URL}}
```

### Variante "técnica" (para locales que ya tienen web pero rota/anticuada)

```
Hola, equipo de {{NAME}},

Vi que tenéis web ({{OLD_URL}}) y aunque me consta que da
servicio, hoy día las webs así pierden reservas. Os explico: el
móvil ya supera el 78 % del tráfico, y vuestra web actual no se ve
bien en pantalla pequeña.

Os he hecho una propuesta para sustituirla: {{DEMO_URL}}
```
