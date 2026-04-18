-- Migration 010: Marketplace platform — fundamentos de escala
-- Runners declarativos, multi-provider, bundles, categorias, QA, margin tracking
-- Aplicada via Supabase MCP apply_migration.

-- 1. PROVIDERS
CREATE TABLE IF NOT EXISTS providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_pacame BOOLEAN DEFAULT FALSE,
  email TEXT,
  stripe_connect_id TEXT,
  revenue_share_pct INTEGER DEFAULT 100 CHECK (revenue_share_pct BETWEEN 0 AND 100),
  is_active BOOLEAN DEFAULT TRUE,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO providers (slug, name, is_pacame, revenue_share_pct, is_active)
VALUES ('pacame', 'PACAME', TRUE, 100, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 2. SERVICE_CATALOG extensions
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS runner_type TEXT DEFAULT 'custom'
  CHECK (runner_type IN ('llm_text','llm_structured','llm_image','llm_image_multi','pdf_render','html_zip_render','pipeline','custom'));
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS runner_config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'one_off'
  CHECK (product_type IN ('one_off','subscription','bundle','app','template','tiered'));
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS billing_interval TEXT
  CHECK (billing_interval IN ('month','year'));
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS usage_quota JSONB;
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS bundle_items JSONB;
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS parent_slug TEXT;
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS tier_name TEXT;
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES providers(id);
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS revenue_share_override INTEGER
  CHECK (revenue_share_override IS NULL OR (revenue_share_override BETWEEN 0 AND 100));
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS lang TEXT DEFAULT 'es';
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS qa_threshold NUMERIC(3,1) DEFAULT 7.0
  CHECK (qa_threshold BETWEEN 0 AND 10);
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS qa_enabled BOOLEAN DEFAULT FALSE;

UPDATE service_catalog SET provider_id = (SELECT id FROM providers WHERE slug = 'pacame' LIMIT 1)
WHERE provider_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_catalog_category ON service_catalog(category, is_active);
CREATE INDEX IF NOT EXISTS idx_service_catalog_tags ON service_catalog USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_service_catalog_featured ON service_catalog(is_featured, sort_order) WHERE is_featured = TRUE AND is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_service_catalog_provider ON service_catalog(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_catalog_product_type ON service_catalog(product_type, is_active);
CREATE INDEX IF NOT EXISTS idx_service_catalog_search ON service_catalog
  USING GIN (to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce(tagline,'') || ' ' || coalesce(description,'')));

-- 3. ORDERS extensions
ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES providers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cost_usd NUMERIC(10,4) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS revenue_cents INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS provider_revenue_cents INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pacame_margin_cents INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qa_score NUMERIC(3,1);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qa_passed BOOLEAN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qa_feedback TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES orders(id);

CREATE INDEX IF NOT EXISTS idx_orders_provider ON orders(provider_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_parent ON orders(parent_order_id) WHERE parent_order_id IS NOT NULL;

CREATE OR REPLACE FUNCTION calculate_order_revenue_split()
RETURNS TRIGGER AS $$
DECLARE
  share_pct INTEGER;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    NEW.revenue_cents := NEW.amount_cents;
    SELECT COALESCE(sc.revenue_share_override, p.revenue_share_pct, 100) INTO share_pct
    FROM service_catalog sc
    LEFT JOIN providers p ON p.id = sc.provider_id
    WHERE sc.id = NEW.service_catalog_id;
    IF share_pct IS NULL THEN share_pct := 100; END IF;
    NEW.provider_revenue_cents := (NEW.amount_cents * share_pct) / 100;
    NEW.pacame_margin_cents := NEW.amount_cents - NEW.provider_revenue_cents;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_revenue_split_trigger ON orders;
CREATE TRIGGER orders_revenue_split_trigger
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION calculate_order_revenue_split();

-- 4. DELIVERY_QA_CHECKS
CREATE TABLE IF NOT EXISTS delivery_qa_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE CASCADE,
  score NUMERIC(3,1) CHECK (score BETWEEN 0 AND 10),
  passed BOOLEAN,
  feedback TEXT,
  model_used TEXT,
  cost_usd NUMERIC(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_delivery_qa_order ON delivery_qa_checks(order_id);
ALTER TABLE delivery_qa_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qa_service_role_all" ON delivery_qa_checks;
CREATE POLICY "qa_service_role_all" ON delivery_qa_checks FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- 5. CATEGORIES
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO service_categories (slug, name, description, icon, sort_order) VALUES
  ('branding', 'Branding e Identidad', 'Logos, favicons, rebrand, identidad visual completa', 'Sparkles', 10),
  ('web', 'Web y Desarrollo', 'Landings, webs, tiendas, apps', 'Globe', 20),
  ('copy', 'Copy y Contenido', 'Copywriting, blog, newsletter, scripts', 'PenTool', 30),
  ('seo', 'SEO y Posicionamiento', 'Auditorias, optimizacion, link building, SEO tecnico', 'TrendingUp', 40),
  ('social', 'Redes Sociales', 'Posts, reels, estrategia, gestion', 'Instagram', 50),
  ('ads', 'Publicidad Digital', 'Meta Ads, Google Ads, TikTok Ads, funnels', 'Target', 60),
  ('analytics', 'Analytics y Datos', 'Setup GA4, dashboards, informes', 'BarChart3', 70),
  ('apps', 'Apps y Automatizaciones', 'Chatbots, integraciones, workflows n8n', 'Bot', 80),
  ('templates', 'Templates y Recursos', 'Plantillas, kits, descargables', 'Download', 90)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_public_read" ON service_categories;
CREATE POLICY "categories_public_read" ON service_categories FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "categories_service_role_all" ON service_categories;
CREATE POLICY "categories_service_role_all" ON service_categories FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- 6. PROVIDERS RLS
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "providers_public_read_basic" ON providers;
CREATE POLICY "providers_public_read_basic" ON providers FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "providers_service_role_all" ON providers;
CREATE POLICY "providers_service_role_all" ON providers FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

COMMENT ON TABLE providers IS 'Providers/sellers. PACAME es el default. Futura expansion multi-provider.';
COMMENT ON TABLE service_categories IS 'Categorias del marketplace. Usadas para filtros y navegacion.';
COMMENT ON TABLE delivery_qa_checks IS 'Auto-QA score por deliverable.';
