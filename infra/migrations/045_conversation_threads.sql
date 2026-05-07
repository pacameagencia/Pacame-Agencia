-- 045_conversation_threads.sql
-- Agregador de conversaciones por TEMA: cuando Pablo habla del mismo tema en
-- chats distintos de Claude Code, se agrupan en un mismo "thread" para tener
-- visión global y poder iterar hacia la perfección.
--
-- Pipeline: Claude Code SessionEnd hook → tools/extract-session-topic.ts →
-- POST /api/neural/sessions/extract-topic → Haiku extrae topic_slug + summary
-- + decisions[] + blockers[] + next_steps[] → upsert en estas 2 tablas.
--
-- Lectura para visión global: GET /api/neural/threads/<slug>
-- Comando CLI: /topic-review [slug]

-- 1. Thread = agregado por tema (puede tener N sesiones)
create table if not exists conversation_threads (
  id uuid primary key default gen_random_uuid(),
  topic_slug text not null,
  topic_title text not null,
  summary text,                                -- resumen consolidado del tema
  decisions jsonb not null default '[]'::jsonb,    -- [{decision, taken_at, session_id}]
  blockers jsonb not null default '[]'::jsonb,     -- [{blocker, severity, session_id}]
  next_steps jsonb not null default '[]'::jsonb,   -- [{step, owner, session_id}]
  participants text[] not null default '{}',   -- agentes mencionados (DIOS, SAGE, ...)
  session_ids text[] not null default '{}',
  messages_count int not null default 0,
  quality_score numeric(3,2),                  -- juicio Haiku 0-1 sobre profundidad/utilidad
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists conversation_threads_topic_slug_idx
  on conversation_threads(topic_slug);

create index if not exists conversation_threads_updated_idx
  on conversation_threads(updated_at desc);

create index if not exists conversation_threads_participants_idx
  on conversation_threads using gin(participants);

comment on table conversation_threads is
  'Agregado por tema de conversaciones Claude Code. Una fila = un tema (topic_slug único). Permite ver historial global de un tema across sesiones.';

comment on column conversation_threads.topic_slug is
  'Identificador estable kebab-case del tema. Generado por LLM + normalizado (Levenshtein > 0.8 contra existentes para evitar fragmentación).';

comment on column conversation_threads.decisions is
  'Array de decisiones tomadas. Cada item: {decision, taken_at, session_id}. Acumula entre sesiones del mismo thread, dedup por hash de "decision".';

comment on column conversation_threads.blockers is
  'Array de bloqueos abiertos/resueltos. Cada item: {blocker, severity (low/medium/high/critical), session_id, resolved_at?}.';

comment on column conversation_threads.next_steps is
  'Array de próximos pasos pendientes. Cada item: {step, owner (pablo|claude|external), session_id, done_at?}.';

comment on column conversation_threads.quality_score is
  '0-1, juicio Haiku sobre profundidad de la conversación. <0.3 = ruido. >0.7 = conversación de alto valor.';

-- 2. Sesión = una conversación concreta de Claude Code, perteneciente a 1 thread
create table if not exists conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references conversation_threads(id) on delete cascade,
  session_id text not null unique,             -- el sessionId del JSONL
  session_slug text,                           -- slug del CLI (ej: "te-acuerdas-de-mi-splendid-sedgewick")
  topic_slug text not null,                    -- redundante con thread.topic_slug, índice más rápido
  summary text,
  decisions jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  next_steps jsonb not null default '[]'::jsonb,
  participants text[] not null default '{}',
  jsonl_path text,
  jsonl_excerpt text,                          -- últimos 10 turnos truncados, PII redactada
  turns_count int default 0,
  started_at timestamptz,
  ended_at timestamptz,
  processed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists conversation_sessions_thread_idx
  on conversation_sessions(thread_id);

create index if not exists conversation_sessions_topic_slug_idx
  on conversation_sessions(topic_slug);

create index if not exists conversation_sessions_processed_idx
  on conversation_sessions(processed_at desc);

comment on table conversation_sessions is
  'Sesión individual de Claude Code asociada a un thread. Una fila por sessionId. El jsonl_excerpt guarda los últimos 10 turnos para poder reconstruir contexto sin volver a leer el archivo .jsonl original.';

comment on column conversation_sessions.jsonl_excerpt is
  'Truncado a últimos 10 turnos. PII redactada (emails, tokens JWT, claves Bearer). NO almacenamos el JSONL completo por privacidad y tamaño.';

-- 3. RLS — tablas privadas, acceso solo via service_role (no expuestas a clientes)
alter table conversation_threads enable row level security;
alter table conversation_sessions enable row level security;

-- Sin políticas explícitas → solo service_role puede leer/escribir.
-- En el futuro, si se quisiera vista pública, añadir SELECT policy con auth.uid().

-- 4. Trigger para mantener updated_at en threads
create or replace function bump_conversation_thread_updated()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conversation_threads_updated_trg on conversation_threads;
create trigger conversation_threads_updated_trg
  before update on conversation_threads
  for each row
  execute function bump_conversation_thread_updated();

-- 5. Función helper: agrupa por topic_slug y resume thread
create or replace function get_thread_by_slug(p_slug text)
returns table (
  thread_id uuid,
  topic_title text,
  summary text,
  decisions jsonb,
  blockers jsonb,
  next_steps jsonb,
  participants text[],
  sessions_count bigint,
  last_session_at timestamptz
)
language sql
stable
as $$
  select
    t.id as thread_id,
    t.topic_title,
    t.summary,
    t.decisions,
    t.blockers,
    t.next_steps,
    t.participants,
    count(s.id) as sessions_count,
    max(s.processed_at) as last_session_at
  from conversation_threads t
  left join conversation_sessions s on s.thread_id = t.id
  where t.topic_slug = p_slug
  group by t.id, t.topic_title, t.summary, t.decisions, t.blockers, t.next_steps, t.participants;
$$;

comment on function get_thread_by_slug(text) is
  'Devuelve el resumen agregado de un thread por su topic_slug. Usado por GET /api/neural/threads/<slug>.';
