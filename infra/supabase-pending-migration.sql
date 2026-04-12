-- ============================================================
-- PACAME: Tablas pendientes de crear
-- Copiar y pegar en Supabase → SQL Editor → Run
-- Solo crea las tablas que FALTAN, no toca las existentes
-- ============================================================

-- 1. ESTADO DE AGENTES
CREATE TABLE IF NOT EXISTS agent_states (
  agent_id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'idle' CHECK (status IN ('working', 'idle', 'reviewing', 'waiting', 'offline')),
  current_task TEXT,
  tasks_today INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  active_hours NUMERIC(4,1) DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT now()
);

-- 2. ACTIVIDAD DE AGENTES
CREATE TABLE IF NOT EXISTS agent_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('task_started', 'task_completed', 'insight', 'alert', 'update', 'delivery')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_activities_agent ON agent_activities(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activities_type ON agent_activities(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activities_recent ON agent_activities(created_at DESC);

-- 3. RESENAS
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

-- 4. REFERIDOS
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_client_id UUID REFERENCES clients(id),
  referral_code TEXT UNIQUE NOT NULL,
  referred_lead_id UUID REFERENCES leads(id),
  referred_client_id UUID REFERENCES clients(id),
  source TEXT DEFAULT 'client',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'expired')),
  discount_applied_referrer BOOLEAN DEFAULT false,
  discount_applied_referred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_client_id);

-- 5. COMERCIALES / PARTNERS
CREATE TABLE IF NOT EXISTS commercials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  type TEXT DEFAULT 'casual' CHECK (type IN ('casual', 'frequent', 'freelance', 'partner', 'ambassador')),
  tier TEXT DEFAULT 'bronce' CHECK (tier IN ('bronce', 'plata', 'oro')),
  partner_code TEXT UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earned NUMERIC(10,2) DEFAULT 0,
  commission_first_pct NUMERIC(4,2) DEFAULT 15,
  commission_recurring_pct NUMERIC(4,2) DEFAULT 10,
  commission_months INTEGER DEFAULT 6,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commercials_code ON commercials(partner_code);
CREATE INDEX IF NOT EXISTS idx_commercials_status ON commercials(status);

-- 6. COMISIONES
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercial_id UUID REFERENCES commercials(id),
  referral_id UUID REFERENCES referrals(id),
  client_id UUID REFERENCES clients(id),
  amount NUMERIC(10,2) NOT NULL,
  type TEXT DEFAULT 'first_payment' CHECK (type IN ('first_payment', 'recurring')),
  month_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commissions_commercial ON commissions(commercial_id, status);

-- 7. RLS (acceso total via anon key — dashboard interno)
ALTER TABLE agent_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercials ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all agent_states" ON agent_states FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all agent_activities" ON agent_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all referrals" ON referrals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all commercials" ON commercials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all commissions" ON commissions FOR ALL USING (true) WITH CHECK (true);

-- 8. Realtime para oficina
ALTER PUBLICATION supabase_realtime ADD TABLE agent_states;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_activities;

-- 9. Insertar estados iniciales de agentes
INSERT INTO agent_states (agent_id, status) VALUES
  ('sage', 'idle'),
  ('nova', 'idle'),
  ('atlas', 'idle'),
  ('nexus', 'idle'),
  ('pixel', 'idle'),
  ('core', 'idle'),
  ('pulse', 'idle'),
  ('copy', 'idle'),
  ('lens', 'idle'),
  ('dios', 'idle')
ON CONFLICT (agent_id) DO NOTHING;
