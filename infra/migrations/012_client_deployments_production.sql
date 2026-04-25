-- 012_client_deployments_production.sql
-- FASE F — Deploy automatizado real a Vercel + Vapi + n8n.
-- Añade columnas de tracking para cada destino de despliegue.

ALTER TABLE client_deployments
  -- Vercel
  ADD COLUMN IF NOT EXISTS vercel_project_id text,
  ADD COLUMN IF NOT EXISTS vercel_deployment_id text,
  ADD COLUMN IF NOT EXISTS vercel_url text,
  ADD COLUMN IF NOT EXISTS vercel_deployed_at timestamptz,
  ADD COLUMN IF NOT EXISTS vercel_state text,            -- BUILDING|READY|ERROR|CANCELED
  -- Vapi
  ADD COLUMN IF NOT EXISTS vapi_assistant_id text,
  ADD COLUMN IF NOT EXISTS vapi_phone_number_id text,
  ADD COLUMN IF NOT EXISTS vapi_phone_number text,
  ADD COLUMN IF NOT EXISTS vapi_deployed_at timestamptz,
  -- n8n
  ADD COLUMN IF NOT EXISTS n8n_workflow_ids jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS n8n_deployed_at timestamptz,
  -- Estado global del deploy
  ADD COLUMN IF NOT EXISTS deploy_state text DEFAULT 'not_started'
    CHECK (deploy_state IN ('not_started', 'partial', 'shipped', 'error')),
  ADD COLUMN IF NOT EXISTS deploy_log jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_client_deployments_deploy_state
  ON client_deployments(deploy_state, vercel_deployed_at DESC);

COMMENT ON COLUMN client_deployments.deploy_state IS
  'Lifecycle: not_started → partial (1-2 destinos OK) → shipped (3/3 destinos OK) → error si fallo crítico';
COMMENT ON COLUMN client_deployments.deploy_log IS
  'Array de eventos: [{ ts, target: vercel|vapi|n8n, action, status, detail }]';
