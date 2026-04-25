# Integración del módulo Referrals en cualquier app

Este módulo es plug-and-play en cualquier app **Next.js (App Router) +
Stripe + Supabase**. Funciona como un SaaS micronicho insertable: una sola
copia de código + un set de tablas con prefijo `aff_` + 4 hooks en tu
webhook Stripe.

---

## TL;DR (4 pasos, 5 minutos)

1. Copia el directorio `lib/modules/referrals/` a tu app.
2. Copia `app/api/referrals/` a tu app.
3. Aplica los SQL `sql/001_schema.sql` y `sql/002_rls.sql`.
4. Llama a `processCheckoutSession`, `processInvoicePaid`,
   `processRefundClawback` desde tu webhook de Stripe existente.
5. Verifica con `GET /api/referrals/health` → `200 { status: "ok" }`.

---

## 1. Variables de entorno

```env
REFERRAL_TENANT_ID=mi-saas         # aísla los datos del módulo si compartes Supabase
REFERRAL_URL_PARAM=ref             # ?ref=CODE (default: ref)
REFERRAL_COOKIE_DAYS=30            # cookie tracker
REFERRAL_COMMISSION_PERCENT=20     # % por pago exitoso
REFERRAL_MAX_MONTHS=12             # cap de meses con comisión (0 = lifetime)
REFERRAL_ATTRIBUTION=last_click    # last_click | first_click
REFERRAL_APPROVAL_DAYS=30          # hold antes de pasar pending → approved
REFERRAL_IP_CONVERSION_CAP_24H=5   # antifraude
REFERRAL_VISIT_RATE_LIMIT_PER_HOUR=20
```

---

## 2. Adapter de autenticación

El módulo no asume nada sobre tu sistema de auth. Hay un **adapter por
defecto** que lee la cookie `pacame_client_auth` de la tabla `clients`
(esquema PACAME). Cualquier otra app debe sustituirlo.

**Ejemplo con Supabase Auth:**

```ts
// app/lib/referrals-bootstrap.ts
import { createServerClient } from "@supabase/ssr";
import { setReferralsAdapter } from "@/lib/modules/referrals";
import { cookies } from "next/headers";

setReferralsAdapter({
  getAuthedUser: async (request) => {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { get: (name) => cookies().get(name)?.value } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user ? { id: user.id, email: user.email! } : null;
  },
  resolveUserIdFromStripe: async ({ stripeCustomerId, customerEmail }) => {
    // Tu lógica: buscar el user_id en tu tabla `profiles` por email o customer id
    return await lookupUserIdByEmailOrStripe(customerEmail, stripeCustomerId);
  },
});
```

**Ejemplo con NextAuth / Clerk / Auth0** — la firma es la misma; solo
cambia cómo extraes el user del request. Importa `setReferralsAdapter`
una sola vez al boot del servidor (en un `instrumentation.ts` o en un
módulo importado por `app/layout.tsx`).

---

## 3. Tracker en el cliente

```tsx
// app/layout.tsx
import { ReferralTrackerProvider } from "@/lib/modules/referrals/components/ReferralTrackerProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ReferralTrackerProvider />
      </body>
    </html>
  );
}
```

Cualquier visita a `/?ref=CODE` (desde cualquier ruta) hace POST a
`/api/referrals/track`, que valida el código, escribe la cookie httpOnly
`pacame_ref` (30d) y registra la visita.

---

## 4. Stripe Checkout — inyectar el referral

Si ya tienes un endpoint de checkout, envuelve los params:

```ts
import {
  attachReferralToCheckoutSession,
  readRefCookieFromRequest,
} from "@/lib/modules/referrals";

const refCookie = readRefCookieFromRequest(request);
const params = attachReferralToCheckoutSession(yourSessionParams, refCookie);
const session = await stripe.checkout.sessions.create(params);
```

Si no tienes uno, usa `POST /api/referrals/checkout-session` que ya viene
incluido — recibe los params de Stripe Checkout y devuelve `{ url, session_id }`.

---

## 5. Stripe Webhook — generar comisiones

```ts
import {
  loadReferralConfig,
  processCheckoutSession,
  processInvoicePaid,
  processRefundClawback,
  getReferralsAdapter,
} from "@/lib/modules/referrals";

const config = loadReferralConfig();

switch (event.type) {
  case "checkout.session.completed": {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = await getReferralsAdapter().resolveUserIdFromStripe({
      stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
      customerEmail: session.customer_email,
      sessionMetadata: (session.metadata as Record<string, string>) || {},
    });
    if (userId) {
      await processCheckoutSession({ supabase, config, session, referredUserId: userId });
    }
    break;
  }
  case "invoice.payment_succeeded":
  case "invoice.paid": {
    await processInvoicePaid({ supabase, config, invoice: event.data.object });
    break;
  }
  case "charge.refunded": {
    const charge = event.data.object as Stripe.Charge;
    const invoiceId = typeof charge.invoice === "string" ? charge.invoice : null;
    await processRefundClawback({ supabase, config, invoiceId });
    break;
  }
  case "customer.subscription.deleted": {
    const sub = event.data.object as Stripe.Subscription;
    await processRefundClawback({ supabase, config, subscriptionId: sub.id });
    break;
  }
}
```

