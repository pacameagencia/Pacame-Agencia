-- 019_pacame_gpt_product.sql
-- Tercer producto de la factoría PACAME: PACAME GPT.
-- Réplica de ChatGPT en español de España, asistente Lucía. Generalista
-- (emails, mensajes, traducciones, resúmenes, ideas), pricing volumen masivo
-- 9,90€/mes con factura ES. Free tier 20 msg/día.

-- 1. Catálogo: insertar PACAME GPT como nuevo producto
INSERT INTO pacame_products (id, name, tagline, category, owner_agent, status, pricing, trial_days, features, marketing)
VALUES (
  'pacame-gpt',
  'PACAME GPT',
  'El ChatGPT que habla como tú, en euros, sin liarte',
  'productividad',
  'copy',
  'beta',
  '[
    {"tier":"free","name":"Gratis","price_eur":0,"interval":"month","limits":{"messages_per_day":20,"voice":false,"history_days":7,"api":false},"stripe_price_id":null},
    {"tier":"premium","name":"Premium","price_eur":9.90,"interval":"month","limits":{"messages_per_day":-1,"voice":true,"history_days":-1,"api":false},"stripe_price_id":null,"recommended":true},
    {"tier":"studio","name":"Studio","price_eur":29,"interval":"month","limits":{"messages_per_day":-1,"voice":true,"history_days":-1,"api":true},"stripe_price_id":null}
  ]'::jsonb,
  14,
  '[
    "Lucía, asistente IA que habla español de España puro (no traducción de inglés)",
    "Voz nativa castellana (Elvira) para escuchar las respuestas",
    "Atajos de tarea: emails, WhatsApp, traducciones, resúmenes, en un clic",
    "Factura española con IVA y NIF — sin pelearte con Stripe en inglés",
    "Hecho en España, soporte humano vía WhatsApp +34 722 669 381",
    "14 días gratis ilimitado, después 9,90€/mes o sigues con la versión gratis 20 msg/día",
    "Tus conversaciones se guardan, las puedes retomar y buscar"
  ]'::jsonb,
  '{
    "hero_headline":"PACAME GPT. El ChatGPT que habla como tú.",
    "hero_sub":"Lucía es nuestra IA española. Te ayuda a redactar emails, traducir, resumir, planear, lo que necesites. Versión gratis 20 mensajes al día. 9,90€/mes ilimitado, con factura.",
    "target_persona":"Españoles de a pie que no usan ChatGPT por idioma o por miedo, autónomos, gente que prefiere hablar con una IA que les hable claro y en su idioma.",
    "pain_quote":"ChatGPT está en inglés a medias, me cobra en dólares y no me da factura. Yo solo quiero que me redacte un email y no liarme.",
    "primary_color":"#B54E30",
    "accent_color":"#E8B730",
    "trial_cta":"Probar 14 días gratis",
    "hero_image":"/asistente/lucia.png"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  pricing = EXCLUDED.pricing,
  features = EXCLUDED.features,
  marketing = EXCLUDED.marketing,
  trial_days = EXCLUDED.trial_days,
  status = EXCLUDED.status;

-- 2. Conversaciones (cada user tiene N hilos persistentes)
CREATE TABLE IF NOT EXISTS pacame_gpt_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES pacame_product_users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Conversación nueva',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_pgc_user_updated
  ON pacame_gpt_conversations(user_id, updated_at DESC)
  WHERE archived = false;

-- 3. Mensajes (cada turno user/assistant)
CREATE TABLE IF NOT EXISTS pacame_gpt_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES pacame_gpt_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Telemetría opcional para analítica de uso (no se muestra al usuario)
  llm_provider text,
  llm_model text,
  tokens_in integer,
  tokens_out integer,
  latency_ms integer
);

CREATE INDEX IF NOT EXISTS idx_pgm_conv_created
  ON pacame_gpt_messages(conversation_id, created_at ASC);

-- 4. Contador diario de mensajes por user (para enforcement free tier 20/día)
-- Lo guardamos agregado: 1 row por (user, day). Mucho más barato que count(*) sobre messages.
CREATE TABLE IF NOT EXISTS pacame_gpt_daily_usage (
  user_id uuid NOT NULL REFERENCES pacame_product_users(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Madrid')::date,
  messages_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_pgdu_day ON pacame_gpt_daily_usage(day DESC);

-- 5. Trigger: bump updated_at en pacame_gpt_conversations cuando se inserta un mensaje.
CREATE OR REPLACE FUNCTION pacame_gpt_bump_conv_updated_at()
RETURNS trigger AS $$
BEGIN
  UPDATE pacame_gpt_conversations
     SET updated_at = NEW.created_at
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pgm_bump_conv ON pacame_gpt_messages;
CREATE TRIGGER trg_pgm_bump_conv
  AFTER INSERT ON pacame_gpt_messages
  FOR EACH ROW EXECUTE FUNCTION pacame_gpt_bump_conv_updated_at();

-- 6. Función atómica para incrementar el contador diario.
-- Usada por /api/pacame-gpt en cada turno del usuario. UPSERT con +1.
CREATE OR REPLACE FUNCTION pacame_gpt_increment_daily(p_user uuid, p_day date)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO pacame_gpt_daily_usage (user_id, day, messages_count)
  VALUES (p_user, p_day, 1)
  ON CONFLICT (user_id, day) DO UPDATE
    SET messages_count = pacame_gpt_daily_usage.messages_count + 1
  RETURNING messages_count INTO v_count;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE pacame_gpt_conversations IS
  'Conversaciones de PACAME GPT. updated_at se mueve automáticamente al insertar mensaje (trigger).';
COMMENT ON TABLE pacame_gpt_messages IS
  'Mensajes de PACAME GPT. role = user|assistant. Telemetría opcional para analítica.';
COMMENT ON TABLE pacame_gpt_daily_usage IS
  'Contador agregado de mensajes diarios por user, en zona horaria Madrid. Enforcement de free tier (20/día).';
COMMENT ON FUNCTION pacame_gpt_increment_daily IS
  'UPSERT atómico del contador diario. Devuelve el nuevo total tras incrementar.';
