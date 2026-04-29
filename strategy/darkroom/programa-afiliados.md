# DarkRoom — Programa de Afiliados

> **Estado**: v1.0 listo para implementar.
> **Owner**: Pablo + NEXUS (ops) + CORE (tech).
> **Fecha**: 2026-04-29.
> **Pre-requisito**: aprobación de la **estructura de comisión** (3 opciones al final).

---

## Por qué afiliados

DarkRoom no se promociona en Google Ads agresivamente (riesgo de detección por proveedores). El **canal orgánico + creators recomendando** es el motor de crecimiento sostenible y bajo radar.

Modelo análogo: Notion creció con afiliados creators. Webflow lo hizo. Loom lo hizo. Funciona porque:

1. **Trust transferido**: el creator ya tiene credibilidad, el seguidor confía.
2. **Coste solo si convierte**: pagas por resultado, no por impresión.
3. **Bajo radar**: las recomendaciones distribuidas no levantan flags de proveedores.
4. **Audiencia segmentada**: cada creator tiene su micro-nicho (motion, ilustración, video).

---

## Estructura de comisión — 3 opciones, recomendación

### Opción A — **30% recurrente primer año + 50€ bonus** ⭐ RECOMENDADA

- **30% del MRR** que genera el afiliado durante los primeros 12 meses de cada miembro.
- **50€ bonus** cuando un trial convierte a paid Y se mantiene >30 días.
- Cookie de tracking: **30 días**.
- Pago mínimo retirada: **50€**.
- Pago el día 5 de cada mes vía PayPal o transferencia SEPA.
- Tras 12 meses, comisión recurrente baja a **10%** (vitalicia).

**Ejemplo real**: un creator manda 10 paid sub Pro (29€/mes). Comisión:
- Mes 1: 30% × 10 × 29€ = 87€ + 10 × 50€ bonus = **587€**
- Meses 2-12: 30% × 10 × 29€ = 87€/mes × 11 = **957€**
- **Total año 1**: 1.544€
- Año 2 en adelante: 10% × 10 × 29€ = 29€/mes vitalicio = **348€/año pasivo**

Ventaja: incentivo grande primer año (+ recurring) → motiva a creators a empujar fuerte y mantener al miembro. No hay incentivo a "vender y olvidar".

### Opción B — **50€ flat por sub que pase trial**

- Pago único de **50€** por cada miembro que pase del trial 14d a paid + se mantenga >30 días.
- Cookie 30 días. Pago mínimo 50€. Mismas condiciones de pago.

**Ejemplo**: 10 paid → 500€. Ganancia única, no recurrente.

Ventaja: simple, predecible para el afiliado.
Desventaja: incentivo a vender volumen sin importar churn. Y si DarkRoom retiene mal, paga por nada.

### Opción C — **40% lifetime sin bonus**

- 40% recurrente del MRR del miembro mientras siga pagando. Para siempre.
- Sin bonus inicial.

**Ejemplo**: 10 paid Pro × 29€ × 12 meses = 3.480€ × 40% = **1.392€/año recurrente**.

Ventaja: muy atractivo a creators serios que lo ven como "renta pasiva" futura.
Desventaja: brutal si churn baja al 3% y se acumulan miembros. Margen real para DarkRoom = 60% del MRR para siempre.

---

### Recomendación DIOS: **Opción A**

Razones:
- Incentivo fuerte primer año → motiva push agresivo de creators.
- Bonus 50€ por trial→paid alinea el creator con la **calidad** del lead, no solo la cantidad.
- Recurring 30% año 1 → creator lo siente como sueldo sostenible, no comisión puntual.
- Año 2 baja a 10% → margen DarkRoom recupera, creator ya tiene flujo nuevo.
- Cookie 30 días estándar (no 90+ que canibaliza otras campañas).

**Pendiente Pablo**: confirmar A / B / C antes de Mes 0 día 14.

---

## Cómo se trackea (técnico)

### Schema Supabase (`dark-room-prod`)

