-- 016_asesorpro_schema.sql
-- Schema específico de AsesorPro (mini-SaaS para asesores fiscales).
-- Multi-tenant via asesor_user_id (FK a pacame_product_users).

-- Clientes-finales del asesor (la PYME que factura)
CREATE TABLE IF NOT EXISTS asesorpro_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesor_user_id uuid NOT NULL REFERENCES pacame_product_users(id) ON DELETE CASCADE,
  client_user_id uuid REFERENCES pacame_product_users(id) ON DELETE SET NULL,
  -- ↑ si el cliente acepta invitación y crea cuenta, se asocia aquí
  fiscal_name text NOT NULL,
  trade_name text,
  nif text NOT NULL,
  email text,
  phone text,
  address text,
  postal_code text,
  city text,
  iva_regime text DEFAULT 'general' CHECK (iva_regime IN ('general', 'recargo_eq', 'simplificado', 'agricultura', 'exento')),
  invoice_prefix text DEFAULT '',
  invoice_next_number integer DEFAULT 1,
  status text DEFAULT 'active' CHECK (status IN ('invited', 'active', 'paused', 'archived')),
  invite_token text,
  invite_sent_at timestamptz,
  invite_accepted_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apc_asesor ON asesorpro_clients(asesor_user_id, status);
CREATE INDEX IF NOT EXISTS idx_apc_nif ON asesorpro_clients(nif);
CREATE UNIQUE INDEX IF NOT EXISTS idx_apc_invite_token ON asesorpro_clients(invite_token) WHERE invite_token IS NOT NULL;

-- Productos/servicios que el cliente factura habitualmente
CREATE TABLE IF NOT EXISTS asesorpro_client_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesor_client_id uuid NOT NULL REFERENCES asesorpro_clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  unit_price_cents integer NOT NULL,
  iva_pct integer DEFAULT 21,
  unit text DEFAULT 'unidad',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Facturas creadas por el cliente
CREATE TABLE IF NOT EXISTS asesorpro_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesor_client_id uuid NOT NULL REFERENCES asesorpro_clients(id) ON DELETE CASCADE,
  asesor_user_id uuid NOT NULL REFERENCES pacame_product_users(id) ON DELETE CASCADE,
  -- ↑ denormalizado para query rápida del pipeline asesor
  number text NOT NULL,
  series text DEFAULT '',
  issue_date date NOT NULL DEFAULT current_date,
  due_date date,
  -- Cliente al que se factura (NIF + nombre, no necesariamente otro user del sistema)
  customer_fiscal_name text NOT NULL,
  customer_nif text NOT NULL,
  customer_address text,
  customer_email text,
  -- Líneas
  lines jsonb NOT NULL,                              -- [{description, quantity, unit_price_cents, iva_pct}]
  -- Totales (calculados al insert/update con trigger)
  subtotal_cents integer NOT NULL DEFAULT 0,
  iva_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  -- Metadata
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled')),
  pdf_url text,
  paid_at timestamptz,
  notes text,
  reviewed_by_asesor_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (asesor_client_id, series, number)
);

CREATE INDEX IF NOT EXISTS idx_api_asesor_status ON asesorpro_invoices(asesor_user_id, status, issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_api_client_date ON asesorpro_invoices(asesor_client_id, issue_date DESC);

-- Gastos que el cliente sube (ticket foto + OCR)
CREATE TABLE IF NOT EXISTS asesorpro_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesor_client_id uuid NOT NULL REFERENCES asesorpro_clients(id) ON DELETE CASCADE,
  asesor_user_id uuid NOT NULL REFERENCES pacame_product_users(id) ON DELETE CASCADE,
  vendor_name text,
  vendor_nif text,
  expense_date date,
  base_cents integer DEFAULT 0,
  iva_pct integer DEFAULT 21,
  iva_cents integer DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  category text,                                     -- 'restaurante', 'combustible', 'material', ...
  photo_url text,
  ocr_data jsonb DEFAULT '{}'::jsonb,                -- raw OCR output
  ocr_confidence numeric(3, 2),                      -- 0.00 - 1.00
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'rejected', 'archived')),
  reviewed_by_asesor_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ape_asesor_status ON asesorpro_expenses(asesor_user_id, status, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_ape_client_date ON asesorpro_expenses(asesor_client_id, expense_date DESC);

-- Tarjetas del pipeline del asesor
CREATE TABLE IF NOT EXISTS asesorpro_pipeline_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesor_user_id uuid NOT NULL REFERENCES pacame_product_users(id) ON DELETE CASCADE,
  asesor_client_id uuid REFERENCES asesorpro_clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'revisado', 'presentado', 'cerrado')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_date date,
  position integer DEFAULT 0,                        -- orden dentro de columna
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apc_pipeline ON asesorpro_pipeline_cards(asesor_user_id, status, position);

