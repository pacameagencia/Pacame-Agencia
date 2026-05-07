-- A/B test variant tracking + learning system

-- Tracking por lead: qué variante de subject/preheader se usó
alter table public.prospect_leads
  add column if not exists subject_variant integer,
  add column if not exists preheader_variant integer,
  add column if not exists subject_text text,
  add column if not exists preheader_text text,
  add column if not exists re_engaged_at timestamptz;

-- Performance acumulado por variante (auto-improve lo actualiza)
create table if not exists public.variant_performance (
  variant_type text not null,             -- 'subject' | 'preheader'
  variant_idx integer not null,
  variant_text text,
  sent integer default 0,
  delivered integer default 0,
  opened integer default 0,
  clicked integer default 0,
  bounced integer default 0,
  open_rate numeric(5,2) default 0,
  click_rate numeric(5,2) default 0,
  bounce_rate numeric(5,2) default 0,
  last_updated timestamptz default now(),
  primary key (variant_type, variant_idx)
);

-- Reportes diarios snapshot
create table if not exists public.learning_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date default current_date,
  metrics jsonb,
  insights text,
  created_at timestamptz default now()
);

create index if not exists idx_learning_reports_date on public.learning_reports(report_date desc);
