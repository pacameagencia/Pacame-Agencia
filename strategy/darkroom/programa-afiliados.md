# DarkRoom Crew — Programa de Embajadores

> **Estado**: v2.0 — estructura final aprobada por Pablo (2026-04-29).
> **Owner**: Pablo + NEXUS (operaciones) + CORE (implementación).
> **Pre-requisito leído**: `positioning.md`.

---

## El nombre: por qué "DarkRoom Crew"

"Programa de afiliados" es genérico, suena a TimeShare. **"DarkRoom Crew"** es:

- **Tribal**: la gente que usa DarkRoom no son clientes, son crew.
- **Game-vibe**: encaja con un sistema de tiers progresivo (rango militar / videojuego).
- **Sin connotación spam**: no asocias afiliado con "el que llena tu DM con links cutres".
- **Memorable**: una palabra, fácil de mencionar oralmente.

Slogan interno: **"Trae a tu gente. Sube de rango. Cobra cada mes."**

---

## Estructura de comisión final (decisión Pablo)

Sistema **escalonado por volumen total** con dos componentes en cada tier:

1. **Pago único** (one-time) cuando el referido convierte trial→paid y se mantiene >30 días.
2. **Pago recurrente mensual acumulativo** mientras el referido siga activo (paid).

| Rango DarkRoom Crew | Refs activos | Pago único | Recurrente mensual |
|---|---|---|---|
| 🎬 **Init** | 1-10 | 5 € | 1 € / ref / mes |
| 🎞️ **Active** | 11-20 | 6 € | 2 € / ref / mes |
| 🎥 **Pro** | 21-30 | 7 € | 3 € / ref / mes |
| 📽️ **Director** | 31-40 | 8 € | 4 € / ref / mes |
| 🎟️ **Producer** | 41-50 | 9 € | 5 € / ref / mes |
| 🌟 **TOP** | 51+ | 10 € (TOPE) | 5 € / ref / mes (TOPE) |

**Reglas duras**:
- El "rango actual" se calcula sobre los **refs activos** (paid en este momento, no histórico). Si un ref churna, baja del contador.
- Cuando subes de rango, TODOS tus refs activos pasan al rate del nuevo rango (retroactivo en ese mes — máximo motivador).
- TOPE pago único: **10 € por ref**.
- TOPE recurrente: **5 € / ref / mes**.
- Pago mensual día 5 vía PayPal o SEPA. Mínimo 50 € para retirar (acumula si no llegas).
- Cookie tracking: **30 días**.
- Si un ref pide refund en <30 días, se descuenta su comisión del próximo payout.

### Ejemplo real — qué cobra un afiliado TOP

Un creator con **50 refs activos en plan Pro 29 €/mes** (escenario optimista año 1):

**Pagos únicos acumulados** (al ascender, no se renegocian los pasados):
- Refs 1-10 (Init): 10 × 5 € = 50 €
- Refs 11-20 (Active): 10 × 6 € = 60 €
- Refs 21-30 (Pro): 10 × 7 € = 70 €
- Refs 31-40 (Director): 10 × 8 € = 80 €
- Refs 41-50 (Producer): 10 × 9 € = 90 €
- **Total one-time**: **350 €**

**Pago mensual recurrente** estando en rango Producer (con 50 refs activos × 5 €):
- 50 × 5 € = **250 € / mes recurring**.

Si llega a 60 refs activos (rango TOP), recurrente = 60 × 5 € = **300 €/mes** (ya en TOPE).

**Cálculo anual**: 350 € one-time + (250 + 300) / 2 × 12 ≈ **3.650 €/año pasivos** mientras los refs sigan activos.

Para DarkRoom: estos 50-60 refs generan 1.450-1.740 €/mes MRR. Pagar 250-300 € al afiliado = **17% del MRR generado**. Margen DarkRoom: 83%.

---

## Cómo se decora el programa para que parezca lo que es: una oportunidad real

### Landing pública `/crew`

**Hero**:

> **DarkRoom Crew**
> Trae a tu gente. Sube de rango. Cobra cada mes.
>
> Si tu audiencia paga 200 €/mes en stack creativo, le ahorras 2.500 €/año. Y tú ganas hasta **3.500 €/año pasivos** con 50 refs activos.

**Calculadora interactiva** (lado a lado de los rangos):

```
Si tienes [_____] refs activos →
   Rango: [Director]
   Cobras este mes: [187 €]
      · 80 € one-time del último ref
      · 107 € recurring de 32 refs activos × 4 €/mes
   Refs hasta el siguiente rango: [9 más]
```

