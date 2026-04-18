-- ============================================================
-- Migration 008: Marketplace AI-Delivered
-- Productos entry tier (19-79€) entregados autonomamente
-- por agentes IA. Capa sobre clients/stripe existentes.
-- Ejecutar en Supabase SQL Editor.
-- ============================================================

-- ===================
-- 1. SERVICE_CATALOG
-- Catalogo de productos entry editable sin redeploy
-- ===================

CREATE TABLE IF NOT EXISTS service_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  agent_id TEXT NOT NULL CHECK (agent_id IN ('nova','pixel','copy','atlas','pulse','sage','core','nexus','lens')),
  delivery_sla_hours INTEGER NOT NULL DEFAULT 24,
  deliverable_kind TEXT NOT NULL CHECK (deliverable_kind IN ('image','pdf','html_zip','text','social_post','logo_pack','favicon_pack')),
  inputs_schema JSONB NOT NULL DEFAULT '{}'::jsonb,  -- JSON-Schema para form post-pago
  schema_version INTEGER DEFAULT 1,
  revisions_included INTEGER DEFAULT 2,
  features JSONB DEFAULT '[]'::jsonb,   -- bullets marketing
  examples JSONB DEFAULT '[]'::jsonb,    -- URLs de ejemplos
  faq JSONB DEFAULT '[]'::jsonb,         -- [{q, a}]
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_catalog_slug ON service_catalog(slug);
CREATE INDEX IF NOT EXISTS idx_service_catalog_active ON service_catalog(is_active, sort_order) WHERE is_active = TRUE;

-- ===================
-- 2. ORDERS
-- Instancia de compra, idempotente por stripe_session_id
-- ===================

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  service_slug TEXT NOT NULL,
  service_catalog_id UUID REFERENCES service_catalog(id),
  stripe_session_id TEXT UNIQUE,        -- idempotencia critica
  stripe_payment_intent TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN (
    'paid','inputs_pending','processing','delivered',
    'revision_requested','escalated','refunded','cancelled','failed'
  )),
  inputs JSONB DEFAULT '{}'::jsonb,
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  progress_message TEXT,
  assigned_agent TEXT,
  delivered_at TIMESTAMPTZ,
  escalated_to_pablo BOOLEAN DEFAULT FALSE,
  escalation_reason TEXT,
  escalated_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  reviewed_at TIMESTAMPTZ,
  customer_email TEXT,                   -- fallback si no hay client_id aun
  customer_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_agent_status ON orders(assigned_agent, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at) WHERE status = 'delivered';

