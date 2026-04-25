-- 015_pacame_products_catalog.sql
-- Catálogo de mini-SaaS verticales bajo la marca PACAME (los "micronichos").
-- Cada producto resuelve un dolor específico de un nicho específico, todo
-- bajo el dominio pacameagencia.com y un único Stripe.

CREATE TABLE IF NOT EXISTS pacame_products (
  id text PRIMARY KEY,                                -- 'asesor-pro', 'clase-pro', ...
  name text NOT NULL,                                 -- 'AsesorPro'
  tagline text NOT NULL,                              -- frase corta marketing
  category text,                                      -- 'fiscal', 'fitness', 'inmobiliaria'
  owner_agent text DEFAULT 'sage',                    -- agente PACAME que lo gestiona
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'beta', 'live', 'sunset')),
  pricing jsonb NOT NULL,                             -- [{tier:'solo', price_eur:39, limits:{...}}, ...]
  trial_days integer DEFAULT 14,
  features jsonb DEFAULT '[]'::jsonb,                 -- ['Pipeline', 'Facturación', ...]
  marketing jsonb DEFAULT '{}'::jsonb,                -- {hero_image, og_image, target_persona, ...}
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pacame_products_status ON pacame_products(status);

-- Usuarios de los productos PACAME (asesores, entrenadores, etc.).
-- Diferente de `clients` (que son clientes B2B de la factoría PACAME).
CREATE TABLE IF NOT EXISTS pacame_product_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  role text DEFAULT 'owner',                          -- owner | admin | member | client_of (cliente del asesor)
  parent_user_id uuid REFERENCES pacame_product_users(id) ON DELETE CASCADE,
  -- ↑ si role='client_of', este es el asesor dueño
  password_hash text,
  auth_token text,                                    -- session token (rotado en login)
  auth_token_expires timestamptz,
  last_login_at timestamptz,
  email_verified_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ppu_email ON pacame_product_users(email);
CREATE INDEX IF NOT EXISTS idx_ppu_parent ON pacame_product_users(parent_user_id) WHERE parent_user_id IS NOT NULL;

-- Suscripciones a productos (1 user puede tener varias si paga varios productos).
CREATE TABLE IF NOT EXISTS pacame_product_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES pacame_product_users(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES pacame_products(id),
  tier text NOT NULL,                                 -- 'solo', 'pro', 'despacho'
  status text DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  canceled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_pps_status ON pacame_product_subscriptions(status, current_period_end);
CREATE INDEX IF NOT EXISTS idx_pps_stripe_sub ON pacame_product_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION pacame_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pacame_products_updated ON pacame_products;
CREATE TRIGGER trg_pacame_products_updated BEFORE UPDATE ON pacame_products
  FOR EACH ROW EXECUTE FUNCTION pacame_products_updated_at();

DROP TRIGGER IF EXISTS trg_pps_updated ON pacame_product_subscriptions;
CREATE TRIGGER trg_pps_updated BEFORE UPDATE ON pacame_product_subscriptions
  FOR EACH ROW EXECUTE FUNCTION pacame_products_updated_at();

-- Seed AsesorPro (primer micronicho flagship)
INSERT INTO pacame_products (id, name, tagline, category, owner_agent, status, pricing, trial_days, features, marketing)
VALUES (
  'asesor-pro',
  'AsesorPro',
  'El sistema operativo del asesor fiscal pequeño',
  'fiscal',
  'sage',
  'beta',
  '[
    {"tier":"solo","name":"Asesor Solo","price_eur":39,"interval":"month","limits":{"clients":15,"sii_export":false,"api":false,"asesores":1},"stripe_price_id":null},
    {"tier":"pro","name":"Asesor Pro","price_eur":89,"interval":"month","limits":{"clients":50,"sii_export":true,"api":false,"asesores":1},"stripe_price_id":null,"recommended":true},
    {"tier":"despacho","name":"Despacho","price_eur":199,"interval":"month","limits":{"clients":-1,"sii_export":true,"api":true,"asesores":5},"stripe_price_id":null}
  ]'::jsonb,
  14,
  '[
    "Pipeline tipo Trello con estados (pendiente · revisado · presentado · cerrado)",
    "Panel para que tu cliente facture en 3 clicks (PDF legal español)",
    "OCR automático de tickets y facturas que el cliente sube por foto",
    "Cálculo automático IVA repercutido vs soportado por trimestre",
    "Export SII en formato XML directo a Hacienda (plan Pro)",
    "Alertas: cliente inactivo, trimestre cerca, factura pendiente",
    "Chat asesor ↔ cliente integrado",
    "Numeración correlativa de facturas (norma española)"
  ]'::jsonb,
  '{
    "hero_headline":"Tus clientes facturan. Tú revisas. Hacienda contento.",
    "hero_sub":"Deja de perseguir PDFs por WhatsApp. Tus clientes facturan desde su panel. Tú lo revisas en 30 segundos.",
    "target_persona":"Asesoría fiscal pequeña (1-5 personas) con 10-50 clientes PYME",
    "pain_quote":"Pierdo 30% del día metiendo a mano facturas que mis clientes me mandan por WhatsApp",
    "primary_color":"#283B70",
    "accent_color":"#B54E30",
    "trial_cta":"Empieza gratis 14 días"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  pricing = EXCLUDED.pricing,
  features = EXCLUDED.features,
  marketing = EXCLUDED.marketing,
  status = EXCLUDED.status;

COMMENT ON TABLE pacame_products IS
  'Catálogo de mini-SaaS verticales PACAME (los "micronichos"). Cada row = 1 producto.';
COMMENT ON TABLE pacame_product_users IS
  'Usuarios de los productos PACAME. Soporta jerarquía asesor→clientes vía parent_user_id.';
COMMENT ON COLUMN pacame_product_users.parent_user_id IS
  'Si rol=client_of, este FK apunta al asesor que lo invitó. Sin esto, es un user top-level que paga.';
