# Staging environment — Setup manual (Pablo)

Esta doc describe COMO montar un staging real en ~30 minutos. No se automatiza porque requiere clicks en Vercel y Supabase. Una vez montado, funciona solo.

## Objetivo

Flujo:

```
main branch   → Preview Vercel por PR (efimero)
staging branch → Vercel "pacame-staging" (persistente, URL: staging.pacameagencia.com)
production     → Vercel "pacame-web" (LIVE, pacameagencia.com)
```

Staging usa:
- Branch Supabase `staging` (datos aislados de prod)
- Stripe **test mode** (nunca toca cobros reales)
- Meta/WhatsApp sandbox numbers
- CSRF_MODE=warn (no enforce, para detectar roces sin bloquear)

## Paso 1 — Branch Supabase para staging (5 min)

En Supabase dashboard del proyecto PACAME (`kfmnllpscheodgxnutkw`):

1. Ir a **Branches** en sidebar (feature en preview).
2. Crear branch `staging` desde `main`.
3. Esperar ~2 min al provisioning.
4. Copiar: `Project URL` + `service_role key` + `anon key` de la branch staging.

Si no tienes acceso a branches (feature en preview), alternativa: crear un proyecto Supabase separado `pacame-staging` — mas caro pero mismo efecto.

## Paso 2 — Vercel proyecto staging (10 min)

1. Vercel dashboard → **New project** → import el repo `pacame` de nuevo.
2. Nombrar el proyecto `pacame-staging`.
3. Settings → **Git** → Production branch: `staging` (en lugar de `main`).
4. Dominio: `staging.pacameagencia.com` (crear subdomain en Cloudflare o tu DNS).
5. Environment Variables — copiar todas de prod PERO reemplazar:
   - `NEXT_PUBLIC_SUPABASE_URL` → del branch staging
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → del branch staging
   - `SUPABASE_SERVICE_ROLE_KEY` → del branch staging
   - `STRIPE_SECRET_KEY` → **sk_test_** (Stripe test mode)
   - `STRIPE_PUBLISHABLE_KEY` → pk_test_
   - `STRIPE_WEBHOOK_SECRET` → del endpoint test-mode de Stripe
   - `CSRF_MODE=warn` (no enforce durante periodo de observacion)
   - `GDPR_PURGE_DRY_RUN=true` (siempre en staging)
   - `RESEND_FROM_EMAIL` → usar subdominio test para no contaminar el dominio real

## Paso 3 — Crear la rama git local (2 min)

```bash
cd <repo>
git checkout main
git pull
git checkout -b staging
git push -u origin staging
```

Vercel detecta automatico el push y hace primer deploy.

## Paso 4 — Stripe test webhooks (5 min)

1. Stripe dashboard → switch a **Test mode** (toggle arriba).
2. Developers → Webhooks → Add endpoint → `https://staging.pacameagencia.com/api/stripe/webhook`.
3. Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_succeeded`, `payment_intent.payment_failed`.
4. Copiar el webhook secret a Vercel `STRIPE_WEBHOOK_SECRET` de staging.

## Paso 5 — Flujo de trabajo

```bash
# Feature nueva:
git checkout main && git pull
git checkout -b feature/X
# ...cambios + commits...
git push -u origin feature/X
# → Vercel crea preview deploy efimero en URL aleatoria
# → CI corre tests + playwright smoke

# Merge a staging para validacion:
gh pr create --base staging --head feature/X
# → review + merge → deploy automatico a staging.pacameagencia.com

# Promotar a produccion:
# (desde staging, merge a main)
gh pr create --base main --head staging
# → review + merge → deploy a pacameagencia.com
```

## Paso 6 — Canary opcional (post-lanzamiento)

Para cambios arriesgados, usa traffic splitting de Vercel:

1. Vercel → proyecto prod → Settings → **Traffic** → Split.
2. Configura: 95% al deploy actual, 5% al PR branch.
3. Observa Sentry 10-30 min. Si errores OK → promover a 25%, 50%, 100%.

## Verificacion post-setup

- `git push origin staging` → staging.pacameagencia.com actualiza en <3 min.
- `curl https://staging.pacameagencia.com/api/health` → 200 con `checks.supabase.status='ok'`.
- Intento de pago con 4242... → OK en staging, no aparece en Stripe live dashboard.
- Cambios en staging NO afectan DB de produccion.

## Guard-rails criticos

- **NUNCA** setes en staging credenciales LIVE de Stripe/Meta.
- **NUNCA** importes dump de prod a staging sin anonimizar PII.
- **SIEMPRE** `GDPR_PURGE_DRY_RUN=true` en staging (previene borrados accidentales).
- **Banner visible** en staging con "AMBIENTE DE PRUEBAS — NO ES PRODUCCION" (implementable via env var `NEXT_PUBLIC_ENV_BANNER=staging` + componente).

## TODO opcional (si contratas devs)

- Branch protection en `staging` requiere CI verde + 1 approval.
- Branch protection en `main` requiere CI verde + 2 approvals + status checks.
- Vercel integration auto-comment PRs con preview URL.
- Rollback 1-click en Vercel Dashboard si algo explota.
