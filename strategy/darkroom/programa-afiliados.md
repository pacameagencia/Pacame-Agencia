# DarkRoom — Programa de afiliados v1

> **Estado**: v1.0 — mecánica decidida por Pablo (2026-04-29). Pendiente implementación técnica.
> **Owner**: Pablo + NEXUS (operaciones) + CORE (implementación técnica).
> **Pre-requisito leído**: `positioning.md`, `brand-bible.md`.

---

## Mecánica · cifras canónicas

Sistema **plano simple** con dos componentes por referido:

| Pago | Cuándo | Importe |
|---|---|---|
| **One-time** | El referido se suscribe (primer pago confirmado en Stripe + supera el día 30 sin reembolso) | **5 €** |
| **Recurrente mensual** | Mientras el referido siga activo (paid · no churn) | **1 €/mes** |

**Bonus por tier-upgrade** del referido (Pro mensual → Lifetime 349€): **a definir** (placeholder: 10€ extra one-time cuando un referido upgrade a Lifetime).

### Reglas duras

- Cookie tracking: **30 días** desde primer click `?ref=<code>`.
- Si el referido pide refund antes del día 30, se descuenta la comisión.
- Pago al afiliado: mensual día 5 vía Stripe Connect (o PayPal/SEPA fallback).
- Mínimo retiro: **30 € acumulados** (evita micropagos).
- Cuando un referido churna (deja de pagar), el afiliado deja de recibir el +1€/mes desde el siguiente ciclo.
- Identidad del afiliado debe ser real (no anónima) — anti fraude / multi-cuenta.

### Ejemplos de cálculo

**Afiliado modesto** — 5 referidos activos en Pro 24,90€/mes:
- One-time acumulado: 5 × 5 € = **25 €** (primer mes)
- Recurrente mensual: 5 × 1 € = **5 €/mes**
- **Año 1**: 25 € + 12 × 5 € = **85 €** pasivos

**Afiliado activo** — 30 referidos:
- One-time acumulado: 30 × 5 € = **150 €**
- Recurrente: 30 × 1 € = **30 €/mes**
- **Año 1**: 150 € + 12 × 30 € = **510 €** pasivos

**Afiliado top** — 100 referidos:
- One-time: 100 × 5 € = **500 €**
- Recurrente: 100 × 1 € = **100 €/mes**
- **Año 1**: 500 € + 12 × 100 € = **1.700 €** pasivos

**Margen DarkRoom**: pagas 6 € por referido el primer mes (5€ one-time + 1€ recurrente) sobre un ingreso de 24,90 € → **24%**. A partir del mes 2: pagas 1 € sobre 24,90 € → **4%**. Sostenible.

---

## Por qué esta mecánica (vs 30% recurrente estándar SaaS)

- **Cifras simples** que cualquier creator puede hacer mentalmente: "5€ por cada uno + 1€/mes". Sin tablas.
- **Margen alto para DarkRoom** (>95% del MRR queda en caja a partir del mes 2).
- **Fácil de comunicar**: "Trae 30 amigos · te entran 30€/mes en piloto automático".
- **No atrae afiliados grandes** (microinfluencers > 100k followers no se mueven por estas cifras). **Eso es intencional** — queremos crecimiento orgánico pequeño-medio, no comisionistas profesionales.

Si Pablo decide más adelante atraer afiliados grandes (>100k followers), se puede crear un **tier especial** con cifras más altas, sin tocar este programa base.

---

## Implementación técnica

### Tabla `darkroom_affiliates`

```sql
CREATE TABLE darkroom_affiliates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id),
  code            text UNIQUE NOT NULL,         -- ej "pablo-creator"
  name            text NOT NULL,
  email           text NOT NULL,
  stripe_connect_id text,                       -- para payouts
  status          text NOT NULL DEFAULT 'active', -- active|paused|banned
  total_referrals int NOT NULL DEFAULT 0,       -- cache (calc desde darkroom_referrals)
  total_paid_out_cents int NOT NULL DEFAULT 0,  -- cache acumulado pagado
  pending_balance_cents int NOT NULL DEFAULT 0, -- a pagar en próximo cron
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_aff_code ON darkroom_affiliates(code);
CREATE INDEX idx_aff_user ON darkroom_affiliates(user_id);
```

### Tabla `darkroom_referrals`

