-- 021_asesorpro_settings.sql
-- Settings por asesor: recepcionista Vapi, integración Telegram, branding factura.

CREATE TABLE IF NOT EXISTS asesorpro_settings (
  asesor_user_id uuid PRIMARY KEY REFERENCES pacame_product_users(id) ON DELETE CASCADE,

  -- Vapi recepcionista
  vapi_assistant_id text,
  vapi_phone_number_id text,
  vapi_first_message text,
  business_hours text,             -- "L-V 9:00-18:00"
  vapi_enabled boolean DEFAULT false,

  -- Telegram
  telegram_chat_id text,
  telegram_link_token text,        -- token para emparejar /start
  telegram_enabled boolean DEFAULT true,

  -- Branding factura
  invoice_logo_url text,
  invoice_color text DEFAULT '#283B70',
  invoice_footer text,

  -- Notificaciones
  notify_new_invoice boolean DEFAULT true,
  notify_new_expense boolean DEFAULT true,
  notify_invite_accepted boolean DEFAULT true,
  notify_call_received boolean DEFAULT true,

  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_aps_updated ON asesorpro_settings;
CREATE TRIGGER trg_aps_updated BEFORE UPDATE ON asesorpro_settings
  FOR EACH ROW EXECUTE FUNCTION pacame_products_updated_at();

-- RLS
ALTER TABLE asesorpro_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "asesorpro_settings_owner" ON asesorpro_settings;
CREATE POLICY "asesorpro_settings_owner" ON asesorpro_settings
  FOR ALL USING (asesor_user_id = auth.uid());
DROP POLICY IF EXISTS "asesorpro_settings_service" ON asesorpro_settings;
CREATE POLICY "asesorpro_settings_service" ON asesorpro_settings
  FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE asesorpro_settings IS
  'Configuración por asesor: recepcionista Vapi, Telegram chat, branding factura, preferencias de notificación.';

-- Tabla de llamadas Vapi (lo que el webhook nos cuenta tras cada call)
CREATE TABLE IF NOT EXISTS asesorpro_vapi_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesor_user_id uuid NOT NULL REFERENCES pacame_product_users(id) ON DELETE CASCADE,
  vapi_call_id text NOT NULL UNIQUE,
  status text NOT NULL,            -- 'in-progress' | 'ended'
  ended_reason text,               -- 'customer-ended-call' | 'assistant-ended-call' | 'silence-timeout' …
  duration_seconds integer,
  cost_usd numeric(10, 4),
  transcript text,
  summary text,                    -- resumen generado por Vapi (analysis.summary)
  recording_url text,
  caller_phone text,
  caller_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apv_asesor ON asesorpro_vapi_calls(asesor_user_id, created_at DESC);

ALTER TABLE asesorpro_vapi_calls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "asesorpro_vapi_calls_owner" ON asesorpro_vapi_calls;
CREATE POLICY "asesorpro_vapi_calls_owner" ON asesorpro_vapi_calls
  FOR SELECT USING (asesor_user_id = auth.uid());
DROP POLICY IF EXISTS "asesorpro_vapi_calls_service" ON asesorpro_vapi_calls;
CREATE POLICY "asesorpro_vapi_calls_service" ON asesorpro_vapi_calls
  FOR ALL USING (auth.role() = 'service_role');
