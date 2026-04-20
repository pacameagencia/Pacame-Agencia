-- ============================================================
-- Migration 027: Referrals + growth analytics
-- Referral codes (1 por cliente) + referrals attribution + analytics views.
-- Aplicada via Supabase MCP.
-- ============================================================

CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID UNIQUE NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  discount_pct INTEGER DEFAULT 10 CHECK (discount_pct BETWEEN 0 AND 50),
  commission_pct INTEGER DEFAULT 15 CHECK (commission_pct BETWEEN 0 AND 30),
  total_uses INTEGER DEFAULT 0,
  total_revenue_cents BIGINT DEFAULT 0,
  total_commission_cents BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL REFERENCES referral_codes(code) ON DELETE CASCADE,
  referrer_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  referred_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  order_id UUID UNIQUE REFERENCES orders(id) ON DELETE SET NULL,
  referred_email TEXT,
  amount_cents INTEGER NOT NULL,
  commission_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status, created_at DESC);

-- Trigger: al crear referral, actualiza counters en referral_codes
CREATE OR REPLACE FUNCTION referrals_update_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE referral_codes
    SET total_uses = total_uses + 1,
        total_revenue_cents = total_revenue_cents + NEW.amount_cents,
        total_commission_cents = total_commission_cents + NEW.commission_cents
    WHERE code = NEW.referral_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_referrals_counters ON referrals;
CREATE TRIGGER trg_referrals_counters
  AFTER INSERT ON referrals
  FOR EACH ROW EXECUTE FUNCTION referrals_update_counters();

-- ============================================================
-- ANALYTICS VIEWS (admin dashboard)
-- ============================================================

CREATE OR REPLACE VIEW v_lifecycle_funnel_30d AS
SELECT
  email_type,
  COUNT(*) AS sent_count,
  COUNT(DISTINCT client_id) AS unique_clients,
  COUNT(opened_at) AS opened,
  COUNT(clicked_at) AS clicked,
  MIN(sent_at) AS oldest_sent,
  MAX(sent_at) AS newest_sent
FROM lifecycle_emails_sent
WHERE sent_at > NOW() - INTERVAL '30 days'
GROUP BY email_type
ORDER BY email_type;

CREATE OR REPLACE VIEW v_nps_score_30d AS
SELECT
  COUNT(*) FILTER (WHERE submitted_at IS NOT NULL) AS responses,
  COUNT(*) FILTER (WHERE category = 'promoter') AS promoters,
  COUNT(*) FILTER (WHERE category = 'passive') AS passives,
  COUNT(*) FILTER (WHERE category = 'detractor') AS detractors,
  AVG(score) FILTER (WHERE score IS NOT NULL) AS avg_score,
  CASE
    WHEN COUNT(*) FILTER (WHERE submitted_at IS NOT NULL) = 0 THEN NULL
    ELSE ROUND(
      (COUNT(*) FILTER (WHERE category = 'promoter')::numeric -
       COUNT(*) FILTER (WHERE category = 'detractor')::numeric) * 100.0 /
       NULLIF(COUNT(*) FILTER (WHERE submitted_at IS NOT NULL), 0),
      1
    )
  END AS nps_score
FROM nps_surveys
WHERE created_at > NOW() - INTERVAL '30 days';

CREATE OR REPLACE VIEW v_referrals_top AS
SELECT
  rc.client_id,
  c.name,
  c.email,
  rc.code,
  rc.total_uses,
  rc.total_revenue_cents,
  rc.total_commission_cents
FROM referral_codes rc
JOIN clients c ON c.id = rc.client_id
WHERE rc.is_active = TRUE AND rc.total_uses > 0
ORDER BY rc.total_revenue_cents DESC
LIMIT 20;

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_ref_codes" ON referral_codes
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_all_referrals" ON referrals
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