**Ladder visual** (los 6 rangos como un game progress bar) con badges/emojis distintos.

**Live leaderboard** (con permiso del afiliado): Top 5 del mes, cada uno con su rango y cuántos refs trajo. Foto + nombre + handle público + total comisiones del mes.

**Ejemplos reales** (cuando los haya): "Lucia (motion design, 18k IG followers) lleva 47 refs y cobra 235 €/mes recurring + 372 € en bonus únicos en 4 meses. Total: 1.412 € pasivos hasta ahora."

**Sección "perks no monetarios"**:

- 🎁 **DarkRoom Crew Lifetime**: al alcanzar Director (31 refs), tu propia membresía DarkRoom es gratis para siempre.
- 🚀 **Acceso anticipado**: a tools nuevas (mockup batch, hooks tool, etc.) antes que el público general.
- 📣 **Mention en redes**: Top 5 mensual citado en RRSS DarkRoom (con permiso).
- 🤝 **Llamada directa con Pablo**: 1 vez/trimestre los TOP tienen call estratégica.
- 🎬 **Exclusive Discord channel**: `#crew-pro` para Director+ con anuncios anticipados, beta features y red de creators.
- 🏆 **Premio anual TOP del año**: gift personalizado (cámara o equipo creativo de 500 €).

### CTAs:

> **Aplicar a la Crew** → formulario simple (nombre, plataforma principal, audiencia aproximada, link del último contenido).

> **¿Cómo funciona?** → toggle expansible con 3 pasos (aplica → te aprobamos en 48h → recibes tu link y kit).

---

## Flujo de tracking (técnico)

### Schema Supabase (`dark-room-prod`)

```sql
-- Tabla principal de afiliados (Crew members)
create table crew_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  slug text unique not null,                    -- ej "lucia-motion" → /?ref=lucia-motion
  display_name text not null,
  email text not null,
  payment_method text not null,                 -- 'paypal' | 'sepa'
  payment_details jsonb not null,               -- {paypal_email} o {iban, beneficiary}
  status text not null default 'pending',       -- 'pending' | 'active' | 'suspended' | 'rejected'
  current_rank text not null default 'init',    -- 'init' | 'active' | 'pro' | 'director' | 'producer' | 'top'
  notes text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

-- Clicks anónimos (cookie tracking)
create table crew_clicks (
  id bigserial primary key,
  member_id uuid not null references crew_members(id),
  ip_hash text not null,                        -- SHA256(ip + salt) para privacy
  user_agent text,
  referrer text,
  landing_path text,
  utm jsonb,
  created_at timestamptz not null default now()
);

-- Conversiones (trial→paid → mantiene >30d)
create table crew_conversions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references crew_members(id),
  user_id uuid not null references auth.users(id),
  stripe_customer_id text not null,
  stripe_subscription_id text,
  status text not null default 'trial',         -- 'trial' | 'paid' | 'churned' | 'refunded'
  cookie_set_at timestamptz not null,
  paid_started_at timestamptz,
  rank_at_conversion text,                      -- snapshot del rango cuando convirtió
  unique_payout_amount numeric(10,2),           -- pago one-time (5-10€ según rango)
  recurring_rate numeric(10,2),                 -- € por mes (1-5€ según rango)
  churned_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id)
);

-- Payouts mensuales
create table crew_payouts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references crew_members(id),
  period_year int not null,
  period_month int not null,
  one_time_eur numeric(10,2) not null default 0,
  recurring_eur numeric(10,2) not null default 0,
  bonus_eur numeric(10,2) not null default 0,           -- ascensos retroactivos, premios especiales
  clawback_eur numeric(10,2) not null default 0,        -- refunds de refs <30d
  total_eur numeric(10,2) not null default 0,
  status text not null default 'pending',               -- 'pending' | 'paid' | 'failed'
  paid_at timestamptz,
  payment_reference text,
  notes text,
  created_at timestamptz not null default now(),
  unique(member_id, period_year, period_month)
);

-- Vista materializada del leaderboard
create materialized view crew_leaderboard_monthly as
select
  m.id, m.display_name, m.slug, m.current_rank,
  count(c.id) filter (where c.status = 'paid') as active_refs,
  sum(p.total_eur) as month_earnings_eur
from crew_members m
left join crew_conversions c on c.member_id = m.id
left join crew_payouts p on p.member_id = m.id
  and p.period_year = extract(year from now())
  and p.period_month = extract(month from now())
where m.status = 'active'
group by m.id, m.display_name, m.slug, m.current_rank
order by month_earnings_eur desc nulls last;

create index on crew_clicks(member_id, created_at);
create index on crew_conversions(member_id, status);
create index on crew_payouts(member_id, period_year, period_month);
```

