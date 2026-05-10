# Dark Academy — Arquitectura técnica v1

> **Versión**: 1.0 · 2026-05-10
> **Owner**: subagente `core` + Pablo (validación final).
> **Estado**: diseño aprobado · implementación pendiente (Sprint B+).
> **Dominio**: `darkroomcreative.cloud/academia` y `darkroomcreative.cloud/noticias`.
> **Stack**: Next.js 16 + React 19 + TypeScript + Supabase + Resend + Vercel.

---

## Flujo de usuario · diagrama de funnel

```
┌─────────────────────────┐
│ Feed @darkroomcreative  │
│ + Periódico IA SEO      │
│   (/noticias)           │
└────────────┬────────────┘
             │
             │ CTA: "regístrate · acceso inmediato a las lecciones"
             ▼
┌─────────────────────────┐
│ Landing /academia       │
│ Valor + lead magnet     │
└────────────┬────────────┘
             │
             │ Captura email (Supabase Auth · magic link)
             ▼
┌─────────────────────────┐
│ Email magic link        │  ─── Resend
│ (sin contraseña)        │
└────────────┬────────────┘
             │
             │ Click → autenticado
             ▼
┌─────────────────────────┐
│ Dashboard               │
│ /academia/dashboard     │
│ Progreso 0-100%         │
│ Próxima lección         │
│ Lead magnets módulo     │
└────────────┬────────────┘
             │
             │ Selecciona lección
             ▼
┌─────────────────────────┐
│ Lección                 │
│ /academia/[m]/[l]       │
│ Marca completada →      │
│ POST /api/academy/      │
│ progress                │
└────────────┬────────────┘
             │
             ▼
   Newsletter quincenal (Resend cron)
   Suscripción Dark Room (paywall opcional, Stripe)
```

---

## Decisión arquitectónica · resumen

| Decisión | Elección | Razón |
|---|---|---|
| Repo y rutas | `web/app/darkroom-home/academia/` y `web/app/darkroom-home/noticias/` | Middleware ya reescribe `darkroomcreative.cloud/` → `/darkroom-home`. Reutiliza infra Vercel team `Dark Room IO`. |
| Auth | Supabase Auth con magic link (email) + OAuth Google | Cero fricción. LATAM tiende a usar Gmail. Sin contraseña que recordar. |
| Proyecto Supabase | `dark-room-prod` (org `Dark Room IO` · `kxqcyukivvfygvrxxant`) | Aislado de PACAME (compliance). Compartido con resto Dark Room. |
| Progreso | Tabla `academy_progress` por user_id + lesson_id | Granular. Permite dashboard 0-100 + analítica por lección. |
| i18n | ES neutro v1 (audiencia LATAM + España con español neutro funciona) | Evita complejidad i18n inicial. Reevaluar en v2 si MX/AR/BR demandan PT. |
| Stripe paywall | Freemium primero · sin paywall en v1 | Lead magnets gratis tras registro. Conversion a Dark Room membresía (paywall existente) viene después. |
| Periódico IA scraper | Cron Vercel diario · publicación con review subagente | Tráfico SEO + funnel hacia academia. |

---

## Schema Supabase · DDL

> **Proyecto destino**: `dark-room-prod` (org `Dark Room IO`).
> Migración: `supabase/migrations/20260512_academy_schema.sql` (a crear en Sprint B).

