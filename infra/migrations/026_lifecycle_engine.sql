-- ============================================================
-- Migration 026: Lifecycle engine (schema de produccion)
-- Este fichero refleja el estado real en Supabase. Ya desplegado
-- via migracion anterior gestionada por MCP.
-- ============================================================

-- ============================================================
-- LIFECYCLE_EMAILS_SENT
-- Idempotencia: UNIQUE(client_id, email_type) impide duplicados.
-- Tracking: opened_at / clicked_at para funnel.
-- ============================================================

CREATE TABLE IF NOT EXISTS lifecycle_emails_sent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  trigger_event TEXT,
  email_type TEXT NOT NULL,
  resend_email_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  UNIQUE (client_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_client ON lifecycle_emails_sent(client_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_type_sent ON lifecycle_emails_sent(email_type, sent_at DESC);

-- ============================================================
-- NPS_SURVEYS
-- Token publico para link en email. Trigger auto-categoriza score.
-- context jsonb permite guardar order_id, order_slug, lifecycle_source sin FK rigida.
-- ============================================================

CREATE TABLE IF NOT EXISTS nps_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL,
  client_email_snapshot TEXT,
  score INTEGER CHECK (score BETWEEN 0 AND 10),
  feedback TEXT,
  category TEXT CHECK (category IN ('promoter','passive','detractor')),
  context JSONB DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  followup_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nps_token ON nps_surveys(token);
CREATE INDEX IF NOT EXISTS idx_nps_client ON nps_surveys(client_id);
CREATE INDEX IF NOT EXISTS idx_nps_category_submitted ON nps_surveys(category, submitted_at DESC);

-- Trigger: auto-categorize score → promoter/passive/detractor
CREATE OR REPLACE FUNCTION set_nps_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.score IS NOT NULL THEN
    IF NEW.score >= 9 THEN
      NEW.category := 'promoter';
    ELSIF NEW.score >= 7 THEN
      NEW.category := 'passive';
    ELSE
      NEW.category := 'detractor';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS nps_surveys_category ON nps_surveys;
CREATE TRIGGER nps_surveys_category
  BEFORE INSERT OR UPDATE OF score ON nps_surveys
  FOR EACH ROW EXECUTE FUNCTION set_nps_category();

-- RLS
ALTER TABLE lifecycle_emails_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_surveys ENABLE ROW LEVEL SECURITY;
