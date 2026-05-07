-- 044_content_queue_video.sql
-- Extiende content_queue para soportar reels (video) además de carruseles/posts/stories.
-- Parte del bloque DARK_FRAMES — auto-publish de reels con quality gate.
-- Aprobado por Pablo 2026-05-07: reels SÍ se auto-publican si pasan filtros.

-- 1. Permitir 'reel' en format
alter table content_queue
  drop constraint if exists content_queue_format_check;

alter table content_queue
  add constraint content_queue_format_check
  check (format in ('carousel', 'post', 'story', 'reel'));

-- 2. Columna video_url (URL pública catbox.moe del MP4)
alter table content_queue
  add column if not exists video_url text;

-- 3. Metadata del video (duración, resolución, codec, concept_id origen, gate checks)
alter table content_queue
  add column if not exists video_meta jsonb;

comment on column content_queue.video_url is
  'URL pública del MP4 (catbox.moe). Solo para format=reel. NULL para carousel/post/story.';

comment on column content_queue.video_meta is
  'Metadata del reel: { duration_s, width, height, codec, source_concept_id, cost_guard_token, visual_reviewer_status, quality_gate_checks: {...} }';

-- 4. Índice para queries del cron auto-publish sobre reels pendientes
create index if not exists content_queue_format_status_scheduled_idx
  on content_queue (format, status, scheduled_at)
  where status = 'pending';

-- 5. Tabla de auditoría del quality gate (para iterar mejoras y debug rechazos)
create table if not exists dark_frames_quality_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  concept_id text not null,
  folder_path text,
  passed boolean not null,
  failed_check text,                  -- nombre del check que falló (si passed=false)
  failed_reason text,                 -- detalle del fallo
  checks jsonb not null,              -- todos los checks ejecutados con su resultado
  enqueued_id uuid references content_queue(id) on delete set null
);

create index if not exists dark_frames_quality_log_concept_idx
  on dark_frames_quality_log (concept_id, created_at desc);

create index if not exists dark_frames_quality_log_passed_idx
  on dark_frames_quality_log (passed, created_at desc);

comment on table dark_frames_quality_log is
  'Auditoría del quality gate de reels DARK_FRAMES. Cada intento de enqueue se registra (pase o no). Sirve para iterar el gate y debug.';
