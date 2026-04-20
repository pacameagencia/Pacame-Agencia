-- ============================================================
-- Migration 026: Lifecycle engine
-- Emails transaccionales idempotentes + encuestas NPS auto-categorizadas.
-- Aplicada via Supabase MCP (archivo local para control de version).
-- ============================================================

-- ============================================================
-- 1. LIFECYCLE_EMAILS_SENT
-- Log de emails lifecycle enviados por cliente. UNIQUE(client_id, email_type)
-- garantiza idempotencia — el cron puede ejecutarse 100 veces y solo envia 1.
-- ============================================================

CREATE TABLE IF NOT EXISTS lifecycle_emails_sent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN (
    'welcome_d0',
    'tips_d2',
    'nps_d7',
    'upsell_d14',
    'review_d30'
  )),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  subject TEXT,
  resend_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, email_type)
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_client ON lifecycle_emails_sent(client_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_type_sent ON lifecycle_emails_sent(email_type, sent_at DESC);

-- ============================================================
-- 2. NPS_SURVEYS
-- Encuestas NPS con auto-categorizacion promoter/passive/detractor.
-- token publico (shareable en email), respuesta idempotente por token.
-- ============================================================

CREATE TABLE IF NOT EXISTS nps_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  score INTEGER CHECK (score BETWEEN 0 AND 10),
  category TEXT CHECK (category IN ('promoter','passive','detractor')),
  feedback TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_nps_token ON nps_surveys(token);
CREATE INDEX IF NOT EXISTS idx_nps_client ON nps_surveys(client_id);
CREATE INDEX IF NOT EXISTS idx_nps_category_responded ON nps_surveys(category, responded_at DESC);

-- Trigger: auto-categorizar score -> category al responder
CREATE OR REPLACE FUNCTION nps_auto_categorize()
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
    IF NEW.responded_at IS NULL THEN
      NEW.responded_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nps_auto_categorize ON nps_surveys;
CREATE TRIGGER trg_nps_auto_categorize
  BEFORE INSERT OR UPDATE OF score ON nps_surveys
  FOR EACH ROW EXECUTE FUNCTION nps_auto_categorize();

-- RLS: service role full access; no public read (datos sensibles de feedback)
ALTER TABLE lifecycle_emails_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_lifecycle" ON lifecycle_emails_sent
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_all_nps" ON nps_surveys
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