-- Alertas (notificaciones in-app)
CREATE TABLE IF NOT EXISTS asesorpro_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesor_user_id uuid NOT NULL REFERENCES pacame_product_users(id) ON DELETE CASCADE,
  asesor_client_id uuid REFERENCES asesorpro_clients(id) ON DELETE CASCADE,
  type text NOT NULL,                                -- 'client_inactive', 'iva_quarter_close', 'invoice_pending_review', ...
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'urgent')),
  title text NOT NULL,
  message text,
  action_url text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apa_unread ON asesorpro_alerts(asesor_user_id, created_at DESC) WHERE read_at IS NULL;

-- Chat asesor ↔ cliente
CREATE TABLE IF NOT EXISTS asesorpro_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesor_client_id uuid NOT NULL REFERENCES asesorpro_clients(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL REFERENCES pacame_product_users(id),
  -- ↑ puede ser el asesor o el cliente final, role del user determina dirección
  body text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apm_client_time ON asesorpro_messages(asesor_client_id, created_at DESC);

-- Trigger updated_at compartido
DROP TRIGGER IF EXISTS trg_apc_updated ON asesorpro_clients;
CREATE TRIGGER trg_apc_updated BEFORE UPDATE ON asesorpro_clients
  FOR EACH ROW EXECUTE FUNCTION pacame_products_updated_at();

DROP TRIGGER IF EXISTS trg_api_updated ON asesorpro_invoices;
CREATE TRIGGER trg_api_updated BEFORE UPDATE ON asesorpro_invoices
  FOR EACH ROW EXECUTE FUNCTION pacame_products_updated_at();

DROP TRIGGER IF EXISTS trg_apc_pipeline_updated ON asesorpro_pipeline_cards;
CREATE TRIGGER trg_apc_pipeline_updated BEFORE UPDATE ON asesorpro_pipeline_cards
  FOR EACH ROW EXECUTE FUNCTION pacame_products_updated_at();

-- Trigger calcular totales factura al insert/update
CREATE OR REPLACE FUNCTION asesorpro_recalc_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  line jsonb;
  line_subtotal integer;
  line_iva integer;
  total_subtotal integer := 0;
  total_iva integer := 0;
BEGIN
  IF NEW.lines IS NOT NULL THEN
    FOR line IN SELECT * FROM jsonb_array_elements(NEW.lines)
    LOOP
      line_subtotal := COALESCE((line->>'quantity')::numeric, 1) * COALESCE((line->>'unit_price_cents')::integer, 0);
      line_iva := round(line_subtotal * COALESCE((line->>'iva_pct')::integer, 21) / 100.0)::integer;
      total_subtotal := total_subtotal + line_subtotal;
      total_iva := total_iva + line_iva;
    END LOOP;
  END IF;
  NEW.subtotal_cents := total_subtotal;
  NEW.iva_cents := total_iva;
  NEW.total_cents := total_subtotal + total_iva;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_api_recalc ON asesorpro_invoices;
CREATE TRIGGER trg_api_recalc BEFORE INSERT OR UPDATE OF lines ON asesorpro_invoices
  FOR EACH ROW EXECUTE FUNCTION asesorpro_recalc_invoice_totals();

COMMENT ON TABLE asesorpro_clients IS
  'Clientes-finales del asesor. Cada uno puede tener su propio user (client_user_id) si acepta la invitación.';
COMMENT ON TABLE asesorpro_invoices IS
  'Facturas que el cliente-final crea desde su panel. Numeración correlativa por (cliente, serie).';
COMMENT ON TABLE asesorpro_expenses IS
  'Gastos subidos como foto. OCR (Gemini Vision) extrae datos. Asesor revisa y aprueba.';
