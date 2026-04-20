# E2E tests (Playwright)

Smoke tests para los flujos criticos de PACAME: marketplace, portal autenticado, health.

## Como correr

### Local

Requiere el dev server arriba en `http://localhost:3000` (o dejarlo que lo arranque Playwright).

```bash
npm run test:e2e              # headless, todos los tests
npm run test:e2e:ui           # modo UI interactivo
npm run test:e2e:headed       # con browser visible
npx playwright test health    # solo el archivo health.spec.ts
```

### Vercel preview ambiente

```bash
PREVIEW_URL=https://pacame-web-pr-123.vercel.app \
E2E_SKIP_STRIPE=true \
npx playwright test
```

## Variables de entorno

| Variable | Requerida | Uso |
|---|---|---|
| `PREVIEW_URL` | No | URL base del preview. Si no se pasa, usa `http://localhost:3000`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Si | Service role para crear/borrar clientes de test. BYPASSES RLS. |
| `NEXT_PUBLIC_SUPABASE_URL` | Si | URL del proyecto Supabase (mismo que usa la app). |
| `E2E_SKIP_STRIPE` | No | `true` en CI (default) para saltar el UI flaky de Stripe Checkout. |
| `CI` | No | Playwright detecta CI y ajusta workers, retries, reporter. |

## Seguridad — NUNCA correr en produccion

- La service role key tiene acceso total a la DB (ignora RLS).
- Los tests insertan y borran registros en `clients` / `orders`.
- **Solo** correr contra preview ambientes de Vercel o DB local de desarrollo.
- Nunca apuntar `NEXT_PUBLIC_SUPABASE_URL` al proyecto de produccion durante E2E.

## Arquitectura

- `playwright.config.ts` — config base, workers, reporters.
- `e2e/helpers/supabase.ts` — cliente service-role + helpers (`createTestClient`, `deleteTestClient`, `insertFakeOrder`, `fetchLatestOrder`, `stripeTestCard`).
- `e2e/marketplace-buy.spec.ts` — flujo de compra `/servicios/logo-express`.
- `e2e/portal-auth.spec.ts` — cliente loggeado ve sus orders.
- `e2e/health.spec.ts` — home, status, endpoint `/api/health`.

Cada test es independiente: hace su propio setup y teardown via Supabase API.
