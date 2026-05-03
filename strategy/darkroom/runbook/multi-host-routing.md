# DarkRoom — Multi-Host Routing (PACAME ↔ DarkRoom desde el mismo Next.js)

> **Estado**: implementado en `web/middleware.ts`, `web/app/robots.ts`, `web/app/sitemap.ts` y los `host-guard` server-side de `/legal/*`.
> **Fecha**: 2026-05-03.
> **Owner**: CORE (código) + Pablo (DNS/Vercel).
> **Pre-requisito leído**: `proteccion-identidad.md` reglas 2-3 + `arquitectura-3-capas.md` regla aislamiento por capa.

---

## El problema

Este Next.js sirve dos marcas distintas desde el mismo deploy:

- `pacameagencia.com` — marca PACAME (Capa 1, factoría).
- `darkroomcreative.cloud` — marca DarkRoom (Capa 3, SaaS aislado).

**Sin enrutamiento por host**, alguien podría entrar a `darkroomcreative.cloud/equipo` y leer la página "el equipo PACAME" → filtración total de la separación de marca. Eso rompe la regla `proteccion-identidad.md` y el modelo legal (membresía colectiva no debe asociarse a PACAME).

---

## La solución: 3 capas de aislamiento

### Capa 1 — Middleware (`web/middleware.ts`)

Runtime Edge. Inspecciona el header `host` de cada request y enruta:

| Host detectado | Comportamiento |
|---|---|
| `darkroomcreative.cloud` o subdominios | Solo permite `/legal/*`, `/crew/*`, `/api/darkroom/*` y rutas compartidas. Resto → **404**. Raíz `/` → redirect a `/legal` (provisional). |
| `pacameagencia.com` o cualquier otro | Bloquea `/legal/*`, `/crew/*`, `/api/darkroom/*` (404). Resto pasa. |
| `localhost`, `127.0.0.1`, `*.vercel.app`, `*.vercel.dev` | **No filtra nada** — modo dev/preview. |

Rutas compartidas (siempre permitidas):
- `/api/health`, `/api/og`, `/api/cron`
- `/sitemap.xml`, `/robots.txt`, `/manifest.json`, `/favicon.ico`, `/opengraph-image`, `/icon`, `/apple-icon`
- `/_next/*`, `/_vercel/*`, estáticos por extensión

### Capa 2 — Host-guard server-side (`web/lib/darkroom/host-guard.ts`)

Cada server page DarkRoom invoca `await ensureDarkRoomHost()` al inicio. Si el host no es `darkroomcreative.cloud`, lanza `notFound()`.

Es **redundante** con el middleware (defensa en profundidad): si alguien deshabilita el middleware o introduce un bug, el host-guard sigue protegiendo. Las páginas `/legal/*` lo invocan.

### Capa 3 — Robots / Sitemap host-aware

`web/app/robots.ts` y `web/app/sitemap.ts` leen el host vía `headers()`:

- **PACAME**: robots y sitemap como antes + `disallow: /legal/, /crew/` para evitar leakage si Google se equivoca de host.
- **DarkRoom**: robots minimalista apuntando a `https://darkroomcreative.cloud`, sitemap mínimo (solo `/` y `/crew` — `/legal/*` es noindex y NO entra).

Resultado: Google indexa cada brand correctamente sin cross-leak.

---

## Setup de DNS y Vercel — qué tiene que hacer Pablo

### A. Vercel project (cuando se haga deploy multi-dominio)

El proyecto Vercel actual (`web` en team `pacames-projects`) sirve `pacameagencia.com`. Para añadir `darkroomcreative.cloud`:

1. Vercel dashboard → proyecto `web` → Settings → Domains → "Add domain".
2. Introducir `darkroomcreative.cloud` (apex) y `www.darkroomcreative.cloud`.
3. Vercel da los registros DNS necesarios:
   - **Apex** (`darkroomcreative.cloud`): un A record a `76.76.21.21` o un ALIAS si el registrar lo soporta.
   - **www**: CNAME a `cname.vercel-dns.com`.
