-- ============================================================================
-- PACAME NEURAL NETWORK — Schema para una red de entidades IA
-- ============================================================================
-- Modelo: cada agente es una NEURONA. Tiene cuerpo celular (agent_states),
-- sinapsis (agent_synapses), memoria (agent_memories), estimulos que lo
-- activan (agent_stimuli), cadenas de pensamiento (thought_chains) y produce
-- descubrimientos (agent_discoveries) y conocimiento compartido (knowledge_*).
--
-- Ejecutar en: https://supabase.com/dashboard/project/kfmnllpscheodgxnutkw/sql
-- Idempotente. Seguro de reejecutar.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CUERPO CELULAR — extender agent_states para que cada neurona tenga
--    identidad, personalidad, especializacion y nivel de energia.
-- ----------------------------------------------------------------------------
ALTER TABLE agent_states ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE agent_states ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE agent_states ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE agent_states ADD COLUMN IF NOT EXISTS personality JSONB DEFAULT '{}'::jsonb;
ALTER TABLE agent_states ADD COLUMN IF NOT EXISTS specialization_weights JSONB DEFAULT '{}'::jsonb;
ALTER TABLE agent_states ADD COLUMN IF NOT EXISTS energy_level INTEGER DEFAULT 100 CHECK (energy_level BETWEEN 0 AND 100);
ALTER TABLE agent_states ADD COLUMN IF NOT EXISTS fire_count INTEGER DEFAULT 0;
ALTER TABLE agent_states ADD COLUMN IF NOT EXISTS last_fired_at TIMESTAMPTZ;
ALTER TABLE agent_states ADD COLUMN IF NOT EXISTS model_tier TEXT DEFAULT 'sonnet' CHECK (model_tier IN ('opus','sonnet','haiku'));
ALTER TABLE agent_states ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_agent_states_energy ON agent_states(energy_level DESC);
CREATE INDEX IF NOT EXISTS idx_agent_states_fired ON agent_states(last_fired_at DESC NULLS LAST);

-- ----------------------------------------------------------------------------
-- 2. SINAPSIS — conexiones ponderadas entre agentes.
--    Aprendizaje hebbiano: peso sube cuando colaboran con exito.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_synapses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent TEXT NOT NULL REFERENCES agent_states(agent_id) ON DELETE CASCADE,
  to_agent TEXT NOT NULL REFERENCES agent_states(agent_id) ON DELETE CASCADE,
  synapse_type TEXT NOT NULL DEFAULT 'collaborates_with'
    CHECK (synapse_type IN (
      'collaborates_with','reports_to','delegates_to','consults','reviews',
      'orchestrates','learns_from','supervises'
    )),
  weight NUMERIC(5,4) NOT NULL DEFAULT 0.5 CHECK (weight BETWEEN 0 AND 1),
  fire_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  last_fired_at TIMESTAMPTZ,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_loop CHECK (from_agent <> to_agent),
  CONSTRAINT unique_synapse UNIQUE (from_agent, to_agent, synapse_type)
);

CREATE INDEX IF NOT EXISTS idx_synapses_from ON agent_synapses(from_agent, weight DESC);
CREATE INDEX IF NOT EXISTS idx_synapses_to ON agent_synapses(to_agent, weight DESC);
CREATE INDEX IF NOT EXISTS idx_synapses_active ON agent_synapses(last_fired_at DESC NULLS LAST);

