-- ============================================================
-- PACAME Referrals — Fase 3: programa público de afiliados
-- Habilita signup directo (sin ser cliente PACAME), datos bancarios,
-- moderación opcional. Todo idempotente.
-- ============================================================

ALTER TABLE aff_affiliates ADD COLUMN IF NOT EXISTS password_hash    text;
ALTER TABLE aff_affiliates ADD COLUMN IF NOT EXISTS full_name        text;
ALTER TABLE aff_affiliates ADD COLUMN IF NOT EXISTS phone            text;
ALTER TABLE aff_affiliates ADD COLUMN IF NOT EXISTS country          text DEFAULT 'ES';
ALTER TABLE aff_affiliates ADD COLUMN IF NOT EXISTS tax_id           text;
ALTER TABLE aff_affiliates ADD COLUMN IF NOT EXISTS payout_method    text
  CHECK (payout_method IN ('iban','paypal','bizum','revolut','wise'));
ALTER TABLE aff_affiliates ADD COLUMN IF NOT EXISTS payout_iban      text;
ALTER TABLE aff_affiliates ADD COLUMN IF NOT EXISTS payout_paypal    text;
ALTER TABLE aff_affiliates ADD COLUMN IF NOT EXISTS payout_phone     text;
ALTER TABLE aff_affiliates ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT true;
ALTER TABLE aff_affiliates ADD COLUMN IF NOT EXISTS approved_at      timestamptz;
ALTER TABLE aff_affiliates ADD COLUMN IF NOT EXISTS source           text;     -- where they signed up from
ALTER TABLE aff_affiliates ADD COLUMN IF NOT EXISTS last_login_at    timestamptz;

-- Email único por tenant si tiene password (signup público)
CREATE UNIQUE INDEX IF NOT EXISTS idx_aff_affiliates_email_with_password
  ON aff_affiliates (tenant_id, lower(email))
  WHERE password_hash IS NOT NULL;
