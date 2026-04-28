# DarkRoom — Vercel Team Transfer + AdsPower Setup

> **Estado**: RUNBOOK ACTIVO — pasos accionables.
> **Última revisión**: 2026-04-28.
> **Owner**: Pablo (acción humana en dashboards) + CORE (modificaciones de código si surgen).
> **Pre-requisito**: ya existe el team Vercel `Dark Room IO` (`team_ApmnOAs00bIX6Kt1gTWPbRpm`) creado el 2026-04-24.
> **Bloquea**: empujar growth real (Ads, micronichos) hasta que estos dos pasos estén cerrados.

---

## A. Vercel Team Transfer

### Por qué

El proyecto `dark-room` vive en team `pacames-projects` (junto con clientes B2B, factoría PACAME y otros propios). Si Vercel suspende ese team por cualquier razón (DMCA contra DarkRoom, disputa con cliente, fallo de pago), **cae todo**. La regla es aislamiento por capa.

### Pre-checks

Antes de empezar:

- [ ] `darkroomcreative.cloud` debe seguir resolviendo correctamente DESPUÉS del transfer (Vercel no permite mover dominio asignado).
- [ ] Tener acceso owner al team `pacames-projects` Y al team `Dark Room IO`.
- [ ] Tener todas las **environment variables** de DarkRoom en un fichero local cifrado (descargables del proyecto actual via `vercel env pull`).
- [ ] Tener acceso al webhook de **Stripe** (URL + secret) para reapuntarlo si cambia el deployment URL.
- [ ] Confirmar que ningún workflow de GitHub Actions está atado al team viejo (revisar `.github/workflows/`).
- [ ] Programar el transfer en **horario de bajo tráfico** (madrugada europea, 03:00-05:00 hora España).

### Pasos (orden estricto)

#### 1. Backup completo del proyecto actual (5 min)

```powershell
# Login en team viejo
vercel login
vercel switch pacames-projects

# Pull de todas las env vars (production, preview, development)
mkdir -p ~/PrivadoPablo/DarkRoom/Backup-2026-04-XX
cd ~/PrivadoPablo/DarkRoom/Backup-2026-04-XX
vercel env pull .env.production --environment=production --yes
vercel env pull .env.preview --environment=preview --yes
vercel env pull .env.development --environment=development --yes

# Listar deployments recientes (referencia URL si hace falta rollback)
vercel ls dark-room --token=$VERCEL_TOKEN | head -10
```

✅ Verificación: tener los 3 ficheros `.env.*` con todas las claves visibles (Stripe, Supabase URL, Service Role Key, Resend, Anthropic, etc.).

#### 2. Quitar dominio del proyecto viejo (genera downtime)

Desde el dashboard Vercel `pacames-projects` → proyecto `dark-room` → Settings → Domains:

- Click en el menú `...` junto a `darkroomcreative.cloud`
- **Remove** (NO transfer, no existe entre teams).
- A partir de aquí, `darkroomcreative.cloud` deja de servir contenido.
- DNS sigue apuntando a Vercel pero no hay proyecto que responda → 404 de Vercel.

⏱ **Downtime empieza**.

#### 3. Transferir proyecto al team nuevo (10 min)

Desde el dashboard `pacames-projects` → proyecto `dark-room` → Settings → Advanced → "Transfer Project":

- Destination team: `Dark Room IO`
- Confirmar. Vercel transfiere repo conectado, deployments y env vars (Vercel mantiene env vars al transferir entre teams del mismo owner — verificar igualmente).

✅ Verificación: el proyecto aparece en `Dark Room IO` con su histórico.

#### 4. Re-añadir dominio en el nuevo team (5 min)

`Dark Room IO` → proyecto `dark-room` → Settings → Domains → Add Domain → `darkroomcreative.cloud`:

