-- Migration 015: Audit log para operaciones sensibles
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('admin','staff','client','system','webhook')),
  actor_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip INET,
  user_agent TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_log_service_all" ON audit_log;
CREATE POLICY "audit_log_service_all" ON audit_log FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "audit_log_no_update_delete" ON audit_log;
CREATE POLICY "audit_log_no_update_delete" ON audit_log FOR UPDATE TO service_role USING (FALSE);

COMMENT ON TABLE audit_log IS 'Audit trail inmutable de operaciones sensibles (admin, GDPR, RBAC, secrets).';
COMMENT ON COLUMN audit_log.action IS 'Dot-notation: auth.login, catalog.update, gdpr.export, order.refund, secret.rotate, rbac.change';
