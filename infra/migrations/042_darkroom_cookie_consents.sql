-- Migration: 042_darkroom_cookie_consents.sql
-- Schema: darkroom_cookie_consents — log RGPD del consentimiento de cookies.
--
-- Cumple art. 7.1 RGPD: el responsable debe poder demostrar que el interesado
-- consintió. Guardamos metadatos mínimos sin PII directa (IP hasheada, UA truncado).
--
-- Project: dark-room-prod (Supabase org "Dark Room IO")
-- Apply: supabase migration up (cuando deploye DarkRoom dedicado)

create table if not exists public.darkroom_cookie_consents (
  id           bigserial primary key,
  analytics    boolean not null,
  functional   boolean not null,
  consent_at   timestamptz not null,
  schema_version int not null default 1,
  user_agent   text,
  referrer     text,
  ip_hash      text,                 -- SHA256(salt + IP) truncado a 32 chars; sin IP directa
  created_at   timestamptz not null default now()
);

create index if not exists darkroom_cookie_consents_consent_at_idx
  on public.darkroom_cookie_consents (consent_at desc);

create index if not exists darkroom_cookie_consents_ip_hash_idx
  on public.darkroom_cookie_consents (ip_hash)
  where ip_hash is not null;

comment on table  public.darkroom_cookie_consents is
  'RGPD art. 7.1 proof — log del consentimiento de cookies del banner DarkRoom. Sin PII directa.';
comment on column public.darkroom_cookie_consents.ip_hash is
  'SHA256(DARKROOM_CONSENT_HASH_SALT + IP) primeros 32 chars. Permite detectar consentimientos repetidos sin exponer IP.';
comment on column public.darkroom_cookie_consents.schema_version is
  'Versión del shape de DarkRoomCookieConsent (lib/darkroom/cookie-consent.ts). Subir si cambian categorías.';

-- RLS: la tabla NO se expone al cliente.
-- Solo el endpoint server-side `/api/darkroom/cookies/consent` escribe.
-- Solo el dashboard interno (futuro) lee, con service_role.
alter table public.darkroom_cookie_consents enable row level security;

-- Bloqueo total de acceso anónimo (auth.role() = 'anon')
drop policy if exists "darkroom_cookie_consents anon block"
  on public.darkroom_cookie_consents;
create policy "darkroom_cookie_consents anon block"
  on public.darkroom_cookie_consents
  for all
  to anon
  using (false)
  with check (false);

-- Bloqueo total de acceso authenticated (los miembros NO leen este log)
drop policy if exists "darkroom_cookie_consents auth block"
  on public.darkroom_cookie_consents;
create policy "darkroom_cookie_consents auth block"
  on public.darkroom_cookie_consents
  for all
  to authenticated
  using (false)
  with check (false);

-- service_role bypass RLS por defecto en Supabase, no requiere policy explícita.

-- Limpieza periódica: borrar consentimientos > 5 años (RGPD: retener solo lo necesario para demostrar)
-- (cron job a configurar en Vercel cron o Supabase pg_cron)
-- ej:
--   delete from public.darkroom_cookie_consents where consent_at < now() - interval '5 years';
