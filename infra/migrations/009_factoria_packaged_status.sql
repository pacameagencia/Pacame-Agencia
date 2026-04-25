-- 009_factoria_packaged_status.sql
-- FASE C — pipeline auto discovery → producto empaquetable.
-- Añade 'packaged' al check constraint de agent_discoveries.status para permitir
-- que SAGE marque discoveries como empaquetados en el cron de la factoría.

ALTER TABLE agent_discoveries
  DROP CONSTRAINT IF EXISTS agent_discoveries_status_check;

ALTER TABLE agent_discoveries
  ADD CONSTRAINT agent_discoveries_status_check
  CHECK (status IN ('new', 'reviewed', 'implementing', 'implemented', 'dismissed', 'packaged', 'accepted', 'shipped'));

-- Índice para acelerar las queries del dashboard /dashboard/factoria/productos
-- y del cron de empaquetado que filtran por status='packaged' o por estados
-- finales para el cálculo de tiempo discovery → producto.
CREATE INDEX IF NOT EXISTS idx_agent_discoveries_status_reviewed
  ON agent_discoveries(status, reviewed_at DESC)
  WHERE status IN ('packaged', 'accepted', 'shipped', 'implemented');

COMMENT ON CONSTRAINT agent_discoveries_status_check ON agent_discoveries IS
  'Status lifecycle: new → reviewed → implementing → implemented OR new → packaged → accepted → shipped OR dismissed';
