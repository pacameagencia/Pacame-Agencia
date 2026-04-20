-- Migration 023: PACAME Agenda — segunda app productizada (49/mes)
-- Aplicada via Supabase MCP apply_migration.
-- Reutiliza app_instances (migracion 011).

CREATE TABLE IF NOT EXISTS agenda_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES app_instances(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_min INTEGER NOT NULL DEFAULT 30,
  buffer_before_min INTEGER DEFAULT 0,
  buffer_after_min INTEGER DEFAULT 5,
  price_cents INTEGER,
  currency TEXT DEFAULT 'eur',
  capacity INTEGER DEFAULT 1,
  requires_prepay BOOLEAN DEFAULT FALSE,
  color TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agenda_services_slug ON agenda_services(instance_id, slug);
CREATE INDEX IF NOT EXISTS idx_agenda_services_active ON agenda_services(instance_id, is_active, sort_order);

CREATE TABLE IF NOT EXISTS agenda_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES app_instances(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_agenda_hours_instance ON agenda_hours(instance_id, weekday);

CREATE TABLE IF NOT EXISTS agenda_closures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES app_instances(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (to_date >= from_date)
);
CREATE INDEX IF NOT EXISTS idx_agenda_closures_range ON agenda_closures(instance_id, from_date, to_date);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_number TEXT UNIQUE,
  instance_id UUID NOT NULL REFERENCES app_instances(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES agenda_services(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_notes TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','confirmed','canceled','no_show','completed','rescheduled'
  )),
  confirmation_token TEXT,
  cancellation_reason TEXT,
  canceled_at TIMESTAMPTZ,
  canceled_by TEXT,
  reminders_sent TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'widget',
  utm_params JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_appointments_instance_schedule ON appointments(instance_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(instance_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_email ON appointments(customer_email);
CREATE INDEX IF NOT EXISTS idx_appointments_reminders ON appointments(scheduled_at, status) WHERE status IN ('pending','confirmed');

CREATE SEQUENCE IF NOT EXISTS appointments_number_seq START 1;
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := 'BK-' || to_char(NOW(),'YYYY') || '-' || lpad(nextval('appointments_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appointments_booking_number ON appointments;
CREATE TRIGGER appointments_booking_number BEFORE INSERT ON appointments
FOR EACH ROW EXECUTE FUNCTION generate_booking_number();

CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at := NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appointments_updated_at ON appointments;
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION update_appointments_updated_at();

ALTER TABLE agenda_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agenda_services_service_all" ON agenda_services;
CREATE POLICY "agenda_services_service_all" ON agenda_services FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "agenda_services_public_read" ON agenda_services;
CREATE POLICY "agenda_services_public_read" ON agenda_services FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "agenda_hours_service_all" ON agenda_hours;
CREATE POLICY "agenda_hours_service_all" ON agenda_hours FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "agenda_hours_public_read" ON agenda_hours;
CREATE POLICY "agenda_hours_public_read" ON agenda_hours FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "agenda_closures_service_all" ON agenda_closures;
CREATE POLICY "agenda_closures_service_all" ON agenda_closures FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
DROP POLICY IF EXISTS "agenda_closures_public_read" ON agenda_closures;
CREATE POLICY "agenda_closures_public_read" ON agenda_closures FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "appointments_service_all" ON appointments;
CREATE POLICY "appointments_service_all" ON appointments FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
