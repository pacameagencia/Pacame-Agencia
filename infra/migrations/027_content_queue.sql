-- Migration 027 · content_queue
-- Cola de carruseles/posts/stories programados para auto-publish en IG.
-- Llenada por scripts locales o agentes PULSE; consumida por
-- /api/agents/auto-publish disparado por master-cron.

create table if not exists content_queue (
  id uuid primary key default gen_random_uuid(),

  -- Programación
  scheduled_at timestamptz not null,
  brand text not null check (brand in ('darkroom','pacame')),
  slot text check (slot in ('morning','evening','adhoc')),

  -- Payload
  format text not null default 'carousel' check (format in ('carousel','post','story')),
  image_urls jsonb not null,                      -- array de URLs públicas (catbox)
  caption text not null,
  hashtags text,

  -- Estado
  status text not null default 'pending' check (status in ('pending','publishing','published','failed','skipped')),
  post_id text,                                    -- IG media id tras publicar
  permalink text,                                  -- https://www.instagram.com/p/...
  error text,
  published_at timestamptz,
  attempts int not null default 0,

  -- Trazabilidad
  source text default 'manual',                    -- manual | calendar | agent
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_content_queue_pending
  on content_queue (scheduled_at)
  where status = 'pending';

create index if not exists idx_content_queue_brand_slot
  on content_queue (brand, slot, scheduled_at desc);

-- updated_at trigger
create or replace function content_queue_touch()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_content_queue_touch on content_queue;
create trigger trg_content_queue_touch before update on content_queue
  for each row execute function content_queue_touch();

-- RLS: lectura/escritura solo desde service role (bypassa RLS automáticamente)
alter table content_queue enable row level security;