```sql
create table affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id), -- el propio afiliado tiene cuenta
  slug text unique not null, -- ej "lucia-design" → darkroomcreative.cloud/?ref=lucia-design
  name text not null,
  email text not null,
  payment_method text not null, -- 'paypal' | 'sepa'
  payment_details jsonb not null, -- {paypal_email} o {iban, beneficiario}
  status text not null default 'pending', -- 'pending' | 'active' | 'suspended' | 'rejected'
  notes text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table affiliate_clicks (
  id bigserial primary key,
  affiliate_id uuid not null references affiliates(id),
  ip_hash text not null, -- hash + salt para anonimizar
  user_agent text,
  referrer text,
  landing_path text,
  created_at timestamptz not null default now()
);

create table affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id),
  user_id uuid not null references auth.users(id),
  stripe_customer_id text not null,
  stripe_subscription_id text,
  status text not null default 'trial', -- 'trial' | 'paid' | 'churned' | 'refunded'
  paid_started_at timestamptz,
  churned_at timestamptz,
  cookie_set_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(user_id) -- un usuario solo puede tener 1 afiliado asociado
);

create table affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id),
  period_year int not null,
  period_month int not null,
  amount_eur numeric(10,2) not null,
  bonus_count int not null default 0,
  recurring_amount numeric(10,2) not null default 0,
  status text not null default 'pending', -- 'pending' | 'paid' | 'failed'
  paid_at timestamptz,
  payment_reference text, -- ID PayPal o referencia bancaria
  notes text,
  created_at timestamptz not null default now(),
  unique(affiliate_id, period_year, period_month)
);

create index on affiliate_clicks(affiliate_id, created_at);
create index on affiliate_conversions(affiliate_id, status);
create index on affiliate_payouts(affiliate_id, period_year, period_month);
```

### Flujo de tracking

1. Creator comparte link `darkroomcreative.cloud/?ref=lucia-design`.
2. Frontend lee `?ref=` del query param → escribe cookie `darkroom_ref` con valor `lucia-design` y expiración 30 días.
3. También dispara `INSERT INTO affiliate_clicks` con IP hash + user agent (no PII).
4. Si el visitor pasa a trial → al crear el customer Stripe, se lee la cookie y se llama:
   ```
   INSERT INTO affiliate_conversions (affiliate_id, user_id, stripe_customer_id, status, cookie_set_at)
   ```
5. Webhook Stripe `customer.subscription.updated` → cuando trial → active → status = `paid`, `paid_started_at = now()`.
6. Cron mensual día 1 calcula `affiliate_payouts` del mes anterior y los inserta como `pending`.
7. Pablo aprueba pagos día 5 → marca como `paid` + envía via PayPal/SEPA.

### Endpoints Next.js

- `GET /api/affiliate/track?ref=<slug>` → registra click, escribe cookie, redirige.
- `POST /api/affiliate/register` → formulario público para nuevos afiliados (status `pending`).
- `GET /app/affiliate/dashboard` → dashboard del afiliado: clicks, conversions, comisiones acumuladas, payout próximo.
- `POST /api/affiliate/payout/calculate` (cron) → calcula payouts mensuales.

### Cookie

```js
// Set
document.cookie = `darkroom_ref=${ref}; max-age=${30*24*60*60}; path=/; secure; samesite=lax`;
// Read
const ref = document.cookie.match(/darkroom_ref=([^;]+)/)?.[1];
```

GDPR: cookie técnica de afiliación, no requiere consentimiento explícito (es esencial para el funcionamiento del enlace de afiliación). Documentar en política de cookies.

---

## Cómo se gestiona (operativo)

### Onboarding de un nuevo afiliado

1. Creator se registra en `darkroomcreative.cloud/afiliados` (formulario).
2. Notification email a Pablo con datos.
3. Pablo revisa en <48h: ¿es del nicho? ¿tiene audiencia mínima 1.000 followers en alguna plataforma? ¿no es spammer?
4. Si OK → aprueba en panel. Email automático al creator con su slug + link de afiliado + onboarding kit.
5. Onboarding kit incluye:
   - Dashboard URL
   - Link personal `darkroomcreative.cloud/?ref=<slug>`
   - 5 piezas de copy listas (post pitch breve, hilo, carrusel, reel script)
   - Banner OG personalizable
   - Calendario sugerido para promocionar
   - FAQ del programa

