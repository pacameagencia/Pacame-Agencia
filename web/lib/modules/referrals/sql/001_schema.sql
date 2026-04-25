-- ============================================================
-- PACAME Referrals Module — Rewardful-style affiliate system
-- Tables prefixed with `aff_` to coexist with legacy `referrals`/`commissions`.
-- Multi-tenant via tenant_id (text). For PACAME use tenant_id='pacame'.
-- ============================================================

CREATE TABLE IF NOT EXISTS aff_campaigns (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                       text NOT NULL,
  name                            text NOT NULL,
  commission_percent              numeric(5,2) NOT NULL DEFAULT 20.00,
  cookie_days                     int NOT NULL DEFAULT 30,
  max_commission_period_months    int NOT NULL DEFAULT 12,         -- 0 = lifetime
  attribution                     text NOT NULL DEFAULT 'last_click'
    CHECK (attribution IN ('last_click','first_click')),
  is_default                      boolean NOT NULL DEFAULT false,
  created_at                      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_aff_campaigns_default
  ON aff_campaigns (tenant_id) WHERE is_default = true;

CREATE TABLE IF NOT EXISTS aff_affiliates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       text NOT NULL,
  user_id         uuid,                                            -- nullable: external affiliates sin cuenta
  email           text NOT NULL,
  referral_code   text NOT NULL,
  campaign_id     uuid REFERENCES aff_campaigns(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','suspicious','disabled')),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_aff_affiliates_code
  ON aff_affiliates (tenant_id, referral_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_aff_affiliates_user
  ON aff_affiliates (tenant_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_aff_affiliates_active
  ON aff_affiliates (tenant_id, referral_code) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS aff_visits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       text NOT NULL,
  affiliate_id    uuid NOT NULL REFERENCES aff_affiliates(id) ON DELETE CASCADE,
  visitor_uuid    uuid NOT NULL,                                   -- valor de la cookie pacame_ref
  ip              inet,
  user_agent      text,
  fingerprint     text,                                            -- sha256(ip+ua+accept-lang)
  landed_path     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_aff_visits_visitor
  ON aff_visits (visitor_uuid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aff_visits_ip
  ON aff_visits (tenant_id, ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aff_visits_affiliate
  ON aff_visits (affiliate_id, created_at DESC);

CREATE TABLE IF NOT EXISTS aff_referrals (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               text NOT NULL,
  affiliate_id            uuid NOT NULL REFERENCES aff_affiliates(id),
  referred_user_id        uuid NOT NULL,                           -- FK al users/clients del tenant
  visit_id                uuid REFERENCES aff_visits(id) ON DELETE SET NULL,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  status                  text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','converted','cancelled')),
  converted_at            timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_aff_referrals_unique_user
  ON aff_referrals (tenant_id, referred_user_id);
CREATE INDEX IF NOT EXISTS idx_aff_referrals_subscription
  ON aff_referrals (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_aff_referrals_affiliate
  ON aff_referrals (affiliate_id, status);

CREATE TABLE IF NOT EXISTS aff_commissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       text NOT NULL,
  referral_id     uuid NOT NULL REFERENCES aff_referrals(id) ON DELETE CASCADE,
  affiliate_id    uuid NOT NULL REFERENCES aff_affiliates(id),
  source_event    text NOT NULL,                                   -- stripe invoice id
  amount_cents    int NOT NULL,
  currency        text NOT NULL DEFAULT 'eur',
  month_index     int NOT NULL DEFAULT 1,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','paid','voided')),
  due_at          timestamptz,
  paid_at         timestamptz,
  voided_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_aff_commissions_idempotent
  ON aff_commissions (tenant_id, source_event);
CREATE INDEX IF NOT EXISTS idx_aff_commissions_status
  ON aff_commissions (tenant_id, affiliate_id, status);

-- Default campaign para PACAME (idempotent)
INSERT INTO aff_campaigns (tenant_id, name, commission_percent, cookie_days, max_commission_period_months, is_default)
VALUES ('pacame', 'PACAME default 20% / 12m', 20.00, 30, 12, true)
ON CONFLICT DO NOTHING;
