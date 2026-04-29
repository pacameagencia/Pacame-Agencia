-- Migration 030 · content external refs
-- Permite que una fila de `content` apunte a un post publicado en un CMS externo
-- (WordPress, Shopify, etc.). external_id + external_platform garantizan
-- idempotencia: si re-publicas el mismo content row, hacemos UPDATE no INSERT.

alter table content
  add column if not exists external_id text,                -- post id devuelto por el CMS
  add column if not exists external_url text,               -- URL pública del post
  add column if not exists external_platform text,          -- 'wordpress' | 'shopify' | ...
  add column if not exists external_modified_at timestamptz,
  add column if not exists external_website_id uuid references client_websites(id) on delete set null;

-- Índice solo sobre filas ya publicadas externamente (la mayoría no lo estarán)
create index if not exists idx_content_external
  on content (external_platform, external_id)
  where external_id is not null;

create index if not exists idx_content_external_website
  on content (external_website_id, status)
  where external_website_id is not null;