- Vercel detecta el DNS y re-asigna automáticamente.
- Si pide `www`, añadir también `www.darkroomcreative.cloud`.
- Esperar SSL automático (Vercel usa Let's Encrypt; <60s).

⏱ **Downtime termina** cuando el dominio está asignado y el SSL emitido.

#### 5. Re-validar env vars (5 min)

Verificar en `Dark Room IO` → proyecto → Settings → Environment Variables:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` (Supabase project `dark-room-prod`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (idem)
- [ ] `STRIPE_SECRET_KEY` (cuenta PACAME LIVE — Pablo decidió mantenerla)
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `RESEND_API_KEY` (re_ZPx6dkfB_… DarkRoom)
- [ ] `RESEND_FROM_EMAIL` (`support@darkroomcreative.cloud`)
- [ ] `ANTHROPIC_API_KEY` (si DarkRoom llama a IA)
- [ ] cualquier otra clave específica detectada en el `.env.production` del backup

Si alguna env var **no apareció** en el transfer, copiarla desde el backup.

#### 6. Forzar redeploy (2 min)

`Dark Room IO` → proyecto `dark-room` → Deployments → Redeploy último commit en `main` (sin caché).

✅ Verificación: deployment status = Ready en <2 min.

#### 7. Smoke tests post-transfer (15 min)

```powershell
# DNS resuelve
nslookup darkroomcreative.cloud

# HTTPS responde
curl -I https://darkroomcreative.cloud
# → HTTP/2 200 esperado

# Login flow
# (manual: abrir incognito, iniciar sesión, comprobar dashboard)

# Stripe webhook (si re-configurado)
# Dashboard Stripe → Webhooks → Recent deliveries → comprobar 200 OK reciente
```

✅ Pasa los 4 smoke tests → transfer completo.

#### 8. Apuntar Stripe webhook al nuevo URL si cambió

Si el transfer cambió la URL del deployment (improbable porque mantenemos el dominio custom), reapuntar:

- Dashboard Stripe → Developers → Webhooks → Edit endpoint:
- URL: `https://darkroomcreative.cloud/api/webhooks/stripe`
- Eventos: los mismos de antes (probablemente `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`).

#### 9. Cleanup team viejo (1 min)

Una vez confirmado que el team nuevo funciona durante 24h sin incidencias:

- `pacames-projects` → proyecto `dark-room` → Settings → **Delete Project**.
- Esto borra los deployments antiguos pero el dominio ya no está asignado, así que no afecta producción.

⚠️ **NO borrar el proyecto viejo durante las primeras 24h** — si hace falta rollback rápido, lo necesitas.

### KPI de éxito

- ✅ Downtime efectivo total < 60 min.
- ✅ Cero errores 5xx durante 24h post-transfer.
- ✅ Webhook Stripe recibe eventos al 200.
- ✅ Login + checkout funcionan end-to-end.
- ✅ Proyecto `dark-room` desaparece del team `pacames-projects`.

### Plan B (rollback)

Si algo falla durante el transfer y la web no recupera:

1. En el team `pacames-projects`, re-asignar el dominio `darkroomcreative.cloud` al proyecto original.
2. SSL se re-emite en <60s.
3. Web vuelve a estar online.
4. Investigar fallo, ajustar, re-intentar transfer en otra ventana de mantenimiento.

---

## B. AdsPower Setup Dedicado

### Por qué

DarkRoom necesita gestionar accesos rotativos a cuentas premium compartidas. Sin **fingerprint isolation + proxies residenciales**, los proveedores detectan logins anómalos (mismo email accediendo desde 30 IPs distintas en una hora) y banean. AdsPower aísla cada perfil con un browser dedicado, fingerprint único y proxy independiente.

Hoy esos perfiles están en la cuenta personal de Pablo (mezclada con otras actividades). Hay que aislar.

### Decisiones previas

- **Plan AdsPower**: Pro o Custom (según volumen de perfiles). Pro = ≈9 €/mes por 100 perfiles si hay descuento anual, sin son más, escalar.
- **Proveedor de proxies residenciales**: opciones consolidadas para España + UE:
  - **IPRoyal Royal Residential**: pay-as-you-go, ≈ 7 €/GB.
  - **BrightData**: enterprise, mayor calidad y filtros geográficos finos.
  - **Smartproxy**: balance precio/calidad, plan desde 30 €/mes con 8 GB.
  - **Recomendación**: empezar con **IPRoyal pay-as-you-go**. Bajo coste, sin compromiso. Migrar a Smartproxy o BrightData cuando volumen lo justifique.

### Pasos

#### 1. Crear cuenta AdsPower nueva (10 min)

- URL: `https://www.adspower.com/`
- Email: **`ops@darkroomcreative.cloud`** (NO el email personal de Pablo).
- Método de pago: tarjeta separada del PACAME LIVE Stripe (idealmente la futura SL DarkRoom; mientras tanto, una tarjeta virtual dedicada vía Revolut Business o similar).
- Plan: empezar con **Free** (5 perfiles) para validar setup. Upgrade a Pro cuando se confirme.

#### 2. Migrar perfiles existentes desde la cuenta personal de Pablo (45 min)

AdsPower permite **export / import** de perfiles. Pasos:

1. En la cuenta vieja (Pablo personal): Profiles → Select all DarkRoom-related → Export. Genera fichero JSON con cookies, fingerprints, proxy assignments.
2. **Pausar warming** durante la migración. Si un perfil está activo cuando lo exportas, puede haber inconsistencias.
3. En la cuenta nueva (`ops@darkroom...`): Profiles → Import → seleccionar el JSON.
4. Verificar que cada perfil arranca correctamente (fingerprint, cookies, proxy asignado).
5. **Borrar de la cuenta vieja** los perfiles ya migrados. NO mantener duplicados — provoca logins simultáneos y aumenta riesgo de baneo.

#### 3. Asignar proxies residenciales por perfil (60 min)

Regla: **1 perfil = 1 IP residencial estable**. NO rotar IPs de un perfil dado; eso dispara fraud detection en los proveedores.

- En IPRoyal/Smartproxy: comprar paquete inicial (≈ 50 €).
- Para cada perfil de AdsPower:
  - Edit → Proxy Settings.
  - Type: SOCKS5 o HTTP (según proveedor).
  - Host/Port/User/Pass del proxy específico.
  - Sticky session ID (mantiene la misma IP durante días).
- Geografía: matchear con la cuenta. Si la cuenta Adobe es US, IP US; si es España, IP España.

#### 4. Implementar session locking server-side (CORE — 4-6h código)

Lógica en backend DarkRoom (probablemente Next.js API route + Supabase):

```typescript
// Pseudo-código
async function acquireSessionLock(userId: string, sharedAccountId: string) {
  const existingLock = await supabase
    .from("shared_account_sessions")
    .select("user_id, locked_until")
    .eq("shared_account_id", sharedAccountId)
    .gt("locked_until", new Date().toISOString())
    .single();

  if (existingLock?.user_id && existingLock.user_id !== userId) {
    // Otra sesión activa. Devolver "espera" o "kick out previous".
    return { ok: false, error: "in-use", retryAfter: existingLock.locked_until };
  }

  // Adquirir lock por N minutos (default: 90 min).
  await supabase.from("shared_account_sessions").upsert({
    shared_account_id: sharedAccountId,
    user_id: userId,
    locked_until: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
  });
  return { ok: true };
}

async function releaseSessionLock(userId: string, sharedAccountId: string) {
  await supabase
    .from("shared_account_sessions")
    .delete()
    .match({ shared_account_id: sharedAccountId, user_id: userId });
}
```

Tabla SQL nueva en Supabase `dark-room-prod`:

```sql
create table if not exists shared_account_sessions (
  shared_account_id text primary key,
  user_id uuid not null references auth.users(id),
  locked_until timestamptz not null,
  created_at timestamptz not null default now()
);
create index on shared_account_sessions (locked_until);
```

Endpoint frontal: `POST /api/sessions/acquire` y `POST /api/sessions/release`.

#### 5. Cron de monitoring + alertas (CORE — 2h código)

Cron cada 15 min que detecta patrones anómalos:

- 2+ IPs distintas accediendo a la misma cuenta en <1h.
- Geo mismatch súbito (cuenta US logueada desde España en <1h).
- Tasa de errores 401/403 > 5% en una cuenta concreta.

Si dispara: alerta Telegram a Pablo + bloquea la cuenta hasta revisión manual.

#### 6. Plan de rotación tras baneo (1h doc)

Cuando una cuenta cae:

1. Detección automática (cron) o manual (Miembro reporta).
2. Cron marca cuenta como `banned` en Supabase.
3. Asigna nuevo recurso del pool a los Miembros afectados (sin que lo noten, mejor caso).
4. Compra/registra nueva cuenta del recurso baneado en background (puede requerir input humano: tarjeta nueva, email diferente, IP diferente al registro).
5. Tiempo objetivo de rotación: **<2 horas**.

### KPIs

| Métrica | Objetivo |
|---|---|
| Cuentas baneadas/mes | <2% del total |
| Tiempo medio de rotación tras baneo | <2 horas |
| Quejas de Miembros tipo "no me deja entrar" durante >12h | Cero |
| Coste mensual proxies | <150 € hasta 200 Miembros |

### Coste estimado mes 1

- AdsPower Pro: 9-29 €/mes
- Proxies IPRoyal pay-as-you-go: 30-80 €/mes según volumen
- Tarjeta virtual Revolut Business: 6-7 €/mes
- **Total**: 45-120 €/mes

Inversión inicial (setup + migración): ≈ 60 € (proxies primer paquete) + 5h trabajo Pablo.

---

## C. Cuándo abrir cada bloque

| Bloque | Cuándo |
|---|---|
| **A. Vercel transfer** | Próximas 1-2 semanas. Programar madrugada concreta cuando Pablo tenga 2h disponibles. |
| **B. AdsPower setup** | En paralelo, sin urgencia de horario. Puede empezarse hoy mismo en background. |

**Ambos son pre-requisito para empujar growth pagado a DarkRoom.** Hasta que estén cerrados, nada de Meta Ads, nada de Google Ads, nada de campañas grandes en orgánico.

---

## D. Lo que NO entra en este runbook

- **Stripe separation**: Pablo decidió mantener Stripe compartido (ver `plan-b-cease-and-desist.md` Acción 4 — pendiente de revisión si llega C&D).
- **Constitución SL DarkRoom**: aplazado hasta MRR > 1k€ (decisión Pablo registrada en plan).
- **Nuevos micronichos**: viven en runbook futuro (`growth-darkroom-funnels.md` por escribir cuando se entre FASE 3).

---

**Owner final**: Pablo Calleja firma cada KPI marcado y archiva evidencia.
