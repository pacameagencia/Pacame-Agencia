-- Migration 018: GDPR soft-delete + cascada controlada
-- Fase 1: cliente solicita delete → deletion_requested_at=now()
-- Fase 2: cron diario tras 30d → purga datos del cliente + canceled Stripe subs

ALTER TABLE clients ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS deletion_confirmed_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS deletion_completed_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_pending_deletion
  ON clients(deletion_requested_at)
  WHERE deletion_requested_at IS NOT NULL AND deletion_completed_at IS NULL;

CREATE TABLE IF NOT EXISTS gdpr_deletion_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  client_email_hash TEXT,
  requested_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rows_deleted JSONB,
  stripe_subscriptions_canceled TEXT[],
  dry_run BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_log_email ON gdpr_deletion_log(client_email_hash);

ALTER TABLE gdpr_deletion_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gdpr_log_service_all" ON gdpr_deletion_log;
CREATE POLICY "gdpr_log_service_all" ON gdpr_deletion_log FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE TABLE IF NOT EXISTS gdpr_export_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','expired','failed')),
  file_url TEXT,
  file_size_bytes INTEGER,
  error TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_gdpr_export_client ON gdpr_export_requests(client_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_gdpr_export_pending ON gdpr_export_requests(status, requested_at) WHERE status IN ('pending','processing');

ALTER TABLE gdpr_export_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gdpr_export_service_all" ON gdpr_export_requests;
CREATE POLICY "gdpr_export_service_all" ON gdpr_export_requests FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

COMMENT ON TABLE gdpr_deletion_log IS 'Log inmutable de deletions GDPR. Hash email retenido para anti-fraude (GDPR legitimo interest).';
COMMENT ON TABLE gdpr_export_requests IS 'Cola async de exports GDPR. Cliente puede re-descargar desde portal hasta expires_at.';
