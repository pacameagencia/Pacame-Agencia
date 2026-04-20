-- Migration 025: Visual platform tier
-- platform_stats singleton cache, testimonials, marketplace_badges.
-- Aplicada via Supabase MCP.

CREATE TABLE IF NOT EXISTS platform_stats (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_orders_delivered INTEGER DEFAULT 0,
  total_clients_active INTEGER DEFAULT 0,
  total_apps_running INTEGER DEFAULT 0,
  total_revenue_cents BIGINT DEFAULT 0,
  avg_rating NUMERIC(3,2),
  orders_this_week INTEGER DEFAULT 0,
  orders_this_month INTEGER DEFAULT 0,
  avg_delivery_hours NUMERIC(6,2),
  uptime_pct NUMERIC(5,2) DEFAULT 99.9,
  featured_client_logos TEXT[] DEFAULT '{}',
  last_refreshed_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_stats (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_role TEXT,
  author_company TEXT,
  author_photo_url TEXT,
  author_city TEXT,
  quote TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  service_slug TEXT,
  featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_active, featured, sort_order);

CREATE TABLE IF NOT EXISTS marketplace_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_slug TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT DEFAULT 'gold',
  priority INTEGER DEFAULT 50,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_badges_slug ON marketplace_badges(service_slug);

ALTER TABLE platform_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_stats_public_read" ON platform_stats;
CREATE POLICY "platform_stats_public_read" ON platform_stats FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "platform_stats_service_all" ON platform_stats;
CREATE POLICY "platform_stats_service_all" ON platform_stats FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "testimonials_public_read" ON testimonials;
CREATE POLICY "testimonials_public_read" ON testimonials FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "testimonials_service_all" ON testimonials;
CREATE POLICY "testimonials_service_all" ON testimonials FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "marketplace_badges_public_read" ON marketplace_badges;
CREATE POLICY "marketplace_badges_public_read" ON marketplace_badges FOR SELECT USING (expires_at IS NULL OR expires_at > NOW());
DROP POLICY IF EXISTS "marketplace_badges_service_all" ON marketplace_badges;
CREATE POLICY "marketplace_badges_service_all" ON marketplace_badges FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