Idempotente: el `UNIQUE(tenant_id, source_event)` impide duplicar
comisiones aunque Stripe reintente el webhook.

---

## 6. Cron de aprobación

En `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/referrals/approve-pending", "schedule": "0 2 * * *" }
  ]
}
```

Pasa de `pending` → `approved` cuando vence el hold. El endpoint admite
GET y verifica `Bearer ${CRON_SECRET}` o cookie de dashboard.

---

## 7. Panel del afiliado

```tsx
// app/account/affiliates/page.tsx
import { AffiliateDashboard } from "@/lib/modules/referrals/components/AffiliateDashboard";

export default function Page() {
  return <AffiliateDashboard />;
}
```

El componente consume:
- `GET /api/referrals/me` — datos del afiliado + KPIs.
- `POST /api/referrals/affiliates` — opt-in (genera código).

---

## 8. Endpoints incluidos

| Verbo | Path                                         | Auth                | Descripción                                |
|-------|----------------------------------------------|---------------------|--------------------------------------------|
| POST  | /api/referrals/track                         | público             | tracking last-click + cookie               |
| GET   | /api/referrals/info?ref=CODE                 | público             | landing "te invitó X"                      |
| POST  | /api/referrals/affiliates                    | user logueado       | activa afiliado (genera código)            |
| GET   | /api/referrals/me                            | user logueado       | afiliado + stats + referidos               |
| POST  | /api/referrals/checkout-session              | público             | wrapper Stripe Checkout                    |
| GET   | /api/referrals/health                        | público             | valida setup                                |
| POST/GET | /api/referrals/approve-pending            | Bearer CRON_SECRET  | pending → approved                         |
| POST  | /api/referrals/payouts/mark-paid             | Bearer CRON_SECRET  | approved → paid                            |
| GET   | /api/referrals/admin/affiliates              | Bearer CRON_SECRET  | listar afiliados + totales                 |
| POST  | /api/referrals/admin/affiliate-status        | Bearer CRON_SECRET  | cambiar status (active/suspicious/disabled)|
| POST  | /api/referrals/migrate-legacy                | Bearer CRON_SECRET  | importar tabla legacy `commercials`        |

---

## 8.5 Biblioteca de contenido para afiliados

Cada afiliado puede acceder, desde su panel, a banners, copy de email,
posts pre-redactados, scripts de video y plantillas que el admin sube
desde `/dashboard/referrals-admin/content`. El módulo trackea views y
descargas por asset.

**Tabla**: `aff_content_assets` (creada por la migración 003).

**Endpoints**:
- `GET /api/referrals/admin/content` — admin: listar.
- `POST /api/referrals/admin/content` — admin: crear (campos: type, title, body, preview_url, download_url, tags, …).
- `PATCH /api/referrals/admin/content` — admin: editar parcialmente.
- `DELETE /api/referrals/admin/content?id=ID` — admin: borrar.
- `GET /api/referrals/content` — afiliado: lista los activos.
- `POST /api/referrals/content/track-download` body `{ asset_id }` — afiliado: incrementa contador y devuelve URL.

**Componente listo**: `<AffiliateContentLibrary />` (importado por
defecto en el panel afiliado, tab "Contenido para vender").

---

## 9. Tests

```bash
npm run referrals:test    # node --test contra Supabase real
npm run referrals:seed    # 3 afiliados de prueba
```

El test cubre: schema reachable, last-click overwrite, idempotencia
`source_event`, cap N meses, clawback, no clawback de paid.

---

## 10. Multi-tenant

Si la misma instancia de Supabase aloja varios SaaS, asigna un
`REFERRAL_TENANT_ID` distinto a cada uno. Las queries del módulo siempre
filtran por `tenant_id`, así que no hay leakage entre tenants.

---

## 11. Cuándo NO usar este módulo

- Si necesitas un programa de afiliados de **varios niveles** (MLM). Este
  módulo es de un solo nivel por diseño.
- Si necesitas comisiones por cupón/coupon code en lugar de cookie. Para
  eso, mira el flujo `discounts` de Stripe Coupons en tu checkout — este
  módulo solo trackea por cookie + `client_reference_id`.

---

## 12. Soporte

- README del módulo: [`README.md`](./README.md)
- Issues / mejoras: abre PR en el repo PACAME tocando solo
  `web/lib/modules/referrals/` y `web/app/api/referrals/`.
