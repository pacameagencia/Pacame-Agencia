-- 043_foros_engine.sql
-- Motor de Foros Dark Room · detección oportunidades + queue Pablo aprueba
--
-- Recolectores: Reddit, Forobeta, Twitter/X, IndieHackers, Quora (5 fuentes core)
-- Pipeline: scraper (cada 4h) → intent classifier → score 0-100 → genera 3 borradores
-- → dashboard /dashboard/foros aprueba/edita/marca-publicada → tracking conversión
--
-- Tracking conversión: UTM utm_source=foros&utm_medium=<plat>&utm_content=<thread_id>
-- Cookie dr_thread_id capturada en landings → atribuible a thread específico

-- ─── Sources config ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS foros_sources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform        text NOT NULL CHECK (platform IN ('reddit','forobeta','twitter','indiehackers','quora')),
  source_key      text NOT NULL,                  -- subreddit name, subforo slug, query string
  intent_hints    text[],                         -- intents que típicamente aparecen aquí
  active          boolean NOT NULL DEFAULT true,
  last_scraped_at timestamptz,
  total_scraped   int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(platform, source_key)
);
CREATE INDEX IF NOT EXISTS idx_foros_sources_active ON foros_sources(platform, active) WHERE active = true;

-- ─── Opportunities (items recolectados) ────────────────────────

CREATE TABLE IF NOT EXISTS foros_opportunities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform          text NOT NULL,
  source_key        text NOT NULL,
  thread_url        text NOT NULL UNIQUE,
  thread_title      text,
  thread_body       text,
  author_username   text,
  author_authority  int,                          -- karma reddit / followers / posts count
  posted_at         timestamptz,
  intent            text,                         -- 6 intents foros DR
  intent_confidence real,
  score             int NOT NULL DEFAULT 0,       -- 0-100
  reach_proxy       int,                          -- thread score + replies
  competition_count int,                          -- ya respuestas existentes
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','generated','approved','published','skipped','blacklisted')),
  scraped_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_foros_opp_status_score ON foros_opportunities(status, score DESC) WHERE status IN ('pending','generated');
CREATE INDEX IF NOT EXISTS idx_foros_opp_platform     ON foros_opportunities(platform);
CREATE INDEX IF NOT EXISTS idx_foros_opp_intent       ON foros_opportunities(intent);

-- ─── Responses (3 borradores por opportunity) ──────────────────

CREATE TABLE IF NOT EXISTS foros_responses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id    uuid NOT NULL REFERENCES foros_opportunities(id) ON DELETE CASCADE,
  style             text NOT NULL CHECK (style IN ('testimonial','educativo','suave')),
  draft_body        text NOT NULL,
  edited_body       text,                         -- si Pablo editó antes de publicar
  status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','approved','published','skipped')),
  published_at      timestamptz,
  utm_content       text,                         -- thread_id usado en UTM
  upvotes           int,                          -- captured periodicamente
  replies_count     int,
  clicks_estimated  int NOT NULL DEFAULT 0,
  leads_attributed  int NOT NULL DEFAULT 0,
  paid_attributed   int NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_foros_resp_opp    ON foros_responses(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_foros_resp_status ON foros_responses(status);

-- ─── Authors blacklist ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS foros_authors_blacklist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform    text NOT NULL,
  username    text NOT NULL,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(platform, username)
);

-- ─── Subreddit caps (rate limiting per platform per día) ───────

CREATE TABLE IF NOT EXISTS foros_subreddit_caps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform      text NOT NULL,
  source_key    text NOT NULL,
  date          date NOT NULL,
  posts_today   int NOT NULL DEFAULT 0,
  UNIQUE(platform, source_key, date)
);
CREATE INDEX IF NOT EXISTS idx_foros_caps_today ON foros_subreddit_caps(date);

-- ─── RLS deny all (server-side service role only) ──────────────

ALTER TABLE foros_sources              ENABLE ROW LEVEL SECURITY;
ALTER TABLE foros_opportunities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE foros_responses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE foros_authors_blacklist    ENABLE ROW LEVEL SECURITY;
ALTER TABLE foros_subreddit_caps       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS foros_sources_deny ON foros_sources;
DROP POLICY IF EXISTS foros_opp_deny ON foros_opportunities;
DROP POLICY IF EXISTS foros_resp_deny ON foros_responses;
DROP POLICY IF EXISTS foros_blacklist_deny ON foros_authors_blacklist;
DROP POLICY IF EXISTS foros_caps_deny ON foros_subreddit_caps;

CREATE POLICY foros_sources_deny      ON foros_sources           FOR ALL USING (false);
CREATE POLICY foros_opp_deny          ON foros_opportunities     FOR ALL USING (false);
CREATE POLICY foros_resp_deny         ON foros_responses         FOR ALL USING (false);
CREATE POLICY foros_blacklist_deny    ON foros_authors_blacklist FOR ALL USING (false);
CREATE POLICY foros_caps_deny         ON foros_subreddit_caps    FOR ALL USING (false);