### Banca de copy lista para afiliados

5 plantillas listas para el creator (que él adapte a su voz):

**Plantilla 1 — Hilo Twitter/X**
```
Mi stack creativo me costaba 240€/mes hasta hace 6 meses.

Hoy pago 29€.

Sin piratería. Sin Krita ni alternativas open-source. El stack premium completo.

Es membresía colectiva. Te explico cómo funciona 👇
[hilo de 6 tweets explicando]

Si te ahorra dinero, regístrate aquí: <link?ref=slug>
```

**Plantilla 2 — Post LinkedIn**
```
Llevo 6 meses con DarkRoom. Datos reales:

- Stack: Adobe CC + Figma Pro + ChatGPT + Midjourney
- Antes: 240€/mes en 5 facturas distintas
- Ahora: 29€ en una sola

¿Cómo? Membresía colectiva. Acceso compartido a cuentas premium gestionadas.

Es zona gris dentro de los términos de los proveedores y ellos lo asumen como parte del modelo. Pero si llevas 2 años pagando como yo, sabes que el sistema está roto desde hace mucho.

Te lo cuento sin filtros: <link?ref=slug>
```

**Plantilla 3 — Reel Instagram/TikTok script**
```
[CAM 1, primer plano] "Pagaba 240€ al mes en herramientas de diseño."
[B-roll, screenshots facturas Adobe] "Hasta que descubrí esto."
[CAM 1] "29€ por exactamente el mismo stack. Lo cuento."
[B-roll, demo paletas + dashboard] "Membresía colectiva. Acceso gestionado."
[CAM 1] "Si pagas más de 100€/mes en stack creativo, link en bio."
```

**Plantilla 4 — Carrusel Instagram (10 slides)**
```
Slide 1: "Mi stack creativo me costaba 240€/mes" (foto factura blurred)
Slide 2-3: detalle de qué pagaba
Slide 4: "Hasta que probé DarkRoom"
Slide 5-6: explicación membresía colectiva (transparente, honesta)
Slide 7: "Esto NO es para ti si necesitas licencias enterprise"
Slide 8: "Esto SÍ es para ti si pagas Adobe + Figma + 1 IA"
Slide 9: "Yo lo uso 6 meses, así estoy"
Slide 10: "Link en bio para 14 días gratis sin tarjeta"
```

**Plantilla 5 — Email a tu newsletter**
```
Hola {nombre},

Hoy quiero contarte algo concreto: la herramienta que me ahorra 200€ al mes y que llevo usando 6 meses sin problemas.

Se llama DarkRoom. Es membresía colectiva del stack creativo (Adobe, Figma, IA). 29€/mes vs los 240€ que pagaba antes.

Es zona gris en términos de uso compartido, así que si necesitas licencias 100% limpias para empresa, NO es para ti. Para freelance que paga retail completo, es la diferencia entre alquiler y stack creativo.

14 días gratis sin tarjeta: <link?ref=slug>

Si tienes cualquier duda, respondes a este email.
```

---

## Lista inicial de afiliados a contactar (outreach Mes 1-2)

30 candidatos a invitar manualmente. Criterios: hispanohablante + nicho creator visual + audiencia 5k-100k followers + tono honesto/educativo (no influencer puro).

| # | Tipo creator | Plataforma principal | Tamaño audiencia | Razón |
|---|---|---|---|---|
| 1 | Diseñador UI freelance ES | LinkedIn + X | 10-30k | Audiencia 100% target |
| 2-5 | Motion designers ES/MX | Instagram | 5-50k | Pagan stack premium |
| 6-10 | Ilustradores digitales ES/AR/CL | Instagram | 5-50k | Comparten dolor |
| 11-15 | Educators de Adobe / Figma en español | YouTube | 5-100k | Audiencia muy específica |
| 16-20 | Creators IA generativa ES | Twitter + IG | 5-50k | High overlap con stack DarkRoom |
| 21-25 | Freelance marketers + designers híbridos | LinkedIn | 5-30k | Buen perfil de pago |
| 26-30 | Newsletter writers nicho creativo | Substack/email | 1-10k subs | Audience cualificada |

**Plantilla outreach personalizado**:

