-- 046_image_urls_nullable.sql · 2026-05-07
-- Bug followup migration 044: cuando format='reel', image_urls debe ser NULL
-- (el contenido vive en video_url). Pero la columna seguía NOT NULL.
-- Permitir NULL + añadir CHECK que asegura coherencia format/columnas.

alter table content_queue
  alter column image_urls drop not null;

-- Garantizar coherencia: si format='reel' debe tener video_url, si no debe tener image_urls
alter table content_queue
  drop constraint if exists content_queue_format_columns_check;

alter table content_queue
  add constraint content_queue_format_columns_check
  check (
    (format = 'reel' and video_url is not null) or
    (format in ('carousel', 'post', 'story') and image_urls is not null and jsonb_array_length(image_urls) >= 1)
  );

comment on constraint content_queue_format_columns_check on content_queue is
  'Si format=reel debe tener video_url. Si format=carousel/post/story debe tener image_urls con al menos 1 URL.';
