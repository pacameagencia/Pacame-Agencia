-- ============================================================
-- Migration 031: Portfolio verticals (sub-marcas PACAME)
-- 8 verticales cada una con una web de ejemplo que se vende como portfolio.
-- Aplicada via Supabase MCP.
-- ============================================================

CREATE TABLE IF NOT EXISTS portfolio_verticals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  sub_brand TEXT NOT NULL,          -- "PACAME Restaurante"
  vertical_label TEXT NOT NULL,      -- "Restaurantes y bares"
  hero_headline TEXT NOT NULL,
  hero_sub TEXT,
  color_primary TEXT,                -- hex
  color_accent TEXT,                 -- hex
  icon_key TEXT,                     -- lucide / phosphor key
  features JSONB DEFAULT '[]'::jsonb,
  sections JSONB DEFAULT '[]'::jsonb,
  cta_label TEXT DEFAULT 'Quiero una web como esta',
  cta_price_cents INT,
  cta_timeline TEXT DEFAULT 'En 48h',
  proof_clients INT DEFAULT 0,
  proof_rating NUMERIC(2,1) DEFAULT 4.9,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_active ON portfolio_verticals(is_active, sort_order);

ALTER TABLE portfolio_verticals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_active_portfolio" ON portfolio_verticals FOR SELECT USING (is_active = true);
CREATE POLICY "service_role_all_portfolio" ON portfolio_verticals FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
