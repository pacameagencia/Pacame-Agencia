# DarkRoom — Adaptación de Canales de Mensajería (WhatsApp + Telegram + Instagram)

> **Estado**: v1.0 plan de bifurcación operativo.
> **Fecha**: 2026-04-29.
> **Owner**: Pablo + CORE (refactor + env vars) + NEXUS (operaciones cuentas Meta).
> **Pre-requisito**: leer `arquitectura-3-capas.md` (regla de aislamiento por capa).

---

## El problema

PACAME ya tiene infraestructura productiva en:

- **WhatsApp Business API** (número +34 722 669 381, phone ID conectado, plantillas).
- **Telegram bot** (Pablo recibe DMs, comandos, multi-tenant para clientes).
- **Instagram Business** (cuenta @pacameagencia, OAuth, DMs, publicación posts).

**Todo usa el mismo `META_SYSTEM_USER_TOKEN`** (16 scopes, PR #56). Eso significa que si Meta banea ese token por la actividad de DarkRoom (modelo membresía colectiva, zona gris), **caen también WhatsApp + Instagram de PACAME**. Riesgo crítico documentado en `arquitectura-3-capas.md` línea 122-124.

Pablo dice "ya tenemos" → quiere reutilizar. Eso es razonable para **velocidad**, pero riesgoso para **aislamiento**.

Este doc resuelve la tensión: qué se reutiliza (código) y qué se separa (cuentas/tokens/números).

---

## Decisión: bifurcar cuentas, compartir código

### Lo que SE COMPARTE

✅ **Codebase** (`web/lib/whatsapp.ts`, `web/lib/telegram.ts`, `web/lib/instagram.ts`, `web/lib/meta-token.ts`, `web/lib/social-publish.ts`).
- Refactorizamos para aceptar parámetro `brand: "pacame" | "darkroom"`.
- Cada función resuelve env vars según el brand.
- Una sola implementación, dos tenants. Mantenimiento bajo.

✅ **Endpoints utilitarios** (cron, agent-logger, neural).
- Siguen siendo agnósticos de brand.

✅ **n8n workflows** (orquestación) — pueden ramificar por brand con un nodo `Switch`.

### Lo que NO SE COMPARTE (aislamiento obligatorio)

❌ **Meta Business Manager**. PACAME tiene `pacameagencia`. DarkRoom necesita su propio BM (`Dark Room IO`).
❌ **Meta App** (developers.facebook.com). PACAME tiene la suya. DarkRoom crea una nueva.
❌ **System User token**. Cada BM emite el suyo. **NO compartir el actual**.
❌ **Cuenta Instagram Business**. Crear @darkroomstudio (o nombre similar) nueva.
❌ **Bot Telegram**. Crear @DarkRoomBot nuevo en BotFather.
❌ **Número WhatsApp**. Opciones detalladas abajo.
❌ **Webhooks**. Endpoints diferentes (`/api/darkroom/...` o repo separado).
❌ **Verify tokens** webhook. Cada brand su string secreto.

---

## Tabla maestra de adaptación

| Recurso | PACAME (actual) | DarkRoom (nuevo) | Coste creación | Plazo |
|---|---|---|---|---|
| Meta Business Manager | `pacameagencia` | `Dark Room IO` (nuevo) | 0 € | 30 min |
| Meta App | App PACAME (App ID actual) | App DarkRoom (App ID nuevo) | 0 € | 30 min |
| Meta System User token | `META_SYSTEM_USER_TOKEN` | `DARKROOM_META_SYSTEM_USER_TOKEN` | 0 € | 15 min tras BM |
| WhatsApp número | +34 722 669 381 | nuevo (ver opciones abajo) | 0-15 €/mes | 1 día - 1 mes |
| WhatsApp phone ID | `WHATSAPP_PHONE_ID` | `DARKROOM_WHATSAPP_PHONE_ID` | — | tras alta |
| WhatsApp verify token | `pacame_wa_verify_2026` | `darkroom_wa_verify_2026` | — | inmediato |
| Telegram bot | `@PacameBot` | `@DarkRoomBot` (nuevo) | 0 € | 5 min |
| Telegram bot token | `TELEGRAM_BOT_TOKEN` | `DARKROOM_TELEGRAM_BOT_TOKEN` | — | tras crear |
| Telegram webhook secret | `TELEGRAM_WEBHOOK_SECRET` | `DARKROOM_TELEGRAM_WEBHOOK_SECRET` | — | random string |
| Instagram cuenta | @pacameagencia | @darkroomstudio (nuevo) | 0 € | 15 min |
| Instagram App ID | `INSTAGRAM_APP_ID` | `DARKROOM_INSTAGRAM_APP_ID` | — | tras App |
| Instagram verify | `pacame_ig_verify_2026` | `darkroom_ig_verify_2026` | — | inmediato |
| Webhooks Meta apuntan a | `pacameagencia.com/api/...` | `darkroomcreative.cloud/api/darkroom/...` | — | tras refactor |

**Coste mensual recurrente añadido**: 0-15 € (solo si número WhatsApp dedicado tipo Twilio).

---

## WhatsApp — 3 opciones para el número

### Opción A — Número nuevo dedicado (Recomendado)

- **Cómo**: alta de número WhatsApp Business via **Twilio** (10-15 €/mes), **MessageBird**, **360dialog**, o **alta de SIM nueva** en operador con plan datos mínimo.
- **Pro**: aislamiento total, cero confusión usuario.
- **Contra**: coste recurrente bajo + setup inicial 1-3 días en BSP.

### Opción B — Aplazar WhatsApp DarkRoom hasta MRR > 1k €

- **Cómo**: el soporte de DarkRoom Mes 1-2 va por email (`support@darkroomcreative.cloud`) + Telegram bot. WhatsApp se añade después.
- **Pro**: cero coste, simplicidad operativa.
- **Contra**: pierdes el canal de contacto preferido por hispanos.

### Opción C — Compartir el +34 722 669 381 con etiquetado interno

- **Cómo**: el mismo número responde a ambos brands. Función `sendWhatsApp` añade prefijo `[DarkRoom]` o `[PACAME]` al body.
- **Pro**: cero coste, reutilizas todo.
- **Contra**: **NO RECOMENDADO**. Confusión usuario + cliente PACAME que recibe mensaje "DarkRoom" sospecha + Meta puede correlacionar las dos brands en el mismo número.

**Recomendación DIOS**: **Opción B** durante Mes 0-2 (cero coste, simplicidad), migrar a **Opción A** en Mes 3 cuando MRR justifique los 10-15 €/mes.

Pablo decide. Si ya tiene una segunda SIM disponible, va Opción A directo.

---

## Telegram — bot nuevo

### Por qué crear @DarkRoomBot nuevo

- El bot actual (PACAME) es **personal de Pablo**: recibe queries internas tipo "genera propuesta para X cliente", crea leads, etc. Mezclar usuarios DarkRoom ahí rompe el bot.
- El bot DarkRoom será **público**: cualquier miembro puede `/start` y recibir notificaciones, soporte, comandos públicos (`/status`, `/myrank`, `/refer`).

### Setup (5 min)

1. Pablo abre Telegram → `@BotFather` → `/newbot`.
2. Nombre: "DarkRoom Bot".
3. Username: `@DarkRoomBot` (si tomado, `@DarkRoomCreativeBot` o similar).
4. BotFather devuelve token → Pablo lo guarda y manda a Pablo (env var `DARKROOM_TELEGRAM_BOT_TOKEN`).
5. `/setdescription` y `/setcommands` con los del programa.
6. CORE configura webhook: `setWebhook` a `https://darkroomcreative.cloud/api/darkroom/telegram/webhook`.
7. Comandos públicos:
   - `/start` — onboarding.
   - `/status` — estado de tu membresía.
   - `/myrank` — si eres Crew, ver tu rango y comisiones.
   - `/refer` — recibir tu link Crew personal.
   - `/support` — abrir ticket soporte humano.
   - `/legal` — links a ToS / Privacy / Cookies.

### Telegram bot interno (PACAME) — sigue igual

El bot actual (`@PacameBot`) sigue siendo el de Pablo personal/PACAME. Cero cambios. Sigue recibiendo el flujo de aprobación de contenido (ver `flujo-aprobacion-contenido.md`) si Pablo así lo decide — o se puede crear un tercer bot `@DarkRoomContentBot` solo para aprobaciones internas DarkRoom.

**Recomendación**: 1 bot interno (PACAME, ya existe) + 1 bot público (DarkRoom, nuevo). 2 totales.

---

## Instagram — cuenta nueva

### Por qué cuenta nueva

- **@pacameagencia** es la cuenta marketing PACAME.
- DarkRoom **NO se asocia públicamente con PACAME** (regla `arquitectura-3-capas.md:96`).
- Crear @darkroomstudio (o nombre similar disponible) como cuenta separada.

### Setup

1. Crear cuenta IG nueva (gratis).
2. Convertir a Business profile (gratis, en settings IG).
3. Conectar a la nueva Página Facebook DarkRoom (creada en el nuevo Business Manager).
4. Esa página DarkRoom está dentro del nuevo Meta Business Manager `Dark Room IO`.
5. App de Instagram en developers.facebook.com → asociar a la página DarkRoom.
6. Generar System User Token desde el nuevo BM con scopes:
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_manage_comments`
   - `instagram_manage_insights`
   - `instagram_manage_messages`
7. Webhook IG apunta a `https://darkroomcreative.cloud/api/darkroom/instagram/webhook`.

### Naming alternativo si @darkroomstudio está tomado

- @darkroomcrew
- @darkroomcreativecloud
- @darkroom.cloud
- @darkroom.creative

Pablo elige cuál checkear primero.

---

## Refactor del código (multi-brand)

### Antes (estado actual)

```typescript
// web/lib/whatsapp.ts
const phoneId = () => process.env.WHATSAPP_PHONE_ID;
const token = () => getMetaToken("whatsapp");

export async function sendWhatsApp(to: string, message: string) {
  // usa phoneId + token directo
}
```

### Después (multi-brand)

```typescript
// web/lib/messaging/types.ts
export type Brand = "pacame" | "darkroom";

// web/lib/messaging/whatsapp.ts
import { resolveWhatsAppConfig } from "./config";

export async function sendWhatsApp(
  to: string,
  message: string,
  opts: { brand?: Brand } = {}
) {
  const brand = opts.brand ?? "pacame";
  const { phoneId, token } = resolveWhatsAppConfig(brand);
  // ... mismo flujo, solo cambia config
}

// web/lib/messaging/config.ts
export function resolveWhatsAppConfig(brand: Brand) {
  if (brand === "darkroom") {
    return {
      phoneId: process.env.DARKROOM_WHATSAPP_PHONE_ID,
      token: process.env.DARKROOM_META_SYSTEM_USER_TOKEN || process.env.DARKROOM_WHATSAPP_TOKEN,
      verifyToken: process.env.DARKROOM_WHATSAPP_VERIFY_TOKEN || "darkroom_wa_verify_2026",
    };
  }
  // pacame default
  return {
    phoneId: process.env.WHATSAPP_PHONE_ID,
    token: process.env.META_SYSTEM_USER_TOKEN || process.env.WHATSAPP_TOKEN,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "pacame_wa_verify_2026",
  };
}
```

Aplica el mismo patrón a:

- `telegram.ts` → resuelve `TELEGRAM_BOT_TOKEN` o `DARKROOM_TELEGRAM_BOT_TOKEN`.
- `instagram.ts` → resuelve por brand IG App ID + Account ID + token.
- `meta-token.ts` → añade `DARKROOM_META_SYSTEM_USER_TOKEN` al fallback chain por brand.

**Compatibilidad retro**: si no se pasa `brand`, default = `"pacame"`. Cero rotura del código existente.

### Webhooks separados

| Función | URL PACAME (actual) | URL DarkRoom (nueva) |
|---|---|---|
| WhatsApp webhook | `pacameagencia.com/api/whatsapp/webhook` | `darkroomcreative.cloud/api/darkroom/whatsapp/webhook` |
| Instagram webhook | `pacameagencia.com/api/instagram/webhook` | `darkroomcreative.cloud/api/darkroom/instagram/webhook` |
| Telegram webhook | `pacameagencia.com/api/telegram/webhook` | `darkroomcreative.cloud/api/darkroom/telegram/webhook` |

Las nuevas rutas viven en `web/app/api/darkroom/<canal>/webhook/route.ts` (o en repo DarkRoom dedicado cuando se separe). Internamente llaman a las funciones multi-brand con `brand: "darkroom"`.

---

## n8n workflows — adaptación

| Workflow actual | Estado para DarkRoom |
|---|---|
| `01-telegram-bot.json` | Solo PACAME. NO replicar para DarkRoom (Pablo dijo: webhook Vercel directo, NO n8n). |
| `02-whatsapp-inbound.json` | Solo PACAME. Para DarkRoom: nuevo workflow `02b-darkroom-whatsapp-inbound.json` con env vars DR. |
| `03-web-form-lead.json` | Multi-brand: añadir nodo Switch por origen URL. |
| `04-content-weekly.json` | Solo PACAME. Para DarkRoom: usar el sistema flujo-aprobacion-contenido.md propuesto. |
| `08-rss-to-social.json` | Multi-brand: añadir branch DarkRoom social. |

---

## Plan de implementación

### Fase 1 — Setup cuentas (Pablo, ~2 horas)

1. Crear Meta Business Manager `Dark Room IO` (30 min) — business.facebook.com → "Crear cuenta".
2. Crear App Meta DarkRoom (30 min) — developers.facebook.com → New App.
3. Crear Telegram bot `@DarkRoomBot` con BotFather (5 min).
4. Crear cuenta Instagram `@darkroomstudio` Business (15 min).
5. Crear página Facebook DarkRoom dentro del nuevo BM (10 min).
6. Conectar IG Business a la nueva página FB (5 min).
7. Generar System User Token nuevo desde el BM DarkRoom con scopes IG + (opcional) WA (10 min).
8. **Decisión WhatsApp**: Opción A (alta nuevo número en Twilio, ~1 día), B (aplazar) o C (compartir, no recomendado).

### Fase 2 — Refactor código (CORE, 1 día)

1. Crear `web/lib/messaging/config.ts` con `resolveWhatsAppConfig`, `resolveTelegramConfig`, `resolveInstagramConfig`.
2. Refactor `web/lib/whatsapp.ts` para aceptar `opts.brand`.
3. Refactor `web/lib/telegram.ts` ídem.
4. Refactor `web/lib/instagram.ts` ídem.
5. Actualizar `web/lib/meta-token.ts` con scope `darkroom-instagram`, `darkroom-whatsapp`.
6. Tests unitarios verificando que `brand: "pacame"` mantiene comportamiento actual.
7. Actualizar `.env.local.example` con todas las nuevas vars `DARKROOM_*`.

### Fase 3 — Webhooks DarkRoom (CORE, 1 día)

1. Crear `web/app/api/darkroom/whatsapp/webhook/route.ts` (clon del actual con `brand: "darkroom"`).
2. Crear `web/app/api/darkroom/instagram/webhook/route.ts` ídem.
3. Crear `web/app/api/darkroom/telegram/webhook/route.ts` ídem.
4. Configurar webhooks en Meta Developer Dashboard apuntando a las nuevas URLs.
5. Configurar Telegram setWebhook al nuevo endpoint.

### Fase 4 — Migración progresiva al repo DarkRoom dedicado (opcional, futuro)

Cuando MRR > 5.000 €:

1. Sacar `web/lib/messaging/*` a un paquete npm interno `@darkroom/messaging`.
2. Importarlo desde el repo DarkRoom dedicado.
3. Mantener el repo PACAME consumiéndolo igual.
4. Eliminar las rutas `/api/darkroom/*` del repo PACAME (ya viven en el repo dedicado).

---

## Reglas duras

1. **NUNCA mezclar tokens**: `META_SYSTEM_USER_TOKEN` (PACAME) ≠ `DARKROOM_META_SYSTEM_USER_TOKEN`.
2. **NUNCA usar el número PACAME** para escribir cosas firmadas "DarkRoom" en producción real.
3. **NUNCA sin verify token**: cada webhook con su string secret distinto.
4. **NUNCA postear cross-brand**: la función `publishToInstagram(content, { brand: "darkroom" })` jamás llega a la cuenta @pacameagencia.
5. **Tests obligatorios** del refactor antes de merge: el comportamiento default `brand: "pacame"` debe ser idéntico al actual.

---

## Lo que falta de Pablo

1. **Confirmar opción WhatsApp** (A número nuevo / B aplazar / C compartir [no rec]).
2. **Crear Meta Business Manager DarkRoom** (30 min).
3. **Crear bot Telegram `@DarkRoomBot`** (5 min con BotFather) → enviar token a entorno seguro.
4. **Crear cuenta Instagram DarkRoom** (15 min) con username elegido.
5. **Generar nuevo System User Token** desde el BM DarkRoom (10 min tras crear BM).
6. **Confirmar plan de webhooks**: ¿en este repo bajo `/api/darkroom/*` o ya en repo separado de DarkRoom?

Sin las 6 acciones, el refactor multi-brand se hace pero sin valor real (sin tokens nuevos, sigue todo apuntando a cuentas PACAME).

---

**Siguiente bloque tras refactor**: implementar el Crew + content-queue + flujo de aprobación contra estas cuentas DarkRoom dedicadas.