```sql
-- ============================================================
-- ACADEMY USERS (extiende auth.users de Supabase)
-- ============================================================
create table public.academy_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  locale text default 'es' not null check (locale in ('es', 'pt', 'en')),
  display_name text,
  source text, -- 'leadmagnet_m1', 'organic', 'noticias', 'newsletter', 'feed_ig', 'feed_tt'
  current_module text default 'M1',
  current_lesson text default 'M1.L1',
  total_progress_pct numeric(5,2) default 0 not null check (total_progress_pct >= 0 and total_progress_pct <= 100),
  created_at timestamptz default now() not null,
  last_active_at timestamptz default now() not null,
  newsletter_subscribed boolean default true not null,
  marketing_consent boolean default false not null
);

create index idx_academy_users_email on public.academy_users(email);
create index idx_academy_users_last_active on public.academy_users(last_active_at desc);

alter table public.academy_users enable row level security;

create policy "users_select_own" on public.academy_users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.academy_users
  for update using (auth.uid() = id);

create policy "service_role_full" on public.academy_users
  for all using (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- ACADEMY MODULES (catalog · semi-static, syncado desde curriculum.md)
-- ============================================================
create table public.academy_modules (
  id text primary key, -- 'M1', 'M2', ..., 'M6'
  slug text unique not null, -- 'fundamentos-ia-visual', 'prompting-basico', etc.
  title text not null,
  position int not null,
  weight_pct numeric(5,2) not null check (weight_pct > 0 and weight_pct <= 100),
  pct_start numeric(5,2) not null,
  pct_end numeric(5,2) not null,
  description text,
  -- lead_magnet linkado vía academy_lead_magnets.module_id (relación 1:N desde magnet→módulo)
  published boolean default false not null,
  created_at timestamptz default now() not null
);

create index idx_academy_modules_position on public.academy_modules(position);

alter table public.academy_modules enable row level security;

create policy "modules_select_published" on public.academy_modules
  for select using (published = true);

-- ============================================================
-- ACADEMY LESSONS (catalog · cada lección)
-- ============================================================
create table public.academy_lessons (
  id text primary key, -- 'M1.L1', 'M1.L2', ..., 'M6.L4'
  module_id text references public.academy_modules(id) on delete cascade not null,
  slug text not null,
  title text not null,
  position int not null,
  duration_min int not null check (duration_min between 5 and 30),
  pct_start numeric(5,2) not null,
  pct_end numeric(5,2) not null,
  content_md text, -- markdown completo de la lección (fuente: archivos curriculum/M{n}-{slug}/L{n}-{slug}.md)
  video_url text, -- opcional · video tutorial
  prompt_copiable text, -- el prompt principal de la lección
  exercise_brief text, -- enunciado del ejercicio
  quick_win text, -- el reward final de la lección
  prereq_lesson_id text references public.academy_lessons(id),
  visual_asset_url text, -- mockup o diagrama
  quiz_id text references public.academy_quizzes(id),
  published boolean default false not null,
  created_at timestamptz default now() not null
);

create unique index idx_academy_lessons_module_position on public.academy_lessons(module_id, position);
create index idx_academy_lessons_prereq on public.academy_lessons(prereq_lesson_id);

alter table public.academy_lessons enable row level security;

create policy "lessons_select_published" on public.academy_lessons
  for select using (published = true);

-- ============================================================
-- ACADEMY PROGRESS (1 fila por user × lesson · marca completada)
-- ============================================================
create table public.academy_progress (
  user_id uuid references public.academy_users(id) on delete cascade not null,
  lesson_id text references public.academy_lessons(id) on delete cascade not null,
  completed_at timestamptz default now() not null,
  quiz_score numeric(5,2) check (quiz_score >= 0 and quiz_score <= 100),
  exercise_submitted_url text, -- opcional · link a entrega del alumno
  primary key (user_id, lesson_id)
);

create index idx_academy_progress_user on public.academy_progress(user_id);
create index idx_academy_progress_lesson on public.academy_progress(lesson_id);

alter table public.academy_progress enable row level security;

create policy "progress_select_own" on public.academy_progress
  for select using (auth.uid() = user_id);

create policy "progress_insert_own" on public.academy_progress
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- ACADEMY LEAD MAGNETS (un magnet por módulo · downloadable)
-- ============================================================
create table public.academy_lead_magnets (
  id text primary key, -- 'lm-m1-stack-2026', 'lm-m3-three-pass-review', etc.
  module_id text references public.academy_modules(id),
  slug text unique not null,
  title text not null,
  description text not null,
  format text not null check (format in ('pdf', 'notion', 'json', 'csv', 'zip')),
  asset_url text not null, -- Supabase Storage path · bucket 'academy-public'
  capture_url text not null, -- '/academia/lead-magnet/{slug}'
  captured_count int default 0 not null,
  published boolean default false not null,
  created_at timestamptz default now() not null
);

create index idx_academy_lead_magnets_module on public.academy_lead_magnets(module_id);

alter table public.academy_lead_magnets enable row level security;

create policy "lead_magnets_select_published" on public.academy_lead_magnets
  for select using (published = true);

-- ============================================================
-- ACADEMY QUIZZES (1 quiz por lección · 5-7 preguntas)
-- ============================================================
create table public.academy_quizzes (
  id text primary key, -- 'qz-m1-l5', 'qz-m3-l7', etc.
  lesson_id text references public.academy_lessons(id) on delete cascade not null,
  questions jsonb not null, -- array de { q, options: [], correct_idx, explanation }
  pass_threshold numeric(5,2) default 60.0 not null,
  created_at timestamptz default now() not null
);

alter table public.academy_quizzes enable row level security;

create policy "quizzes_select_with_lesson" on public.academy_quizzes
  for select using (true); -- mismo gating que la lección

-- ============================================================
-- NEWS ARTICLES (periódico IA · /noticias)
-- ============================================================
create table public.academy_news (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text not null,
  body_md text not null,
  source_url text not null, -- fuente original (paper, release, X post)
  source_name text not null, -- 'OpenAI', 'Anthropic', 'HuggingFace', 'Reddit r/MachineLearning', etc.
  source_published_at timestamptz,
  category text check (category in ('release', 'paper', 'tutorial', 'opinion', 'workflow')),
  hero_image_url text,
  ai_summary boolean default true not null, -- si el cuerpo lo generó claude API o se escribió a mano
  reviewed_by_human boolean default false not null,
  published boolean default false not null,
  published_at timestamptz,
  views_count int default 0 not null,
  created_at timestamptz default now() not null
);

create index idx_academy_news_published_at on public.academy_news(published_at desc) where published = true;
create index idx_academy_news_category on public.academy_news(category);

alter table public.academy_news enable row level security;

create policy "news_select_published" on public.academy_news
  for select using (published = true);

-- ============================================================
-- NEWSLETTER ISSUES (quincenal · Resend)
-- ============================================================
create table public.academy_newsletter (
  id uuid primary key default gen_random_uuid(),
  issue_number int unique not null,
  title text not null,
  body_md text not null,
  sent_at timestamptz,
  recipients_count int,
  open_rate numeric(5,2),
  click_rate numeric(5,2),
  resend_broadcast_id text,
  created_at timestamptz default now() not null
);

alter table public.academy_newsletter enable row level security;

create policy "newsletter_select_sent" on public.academy_newsletter
  for select using (sent_at is not null);
```

