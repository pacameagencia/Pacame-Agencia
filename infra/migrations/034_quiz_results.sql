-- Migration 034 — Quiz Results (Sprint 21 PR #42 Bloque B)
-- Persistencia de respuestas del Smart Service Finder + bundle recomendado.
-- Cada quiz result tiene slug unico compartible (8 char nanoid).

CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  sector TEXT,
  business_size TEXT,
  goal TEXT,
  budget TEXT,
  urgency TEXT,
  persona_slug TEXT,
  recommended_bundle JSONB DEFAULT '[]'::jsonb NOT NULL,
  total_cents INT,
  timeline_days INT,
  lead_email TEXT,
  lead_phone TEXT,
  lead_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_created ON quiz_results (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_results_email ON quiz_results (lead_email);
CREATE INDEX IF NOT EXISTS idx_quiz_results_slug ON quiz_results (slug);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Public puede INSERT (para quiz anonymous) y SELECT by slug (para share link)
DROP POLICY IF EXISTS "public insert own quiz" ON quiz_results;
CREATE POLICY "public insert own quiz"
  ON quiz_results FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "public select by slug" ON quiz_results;
CREATE POLICY "public select by slug"
  ON quiz_results FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "service_role all quiz" ON quiz_results;
CREATE POLICY "service_role all quiz"
  ON quiz_results FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION touch_quiz_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quiz_results_touch ON quiz_results;
CREATE TRIGGER trg_quiz_results_touch
  BEFORE UPDATE ON quiz_results
  FOR EACH ROW
  EXECUTE FUNCTION touch_quiz_results_updated_at();

COMMENT ON TABLE quiz_results IS 'Resultados del Smart Service Finder (/encuentra-tu-solucion). Cada row = 1 quiz completado con bundle recomendado + lead capture opcional.';
