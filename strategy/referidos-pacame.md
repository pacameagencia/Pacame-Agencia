# Sistema de referidos PACAME — guía operativa

**Estado**: ✅ Activo en producción contra Supabase real.
**Fecha activación**: 2026-04-25.
**Tenant ID**: `pacame`.

---

## 1. Política de comisiones (campaña por defecto)

| Parámetro | Valor |
|---|---|
| Comisión | **20% sobre cada pago** |
| Duración | **12 meses por referido** (cap configurable) |
| Hold antes de aprobar | 30 días (clawback automático en refunds) |
| Cookie de tracking | 30 días |
| Atribución | **Last-click** (gana el último link usado) |
| Antifraude | Self-referral block · IP cap 5 conv/24h · 20 visits/h por IP |

Para subir comisión a un afiliado VIP, crear una campaña nueva en
`aff_campaigns` con su `commission_percent` específico y asignar al
afiliado vía `aff_affiliates.campaign_id`.

---

## 2. URL de afiliado

```
https://pacameagencia.com/?ref={CODE}
```

El código `{CODE}` se genera automáticamente al hacer opt-in. Cada
afiliado tiene su panel completo en `/dashboard/affiliates`.

**Comerciales legacy** (tabla `commercials` antigua) ya importados al
nuevo sistema vía script. Sus URLs nuevas usan el `partner_code` en
minúsculas.

---

## 3. Quién hace qué

### Yo (Pablo, admin) — `/dashboard/referrals-admin`

Panel completo en el sidebar del dashboard. 5 secciones:

1. **Resumen** — KPIs últimos 30d, gráfico de tendencia (clicks vs conv.),
   top 10 afiliados, top productos vendidos vía afiliados, conversiones recientes.
2. **Afiliados** — gestión: cambiar status (activo/sospechoso/desactivado),
   marcar como pagado todo lo aprobado de un afiliado.
3. **Tracking** — cada visita con IP, UA, referer, UTM, landed_path y
   si convirtió. Filtros por afiliado/IP/fechas.
4. **Comisiones** — cada referido con producto + monto + estado +
   comisiones agregadas. Exportar CSV.
5. **Contenido** — biblioteca de assets (banners, copy, emails, posts)
   que tus afiliados descargan para vender. CRUD completo.

### Afiliado (cliente PACAME) — `/dashboard/affiliates`

Panel pro con 4 tabs:

- **Resumen**: link de referido + KPIs + spark chart 30d.
- **Mis referidos**: tabla con producto comprado.
- **Comisiones**: detalle por mes + estado + total.
- **Contenido para vender**: galería con copy-to-clipboard y descarga
  trackeada.

Si aún no es afiliado, en su panel ve un botón **"Activar mi enlace"**
(POST `/api/referrals/affiliates`) que genera su `referral_code` único.

---

## 4. Cómo funciona el tracking de cada compra

1. Visitante llega a `/?ref=CODE` → `useReferralTracker` POST a `/api/referrals/track`.
2. Server escribe cookie `pacame_ref` (httpOnly, lax, 30d) con
   `{ visitor_uuid, code, affiliate_id }` y registra fila en `aff_visits`
   con IP, UA, referer, UTMs.
3. Visitante hace checkout en Stripe → el endpoint `/api/stripe/checkout`
   inyecta automáticamente `client_reference_id = visitor_uuid` y
   `metadata.ref_code` en la sesión Stripe.
4. Webhook `checkout.session.completed` busca la última visita por
   `visitor_uuid`, crea fila en `aff_referrals` con
   `metadata = { product, services, amount_eur, session_id, … }`.
5. Webhook `invoice.payment_succeeded` (en cada cobro recurrente) genera
   una fila en `aff_commissions` con `month_index` incremental, hasta el
   cap de 12 meses. Idempotente vía `UNIQUE (tenant_id, source_event)`.
6. Cron diario `/api/referrals/approve-pending` (Vercel, 02:00) pasa
   `pending → approved` cuando vence el hold de 30 días.
7. Pablo marca `approved → paid` desde `/dashboard/referrals-admin/affiliates`.
8. Si hay refund, webhook `charge.refunded` o
   `customer.subscription.deleted` → comisión a `voided`.

---

## 5. Saber de dónde viene cada compra

Desde el dashboard admin → **Comisiones**:

- Filtrar por **producto** (`web`, `seo_monthly`, `social_monthly`, etc.).
- Ver para cada referido: fecha, afiliado origen, producto, importe,
  comisiones generadas.
- Exportar CSV para análisis externo.

O directamente con SQL:

```sql
SELECT
  metadata->>'product' AS producto,
  COUNT(*)             AS compras,
  SUM((metadata->>'amount_eur')::numeric) AS total_eur
FROM aff_referrals
WHERE tenant_id = 'pacame'
  AND status = 'converted'
GROUP BY 1
ORDER BY total_eur DESC;
```

