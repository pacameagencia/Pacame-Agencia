-- Migración 018 — Formalización de tablas de telemetría neural.
-- agent_activities y agent_states existen en producción desde la migración manual
-- infra/supabase-pending-migration.sql, pero nunca llegaron a infra/migrations/.
-- Esta migración las versiona oficialmente con IF NOT EXISTS (idempotente).
-- Si la tabla ya existe en prod (220+ rows), la migración no la toca.
-- Si se re-despliega Supabase desde cero, ESTA migración crea las tablas.

CREATE TABLE IF NOT EXISTS agent_states (
  agent_id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'idle' CHECK (status IN ('working', 'idle', 'reviewing', 'waiting', 'offline')),
  current_task TEXT,
  tasks_today INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  active_hours NUMERIC(4,1) DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('task_started', 'task_completed', 'insight', 'alert', 'update', 'delivery')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_activities_agent
  ON agent_activities(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activities_type
  ON agent_activities(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activities_recent
  ON agent_activities(created_at DESC);

COMMENT ON TABLE agent_activities IS
  'Telemetría de los crons y endpoints neurales. Cada `update` confirma que un cron corrió y escribió algo. Si la tabla deja de recibir inserts >24h, los crons de Vercel están caídos o el CRON_SECRET no coincide entre .env.local y Vercel dashboard. verify.ts (tools/obsidian-sync) chequea esta condición.';

COMMENT ON TABLE agent_states IS
  'Estado actual de cada uno de los 10 agentes principales (DIOS + 9). Se actualiza desde fire_synapse() y los crons.';
