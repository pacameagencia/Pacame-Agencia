# Sprint B · Bloqueadores que requieren acción de Pablo

> **Estado**: 2026-05-10 · tras commit Sprint B parcial.
> **Owner**: Pablo Calleja (manual en panel) + Claude (lo que se pueda automatizar después).
> **Propósito**: lista cerrada de cosas que NO puedo hacer yo solo desde código. Una vez resueltas, Sprint C puede arrancar.

---

## 1. Aplicar migración SQL a Supabase ✅ APLICADA 2026-05-10

**Archivo creado**: [`infra/migrations/050_academy_schema.sql`](../../../infra/migrations/050_academy_schema.sql)

**Estado actualizado**: Claude aplicó la migración a Supabase PACAME (proyecto `kfmnllpscheodgxnutkw`, host `aws-1-eu-west-3.pooler.supabase.com`) usando psycopg2 + `DATABASE_URL` del `.env.local`.

**Verificación**:
- 9 tablas creadas (academy_users, academy_modules, academy_lessons, academy_progress, academy_quizzes, academy_news, academy_newsletter, academy_lead_magnets, academy_lead_captures).
- 6 filas en `academy_modules` (seed inicial M1-M6).
- 6 filas en `academy_lead_magnets` (todas con `published=false` hasta subir assets).
- RLS habilitado en las 9 tablas.

**Decisión confirmada**: la academia vive en el proyecto Supabase PACAME (no aislada en `dark-room-prod`). Migración a aislado queda como decisión futura si MRR justifica el coste extra (~$25/mes Supabase Pro adicional).

**Qué hace**: crea 8 tablas (`academy_users`, `academy_modules`, `academy_lessons`, `academy_progress`, `academy_quizzes`, `academy_news`, `academy_newsletter`, `academy_lead_magnets`, `academy_lead_captures`) con RLS habilitado y seed inicial (6 módulos + 6 lead magnets en estado `published=false`).

**Cómo aplicarla** (cuando Pablo dé luz verde):

Opción A (recomendado · Supabase SQL Editor del proyecto en uso):
1. Abrir panel Supabase → SQL Editor.
2. Pegar contenido completo de `infra/migrations/050_academy_schema.sql`.
3. Run.
4. Verificar que las 9 tablas existen en `Table Editor`.
5. Marcar los 6 lead magnets como `published=true` cuando los assets PDF estén subidos a Storage.

Opción B (CLI con `DATABASE_URL`):
```bash
psql "$DATABASE_URL" -f infra/migrations/050_academy_schema.sql
```

**Decisión pendiente**: ¿migrar a proyecto `dark-room-prod` aislado o quedarse en Supabase principal de PACAME?

- **Aislar** (opción que estaba en arquitectura original): requiere crear nuevo cliente Supabase en `web/lib/darkroom/supabase-dark-room.ts` con vars `DARKROOM_SUPABASE_URL` + `DARKROOM_SUPABASE_SERVICE_ROLE_KEY`, y configurar el endpoint `/api/academy/*` para usarlo. **Costo**: ~$25/mes adicional + migración manual de migración 050.
- **Quedarse en Supabase principal PACAME** (opción más simple v1): cero overhead, todos los endpoints comparten cliente. **Riesgo**: si Dark Academy crece mucho, mezcla audiencia con leads B2B PACAME.

**Recomendación**: empezar en Supabase principal (Capa 1). Migrar a aislado solo cuando MRR Dark Room justifique el coste extra.

---

## 2. Configurar Supabase Auth (bloqueador para Sprint C)

Sprint B se entregó SIN auth real. Las páginas `/academia` y `/academia/lead-magnet/[slug]` funcionan sin login (captura email solamente). Las páginas autenticadas (`/academia/dashboard`, `/academia/[modulo]/[leccion]`) requieren auth y NO existen aún.

**Lo que necesita Pablo en panel Supabase**:

1. **Authentication → Providers**:
   - Habilitar Email (Magic Link). Disable Email Confirmation (queremos magic link directo, sin verificación previa).
   - Habilitar Google OAuth (opcional v1 · acelera registro LATAM).
