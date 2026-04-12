-- ============================================================
-- PACAME: Sistema de Referidos y Comerciales
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

-- REFERIDOS
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_client_id UUID REFERENCES clients(id),
  referral_code TEXT UNIQUE NOT NULL,
  referred_lead_id UUID REFERENCES leads(id),
  referred_client_id UUID REFERENCES clients(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired')),
  discount_applied_referrer BOOLEAN DEFAULT false,
  discount_applied_referred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_client_id);

-- COMERCIALES / PARTNERS
CREATE TABLE IF NOT EXISTS commercials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  type TEXT DEFAULT 'casual' CHECK (type IN ('casual', 'frequent', 'freelance', 'partner', 'ambassador')),
  tier TEXT DEFAULT 'bronce' CHECK (tier IN ('bronce', 'plata', 'oro')),
  partner_code TEXT UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earned NUMERIC(10,2) DEFAULT 0,
  commission_first_pct NUMERIC(4,2) DEFAULT 15,
  commission_recurring_pct NUMERIC(4,2) DEFAULT 10,
  commission_months INTEGER DEFAULT 6,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commercials_code ON commercials(partner_code);
CREATE INDEX IF NOT EXISTS idx_commercials_status ON commercials(status);

-- COMISIONES
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercial_id UUID REFERENCES commercials(id),
  referral_id UUID REFERENCES referrals(id),
  client_id UUID REFERENCES clients(id),
  amount NUMERIC(10,2) NOT NULL,
  type TEXT DEFAULT 'first_payment' CHECK (type IN ('first_payment', 'recurring')),
  month_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commissions_commercial ON commissions(commercial_id, status);

-- PROPUESTAS COMERCIALES
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  lead_id UUID REFERENCES leads(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  services JSONB DEFAULT '[]',
  value_onetime NUMERIC(10,2) DEFAULT 0,
  value_monthly NUMERIC(10,2) DEFAULT 0,
  timeline TEXT DEFAULT '',
  deliverables JSONB DEFAULT '[]',
  guarantee TEXT DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  pdf_url TEXT DEFAULT '',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_lead ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

-- RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercials ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to referrals" ON referrals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to commercials" ON commercials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to commissions" ON commissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to proposals" ON proposals FOR ALL USING (true) WITH CHECK (true);
