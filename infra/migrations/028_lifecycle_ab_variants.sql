-- ============================================================
-- Migration 028: A/B variants lifecycle emails
-- Subject/preheader variants por email_type con peso relativo.
-- Asignacion determinista por hash(client_id + email_type).
-- Aplicada via Supabase MCP.
-- ============================================================

CREATE TABLE IF NOT EXISTS lifecycle_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type TEXT NOT NULL,
  variant_key TEXT NOT NULL,
  subject TEXT NOT NULL,
  preheader TEXT,
  weight INTEGER DEFAULT 1 CHECK (weight > 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (email_type, variant_key)
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_variants_active
  ON lifecycle_variants(email_type, is_active);

ALTER TABLE lifecycle_emails_sent
  ADD COLUMN IF NOT EXISTS variant_key TEXT;

CREATE INDEX IF NOT EXISTS idx_lifecycle_emails_variant
  ON lifecycle_emails_sent(email_type, variant_key) WHERE variant_key IS NOT NULL;

CREATE OR REPLACE VIEW v_lifecycle_ab_perf_30d AS
SELECT
  email_type,
  variant_key,
  COUNT(*) AS sent,
  COUNT(opened_at) AS opened,
  COUNT(clicked_at) AS clicked,
  CASE
    WHEN COUNT(*) = 0 THEN NULL
    ELSE ROUND(COUNT(opened_at)::numeric * 100 / COUNT(*), 1)
  END AS open_rate_pct,
  CASE
    WHEN COUNT(*) = 0 THEN NULL
    ELSE ROUND(COUNT(clicked_at)::numeric * 100 / COUNT(*), 1)
  END AS click_rate_pct
FROM lifecycle_emails_sent
WHERE sent_at > NOW() - INTERVAL '30 days' AND variant_key IS NOT NULL
GROUP BY email_type, variant_key
ORDER BY email_type, variant_key;

ALTER TABLE lifecycle_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_variants" ON lifecycle_variants
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
