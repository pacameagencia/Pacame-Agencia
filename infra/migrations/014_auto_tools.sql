-- =====================================================================
-- 014_auto_tools.sql — Tool-Creation Autónoma PACAME
--
-- Tablas para que los agentes registren gaps de herramientas, generen
-- drafts en sandbox y se auto-promuevan tras N usos exitosos.
--
-- Plan: C:/Users/Pacame24/.claude/plans/tool-creation-aut-noma-nos-centramos-frolicking-liskov.md
-- =====================================================================

-- pgvector ya está habilitado por migraciones previas (red neuronal)

-- ---------------------------------------------------------------------
-- agent_tool_gaps — registro de tools que faltan / drafts / promociones
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_tool_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by_agent TEXT NOT NULL,
  intent TEXT NOT NULL,
  intent_embedding vector(768),
  examples JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','drafting','drafted','probation','promoted','rejected','disabled','draft_failed','corrupted')),
  tool_kind TEXT CHECK (tool_kind IN ('endpoint','skill','script','subagent')),
  tool_name TEXT,
  draft_path TEXT,
  promoted_path TEXT,
  code_hash TEXT,
  usage_count INT NOT NULL DEFAULT 0,
  success_count INT NOT NULL DEFAULT 0,
  failure_count INT NOT NULL DEFAULT 0,
  consecutive_failures INT NOT NULL DEFAULT 0,
  last_invoked_at TIMESTAMPTZ,
  draft_tokens_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  drafted_at TIMESTAMPTZ,
  probation_started_at TIMESTAMPTZ,
  promoted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_tool_gaps_status ON agent_tool_gaps(status);
CREATE INDEX IF NOT EXISTS idx_tool_gaps_agent ON agent_tool_gaps(requested_by_agent);
CREATE INDEX IF NOT EXISTS idx_tool_gaps_tool_name ON agent_tool_gaps(tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_gaps_embedding
  ON agent_tool_gaps USING ivfflat (intent_embedding vector_cosine_ops)
  WITH (lists = 50);

COMMENT ON TABLE agent_tool_gaps IS 'Catálogo de tools que faltan / drafted / promovidas. Auto-genera por gap detection o cron weekly scan.';
COMMENT ON COLUMN agent_tool_gaps.status IS 'pending → drafting → drafted → probation → promoted | rejected | disabled | draft_failed | corrupted';
COMMENT ON COLUMN agent_tool_gaps.code_hash IS 'SHA-256 del archivo en disco. Detecta drift / edición concurrente.';

-- ---------------------------------------------------------------------
-- auto_tool_names — lock atómico de naming para evitar colisiones
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auto_tool_names (
  name TEXT PRIMARY KEY,
  gap_id UUID REFERENCES agent_tool_gaps(id) ON DELETE CASCADE,
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE auto_tool_names IS 'Reservas de nombres de auto-tools. INSERT ON CONFLICT DO NOTHING para evitar carrera entre crons concurrentes.';

-- ---------------------------------------------------------------------
-- auto_tool_invocations — telemetría detallada por invocación
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auto_tool_invocations (
  id BIGSERIAL PRIMARY KEY,
  gap_id UUID REFERENCES agent_tool_gaps(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  invoker_agent TEXT,
  success BOOLEAN NOT NULL,
  duration_ms INT,
  error_message TEXT,
  invoked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invocations_tool_time
  ON auto_tool_invocations(tool_name, invoked_at DESC);
CREATE INDEX IF NOT EXISTS idx_invocations_gap
  ON auto_tool_invocations(gap_id);

COMMENT ON TABLE auto_tool_invocations IS 'Log append-only de cada invocación a auto-tool. Source of truth para usage_count / success_count.';

-- ---------------------------------------------------------------------
-- Vista: stats agregados por tool
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW auto_tool_stats AS
SELECT
  g.id AS gap_id,
  g.tool_name,
  g.tool_kind,
  g.status,
  g.requested_by_agent,
  g.usage_count,
  g.success_count,
  g.failure_count,
  CASE WHEN g.usage_count > 0
       THEN ROUND(100.0 * g.success_count / g.usage_count, 1)
       ELSE NULL
  END AS success_rate_pct,
  g.consecutive_failures,
  g.last_invoked_at,
  g.created_at,
  g.drafted_at,
  g.probation_started_at,
  g.promoted_at,
  EXTRACT(EPOCH FROM (now() - g.created_at)) / 86400 AS age_days
FROM agent_tool_gaps g;

-- ---------------------------------------------------------------------
-- Helper: weekly token usage agregado para enforcement de cuota
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_tools_tokens_used_this_week()
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(draft_tokens_used), 0)::INT
  FROM agent_tool_gaps
  WHERE drafted_at >= date_trunc('week', now());
$$;

COMMENT ON FUNCTION auto_tools_tokens_used_this_week IS 'Tokens LLM gastados esta semana en draft-tool. Usado para enforcement de MAX_DRAFT_TOKENS_PER_WEEK.';

-- ---------------------------------------------------------------------
-- Helper: count tools activas (drafted + probation + promoted)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_tools_active_count()
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INT
  FROM agent_tool_gaps
  WHERE status IN ('drafted','probation','promoted');
$$;

-- ---------------------------------------------------------------------
-- Trigger: si consecutive_failures >= 10 → status=disabled automáticamente
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_tools_check_circuit_breaker()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.consecutive_failures >= 10
     AND NEW.status IN ('drafted','probation','promoted') THEN
    NEW.status := 'disabled';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_tools_circuit_breaker ON agent_tool_gaps;
CREATE TRIGGER trg_auto_tools_circuit_breaker
  BEFORE UPDATE OF consecutive_failures ON agent_tool_gaps
  FOR EACH ROW
  EXECUTE FUNCTION auto_tools_check_circuit_breaker();

-- ---------------------------------------------------------------------
-- RPC: find_similar_tool_gaps — semantic search por intent embedding
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION find_similar_tool_gaps(
  query_embedding vector(768),
  match_count INT DEFAULT 3,
  filter_kind TEXT DEFAULT NULL
)
RETURNS TABLE(
  gap_id UUID,
  similarity FLOAT,
  status TEXT,
  tool_kind TEXT,
  tool_name TEXT,
  draft_path TEXT,
  intent TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    g.id AS gap_id,
    1 - (g.intent_embedding <=> query_embedding) AS similarity,
    g.status,
    g.tool_kind,
    g.tool_name,
    g.draft_path,
    g.intent
  FROM agent_tool_gaps g
  WHERE g.intent_embedding IS NOT NULL
    AND (filter_kind IS NULL OR g.tool_kind = filter_kind)
  ORDER BY g.intent_embedding <=> query_embedding ASC
  LIMIT match_count;
$$;

COMMENT ON FUNCTION find_similar_tool_gaps IS 'Semantic search sobre agent_tool_gaps. Usado por recordToolGap (dedupe) y /api/neural/tools/lookup (registry consultable).';
