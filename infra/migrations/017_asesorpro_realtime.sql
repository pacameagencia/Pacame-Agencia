-- 017_asesorpro_realtime.sql
-- Habilita Supabase Realtime en las tablas de chat AsesorPro.
-- El cliente subscribe via channel('asesorpro:client:<id>') y recibe INSERTs
-- de mensajes nuevos sin polling.

-- Realtime pub: añade asesorpro_messages al channel supabase_realtime.
-- DO bloque: tolerante si la tabla ya está en el publication (no falla).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'asesorpro_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE asesorpro_messages;
  END IF;
END $$;

-- Index para query rápida por (asesor_client_id, created_at) — usado en el listado del thread
CREATE INDEX IF NOT EXISTS idx_apm_thread ON asesorpro_messages(asesor_client_id, created_at);

-- RLS: cada user sólo puede ver mensajes de su(s) cliente(s)
ALTER TABLE asesorpro_messages ENABLE ROW LEVEL SECURITY;

-- Política: lectura permitida si el user es el asesor dueño del cliente
-- O el cliente-final asociado a ese asesor_client_id
DROP POLICY IF EXISTS "asesorpro_messages_select" ON asesorpro_messages;
CREATE POLICY "asesorpro_messages_select" ON asesorpro_messages
  FOR SELECT
  USING (
    asesor_client_id IN (
      SELECT id FROM asesorpro_clients
      WHERE asesor_user_id = auth.uid() OR client_user_id = auth.uid()
    )
  );

-- Service role bypassa RLS (para nuestros endpoints API que ya validan acceso)
DROP POLICY IF EXISTS "asesorpro_messages_service_all" ON asesorpro_messages;
CREATE POLICY "asesorpro_messages_service_all" ON asesorpro_messages
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE asesorpro_messages IS
  'Chat asesor↔cliente. Realtime habilitado vía supabase_realtime publication. Subscribe via channel `asesorpro:thread:<asesor_client_id>` para INSERTs.';
