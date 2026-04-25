-- 010_client_deployments.sql
-- FASE D — Plantillas de entrega por sector.
-- Tabla que registra cada despliegue de plantilla a un cliente concreto.
-- Permite trackear qué plantilla se usó, qué plan generó SAGE, y medir el
-- "margen marginal" real de la solución N+1 vs solución 1 del mismo template.

CREATE TABLE IF NOT EXISTS client_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id text NOT NULL,
  business_name text NOT NULL,
  city text NOT NULL,
  client_data jsonb NOT NULL DEFAULT '{}',
  plan jsonb NOT NULL,
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'approved', 'in_progress', 'shipped', 'cancelled')),
  llm_provider text,
  llm_model text,
  setup_eur numeric(10, 2),
  monthly_eur numeric(10, 2),
  approved_at timestamptz,
  shipped_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_deployments_template
  ON client_deployments(template_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_deployments_status
  ON client_deployments(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_deployments_city
  ON client_deployments(city);

-- Trigger para mantener updated_at
CREATE OR REPLACE FUNCTION update_client_deployments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_deployments_updated ON client_deployments;
CREATE TRIGGER trg_client_deployments_updated
  BEFORE UPDATE ON client_deployments
  FOR EACH ROW EXECUTE FUNCTION update_client_deployments_updated_at();

COMMENT ON TABLE client_deployments IS
  'Registra cada despliegue de plantilla sector a un cliente. Usado por LENS para calcular margen marginal y reutilización.';

COMMENT ON COLUMN client_deployments.plan IS
  'JSON estructurado del plan generado por SAGE: phases, pricing, outcomes, risks';
