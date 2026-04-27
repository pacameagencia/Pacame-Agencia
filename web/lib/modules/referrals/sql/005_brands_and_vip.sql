-- ============================================================
-- PACAME Referrals — Fase 4: brands segmentadas + tier VIP +
-- Stripe Connect + chargeback reserve + anti-fraude reforzado.
-- Idempotente. Compatible con migraciones 001-004.
-- ============================================================

-- 1. Brands maestras del programa
CREATE TABLE IF NOT EXISTS aff_brands (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     text NOT NULL,
  slug          text NOT NULL,
  name          text NOT NULL,
  domain        text,
  description   text,
  active        boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

ALTER TABLE aff_brands ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='aff_brands' AND policyname='service_role_all') THEN
    CREATE POLICY service_role_all ON aff_brands FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Catálogo de productos por brand (importes fijos €)
CREATE TABLE IF NOT EXISTS aff_brand_products (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id                        uuid NOT NULL REFERENCES aff_brands(id) ON DELETE CASCADE,
  product_key                     text NOT NULL,
  product_name                    text NOT NULL,
  price_cents                     int NOT NULL,
  is_recurring                    boolean NOT NULL DEFAULT false,
  standard_flat_commission_cents  int NOT NULL,                 -- 1 sola comisión primer pago
  vip_first_flat_commission_cents int NOT NULL DEFAULT 0,
  vip_recurring_flat_cents        int NOT NULL DEFAULT 0,        -- € por cada cobro recurrente VIP
  vip_recurring_months            int NOT NULL DEFAULT 0,        -- 0 = solo primer pago
  active                          boolean NOT NULL DEFAULT true,
  display_order                   int NOT NULL DEFAULT 0,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, product_key)
);

ALTER TABLE aff_brand_products ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='aff_brand_products' AND policyname='service_role_all') THEN
    CREATE POLICY service_role_all ON aff_brand_products FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Tier + brand asignada al afiliado
ALTER TABLE aff_affiliates
  ADD COLUMN IF NOT EXISTS tier             text NOT NULL DEFAULT 'standard'
    CHECK (tier IN ('standard','vip','partner')),
  ADD COLUMN IF NOT EXISTS brand_id         uuid REFERENCES aff_brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS extra_brand_ids  uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS chargeback_count int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_aff_affiliates_brand
  ON aff_affiliates (tenant_id, brand_id, status);
CREATE INDEX IF NOT EXISTS idx_aff_affiliates_tier
  ON aff_affiliates (tenant_id, tier, status);

-- 4. Brand stamping en visits / referrals / commissions (para reporting + RLS futura)
ALTER TABLE aff_visits      ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES aff_brands(id);
ALTER TABLE aff_referrals   ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES aff_brands(id);
ALTER TABLE aff_referrals   ADD COLUMN IF NOT EXISTS product_key text;
ALTER TABLE aff_commissions ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES aff_brands(id);
ALTER TABLE aff_commissions ADD COLUMN IF NOT EXISTS product_key text;
ALTER TABLE aff_commissions ADD COLUMN IF NOT EXISTS hold_until timestamptz;  -- 60d clawback reserve

