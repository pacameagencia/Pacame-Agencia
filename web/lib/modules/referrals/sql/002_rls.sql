-- ============================================================
-- RLS for affiliate module — service_role full access by default.
-- Apps with end-user JWT (Supabase Auth) can extend later.
-- ============================================================

ALTER TABLE aff_campaigns    ENABLE ROW LEVEL SECURITY;
ALTER TABLE aff_affiliates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE aff_visits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE aff_referrals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE aff_commissions  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aff_campaigns' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON aff_campaigns FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aff_affiliates' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON aff_affiliates FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aff_visits' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON aff_visits FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aff_referrals' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON aff_referrals FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aff_commissions' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON aff_commissions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END$$;