2. **Authentication → URL Configuration**:
   - Site URL: `https://darkroomcreative.cloud`.
   - Redirect URLs: añadir `https://darkroomcreative.cloud/academia/auth/callback` y `http://localhost:3000/academia/auth/callback`.
3. **Authentication → Email Templates**:
   - Personalizar template "Magic Link" con marca Dark Room (logo + tono Pablo + remitente Dark Academy).
   - Asunto: "Tu enlace para entrar en Dark Academy".

**Lo que tengo que hacer después en código** (Sprint C):

1. Instalar `@supabase/ssr` (`npm i @supabase/ssr` en `/web`).
2. Crear `web/lib/supabase/auth-server.ts` con `createServerClient` SSR.
3. Crear `web/lib/supabase/auth-browser.ts` con `createBrowserClient` cliente.
4. Crear ruta `/academia/registro/page.tsx` con form `signInWithOtp`.
5. Crear callback `/academia/auth/callback/route.ts`.
6. Modificar migración `050` para añadir FK `academy_users.id REFERENCES auth.users(id)` cuando Auth esté listo, o crear migración `051_academy_users_auth_fk.sql`.

---

## 3. Verificar subdominio academy.darkroomcreative.cloud en Resend ✅ CREADO

**Estado actualizado 2026-05-10**: Claude creó el subdominio `academy.darkroomcreative.cloud` en Resend (workspace de la `RESEND_API_KEY` actual, mismo que `pacameagencia.com` verified).

> El root `darkroomcreative.cloud` ya estaba registrado en otro workspace de Resend (probablemente Dark Room IO independiente, para emails transaccionales de la membresía). Para evitar conflicto y separar email marketing academia de transactional Dark Room, usamos subdominio dedicado.

**Resend domain ID**: `a12d4ae2-7ec0-43b7-9682-9b61ebc768c7`
**Status actual**: `not_started` (pendiente que Pablo añada DNS y verifique).

### Acción Pablo · añadir 3 registros DNS en Cloudflare (5 min)

Zona DNS: `darkroomcreative.cloud`.

| Tipo | Name | Value | TTL | Priority |
|---|---|---|---|---|
| **TXT** | `resend._domainkey.academy` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDR5YLhdH6XRGWmrNjkKAe0chT5e+HIzT8t4j1lVjopyXjFSUnVwgJ4Z3ZZFdqoGPU6eFxdmzbqdWLJ5MHFYTMk7FUFk2xEH7wUrtPpncZqCeLh7eP5nDzfh8xxjMt3CgD4S7QBjpfmzjVZc7/5+srDl1oie8XVG4Ad0omzR+S7fQIDAQAB` | Auto | — |
| **MX** | `send.academy` | `feedback-smtp.eu-west-1.amazonses.com` | Auto | 10 |
| **TXT** | `send.academy` | `v=spf1 include:amazonses.com ~all` | Auto | — |

Después de propagar (5-30 min):
```bash
# Claude lanzará la verificación con:
curl -X POST "https://api.resend.com/domains/a12d4ae2-7ec0-43b7-9682-9b61ebc768c7/verify" \
  -H "Authorization: Bearer $RESEND_API_KEY"
