-- ============================================================
-- PACAME Referrals — Fase 2: dashboard admin + biblioteca contenido
-- Idempotente. Compatible con la migración 001 existente.
-- ============================================================

-- 1. Capturar producto comprado y detalles comerciales
ALTER TABLE aff_referrals
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE aff_commissions
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Tracking enriquecido en visits
ALTER TABLE aff_visits ADD COLUMN IF NOT EXISTS http_referer text;
ALTER TABLE aff_visits ADD COLUMN IF NOT EXISTS utm_source   text;
ALTER TABLE aff_visits ADD COLUMN IF NOT EXISTS utm_medium   text;
ALTER TABLE aff_visits ADD COLUMN IF NOT EXISTS utm_campaign text;

-- 3. Biblioteca de contenido para afiliados
CREATE TABLE IF NOT EXISTS aff_content_assets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     text NOT NULL,
  type          text NOT NULL
    CHECK (type IN ('banner','post','email','video','script','copy','template','other')),
  category      text,
  title         text NOT NULL,
  description   text,
  body          text,
  preview_url   text,
  download_url  text,
  mime_type     text,
  bytes         int,
  tags          text[] NOT NULL DEFAULT '{}',
  active        boolean NOT NULL DEFAULT true,
  views         int NOT NULL DEFAULT 0,
  downloads     int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    text
);

CREATE INDEX IF NOT EXISTS idx_aff_content_active
  ON aff_content_assets (tenant_id, type, active)
  WHERE active = true;

ALTER TABLE aff_content_assets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'aff_content_assets' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY service_role_all
      ON aff_content_assets FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END$$;

-- Helper RPC: incrementa views/downloads atómicamente sin race condition.
CREATE OR REPLACE FUNCTION aff_content_increment_counter(
  p_id uuid,
  p_field text
) RETURNS void AS $$
BEGIN
  IF p_field = 'views' THEN
    UPDATE aff_content_assets SET views = views + 1 WHERE id = p_id;
  ELSIF p_field = 'downloads' THEN
    UPDATE aff_content_assets SET downloads = downloads + 1 WHERE id = p_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