4. Configurar esos registros en Hostinger (registrar actual del dominio).
5. Esperar propagación + emisión SSL automática (Vercel usa Let's Encrypt, <60s).
6. **Opcional**: redirigir `www.darkroomcreative.cloud` → `darkroomcreative.cloud` (Vercel lo hace por defecto).

### B. Migración futura al team Vercel "Dark Room IO"

La regla `arquitectura-3-capas.md` indica que DarkRoom debería vivir en su propio team Vercel (`Dark Room IO` ya creado, ID `team_ApmnOAs00bIX6Kt1gTWPbRpm`). Pasos:

1. Sacar el componente DarkRoom (`/legal/*`, `/crew/*`, `/api/darkroom/*`, `lib/darkroom/*`, `components/darkroom/*`) a un repo Git separado.
2. Crear nuevo proyecto Vercel en team `Dark Room IO` apuntando a ese repo.
3. Mover dominio `darkroomcreative.cloud` al nuevo proyecto.
4. En el repo PACAME actual, eliminar el código DarkRoom + middleware (queda solo PACAME).
5. Stripe/Supabase/Resend ya están aislados — no requieren migración.

Esto es **trabajo grande** y queda para cuando MRR > 5k€ o llegue el primer C&D. Hasta entonces, **multi-host desde el mismo Next.js es suficiente** y reduce coste operativo.

### C. Variables de entorno requeridas en Vercel

Las del PR #80 (multi-brand messaging) + las del PR #105 (cookie consent):

```
DARKROOM_TELEGRAM_BOT_TOKEN=...
DARKROOM_TELEGRAM_DEFAULT_CHAT_ID=...
DARKROOM_TELEGRAM_WEBHOOK_SECRET=...
DARKROOM_WHATSAPP_PHONE_ID=...
DARKROOM_WHATSAPP_TOKEN=...
DARKROOM_WHATSAPP_VERIFY_TOKEN=...
DARKROOM_META_SYSTEM_USER_TOKEN=...
DARKROOM_INSTAGRAM_APP_ID=...
DARKROOM_INSTAGRAM_APP_SECRET=...
DARKROOM_INSTAGRAM_ACCESS_TOKEN=...
DARKROOM_INSTAGRAM_ACCOUNT_ID=...
DARKROOM_INSTAGRAM_VERIFY_TOKEN=...
DARKROOM_CONSENT_HASH_SALT=<random_64_chars>
```

---

## Smoke tests post-deploy

Cuando Pablo termine el setup DNS, ejecutar estos checks. **Cada uno debe pasar**:

### 1. PACAME funciona normal

```bash
curl -I https://pacameagencia.com/                # → 200 OK (home PACAME)
curl -I https://pacameagencia.com/agentes         # → 200 OK
curl -I https://pacameagencia.com/blog            # → 200 OK
```

### 2. DarkRoom rutas DarkRoom funcionan

```bash
curl -I https://darkroomcreative.cloud/legal              # → 200 OK
curl -I https://darkroomcreative.cloud/legal/privacidad   # → 200 OK
curl -I https://darkroomcreative.cloud/legal/cookies      # → 200 OK
curl -I https://darkroomcreative.cloud/legal/aviso-legal  # → 200 OK
curl -I https://darkroomcreative.cloud/legal/terminos     # → 200 OK
curl -I https://darkroomcreative.cloud/crew               # → 200 OK
curl -I https://darkroomcreative.cloud/                   # → 307 redirect a /legal (provisional)
```

### 3. Aislamiento: `pacameagencia.com/<rutas-darkroom>` → 404

```bash
curl -o /dev/null -w "%{http_code}\n" https://pacameagencia.com/legal             # → 404
curl -o /dev/null -w "%{http_code}\n" https://pacameagencia.com/legal/privacidad  # → 404
curl -o /dev/null -w "%{http_code}\n" https://pacameagencia.com/crew              # → 404
curl -o /dev/null -w "%{http_code}\n" https://pacameagencia.com/api/darkroom/cookies/consent  # → 404 (POST)
```

### 4. Aislamiento: `darkroomcreative.cloud/<rutas-pacame>` → 404

```bash
curl -o /dev/null -w "%{http_code}\n" https://darkroomcreative.cloud/agentes      # → 404
curl -o /dev/null -w "%{http_code}\n" https://darkroomcreative.cloud/blog         # → 404
curl -o /dev/null -w "%{http_code}\n" https://darkroomcreative.cloud/contacto     # → 404
curl -o /dev/null -w "%{http_code}\n" https://darkroomcreative.cloud/comprar      # → 404
```

### 5. Robots / Sitemap diferenciados por host

```bash
curl -s https://pacameagencia.com/robots.txt | head -3
# → Sitemap apuntando a pacameagencia.com/sitemap.xml

curl -s https://darkroomcreative.cloud/robots.txt | head -3
# → Sitemap apuntando a darkroomcreative.cloud/sitemap.xml + Disallow /legal/

curl -s https://pacameagencia.com/sitemap.xml | grep -c "darkroom"
# → 0 (cero menciones a darkroom en sitemap PACAME)

curl -s https://darkroomcreative.cloud/sitemap.xml | grep -c "pacameagencia"
# → 0 (cero menciones a pacame en sitemap DarkRoom)
```

### 6. Health endpoint funciona en ambos hosts

```bash
curl https://pacameagencia.com/api/health         # → 200 OK + JSON
curl https://darkroomcreative.cloud/api/health    # → 200 OK + JSON
```

(Health es agnóstico al host; la separación de servicios se ve en el JSON.)

---

## Comprobación periódica post-deploy

| Frecuencia | Comprobación |
|---|---|
| Tras cada deploy a producción | Smoke tests 1-6 anteriores |
| Mensual | Buscar en Google `site:darkroomcreative.cloud "pacame"` → debe devolver 0 |
| Mensual | Buscar en Google `site:pacameagencia.com "darkroom"` → debe devolver 0 (salvo casos de éxito explícitos donde se cite) |
| Trimestral | Auditoría completa del código (`grep -rnE "\\bPablo\\b" web/lib/darkroom web/app/api/darkroom`) → solo nombres internos de función |
| Trimestral | Whois `darkroomcreative.cloud` → privacy ACTIVA |

---

## Lo que NO cubre el middleware

- **Texto leakado en JS bundles del cliente**: si en `web/app/page.tsx` (PACAME home) se hace import de algún componente que menciona DarkRoom, ese código se sirve a clientes PACAME. Mitigación: code-splitting estricto + ESLint rule (futuro). Por ahora, comprobación manual en cada PR.
- **Cookies cross-domain**: localStorage es por origen, así que `darkroom_cookie_consent` en darkroomcreative.cloud NO se ve en pacameagencia.com (correcto). Cookies con domain no específico tampoco se cruzan.
- **Email From**: ya cubierto en PR #105 (email-templates.ts) — desde DarkRoom se envía con `support@darkroomcreative.cloud`, desde PACAME con `hola@pacameagencia.com`. Cero cruce.

---

## Decisiones explícitas

1. **Raíz `/` en darkroomcreative.cloud**: por ahora redirige a `/legal` (no hay landing oficial DarkRoom). Cuando se construya la landing, se permite `/` y se quita el redirect del middleware.
2. **Robots.txt darkroom NO abre GPTBot/ClaudeBot**: los bots LLM no pueden indexar contenido DarkRoom hasta que el posicionamiento público esté decidido. PACAME sí los acepta.
3. **Vercel preview URLs `*.vercel.app`**: NO aplica filtro multi-host (modo dev/staging). Esto permite probar features DarkRoom desde URLs preview sin DNS especial.

---

## Si en el futuro algo falla

| Síntoma | Diagnóstico probable | Solución |
|---|---|---|
| `darkroomcreative.cloud/legal` devuelve 404 en producción | Middleware no detecta el host correctamente | Verificar `x-forwarded-host` en logs Vercel; ajustar `isDarkRoomProductionHost()` |
| `pacameagencia.com/legal` devuelve 200 (no 404) | Middleware no se ejecutó en esa ruta | Verificar matcher en `web/middleware.ts` config |
| Sitemap PACAME contiene URLs DarkRoom | `detectBrand()` falló o se cacheó incorrectamente | Revisar Vercel cache + revalidation |
| Banner cookies aparece en PACAME | Componente importado donde no toca | Verificar imports en `app/layout.tsx` PACAME |
