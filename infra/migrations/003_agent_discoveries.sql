-- Agent Discoveries Table — Autonomous learnings from PACAME agents
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agent_discoveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trend', 'service_idea', 'technique', 'competitor_insight', 'optimization', 'market_signal', 'content_idea')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT,
  impact TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high', 'critical')),
  actionable BOOLEAN DEFAULT TRUE,
  suggested_action TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'implementing', 'implemented', 'dismissed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_discoveries_status ON agent_discoveries(status);
CREATE INDEX IF NOT EXISTS idx_discoveries_agent ON agent_discoveries(agent_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_type ON agent_discoveries(type);
CREATE INDEX IF NOT EXISTS idx_discoveries_created ON agent_discoveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discoveries_impact ON agent_discoveries(impact);

-- RLS: Allow service role full access (API routes use service role key)
ALTER TABLE agent_discoveries ENABLE ROW LEVEL SECURITY;

-- Allow anon read (for dashboard client-side queries)
CREATE POLICY "Allow anon read discoveries" ON agent_discoveries
  FOR SELECT USING (true);

-- Allow anon insert/update (for agent-logger which uses anon key)
CREATE POLICY "Allow anon write discoveries" ON agent_discoveries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update discoveries" ON agent_discoveries
  FOR UPDATE USING (true);
