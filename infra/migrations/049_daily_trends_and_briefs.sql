-- 049_daily_trends_and_briefs.sql · 2026-05-07
-- Tablas para el pipeline auto-content:
--   - daily_trends · output del cron /api/agents/research-trends (Apify scrape diario)
--   - daily_briefs · output del cron /api/agents/generate-brief (Claude genera contenido para los drafts)
--
-- Pipeline:
--   05:00 UTC · /api/agents/research-trends → daily_trends rows (1+ por hashtag)
--   05:30 UTC · /api/agents/generate-brief → daily_briefs rows (1 por draft de hoy en content_queue)
--   06:00 UTC · /api/agents/render-and-enqueue → actualiza content_queue draft → pending con caption + image_urls
--
-- Reglas memoria respetadas:
--   - feedback_research_first_escalado_por_tier.md → tier noticia/trend obligatorio
--   - feedback_calidad_top_no_pilotos.md → si gate falla, marca skipped (no publica relleno)

-- ─── daily_trends ──────────────────────────────────────────────────

create table if not exists daily_trends (
  id uuid primary key default gen_random_uuid(),
  scraped_at timestamptz not null default now(),
  source text not null default 'apify-instagram-hashtag-scraper',
  hashtag text not null,
  top_post_url text,
  top_post_engagement int,
  trend_summary text,
  raw_data jsonb,
  used boolean not null default false,
  used_for_brief_id uuid
);

create index if not exists daily_trends_scraped_at_idx on daily_trends (scraped_at desc);
create index if not exists daily_trends_hashtag_unused_idx on daily_trends (hashtag) where used = false;

comment on table daily_trends is
  'Output del cron /api/agents/research-trends · Apify scrape diario de hashtags IA. tier=trend en stories y posible source en carruseles tier=noticia.';

-- ─── daily_briefs ──────────────────────────────────────────────────

create table if not exists daily_briefs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date date not null,                         -- día al que aplica el brief (UTC date)
  content_queue_id uuid not null references content_queue(id) on delete cascade,
  content_type text not null,                 -- copia del content_type del draft
  research_tier text not null check (research_tier in ('cine', 'noticia', 'trend', 'opinion', 'cotidiano', 'humor')),
  brief jsonb not null,                       -- { title, hook, slides[], hashtags, source, cited_data, ... }
  status text not null default 'generated' check (status in ('generated', 'rendering', 'rendered', 'enqueued', 'skipped', 'failed')),
  error text,
  rendered_folder text,                       -- path local de output si aplica
  trends_used uuid[],                         -- referencias a daily_trends rows usadas
  generated_by_model text,                    -- 'claude-opus-4-7' / 'claude-haiku-4-5'
  tokens_used int,                            -- audit cost tracking
  generation_ms int                           -- audit performance
);

create index if not exists daily_briefs_date_idx on daily_briefs (date desc);
create index if not exists daily_briefs_status_idx on daily_briefs (status, created_at desc);
create index if not exists daily_briefs_content_queue_idx on daily_briefs (content_queue_id);

comment on table daily_briefs is
  'Output del cron /api/agents/generate-brief · Claude genera brief estructurado por cada draft de content_queue del día. Render-and-enqueue lo consume.';