---

## Rutas Next.js · `web/app/darkroom-home/`

### Páginas públicas

| Ruta pública | Path repo | Tipo | Descripción |
|---|---|---|---|
| `/academia` | `academia/page.tsx` | RSC + ISR 1h | Landing pública academy. Hero + 6 módulos visual + valor + CTA registro. |
| `/academia/lead-magnet/[slug]` | `academia/lead-magnet/[slug]/page.tsx` | RSC | Captura email para descargar magnet específico. |
| `/academia/registro` | `academia/registro/page.tsx` | Client | Form magic link Supabase Auth. |
| `/academia/auth/callback` | `academia/auth/callback/route.ts` | Route Handler | Callback magic link · setea session. |
| `/noticias` | `noticias/page.tsx` | RSC + ISR 1h | Index periódico IA. Cards de artículos. |
| `/noticias/[slug]` | `noticias/[slug]/page.tsx` | RSC + ISR 4h | Artículo individual con CTA "regístrate en la academia". |

### Páginas autenticadas

| Ruta | Path repo | Tipo | Auth |
|---|---|---|---|
| `/academia/dashboard` | `academia/(authenticated)/dashboard/page.tsx` | RSC server-component | Sí · `redirect('/academia/registro')` si no session |
| `/academia/[modulo]/[leccion]` | `academia/(authenticated)/[modulo]/[leccion]/page.tsx` | RSC | Sí |
| `/academia/ejercicio/[lesson_id]` | `academia/(authenticated)/ejercicio/[lesson_id]/page.tsx` | Client | Sí |
| `/academia/portfolio` | `academia/(authenticated)/portfolio/page.tsx` | RSC | Sí · ejercicio final M6.L4 |

### API routes

