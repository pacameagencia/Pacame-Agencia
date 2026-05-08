# Funnel ebook · Pablo en GTA VI · Lead magnet → Dark Room conversion

> **Activación**: tras publicar reel `dark-frames-005-pablo-gta-vi` en `@darkroomcreative.cloud`
> **Objetivo**: convertir 1.000 vistas → 100 comentarios "GTA" → 70 leads email → 15 trials Dark Room → 5 paid (Pro 24,90€/mes o Lifetime 349€)
> **Coste**: $0 generación (código + Resend + Supabase free tier)
> **Maintainer**: Claude (auto-responder · email funnel) · Pablo (revisión semanal)

---

## 1 · Embudo completo (de viewer a paid)

```
viewer del reel (1.000 viewers proyectados día 1)
   │
   │ ve outro "TODO HECHO CON DARKROOMCREATIVE.CLOUD"
   │ shock + curiosidad
   ▼
comenta "GTA" en el post (10% conversion · ~100 comments)
   │
   │ trigger: regex /\bgta\b/i en webhook IG
   ▼
auto-DM 30s después con CTA email
   │
   │ "¡Aquí va el ebook 👇 (15 páginas · gratis · 2 min lectura)"
   │ "Pásame tu email y te lo envío + 4 emails extra con cosas que solo
   │  enviamos por mail · sin spam"
   ▼
usuario responde con email (70% conversion · ~70 leads)
   │
   │ valida regex /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/
   │ insert tabla lead_magnet_requests (concept_id · email · ig_user_id)
   │ trigger Resend API: enviar PDF link
   ▼
email D0 con link Supabase Storage privado al ebook PDF
   │
   │ asunto: "Tu guía Pablo en GTA VI con IA (gratis)"
   ▼
usuario lee ebook (14 páginas · 80% open · ~56 lecturas)
   │
   │ ebook: QUÉ + qué modelos + estructura
   │ NO da: prompts JSON exactos · Soul Character training paso a paso
   │ pág 13 CTA: "Continúa con Dark Room (14 días gratis)"
   ▼
secuencia 4 emails post-ebook (D2 · D5 · D8 · D12)
   │
   │ D2 "El stack completo que uso (12 herramientas)"
   │ D5 "Cómo entreno mi Soul Character en 30 minutos"
   │ D8 "Pablo en otros mundos (Stranger Things · Padrino · adelanto)"
   │ D12 "Última oportunidad: 14 días gratis Dark Room"
   ▼
trial Dark Room (15% conversion email · ~10 trials)
   │
   │ Stripe checkout 14 días gratis sin tarjeta
   ▼
trial → paid Pro o Lifetime (50% conversion · ~5 paid)
   │
   │ Pro 24,90€/mes recurring
   │ Lifetime 349€ one-time
   ▼
RESULTADO mes 1 estimado: 5 paid de un solo reel viral
```

KPIs proyectados conservadores (1.000 viewers reel):

| Métrica | Conversion | Volumen | Acumulado |
|---|---|---|---|
| Viewers reel | base | 1.000 | 1.000 |
| Comments "GTA" | 10% | 100 | 100 |
| Lead emails capturados | 70% | 70 | 70 |
| Lectura ebook | 80% | 56 | 56 |
| Trial Dark Room | 15% | 10 | 10 |
| Trial → paid | 50% | 5 | 5 |
| **Revenue mes 1** (mix 4 Pro + 1 Lifetime) | | | **~474 €** (4×24,90€ + 349€) |

Si reel pega viral (10x viewers · 10.000 viewers proyectados):
- ~50 paid · **~4.700 € revenue**

---

## 2 · Backend técnico

### 2.1 · Tabla Supabase `lead_magnet_requests`

```sql
create table lead_magnet_requests (
  id uuid primary key default gen_random_uuid(),
  concept_id text not null,                            -- 'dark-frames-005-pablo-gta-vi'
  ig_post_id text,                                     -- post de IG donde se comentó
  ig_user_id text not null,                            -- usuario IG que comentó
  ig_username text,                                    -- handle del comentarista (si disponible)
  trigger_keyword text not null default 'GTA',         -- palabra trigger (regex match)
  email text,                                          -- email cuando lo da por DM
  email_captured_at timestamptz,                       -- timestamp captura email
  ebook_sent_at timestamptz,                           -- envío Resend
  ebook_opened boolean default false,                  -- pixel tracking Resend
  funnel_d2_sent_at timestamptz,
  funnel_d5_sent_at timestamptz,
  funnel_d8_sent_at timestamptz,
  funnel_d12_sent_at timestamptz,
  trial_started_at timestamptz,                        -- crossref con Stripe
  paid_at timestamptz,                                 -- conversión paid
  paid_plan text,                                      -- 'pro_monthly' | 'lifetime'
  paid_amount_eur int,
  ig_dm_thread_id text,                                -- ID conversación IG si disponible
  status text default 'comment_received' check (status in (
    'comment_received',
    'dm_sent_request_email',
    'email_captured',
    'ebook_delivered',
    'funnel_active',
    'trial',
    'paid',
    'churned',
    'unsubscribed'
  )),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_leadmag_status on lead_magnet_requests (status);
create index idx_leadmag_created on lead_magnet_requests (created_at desc);
create index idx_leadmag_ig_user on lead_magnet_requests (ig_user_id);
create unique index idx_leadmag_email_per_concept on lead_magnet_requests (email, concept_id) where email is not null;
```