-- ----------------------------------------------------------------------------
-- 3. MEMORIA — episodica, semantica, procedimental y emocional.
--    Con importancia (decae con el tiempo) y conteo de acceso (refuerza).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES agent_states(agent_id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL DEFAULT 'episodic'
    CHECK (memory_type IN ('episodic','semantic','procedural','emotional','working')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  importance NUMERIC(3,2) NOT NULL DEFAULT 0.50 CHECK (importance BETWEEN 0 AND 1),
  decay_rate NUMERIC(3,2) NOT NULL DEFAULT 0.05 CHECK (decay_rate BETWEEN 0 AND 1),
  accessed_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  related_entity_type TEXT,
  related_entity_id TEXT,
  embedding JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memories_agent ON agent_memories(agent_id, importance DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_type ON agent_memories(memory_type, importance DESC);
CREATE INDEX IF NOT EXISTS idx_memories_entity ON agent_memories(related_entity_type, related_entity_id) WHERE related_entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_memories_tags ON agent_memories USING GIN (tags);

-- ----------------------------------------------------------------------------
-- 4. ESTIMULOS — inputs externos que activan neuronas.
--    Webhook, cron, usuario, otro agente, metrica que cruza umbral.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_stimuli (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_agent TEXT REFERENCES agent_states(agent_id) ON DELETE SET NULL,
  source TEXT NOT NULL
    CHECK (source IN ('webhook','cron','user','agent','sensor','system','external_api')),
  source_id TEXT,
  channel TEXT,
  signal TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  intensity NUMERIC(3,2) NOT NULL DEFAULT 0.50 CHECK (intensity BETWEEN 0 AND 1),
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  response_activity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stimuli_unprocessed ON agent_stimuli(target_agent, created_at DESC) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_stimuli_source ON agent_stimuli(source, created_at DESC);

-- ----------------------------------------------------------------------------
-- 5. CADENAS DE PENSAMIENTO — razonamientos multi-paso, multi-agente.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS thought_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiating_agent TEXT REFERENCES agent_states(agent_id) ON DELETE SET NULL,
  trigger_stimulus_id UUID REFERENCES agent_stimuli(id) ON DELETE SET NULL,
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','abandoned','paused')),
  participating_agents TEXT[] DEFAULT ARRAY[]::TEXT[],
  step_count INTEGER NOT NULL DEFAULT 0,
  outcome TEXT,
  quality_score NUMERIC(3,2) CHECK (quality_score IS NULL OR quality_score BETWEEN 0 AND 1),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chains_active ON thought_chains(status, started_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_chains_agent ON thought_chains(initiating_agent, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_chains_participants ON thought_chains USING GIN (participating_agents);

-- Anadir columna a agent_activities para ligar activaciones a su cadena
ALTER TABLE agent_activities ADD COLUMN IF NOT EXISTS thought_chain_id UUID REFERENCES thought_chains(id) ON DELETE SET NULL;
ALTER TABLE agent_activities ADD COLUMN IF NOT EXISTS stimulus_id UUID REFERENCES agent_stimuli(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_activities_chain ON agent_activities(thought_chain_id) WHERE thought_chain_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 6. DESCUBRIMIENTOS — aprendizajes consolidados (insights de agentes).
--    Antes en 003_agent_discoveries.sql; lo re-aplicamos idempotente.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES agent_states(agent_id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('trend','service_idea','technique','competitor_insight','optimization','market_signal','content_idea','pattern','anomaly')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT,
  impact TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('low','medium','high','critical')),
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.70 CHECK (confidence BETWEEN 0 AND 1),
  actionable BOOLEAN NOT NULL DEFAULT TRUE,
  suggested_action TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','reviewed','implementing','implemented','dismissed')),
  thought_chain_id UUID REFERENCES thought_chains(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_discoveries_status ON agent_discoveries(status);
CREATE INDEX IF NOT EXISTS idx_discoveries_agent ON agent_discoveries(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discoveries_type ON agent_discoveries(type);
CREATE INDEX IF NOT EXISTS idx_discoveries_impact ON agent_discoveries(impact, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_discoveries_created ON agent_discoveries(created_at DESC);

-- ----------------------------------------------------------------------------
-- 7. GRAFO DE CONOCIMIENTO COMPARTIDO — nodos + aristas.
--    Todos los agentes leen y escriben aqui; es la memoria colectiva.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_type TEXT NOT NULL
    CHECK (node_type IN ('concept','entity','fact','hypothesis','question','skill','tool','playbook')),
  label TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.70 CHECK (confidence BETWEEN 0 AND 1),
  owner_agent TEXT REFERENCES agent_states(agent_id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knodes_type ON knowledge_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_knodes_label ON knowledge_nodes(label);
CREATE INDEX IF NOT EXISTS idx_knodes_tags ON knowledge_nodes USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_knodes_owner ON knowledge_nodes(owner_agent) WHERE owner_agent IS NOT NULL;

CREATE TABLE IF NOT EXISTS knowledge_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  to_node UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  relation TEXT NOT NULL,
  strength NUMERIC(3,2) NOT NULL DEFAULT 0.50 CHECK (strength BETWEEN 0 AND 1),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_node_self_loop CHECK (from_node <> to_node),
  CONSTRAINT unique_edge UNIQUE (from_node, to_node, relation)
);

CREATE INDEX IF NOT EXISTS idx_kedges_from ON knowledge_edges(from_node, strength DESC);
CREATE INDEX IF NOT EXISTS idx_kedges_to ON knowledge_edges(to_node, strength DESC);
CREATE INDEX IF NOT EXISTS idx_kedges_relation ON knowledge_edges(relation);

-- ----------------------------------------------------------------------------
-- 8. FUNCION HEBBIANA — refuerza peso sinaptico cuando agentes colaboran.
--    Uso: SELECT fire_synapse('sage', 'atlas', 'collaborates_with', true);
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fire_synapse(
  p_from TEXT,
  p_to TEXT,
  p_type TEXT DEFAULT 'collaborates_with',
  p_success BOOLEAN DEFAULT TRUE
) RETURNS NUMERIC AS $$
DECLARE
  v_new_weight NUMERIC(5,4);
BEGIN
  INSERT INTO agent_synapses (from_agent, to_agent, synapse_type, weight, fire_count, success_count, last_fired_at)
  VALUES (p_from, p_to, p_type, 0.55, 1, CASE WHEN p_success THEN 1 ELSE 0 END, now())
  ON CONFLICT (from_agent, to_agent, synapse_type) DO UPDATE SET
    weight = LEAST(1.0, GREATEST(0.0, agent_synapses.weight + CASE WHEN EXCLUDED.success_count > 0 THEN 0.02 ELSE -0.01 END)),
    fire_count = agent_synapses.fire_count + 1,
    success_count = agent_synapses.success_count + EXCLUDED.success_count,
    last_fired_at = now()
  RETURNING weight INTO v_new_weight;

  UPDATE agent_states SET fire_count = fire_count + 1, last_fired_at = now() WHERE agent_id IN (p_from, p_to);

  RETURN v_new_weight;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 9. FUNCION DECAY — la importancia de memorias cae con el tiempo si no se accede.
--    Ejecutar con cron diario: SELECT decay_memories();
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION decay_memories() RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE agent_memories
  SET importance = GREATEST(0.01, importance - decay_rate * 0.01)
  WHERE last_accessed_at IS NULL OR last_accessed_at < now() - INTERVAL '7 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 10. RLS — acceso total via anon/service (dashboard interno).
-- ----------------------------------------------------------------------------
ALTER TABLE agent_synapses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_stimuli ENABLE ROW LEVEL SECURITY;
ALTER TABLE thought_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_edges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_synapses' AND policyname = 'neural_all_synapses') THEN
    CREATE POLICY neural_all_synapses ON agent_synapses FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_memories' AND policyname = 'neural_all_memories') THEN
    CREATE POLICY neural_all_memories ON agent_memories FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_stimuli' AND policyname = 'neural_all_stimuli') THEN
    CREATE POLICY neural_all_stimuli ON agent_stimuli FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'thought_chains' AND policyname = 'neural_all_chains') THEN
    CREATE POLICY neural_all_chains ON thought_chains FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_discoveries' AND policyname = 'neural_all_discoveries') THEN
    CREATE POLICY neural_all_discoveries ON agent_discoveries FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_nodes' AND policyname = 'neural_all_knodes') THEN
    CREATE POLICY neural_all_knodes ON knowledge_nodes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_edges' AND policyname = 'neural_all_kedges') THEN
    CREATE POLICY neural_all_kedges ON knowledge_edges FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 11. REALTIME — pub en tablas que el dashboard visualizara en vivo.
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE agent_synapses; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE agent_stimuli; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE thought_chains; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE agent_discoveries; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ----------------------------------------------------------------------------
-- 12. VISTA — topologia de la red neuronal (para dashboard).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW neural_topology AS
SELECT
  s.from_agent,
  s.to_agent,
  s.synapse_type,
  s.weight,
  s.fire_count,
  s.success_count,
  CASE WHEN s.fire_count > 0 THEN s.success_count::NUMERIC / s.fire_count ELSE NULL END AS success_rate,
  s.last_fired_at,
  a_from.name AS from_name,
  a_from.specialty AS from_specialty,
  a_to.name AS to_name,
  a_to.specialty AS to_specialty
FROM agent_synapses s
LEFT JOIN agent_states a_from ON a_from.agent_id = s.from_agent
LEFT JOIN agent_states a_to ON a_to.agent_id = s.to_agent;

-- ============================================================================
-- FIN — 7 tablas nuevas, 2 funciones, 1 vista, 8 columnas extra en agent_states.
-- Topologia: 10 neuronas (ya existentes) + sinapsis (seed en 005).
-- ============================================================================