```

### Config aplicada en código

`web/lib/darkroom/academy-email-templates.ts`:

```ts
fromHeader: "Dark Academy <hola@academy.darkroomcreative.cloud>",
replyTo:    "support@darkroomcreative.cloud",  // buzón real (memoria existente)
sendDomain: "academy.darkroomcreative.cloud",  // dominio Resend verificado
rootDomain: "darkroomcreative.cloud",          // dominio marca para links públicos
```

**Mientras DNS no esté propagado y verificado**: los emails de lead magnet capture llegarán a spam o serán rechazados. El endpoint funciona pero la entrega falla silenciosamente (log warning en `[academy-mailer]`).

**Plan B temporal** si urge probar en staging antes de verificar el dominio: usar un alias técnico ya dentro del dominio verificado pacameagencia.com pero invisible para el usuario, manteniendo la marca Dark Academy en el header `From` y enrutando respuestas a Dark Room:

```ts
// SOLO staging local · revertir antes de prod.
fromHeader: "Dark Academy <noreply@pacameagencia.com>",
replyTo:    "support@darkroomcreative.cloud",
```

Esto mantiene la regla R7: el remitente visible es "Dark Academy", el reply va al buzón Dark Room. El alias técnico `noreply@pacameagencia.com` solo aparece en cabeceras técnicas (no en el cuerpo del email ni en el subject). Una vez verificado el dominio, revertir a la config canónica `support@darkroomcreative.cloud`.

---

## 4. Subir assets PDF de lead magnets a Supabase Storage

**Bucket necesario**: `academy-public` (público de lectura, escritura solo service_role).

**Estado bucket**: ✅ CREADO 2026-05-10 por Claude vía SDK Supabase con SERVICE_ROLE_KEY. Config aplicada:
- `public: true`
- `fileSizeLimit: 10 MB`
- `allowedMimeTypes: ['application/pdf', 'text/html', 'application/json', 'text/markdown', 'text/csv', 'application/zip']`

**Falta** (acción Pablo o subagente NOVA):

1. ~~Crear bucket~~ → ya hecho.
2. Subir los 6 PDFs/Notions (cuando estén producidos por subagente `dark-academy` + visual-reviewer):
   - `academy-public/lm-m1-stack-2026.pdf`
   - `academy-public/lm-m2-20-prompts.html` (Notion exportado)
   - `academy-public/lm-m3-three-pass-review.pdf`
   - `academy-public/lm-m4-decision-tree.pdf`
   - `academy-public/lm-m5-30-piezas.html`
   - `academy-public/lm-m6-precios-honestos.pdf`
3. Marcar los magnets como `published=true` en `academy_lead_magnets`:
   ```sql
   UPDATE academy_lead_magnets SET published = true WHERE id IN (
     'lm-m1-stack-2026', 'lm-m2-20-prompts', 'lm-m3-three-pass-review',
     'lm-m4-decision-tree', 'lm-m5-30-piezas', 'lm-m6-precios-honestos'
   );
   ```

**Estado actual**:

- Lead magnet M1 contenido redactado en [`strategy/darkroom/academy/lead-magnets/lm-m1-mapa-stack-ia-2026.md`](lead-magnets/lm-m1-mapa-stack-ia-2026.md) (texto completo listo).
- **Falta**: convertir a PDF maquetado (estética Dark Room dark + dorado/rojo). Subagente `nova` o skill `pdf-creator` + `canvas-design`.
- **Falta**: subir a Storage bucket.
- Los otros 5 magnets están solo en seed SQL · pendientes de redactar (Sprints C-F).

---

## 5. Middleware Next.js para `/academia/*` y `/noticias/*`

El rewrite `darkroomcreative.cloud/` → `/darkroom-home` ya funciona (existe en infra actual aunque no encontré el archivo `middleware.ts` explícitamente).

**Hipótesis**: el rewrite vive en `next.config.js` rewrites + `host-guard.ts` valida host en server components.

**Lo que sí está confirmado**:

- `web/app/darkroom-home/academia/page.tsx` llama a `ensureDarkRoomHost()` al renderizar → bloquea acceso desde `pacameagencia.com` con redirect 404.
- `web/app/darkroom-home/academia/lead-magnet/[slug]/page.tsx` mismo patrón.

**Acción pendiente verificar**:

1. Que cuando navegues a `https://darkroomcreative.cloud/academia` se rewrite a la ruta interna `/darkroom-home/academia` (debería funcionar gracias al rewrite raíz existente, pero hay que probarlo).
2. Si NO funciona, revisar `next.config.js` rewrites:
   ```js
   rewrites: async () => [
     { source: '/academia/:path*', has: [{ type: 'host', value: 'darkroomcreative.cloud' }], destination: '/darkroom-home/academia/:path*' },
     // ... resto rewrites existentes
   ]
   ```

---

## 6. Test end-to-end Sprint B

Una vez resueltos 1-4, el test que valida Sprint B es:

```
1. Abrir https://darkroomcreative.cloud/academia
   → debe renderizar landing con 6 módulos + CTA descarga.
2. Click en "Descargar mapa del stack"
   → debe ir a /academia/lead-magnet/mapa-stack-ia-2026
   → debe mostrar form de captura.
3. Introducir email + nombre + aceptar consentimiento → Submit.
   → POST /api/academy/lead-magnet-capture
   → debe insertar en academy_users + academy_lead_captures
   → debe enviar email desde Dark Academy <support@darkroomcreative.cloud>
   → frontend muestra "Listo. Revisa tu email."
4. Email recibido en bandeja con link de descarga + CTA "Continuar con la academia".
5. Click link descarga → bajar PDF desde Supabase Storage signed URL.
6. Click "Date de baja" en footer → ir a /api/academy/unsubscribe?token=...
   → debe marcar academy_users.newsletter_subscribed = false.
   → debe mostrar HTML "Te has dado de baja".
```

Si los 6 pasos pasan, Sprint B está cerrado. Si falla algún paso, troubleshoot por orden:

- Paso 1 falla → middleware/rewrite (bloqueador 5).
- Paso 3 falla con "lead magnet not found or not published" → migración no aplicada o magnets no marcados published (bloqueadores 1, 4).
- Paso 4 falla (email no llega) → dominio Resend no verificado (bloqueador 3).
- Paso 5 falla (download URL 404) → asset PDF no subido (bloqueador 4).

---

## 6.5 Deuda técnica anotada (Sprint C aplazable)

- **Zod guards en boundaries Supabase**: los endpoints `/api/academy/lead-magnet-capture/route.ts` y la página `/academia/lead-magnet/[slug]/page.tsx` usan `as LeadMagnetRow | null` cast directo sobre `maybeSingle()` data. Aceptable en Sprint B con seed controlado, pero antes de abrir admin panel que edite estos campos hay que añadir validación Zod en cada parsing. Ya marcado en notas de Code_Reviewer.

---

## 7. Decisiones aplazadas (no bloqueantes pero importantes)

- **i18n PT (Brasil)**: evaluar en mes 6 según tráfico orgánico LATAM. Por ahora ES neutro.
- **Stripe paywall premium**: evaluar en mes 6 según conversion academia → Dark Room membresía. Por ahora freemium.
- **Stripe Dark Room separación de PACAME**: riesgo legal anotado en `feedback_signed_approvals_y_semantic_gate.md`. No bloquea academy v1 freemium.
- **Foro / comunidad / Discord**: `community-runbook.md` define infra. Integrar en Sprint G+ cuando haya >300 suscriptores activos.

---

## Resumen ejecutivo

| Bloqueador | Acción Pablo | Acción Claude después | Crítico para… |
|---|---|---|---|
| ~~1. Migración SQL~~ | ✅ Aplicada por Claude (psycopg2 + DATABASE_URL) | — | — |
| 2. Supabase Auth | Habilitar Magic Link + Google OAuth en panel | Implementar rutas auth + dashboard | Sprint C dashboard learner |
| 3. Subdominio Resend | Añadir 3 DNS records en Cloudflare (5 min) | Lanzar `POST /domains/{id}/verify` | Que emails lleguen, no spam |
| ~~4a. Crear bucket Storage~~ | ✅ Creado por Claude (SDK + SERVICE_ROLE_KEY) | — | — |
| 4b. Subir 6 PDFs | Maquetar + upload + marcar published=true | Marcar `published=true` por SQL si Pablo prefiere | Descarga del recurso real |
| 5. Middleware rewrite | Verificar funciona en darkroomcreative.cloud/academia | Si falla, añadir rewrite a next.config | Acceso público a /academia |
| 6. Test E2E | Ejecutar 6 pasos del runbook | Iterar si algo falla | Validar Sprint B antes de Sprint C |

**Tiempo estimado Pablo restante**: 15-30 min (3 DNS records + habilitar Supabase Auth + decidir si maqueta PDF M1 ya o lo aplaza). **Tiempo Claude después**: lanzar verify Resend cuando DNS propague + ~30 min código Sprint C tras Auth.
