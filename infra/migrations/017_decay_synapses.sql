-- Migración 017 — Hebbian inverse: decay de sinapsis no disparadas en >stale_days.
-- Llamada desde web/app/api/agents/neural-decay/route.ts (Vercel cron 03:00 UTC).
-- Antes de esta migración el endpoint hacía catch silente del error y synapses_decayed
-- siempre era 0. Ahora la red poda conexiones inactivas y refleja "uso real".
--
-- Nota: existió una firma previa con `double precision` aplicada manualmente fuera
-- del control de migraciones. La eliminamos para evitar ambigüedad PostgREST al
-- resolver llamadas RPC con argumentos numéricos.
DROP FUNCTION IF EXISTS decay_synapses(double precision, integer);

CREATE OR REPLACE FUNCTION decay_synapses(
  decay_factor NUMERIC DEFAULT 0.02,
  stale_days INTEGER DEFAULT 14
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE agent_synapses
  SET weight = GREATEST(0.0, weight * (1 - decay_factor))
  WHERE last_fired_at IS NULL
     OR last_fired_at < now() - (stale_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION decay_synapses(NUMERIC, INTEGER) IS
  'Decae weight de agent_synapses cuyas last_fired_at sea >stale_days. Multiplicativo (no resta) para mantener weight en [0,1]. Llamada nocturna desde /api/agents/neural-decay junto a decay_memories().';
