-- 020_pacame_gpt_atomic_gate.sql
-- Reemplaza pacame_gpt_increment_daily por una versión atómica que también
-- comprueba el límite. Cierra la ventana TOCTOU del flujo "SELECT-then-UPSERT"
-- que tenía Sprint 3.
--
-- Comportamiento:
--   - Si p_limit es NULL o -1: incrementa siempre y devuelve ok=true.
--   - Si p_limit > 0 y el contador YA está en p_limit: devuelve ok=false sin
--     incrementar.
--   - Si p_limit > 0 y queda margen: incrementa +1 y devuelve ok=true.
--
-- La transacción adquiere lock de fila (FOR UPDATE) sobre pacame_gpt_daily_usage,
-- así que requests concurrentes se serializan limpiamente.

CREATE OR REPLACE FUNCTION pacame_gpt_check_and_increment_daily(
  p_user uuid,
  p_day date,
  p_limit integer DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_count integer;
BEGIN
  -- 1. Asegurar fila (idempotente, no incrementa).
  INSERT INTO pacame_gpt_daily_usage (user_id, day, messages_count)
  VALUES (p_user, p_day, 0)
  ON CONFLICT (user_id, day) DO NOTHING;

  -- 2. Lock de fila + lectura del valor actual.
  SELECT messages_count INTO v_count
    FROM pacame_gpt_daily_usage
   WHERE user_id = p_user AND day = p_day
     FOR UPDATE;

  -- 3. Gate: si hay límite y ya está al tope, rechaza sin incrementar.
  IF p_limit IS NOT NULL AND p_limit >= 0 AND v_count >= p_limit THEN
    RETURN jsonb_build_object(
      'ok', false,
      'count', v_count,
      'limit', p_limit,
      'reason', 'limit_reached'
    );
  END IF;

  -- 4. Incrementar dentro del mismo lock.
  UPDATE pacame_gpt_daily_usage
     SET messages_count = messages_count + 1
   WHERE user_id = p_user AND day = p_day
   RETURNING messages_count INTO v_count;

  RETURN jsonb_build_object(
    'ok', true,
    'count', v_count,
    'limit', p_limit
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION pacame_gpt_check_and_increment_daily IS
  'Gate atómico para PACAME GPT: lockea la fila del usuario/día, comprueba
   límite, e incrementa solo si pasa. Devuelve {ok, count, limit, reason?}.
   Si p_limit es NULL/-1 (premium/trial), siempre incrementa.';