| Endpoint | Path | Método | Auth | Descripción |
|---|---|---|---|---|
| `/api/academy/progress` | `api/academy/progress/route.ts` | POST | Session cookie | Marca lección completada · valida user_id + lesson_id · inserta en `academy_progress` · recalcula `academy_users.total_progress_pct` |
| `/api/academy/quiz-submit` | `api/academy/quiz-submit/route.ts` | POST | Session | Recibe respuestas quiz · guarda score · si pasa threshold → marca lección completada |
| `/api/academy/lead-magnet-capture` | `api/academy/lead-magnet-capture/route.ts` | POST | Anónimo | Captura email + magnet slug · crea Supabase user con magic link · envía Resend con descarga |
| `/api/academy/subscribe-newsletter` | `api/academy/subscribe-newsletter/route.ts` | POST | Anónimo o session | Marca `newsletter_subscribed=true` o crea suscripción nueva |
| `/api/academy/news/scrape` | `api/academy/news/scrape/route.ts` | POST (cron) | Vercel cron secret | Cron diario · scrape fuentes IA · pasa a Claude API · publica candidatos en `academy_news` con `reviewed_by_human=false` |
| `/api/academy/news/publish/[id]` | `api/academy/news/publish/[id]/route.ts` | POST | Admin only | Publica artículo tras review humano (subagente `dark-academy` o Pablo). Marca `published=true` + `published_at=now()`. |
| `/api/academy/newsletter/send/[issue]` | `api/academy/newsletter/send/[issue]/route.ts` | POST (cron) | Vercel cron | Cron quincenal · genera issue desde últimas 14 días `academy_news` + lecciones publicadas + lead magnet rotativo → Resend broadcast |

---

## Scraper Periódico IA · diseño

### Fuentes a scrapear (cron Vercel diario · 06:00 UTC)

| Fuente | Tipo | Cobertura |
|---|---|---|
| OpenAI blog RSS | release / opinion | Releases ChatGPT, GPT-5, modelos |
| Anthropic blog RSS | release / paper | Releases Claude, research papers |
| HuggingFace papers daily | paper | Top papers IA del día |
| Reddit r/MachineLearning RSS | tutorial / opinion | Discusiones técnicas top |
| Twitter listas curadas (Apify) | release / opinion | Cuentas IA seleccionadas (Sam Altman, demishassabis, etc.) |
| Replicate releases RSS | release | Nuevos modelos publicados |

### Pipeline scraper

```
cron diario 06:00 UTC
  ↓
1. fetch RSS / Apify → array de items raw (50-100/día)
  ↓
2. dedupe contra academy_news.source_url existentes
  ↓
3. para cada item nuevo:
   a. POST a Claude API (claude-haiku-4-5) con prompt:
      "Resume este release en 400 palabras en español neutro,
       tono Dark Room (tutea, frases ≤25 palabras, datos concretos,
       cero adjetivos vacíos, cero palabras IA-trilladas).
       Termina con un párrafo 'Qué significa para creators'.
       NO inventes datos. Si falta info, dilo."
   b. Generar slug + excerpt (50-80 palabras) + category
   c. Insert en academy_news con published=false, reviewed_by_human=false
  ↓
4. notificar a Pablo (Telegram bot) con N artículos pendientes review
  ↓
5. subagente `dark-academy` o Pablo revisa y publica en lote vía /api/academy/news/publish/[id]
```

### Review humano obligatorio

Cero auto-publish sin revisión. El subagente `dark-academy` puede:
- Aprobar (`published=true`)
- Pedir reescritura (regenerar con Claude + ajustar prompt)
- Descartar (mantener `published=false`)

Cada artículo publicado lleva CTA al final:

> **Usa el mismo stack. Empieza en 8 minutos.**
> Dark Academy: de cero a primera pieza decente en 90 minutos.
> [Únete gratis →](/academia)

---

## Newsletter quincenal · diseño

### Estructura (≤600 palabras · 1 idea principal · 1 CTA)

```
Hola creator,

[Hook · 30 palabras · dato concreto o pregunta provocadora]

[Idea principal · 200 palabras · 1 concepto del módulo de la quincena o noticia destacada]

[Quick-win · 100 palabras · 1 prompt copiable o template descargable]

[Lo que está sucediendo · 100 palabras · 3-4 bullets de las noticias IA más relevantes de los 14 días con link a /noticias/[slug]]

[CTA · 50 palabras · "Si todavía no estás en Dark Academy, empezamos por M1 en 8 minutos. [Únete →]"]

[Footer · brand + unsubscribe]
```

