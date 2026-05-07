-- 047_content_queue_calendar.sql · 2026-05-07
-- Extiende content_queue para soportar el calendario operacional skeleton.
-- Antes: cada fila se creaba al momento de generar contenido (status='pending').
-- Ahora: pre-creamos las 232 filas del periodo 7-may a 31-may con status='draft'
-- + metadata del calendario (pilar, phase, concept_id_planned). El cron
-- /api/agents/render-and-enqueue las llena con contenido real cuando toca.

-- 1. caption nullable (en draft no hay caption todavía)
alter table content_queue
  alter column caption drop not null;

-- 2. Añadir 'draft' al status check si tiene constraint
do $$
begin
  -- Drop existing status check si existe
  execute 'alter table content_queue drop constraint if exists content_queue_status_check';
exception when others then null;
end $$;

alter table content_queue
  add constraint content_queue_status_check
  check (status in ('draft', 'pending', 'rendering', 'publishing', 'published', 'failed', 'skipped'));

-- 3. Columnas nuevas del calendario operacional
alter table content_queue
  add column if not exists pilar smallint check (pilar between 1 and 6),
  add column if not exists phase text check (phase in ('educar', 'introducir', 'drop_lifetime')),
  add column if not exists concept_id_planned text,
  add column if not exists day_of_week smallint check (day_of_week between 0 and 6),
  add column if not exists day_offset smallint;  -- offset desde 7-may (0..23)

comment on column content_queue.pilar is
  '6 pilares: 1=Tendencia 2=VALOR 3=Stack 4=Dark Room directo 5=Provocador 6=BTS Pablo';

comment on column content_queue.phase is
  '3 fases lanzamiento: educar (7-15 may) · introducir (16-23 may) · drop_lifetime (24-31 may)';

comment on column content_queue.concept_id_planned is
  'Solo para reels DARK_FRAMES · concept_id de la pieza planificada (ej: dark-frames-001)';

comment on column content_queue.day_of_week is
  '0=Domingo .. 6=Sábado · facilita queries por día semana';

comment on column content_queue.day_offset is
  'Días desde inicio periodo (7-may=0, 8-may=1, ..., 31-may=24)';

-- 3.b. Ampliar constraint slot para valores granulares de stories (6 slots/día)
do $$
begin
  execute 'alter table content_queue drop constraint if exists content_queue_slot_check';
exception when others then null;
end $$;

alter table content_queue
  add constraint content_queue_slot_check
  check (slot in (
    'morning', 'evening', 'adhoc',
    'story_morning', 'story_repromo_am', 'story_value',
    'story_bts', 'story_repromo_pm', 'story_recap'
  ));

-- 4. Index para queries rápidas del cron
create index if not exists content_queue_status_scheduled_idx
  on content_queue (status, scheduled_at);

create index if not exists content_queue_pilar_phase_idx
  on content_queue (pilar, phase) where status = 'draft';

create index if not exists content_queue_concept_planned_idx
  on content_queue (concept_id_planned) where concept_id_planned is not null;

-- 5. Relajar el CHECK constraint de format/columnas para permitir drafts vacíos
-- (se llenarán cuando pasen de draft → pending)
alter table content_queue
  drop constraint if exists content_queue_format_columns_check;

alter table content_queue
  add constraint content_queue_format_columns_check
  check (
    status = 'draft' or
    (format = 'reel' and video_url is not null) or
    (format in ('carousel', 'post', 'story') and image_urls is not null and jsonb_array_length(image_urls) >= 1)
  );

comment on constraint content_queue_format_columns_check on content_queue is
  'Drafts pueden estar vacíos. Cuando pasan a pending requieren video_url (reel) o image_urls (carousel/post/story).';