### Lógica del rank y comisiones

```typescript
// web/lib/crew/rank.ts
export const RANKS = [
  { name: 'init',     min: 1,  max: 10, oneTime: 5,  recurring: 1, label: '🎬 Init',     bgColor: '#1a1a1a' },
  { name: 'active',   min: 11, max: 20, oneTime: 6,  recurring: 2, label: '🎞️ Active',   bgColor: '#2a1f0d' },
  { name: 'pro',      min: 21, max: 30, oneTime: 7,  recurring: 3, label: '🎥 Pro',      bgColor: '#3a1a1a' },
  { name: 'director', min: 31, max: 40, oneTime: 8,  recurring: 4, label: '📽️ Director', bgColor: '#4a1a26' },
  { name: 'producer', min: 41, max: 50, oneTime: 9,  recurring: 5, label: '🎟️ Producer', bgColor: '#5a1530' },
  { name: 'top',      min: 51, max: Infinity, oneTime: 10, recurring: 5, label: '🌟 TOP', bgColor: '#7a1f3a' },
] as const;

export function getRank(activeRefs: number) {
  return RANKS.find(r => activeRefs >= r.min && activeRefs <= r.max) ?? RANKS[0];
}

export function calcMonthlyPayout(memberId: string, period: { year: number; month: number }) {
  // 1. Cuenta refs activos del mes
  // 2. Determina rango actual
  // 3. Suma one-time payouts de conversiones nuevas en este mes
  // 4. Suma recurring (active_refs * rank.recurring)
  // 5. Resta clawbacks de refunds <30d
  // 6. Aplica TOPE: 10€ one-time, 5€ recurring
}
```

### Endpoints Next.js

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/crew/track?ref=<slug>` | Registra click, escribe cookie, redirige a landing principal |
| POST | `/api/crew/apply` | Formulario público → registra `crew_members` con status `pending` |
| GET | `/app/crew/dashboard` | Dashboard del Crew member (refs, clicks, comisiones, próximo payout) |
| GET | `/api/crew/leaderboard` | Devuelve top N públicos del mes (con consentimiento) |
| POST | `/api/crew/payouts/calculate` | Cron mensual día 1 — calcula payouts |
| POST | `/api/crew/payouts/[id]/pay` | Admin marca como pagado tras transferencia real |

---

## Onboarding del Crew Member

### 1. Aplicación

Formulario simple en `/crew/apply`:

- Nombre + email
- Plataforma principal (LinkedIn / X / IG / TikTok / YouTube / newsletter / otra)
- Handle público
- Audiencia aproximada
- Link al último contenido publicado
- Por qué quieres entrar (texto libre)

### 2. Revisión Pablo (<48h)

Criterios de aceptación:

- ✅ Audiencia mínima 1.000 followers/subs en alguna plataforma.
- ✅ Contenido alineado con creators visuales / freelancers / digital workers hispanos.
- ✅ Tono honesto/educativo (no influencer cutre o spammer).
- ✅ Sin historial de scams o promesas falsas en su contenido.
- ❌ Si solo trae "audiencia comprada" o "growth con bots", se rechaza.

### 3. Onboarding Kit

Email automático tras aprobación con:

- Tu URL personal: `darkroomcreative.cloud/?ref=<tu-slug>`
- Acceso a `/app/crew/dashboard` (refs, clicks, comisiones en tiempo real).
- Tu perfil público en el leaderboard (opcional).
- **5 plantillas de copy listas** (ver abajo).
- Banner OG personalizable (con tu nombre).
- Calendario sugerido de promoción (cuándo postear, qué tipo).
- FAQ del programa.
- **Primera membresía DarkRoom Pro gratis** (un mes) para que la pruebes antes de promocionar.
- Acceso al canal Discord `#crew-init` para preguntas a Pablo y otros members.

---

## Banca de copy lista para Crew Members

5 plantillas que el creator adapta a SU voz (no copia):

### Plantilla 1 — Hilo Twitter/X

