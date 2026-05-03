# DarkRoom Sales Agent — Diseño del sistema

> **Estado**: v1.0 implementado en este PR.
> **Fecha**: 2026-04-29.
> **Owner**: CORE (código) + COPY (prompts) + Pablo (decisiones de tono y escalado).
> **Pre-requisitos leídos**: `positioning.md`, `programa-afiliados.md` (Crew), `canales-mensajeria-adaptacion.md`, `proteccion-identidad.md`.

---

## El problema

Los bots actuales de PACAME (`pablo-persona.ts`, `telegram-assistant.ts`) hablan en primera persona como Pablo. **Para DarkRoom no sirve**: rompe el aislamiento de identidad y pone a Pablo como cara visible de un producto en zona gris legal.

Pablo lo dijo así: *"hasta ahora solo hablan en automático y quiero que sean inteligentes para que vendan suscripciones"*.

Necesitamos:

1. **Bot que vende**: conoce el funnel, pricing, comparativa, FAQ. Cualifica intent y avanza.
2. **Bot anónimo**: jamás menciona persona física. Habla como "el equipo DarkRoom" o "la Crew".
3. **Bot honesto**: maneja objeciones legales sin maquillar la zona gris.
4. **Multi-canal**: mismo cerebro en WhatsApp + Telegram + Instagram DM.
5. **Con tools**: puede crear leads, mandar trial links, aplicar descuentos, escalar a humano.

---

## Arquitectura (4 piezas)

```
┌────────────────────────────────────────────────────────────────┐
│   WhatsApp BM       Telegram         Instagram Direct          │
│   webhook           webhook          webhook                   │
│   /api/darkroom/    /api/darkroom/   /api/darkroom/            │
│   whatsapp/webhook  telegram/webhook  instagram/webhook        │
└────────┬───────────────┬──────────────────┬────────────────────┘
         │               │                  │
         └───────────────┼──────────────────┘
                         ▼
              ┌─────────────────────────────┐
              │   runDarkRoomAgent()        │
              │   web/lib/sales-agent/      │
              │     agent.ts                │
              └────────┬────────────────────┘
                       │
       ┌───────────────┼─────────────────────┐
       ▼               ▼                     ▼
┌───────────────┐ ┌───────────────┐ ┌──────────────────┐
│ persona-      │ │ intent.ts     │ │ tools.ts         │
│ darkroom.ts   │ │ qualifyIntent │ │ create_lead      │
│ system prompt │ │ shouldEscalate│ │ send_trial_link  │
│ anónimo +     │ │ Immediately   │ │ apply_discount   │
│ funnel        │ │               │ │ escalate_human   │
└───────────────┘ └───────────────┘ │ send_crew_invite │
                                    │ get_member_status│
                                    └────────┬─────────┘
                                             ▼
                                    ┌─────────────────┐
                                    │ Supabase        │
                                    │ Stripe          │
                                    │ Telegram alert  │
                                    └─────────────────┘
```

### Pieza 1 — `web/lib/sales-agent/persona-darkroom.ts`

System prompt anónimo. **Cero mención a personas físicas**. Habla como "el equipo DarkRoom" o "la Crew". Conoce:

- Las 3 plans (Starter 15€ / Pro 29€ / Studio 49€) y su comparativa con retail (240€).
- El modelo legal exacto ("membresía colectiva", zona gris, asume riesgo el equipo no el miembro).
- La estructura DarkRoom Crew (Init/Active/Pro/Director/Producer/TOP — pago único + recurring).
- Reglas de tono (sin emojis fuego, sin superlativos vacíos, tutea, frases cortas).
- Reglas anti-cringe (no scarcity falsa, no insistir si dicen NO).
- Cuándo invocar cada tool.
- **Qué responder si preguntan "quién está detrás"** → "DarkRoom es operada por una sociedad española. Datos legales completos en darkroomcreative.cloud/legal".

Brief por canal:
- IG: 2-3 frases máx, ultra corto, cero emojis.
- WhatsApp: 2-4 frases, listas numeradas para info larga.
- Telegram: 2-5 frases, Markdown OK, `/support` siempre disponible.

### Pieza 2 — `web/lib/sales-agent/intent.ts`

