-- Migration 016: RBAC minimo. admin_sessions.role ya existe en 014.
-- Permisos declarativos opcionales.

CREATE TABLE IF NOT EXISTS role_permissions (
  role TEXT NOT NULL CHECK (role IN ('admin','staff','client')),
  permission TEXT NOT NULL,
  PRIMARY KEY (role, permission)
);

-- Seed: admin tiene todo, staff limitado, client solo sobre sus recursos (enforced por RLS/code)
INSERT INTO role_permissions (role, permission) VALUES
  ('admin', 'catalog.manage'),
  ('admin', 'orders.manage_all'),
  ('admin', 'clients.manage_all'),
  ('admin', 'secrets.rotate'),
  ('admin', 'rbac.change'),
  ('admin', 'gdpr.export_any'),
  ('admin', 'gdpr.delete_any'),
  ('admin', 'audit_log.read'),
  ('admin', 'provider.manage'),
  ('staff', 'orders.view_all'),
  ('staff', 'clients.view_all'),
  ('staff', 'content.manage'),
  ('staff', 'leads.manage')
ON CONFLICT DO NOTHING;

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "role_perms_service_all" ON role_permissions;
CREATE POLICY "role_perms_service_all" ON role_permissions FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "role_perms_public_read" ON role_permissions;
CREATE POLICY "role_perms_public_read" ON role_permissions FOR SELECT USING (TRUE);

COMMENT ON TABLE role_permissions IS 'Lista blanca de permisos por rol. Enforce via web/lib/security/rbac.ts';
