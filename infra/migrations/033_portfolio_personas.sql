-- Migration 033 — Portfolio Personas (Sprint 21 PR #42 Bloque A)
-- 24 personas = 3 × 8 verticales. Cada persona = mini-propuesta comercial completa.
-- Pablo menciono explicitamente: "PACAME Gym aplica a gimnasios PERO TAMBIEN entrenadores
-- personales; PACAME Inmo aplica a inmobiliarias PERO TAMBIEN dueños Airbnb".
-- Una web multinacional resuelve ESA dispersion con sub-rutas dedicadas.

CREATE TABLE IF NOT EXISTS portfolio_personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vertical_slug TEXT NOT NULL REFERENCES portfolio_verticals(slug) ON DELETE CASCADE,
  persona_slug TEXT NOT NULL,
  persona_name TEXT NOT NULL,
  persona_tagline TEXT,
  persona_emoji TEXT,
  pain_headline TEXT NOT NULL,
  pain_bullets JSONB DEFAULT '[]'::jsonb NOT NULL,
  solution_headline TEXT NOT NULL,
  solution_bullets JSONB DEFAULT '[]'::jsonb NOT NULL,
  deliverables JSONB DEFAULT '[]'::jsonb NOT NULL,
  case_study JSONB,
  starting_price_cents INT,
  timeline_days INT,
  faq JSONB DEFAULT '[]'::jsonb NOT NULL,
  hero_image_url TEXT,
  og_image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  sort_order INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (vertical_slug, persona_slug)
);

CREATE INDEX IF NOT EXISTS idx_personas_active_sort
  ON portfolio_personas (vertical_slug, is_active, sort_order);

-- RLS
ALTER TABLE portfolio_personas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read active personas" ON portfolio_personas;
CREATE POLICY "public read active personas"
  ON portfolio_personas FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "service_role all personas" ON portfolio_personas;
CREATE POLICY "service_role all personas"
  ON portfolio_personas FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger updated_at
CREATE OR REPLACE FUNCTION touch_portfolio_personas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_portfolio_personas_touch ON portfolio_personas;
CREATE TRIGGER trg_portfolio_personas_touch
  BEFORE UPDATE ON portfolio_personas
  FOR EACH ROW
  EXECUTE FUNCTION touch_portfolio_personas_updated_at();

COMMENT ON TABLE portfolio_personas IS 'Sub-personas dentro de cada vertical PACAME. 24 rows iniciales = 3 personas × 8 verticales. Una persona = una pagina SSG /portafolio/[vertical]/[persona] con propuesta comercial lista.';