```sql
SELECT
  a.email      AS afiliado,
  a.referral_code AS code,
  COUNT(r.id)  AS conversiones,
  SUM((r.metadata->>'amount_eur')::numeric) AS facturado_eur
FROM aff_affiliates a
LEFT JOIN aff_referrals r
  ON r.affiliate_id = a.id AND r.status = 'converted'
WHERE a.tenant_id = 'pacame'
GROUP BY a.id, a.email, a.referral_code
ORDER BY facturado_eur DESC NULLS LAST;
```

---

## 6. Biblioteca de contenido inicial (9 assets)

Sembrada automáticamente por `npm run referrals:seed-content`:

- 1 email frío genérico (PYME local sin web)
- 1 post LinkedIn de recomendación PACAME
- 1 mensaje WhatsApp corto
- 1 email pitch Web Corporativa 800€
- 1 email pitch Plan Redes 197€/mes
- 1 email pitch SEO 297€/mes
- 1 post Twitter pack web+redes
- 1 copy CTA landing 300€
- 1 banner OG genérico

Cada uno usa placeholders `{NOMBRE}`, `{NEGOCIO}`, `{TU_NOMBRE}`,
`{CODE}` que el afiliado sustituye al usar.

Para subir más: `/dashboard/referrals-admin/content` → "Nuevo asset".

---

## 7. Comandos clave

```bash
# Aplicar migración SQL (idempotente)
cd web
npm run referrals:migrate                # auto-aplica via DATABASE_URL o RPC
npm run referrals:migrate:print          # exporta SQL combinado para pegar en editor

# Sembrar contenido inicial (idempotente)
npm run referrals:seed-content

# Tests e2e contra Supabase real (usa tenant aislado "referrals-test-suite")
npm run referrals:test
```

---

## 8. Endpoints API (todos vivos)

| Verbo | Path | Auth |
|---|---|---|
| POST | /api/referrals/track | público |
| GET  | /api/referrals/info?ref=CODE | público |
| GET  | /api/referrals/health | público |
| POST | /api/referrals/affiliates | user logueado |
| GET  | /api/referrals/me | user logueado |
| GET  | /api/referrals/me/timeseries?days=30 | user logueado |
| GET  | /api/referrals/me/commissions | user logueado |
| POST | /api/referrals/checkout-session | público |
| GET  | /api/referrals/content | user logueado |
| POST | /api/referrals/content/track-download | user logueado |
| GET  | /api/referrals/admin/overview?days=30 | dashboard / CRON_SECRET |
| GET  | /api/referrals/admin/visits | dashboard / CRON_SECRET |
| GET  | /api/referrals/admin/referrals | dashboard / CRON_SECRET |
| GET/POST/PATCH/DELETE | /api/referrals/admin/content | dashboard / CRON_SECRET |
| GET  | /api/referrals/admin/affiliates | dashboard / CRON_SECRET |
| POST | /api/referrals/admin/affiliate-status | dashboard / CRON_SECRET |
| GET/POST | /api/referrals/approve-pending | Bearer CRON_SECRET (cron diario) |
| POST | /api/referrals/payouts/mark-paid | dashboard / CRON_SECRET |
| POST | /api/referrals/migrate-legacy | dashboard / CRON_SECRET |

---

## 9. Cron de aprobación

Configurado en [web/vercel.json](../web/vercel.json):
`{ "path": "/api/referrals/approve-pending", "schedule": "0 2 * * *" }`.

Vercel envía Bearer `${CRON_SECRET}` automáticamente.

---

## 10. Variables de entorno (en .env.local + Vercel dashboard)

```env
REFERRAL_TENANT_ID=pacame
REFERRAL_URL_PARAM=ref
REFERRAL_COOKIE_DAYS=30
REFERRAL_COMMISSION_PERCENT=20
REFERRAL_MAX_MONTHS=12
REFERRAL_ATTRIBUTION=last_click
REFERRAL_APPROVAL_DAYS=30
REFERRAL_IP_CONVERSION_CAP_24H=5
REFERRAL_VISIT_RATE_LIMIT_PER_HOUR=20
CRON_SECRET=<generated-at-install>
```

---

## 11. Próximos pasos opcionales

- Subir 5-10 banners diseñados (1080×1080 / 1200×630) al storage de
  Supabase y referenciar `download_url` en assets.
- Crear secuencias de email para afiliados nuevos (onboarding "cómo
  empezar a vender PACAME en 7 días").
- Notificar al afiliado por email cuando le llega una comisión nueva
  (extender el hook `processInvoicePaid` con un `sendEmail`).
- Activar el módulo en apps de la factoría (`modules_enabled.referrals=true`).