```
Mi stack creativo me costaba 240€/mes hasta hace 6 meses.

Hoy pago 29€.

Sin piratería. Sin Krita. El stack premium completo (Adobe, Figma, ChatGPT, Midjourney).

Es membresía colectiva. Te explico cómo funciona 👇

[hilo de 6 tweets explicando]

Si te ahorra dinero (a mí 2.500€/año), aquí: <link?ref=tu-slug>
```

### Plantilla 2 — Post LinkedIn

```
Llevo 6 meses con DarkRoom. Datos reales.

Stack: Adobe CC + Figma Pro + ChatGPT + Midjourney
Antes: 240€/mes en 5 facturas distintas
Ahora: 29€ en una sola

¿Cómo? Membresía colectiva. Acceso compartido a cuentas premium gestionadas.

Es zona gris dentro de los términos de los proveedores y ellos lo asumen como parte del modelo. Pero si llevas 2 años pagando como yo, sabes que el sistema está roto desde hace mucho.

Te lo cuento sin filtros: <link?ref=tu-slug>
```

### Plantilla 3 — Reel/TikTok script

```
[CAM 1, primer plano]
"Pagaba 240€ al mes en herramientas de diseño."

[B-roll, screenshots facturas Adobe]
"Hasta que descubrí esto."

[CAM 1]
"29€ por exactamente el mismo stack. Lo cuento sin filtros."

[B-roll, demo dashboard DarkRoom]
"Membresía colectiva. Acceso gestionado. Zona gris pero asumido por ellos."

[CAM 1]
"Si pagas más de 100€/mes en stack creativo, link en bio. Mi link, claro."
```

### Plantilla 4 — Carrusel Instagram (10 slides)

```
Slide 1: "Mi stack creativo me costaba 240€/mes" (foto factura blurred)
Slide 2-3: detalle de qué pagaba (lista honesta)
Slide 4: "Hasta que probé DarkRoom"
Slide 5-6: explicación membresía colectiva (transparente, honesta)
Slide 7: "Esto NO es para ti si necesitas licencias enterprise auditables"
Slide 8: "Esto SÍ es para ti si pagas Adobe + Figma + 1 IA y eres freelance"
Slide 9: "Yo lo uso 6 meses, así estoy"
Slide 10: "Link en bio para 14 días gratis sin tarjeta. Es mi link, gano comisión, lo digo."
```

### Plantilla 5 — Email a tu newsletter

```
Hola {nombre},

Hoy quiero contarte algo concreto: la herramienta que me ahorra 200€ al mes.

Se llama DarkRoom. Es membresía colectiva del stack creativo (Adobe, Figma, IA).
29€/mes vs 240€ que pagaba antes.

Es zona gris en términos de uso compartido. Si necesitas licencias 100% limpias para empresa, NO es para ti. Para freelance que paga retail completo, es la diferencia entre alquiler y stack creativo.

14 días gratis sin tarjeta: <link?ref=tu-slug>

Transparencia total: si te suscribes con mi link, gano comisión. Por eso te lo recomiendo solo si encaja contigo.

Si tienes cualquier duda, respóndeme.
```

---

## Lista inicial de 30 candidatos a contactar (Crew outreach Mes 1-2)

Hispanos, nicho creativo visual, audiencia 5k-100k.

| # | Tipo | Plataforma | Tamaño | Razón |
|---|---|---|---|---|
| 1-5 | Diseñador UI freelance | LinkedIn/X | 10-30k | Audiencia 100% target |
| 6-10 | Motion designers | Instagram | 5-50k | Pagan stack premium |
| 11-15 | Ilustradores digitales | Instagram | 5-50k | Comparten dolor |
| 16-20 | Educators Adobe/Figma español | YouTube | 5-100k | Audiencia muy específica |
| 21-25 | Creators IA generativa | Twitter+IG | 5-50k | High overlap stack DarkRoom |
| 26-30 | Newsletter writers nicho creativo | Substack/email | 1-10k subs | Audience cualificada |

(Lista nominal con handles concretos: ver `strategy/darkroom/crew-outreach-list.md` cuando se rellene.)

### Plantilla outreach (personalizado obligatorio)

