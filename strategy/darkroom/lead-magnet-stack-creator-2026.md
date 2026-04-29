# DarkRoom — Lead Magnet "Stack del Creator 2026"

> **Estado**: v1.0 brief operativo · pendiente producción.
> **Owner**: Pablo (contenido) + COPY (textos) + CORE (endpoint captura).
> **Pre-requisito leído**: `positioning.md`, `programa-afiliados.md`.

---

## Por qué

- 95% de las views en RRSS no se convierten en email. Sin email, no hay funnel.
- El lead magnet **rompe esa caja**: pega URL → email → secuencia automatizada → Pro 24,90€.
- Ratio típico SaaS B2C: 30% de los views entregan email · 5-15% del email convierte a paid.
- Objetivo mes 1: **500 emails capturados → 25-75 conversions Pro**.

---

## Producto

**Notion público** + **PDF descargable** (Notion exporta PDF nativo).

Por qué Notion en vez de PDF a secas:
- Indexable Google → tráfico SEO orgánico futuro
- Embeds vivos (videos, imágenes, links a tools)
- Compartible: el lead lo manda a un amigo → captura virótica
- Editable post-launch sin re-distribuir nada

**Título**: "El Stack del Creator 2026 · 12 herramientas IA por 0,83€/día"

**Subtítulo**: "Lo que pago realmente en mi stack creativo, herramienta por herramienta. Honesto. Sin marketing barato."

---

## Estructura del Notion (24 secciones)

### Portada (1 sección)

- Título grande Anton ALL CAPS
- Subtítulo Space Grotesk
- "Por Pablo Calleja · 2026"
- Línea: "Esto es lo que uso cada día. Lo que ahorra. Lo que evito."
- CTA pequeño: "🎁 Si quieres acceso al stack completo · darkroomcreative.cloud"

### Intro (1 sección)

- 3 párrafos honestos:
  1. Por qué el stack creativo se ha vuelto inasumible (308€/mes 2026)
  2. Qué cambió en 2026: 12 herramientas IA que valen su peso
  3. Cómo está organizada esta guía (3 minutos por tool)

### Las 12 herramientas (12 secciones · 1 por tool)

Plantilla por tool:

```
═══════════════════════════════════════
[NÚMERO] · [HERRAMIENTA]
[Categoría] · [Precio retail]/mes
═══════════════════════════════════════

🎯 Para qué sirve
   [2-3 líneas, qué hace en cristiano]

💡 Mejor caso de uso
   [Caso concreto: "yo la uso para X"]

🔧 Cómo la uso (preset / prompt-template)
   [1 prompt template copy-paste o preset]

🖼️ Captura
   [Screenshot real]

📊 Stats reales
   - Tiempo que me ahorra al mes: X horas
   - Cuánto pagaba antes: X €
   - Cuánto pago ahora: X €

🎁 Acceso barato
   "Si te interesa el stack completo · darkroomcreative.cloud · 24,90€/mes"
```

Las 12 a cubrir (orden sugerido):

| # | Tool | Categoría | Mejor caso |
|---|---|---|---|
| 1 | ChatGPT Plus | LLM texto | Drafts copy + research |
| 2 | Claude Pro | LLM texto + código | Análisis largos · code |
| 3 | Gemini Advanced | LLM multimodal | Imagen + texto · doc parsing |
| 4 | Canva Pro | Diseño | Posts + templates · sin Adobe |
| 5 | CapCut Pro | Video | Edit reels rápido |
| 6 | Freepik Premium+ | Stock + AI | Plantillas + Mystic IA |
| 7 | Higgsfield AI | IA video | Cinematic videos virales |
| 8 | ElevenLabs Pro | IA voz | TTS español castellano |
| 9 | Minea | Dropshipping spy | Productos winning |
| 10 | Dropsip.io | Dropshipping ops | Gestión tienda |
| 11 | PiPiAds | Spy ads TikTok | Ad creatives competencia |
| 12 | Seedance | IA video | Image-to-video premium |

### Tabla resumen (1 sección)

Tabla bonita con paleta DarkRoom (acid + bg + white):
- 12 tools · precio retail · total = 308€
- "Si las pagaras separadas: 3.696€/año"
- "Con DarkRoom Pro: 299€/año · ahorras 3.396€"

### Cierre + CTA (1 sección)

- "¿Por qué te he dado esto gratis?" (3 líneas honestas: porque mi negocio es el stack en sí, no el PDF)
- CTA grande: "Empezar 14 días gratis · darkroomcreative.cloud"
- CTA secundario: "O entrar en DarkRoom Crew (afiliados) y monetizar tu audiencia"

---

## Captura del email

### Flujo técnico

```
1. Lead llega a Notion público (link en bio @pacamespain · sticker stories · reels)
2. Notion muestra el contenido FREE pero al inicio: "Si quieres el PDF descargable, déjame tu email"
3. Form Tally embebido en Notion → POST a /api/darkroom/lead
4. /api/darkroom/lead:
   - INSERT en darkroom_leads (email, source_utm, captured_at, status='captured', current_email_step=0)
   - Trigger Resend send email_0 (PDF + bienvenida)
5. Cron diario darkroom-leads-cadence:
   - Para cada lead con status='captured', enviar email correspondiente al día (2/4/7/14)
   - Avanzar current_email_step
```

