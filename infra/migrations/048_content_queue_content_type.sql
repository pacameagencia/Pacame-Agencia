-- 048_content_queue_content_type.sql · 2026-05-07
-- Añade columna content_type al content_queue para soportar los 10 tipos
-- de contenido del calendario @darkroomcreative.cloud (8-may → 31-may).
--
-- Tipos definidos en strategy/calendario-7may-31may-2026.md:
--   idea_negocio, caso_real, prompt_workflow, lista_top, dark_frames_storytime,
--   comparativa, tutorial_60s, storytime_emocional, ia_cotidiana, humor_meme,
--   tendencia_hot, recap_semana
--
-- Drop existing constraint si existe (idempotente)

do $$ begin
  execute 'alter table content_queue drop constraint if exists content_queue_content_type_check';
exception when others then null;
end $$;

alter table content_queue
  add column if not exists content_type text;

alter table content_queue
  add constraint content_queue_content_type_check
  check (content_type is null or content_type in (
    'idea_negocio',
    'caso_real',
    'prompt_workflow',
    'lista_top',
    'dark_frames_storytime',
    'comparativa',
    'tutorial_60s',
    'storytime_emocional',
    'ia_cotidiana',
    'humor_meme',
    'tendencia_hot',
    'recap_semana',
    'story_general'
  ));

comment on column content_queue.content_type is
  '10+ tipos de contenido del calendario @darkroomcreative.cloud · alineado con plan 7-may. Los stories usan story_general como tipo neutral.';

create index if not exists content_queue_content_type_idx
  on content_queue (content_type) where status in ('draft','pending');