```
Asunto: DarkRoom Crew · 5-10€ por ref + recurring por cada mes que duren

Hola {nombre},

Soy Pablo, fundador de DarkRoom — membresía colectiva del stack creativo premium (Adobe, Figma, ChatGPT, Midjourney) por 29€/mes en lugar de 240€.

{Línea PERSONAL — algo de su contenido reciente que demuestre que lo he leído de verdad}

Te invito a la **DarkRoom Crew** — programa de embajadores con escalera por volumen:

· Refs 1-10: cobras 5€ one-time + 1€/mes recurring por cada uno mientras siga.
· Refs 11-20: 6€ one-time + 2€/mes.
· Refs 21+: hasta 10€ one-time + 5€/mes (TOPE).
· Si llegas a 50 refs activos, eso son 350€ acumulado one-time + 250€/mes recurring pasivo.
· Tu propia membresía DarkRoom gratis al alcanzar Director (31 refs).
· Llamada trimestral conmigo para los TOP.

Si te interesa, te paso primero **trial completo gratis** (sin tarjeta, sin trial limit) para que lo uses 30 días y veas si encaja contigo antes de promocionar.

Sin presión. Si no es para ti, perfecto, gracias por leer.

— Pablo · DarkRoom
support@darkroomcreative.cloud
```

**Reglas outreach**:
- Cero copy/paste masivo. Cada email PERSONALIZADO con referencia real al creator.
- Máx 5 outreach/día (calidad > cantidad).
- Si responden NO, agradeces y nunca vuelves a contactar.
- Si SÍ → trial gratis lifetime para ese creator (gasto bajo, valor reputacional alto).

---

## Reglas duras de la Crew

1. **Cero spam permitido**. Cold DM masivo / sitios de cupones cutres → suspensión sin pagos pendientes.
2. **Cero auto-promo** (un Crew member no puede comprar con su propio link).
3. **Refund clawback**: si un ref pide reembolso en <30 días, se descuenta esa comisión del próximo payout.
4. **Suspensión por modelo deceptivo**: si un Crew member vende "Adobe gratis", "DarkRoom = piratería", suspendido. Voz honesta es la regla.
5. **No exclusividad**: el Crew member puede promocionar competidores. Confiamos en la honestidad del producto.
6. **Datos transparentes**: el dashboard muestra al Crew member SUS clicks, conversions, churn de SUS leads en tiempo real.
7. **Pago puntual día 5**: si retraso, comunicamos antes y pagamos +5% como compensación.
8. **Rank no se hereda**: si churnan refs y bajas de rango, la próxima conversión se paga al rate del rango actual (no el histórico).
9. **TOPE inquebrantable**: 10€ one-time / 5€ recurring por ref. No hay "deal especial" ni excepciones.

---

## Roadmap del programa Crew

| Hito | Fecha objetivo |
|---|---|
| Schema SQL + endpoints + cookie tracking | Mes 0 día 14 |
| Landing pública `/crew` con calculadora interactiva + leaderboard | Mes 1 día 7 |
| 3 Crew members invitados manualmente (creators conocidos de Pablo) | Mes 1 sem 1 |
| Programa público con formulario apply | Mes 2 sem 1 |
| Outreach 30 candidatos | Mes 2-3 |
| Primer payout > 50 € a un Crew member | Mes 2 fin |
| Discord channel `#crew-pro` para Director+ | Mes 3 |
| Premio anual TOP del año | Mes 12 |
| Integrar Rewardful o Tolt para automatizar pagos | Cuando >50 Crew members activos |

---

## KPIs del programa

| Métrica | Mes 1 | Mes 3 | Mes 6 |
|---|---|---|---|
| Crew members aprobados | 3 | 12 | 30 |
| Crew activos (≥1 venta mes) | 1 | 8 | 20 |
| % MRR via Crew | 5% | 25% | 40% |
| Coste medio por ref | 6 € | 10 € | 15 € |
| Top Crew: € comisión/mes | 50 € | 200 € | 500 € |
| Conversion ratio click→trial | 8% | 12% | 15% |
| Conversion ratio trial→paid via Crew | 35% | 40% | 45% |

---

## Lo que falta de Pablo

1. ✅ Estructura comisión confirmada (5-10€ one-time + 1-5€ recurring + TOPES).
2. ⏳ **Lista de 3 creators conocidos** para invitar manualmente al Mes 1 sem 1.
3. ⏳ **Confirmar nombre comercial** "DarkRoom Crew" o sugerir alternativa.
4. ⏳ **Confirmar perks no monetarios** (Lifetime gratis al Director, llamada Pablo, premio anual).
5. ⏳ **Canal de pago primario**: PayPal o SEPA.

Sin las 5, el programa queda en docs. Con las 5, CORE arranca implementación en 5-7 días.