Detector regex de 12+ intents:
- `legal` → escalado inmediato (mención abogado, denuncia, cease-and-desist).
- `refund` → escalado inmediato.
- `cancel` → tool flow.
- `upgrade` / `downgrade` → tool flow.
- `refer` → invita a Crew.
- `member` → soporte (login, acceso caído, etc.).
- `pricing` / `stack` / `trial` → info comercial.
- `spam` → ignorar.
- `info` / `unknown` / `other` → fallback con pregunta cualificadora.

`shouldEscalateImmediately(intent)` corta antes del LLM en casos `legal` y `refund` — bypass directo a humano.

### Pieza 3 — `web/lib/sales-agent/tools.ts`

6 tools en formato Claude `tool_use`:

| Tool | Cuándo se llama | Side effect |
|---|---|---|
| `create_lead` | Primera vez que un contacto cualifica | INSERT `darkroom_leads` |
| `send_trial_link` | Lead pide probar o tras 2-3 turnos info | URL única + INSERT event |
| `apply_discount` | Objeción precio + lead cualificado | INSERT event (1 uso/contacto) |
| `escalate_human` | Legal/refund/agresivo/tech-issue >2 turnos | Telegram alert + INSERT escalation |
| `send_crew_invite` | Pregunta refs/afiliados/comisión | URL `/crew` + INSERT event |
| `get_member_status` | Antes de pitchear si hay duda de miembro | Query `darkroom_members` + `crew_members` |

Cada handler es no-bloqueante: si Supabase falla, el agente sigue respondiendo.

### Pieza 4 — `web/lib/sales-agent/agent.ts`

Runner principal `runDarkRoomAgent({userMessage, history, context, contactId})`:

1. **Pre-check intent** → si `legal`/`refund` escala inmediatamente sin pagar al LLM.
2. **Construye system** con `darkRoomAgentSystem(ctx)` enriqueciendo con intent detectado.
3. **Loop tool_use** (max 4 iteraciones):
   - POST a Anthropic Messages API con `system` + `messages` + `tools`.
   - Si `stop_reason: "tool_use"` → ejecuta `dispatchTool` para cada tool_use block.
   - Inyecta tool_results como user message → siguiente iter.
   - Si `stop_reason: "end_turn"` → extrae texto y devuelve.
4. **Persistencia**: el webhook llama después a `darkroom_chat_history` para guardar el turno.

Modelo: `claude-sonnet-4-6` (override con `CLAUDE_MODEL_DARKROOM_AGENT`). Sonnet maneja bien español + objeciones legales.

---

## Schema Supabase necesario (`dark-room-prod`)

Cuando Pablo deploye DarkRoom y tenga el proyecto Supabase listo, crear:

```sql
-- Leads que entran por mensajes (antes de trial)
create table darkroom_leads (
  id uuid primary key default gen_random_uuid(),
  contact_id text unique not null,                    -- ej "tg:123456" / "wa:34622..." / "ig:178..."
  channel text not null,                              -- 'whatsapp' | 'telegram' | 'instagram'
  contact_name text,
  email text,
  first_intent text,
  first_signal text,
  status text not null default 'new',                 -- 'new' | 'qualified' | 'trial' | 'paid' | 'churned' | 'spam'
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index on darkroom_leads (status, last_seen_at);

-- Eventos del lead (trial sent, discount applied, crew invite sent, etc.)
create table darkroom_lead_events (
  id bigserial primary key,
  contact_id text not null references darkroom_leads(contact_id),
  event_type text not null,                           -- 'trial_link_sent' | 'discount_applied' | etc.
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on darkroom_lead_events (contact_id, created_at);

-- Histórico de mensajes para context (los últimos 8 se pasan al agent)
create table darkroom_chat_history (
  id bigserial primary key,
  contact_id text not null,
  role text not null,                                 -- 'user' | 'assistant'
  content text not null,
  channel text not null,
  created_at timestamptz not null default now()
);
create index on darkroom_chat_history (contact_id, created_at desc);

-- Escalations (tickets internos creados por escalate_human)
create table darkroom_escalations (
  id uuid primary key default gen_random_uuid(),
  contact_id text not null,
  reason text not null,                               -- 'legal' | 'refund' | 'tech_issue' | 'abusive' | 'high_value' | 'other'
  summary text not null,
  status text not null default 'open',                -- 'open' | 'in_progress' | 'resolved' | 'wontfix'
  assigned_to text,
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index on darkroom_escalations (status, created_at);

-- Members activos (referenciado por get_member_status)
create table darkroom_members (
  id uuid primary key default gen_random_uuid(),
  contact_id text,
  email text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'starter',               -- 'starter' | 'pro' | 'studio'
  status text not null default 'trial',               -- 'trial' | 'active' | 'past_due' | 'canceled'
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);
create unique index on darkroom_members (lower(email));
create index on darkroom_members (contact_id);
```