### Cron

- Cron Vercel · cada 14 días · viernes 10:00 UTC.
- Source de inspiración: últimas 14 días `academy_news` con más views + lecciones recién publicadas + lead magnet rotativo del mes.
- Genera draft con Claude · subagente `dark-academy` revisa · envía Resend broadcast.

---

## Roadmap por sprints

| Sprint | Tareas técnicas | Tareas contenido |
|---|---|---|
| **Sprint A** (HECHO) | Subagente + currícula + arquitectura + transformation-log | — |
| **Sprint B** | Migración SQL · Supabase Auth setup · landing `/academia` v1 · API `/api/academy/lead-magnet-capture` | Lead magnet M1 (PDF "Mapa stack 2026") |
| **Sprint C** | Dashboard autenticado · API `/api/academy/progress` · página lección genérica | Subagente redacta M1 (5 lecciones) + M2 (6 lecciones) + lead magnet M2 |
| **Sprint D** | Quiz UI + API `/api/academy/quiz-submit` · subida ejercicios opcional | Subagente redacta M3 (8 lecciones) + lead magnet M3 |
| **Sprint E** | Scraper noticias IA · `/noticias` ISR · API `/api/academy/news/scrape` cron | Subagente redacta M4 (6 lecciones) + lead magnet M4 + 5 artículos `/noticias` semilla |
| **Sprint F** | Newsletter cron · `/api/academy/newsletter/send/[issue]` | Subagente redacta M5 (5) + M6 (4) + lead magnets M5+M6 |
| **Sprint G** | Stripe paywall opcional (si decisión es freemium → premium tier) | 3 primeras newsletters quincenales |

---

## Decisiones aplazadas / pendientes

- **i18n PT (Brasil)** · evaluar en mes 6 según tráfico orgánico LATAM.
- **Stripe paywall premium** · evaluar en mes 6 según conversion academia → Dark Room membresía.
- **Mobile app** · fuera de scope v1 · web responsive suficiente.
- **Stripe separación Dark Room vs PACAME** · riesgo legal anotado en `feedback_signed_approvals_y_semantic_gate.md` · no bloquea academy v1 freemium.
- **Comunidad / foro / Discord** · `community-runbook.md` define infra · integrar en Sprint G+.

---

## Costes operativos estimados (mes 12, escenario 3.000 suscriptores)

| Concepto | Coste/mes |
|---|---|
| Supabase Pro (proyecto `dark-room-prod`) | $25 |
| Vercel team Dark Room IO (Pro) | $20 |
| Resend (10k emails/mes plan) | $20 |
| Claude API (scraper noticias diario · ~600 calls/mes haiku) | $5 |
| Apify (Twitter scraping) | $30 |
| Dominio `darkroomcreative.cloud` (anual prorrateado) | $1 |
| **Total** | **~$101/mes** |

Comparativa retail si se construyera con Teachable / Kajabi / Circle:
- Teachable Pro: $99/mes · sin custom domain en plan medio.
- Kajabi Basic: $149/mes.
- Circle Plus: $89/mes (solo comunidad).

Infra propia gana en flexibilidad + integración Dark Room ecosystem + cero comisión sobre ventas futuras.

---

## Verificación end-to-end (Sprint B+)

1. **Auth flow**: usuario anónimo → captura email lead magnet → recibe email Resend con magic link → click → autenticado → redirect a dashboard → ve progreso 0%.
2. **Lección completada**: alumno completa M1.L1 → POST `/api/academy/progress` → `academy_users.total_progress_pct = 3.0%` (15% módulo / 5 lecciones).
3. **Quiz**: alumno responde quiz M1 → score ≥60 → lección marcada completada automáticamente.
4. **Lead magnet**: alumno descarga magnet M3 → si no estaba registrado, queda registrado en `academy_users` con `source='leadmagnet_m3'`.
5. **Scraper noticias**: cron 06:00 UTC → 5 artículos nuevos en `academy_news` con `published=false` → Pablo recibe Telegram con lista → publica los buenos vía endpoint admin.
6. **Newsletter**: cron quincenal → broadcast Resend → open rate ≥35% (KPI).

---

## Changelog

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-05-10 | v1.0 · arquitectura aprobada | Pablo + subagente core (diseño) |
