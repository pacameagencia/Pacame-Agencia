-- =============================================================================
-- PACAME — Migracion 008: soporte DB para workflows n8n 06-10
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Campos extra en clients para los workflows
-- -----------------------------------------------------------------------------
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS google_place_id       TEXT,
  ADD COLUMN IF NOT EXISTS last_review_check     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rss_feed_url          TEXT,
  ADD COLUMN IF NOT EXISTS last_rss_check        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contact_email         TEXT,
  ADD COLUMN IF NOT EXISTS contact_name          TEXT;

-- -----------------------------------------------------------------------------
-- external_reviews: review monitoring (workflow 06)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS external_reviews (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform             TEXT NOT NULL,                -- google | yelp | tripadvisor | ...
  author               TEXT,
  rating               INT CHECK (rating BETWEEN 1 AND 5),
  text                 TEXT,
  ai_suggested_reply   TEXT,
  human_reply          TEXT,
  replied              BOOLEAN NOT NULL DEFAULT FALSE,
  replied_at           TIMESTAMPTZ,
  external_created_at  TIMESTAMPTZ,
  metadata             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_reviews_client ON external_reviews(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_reviews_platform ON external_reviews(platform, created_at DESC);

-- -----------------------------------------------------------------------------
-- competitors: competitor tracking (workflow 10)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS competitors (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID REFERENCES clients(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  url                  TEXT NOT NULL,
  active               BOOLEAN NOT NULL DEFAULT TRUE,
  last_snapshot_hash   TEXT,
  last_change_at       TIMESTAMPTZ,
  last_analysis        JSONB,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitors_client ON competitors(client_id, active);

-- -----------------------------------------------------------------------------
-- enrichment_data en leads (workflow 07)
-- -----------------------------------------------------------------------------
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS enrichment_data JSONB NOT NULL DEFAULT '{}'::jsonb;

-- -----------------------------------------------------------------------------
-- content: ampliar schema para workflows 04 y 08 (RSS-to-social)
-- -----------------------------------------------------------------------------
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS source_url TEXT;

COMMIT;

SELECT 'Migracion 008 aplicada' AS info;
SELECT count(*) AS clients_con_google FROM clients WHERE google_place_id IS NOT NULL;
SELECT count(*) AS total_competidores FROM competitors;
