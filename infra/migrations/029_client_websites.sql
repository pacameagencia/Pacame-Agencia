-- Migration 029 · client_websites
-- Sitios externos del cliente que PACAME mantiene en remoto (WordPress, Shopify,
-- Webflow, custom). Permite a /api/clients/:id/websites/:wid/publish empujar
-- contenido generado por ATLAS al CMS del cliente sin migrar la web.
--
-- La application password se almacena cifrada con AES-256-GCM (clave
-- WP_SECRET_KEY env). Nunca plaintext.

create table if not exists client_websites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,

  -- Identidad del sitio
  platform text not null check (platform in ('wordpress','shopify','webflow','custom')),
  base_url text not null,                    -- https://joyeria-cliente.com
  label text,                                -- "Web principal", "Blog", etc.

  -- Credenciales WordPress (cifradas)
  wp_user text,
  wp_app_password_ciphertext text,           -- AES-256-GCM ciphertext (hex)
  wp_app_password_iv text,                   -- IV (hex, 12 bytes)
  wp_app_password_tag text,                  -- auth tag (hex, 16 bytes)
  wp_api_namespace text default 'wp/v2',

  -- Capacidades del sitio
  seo_plugin text default 'none' check (seo_plugin in ('yoast','rankmath','none')),
  woocommerce_enabled boolean default false,

  -- Webhook entrante (Fase 5: plugin MU envía leads aquí)
  webhook_token uuid default gen_random_uuid(),
  webhook_secret text,                        -- HMAC compartido con plugin

  -- Estado de la conexión
  status text not null default 'pending' check (status in ('pending','connected','error','disconnected')),
  last_sync_at timestamptz,
  last_publish_at timestamptz,
  last_error text,

  -- Metadata libre (versión WP detectada, plugins, etc.)
  metadata jsonb default '{}'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_client_websites_client
  on client_websites (client_id);

create unique index if not exists idx_client_websites_webhook
  on client_websites (webhook_token);

create index if not exists idx_client_websites_status
  on client_websites (status) where status != 'connected';

-- Reusa el trigger global update_updated_at() ya definido en supabase-schema.sql
drop trigger if exists client_websites_updated_at on client_websites;
create trigger client_websites_updated_at
  before update on client_websites
  for each row execute function update_updated_at();

-- RLS: service_role full access (mismo patrón que clients/leads/content)
alter table client_websites enable row level security;
drop policy if exists "Service role full access" on client_websites;
create policy "Service role full access" on client_websites
  for all using (true) with check (true);
