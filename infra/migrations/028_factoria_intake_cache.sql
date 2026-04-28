-- 028_factoria_intake_cache.sql
-- FASE H · Cliente Factory front-door: cache de BrandBrief extraído por Firecrawl.
--
-- Cliente pega URL en /factoria/intake → Firecrawl scrapea → BrandBrief JSON
-- queda persistido aquí 24h (default). Cache hits evitan re-scrape y limitan
-- gasto Firecrawl. Hits por url_normalized (sin querystring, hostname lowercase).

CREATE TABLE IF NOT EXISTS client_intake_cache (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  url_normalized  text        NOT NULL UNIQUE,
  url_original    text        NOT NULL,
  brief_json      jsonb       NOT NULL,
  fetched_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  confidence      real,
  sector_guess    text
);

CREATE INDEX IF NOT EXISTS idx_intake_url      ON client_intake_cache(url_normalized);
CREATE INDEX IF NOT EXISTS idx_intake_sector   ON client_intake_cache(sector_guess);
CREATE INDEX IF NOT EXISTS idx_intake_fetched  ON client_intake_cache(fetched_at DESC);

-- RLS deny-all (server-side only via SUPABASE_SERVICE_ROLE_KEY).
-- Los endpoints `/api/factoria/intake/*` usan createServerSupabase() que bypassa RLS.
ALTER TABLE client_intake_cache ENABLE ROW LEVEL SECURITY;

-- Limpieza de filas caducadas. Se puede llamar desde un cron n8n diario.
-- DELETE FROM client_intake_cache WHERE expires_at < now() - interval '7 days';

COMMENT ON TABLE client_intake_cache IS
  'FASE H Cliente Factory: BrandBrief extraído de URLs vía Firecrawl. TTL default 24h.';
COMMENT ON COLUMN client_intake_cache.url_normalized IS
  'URL canónica: protocolo + hostname lowercase + path sin trailing slash. Sin querystring/hash.';
COMMENT ON COLUMN client_intake_cache.brief_json IS
  'Schema en web/lib/factoria/firecrawl-brand.ts (BrandBrief). schema_version dentro del JSON.';
