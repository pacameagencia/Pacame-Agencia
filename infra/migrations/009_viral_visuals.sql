-- =============================================================================
-- PACAME — Migracion 009: soporte DB para pacame-viral-visuals
-- Research IG + pattern extraction + generación inspirada en virales
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- viral_references: posts virales scrapeados de Instagram por Apify
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS viral_references (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform        TEXT NOT NULL DEFAULT 'instagram',
  niche           TEXT NOT NULL,
  hashtag         TEXT,
  post_url        TEXT UNIQUE NOT NULL,
  post_type       TEXT CHECK (post_type IN ('post','reel','carousel','story')),
  caption         TEXT,
  likes           INT DEFAULT 0,
  comments        INT DEFAULT 0,
  views           BIGINT,
  image_url       TEXT,
  video_url       TEXT,
  owner_username  TEXT,
  owner_followers INT,
  posted_at       TIMESTAMPTZ,
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analyzed        BOOLEAN NOT NULL DEFAULT FALSE,
  pattern         JSONB,
  raw             JSONB
);

CREATE INDEX IF NOT EXISTS idx_viral_refs_niche_captured ON viral_references (niche, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_viral_refs_analyzed ON viral_references (analyzed) WHERE analyzed = FALSE;
CREATE INDEX IF NOT EXISTS idx_viral_refs_hashtag ON viral_references (hashtag);

-- -----------------------------------------------------------------------------
-- viral_briefs: ADN visual consolidado de un nicho en un momento dado
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS viral_briefs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche           TEXT NOT NULL,
  brief           JSONB NOT NULL,
  reference_ids   UUID[] NOT NULL DEFAULT '{}',
  sample_size     INT NOT NULL DEFAULT 0,
  validation_score REAL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days')
);

CREATE INDEX IF NOT EXISTS idx_viral_briefs_niche_created ON viral_briefs (niche, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_viral_briefs_expires ON viral_briefs (expires_at);

-- -----------------------------------------------------------------------------
-- viral_generations: piezas generadas por la skill, con trazabilidad
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS viral_generations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche           TEXT NOT NULL,
  brief_id        UUID REFERENCES viral_briefs(id) ON DELETE SET NULL,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  format          TEXT NOT NULL CHECK (format IN ('feed-1:1','feed-4:5','story-9:16','reel-9:16','thumbnail-16:9')),
  message         TEXT NOT NULL,
  prompt_used     TEXT NOT NULL,
  output_url      TEXT,
  output_urls     TEXT[] DEFAULT '{}',
  model_used      TEXT,
  task_id         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  ig_post_id      TEXT,
  published_at    TIMESTAMPTZ,
  engagement      JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_viral_gen_niche_created ON viral_generations (niche, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_viral_gen_brief ON viral_generations (brief_id);

-- -----------------------------------------------------------------------------
-- RLS: service_role acceso total; anon/authenticated sin acceso
-- -----------------------------------------------------------------------------
ALTER TABLE viral_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS viral_refs_service ON viral_references;
CREATE POLICY viral_refs_service ON viral_references FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS viral_briefs_service ON viral_briefs;
CREATE POLICY viral_briefs_service ON viral_briefs FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS viral_gen_service ON viral_generations;
CREATE POLICY viral_gen_service ON viral_generations FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

COMMIT;
