-- Plan B: ruta dinámica /r/[slug] en lugar de deploys Vercel por lead
-- Guardamos el config completo del demo en jsonb para renderizarlo server-side

alter table public.prospect_leads
  add column if not exists config jsonb;

create index if not exists idx_prospect_leads_slug on public.prospect_leads(slug);

comment on column public.prospect_leads.config is
  'Config completo del demo (menu, paleta, hero, copy). Renderizado por /r/[slug]/page.tsx';
