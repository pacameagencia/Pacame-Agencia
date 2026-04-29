-- Migration 031 · client_credentials
-- Vault genérico cifrado para credenciales de infra del cliente.
-- Permite a PACAME hablar con Hostinger API, SFTP/SSH, MySQL externos, etc.
-- sin pedir a Pablo que entre al hPanel cada vez.
--
-- El secreto se almacena cifrado AES-256-GCM con env WP_SECRET_KEY (mismo
-- helper que client_websites.wp_app_password).
--
-- IMPORTANTE: solo metadatos no sensibles van en `metadata` plaintext.
-- Tokens, passwords y llaves privadas SIEMPRE van cifrados.

create table if not exists client_credentials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,

  -- Tipo de credencial. Cada uno define qué endpoints puede usar.
  type text not null check (type in (
    'hostinger_api',     -- Bearer token developers.hostinger.com
    'sftp',              -- host+user+private_key o password
    'ssh',               -- igual que sftp pero acceso shell
    'mysql',             -- DB externa del cliente
    'cpanel',            -- API cPanel/WHM
    'plesk',             -- API Plesk
    'generic_api'        -- cualquier API genérica (tokens, OAuth)
  )),
  label text,                                  -- "Hostinger account principal"

  -- Secreto cifrado (token, password, llave privada serializada).
  ciphertext text not null,
  iv text not null,
  tag text not null,

  -- Metadatos NO sensibles para reconstruir el contexto.
  -- Ej hostinger_api: { "rate_limit_remaining": 90 }
  -- Ej sftp:          { "host": "...", "port": 22, "user": "...", "auth": "key" }
  -- Ej mysql:         { "host": "...", "port": 3306, "database": "..." }
  metadata jsonb default '{}'::jsonb,

  status text not null default 'pending' check (status in ('pending','active','error','revoked')),
  last_used_at timestamptz,
  last_error text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_client_credentials_client
  on client_credentials (client_id);

create index if not exists idx_client_credentials_type
  on client_credentials (type, status) where status = 'active';

-- Reusa el trigger global update_updated_at()
drop trigger if exists client_credentials_updated_at on client_credentials;
create trigger client_credentials_updated_at
  before update on client_credentials
  for each row execute function update_updated_at();

alter table client_credentials enable row level security;
drop policy if exists "Service role full access" on client_credentials;
create policy "Service role full access" on client_credentials
  for all using (true) with check (true);

-- Tabla auxiliar: registro de backups disparados por PACAME.
-- Cualquier op de escritura sobre infra cliente debe asociarse a un backup
-- reciente (regla "Backup antes de tocar prod cliente").
create table if not exists client_backups (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  website_id uuid references client_websites(id) on delete set null,
  source text not null,                        -- 'updraftplus' | 'hostinger' | 'sftp_dump' | 'manual_pablo'
  scope text not null default 'full' check (scope in ('full','wp-content','db','files','config')),
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  storage_url text,                            -- ubicación del backup (S3, hPanel, ZIP signed url)
  size_bytes bigint,
  triggered_by text,                           -- 'pablo' | 'support_action:reboot' | 'cron'
  notes text,
  metadata jsonb default '{}'::jsonb,
  started_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists idx_client_backups_client_recent
  on client_backups (client_id, started_at desc);

create index if not exists idx_client_backups_website_recent
  on client_backups (website_id, started_at desc) where website_id is not null;

alter table client_backups enable row level security;
drop policy if exists "Service role full access" on client_backups;
create policy "Service role full access" on client_backups
  for all using (true) with check (true);
