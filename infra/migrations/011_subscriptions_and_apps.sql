-- Migration 011: Subscriptions + Apps productizadas
-- Motor MRR de la startup. Planes mensuales + apps instalables.
-- Aplicada via Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('start','pro','growth','scale','custom')),
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  price_monthly_cents INTEGER NOT NULL,
  price_yearly_cents INTEGER,
  currency TEXT DEFAULT 'eur',
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  quotas JSONB DEFAULT '{}'::jsonb,
  included_services JSONB DEFAULT '[]',
  included_apps JSONB DEFAULT '[]',
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_tier ON subscription_plans(tier);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_number TEXT UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'trialing','active','past_due','canceled','paused','incomplete'
  )),
  billing_interval TEXT DEFAULT 'month' CHECK (billing_interval IN ('month','year')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  amount_cents INTEGER,
  quota_usage JSONB DEFAULT '{}'::jsonb,
  quota_reset_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_client ON subscriptions(client_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end) WHERE status = 'active';

CREATE SEQUENCE IF NOT EXISTS subscriptions_number_seq START 1001;
CREATE OR REPLACE FUNCTION generate_subscription_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_number IS NULL THEN
    NEW.subscription_number := 'SUB-' || to_char(NOW(),'YYYY') || '-' || lpad(nextval('subscriptions_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_number_trigger ON subscriptions;
CREATE TRIGGER subscriptions_number_trigger
BEFORE INSERT ON subscriptions
FOR EACH ROW EXECUTE FUNCTION generate_subscription_number();

CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscriptions_updated_at_trigger ON subscriptions;
CREATE TRIGGER subscriptions_updated_at_trigger
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE TABLE IF NOT EXISTS apps_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  icon_url TEXT,
  cover_image_url TEXT,
  price_monthly_cents INTEGER NOT NULL,
  price_yearly_cents INTEGER,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  integrations JSONB DEFAULT '[]',
  config_schema JSONB DEFAULT '{}'::jsonb,
  provider_id UUID REFERENCES providers(id),
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apps_catalog_active ON apps_catalog(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_apps_catalog_category ON apps_catalog(category, is_active);

CREATE TABLE IF NOT EXISTS app_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_number TEXT UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES apps_catalog(id),
  app_slug TEXT NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('provisioning','active','paused','canceled','error')),
  config JSONB DEFAULT '{}'::jsonb,
  secrets JSONB DEFAULT '{}'::jsonb,
  usage JSONB DEFAULT '{}'::jsonb,
  last_activity_at TIMESTAMPTZ,
  provisioned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_instances_client ON app_instances(client_id, status);
CREATE INDEX IF NOT EXISTS idx_app_instances_app ON app_instances(app_id, status);
CREATE INDEX IF NOT EXISTS idx_app_instances_subscription ON app_instances(subscription_id);

CREATE SEQUENCE IF NOT EXISTS app_instances_number_seq START 1001;
CREATE OR REPLACE FUNCTION generate_instance_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.instance_number IS NULL THEN
    NEW.instance_number := upper(substring(NEW.app_slug,1,3)) || '-' || lpad(nextval('app_instances_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_instances_number_trigger ON app_instances;
CREATE TRIGGER app_instances_number_trigger
BEFORE INSERT ON app_instances
FOR EACH ROW EXECUTE FUNCTION generate_instance_number();

CREATE TABLE IF NOT EXISTS app_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES app_instances(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  contact_phone TEXT,
  contact_email TEXT,
  contact_name TEXT,
  message_text TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  intent TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive','neutral','negative')),
  handled_by TEXT,
  external_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_messages_instance ON app_messages(instance_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_messages_contact ON app_messages(instance_id, contact_phone, created_at DESC);

CREATE TABLE IF NOT EXISTS app_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES app_instances(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  source TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','qualified','in_conversation','converted','lost')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  last_interaction_at TIMESTAMPTZ,
  converted_value_cents INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_leads_instance ON app_leads(instance_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_leads_phone_unique ON app_leads(instance_id, phone) WHERE phone IS NOT NULL;

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_public_read" ON subscription_plans;
CREATE POLICY "plans_public_read" ON subscription_plans FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "plans_service_all" ON subscription_plans;
CREATE POLICY "plans_service_all" ON subscription_plans FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "subs_service_all" ON subscriptions;
CREATE POLICY "subs_service_all" ON subscriptions FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "subs_realtime_read" ON subscriptions;
CREATE POLICY "subs_realtime_read" ON subscriptions FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "apps_catalog_public_read" ON apps_catalog;
CREATE POLICY "apps_catalog_public_read" ON apps_catalog FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "apps_catalog_service_all" ON apps_catalog;
CREATE POLICY "apps_catalog_service_all" ON apps_catalog FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "app_instances_service_all" ON app_instances;
CREATE POLICY "app_instances_service_all" ON app_instances FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "app_instances_realtime_read" ON app_instances;
CREATE POLICY "app_instances_realtime_read" ON app_instances FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "app_messages_service_all" ON app_messages;
CREATE POLICY "app_messages_service_all" ON app_messages FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "app_leads_service_all" ON app_leads;
CREATE POLICY "app_leads_service_all" ON app_leads FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

COMMENT ON TABLE subscription_plans IS 'Catalogo de planes mensuales. Motor MRR de PACAME.';
COMMENT ON TABLE subscriptions IS 'Suscripciones activas de clientes a planes.';
COMMENT ON TABLE apps_catalog IS 'Apps/SaaS productizados (PACAME Contact, mini-CRM, etc.)';
COMMENT ON TABLE app_instances IS 'Instancias instaladas por cliente. Una por cliente+app.';
COMMENT ON TABLE app_messages IS 'Mensajes gestionados por apps (ej. WhatsApp bot).';
COMMENT ON TABLE app_leads IS 'CRM mini por app instance.';
