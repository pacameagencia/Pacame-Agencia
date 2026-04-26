-- =============================================================================
-- PACAME — Migracion 021: Observabilidad LLM + mantenimiento de la red neural
-- (renombrada desde 007_observability_and_maintenance.sql para resolver
-- colisión con 007_platform_premium.sql)
-- =============================================================================
-- 1. Tabla agent_llm_usage: tracking token + coste por llamada a LLM
-- 2. Funcion backfill_episodic_to_semantic(): promueve episodicas viejas e
--    importantes a memorias semanticas (aprendizaje consolidado)
-- 3. Funcion prune_weak_synapses(): poda sinapsis debiles sin actividad
-- 4. Vista v_llm_usage_daily: agregado diario por agente + provider
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. agent_llm_usage — tracking de cada llamada LLM
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_llm_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      TEXT NOT NULL,
  provider      TEXT NOT NULL,                 -- claude | nebius | gemma
  model         TEXT NOT NULL,
  tier          TEXT,                          -- titan | premium | standard | economy
  tokens_in     INT  NOT NULL DEFAULT 0,
  tokens_out    INT  NOT NULL DEFAULT 0,
  cost_usd      NUMERIC(10, 6) NOT NULL DEFAULT 0,
  latency_ms    INT  NOT NULL DEFAULT 0,
  fallback      BOOLEAN NOT NULL DEFAULT FALSE,
  source        TEXT,                          -- chat | cron | webhook | proposal | etc
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_llm_usage_agent_created ON agent_llm_usage(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_usage_provider_created ON agent_llm_usage(provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_usage_created ON agent_llm_usage(created_at DESC);

COMMENT ON TABLE agent_llm_usage IS 'Tracking por llamada: tokens, coste USD estimado, latencia. Alimenta /dashboard/observability.';

-- -----------------------------------------------------------------------------
-- 2. Vista diaria agregada
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_llm_usage_daily AS
SELECT
  date_trunc('day', created_at)::date AS day,
  agent_id,
  provider,
  model,
  count(*)              AS calls,
  sum(tokens_in)        AS tokens_in,
  sum(tokens_out)       AS tokens_out,
  sum(cost_usd)         AS cost_usd,
  avg(latency_ms)::int  AS avg_latency_ms,
  sum(CASE WHEN fallback THEN 1 ELSE 0 END) AS fallbacks
FROM agent_llm_usage
GROUP BY 1, 2, 3, 4
ORDER BY 1 DESC, cost_usd DESC;

-- -----------------------------------------------------------------------------
-- 3. backfill_episodic_to_semantic()
-- Promueve memorias episodicas con importance >= 0.7 y antiguedad > 7 dias
-- que no han sido consolidadas aun a tipo semantic (conocimiento reutilizable).
-- Devuelve cuantas memorias fueron promovidas.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION backfill_episodic_to_semantic()
RETURNS INT AS $$
DECLARE
  promoted INT := 0;
BEGIN
  WITH promoted_rows AS (
    UPDATE agent_memories
    SET
      memory_type = 'semantic',
      tags = CASE
        WHEN 'consolidada' = ANY(tags) THEN tags
        ELSE array_append(tags, 'consolidada')
      END,
      metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{consolidated_from}',
        '"episodic"'::jsonb,
        true
      ) || jsonb_build_object('consolidated_at', now()::text)
    WHERE memory_type = 'episodic'
      AND importance >= 0.7
      AND created_at < now() - interval '7 days'
      AND NOT ('consolidada' = ANY(COALESCE(tags, ARRAY[]::text[])))
    RETURNING id
  )
  SELECT count(*) INTO promoted FROM promoted_rows;

  RETURN COALESCE(promoted, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION backfill_episodic_to_semantic() IS 'Promueve episodicas viejas + importantes a semanticas. Ejecutada semanalmente.';

-- -----------------------------------------------------------------------------
-- 4. prune_weak_synapses()
-- Elimina sinapsis que cumplen TODAS estas condiciones:
--   - weight < 0.3
--   - fire_count = 0
--   - last_fired_at IS NULL o last_fired_at < now() - 30 dias
--   - NO es una sinapsis sembrada por migracion 005 (seed synapses se
--     marcan con metadata->>'seed' = 'true')
-- Devuelve cuantas fueron podadas.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prune_weak_synapses()
RETURNS INT AS $$
DECLARE
  pruned INT := 0;
BEGIN
  WITH deleted AS (
    DELETE FROM agent_synapses
    WHERE weight < 0.3
      AND fire_count = 0
      AND (last_fired_at IS NULL OR last_fired_at < now() - interval '30 days')
      AND COALESCE(context->>'seed', 'false') <> 'true'
    RETURNING id
  )
  SELECT count(*) INTO pruned FROM deleted;

  -- Ademas, decaimiento suave a sinapsis inactivas: -0.005 si no han firing
  -- en > 14 dias (no las borra, solo las debilita para priorizar las activas)
  UPDATE agent_synapses
  SET weight = GREATEST(0, weight - 0.005)
  WHERE (last_fired_at IS NULL OR last_fired_at < now() - interval '14 days')
    AND weight > 0;

  RETURN COALESCE(pruned, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prune_weak_synapses() IS 'Poda sinapsis debiles + aplica decay suave a las inactivas. Ejecutada semanalmente.';

-- -----------------------------------------------------------------------------
-- 5. Marcar sinapsis sembradas por migracion 005 para protegerlas de poda
-- -----------------------------------------------------------------------------
UPDATE agent_synapses
SET context = COALESCE(context, '{}'::jsonb) || '{"seed": "true"}'::jsonb
WHERE (fire_count = 0 OR fire_count IS NULL)
  AND weight >= 0.5
  AND created_at < now() - interval '1 hour';

COMMIT;

-- -----------------------------------------------------------------------------
-- Verificacion
-- -----------------------------------------------------------------------------
SELECT 'agent_llm_usage creada' AS info,
       (SELECT count(*) FROM information_schema.tables WHERE table_name = 'agent_llm_usage') AS tabla_existe;
SELECT 'funciones creadas' AS info,
       count(*) AS n FROM pg_proc
       WHERE proname IN ('backfill_episodic_to_semantic', 'prune_weak_synapses');
SELECT 'sinapsis protegidas como seed' AS info, count(*) AS n
FROM agent_synapses WHERE context->>'seed' = 'true';
