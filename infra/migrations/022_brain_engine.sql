-- Migration 022: El cerebro — strategic autonomy + multi-canal + experiments
-- Aplicada via Supabase MCP apply_migration.

CREATE TABLE IF NOT EXISTS agent_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  proposal_type TEXT NOT NULL CHECK (proposal_type IN (
    'new_niche','new_channel_tactic','copy_variant','product_idea','pricing_change',
    'channel_saturation','outreach_time','lead_scoring','automation_idea','content_idea','other'
  )),
  title TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  action_config JSONB DEFAULT '{}'::jsonb,
  expected_impact TEXT,
  confidence NUMERIC(3,2) DEFAULT 0.5,
  effort_estimate TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','approved','auto_approved','executing','executed','rejected','expired'
  )),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  execution_started_at TIMESTAMPTZ,
  execution_completed_at TIMESTAMPTZ,
  execution_result JSONB,
  linked_experiment_id UUID,
  priority INTEGER DEFAULT 50,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_proposals_status ON agent_proposals(status, priority DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_proposals_agent ON agent_proposals(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_proposals_type ON agent_proposals(proposal_type, status);

CREATE TABLE IF NOT EXISTS growth_experiments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES agent_proposals(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'channel','copy','pricing','timing','niche','product','lead_scoring','other'
  )),
  hypothesis TEXT NOT NULL,
  variant_a JSONB NOT NULL,
  variant_b JSONB,
  traffic_split_a INTEGER DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN (
    'running','paused','completed','inconclusive','canceled'
  )),
  primary_metric TEXT NOT NULL,
  target_sample_size INTEGER,
  current_sample_a INTEGER DEFAULT 0,
  current_sample_b INTEGER DEFAULT 0,
  metric_a NUMERIC(6,4),
  metric_b NUMERIC(6,4),
  p_value NUMERIC(6,4),
  winner TEXT CHECK (winner IN ('a','b','tie','inconclusive')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_growth_experiments_status ON growth_experiments(status, started_at);
CREATE INDEX IF NOT EXISTS idx_growth_experiments_category ON growth_experiments(category, status);

ALTER TABLE agent_proposals ADD CONSTRAINT fk_proposal_experiment
  FOREIGN KEY (linked_experiment_id) REFERENCES growth_experiments(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS channel_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  niche_slug TEXT NOT NULL,
  channel TEXT NOT NULL,
  touch_number INTEGER NOT NULL DEFAULT 1,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,4) DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (niche_slug, channel, touch_number)
);
CREATE INDEX IF NOT EXISTS idx_channel_stats_niche ON channel_stats(niche_slug, channel);

CREATE TABLE IF NOT EXISTS lead_channel_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES outreach_leads(id) ON DELETE CASCADE,
  email TEXT,
  whatsapp_phone TEXT,
  linkedin_url TEXT,
  instagram_handle TEXT,
  preferred_channel TEXT,
  preference_confidence NUMERIC(3,2),
  last_enriched_at TIMESTAMPTZ DEFAULT NOW(),
  enrichment_sources TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_channels_lead ON lead_channel_preferences(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_channels_email ON lead_channel_preferences(lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_channels_linkedin ON lead_channel_preferences(linkedin_url) WHERE linkedin_url IS NOT NULL;

CREATE TABLE IF NOT EXISTS linkedin_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES outreach_leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES outreach_campaigns(id),
  linkedin_url TEXT NOT NULL,
  target_name TEXT,
  target_role TEXT,
  target_company TEXT,
  message_type TEXT NOT NULL DEFAULT 'connection_request' CHECK (message_type IN (
    'connection_request','direct_message','inmail','comment'
  )),
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','sent','accepted','replied','rejected','expired','skipped'
  )),
  generated_by TEXT NOT NULL DEFAULT 'copy',
  sent_at TIMESTAMPTZ,
  sent_by TEXT,
  response TEXT,
  responded_at TIMESTAMPTZ,
  priority INTEGER DEFAULT 50,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_linkedin_queue_status ON linkedin_queue(status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_linkedin_queue_lead ON linkedin_queue(lead_id);

CREATE TABLE IF NOT EXISTS brain_daily_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_date DATE NOT NULL UNIQUE,
  generated_by TEXT NOT NULL DEFAULT 'dios',
  summary TEXT,
  focus_niches TEXT[] DEFAULT '{}',
  focus_channels TEXT[] DEFAULT '{}',
  experiments_to_run UUID[] DEFAULT '{}',
  new_proposals UUID[] DEFAULT '{}',
  kpi_targets JSONB DEFAULT '{}'::jsonb,
  kpi_actual JSONB DEFAULT '{}'::jsonb,
  model_used TEXT,
  cost_usd NUMERIC(10,4) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','failed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_brain_plans_date ON brain_daily_plans(plan_date DESC);

-- Trigger: auto-update channel_stats from outreach_touches
CREATE OR REPLACE FUNCTION update_channel_stats_from_touch()
RETURNS TRIGGER AS $$
DECLARE v_niche TEXT;
BEGIN
  SELECT niche_slug INTO v_niche FROM outreach_leads WHERE id = NEW.lead_id;
  IF v_niche IS NULL THEN RETURN NEW; END IF;
  IF NEW.direction = 'outbound' AND NEW.sent_at IS NOT NULL THEN
    INSERT INTO channel_stats (niche_slug, channel, touch_number, sent_count)
    VALUES (v_niche, NEW.channel, NEW.touch_number, 1)
    ON CONFLICT (niche_slug, channel, touch_number)
    DO UPDATE SET sent_count = channel_stats.sent_count + 1, last_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS outreach_touches_channel_stats ON outreach_touches;
CREATE TRIGGER outreach_touches_channel_stats AFTER INSERT ON outreach_touches
FOR EACH ROW EXECUTE FUNCTION update_channel_stats_from_touch();

-- RLS
ALTER TABLE agent_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_channel_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_daily_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_proposals_service_all" ON agent_proposals;
CREATE POLICY "agent_proposals_service_all" ON agent_proposals FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "growth_experiments_service_all" ON growth_experiments;
CREATE POLICY "growth_experiments_service_all" ON growth_experiments FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "channel_stats_service_all" ON channel_stats;
CREATE POLICY "channel_stats_service_all" ON channel_stats FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "lead_channels_service_all" ON lead_channel_preferences;
CREATE POLICY "lead_channels_service_all" ON lead_channel_preferences FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "linkedin_queue_service_all" ON linkedin_queue;
CREATE POLICY "linkedin_queue_service_all" ON linkedin_queue FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "brain_plans_service_all" ON brain_daily_plans;
CREATE POLICY "brain_plans_service_all" ON brain_daily_plans FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