-- Secuencia para order_number "PAC-YYYY-NNNNNN"
CREATE SEQUENCE IF NOT EXISTS orders_number_seq START 1001;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'PAC-' || to_char(NOW(),'YYYY') || '-' || lpad(nextval('orders_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_number_trigger ON orders;
CREATE TRIGGER orders_number_trigger
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION generate_order_number();

CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at_trigger ON orders;
CREATE TRIGGER orders_updated_at_trigger
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at();

-- ===================
-- 3. DELIVERABLES
-- Entregables versionados por order
-- ===================

CREATE TABLE IF NOT EXISTS deliverables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,    -- 1=original, 2+=revisiones
  kind TEXT NOT NULL CHECK (kind IN ('image','pdf','text','html','zip','json','audio','video')),
  title TEXT,
  file_url TEXT,                         -- Supabase Storage URL (privado con signed URL)
  storage_path TEXT,                     -- path interno bucket
  preview_url TEXT,                      -- thumbnail publico
  payload JSONB,                         -- contenido inline para text/json
  meta JSONB DEFAULT '{}'::jsonb,        -- {width, height, model, cost_usd, tokens, size_bytes}
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliverables_order ON deliverables(order_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_deliverables_current ON deliverables(order_id) WHERE is_current = TRUE;

-- Trigger: cuando se inserta una nueva version con is_current=true, marcar anteriores como false
CREATE OR REPLACE FUNCTION deliverables_mark_previous_not_current()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = TRUE THEN
    UPDATE deliverables
    SET is_current = FALSE
    WHERE order_id = NEW.order_id
      AND id != NEW.id
      AND is_current = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deliverables_current_trigger ON deliverables;
CREATE TRIGGER deliverables_current_trigger
AFTER INSERT ON deliverables
FOR EACH ROW EXECUTE FUNCTION deliverables_mark_previous_not_current();

-- ===================
-- 4. DELIVERY_REVISIONS
-- Revisiones solicitadas por cliente
-- ===================

CREATE TABLE IF NOT EXISTS delivery_revisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,      -- 1, 2, 3+
  requested_by UUID REFERENCES clients(id),
  feedback TEXT NOT NULL,
  feedback_sentiment TEXT CHECK (feedback_sentiment IN ('positive','neutral','negative')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','escalated')),
  resulting_deliverable_id UUID REFERENCES deliverables(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_delivery_revisions_order ON delivery_revisions(order_id, revision_number);
CREATE INDEX IF NOT EXISTS idx_delivery_revisions_status ON delivery_revisions(status);

-- Trigger: si revision_number >= 3 al INSERT, escalar
CREATE OR REPLACE FUNCTION escalate_on_third_revision()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.revision_number >= 3 THEN
    UPDATE orders
    SET escalated_to_pablo = TRUE,
        escalation_reason = COALESCE(escalation_reason, 'Revision #' || NEW.revision_number || ' solicitada'),
        escalated_at = NOW(),
        status = 'escalated'
    WHERE id = NEW.order_id AND escalated_to_pablo = FALSE;

    INSERT INTO notifications (type, priority, title, message, data, read)
    VALUES (
      'escalation_pablo',
      'critical',
      'Escalada: Revision #' || NEW.revision_number,
      'Cliente ha pedido revision ' || NEW.revision_number || '. Requiere atencion humana.',
      jsonb_build_object('order_id', NEW.order_id, 'revision_id', NEW.id, 'feedback', NEW.feedback),
      FALSE
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS delivery_revisions_escalate ON delivery_revisions;
CREATE TRIGGER delivery_revisions_escalate
AFTER INSERT ON delivery_revisions
FOR EACH ROW EXECUTE FUNCTION escalate_on_third_revision();

-- ===================
-- 5. ORDER_EVENTS
-- Audit trail + feed para Realtime UI
-- ===================

CREATE TABLE IF NOT EXISTS order_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'paid','inputs_requested','inputs_collected','agent_started','progress',
    'draft_ready','delivered','revision_requested','revision_completed',
    'escalated','completed','refunded','delivery_failure','webhook_duplicate'
  )),
  title TEXT,
  message TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_events_type ON order_events(event_type, created_at DESC);

-- Activar realtime para clientes
ALTER PUBLICATION supabase_realtime ADD TABLE order_events;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE deliverables;

-- ===================
-- 6. UPSELL_CAMPAIGNS
-- Tracking D+7 upsell autonomo
-- ===================

CREATE TABLE IF NOT EXISTS upsell_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  campaign TEXT NOT NULL,                -- 'logo_to_landing_bundle', 'post_to_monthly', etc.
  target_service_slugs TEXT[],           -- productos recomendados
  subject_line TEXT,
  email_body TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_order_id UUID REFERENCES orders(id),
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upsell_campaigns_order ON upsell_campaigns(order_id);
CREATE INDEX IF NOT EXISTS idx_upsell_campaigns_scheduled ON upsell_campaigns(scheduled_for) WHERE sent_at IS NULL;

-- ===================
-- 7. PENDING_RECONCILIATION
-- Safety net para webhooks que fallaron mid-way
-- ===================

CREATE TABLE IF NOT EXISTS pending_reconciliation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,                  -- 'stripe_webhook', 'delivery_start', etc.
  reference_id TEXT,                     -- stripe_session_id u otros
  error_message TEXT,
  payload JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_reconciliation_unresolved ON pending_reconciliation(created_at) WHERE resolved = FALSE;

-- ===================
-- 8. CLIENTS — columnas nuevas para GDPR testimonial + LTV
-- ===================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS show_in_testimonials BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS testimonial_text TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS testimonial_photo_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ltv_cents INTEGER DEFAULT 0;

-- Trigger: al marcar order como delivered, sumar al LTV del cliente
CREATE OR REPLACE FUNCTION update_client_ltv_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') AND NEW.client_id IS NOT NULL THEN
    UPDATE clients
    SET ltv_cents = COALESCE(ltv_cents,0) + NEW.amount_cents
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_client_ltv_trigger ON orders;
CREATE TRIGGER orders_client_ltv_trigger
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_client_ltv_on_delivery();

-- ===================
-- 9. RLS (Row Level Security)
-- ===================

ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_reconciliation ENABLE ROW LEVEL SECURITY;

-- Catalogo publico para lectura
DROP POLICY IF EXISTS "service_catalog_public_read" ON service_catalog;
CREATE POLICY "service_catalog_public_read" ON service_catalog
  FOR SELECT USING (is_active = TRUE);

-- Service role tiene acceso total (usado por API routes con service key)
DROP POLICY IF EXISTS "orders_service_role_all" ON orders;
CREATE POLICY "orders_service_role_all" ON orders
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "deliverables_service_role_all" ON deliverables;
CREATE POLICY "deliverables_service_role_all" ON deliverables
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "delivery_revisions_service_role_all" ON delivery_revisions;
CREATE POLICY "delivery_revisions_service_role_all" ON delivery_revisions
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "order_events_service_role_all" ON order_events;
CREATE POLICY "order_events_service_role_all" ON order_events
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "upsell_campaigns_service_role_all" ON upsell_campaigns;
CREATE POLICY "upsell_campaigns_service_role_all" ON upsell_campaigns
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "pending_reconciliation_service_role_all" ON pending_reconciliation;
CREATE POLICY "pending_reconciliation_service_role_all" ON pending_reconciliation
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Realtime tambien necesita policies para anon (ya autenticado via cookie propia)
-- La autorizacion real la hace el API; realtime solo permite subscribir filtrado
DROP POLICY IF EXISTS "orders_realtime_read" ON orders;
CREATE POLICY "orders_realtime_read" ON orders
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "order_events_realtime_read" ON order_events;
CREATE POLICY "order_events_realtime_read" ON order_events
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "deliverables_realtime_read" ON deliverables;
CREATE POLICY "deliverables_realtime_read" ON deliverables
  FOR SELECT USING (TRUE);

-- ===================
-- 10. COMMENTS
-- ===================

COMMENT ON TABLE service_catalog IS 'Catalogo de productos entry-tier entregados por agentes IA';
COMMENT ON TABLE orders IS 'Instancias de compra. Idempotente por stripe_session_id';
COMMENT ON TABLE deliverables IS 'Entregables versionados. is_current marca la version activa';
COMMENT ON TABLE delivery_revisions IS 'Revisiones solicitadas por cliente. >=3 escala a Pablo';
COMMENT ON TABLE order_events IS 'Audit trail + Realtime feed para UI tracking';
COMMENT ON TABLE upsell_campaigns IS 'Upsell automatico D+7 tras delivery';
COMMENT ON TABLE pending_reconciliation IS 'Safety net para webhooks/deliveries fallidos';

-- FIN Migration 008