-- 5. Brand en cada asset de contenido + filtrar por brand
ALTER TABLE aff_content_assets
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES aff_brands(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_aff_content_brand
  ON aff_content_assets (tenant_id, brand_id, type, active) WHERE active = true;

-- 6. Stripe Connect — onboarding y payouts 1-click
ALTER TABLE aff_affiliates
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_connect_status     text
    CHECK (stripe_connect_status IN ('pending','active','rejected') OR stripe_connect_status IS NULL),
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarded_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_aff_affiliates_stripe_acct
  ON aff_affiliates (stripe_connect_account_id) WHERE stripe_connect_account_id IS NOT NULL;

ALTER TABLE aff_commissions
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
  ADD COLUMN IF NOT EXISTS stripe_transfer_failed_reason text;

-- ============================================================
-- SEED INICIAL: brands + brand_products
-- ============================================================
INSERT INTO aff_brands (tenant_id, slug, name, domain, description, display_order) VALUES
  ('pacame','pacame','PACAME Agencia','pacameagencia.com','Agencia digital: web, SEO, redes, ads, branding',1),
  ('pacame','saas','SaaS Pablo','pacameagencia.com','Productos propios: PacameGPT, Asesor Pro, PromptForge',2),
  ('pacame','darkroom','Dark Room','darkroomcreative.cloud','Plataforma premium aislada',3)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Productos PACAME
INSERT INTO aff_brand_products (brand_id, product_key, product_name, price_cents, is_recurring,
  standard_flat_commission_cents, vip_first_flat_commission_cents, vip_recurring_flat_cents, vip_recurring_months, display_order)
SELECT b.id, p.product_key, p.product_name, p.price_cents, p.is_recurring,
  p.std_cents, p.vip_first_cents, p.vip_rec_cents, p.vip_months, p.ord
FROM aff_brands b
CROSS JOIN (VALUES
  ('landing',         'Landing Page',           30000, false, 4500,  4500,    0,  0, 1),
  ('web',             'Web Corporativa',        80000, false, 12000, 12000,   0,  0, 2),
  ('web_premium',     'Web Premium',           150000, false, 20000, 20000,   0,  0, 3),
  ('social_monthly',  'Plan Redes Sociales',    19700, true,  3000,  3000,  2000, 6, 4),
  ('seo_monthly',     'Plan SEO',               29700, true,  4500,  4500,  3000, 6, 5),
  ('pack_web_social', 'Pack Web + Redes',       80000, true,  12000, 14500, 2000, 6, 6)
) AS p(product_key, product_name, price_cents, is_recurring, std_cents, vip_first_cents, vip_rec_cents, vip_months, ord)
WHERE b.slug = 'pacame' AND b.tenant_id = 'pacame'
ON CONFLICT (brand_id, product_key) DO NOTHING;

-- Productos SaaS
INSERT INTO aff_brand_products (brand_id, product_key, product_name, price_cents, is_recurring,
  standard_flat_commission_cents, vip_first_flat_commission_cents, vip_recurring_flat_cents, vip_recurring_months, display_order)
SELECT b.id, p.product_key, p.product_name, p.price_cents, p.is_recurring,
  p.std_cents, p.vip_first_cents, p.vip_rec_cents, p.vip_months, p.ord
FROM aff_brands b
CROSS JOIN (VALUES
  ('pacame_gpt_pro', 'PacameGPT Pro',  1900, true, 600, 600,  400, 12, 1),
  ('asesor_pro',     'Asesor Pro',     4900, true, 1500, 1500, 1000, 12, 2),
  ('promptforge',    'PromptForge',    2900, true, 900, 900,  600, 12, 3)
) AS p(product_key, product_name, price_cents, is_recurring, std_cents, vip_first_cents, vip_rec_cents, vip_months, ord)
WHERE b.slug = 'saas' AND b.tenant_id = 'pacame'
ON CONFLICT (brand_id, product_key) DO NOTHING;

-- Productos Dark Room
INSERT INTO aff_brand_products (brand_id, product_key, product_name, price_cents, is_recurring,
  standard_flat_commission_cents, vip_first_flat_commission_cents, vip_recurring_flat_cents, vip_recurring_months, display_order)
SELECT b.id, p.product_key, p.product_name, p.price_cents, p.is_recurring,
  p.std_cents, p.vip_first_cents, p.vip_rec_cents, p.vip_months, p.ord
FROM aff_brands b
CROSS JOIN (VALUES
  ('darkroom_premium', 'Dark Room Premium', 2499, true, 500, 500, 500, 6, 1)
) AS p(product_key, product_name, price_cents, is_recurring, std_cents, vip_first_cents, vip_rec_cents, vip_months, ord)
WHERE b.slug = 'darkroom' AND b.tenant_id = 'pacame'
ON CONFLICT (brand_id, product_key) DO NOTHING;

-- Asignar afiliados existentes y assets a brand PACAME por defecto
UPDATE aff_affiliates SET brand_id = (SELECT id FROM aff_brands WHERE tenant_id='pacame' AND slug='pacame')
  WHERE tenant_id = 'pacame' AND brand_id IS NULL;
UPDATE aff_content_assets SET brand_id = (SELECT id FROM aff_brands WHERE tenant_id='pacame' AND slug='pacame')
  WHERE tenant_id = 'pacame' AND brand_id IS NULL;
