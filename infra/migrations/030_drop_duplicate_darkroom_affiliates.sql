-- 030_drop_duplicate_darkroom_affiliates.sql
-- Rollback parcial de 029: ya existe sistema afiliados PACAME multi-brand
-- (web/lib/modules/referrals/* + web/app/api/referrals/* + tablas aff_*).
-- Las tablas darkroom_affiliates y darkroom_referrals creadas en 029 son
-- duplicadas y conflictivas. Se eliminan.
--
-- darkroom_leads SE QUEDA — esa sí es nueva y válida (lead magnet captura).
--
-- El programa Crew (5€ + 1€/mes) se implementa configurando la tabla brand
-- existente del sistema de referidos para brand='darkroom' con esa mecánica.
-- Ver strategy/darkroom/programa-afiliados.md para detalle de integración.

DROP TABLE IF EXISTS darkroom_referrals CASCADE;
DROP TABLE IF EXISTS darkroom_affiliates CASCADE;

-- darkroom_leads se mantiene tal cual.
COMMENT ON TABLE darkroom_leads IS
  'Captura email lead magnet "Stack del Creator 2026". Secuencia 5 emails día 0/2/4/7/14. Programa afiliados Crew se gestiona en sistema referidos PACAME (aff_* tables) con brand=darkroom.';