### Tabla `darkroom_leads`

```sql
CREATE TABLE darkroom_leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL UNIQUE,
  source_utm      text,                       -- ig_bio | story_swipe | reel_dia_3 | etc
  captured_at     timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'captured',  -- captured | converted | unsubscribed
  current_email_step int NOT NULL DEFAULT 0,  -- 0,1,2,3,4 (corresponde a email_0, email_2, email_4, email_7, email_14)
  converted_at    timestamptz,
  unsubscribed_at timestamptz
);
CREATE INDEX idx_leads_status ON darkroom_leads(status);
CREATE INDEX idx_leads_step ON darkroom_leads(current_email_step);
```

---

## Secuencia de 5 emails

### Email 0 (día 0) — entrega + bienvenida

**Subject**: "Tu stack del Creator 2026 está aquí"
**From**: `Pablo @ DarkRoom <support@darkroomcreative.cloud>`

Body (≤ 200 palabras):
```
[FIRSTNAME],

Aquí está · 12 herramientas IA. Lo que pago al mes. Lo que ahorra.

→ [link Notion público]
→ [link descarga PDF]

Honesto: si te interesa montar el stack completo sin pagar 308€/mes, mi
proyecto se llama DarkRoom · 24,90€/mes · 14 días gratis · sin tarjeta.

darkroomcreative.cloud

En 2 días te mando algo más. Cómo monté esto sin tirar de gurú-marketing.

— Pablo
```

### Email 2 (día 2) — storytelling

**Subject**: "Cómo monté DarkRoom · 0 → ✓"

Body: Pablo cuenta su historia honesta. 3 párrafos:
- Pagaba 280€/mes en suscripciones · creator solo
- Vio el modelo group buy hispano cutre · decidió hacer una versión bien hecha
- Ahora 100+ creators usan DarkRoom · primer mes facturó X€

CTA: link a darkroomcreative.cloud

### Email 4 (día 4) — comparativa

**Subject**: "308€ vs 24,90€ · math, no marketing"

Body: La comparativa pieza a pieza. ChatGPT 22€ + Claude 22€ + ... = 308€. DarkRoom: 24,90€. Por qué cuesta tan poco (group buy explained con honestidad).

CTA: link a checkout 14 días gratis.

### Email 7 (día 7) — oferta directa

**Subject**: "Es ahora · 14 días gratis"

Body: 3 líneas. "Han pasado 7 días. Si esto va contigo, empieza el trial. Si no, no te molesto más con esto."

CTA: trial 14 días.

### Email 14 (día 14) — Lifetime drop

**Subject**: "Lifetime 349€ · quedan X plazas"

Body: Si no se ha convertido a Pro, ofrecer Lifetime con escasez real ("este mes solo X plazas a 349€"). Math: amortiza en 35 días.

Si abre y no clic → marcar como `cold` y pasar a newsletter mensual baja frecuencia.

---

## Tracking & métricas

### KPIs primer mes

| Métrica | Objetivo | Real |
|---|---|---|
| **Emails capturados** | 500 | TBD |
| **Open rate email 0** | >60% | TBD |
| **Click rate email 0** | >25% | TBD |
| **Conversion lead → trial Pro** | >10% | TBD |
| **Conversion trial → paid** | >50% (es solo si dejaron tarjeta · trial sin tarjeta es más bajo) | TBD |
| **Total subs Pro desde lead magnet mes 1** | 50 | TBD |

### UTM scheme

- `?utm_source=ig_bio&utm_medium=link&utm_campaign=stack-creator-2026`
- `?utm_source=story&utm_medium=swipe&utm_campaign=stack-creator-2026`
- `?utm_source=reel&utm_medium=organic&utm_campaign=stack-creator-2026&utm_content=dia_3`

---

## Distribución del lead magnet (mes 1)

- **Bio @pacamespain**: link permanente al Notion (slot principal)
- **Sticker daily stories**: 1 story/día menciona el lead magnet con sticker `link`
- **4 reels dedicados**: días 3, 10, 17, 24 — cada uno cubre 3 herramientas del stack
- **Pinned post IG**: carrusel "Mi stack 2026" con CTA al lead magnet
- **Comments hooks**: en reels populares, comentar como Pablo "el stack completo aquí · link bio"
- **Foros**: en r/Emprender y r/dropship cuando se mencione tools, dropear link
- **Email signature**: "P.D. Stack del Creator 2026 · 12 herramientas IA · gratis · darkroomcreative.cloud/stack"

---

## Out of scope (mes 2+)

- Versión inglés del lead magnet (cuando MRR>1k€)
- Vídeo curso en YouTube ampliando el contenido
- Quiz "¿Qué stack te conviene?" con segmentación
- Lead magnet sectorial: "Stack del Dropshipper 2026", "Stack del Diseñador 2026"

---

**Versión**: 1.0 · **Fecha**: 2026-04-29
