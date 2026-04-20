-- ============================================================
-- Migration 030: Games catalog
-- Infra para embed builds Unity WebGL (+ Three.js / Phaser futuros).
-- Aplicada via Supabase MCP.
-- ============================================================

CREATE TABLE IF NOT EXISTS games_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  engine TEXT NOT NULL DEFAULT 'unity' CHECK (engine IN ('unity','threejs','phaser','html5')),

  -- Unity WebGL specific fields
  build_url TEXT,        -- path base del build en Supabase Storage
  loader_url TEXT,       -- UnityLoader.js
  data_url TEXT,         -- .data file
  framework_url TEXT,    -- .framework.js
  wasm_url TEXT,         -- .wasm

  thumbnail_url TEXT,
  cover_image_url TEXT,
  aspect_ratio TEXT DEFAULT '16:9',
  memory_size_mb INT DEFAULT 256,
  compression TEXT DEFAULT 'gzip' CHECK (compression IN ('gzip','br','none')),

  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  play_count INT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_games_active ON games_catalog(is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_games_slug ON games_catalog(slug);

-- RLS: service role full, anon read active
ALTER TABLE games_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_games" ON games_catalog
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "anon_read_active_games" ON games_catalog
  FOR SELECT USING (is_active = true);

-- Seed placeholder
INSERT INTO games_catalog (slug, title, description, engine, is_active, is_featured, tags)
VALUES (
  'pacame-experience',
  'PACAME Experience',
  'Experiencia 3D interactiva proximamente. El equipo esta construyendo una demo inmersiva que muestra el poder de la plataforma.',
  'unity',
  true,
  true,
  ARRAY['coming-soon', 'demo', '3d']
)
ON CONFLICT (slug) DO NOTHING;
