# Diagnóstico en vivo — Ecomglobalbox (App Laravel/Lauth de César)

> Fecha: **2026-05-17 16:47 UTC** · Tipo: **read-only** (sin writes, restarts ni deploys).
> Solo agregados, **cero PII** de clientes finales, **cero secretos**. Emails redactados en origen.
> Repo cliente: `CesarVeld/mindset` · HEAD `691d99a` (Fase 20).

## TL;DR

El core funciona: web arriba, webhooks Stripe en tiempo real, queue viva, **todo
pagador con sub activa tiene acceso Lauth** (`faltantes=0`). La memoria PACAME estaba
desfasada ~1 mes (decía Fase 17.5 + SSH caído; en realidad **SSH funciona** y están
en **Fase 20** con todas las migraciones aplicadas).

El problema dominante **no** es Lauth: es el **pago de comisiones de afiliados por
Stripe en bucle de fallo** ("Insufficient funds"), generando 11.387 errores en log y
reintentos hasta 255 veces sin circuit-breaker activo.

## Estado SANO (verificado)

| Área | Estado |
|------|--------|
| Web HTTPS | 200 OK |
| Infra | up 11 d, load 0.00, disco 10 % (85 G libres), RAM 7 G libre |
| Servicios | nginx · php8.3-fpm · mysql/mariadb · supervisor · cron → todos `active` |
| Queue worker | vivo (uptime 2 d), `jobs=0`, `failed_jobs=0` |
| Webhooks Stripe | 5.636 eventos, **0** invoice.paid sin procesar (7 d), **0** con error (7 d), último evento hace minutos |
| Lauth core | Stripe pagadores 281 / Lauth miembros 291 · **faltantes=0** · intrusos=1 |
| Migraciones | todas aplicadas (sin pendientes) |
| Scheduler | 23 crons registrados y activos (reconcile, audit, health-check, dedupe…) |
| SSH | **operativo** (puerto 22 abierto, auth por clave `~/.ssh/cesar_mindset_vps`). Bloqueo del 21-abr **resuelto**. |

## Problemas actuales (priorizados)

### 🔴 ALTO — Pago de comisiones de afiliados roto (NUEVO, no estaba en memoria)
- **Síntoma:** 11.387 ERROR/CRITICAL en `laravel.log` (7,7 M). Dominante:
  `Affiliate transfer falló … "Insufficient funds in Stripe account"`.
- **Cron** `affiliate:execute-transfers` cada 30 min reintenta; en log se ven
  `attempts` hasta **255** sobre las mismas conversions.
- **Circuit-breaker NO activo:** columna `stripe_transfer_skip_until` existe pero
  `conversions con skip futuro = 0` → nada frena los reintentos.
- **Bug idempotency key** (conversion 132): `aff_conv_132` reusada con parámetros
  distintos → `Keys for idempotent requests can only be used with the same
  parameters` → fallo **permanente** irrecuperable para esa conversión.
- **Causa raíz probable:** la cuenta Stripe no tiene saldo disponible para pagar
  transfers a las connected accounts de los afiliados. **Decisión de negocio de César**
  (fondear / activar payouts / cambiar a transfer on-demand), no solo dev.
- **Impacto:** afiliados no cobran; log inservible por ruido (enmascara errores
  reales); presión innecesaria al API de Stripe.
- **Fix propuesto (NO ejecutado):** (1) César resuelve saldo/payout en Stripe;
  (2) activar de verdad el circuit-breaker (`stripe_transfer_skip_until` tras N
  fallos + backoff); (3) versionar la idempotency key cuando cambian parámetros.

### 🟠 MEDIO — 149 subs en `past_due` (~34 % sobre 287 de pago)
- `subs_by_status`: active 273 · trialing 14 · **past_due 149** · canceled 59 · pending 1.
- Ratio alto de pagos fallidos / dunning. Hay cron de limpieza
  `subscriptions:cancel-stale-past-due --days=30`. Revisar recuperación de pago /
  retención (puede arrastrar cola de la migración Stripe vieja).

### 🟠 MEDIO — 22 subs `canceled` con Lauth aún `active` (fuga de acceso)
- `canceled_only_still_lauth_active=22` · `pastdue_only_still_lauth_active=0`.
- `lauth:reconcile-access --dry-run` solo marca **1 intruso** → drift entre
  `subscriptions.status` local (canceled) y la verdad Stripe/Lauth, o lógica de
  gracia/`period_end` reteniéndolos. Hay cron diario `lauth:audit-access
  --threshold=0` que debería reportarlo. Auditar esas 22 (sin volcar PII).

### 🟡 BAJO — Huecos de provisión puntuales
- `lauth_status`: active 306 · removed 182 · **not_provisioned 6** · **error 2**.
- `active_trialing_not_lauth_active=3` (pero `not_provisioned_active_payers=0` → están
  en `error`/`removed` siendo active/trialing). Hasta ~3 clientes pagando sin acceso pleno.
- 1 sub con `Plan sin configuración de acceso`: `lauth_plan_mappings` solo mapea
  `"EcomGlobalBox VIP 2.0"`; un price/plan distinto sin mapear deja a ese cliente sin grupo.

### ⚙️ RIESGO/CONFIG (no bloqueante)
- **Prod divergido de git:** `git status` muestra ~15+ archivos modificados sin
  commitear en `/var/www/html/mindset` (deploys a mano por SFTP). Un `git pull`
  puede pisar/perder cambios. Reconciliar git ↔ prod (commitear lo validado).
- **Log sin rotación efectiva** (canal `single`, 7,7 M): pasar a `daily` o logrotate;
  el ruido de affiliate-transfer tapa errores reales.

## Cómo se verificó (reproducible)
- `c:/tmp/diag-ecomglobalbox.py` y `c:/tmp/diag2-ecomglobalbox.py` (paramiko + clave,
  comandos read-only + queries `COUNT/GROUP BY`, redacción de email en origen).
- No se ejecutó nada que modifique estado. No requiere backup (regla backup solo
  aplica a writes).

## Recomendación de siguiente bloque (requiere OK explícito para tocar prod)
1. **Afiliados (prioridad):** corregir circuit-breaker + idempotency key en código
   (`AffiliateTransferService`) y alinear con César la decisión de saldo/payout Stripe.
2. Reconciliar git ↔ prod y rotar logs.
3. Auditar las 22 canceled-con-acceso y los ~3 sin provisión.
