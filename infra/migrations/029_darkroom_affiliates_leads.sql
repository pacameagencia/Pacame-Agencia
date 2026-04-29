-- 029_darkroom_affiliates_leads.sql
-- Dark Room mes 1: tablas para programa afiliados (Crew) + lead magnet captura.
--
-- Mecánica afiliados (decisión Pablo 2026-04-29):
--   · 5€ one-time cuando referido pasa día 30 sin refund
--   · 1€/mes recurrente mientras referido siga activo
--   · Cookie tracking 30 días
--   · Payout mensual día 5 vía Stripe Connect (mín 30€ acumulado)
--
-- Lead magnet "Stack del Creator 2026":
--   · POST /api/darkroom/lead → INSERT en darkroom_leads
--   · Cron diario lee status='captured' + current_email_step y dispara emails
--   · Secuencia 5 emails (día 0/2/4/7/14)

-- ─── Afiliados ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS darkroom_affiliates (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid,                          -- nullable: afiliado puede no tener cuenta DR
  code                   text UNIQUE NOT NULL,          -- ej "pablo-creator-3F2A"
  name                   text NOT NULL,
  email                  text NOT NULL,
  stripe_connect_id      text,                          -- acct_xxx para payouts
  status                 text NOT NULL DEFAULT 'active', -- active|paused|banned
  total_referrals        int NOT NULL DEFAULT 0,        -- cache (calc desde darkroom_referrals.status='active')
  total_paid_out_cents   bigint NOT NULL DEFAULT 0,     -- histórico pagado
  pending_balance_cents  bigint NOT NULL DEFAULT 0,     -- por pagar próximo cron payout
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dr_aff_code   ON darkroom_affiliates(code);
CREATE INDEX IF NOT EXISTS idx_dr_aff_email  ON darkroom_affiliates(email);
CREATE INDEX IF NOT EXISTS idx_dr_aff_status ON darkroom_affiliates(status);

ALTER TABLE darkroom_affiliates ENABLE ROW LEVEL SECURITY;

-- ─── Referrals ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS darkroom_referrals (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code           text NOT NULL REFERENCES darkroom_affiliates(code),
  referred_email           text NOT NULL,
  stripe_subscription_id   text,
  stripe_customer_id       text,
  plan                     text NOT NULL,              -- pro|lifetime
  started_at               timestamptz NOT NULL,
  last_paid_at             timestamptz,                -- última cuota cobrada al referido
  one_time_paid            boolean NOT NULL DEFAULT false,
  one_time_paid_at         timestamptz,
  recurring_months_paid    int NOT NULL DEFAULT 0,     -- cuántos €1 ya hemos acreditado al afiliado
  status                   text NOT NULL DEFAULT 'pending_30d',
                                                       -- pending_30d (esperar día 30 sin refund)
                                                       -- active (referido pagando, +1€/mes al afiliado)
                                                       -- churned (referido dejó de pagar)
                                                       -- refunded (anuló <30 días, se descuenta)
  total_commission_cents   bigint NOT NULL DEFAULT 0,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dr_ref_aff      ON darkroom_referrals(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_dr_ref_status   ON darkroom_referrals(status);
CREATE INDEX IF NOT EXISTS idx_dr_ref_email    ON darkroom_referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_dr_ref_started  ON darkroom_referrals(started_at);

ALTER TABLE darkroom_referrals ENABLE ROW LEVEL SECURITY;

-- ─── Lead magnet ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS darkroom_leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL UNIQUE,
  source_utm          text,                            -- ig_bio | story_swipe | reel_dia_3 | reddit_emprender | etc
  affiliate_code      text REFERENCES darkroom_affiliates(code), -- si llegó vía afiliado
  captured_at         timestamptz NOT NULL DEFAULT now(),
  status              text NOT NULL DEFAULT 'captured', -- captured | converted | unsubscribed
  current_email_step  int NOT NULL DEFAULT 0,          -- 0..4 (email_0, email_2, email_4, email_7, email_14)
  last_email_sent_at  timestamptz,
  converted_at        timestamptz,
  converted_to_plan   text,                            -- pro|lifetime cuando convierta
  unsubscribed_at     timestamptz,
  meta                jsonb DEFAULT '{}'::jsonb        -- firstname, source_url, etc
);

CREATE INDEX IF NOT EXISTS idx_dr_leads_status ON darkroom_leads(status);
CREATE INDEX IF NOT EXISTS idx_dr_leads_step   ON darkroom_leads(current_email_step);
CREATE INDEX IF NOT EXISTS idx_dr_leads_aff    ON darkroom_leads(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_dr_leads_capt   ON darkroom_leads(captured_at);

ALTER TABLE darkroom_leads ENABLE ROW LEVEL SECURITY;

-- ─── Comments ──────────────────────────────────────────────────

COMMENT ON TABLE darkroom_affiliates IS
  'Dark Room Crew · afiliados con código único. Mecánica 5€ one-time + 1€/mes recurrente.';
COMMENT ON TABLE darkroom_referrals IS
  'Referidos atribuidos a un afiliado. Status pasa pending_30d → active al día 30 sin refund.';
COMMENT ON TABLE darkroom_leads IS
  'Captura email lead magnet "Stack del Creator 2026". Secuencia 5 emails día 0/2/4/7/14.';
