-- Prospect leads CRM — tabla principal + tabla de eventos email + RLS
--
-- Diseño:
--   - prospect_leads: 1 fila por lead enviado, estado actual cacheado
--   - email_events: append-only de cada evento Resend (open, click, bounce, complaint)
--   - vista prospect_leads_with_metrics: lead + open_count, click_count, último evento
--
-- RLS: leen owners (Pablo). Webhook escribe con service_role.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────
-- prospect_leads
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.prospect_leads (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  email text not null,
  city text,
  province text,
  postal text,
  type text,
  cuisine text,
  phone text,
  category text,                          -- lead-A-sin-web | lead-B-web-rota | etc
  vercel_url text,                        -- https://<slug>.vercel.app
  resend_message_id text,                 -- ID retornado por Resend al enviar
  campaign text default 'restaurantes-spain-2026-05',

  -- Estado actual
  status text default 'pending',          -- pending | sent | delivered | opened | clicked | replied | bounced | complained | unsubscribed | won | lost
  sent_at timestamptz,
  delivered_at timestamptz,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  open_count integer default 0,
  first_clicked_at timestamptz,
  last_clicked_at timestamptz,
  click_count integer default 0,
  bounced_at timestamptz,
  bounce_reason text,
  complained_at timestamptz,
  unsubscribed_at timestamptz,
  replied_at timestamptz,
  reply_text text,

  -- Comercial
  notes text,                             -- notas Pablo
  closed_won_at timestamptz,
  closed_lost_at timestamptz,
  deal_value_eur numeric(8, 2),

  -- Metadata
  raw jsonb,                              -- payload original del CSV/OSM
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists prospect_leads_status_idx on public.prospect_leads (status);
create index if not exists prospect_leads_email_idx on public.prospect_leads (email);
create index if not exists prospect_leads_city_idx on public.prospect_leads (city);
create index if not exists prospect_leads_category_idx on public.prospect_leads (category);
create index if not exists prospect_leads_resend_msg_idx on public.prospect_leads (resend_message_id);
create index if not exists prospect_leads_sent_at_idx on public.prospect_leads (sent_at desc nulls last);

-- ─────────────────────────────────────────────────────────────────
-- email_events (append-only de eventos Resend)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.prospect_leads(id) on delete cascade,
  resend_message_id text,
  event_type text not null,               -- email.sent | email.delivered | email.opened | email.clicked | email.bounced | email.complained
  occurred_at timestamptz default now(),
  raw jsonb,                              -- payload original webhook
  user_agent text,
  ip text,
  link_url text,                          -- solo para .clicked
  bounce_type text,
  bounce_reason text,
  created_at timestamptz default now()
);

create index if not exists email_events_lead_idx on public.email_events (lead_id, occurred_at desc);
create index if not exists email_events_msg_idx on public.email_events (resend_message_id);
create index if not exists email_events_type_idx on public.email_events (event_type, occurred_at desc);

-- ─────────────────────────────────────────────────────────────────
-- Trigger para mantener updated_at
-- ─────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prospect_leads_updated_at on public.prospect_leads;
create trigger prospect_leads_updated_at
  before update on public.prospect_leads
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- Vista métricas
-- ─────────────────────────────────────────────────────────────────
create or replace view public.prospect_leads_metrics as
select
  count(*) as total,
  count(*) filter (where status = 'pending') as pending,
  count(*) filter (where sent_at is not null) as sent,
  count(*) filter (where delivered_at is not null) as delivered,
  count(*) filter (where first_opened_at is not null) as opened,
  count(*) filter (where first_clicked_at is not null) as clicked,
  count(*) filter (where replied_at is not null) as replied,
  count(*) filter (where bounced_at is not null) as bounced,
  count(*) filter (where status = 'won') as won,
  count(*) filter (where status = 'lost') as lost,
  -- Rates
  case when count(*) filter (where sent_at is not null) > 0
    then round(100.0 * count(*) filter (where first_opened_at is not null)::numeric
               / count(*) filter (where sent_at is not null), 1) else 0 end as open_rate_pct,
  case when count(*) filter (where first_opened_at is not null) > 0
    then round(100.0 * count(*) filter (where first_clicked_at is not null)::numeric
               / count(*) filter (where first_opened_at is not null), 1) else 0 end as click_through_rate_pct,
  case when count(*) filter (where sent_at is not null) > 0
    then round(100.0 * count(*) filter (where replied_at is not null)::numeric
               / count(*) filter (where sent_at is not null), 1) else 0 end as reply_rate_pct,
  case when count(*) filter (where sent_at is not null) > 0
    then round(100.0 * count(*) filter (where bounced_at is not null)::numeric
               / count(*) filter (where sent_at is not null), 1) else 0 end as bounce_rate_pct
from public.prospect_leads;

-- ─────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────
alter table public.prospect_leads enable row level security;
alter table public.email_events enable row level security;

-- Service role: full access (webhook + scripts)
drop policy if exists "service_role_all" on public.prospect_leads;
create policy "service_role_all" on public.prospect_leads
  for all to service_role using (true) with check (true);

drop policy if exists "service_role_all" on public.email_events;
create policy "service_role_all" on public.email_events
  for all to service_role using (true) with check (true);

-- Anon/authenticated: solo SELECT (para dashboard live realtime)
drop policy if exists "anon_select" on public.prospect_leads;
create policy "anon_select" on public.prospect_leads
  for select to anon, authenticated using (true);

drop policy if exists "anon_select" on public.email_events;
create policy "anon_select" on public.email_events
  for select to anon, authenticated using (true);