### 2.2 · Endpoint `/api/instagram/webhook` (extender existente)

Detectar comentarios con regex trigger word + auto-DM con captura email:

```ts
// web/app/api/instagram/webhook/route.ts (extender)

const TRIGGER_WORDS = {
  'dark-frames-005-pablo-gta-vi': /\bgta\b/i,
  // futuras pieces irán aquí
};

if (event.field === 'comments') {
  const comment = event.value;
  const postId = comment.media.id;
  
  // Buscar concept_id asociado al post (lookup en content_queue)
  const { data: queue } = await supabase
    .from('content_queue')
    .select('concept_id')
    .eq('post_id', postId)
    .single();
  
  if (queue?.concept_id && TRIGGER_WORDS[queue.concept_id]) {
    const regex = TRIGGER_WORDS[queue.concept_id];
    if (regex.test(comment.text)) {
      // Insertar lead
      const { data: lead } = await supabase
        .from('lead_magnet_requests')
        .insert({
          concept_id: queue.concept_id,
          ig_post_id: postId,
          ig_user_id: comment.from.id,
          ig_username: comment.from.username,
          trigger_keyword: regex.source.replace(/[\\b\\W]/g, ''),
          status: 'comment_received',
        })
        .select('id')
        .single();
      
      // Enviar DM con CTA email (30s delay para no parecer bot)
      setTimeout(() => sendInstagramDM(comment.from.id, AUTO_DM_TEMPLATE_GTA), 30000);
      
      // Actualizar status
      await supabase.from('lead_magnet_requests')
        .update({ status: 'dm_sent_request_email' })
        .eq('id', lead.id);
    }
  }
}
```

### 2.3 · Auto-DM template (voz Pablo)

```ts
const AUTO_DM_TEMPLATE_GTA = `¡Hey! Vi tu comentario.

El ebook con cómo hice ese reel de GTA VI es gratis · 14 páginas · 2 min de lectura.

Pásame tu email y te lo envío en 1 minuto. Sin tarjeta, sin spam, te das de baja con un click.

Solo el email · responde a este DM.`;
```

### 2.4 · Endpoint `/api/darkroom/lead-magnet/capture-email`

Recibe email vía DM IG (handler webhook detecta replies a auto-DM) y dispara Resend:

```ts
// web/app/api/darkroom/lead-magnet/capture-email/route.ts

export async function POST(req: NextRequest) {
  const { lead_id, email, ig_user_id } = await req.json();
  
  // Validar email
  if (!/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  
  // Update lead con email
  await supabase.from('lead_magnet_requests').update({
    email,
    email_captured_at: new Date().toISOString(),
    status: 'email_captured',
  }).eq('id', lead_id);
  
  // Generar link firmado al PDF en Supabase Storage (TTL 7 días)
  const { data: signed } = await supabase.storage
    .from('lead-magnets')
    .createSignedUrl('ebook-pablo-gta-vi-v1.pdf', 7 * 24 * 3600);
  
  // Enviar D0 email vía Resend
  await sendResendEmail({
    to: email,
    from: 'Dark Room <support@darkroomcreative.cloud>',
    subject: 'Tu guía Pablo en GTA VI con IA (gratis)',
    template: 'lead-magnet-d0-gta-vi',
    variables: {
      pdf_url: signed.signedUrl,
      first_name_guess: '', // IG no expone first name fácilmente
    },
  });
  
  // Update status + log
  await supabase.from('lead_magnet_requests').update({
    ebook_sent_at: new Date().toISOString(),
    status: 'ebook_delivered',
  }).eq('id', lead_id);
  
  // Auto-DM confirmación IG
  sendInstagramDM(ig_user_id, '¡Listo! Te acabo de enviar el ebook a tu email. Si no llega en 5 min, mira spam.');
  
  return NextResponse.json({ ok: true });
}
```

### 2.5 · Cron diario funnel post-ebook

`web/app/api/darkroom/lead-magnet/funnel-tick/route.ts` corre cada día 09:00 UTC:

