-- 045_cost_guard_tokens.sql
-- FIX CRITICAL #2 · 2026-05-07
-- Sustituye el "cost_guard_token = string ≥16 chars" (teatro de seguridad) por
-- tokens reales emitidos, vinculados a un concept_id concreto, con expiry y
-- single-use enforcement.
--
-- Antes: cualquiera podía hacer `openssl rand -hex 16` y pasar el gate.
-- Después: token debe haber sido emitido por `tools/dark-frames/emit-cost-guard.mjs`
-- por Pablo (o sub-flow autorizado), vincularse a un concept_id, no haber sido
-- usado antes, y no estar expirado.

create table if not exists cost_guard_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,                 -- 32 chars hex random
  concept_id text not null,                   -- vinculado a concepto específico
  emitted_at timestamptz not null default now(),
  emitted_by text not null,                   -- 'pablo' | 'auto-pipeline' | 'subagent-X'
  emission_reason text not null,              -- justificación auditoría (min 20 chars)
  expires_at timestamptz not null,            -- 24h desde emission por default
  used_at timestamptz,                        -- NULL hasta que se consume
  used_for_render_id text,                    -- folder/render_id que lo consumió
  ip_emitted_from inet,                       -- opcional: trazabilidad
  ip_used_from inet                           -- opcional: trazabilidad
);

create index if not exists cost_guard_tokens_token_idx on cost_guard_tokens (token);
create index if not exists cost_guard_tokens_concept_unused_idx
  on cost_guard_tokens (concept_id, used_at) where used_at is null;
create index if not exists cost_guard_tokens_expiry_idx on cost_guard_tokens (expires_at);

comment on table cost_guard_tokens is
  'Tokens de autorización de cost (FIX CRITICAL #2 · feedback_doble_aprobacion_videos.md). Single-use, vinculados a concept_id, con expiry. Reemplaza el sistema legacy de strings ≥16 chars sin verificar.';

comment on column cost_guard_tokens.token is 'Token de 32 chars hex (16 bytes random). Único.';
comment on column cost_guard_tokens.concept_id is 'concept_id al que está vinculado. NO sirve para otro concept.';
comment on column cost_guard_tokens.expires_at is 'Default 24h desde emission. Tras esto, token rechazado por gate.';
comment on column cost_guard_tokens.used_at is 'NULL = disponible. Timestamp = ya consumido (single-use enforcement).';

-- Función helper para emitir token (transactional safety)
create or replace function emit_cost_guard_token(
  p_concept_id text,
  p_emitted_by text,
  p_reason text,
  p_ttl_hours int default 24
) returns text language plpgsql as $$
declare
  v_token text;
begin
  if length(p_reason) < 20 then
    raise exception 'emission_reason must be at least 20 chars (audit trail)';
  end if;

  v_token := encode(gen_random_bytes(16), 'hex');

  insert into cost_guard_tokens (token, concept_id, emitted_by, emission_reason, expires_at)
  values (v_token, p_concept_id, p_emitted_by, p_reason, now() + (p_ttl_hours || ' hours')::interval);

  return v_token;
end;
$$;

comment on function emit_cost_guard_token is
  'Emite token cost-guard vinculado a concept_id concreto. Reason min 20 chars (audit trail). TTL default 24h.';

-- Función helper para consumir token (atomic, evita race conditions)
create or replace function consume_cost_guard_token(
  p_token text,
  p_concept_id text,
  p_render_id text
) returns table (success boolean, error_message text) language plpgsql as $$
declare
  v_row cost_guard_tokens%rowtype;
begin
  -- Lock the row to prevent race conditions
  select * into v_row from cost_guard_tokens where token = p_token for update;

  if not found then
    return query select false, 'token does not exist'::text;
    return;
  end if;

  if v_row.used_at is not null then
    return query select false, ('token already used at ' || v_row.used_at::text || ' for render ' || coalesce(v_row.used_for_render_id, 'unknown'))::text;
    return;
  end if;

  if v_row.expires_at < now() then
    return query select false, ('token expired at ' || v_row.expires_at::text)::text;
    return;
  end if;

  if v_row.concept_id != p_concept_id then
    return query select false, ('token bound to concept ''' || v_row.concept_id || ''' but used for ''' || p_concept_id || '''')::text;
    return;
  end if;

  -- Mark as used
  update cost_guard_tokens
  set used_at = now(),
      used_for_render_id = p_render_id
  where token = p_token;

  return query select true, null::text;
end;
$$;

comment on function consume_cost_guard_token is
  'Consume token cost-guard atomically. Verifica: existe, no usado, no expirado, vinculado al concept_id correcto. Single-use.';
