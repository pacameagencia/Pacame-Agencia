-- 021_pacame_gpt_actions.sql
-- Sprint 4 PACAME GPT: acciones reales sobre los mensajes de Lucía.
--
-- Tablas:
--   pacame_gpt_reminders   — recordatorios programados que un cron envía por email
--   pacame_gpt_action_log  — log de cada acción ejecutada (PDF, email, etc.)
--                            para analítica + rate limit + auditoría

-- 1. Recordatorios. El user pide "recuérdame esto el martes a las 11h".
-- Un cron diario barre los que tienen `due_at <= now()` y manda email.
CREATE TABLE IF NOT EXISTS pacame_gpt_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES pacame_product_users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES pacame_gpt_conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES pacame_gpt_messages(id) ON DELETE SET NULL,
  -- Texto que Lucía mandará en el email (puede ser el msg original o un
  -- resumen elaborado por el front al crear el reminder).
  body text NOT NULL,
  -- Asunto cortito para el email; si es null, lo derivamos.
  subject text,
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'canceled')),
  sent_at timestamptz,
  send_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pgr_user_due
  ON pacame_gpt_reminders(user_id, due_at DESC);
CREATE INDEX IF NOT EXISTS idx_pgr_pending_due
  ON pacame_gpt_reminders(due_at ASC)
  WHERE status = 'pending';

-- 2. Log de acciones (PDF descargados, emails enviados, recordatorios creados).
-- Sirve para:
--   - Mostrar al user "ya hiciste esto" (UX)
--   - Auditoría / analítica del producto
--   - Rate-limit suave anti-abuso (ej. 50 PDFs/día por user)
CREATE TABLE IF NOT EXISTS pacame_gpt_action_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES pacame_product_users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES pacame_gpt_conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES pacame_gpt_messages(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('pdf', 'email', 'reminder', 'whatsapp')),
  -- Payload mínimo de la acción (sin contenido; eso vive en messages).
  -- Ej. {"to":"...","sent_at":"..."} para email, {"due_at":"..."} para reminder.
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ok boolean NOT NULL DEFAULT true,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pgal_user_action_day
  ON pacame_gpt_action_log(user_id, action, created_at DESC);

COMMENT ON TABLE pacame_gpt_reminders IS
  'Recordatorios programados. Un cron diario envía los que vencen.';
COMMENT ON TABLE pacame_gpt_action_log IS
  'Log de acciones (PDF/email/reminder/whatsapp) para UX, analítica y rate-limit.';