```ts
// Para cada lead con email_captured_at, chequear qué email del funnel toca
const today = new Date();
const { data: leads } = await supabase
  .from('lead_magnet_requests')
  .select('*')
  .eq('status', 'ebook_delivered')
  .or('status.eq.funnel_active');

for (const lead of leads) {
  const captured = new Date(lead.email_captured_at);
  const daysElapsed = Math.floor((today - captured) / (1000 * 60 * 60 * 24));
  
  const triggers = [
    { d: 2, field: 'funnel_d2_sent_at', template: 'funnel-d2-stack-completo' },
    { d: 5, field: 'funnel_d5_sent_at', template: 'funnel-d5-soul-character' },
    { d: 8, field: 'funnel_d8_sent_at', template: 'funnel-d8-otros-mundos' },
    { d: 12, field: 'funnel_d12_sent_at', template: 'funnel-d12-ultima-oportunidad' },
  ];
  
  for (const t of triggers) {
    if (daysElapsed === t.d && !lead[t.field]) {
      await sendResendEmail({
        to: lead.email,
        template: t.template,
        variables: {
          dark_room_trial_url: 'https://darkroomcreative.cloud/trial?utm=funnel-gta-' + t.d,
        },
      });
      await supabase.from('lead_magnet_requests')
        .update({ [t.field]: new Date().toISOString() })
        .eq('id', lead.id);
    }
  }
}
```

Master-cron añade slot:
```ts
{ hour: 8, minute: 0, path: "/api/darkroom/lead-magnet/funnel-tick" }, // 10:00 ES diario
```

---

## 3 · Ebook contenido (14 páginas · info parcial deliberada)

### Estructura

| Pág | Sección | Contenido |
|---|---|---|
| 1 | Cover | "Pablo en GTA VI · Cómo lo hice con IA · Edición gratis" + URL `darkroomcreative.cloud` |
| 2 | Intro | Por qué este reel funcionó · KPIs día 1 (likes/comments/saves real) |
| 3 | Concept brief | Storyboard 3-act 18s + outro 2s · diagrama tiempos |
| 4 | Research-first | 4 DPs reales referenciados (Beebe Miami Vice 2006 · Elswit Inherent Vice · Hoytema Tenet · Sigel Drive) · NO enseña proceso completo |
| 5 | Modelo 1 · Cinematic Studio Video 3.0 | Para qué sirve · cuándo usarlo · coste 25 cr/5s · NO enseña prompts JSON exactos |
| 6 | Modelo 2 · Seedance 2.0 | Para qué sirve · genres disponibles · NO enseña shot 2 prompt completo |
| 7 | Modelo 3 · Soul Character training | Concepto general · 14 fotos input · NO enseña proceso paso a paso |
| 8 | Audio · Suno keywords | Estilo synthwave Miami Vice 80s · NO enseña keywords exactos |
| 9 | Edición · ffmpeg basics | concat + LUT cinematic + grain · NO enseña filter chain real |
| 10 | Captions burned-in | Anton font · acid green color · NO enseña posiciones safe areas |
| 11 | HUD overlay | Concepto minimap sutil · NO enseña SVG exacto |
| 12 | Outro brand | "TODO HECHO CON DARKROOMCREATIVE" · concept |
| 13 | **CTA Dark Room** | 🔓 "Continúa con el proceso completo dentro de Dark Room (14 días gratis · sin tarjeta · 24,90€/mes después)" + screenshot del dashboard |
| 14 | Pricing | Pro 24,90€/mes · Lifetime 349€ · 14 días trial · enlaces UTM |

### Tono ebook

- Tutea siempre
- Frases cortas
- Datos concretos (cr · €/mes · timestamps reales)
- Cero superlativos vacíos
- Cero promesas imposibles ("vas a viralizar seguro")
- Honestidad: "te doy el QUÉ y los modelos · el CÓMO completo está dentro de Dark Room"

---

## 4 · Email funnel post-ebook (5 emails)

| Email | Día | Asunto | CTA principal |
|---|---|---|---|
| D0 | 0 | Tu guía Pablo en GTA VI con IA (gratis) | Descarga PDF |
| D2 | 2 | El stack completo que uso (12 herramientas) | Lee post DR stack |
| D5 | 5 | Cómo entreno mi Soul Character en 30 min | Tutorial preview Dark Room |
| D8 | 8 | Pablo en otros mundos (Stranger Things · Padrino · adelanto) | Sneak peek serie · 14 días gratis |
| D12 | 12 | Última oportunidad: 14 días gratis Dark Room | Trial Dark Room (cierre del funnel) |

Plantillas Resend:
- `lead-magnet-d0-gta-vi`
- `funnel-d2-stack-completo`
- `funnel-d5-soul-character`
- `funnel-d8-otros-mundos`
- `funnel-d12-ultima-oportunidad`