```sql
CREATE TABLE darkroom_referrals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code      text NOT NULL REFERENCES darkroom_affiliates(code),
  referred_email      text NOT NULL,
  stripe_subscription_id text,
  stripe_customer_id  text,
  plan                text NOT NULL,            -- pro|lifetime
  started_at          timestamptz NOT NULL,
  last_paid_at        timestamptz,              -- última cuota cobrada al referido
  one_time_paid       boolean NOT NULL DEFAULT false,  -- ¿ya se pagaron los 5€ al afiliado?
  one_time_paid_at    timestamptz,
  recurring_months_paid int NOT NULL DEFAULT 0, -- cuántos €1 ya hemos acreditado
  status              text NOT NULL DEFAULT 'active', -- active|churned|refunded
  total_commission_cents int NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ref_aff ON darkroom_referrals(affiliate_code);
CREATE INDEX idx_ref_status ON darkroom_referrals(status);
```

### Endpoints Next.js

- `POST /api/affiliates/track` — body `{ref}` → set cookie 30 días + redirect a checkout
- `POST /api/affiliates/signup` — body `{name, email, stripe_connect_token?}` → crea fila en `darkroom_affiliates` con código auto-generado
- `GET /api/affiliates/[code]/dashboard` — devuelve balance + referidos + comisiones (auth: email del afiliado)
- `POST /api/webhooks/stripe` — extender el existente para detectar `customer.subscription.created` y matchear cookie `?ref=` → registrar referral + acreditar 5€ al pasar día 30 sin refund

### Crons mensuales

- `infra/crons/affiliates-recurring.ts` — el día 1 de cada mes, para cada referral activo, +1€ al `pending_balance_cents` del afiliado.
- `infra/crons/affiliates-payout.ts` — el día 5 de cada mes, para cada afiliado con `pending_balance_cents >= 3000` (30€), payout via Stripe Connect.

### Flujo end-to-end

```
1. Visitante click /afiliados/signup
   → form simple (name, email)
   → genera código único `name-XXX`
   → email con su link `darkroomcreative.cloud?ref=name-XXX`

2. Visitante con `?ref=name-XXX` llega a darkroomcreative.cloud
   → POST /api/affiliates/track con cookie 30 días

3. Visitante completa checkout Pro 24,90€
   → webhook Stripe customer.subscription.created
   → matching cookie ↔ subscription
   → INSERT en darkroom_referrals (status=active, one_time_paid=false)

4. Día 30 cron verifica: ¿el referido sigue activo? ¿no hubo refund?
   → SI → acredita 5€ one-time al afiliado (one_time_paid=true)

5. Día 1 mes 2 (y siguientes) cron afiliados-recurring
   → para cada darkroom_referrals.status='active' suma +1€ al afiliado

6. Día 5 mes cron afiliados-payout
   → para cada afiliado con balance >= 30€ → Stripe Connect transfer

7. Si referido churn (subscription.deleted)
   → darkroom_referrals.status='churned'
   → desde mes siguiente NO se suma +1€
```

---

## Promoción del programa (mes 1)

Lanzamiento **día 8 mes 1** (esperar primer feedback de tracción para no desperdiciar).

### Día 8 — Anuncio público

- Post IG carrusel "DarkRoom Crew · 5€ + 1€/mes por amigo que traigas"
- Story serie 5 stories con math reveal: "5 amigos = 25€ + 5€/mes recurrente"
- LinkedIn post "Cómo monté un programa de afiliados sostenible al 4% margen"

### Día 14 — Reel testimonial

- "Lleva 2 semanas DarkRoom Crew · 7 afiliados activos"
- Mostrar dashboard real (datos anonimizados)

### Día 21 — Caso uso

- "Si tienes 10k followers en IG, así se monetiza con DarkRoom Crew"
- Cálculo realista: 10k followers · 1% conversion = 100 leads · 10% paid = 10 referidos = 10€/mes recurrente + 50€ one-time = 170€ año 1

### Día 28 — Cierre mes

- Stories "Crew del mes" — top 3 afiliados (con permiso) con su cifra
- "Si tienes audiencia y no estás en Crew, este mes es el momento"

---

## Anti-fraude

- Identidad real verificada del afiliado (nombre + email confirmados, no anónimos).
- Anti self-referral: detectar si email del referido coincide con email del afiliado o IP.
- Anti multi-cuenta: si 5+ referidos cancelan en el primer mes, congelar pagos al afiliado y revisar manual.
- Cap mensual de seguridad: ningún afiliado cobra más de **500€/mes** sin revisión manual de Pablo.

---

## Out of scope (definir en mes 2+)

- Tier-upgrade Pro → Lifetime: bonus exacto (placeholder 10€)
- Programa especial para afiliados >100k followers
- Dashboard público con leaderboard del top 10 afiliados (con permiso)
- Integración con email marketing (Resend) para que el afiliado tenga plantillas listas para enviar
- Premio físico al "Crew Member del año" (camiseta DarkRoom edición limitada, etc.)

---

**Versión**: 1.0 · **Fecha**: 2026-04-29