(crew_members + crew_clicks + crew_conversions + crew_payouts ya están en `programa-afiliados.md`).

---

## Variables de entorno necesarias

Heredadas del PR anterior (`canales-mensajeria-adaptacion.md`):

```
DARKROOM_TELEGRAM_BOT_TOKEN
DARKROOM_TELEGRAM_DEFAULT_CHAT_ID
DARKROOM_TELEGRAM_WEBHOOK_SECRET
DARKROOM_WHATSAPP_PHONE_ID
DARKROOM_WHATSAPP_TOKEN
DARKROOM_WHATSAPP_VERIFY_TOKEN
DARKROOM_META_SYSTEM_USER_TOKEN
DARKROOM_INSTAGRAM_APP_ID
DARKROOM_INSTAGRAM_APP_SECRET
DARKROOM_INSTAGRAM_ACCESS_TOKEN
DARKROOM_INSTAGRAM_ACCOUNT_ID
DARKROOM_INSTAGRAM_VERIFY_TOKEN
```

Nuevas para el agente:

```
CLAUDE_API_KEY                       # ya existía, requerido
CLAUDE_MODEL_DARKROOM_AGENT          # opcional, default claude-sonnet-4-6
```

---

## Tests manuales mínimos antes de promoter producción

1. **Saludo genérico**: "Hola" → agente responde con greeting + 1 pregunta cualificadora.
2. **Pricing**: "¿Cuánto cuesta?" → menciona los 3 tiers + comparativa retail + ofrece trial.
3. **Stack**: "¿Qué herramientas incluye?" → lista categorías sin nombrar marcas explícitas (zona gris) o las nombra con disclaimer.
4. **Legal**: "¿Esto es legal?" → respuesta honesta sobre zona gris + escalado SI menciona abogado.
5. **Abogado**: "Voy a ir al abogado" → escalado inmediato sin LLM (`shouldEscalateImmediately`).
6. **Refund**: "Quiero mi dinero" → escalado inmediato.
7. **Crew**: "¿Cómo funciona lo de afiliados?" → tool `send_crew_invite` + link.
8. **Trial**: "Quiero probar" → tool `send_trial_link` con plan pro default.
9. **Identidad**: "¿Quién está detrás?" → respuesta neutra apuntando a `/legal`.
10. **Escalada por agresividad**: insultos directos → tool `escalate_human` reason=abusive.

---

## Costes estimados

Por mensaje del agente (asumiendo 1.500 input tokens system prompt + history + 200 output):

- Sonnet 4.6: ~$0.005 / mensaje
- 1.000 mensajes/mes (Mes 1): ~$5/mes
- 10.000 mensajes/mes (Mes 6): ~$50/mes

Si el coste se dispara, switch a Haiku 4.5 vía env var (`CLAUDE_MODEL_DARKROOM_AGENT=claude-haiku-4-5`) → 4-5x más barato pero peor con objeciones legales.

---

## Ya queda fuera de este PR

- **Stripe checkout para trial**: el endpoint que `send_trial_link` apunta hoy es la URL pública `/trial?plan=pro&c=...`. La implementación real Stripe se hace cuando Pablo confirme que mantenemos Stripe compartido (decisión documentada en plan operativo).
- **Schema SQL aplicado**: las migrations no se aplican en este PR. Pablo aplica cuando deploye DarkRoom y la org Supabase Dark Room IO esté lista.
- **Refactor `instagram.ts` multi-brand**: el webhook DarkRoom usa `resolveInstagramConfig` directamente; el resto de funciones IG siguen usando el patrón pacame por defecto. Refactor IG completo en sprint siguiente.
- **Dashboard interno** para ver leads/escalations/chat-history → siguiente sprint.

---

**Siguiente paso operativo**: cuando Pablo termine de cambiar nombre de las cuentas Meta (IG y FB) y configure los tokens DarkRoom, se aplican las migrations + se enchufan los webhooks en el dashboard Meta + se prueban los 10 tests manuales.
