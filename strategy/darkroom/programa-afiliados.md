# DarkRoom — Programa de afiliados (Crew) v1.1

> **Estado**: v1.1 — mecánica decidida por Pablo (2026-04-29) · INTEGRACIÓN con sistema existente.
> **Owner**: Pablo + NEXUS (operaciones) + CORE (implementación técnica).
> **Pre-requisito leído**: `positioning.md`, `brand-bible.md`.
> **Cambio v1.0→v1.1**: detectamos que ya existe sistema afiliados PACAME multi-brand operativo (`web/lib/modules/referrals/` + `web/app/api/referrals/`). El programa Crew se IMPLEMENTA SOBRE ese sistema, no se duplica. Tablas `darkroom_affiliates` / `darkroom_referrals` que se crearon por error en migración 029 fueron eliminadas en migración 030.

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

## Implementación técnica · INTEGRACIÓN con sistema existente

### Sistema PACAME afiliados ya operativo (NO duplicar)

PACAME tiene un sistema completo de referidos multi-brand vivo:

| Recurso | Path |
|---|---|
| Lib core | `web/lib/modules/referrals/` (adapters, attribution, auth, client) |
| Componentes UI | `web/lib/modules/referrals/components/` (Dashboard, ContentLibrary, ReferralLinkCard) |
| Endpoints público | `web/app/api/referrals/` (me, info, content, checkout-session, affiliates) |
| Endpoints admin | `web/app/api/referrals/admin/` (overview, brands, affiliates, payout, campaign) |
| Landing afiliados | `web/app/afiliados/` (page, registro, login, panel, terminos) |
| Tablas DB | `aff_*` prefix (no `darkroom_*`) |

El sistema soporta **múltiples brands** (PACAME, SaaS, Dark Room) en la misma infra. Cada afiliado elige una brand y obtiene su link `?ref=<code>` con cookie 30 días.

### Configuración Crew para brand=darkroom

Para activar la mecánica Crew (5€ + 1€/mes) sobre el sistema existente:

1. **Crear/actualizar brand `darkroom`** en la tabla `aff_brands` (vía endpoint admin `/api/referrals/admin/brands`):
   - `slug`: `darkroom`
   - `name`: `DarkRoom`
   - `default_payout_one_time_cents`: 500 (5€)
   - `default_payout_recurring_cents`: 100 (1€/mes)
   - `commission_window_days`: 30 (espera para acreditar one-time)
   - `cookie_days`: 30

2. **Asociar productos Stripe Dark Room** a la brand `darkroom` (`/api/referrals/admin/brand-products`):
   - Pro 24,90€/mes
   - Lifetime 349€

3. **Webhook Stripe** ya está cableado en el sistema existente. Cuando llegue `customer.subscription.created` con cookie `aff_ref=<code>`, automáticamente:
   - Registra referral con status `pending`
   - Tras 30 días sin refund → acredita 5€ al afiliado
   - Mes a mes → acumula 1€ por referido activo

4. **Lifetime bonus tier-upgrade** (Pro→Lifetime): aún no soportado por sistema existente. Pendiente extension cuando tengamos el primer caso real.

### Flujo end-to-end (sistema existente)

```
1. Pablo (admin) crea brand=darkroom en /api/referrals/admin/brands
   con payout_one_time=500 y payout_recurring=100

2. Visitante click /afiliados/registro?brand=darkroom
   → form (name, email) en página existente
   → backend crea fila en aff_affiliates con brand=darkroom
   → email con link `darkroomcreative.cloud?ref=<code>`

3. Visitante con ?ref=<code> llega a darkroomcreative.cloud
   → cookie aff_ref=<code> 30 días (sistema existente)

4. Visitante checkout Pro 24,90€
   → webhook Stripe (existente) detecta cookie + brand
   → INSERT en aff_referrals (status=pending)

5. Día 30 cron existente verifica refund-free
   → acredita 5€ one-time

6. Mes 2+ cron recurring suma 1€/mes por referral active

7. Día 5 mes cron payout via Stripe Connect (mín 30€)
```

### Lo que SÍ es nuevo (no en el sistema existente)

- **Tabla `darkroom_leads`** (lead magnet captura email "Stack del Creator 2026"). NO tiene equivalente en `aff_*`. Migración 029_darkroom_affiliates_leads.sql crea esta tabla. Migración 030 dropea las dos tablas duplicadas innecesarias.
- **Endpoint `POST /api/darkroom/lead`** para capturar leads del lead magnet (no es ref de afiliado, es captura email pre-conversion).

### Crons mensuales (ya existen en sistema)

- Recurring +1€/mes/referral activo: ya implementado en sistema referidos PACAME
- Payout Stripe Connect mensual: ya implementado

NO crear crons nuevos. Solo verificar que la brand `darkroom` esté configurada con los rates correctos (500 / 100 cents).

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