Headers obligatorios:
- `From: Dark Room <support@darkroomcreative.cloud>` (regla `reference_dark_room_mailboxes.md`)
- `Reply-To: support@darkroomcreative.cloud`
- `List-Unsubscribe: <mailto:support@darkroomcreative.cloud?subject=unsubscribe>`

---

## 5 · Auto-responder DM detection

### Reglas detección email en DM reply

```ts
const EMAIL_REGEX = /[\w.+-]+@[\w-]+(\.[\w-]+)+/;

// Detectar email en reply a auto-DM
if (event.field === 'messages') {
  const dm = event.value;
  
  // Buscar lead con dm_sent_request_email para este ig_user_id
  const { data: lead } = await supabase
    .from('lead_magnet_requests')
    .select('*')
    .eq('ig_user_id', dm.sender.id)
    .eq('status', 'dm_sent_request_email')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (lead) {
    const match = dm.message.match(EMAIL_REGEX);
    if (match) {
      // Disparar /api/darkroom/lead-magnet/capture-email
      await fetch('/api/darkroom/lead-magnet/capture-email', {
        method: 'POST',
        body: JSON.stringify({
          lead_id: lead.id,
          email: match[0],
          ig_user_id: dm.sender.id,
        }),
      });
    } else {
      // Reminder amable si no detecta email
      sendInstagramDM(dm.sender.id, 'No vi un email en tu mensaje 😅 Pásame solo el email (ej: tucorreo@gmail.com) y te envío el ebook al instante.');
    }
  }
}
```

---

## 6 · Reglas duras de este funnel

1. **Cero spam** · si user no responde DM en 7 días, archivar lead status `unsubscribed`
2. **Cero dark patterns** · cancelar funnel inmediato si user dice "stop" / "para" / "unsubscribe" en cualquier email o DM
3. **Privacidad** · email solo se almacena cifrado en Supabase · cero cesión a terceros · GDPR compliant (footer obligatorio)
4. **From real** · siempre `support@darkroomcreative.cloud` (único buzón existente · regla `reference_dark_room_mailboxes.md`)
5. **Audit trail** · cada acción del funnel se loggea en `agent_activities` con `agent_id=auto-funnel`
6. **Limites** · max 5 emails por lead · después auto-archivado a `funnel_complete`
7. **Cohesión voz** · todos los emails respetan voz Dark Room (tutear · directo · cero superlativos vacíos · datos concretos)
8. **Compliance LATAM** · no añadir campo "país" · no condicionar oferta por geo · pricing siempre EUR

---

## 7 · Implementación por fases

### Fase 1 · Pre-publicación (lo que se hace antes de publicar reel)

- [ ] Migration Supabase `lead_magnet_requests` (SQL arriba)
- [ ] Bucket Supabase Storage `lead-magnets` (privado · CDN signed URLs)
- [ ] Subir `ebook-pablo-gta-vi-v1.pdf` al bucket (Pablo aprueba contenido antes)
- [ ] 5 templates Resend creados y guardados (lead-magnet-d0 + funnel-d2 + d5 + d8 + d12)
- [ ] Endpoint `/api/instagram/webhook` extendido con TRIGGER_WORDS map
- [ ] Endpoint `/api/darkroom/lead-magnet/capture-email` creado
- [ ] Endpoint `/api/darkroom/lead-magnet/funnel-tick` creado
- [ ] Slot master-cron añadido (08:00 UTC diario)

### Fase 2 · Publicación reel

- [ ] Reel `dark-frames-005-pablo-gta-vi` publicado en `@darkroomcreative.cloud`
- [ ] Caption incluye CTA explícito "Comenta GTA y te mando el ebook"
- [ ] Verificar webhook IG suscrito a `comments` + `messages` events
- [ ] Test end-to-end con un comentario propio: comment "GTA" → DM auto → email → ebook delivered

### Fase 3 · Operación + monitoring

- [ ] Daily Telegram digest: nuevos leads + emails enviados + trials Dark Room iniciados
- [ ] Alertas Telegram si funnel falla (DM no enviado · email rebotado · etc)
- [ ] Weekly review Pablo: KPIs reales vs proyectados · ajustes copy ebook si hace falta
- [ ] A/B test asunto email D0 después de 50 leads (Resend native A/B)

---

## 8 · Coste $$$

| Concepto | Coste |
|---|---|
| Migration Supabase | $0 |
| Supabase Storage 14 páginas PDF | $0 (free tier · <100 MB) |
| Resend free tier | $0 (3000 emails/mes free · suficiente para 100 leads × 5 emails = 500 emails) |
| Endpoints Vercel | $0 (Hobby plan) |
| **TOTAL infra mensual** | **$0** |

Solo si llegan >600 leads/mes: Resend Pro $20/mes (50k emails). Para volumen mes 1 = $0.

---

**Versión**: 1.0 · **Fecha**: 2026-05-08 · **Activación**: tras publicar reel concept 005
