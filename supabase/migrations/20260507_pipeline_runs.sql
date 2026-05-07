-- pipeline_runs: estado del worker en vivo, una fila por lead procesado.
-- Permite al dashboard ver qué web se está construyendo ahora mismo,
-- cuál fue la última, latencia por step, errores, etc.

create table if not exists public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  lead_slug text not null,
  lead_email text,
  lead_name text,
  lead_city text,

  -- Steps timing
  started_at timestamptz default now(),
  step text default 'queued',                  -- queued | generating | deploying | sending | syncing | completed | failed
  generate_started_at timestamptz,
  generate_completed_at timestamptz,
  deploy_started_at timestamptz,
  deploy_completed_at timestamptz,
  send_started_at timestamptz,
  send_completed_at timestamptz,
  completed_at timestamptz,

  vercel_url text,
  resend_message_id text,
  error text,
  worker_id text,                                -- pid + hostname para distinguir workers

  created_at timestamptz default now()
);

create index if not exists pipeline_runs_step_idx on public.pipeline_runs (step);
create index if not exists pipeline_runs_started_idx on public.pipeline_runs (started_at desc);
create index if not exists pipeline_runs_slug_idx on public.pipeline_runs (lead_slug);

-- worker_heartbeat: para que dashboard sepa si el worker está vivo
create table if not exists public.worker_heartbeat (
  worker_id text primary key,
  hostname text,
  pid integer,
  last_seen_at timestamptz default now(),
  status text default 'idle',                    -- idle | working | sleeping | stopping
  current_lead text,
  next_run_at timestamptz,
  total_processed integer default 0,
  errors integer default 0
);

alter table public.pipeline_runs enable row level security;
alter table public.worker_heartbeat enable row level security;

drop policy if exists "service_role_all" on public.pipeline_runs;
create policy "service_role_all" on public.pipeline_runs
  for all to service_role using (true) with check (true);

drop policy if exists "service_role_all" on public.worker_heartbeat;
create policy "service_role_all" on public.worker_heartbeat
  for all to service_role using (true) with check (true);

drop policy if exists "anon_select" on public.pipeline_runs;
create policy "anon_select" on public.pipeline_runs
  for select to anon, authenticated using (true);

drop policy if exists "anon_select" on public.worker_heartbeat;
create policy "anon_select" on public.worker_heartbeat
  for select to anon, authenticated using (true);

-- Habilitar realtime para el dashboard
alter publication supabase_realtime add table public.pipeline_runs;
alter publication supabase_realtime add table public.worker_heartbeat;
