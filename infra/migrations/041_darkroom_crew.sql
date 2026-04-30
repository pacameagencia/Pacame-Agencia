-- 041_darkroom_crew.sql
-- DarkRoom Crew · sistema afiliados 6 tiers escalonados
--
-- Re-crea darkroom_affiliates + darkroom_referrals (dropeadas en 030 por
-- supuesto erróneo de que el sistema PACAME aff_* las cubría — no existe).
-- Añade darkroom_payouts. Restaura FK desde darkroom_leads.affiliate_code.
--
-- Spec canónica: strategy/darkroom/programa-afiliados.md v2.0
-- 6 tiers: init/active/pro/director/producer/top
-- One-time 5/6/7/8/9/10€ + recurring 1/2/3/4/5/5€ TOPE
-- Payout día 5 mín 50€. Cookie dr_ref 30d. Pending 30d antes de pagar one-time.

-- ─── Afiliados ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS darkroom_affiliates (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid,
  code                        text UNIQUE NOT NULL,
  name                        text NOT NULL,
  email                       text NOT NULL UNIQUE,
  phone                       text,
  payout_method               text NOT NULL CHECK (payout_method IN ('paypal','sepa','manual')),
  payout_email                text,
  sepa_iban                   text,
  status                      text NOT NULL DEFAULT 'pending_verification'
                              CHECK (status IN ('pending_verification','active','paused','banned')),
  tier_current                text NOT NULL DEFAULT 'init'
                              CHECK (tier_current IN ('init','active','pro','director','producer','top')),
  refs_active_count           int NOT NULL DEFAULT 0,
  total_one_time_paid_cents   bigint NOT NULL DEFAULT 0,
  total_recurring_paid_cents  bigint NOT NULL DEFAULT 0,
  pending_balance_cents       bigint NOT NULL DEFAULT 0,
  last_tier_change_at         timestamptz,
  source_utm                  text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dr_aff_code   ON darkroom_affiliates(code);
CREATE INDEX IF NOT EXISTS idx_dr_aff_status ON darkroom_affiliates(status);
CREATE INDEX IF NOT EXISTS idx_dr_aff_tier   ON darkroom_affiliates(tier_current);
ALTER TABLE darkroom_affiliates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dr_aff_deny_all ON darkroom_affiliates;
CREATE POLICY dr_aff_deny_all ON darkroom_affiliates FOR ALL USING (false);

-- ─── Referrals ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS darkroom_referrals (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code           text NOT NULL REFERENCES darkroom_affiliates(code) ON DELETE RESTRICT,
  referred_email           text NOT NULL,
  referred_user_id         uuid,
  stripe_subscription_id   text UNIQUE,
  stripe_customer_id       text,
  plan                     text NOT NULL CHECK (plan IN ('pro','lifetime')),
  started_at               timestamptz NOT NULL,
  last_paid_at             timestamptz,
  status                   text NOT NULL DEFAULT 'pending_30d'
                           CHECK (status IN ('pending_30d','active','churned','refunded')),
  one_time_paid            boolean NOT NULL DEFAULT false,
  one_time_paid_at         timestamptz,
  one_time_amount_cents    int NOT NULL DEFAULT 0,
  recurring_months_paid    int NOT NULL DEFAULT 0,
  total_commission_cents   bigint NOT NULL DEFAULT 0,
  refunded_at              timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dr_ref_aff       ON darkroom_referrals(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_dr_ref_status    ON darkroom_referrals(status);
CREATE INDEX IF NOT EXISTS idx_dr_ref_started   ON darkroom_referrals(started_at);
CREATE INDEX IF NOT EXISTS idx_dr_ref_pending30 ON darkroom_referrals(status, started_at) WHERE status='pending_30d';
ALTER TABLE darkroom_referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dr_ref_deny_all ON darkroom_referrals;
CREATE POLICY dr_ref_deny_all ON darkroom_referrals FOR ALL USING (false);

-- ─── Payouts ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS darkroom_payouts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code  text NOT NULL REFERENCES darkroom_affiliates(code) ON DELETE RESTRICT,
  period          text NOT NULL,                                -- 'YYYY-MM'
  one_time_cents  bigint NOT NULL DEFAULT 0,
  recurring_cents bigint NOT NULL DEFAULT 0,
  total_cents     bigint NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','paid','skipped_under_min')),
  paid_at         timestamptz,
  paid_method     text,
  paid_reference  text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(affiliate_code, period)
);
CREATE INDEX IF NOT EXISTS idx_dr_payouts_period ON darkroom_payouts(period);
CREATE INDEX IF NOT EXISTS idx_dr_payouts_status ON darkroom_payouts(status);
ALTER TABLE darkroom_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dr_payouts_deny_all ON darkroom_payouts;
CREATE POLICY dr_payouts_deny_all ON darkroom_payouts FOR ALL USING (false);

-- ─── Restore FK on darkroom_leads.affiliate_code ──────────────
-- (la migración 030 dropeó darkroom_affiliates con CASCADE → la FK quedó rota)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'darkroom_leads_affiliate_code_fkey'
      AND table_name = 'darkroom_leads'
  ) THEN
    ALTER TABLE darkroom_leads
      ADD CONSTRAINT darkroom_leads_affiliate_code_fkey
      FOREIGN KEY (affiliate_code) REFERENCES darkroom_affiliates(code) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── Comments ────────────────────────────────────────────────

COMMENT ON TABLE darkroom_affiliates IS
  'Dark Room Crew · 6 tiers escalonados (init/active/pro/director/producer/top). refs_active_count cache. Retroactividad mensual al recurring; one_time snapshot al rate del momento del referral.';
COMMENT ON TABLE darkroom_referrals IS
  'Referidos atribuidos por cookie dr_ref + Stripe metadata. pending_30d → active al día 30 sin refund. one_time_amount_cents queda snapshot del tier vigente.';
COMMENT ON TABLE darkroom_payouts IS
  'Payouts mensuales día 5. Mín 50€ acumulado. Pago manual mes 1 (PayPal/SEPA). UNIQUE(affiliate_code, period) evita doble.';
