-- Migration 021: Motor de captacion autonoma
-- Cron diario scrapea nicho rotativo, enriquece leads con email, envia cold email personalizado,
-- hace followup dia 3 y 7. Todo con tracking + unsubscribe + audit.
-- Aplicada via Supabase MCP apply_migration.

-- ═════ OUTREACH CAMPAIGNS ═════
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  niche_slug TEXT NOT NULL,
  niche_label TEXT NOT NULL,
  location TEXT,
  source TEXT NOT NULL DEFAULT 'apify_google_maps',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','scraping','enriching','sending','completed','failed','canceled')),
  target_product_slugs TEXT[] DEFAULT '{}',
  target_count INTEGER DEFAULT 5,
  scraped_count INTEGER DEFAULT 0,
  enriched_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  dry_run BOOLEAN DEFAULT TRUE,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_niche ON outreach_campaigns(niche_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_status ON outreach_campaigns(status, scheduled_for);

-- ═════ OUTREACH LEADS ═════
CREATE TABLE IF NOT EXISTS outreach_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE SET NULL,
  niche_slug TEXT NOT NULL,
  business_name TEXT NOT NULL,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  google_place_id TEXT UNIQUE,
  rating NUMERIC(2,1),
  review_count INTEGER,
  sector TEXT,
  size_hint TEXT,
  signals JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN (
    'discovered','enriched','emailed','bounced','replied','interested','converted','unsubscribed','blacklisted'
  )),
  unsubscribed_at TIMESTAMPTZ,
  converted_order_id UUID REFERENCES orders(id),
  converted_at TIMESTAMPTZ,
  notes TEXT,
  last_touched_at TIMESTAMPTZ,
  touch_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_leads_place ON outreach_leads(google_place_id) WHERE google_place_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_leads_email ON outreach_leads(lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_leads_campaign ON outreach_leads(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_outreach_leads_status ON outreach_leads(status, last_touched_at);
CREATE INDEX IF NOT EXISTS idx_outreach_leads_niche ON outreach_leads(niche_slug, status);

-- ═════ OUTREACH TOUCHES ═════
CREATE TABLE IF NOT EXISTS outreach_touches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES outreach_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES outreach_campaigns(id),
  touch_number INTEGER NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp','voice','linkedin','sms')),
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound','inbound')),
  subject TEXT,
  body TEXT,
  resend_email_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  reply_text TEXT,
  reply_sentiment TEXT,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_outreach_touches_lead ON outreach_touches(lead_id, touch_number);
CREATE INDEX IF NOT EXISTS idx_outreach_touches_campaign ON outreach_touches(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_touches_resend ON outreach_touches(resend_email_id) WHERE resend_email_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_touches_needs_followup ON outreach_touches(sent_at, replied_at) WHERE replied_at IS NULL;

-- ═════ OUTREACH UNSUBSCRIBES ═════
CREATE TABLE IF NOT EXISTS outreach_unsubscribes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_hash TEXT UNIQUE NOT NULL,
  email_plain TEXT,
  reason TEXT,
  source_touch_id UUID REFERENCES outreach_touches(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_outreach_unsubscribes_hash ON outreach_unsubscribes(email_hash);

-- ═════ TRIGGERS ═════
CREATE OR REPLACE FUNCTION update_outreach_leads_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at := NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS outreach_leads_updated_at ON outreach_leads;
CREATE TRIGGER outreach_leads_updated_at BEFORE UPDATE ON outreach_leads
FOR EACH ROW EXECUTE FUNCTION update_outreach_leads_updated_at();

CREATE OR REPLACE FUNCTION outreach_touch_sync_lead()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.direction = 'outbound' THEN
    UPDATE outreach_leads
    SET touch_count = touch_count + 1,
        last_touched_at = COALESCE(NEW.sent_at, NOW()),
        status = CASE WHEN status IN ('discovered','enriched') THEN 'emailed' ELSE status END
    WHERE id = NEW.lead_id;
  ELSIF NEW.direction = 'inbound' THEN
    UPDATE outreach_leads
    SET status = CASE
      WHEN NEW.reply_sentiment = 'negative' THEN 'unsubscribed'
      WHEN NEW.reply_sentiment = 'positive' THEN 'interested'
      ELSE 'replied'
    END, last_touched_at = NOW() WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS outreach_touches_sync ON outreach_touches;
CREATE TRIGGER outreach_touches_sync AFTER INSERT ON outreach_touches
FOR EACH ROW EXECUTE FUNCTION outreach_touch_sync_lead();

-- ═════ RLS ═════
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_touches ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_unsubscribes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "outreach_campaigns_service_all" ON outreach_campaigns;
CREATE POLICY "outreach_campaigns_service_all" ON outreach_campaigns FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "outreach_leads_service_all" ON outreach_leads;
CREATE POLICY "outreach_leads_service_all" ON outreach_leads FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "outreach_touches_service_all" ON outreach_touches;
CREATE POLICY "outreach_touches_service_all" ON outreach_touches FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "outreach_unsubs_service_all" ON outreach_unsubscribes;
CREATE POLICY "outreach_unsubs_service_all" ON outreach_unsubscribes FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

COMMENT ON TABLE outreach_campaigns IS 'Campaigns diarias de captacion por nicho.';
COMMENT ON TABLE outreach_leads IS 'Leads descubiertos. Dedupe por google_place_id/email.';
COMMENT ON TABLE outreach_touches IS 'Historial completo de contactos por lead.';
COMMENT ON TABLE outreach_unsubscribes IS 'Lista global unsubscribe. Hash email obligatorio GDPR.';
