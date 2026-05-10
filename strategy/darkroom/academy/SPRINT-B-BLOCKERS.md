# Sprint B · Bloqueadores que requieren acción de Pablo

> **Estado**: 2026-05-10 · tras commit Sprint B parcial.
> **Owner**: Pablo Calleja (manual en panel) + Claude (lo que se pueda automatizar después).
> **Propósito**: lista cerrada de cosas que NO puedo hacer yo solo desde código. Una vez resueltas, Sprint C puede arrancar.

---

## 1. Aplicar migración SQL a Supabase

**Archivo creado**: [`infra/migrations/050_academy_schema.sql`](../../../infra/migrations/050_academy_schema.sql)

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

## 3. Verificar dominio darkroomcreative.cloud en Resend

**Necesario** para que `sendDarkRoomEmail` (en `web/lib/darkroom/academy-mailer.ts`) envíe desde `Dark Academy <support@darkroomcreative.cloud>` sin caer en spam o ser rechazado.

**Pasos en panel Resend**:

1. Resend → Domains → Add Domain → `darkroomcreative.cloud`.
2. Copiar registros SPF + DKIM + DMARC.
3. Añadirlos al DNS del dominio (probablemente en Cloudflare según deployment Dark Room).
4. Verificar en Resend (puede tardar 5-60 min en propagar).
5. Confirmar que aparece como `Verified`.

**Mientras no esté verificado**: los emails de lead magnet capture llegarán a spam o serán rechazados. El endpoint funciona pero la entrega falla silenciosamente (log warning en `[academy-mailer]`).

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

**Pasos**:

1. Crear bucket en Supabase Storage:
   ```
   nombre: academy-public
   public: true
   file size limit: 10 MB
   allowed MIME: application/pdf, text/html, application/json
   ```
2. Subir los 6 lead magnets (cuando estén producidos por el subagente `dark-academy` + diseñador):
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
| 1. Migración SQL | Run en SQL Editor | Auto-publish magnets | Cualquier API academy |
| 2. Supabase Auth | Habilitar Magic Link + Google OAuth | Implementar rutas auth + dashboard | Sprint C dashboard learner |
| 3. Dominio Resend | Add domain + verificar DNS | — | Que emails lleguen, no spam |
| 4. Storage + PDFs | Crear bucket + subir 6 magnets | Marcar published=true | Descarga del recurso real |
| 5. Middleware rewrite | Verificar funciona | Si falla, añadir rewrites a next.config | Acceso público a /academia |
| 6. Test E2E | Ejecutar 6 pasos manuales | Iterar si algo falla | Validar Sprint B antes de Sprint C |

**Tiempo estimado total Pablo**: 60-90 minutos en panel Supabase + Resend + DNS. **Tiempo Claude después**: ~30 min para implementar Sprint C tras desbloqueo Auth.
