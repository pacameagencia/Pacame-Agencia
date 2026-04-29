# DarkRoom — Flujo de Aprobación de Contenido (Agente → Pablo → Publicación)

> **Estado**: v1.0 — sistema operativo para que el agente publique solo lo que Pablo aprueba.
> **Fecha**: 2026-04-29.
> **Owner**: Pablo + PULSE (agente generación) + COPY (revisión tono) + CORE (implementación).

---

## El problema que resuelve

Pablo dijo: **"agente automático cuando el contenido me guste"**.

Traducción operativa: necesitamos un sistema donde:

1. PULSE/COPY (agente IA) genera contenido siguiendo el banco mensual + voz de marca.
2. Pablo lo revisa **rápido** (<30 segundos por pieza) desde el móvil.
3. Pablo aprueba con un gesto simple (✓/✗/✏️).
4. Si ✓ → sistema programa automático en Buffer/Later.
5. Si ✗ → se descarta y agente regenera.
6. Si ✏️ → Pablo edita un detalle, se reprograma.

**Sin email, sin abrir laptop, sin reuniones**. Pablo en bus, en sofá, en gimnasio puede aprobar 20 piezas en 10 min.

---

## Stack del flujo

### Capa 1 — Generación (agente)

- **PULSE** lee del banco `banco-contenido-mes-1.md` (y siguientes meses).
- Adapta cada pieza al evento del momento (si Pablo publicó algo concreto el día anterior, lo referencia).
- Auto-inyecta brain context vía `web/lib/llm.ts` (ya implementado en PR #69) → cada generación del agente PULSE consulta memorias + sinapsis antes de redactar.
- Genera 1-2 piezas/día por plataforma activa.
- Guarda como `content_drafts` con `status='pending_approval'`.

### Capa 2 — Cola de aprobación

- Tabla Supabase `content_drafts` con todos los drafts pendientes.
- Frontend simple: `/app/content-queue` (autenticado solo Pablo).
- Cada draft se muestra con: plataforma + día sugerido + hook + cuerpo + hashtags + tipo (VALOR/BTS/PITCH).
- 3 botones grandes:
  - ✅ **Aprobar y programar** (verde)
  - ✏️ **Editar y aprobar** (amarillo)
  - ❌ **Rechazar** (rojo)
- Móvil-first. Funciona offline (PWA).

### Capa 3 — Telegram Bot (camino corto)

Para que Pablo no tenga que abrir web cada vez:

- **Bot @DarkRoomContentBot** envía notificación a Pablo cuando hay drafts pendientes.
- Mensaje formato:
  ```
  📝 Draft pendiente · LinkedIn · VALOR
  ───────────────────────────────────────
  [Hook + body completo]
  ───────────────────────────────────────
  ✅ /aprobar_xyz123    ❌ /rechazar_xyz123
  ✏️ /editar_xyz123 (envía respuesta con texto corregido)
  ```
- Pablo responde con el comando → bot actualiza `content_drafts.status` y dispara siguiente paso.
- Funciona desde cualquier sitio (móvil, ordenador, tablet).

### Capa 4 — Publicación / Programación

- **Buffer API** o **Later API** (recomendado Buffer por simplicidad y soporte en español).
- Cuando un draft pasa a `status='approved'` → endpoint `/api/content/publish` lo manda a Buffer en la fecha programada.
- Buffer publica en LinkedIn, X, Instagram, TikTok según plataforma del draft.
- Webhook de Buffer notifica de vuelta cuando publicado → marca como `status='published'`.

### Capa 5 — Tracking y feedback loop

- Plausible recoge engagement de cada post.
- Cron diario lee Plausible → actualiza `content_drafts.engagement_score`.
- Cron semanal: el agente PULSE analiza qué piezas funcionaron mejor → ajusta el peso de cada formato en futura generación (refuerza VALOR vs BTS según conversión real).
- Esto cierra el bucle: cuanto más tiempo corra, mejor escribe el agente para esta audiencia concreta.

---

## Schema Supabase

```sql
-- Drafts de contenido en cola de aprobación
create table content_drafts (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null default 'pulse',           -- agente que lo generó
  platform text not null,                           -- 'linkedin' | 'twitter' | 'instagram' | 'tiktok'
  type text not null,                               -- 'value' | 'bts' | 'pitch'
  scheduled_at timestamptz not null,                -- cuándo se quiere publicar
  hook text not null,
  body text not null,
  hashtags text[],
  cta text,
  media_url text,                                   -- imagen/video si aplica
  status text not null default 'pending_approval',  -- 'pending_approval' | 'approved' | 'rejected' | 'published' | 'failed'
  approved_by text,                                 -- 'pablo' o user_id
  approved_at timestamptz,
  edited_body text,                                 -- si Pablo editó
  rejection_reason text,
  buffer_post_id text,                              -- ID en Buffer tras programar
  published_at timestamptz,
  engagement_score numeric(10,4),                   -- llenado por cron
  meta jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on content_drafts(status, scheduled_at);
create index on content_drafts(platform, type);
create index on content_drafts(agent_id, created_at);

-- Historial de decisiones de Pablo (para refinar el agente)
create table content_decisions (
  id bigserial primary key,
  draft_id uuid not null references content_drafts(id),
  decision text not null,                           -- 'approve' | 'edit' | 'reject'
  reason text,
  edit_diff jsonb,                                  -- diff antes/después si editó
  channel text,                                     -- 'web' | 'telegram' | 'email'
  decided_at timestamptz not null default now()
);

create index on content_decisions(draft_id);
```

---

## Endpoints Next.js

| Método | Ruta | Función |
|---|---|---|
| POST | `/api/content/generate` | PULSE genera 1+ drafts según banco. Cron diario. |
| GET | `/api/content/queue` | Lista drafts pendientes (auth Pablo). |
| POST | `/api/content/[id]/approve` | Marca como aprobado, dispara `publish`. |
| POST | `/api/content/[id]/edit` | Pablo modifica body + auto-aprueba. |
| POST | `/api/content/[id]/reject` | Marca como rechazado, opcional regenera. |
| POST | `/api/content/[id]/publish` | Manda a Buffer. Llama tras approve. |
| POST | `/api/content/buffer-webhook` | Webhook Buffer → marca como published. |
| GET | `/app/content-queue` | UI móvil-first para aprobaciones. |

---

## Telegram Bot — implementación

**Stack**: Node.js (telegram-bot-api) o n8n workflow + webhook.

**Flujo**:

```
PULSE genera draft
    ↓
INSERT en content_drafts (status='pending_approval')
    ↓
Trigger Supabase webhook → /api/content/notify-telegram
    ↓
Bot manda mensaje a Pablo con botones inline:
    ┌─────────────────────────────────┐
    │ 📝 LinkedIn · VALOR · prog 9:00  │
    │ ───────────────────────────────  │
    │ [Hook]                           │
    │ [Body resumido a 280 chars]      │
    │ ───────────────────────────────  │
    │  [✅ Aprobar] [✏️ Editar] [❌ No] │
    └─────────────────────────────────┘
    ↓
Pablo pulsa botón
    ↓
Telegram callback → /api/telegram/callback
    ↓
Update content_drafts.status según decisión
    ↓
Si approved → trigger /api/content/[id]/publish
```

**Comandos del bot** (alternativa a botones):

- `/queue` → muestra próximos 5 drafts pendientes.
- `/today` → muestra publicaciones programadas para hoy.
- `/stats` → engagement último 7 días.
- `/pause` → pausa generación automática 24h.
- `/resume` → reanuda.

**Setup técnico**:

1. Crear bot en BotFather (`@DarkRoomContentBot`).
2. Token en env `TELEGRAM_BOT_TOKEN`.
3. Webhook apuntando a `https://darkroomcreative.cloud/api/telegram/webhook`.
4. Pablo `/start` el bot — bot guarda su `chat_id`.
5. Solo Pablo recibe notifications (whitelist por chat_id).

---

## UI mobile-first `/app/content-queue`

Diseño minimalista:

```
┌──────────────────────────────────────────┐
│  📝 DarkRoom · cola de contenido         │
│  3 pendientes · 12 aprobados esta semana │
├──────────────────────────────────────────┤
│  📍 LinkedIn · VALOR · mañana 9:00       │
│                                          │
│  Hilo: 240€ vs 29€ — la matemática del   │
│  stack creativo                          │
│                                          │
│  [Hago la cuenta sin redondear...]       │
│                                          │
│  [tap para ver completo]                 │
│                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐     │
│  │   ✅   │  │   ✏️   │  │   ❌   │     │
│  │APROBAR │  │EDITAR  │  │RECHAZAR│     │
│  └────────┘  └────────┘  └────────┘     │
├──────────────────────────────────────────┤
│  📍 X · BTS · pasado mañana 13:00        │
│  ...                                     │
└──────────────────────────────────────────┘
```

**Reglas UX**:

- Tap en preview → modal con texto completo + edición inline (textarea).
- Si edita → al pulsar "Aprobar" se guarda diff + se programa la versión editada.
- Swipe derecha = aprobar (gesto rápido).
- Swipe izquierda = rechazar.
- Cada acción tiene 5s de "deshacer" (toast con countdown).
- Modo oscuro nativo.

---

## Reglas duras del flujo

1. **Nunca se publica algo NO aprobado por Pablo**. Cero auto-publicación.
2. **Pablo puede pausar todo** desde Telegram con `/pause` si va de viaje.
3. **Si un draft lleva 24h sin aprobar**, el agente lo descarta automáticamente y genera otro.
4. **Si el agente genera algo que rompe la voz de marca** (detectado por COPY auto-review post-generación), se descarta sin pasar a Pablo. Reduce ruido.
5. **Drafts del banco mensual revisado por Pablo** se suben pre-aprobados (sin pasar por cola). El banco existe precisamente para esto.
6. **Cero piezas con mención a PACAME** publicadas (validación automática regex antes de aprobar).

---

## Plan de implementación

### Sprint A (1 semana, CORE)

- [ ] Schema SQL `content_drafts` + `content_decisions`.
- [ ] Endpoints `/api/content/*` básicos.
- [ ] Web UI `/app/content-queue` mobile-first.

### Sprint B (1 semana, CORE)

- [ ] Telegram bot (BotFather + webhook + comandos).
- [ ] Integración Buffer API para programación.
- [ ] Webhook Buffer → mark as published.

### Sprint C (1 semana, PULSE)

- [ ] Generación automática diaria desde banco + brain context.
- [ ] Auto-review COPY post-generación (filtra ruido antes de Pablo).
- [ ] Cron de feedback loop con Plausible engagement scores.

### Total: 3 semanas para sistema completo. Pablo aprueba todo desde móvil.

---

## Lo que falta de Pablo

1. **Crear bot Telegram** (5 min en BotFather), enviar token a Pablo personal.
2. **Cuenta Buffer** (gratuito hasta 3 cuentas, paid 5€/mes para 10 cuentas).
3. **Confirmar plataformas activas Mes 1** (vimos 4 RRSS + Reddit + Discord + foros).

---

## Bonus: integración con Discord

Cuando un draft se aprueba y se publica:

- Bot Discord postea automáticamente en `#crew-pro` un anuncio: "🎬 Nuevo post en LinkedIn — [link]" para que la Crew lo amplifique.
- Crew miembros activos reciben push notification.
- Métricas de re-share desde Discord se atribuyen al motor "Crew amplification".

Esto multiplica el alcance orgánico × N (Crew members con ganas de amplificar para subir de rango).

---

**Versión**: 1.0
**Próxima revisión**: tras Sprint A live + 30 días de uso real.
