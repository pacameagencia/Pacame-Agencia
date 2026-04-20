-- ============================================================
-- Migration 029: LLM usage tracking
-- Tabla llm_calls con call_site, tier, model, tokens, cost, latency.
-- Views v_llm_daily_spend + v_llm_today_by_tier para dashboard.
-- Aplicada via Supabase MCP.
-- ============================================================

CREATE TABLE IF NOT EXISTS llm_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_site TEXT NOT NULL,          -- "outreach/cold_email", "strategist/daily_plan"
  tier TEXT NOT NULL,               -- "reasoning" / "titan" / "premium" / "standard" / "economy"
  strategy TEXT,                    -- "quality-first" / "cost-first"
  provider TEXT,                    -- "claude" / "nebius" / "gemma"
  model TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  tokens_thinking INTEGER DEFAULT 0, -- extended thinking tokens (solo reasoning)
  cost_usd NUMERIC(10,6) DEFAULT 0,
  latency_ms INTEGER,
  fallback_used BOOLEAN DEFAULT FALSE,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  request_id TEXT,
  actor_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_calls_site_date ON llm_calls(call_site, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_calls_tier_date ON llm_calls(tier, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_calls_created_at ON llm_calls(created_at DESC);

-- View: spend diario 30d (tier x provider x model)
CREATE OR REPLACE VIEW v_llm_daily_spend AS
SELECT DATE(created_at) AS day, tier, provider, model,
  COUNT(*) AS calls,
  SUM(cost_usd) AS cost_usd,
  SUM(tokens_in) AS tokens_in,
  SUM(tokens_out) AS tokens_out,
  SUM(tokens_thinking) AS tokens_thinking,
  ROUND(AVG(latency_ms)) AS avg_latency_ms,
  ROUND(
    CASE WHEN COUNT(*) = 0 THEN 0
    ELSE SUM(CASE WHEN fallback_used THEN 1 ELSE 0 END)::numeric * 100 / COUNT(*)
    END, 1
  ) AS fallback_pct
FROM llm_calls
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY 1,2,3,4
ORDER BY 1 DESC, cost_usd DESC;

-- View: spend hoy agregado por tier (usado por budget-guard)
CREATE OR REPLACE VIEW v_llm_today_by_tier AS
SELECT tier,
  COUNT(*) AS calls,
  SUM(cost_usd) AS cost_usd,
  SUM(tokens_in + tokens_out + COALESCE(tokens_thinking, 0)) AS total_tokens,
  ROUND(AVG(latency_ms)) AS avg_latency_ms,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) AS errors,
  SUM(CASE WHEN fallback_used THEN 1 ELSE 0 END) AS fallbacks
FROM llm_calls
WHERE created_at >= DATE_TRUNC('day', NOW())
GROUP BY tier;

-- RLS: service role only (dashboard lo consume via server-side)
ALTER TABLE llm_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_llm_calls" ON llm_calls
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
