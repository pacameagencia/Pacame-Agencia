-- ============================================================
-- Migration 007: Plataforma Premium PACAME
-- Fases 1-4: Checkout, Auth, Portal WOW, Sales High-Ticket
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ===================
-- FASE 1: Checkout Premium Multi-Paso
-- ===================

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Paso 1: Contacto
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  -- Paso 2: Cualificacion completa
  company_name TEXT,
  company_website TEXT,
  company_sector TEXT,
  project_description TEXT,
  project_objectives TEXT,
  timeline TEXT, -- 'urgente' | '1-2 semanas' | '1 mes' | 'no tengo prisa'
  budget_confirmed NUMERIC,
  -- Servicio
  service_slug TEXT,
  service_name TEXT,
  amount NUMERIC NOT NULL,
  recurring BOOLEAN DEFAULT FALSE,
  -- Tracking
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'step_2', 'step_3', 'completed', 'abandoned')),
  stripe_session_id TEXT,
  lead_id UUID REFERENCES leads(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_checkout_sessions_email ON checkout_sessions(email);
CREATE INDEX idx_checkout_sessions_status ON checkout_sessions(status) WHERE status IN ('started', 'step_2', 'step_3');
CREATE INDEX idx_checkout_sessions_abandoned ON checkout_sessions(status, created_at) WHERE status != 'completed';

-- ===================
-- FASE 2: Sistema de Cuentas de Cliente
-- ===================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_token TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_token_expires TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Indice unico en email para login
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_email_unique ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_auth_token ON clients(auth_token) WHERE auth_token IS NOT NULL;

-- ===================
-- FASE 3: Portal Premium (WOW)
-- ===================

-- Branding del cliente
CREATE TABLE IF NOT EXISTS client_brand_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#7C3AED',
  secondary_color TEXT DEFAULT '#06B6D4',
  font_heading TEXT DEFAULT 'Space Grotesk',
  font_body TEXT DEFAULT 'Inter',
  company_tagline TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ficheros del cliente
CREATE TABLE IF NOT EXISTS client_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('logo', 'brand_asset', 'content', 'document', 'other')),
  file_size INTEGER,
  uploaded_by TEXT DEFAULT 'client' CHECK (uploaded_by IN ('client', 'team')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hitos del proyecto
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensajes cliente-equipo
CREATE TABLE IF NOT EXISTS client_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- 'client' | 'team' | 'agent:{name}'
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para portal
CREATE INDEX idx_client_files_client ON client_files(client_id, created_at DESC);
CREATE INDEX idx_project_milestones_client ON project_milestones(client_id, sort_order);
CREATE INDEX idx_client_messages_client ON client_messages(client_id, created_at DESC);
CREATE INDEX idx_client_messages_unread ON client_messages(client_id, read) WHERE read = FALSE;

-- ===================
-- FASE 4: Sales High-Ticket
-- ===================

-- Lead magnets
CREATE TABLE IF NOT EXISTS lead_magnets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('audit', 'ebook', 'consultation', 'checklist', 'template', 'webinar')),
  description TEXT,
  delivery_url TEXT,
  downloads INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carritos abandonados
CREATE TABLE IF NOT EXISTS abandoned_checkouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_session_id UUID REFERENCES checkout_sessions(id),
  email TEXT NOT NULL,
  service_name TEXT,
  amount NUMERIC,
  recovery_email_sent BOOLEAN DEFAULT FALSE,
  recovery_email_sent_at TIMESTAMPTZ,
  recovered BOOLEAN DEFAULT FALSE,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_abandoned_checkouts_recovery ON abandoned_checkouts(recovery_email_sent, created_at) WHERE recovered = FALSE;

-- ===================
-- RLS + Policies para nuevas tablas
-- ===================

ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_magnets ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_checkouts ENABLE ROW LEVEL SECURITY;

-- Service role full access (backend usa service_role)
CREATE POLICY "Service role full access" ON checkout_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON client_brand_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON client_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON project_milestones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON client_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON lead_magnets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON abandoned_checkouts FOR ALL USING (true) WITH CHECK (true);

-- Realtime para mensajes y milestones
ALTER PUBLICATION supabase_realtime ADD TABLE client_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE project_milestones;

-- ===================
-- Trigger updated_at para brand_settings
-- ===================

CREATE TRIGGER client_brand_settings_updated_at
  BEFORE UPDATE ON client_brand_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