```
Asunto: programa afiliado DarkRoom · 30% recurring + 50€ bonus

Hola {nombre},

Soy {Pablo}, fundador de DarkRoom (membresía colectiva del stack creativo premium — Adobe, Figma, ChatGPT, Midjourney por 29€/mes en lugar de 240€).

Vi tu {última pieza concreta — leí su hilo, vi su reel, etc. demostrar que conozco al creator}. Encajas exactamente con quien recomendaría DarkRoom a tu audiencia.

Te ofrezco entrar en el programa de afiliados con condiciones premium:
· 30% recurrente del MRR primer año
· 50€ bonus por cada trial→paid
· Cookie 30 días
· Pago mensual directo PayPal/SEPA, mínimo 50€

Si 5 personas de tu comunidad se suscriben (paid Pro 29€/mes), eso son 87€/mes recurring + 250€ bonus = 337€ primer mes, 87€ pasivo cada mes después.

¿Te montaría sentido probarlo? Si quieres, te paso primero **trial completo gratis sin trial** para que lo uses y veas si encaja contigo antes de promocionar.

Sin presión. Si no es para ti, perfecto.

— Pablo · DarkRoom
support@darkroomcreative.cloud
```

**Reglas outreach**:
- Cero copy/paste masivo. Cada email PERSONALIZADO con referencia real al creator.
- Máx 5 outreach/día (para mantener calidad).
- Si responden NO, agradeces y nunca vuelves a contactar (respeto = boca a boca positivo aunque no convierta).
- Si SÍ → trial gratis lifetime para ese creator (gasto bajo, valor reputacional alto).

---

## Reglas duras del programa

1. **Cero spam permitido**. Si un afiliado hace cold DM masivo o publica en sitios de cupones cutres, suspendemos sin pagos pendientes.
2. **Cero auto-promoción** (un afiliado no puede comprar con su propio link).
3. **Refund clawback**: si un miembro pide reembolso en <30 días, se descuenta esa comisión del próximo payout.
4. **Suspensión por modelo deceptivo**: si un afiliado vende "Adobe gratis", "DarkRoom = piratería", etc., suspendido. Voz honesta es la regla.
5. **No exclusividad**: el afiliado puede promocionar competidores. Confiamos en la honestidad del producto.
6. **Datos transparentes**: el dashboard muestra al afiliado clicks, conversions, churn de SUS leads en tiempo real.
7. **Pago puntual día 5**: si retraso, comunicamos antes y pagamos +5% como compensación.

---

## Roadmap del programa

| Hito | Fecha objetivo |
|---|---|
| Estructura SQL + endpoints + cookie tracking | Mes 0 día 14 |
| 3 afiliados invitados manualmente | Mes 1 sem 1 |
| Programa público con formulario registro | Mes 2 sem 1 |
| Outreach 30 candidatos | Mes 2-3 |
| Primer payout > 50€ a un afiliado | Mes 2 fin |
| Programa **Embajadores VIP** (top 5, comisión vitalicia 40%) | Mes 4 |
| Dashboard con leaderboard público (top 10 afiliados con permiso) | Mes 5 |
| Integrar Rewardful o Tolt para automatizar pagos | Cuando >50 afiliados activos |

---

## KPIs del programa

| Métrica | Mes 1 | Mes 3 | Mes 6 |
|---|---|---|---|
| Afiliados aprobados | 3 | 12 | 30 |
| Afiliados activos (≥1 venta mes) | 1 | 8 | 20 |
| % MRR via afiliados | 5% | 25% | 40% |
| Coste medio por sub via afiliado | 95€ | 78€ | 65€ |
| Top afiliado: € comisión/mes | 50€ | 200€ | 500€ |

---

**Pendiente Pablo (decisiones bloqueantes)**:

1. **Confirmar Opción A / B / C** de comisión.
2. **Confirmar emails de payment**: ¿PayPal y SEPA? ¿Solo SEPA? ¿Stripe Connect cuando se separe?
3. **Lista inicial de 3 creators conocidos** para invitar manualmente al programa.

Sin estas 3 decisiones, el programa queda en docs. Con ellas, CORE arranca implementación en 5-7 días.
