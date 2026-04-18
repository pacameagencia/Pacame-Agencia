-- Migration 014: Admin sessions persistentes
-- Sustituye el Set<string> en memoria de /api/auth/route.ts.
-- Sesiones sobreviven a cada deploy.
-- Aplicada via Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash TEXT UNIQUE NOT NULL,        -- sha256(token) — nunca guardamos plano
  user_id TEXT NOT NULL,                  -- 'pablo' por ahora; futuro multi-admin
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','staff')),
  csrf_token TEXT,                        -- usado en S4 double-submit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  ip INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id, created_at DESC);

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_sessions_service_all" ON admin_sessions;
CREATE POLICY "admin_sessions_service_all" ON admin_sessions
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

COMMENT ON TABLE admin_sessions IS 'Sesiones admin persistentes. Reemplaza store en memoria.';
COMMENT ON COLUMN admin_sessions.token_hash IS 'SHA-256 del token que va en cookie. Nunca en plano.';
COMMENT ON COLUMN admin_sessions.csrf_token IS 'Token CSRF double-submit (activado en Sprint 5-S4).';
