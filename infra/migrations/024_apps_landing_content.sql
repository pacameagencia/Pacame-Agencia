-- Migration 024: Enriquece apps_catalog con contenido de landing page dedicada.
-- Aplicada via Supabase MCP apply_migration.

ALTER TABLE apps_catalog ADD COLUMN IF NOT EXISTS use_cases JSONB DEFAULT '[]'::jsonb;
ALTER TABLE apps_catalog ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb;
ALTER TABLE apps_catalog ADD COLUMN IF NOT EXISTS hero_media_url TEXT;
ALTER TABLE apps_catalog ADD COLUMN IF NOT EXISTS screenshots JSONB DEFAULT '[]'::jsonb;
ALTER TABLE apps_catalog ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb;
ALTER TABLE apps_catalog ADD COLUMN IF NOT EXISTS long_description TEXT;
ALTER TABLE apps_catalog ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN apps_catalog.use_cases IS 'Array {title, description, sector} para landing.';
COMMENT ON COLUMN apps_catalog.faq IS 'Array {q, a} preguntas frecuentes.';
COMMENT ON COLUMN apps_catalog.benefits IS 'Array {title, description, icon} hero bullets.';
COMMENT ON COLUMN apps_catalog.screenshots IS 'Array URLs screenshots galeria.';

-- Seed (aplicado via execute_sql separado):
--   PACAME Contact: benefits 6, use_cases 6, faq 7
--   PACAME Agenda:  benefits 6, use_cases 6, faq 7
