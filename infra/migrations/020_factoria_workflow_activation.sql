-- 014_factoria_workflow_activation.sql
-- FASE G — activación de workflows n8n con credentials reales del cliente.
-- Trackea qué credentials se crearon y si los workflows están activos.

ALTER TABLE client_deployments
  ADD COLUMN IF NOT EXISTS n8n_credentials_ids jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS n8n_workflows_active jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS n8n_activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS vercel_git_connected_at timestamptz,
  ADD COLUMN IF NOT EXISTS vercel_git_repo text;

COMMENT ON COLUMN client_deployments.n8n_credentials_ids IS
  'Mapping {credential_type: credential_id} de las creds del cliente creadas en n8n. Ej: {"supabaseApi": "abc-123", "twilioApi": "def-456"}';
COMMENT ON COLUMN client_deployments.n8n_workflows_active IS
  'Array de workflow_ids que están activos en n8n (han pasado validación de credentials).';
COMMENT ON COLUMN client_deployments.vercel_git_repo IS
  'Repo Git conectado al project Vercel (ej: "pacameagencia/casa-marisol"). Después del connect, los pushes auto-deployan.';
