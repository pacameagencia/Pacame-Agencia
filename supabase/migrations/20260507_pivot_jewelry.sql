-- Pivot a multi-industry: añadir columnas para joyerías + tabla productos por lead
-- Migración aditiva, no rompe pipeline restaurantes

alter table public.prospect_leads
  add column if not exists industry text default 'restaurant',
  add column if not exists instagram_url text,
  add column if not exists web_url text,
  add column if not exists productos_scraped jsonb;

create index if not exists idx_prospect_leads_industry on public.prospect_leads(industry);

-- Backfill registros existentes
update public.prospect_leads set industry = 'restaurant' where industry is null;

-- Tabla nueva: productos scrapeados por lead (para demos jewelry)
create table if not exists public.lead_products (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.prospect_leads(id) on delete cascade,
  product_url text,
  image_url text,
  name text,
  price_cents integer,
  currency text default 'EUR',
  position integer default 0,
  scraped_at timestamptz default now()
);

create index if not exists idx_lead_products_lead on public.lead_products(lead_id);
create index if not exists idx_lead_products_position on public.lead_products(lead_id, position);

comment on column public.prospect_leads.industry is
  'restaurant | jewelry | (futuro: cosmetics | fashion | gourmet)';
comment on table public.lead_products is
  'Productos scrapeados de la web/IG del lead. Usados para personalizar demos jewelry.';
