# PACAME Referrals Module

Sistema de afiliados de un nivel estilo Rewardful, autocontenido y reutilizable
en cualquier app generada por la factoría PACAME.

## Capacidades
- Tracking por cookie httpOnly 30 días (configurable).
- Atribución last-click (configurable a first-click por campaña).
- Integración Stripe vía `client_reference_id` + metadata.
- Comisiones recurrentes con cap N meses (default 12) y clawback en refunds.
- Anti-fraude: self-referral block, rate limit por IP/hora, cap conversiones IP/24h.
- Multi-tenant vía `tenant_id`.
- Idempotencia frente a webhooks duplicados (UNIQUE source_event).

## Instalar en una app nueva
1. Ejecuta los SQL del directorio `sql/` en el Supabase de la app.
2. Copia las variables de `web/.env.local.example` (sección `Affiliate /
   referrals module`) y ajusta `REFERRAL_TENANT_ID`.
3. Monta `<ReferralTrackerProvider />` en `app/layout.tsx`.
4. Conecta el endpoint Stripe webhook con los hooks
   `processCheckoutSession`, `processInvoicePaid` y `processRefundClawback`
   (ver [web/app/api/stripe/webhook/route.ts](../../app/api/stripe/webhook/route.ts) como referencia).
5. Si tu auth no es la de PACAME, sustituye `session.ts` por tu lookup.

## Endpoints incluidos
| Verbo | Path                                | Descripción                                          |
|-------|-------------------------------------|------------------------------------------------------|
| POST  | /api/referrals/track                | Registra visita y escribe cookie pacame_ref          |
| GET   | /api/referrals/me                   | Devuelve afiliado del user logueado + stats          |
| POST  | /api/referrals/affiliates           | Activa afiliado para el user logueado (genera código)|
| POST  | /api/referrals/checkout-session     | Wrapper Stripe Checkout que inyecta el referral      |

## Estados de comisión
`pending` → `approved` (auto tras `approval_days`) → `paid` (manual payout) o
`voided` (refund/cancelación).

## Activación en factoría
En `materializeClient(input)` añade `modules_enabled: { referrals: true }`. El
ZIP generado incluirá los SQL y un `MODULE-REFERRALS.md` con las
instrucciones de despliegue.
