-- Migration 040 — Drop games_catalog (Sprint 21 cleanup)
-- Games (Unity WebGL) infra abandonada. Eliminamos la tabla para limpiar
-- schema. No habia datos reales en produccion (solo placeholder).

DROP TABLE IF EXISTS games_catalog CASCADE;

-- Nota: tambien eliminamos web/app/games/, web/components/games/,
-- web/app/api/admin/games/, docs/games-integration.md en esta misma PR.