-- ─── Seeds: sources canónicas ──────────────────────────────────

INSERT INTO foros_sources (platform, source_key, intent_hints) VALUES
  -- Reddit ES
  ('reddit', 'Emprender',          ARRAY['pregunta_alternativa_pago','pregunta_stack_tools']),
  ('reddit', 'Emprendedores',      ARRAY['pregunta_alternativa_pago','pregunta_stack_tools']),
  ('reddit', 'dropship',           ARRAY['pregunta_dropship_finder','pregunta_alternativa_pago']),
  ('reddit', 'freelance_es',       ARRAY['pregunta_stack_tools','pregunta_alternativa_pago']),
  ('reddit', 'MarketingDigital',   ARRAY['pregunta_stack_tools','pregunta_uso_ia']),
  ('reddit', 'ContenidoCreators',  ARRAY['pregunta_stack_tools','pregunta_uso_ia']),
  ('reddit', 'forobeta',           ARRAY['pregunta_stack_tools','pregunta_alternativa_pago']),
  -- Reddit EN ICP
  ('reddit', 'SideProject',        ARRAY['pregunta_stack_tools','comparativa_pricing']),
  ('reddit', 'IndieHackers',       ARRAY['pregunta_stack_tools','comparativa_pricing']),
  ('reddit', 'digital_nomad',      ARRAY['pregunta_alternativa_pago','pregunta_stack_tools']),
  ('reddit', 'EntrepreneurRideAlong', ARRAY['pregunta_stack_tools']),
  ('reddit', 'Dropship',           ARRAY['pregunta_dropship_finder']),
  ('reddit', 'AskMarketing',       ARRAY['pregunta_uso_ia','pregunta_stack_tools']),
  ('reddit', 'sweatystartup',      ARRAY['pregunta_alternativa_pago']),
  -- Forobeta subforos
  ('forobeta', 'marketing-online', ARRAY['pregunta_stack_tools','pregunta_uso_ia']),
  ('forobeta', 'seo',              ARRAY['pregunta_stack_tools','pregunta_uso_ia']),
  ('forobeta', 'diseno-web',       ARRAY['pregunta_stack_tools']),
  ('forobeta', 'ganar-dinero-online', ARRAY['pregunta_alternativa_pago','pregunta_dropship_finder']),
  ('forobeta', 'dropshipping',     ARRAY['pregunta_dropship_finder']),
  -- Twitter queries
  ('twitter', 'alternativa adobe creative cloud', ARRAY['pregunta_alternativa_pago']),
  ('twitter', 'midjourney barato',                ARRAY['pregunta_alternativa_pago']),
  ('twitter', 'chatgpt vs claude precio',         ARRAY['comparativa_pricing']),
  ('twitter', 'toolzbuy review',                  ARRAY['mencion_competidor']),
  ('twitter', 'toolsuite seguro',                 ARRAY['mencion_competidor']),
  ('twitter', 'groupbuy españa',                  ARRAY['mencion_competidor']),
  ('twitter', 'stack creator 2026',               ARRAY['pregunta_stack_tools']),
  ('twitter', 'ahorrar herramientas IA',          ARRAY['pregunta_alternativa_pago']),
  ('twitter', 'productos ganadores dropshipping', ARRAY['pregunta_dropship_finder']),
  ('twitter', 'minea vs pipiads',                 ARRAY['comparativa_pricing','pregunta_dropship_finder']),
  ('twitter', 'como uso ia para crear',           ARRAY['pregunta_uso_ia']),
  ('twitter', 'que tools recomendais',            ARRAY['pregunta_stack_tools']),
  ('twitter', 'pago demasiado en suscripciones',  ARRAY['pregunta_alternativa_pago']),
  ('twitter', 'alternativa canva pro',            ARRAY['pregunta_alternativa_pago']),
  -- IndieHackers
  ('indiehackers', 'questions-recent', ARRAY['pregunta_stack_tools','pregunta_alternativa_pago']),
  -- Quora
  ('quora', 'herramientas IA hispano', ARRAY['pregunta_stack_tools']),
  ('quora', 'alternativas adobe baratas', ARRAY['pregunta_alternativa_pago']),
  ('quora', 'como ahorrar en suscripciones creator', ARRAY['pregunta_alternativa_pago'])
ON CONFLICT (platform, source_key) DO NOTHING;

COMMENT ON TABLE foros_sources IS 'Plataformas + queries/subreddits configuradas. Pipeline scraper itera active=true.';
COMMENT ON TABLE foros_opportunities IS 'Items recolectados de 5 plataformas hispanas con intent + score 0-100. Pablo aprueba desde /dashboard/foros.';
COMMENT ON TABLE foros_responses IS '3 borradores por opportunity (testimonial/educativo/suave). Status published tras Pablo marca manual.';
COMMENT ON TABLE foros_authors_blacklist IS 'Autores hostiles · skip futuro detecta scraper.';
COMMENT ON TABLE foros_subreddit_caps IS 'Rate limiting cap 3 respuestas/día por subreddit.';
