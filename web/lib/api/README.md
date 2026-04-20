# API Middlewares — PACAME

Helpers para componer rate limiting, validacion y autenticacion en API routes.

## Uso basico

```ts
import { z } from "zod";
import { compose } from "@/lib/api/compose";
import { withValidation } from "@/lib/api/with-validation";
import { withRateLimit } from "@/lib/api/with-rate-limit";
import { authLimiter, getClientIp } from "@/lib/security/rate-limit";

const LoginSchema = z.object({
  action: z.enum(["login", "verify", "logout"]),
  password: z.string().optional(),
});

export const POST = compose(
  withRateLimit(authLimiter, (req) => getClientIp(req)),
  withValidation({ body: LoginSchema }, async ({ body, request }) => {
    // body tipado automaticamente
    if (body.action === "login") { /* ... */ }
    return NextResponse.json({ ok: true });
  })
)(async () => NextResponse.json({ error: "unreachable" }));
```

## Limiters disponibles

Exportados desde `@/lib/security/rate-limit`:

| Nombre              | Ventana | Tokens | Uso tipico                          |
| ------------------- | ------- | ------ | ----------------------------------- |
| `authLimiter`       | 1 min   | 5      | `/api/auth` login                   |
| `clientAuthLimiter` | 5 min   | 10     | `/api/client-auth` login            |
| `checkoutLimiter`   | 1 min   | 20     | `/api/stripe/checkout`              |
| `ordersLimiter`     | 1 min   | 60     | `/api/orders/[id]/inputs` etc.      |
| `webhookLimiter`    | 1 min   | 300    | Webhooks (con bypass por firma)     |

## Keys recomendadas

- IP simple → `(req) => getClientIp(req)`
- IP + email → `(req) => getClientIp(req) + ":" + body.email`
- IP + orderId → `(req, ctx) => getClientIp(req) + ":" + ctx.params.id`

## Backend

- Si `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` estan definidas →
  usa Upstash Redis (sliding window).
- Si no → LRU in-memory de 1000 entradas (dev/local). Se reinicia en cada
  deploy, por lo que NO es apto para prod si hay varias instancias.

## Validacion

`withValidation` parsea body (salvo en GET/HEAD/DELETE) y query string con el
schema Zod proporcionado. Devuelve 400 con `{ error, issues }` si falla.
