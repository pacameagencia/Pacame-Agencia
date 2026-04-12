-- ============================================================
-- PACAME Oficina: Tablas adicionales para el command center
-- Ejecutar en SQL Editor de Supabase DESPUÉS del schema principal
-- ============================================================

-- ESTADO DE AGENTES (en tiempo real)
CREATE TABLE IF NOT EXISTS agent_states (
  agent_id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'idle' CHECK (status IN ('working', 'idle', 'reviewing', 'waiting', 'offline')),
  current_task TEXT,
  tasks_today INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  active_hours NUMERIC(4,1) DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT now()
);

-- ACTIVIDAD DE AGENTES (timeline/feed)
CREATE TABLE IF NOT EXISTS agent_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('task_started', 'task_completed', 'insight', 'alert', 'update', 'delivery')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices para rendimiento
CREATE INDEX IF NOT EXISTS idx_agent_activities_agent ON agent_activities(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activities_type ON agent_activities(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activities_recent ON agent_activities(created_at DESC);

-- Habilitar Realtime para actualizaciones en vivo
ALTER PUBLICATION supabase_realtime ADD TABLE agent_states;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_activities;

-- RLS: acceso total vía anon key (dashboard interno, no público)
ALTER TABLE agent_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to agent_states" ON agent_states FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to agent_activities" ON agent_activities FOR ALL USING (true) WITH CHECK (true);

-- RESENAS DE CLIENTES
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL,
  service TEXT DEFAULT '',
  city TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status, rating DESC);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);

-- Reset diario de tasks_today (ejecutar con cron en n8n a las 00:00)
-- UPDATE agent_states SET tasks_today = 0;
