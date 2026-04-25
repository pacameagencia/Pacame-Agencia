---
type: n8n_workflow
template: hosteleria-v1
n8n_host: https://n8n.pacame.es
total_workflows: 6
---

# Automatizaciones n8n — Plantilla hostelería

6 workflows que se despliegan al activar la plantilla en un cliente del sector.

## 1. `hosteleria-confirmar-reserva`
**Trigger:** webhook desde Vapi/web cuando se crea reserva.

**Nodes:**
1. Webhook IN `/booking-created`
2. Supabase INSERT en `bookings`
3. Send WhatsApp (Twilio/360dialog) → cliente con detalle + link calendario .ics
4. Send email confirmación (Resend) si proporcionó email
5. Send Telegram → @{{owner_telegram_handle}} ("Nueva reserva: 4p sábado 21h")
6. Schedule recordatorio (delay 2h antes de booking_time)

## 2. `hosteleria-recordatorio-reserva`
**Trigger:** scheduled (calculado en workflow 1).

**Nodes:**
1. Trigger schedule
2. Lookup booking en Supabase
3. Si status = confirmed → Send WhatsApp recordatorio
4. Si status = cancelled → skip
5. Esperar 30 min después de booking_time → Send WhatsApp encuesta NPS

## 3. `hosteleria-encuesta-nps`
**Trigger:** scheduled 30 min después de booking_time (workflow 2).

**Nodes:**
1. Send WhatsApp con NPS button (1-10)
2. Wait response (max 24h)
3. If score >= 9 → Send WhatsApp con CTA reseña Google ("Si has tenido buena experiencia, ayúdanos con una reseña en Google: [link Google review]")
4. If score 7-8 → Send WhatsApp pidiendo feedback ("¿Qué podríamos mejorar?")
5. If score <= 6 → ESCALATE → Send Telegram al dueño con prioridad alta + preview del feedback (filtrar antes de Google)
6. Save NPS en Supabase tabla `nps_responses`

## 4. `hosteleria-recuperacion-clientes-inactivos`
**Trigger:** weekly (lunes 11am).

**Nodes:**
1. Query Supabase: clientes con última reserva > 60 días Y nps_score >= 7
2. For each → Send WhatsApp ("Marta, ¿cómo va? Hace tiempo que no te vemos. Te reservamos mesa en [next available slot] con copa de bienvenida si vienes esta semana 🍷")
3. Track open/response → tabla `recovery_campaigns`

## 5. `hosteleria-monitor-resenas`
**Trigger:** scheduled (cada 6h).

**Nodes:**
1. Fetch Google My Business reviews (API)
2. Compare con últimas 24h en cache Supabase
3. Para cada reseña nueva:
   - Save en tabla `reviews`
   - Si rating <= 3 → Send Telegram URGENTE al dueño
   - Si rating == 5 → Send celebración Telegram + auto-thanks reply (opcional, modo manual por defecto)
4. Mismo para TripAdvisor (scrape o API si tier alto)

## 6. `hosteleria-publicacion-instagram`
**Trigger:** scheduled (Mar/Jue/Sab 12:30, antes de comida).

**Nodes:**
1. Query Supabase tabla `content_calendar` filtrar próximo post
2. Si no hay → llamar a PULSE via `/api/agents/pulse` para generar carrusel/Reel
3. Generar imagen vía Gemini (skill `imagen`)
4. Publish to Instagram Graph API
5. Save resultado en tabla `social_posts`
6. Si falló → Send Telegram al equipo

## Variables de entorno necesarias (per cliente)

```bash
N8N_CLIENT_ID=hosteleria-{{client_slug}}
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=+34...
RESEND_API_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_OWNER_CHAT_ID=...
GOOGLE_MY_BUSINESS_LOCATION_ID=...
GOOGLE_REVIEWS_API_KEY=...
INSTAGRAM_BUSINESS_ID=...
INSTAGRAM_ACCESS_TOKEN=...
SUPABASE_PROJECT_REF=...
SUPABASE_SERVICE_ROLE_KEY=...
VAPI_PHONE_NUMBER_ID=...
```

## Tablas Supabase requeridas (multitenancy via `tenant_id`)

```sql
-- bookings
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  party_size int NOT NULL CHECK (party_size > 0 AND party_size < 50),
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  notes text,
  source text DEFAULT 'web' CHECK (source IN ('web','vapi','whatsapp','phone','walkin')),
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','no_show','completed')),
  deposit_paid boolean DEFAULT false,
  deposit_amount_eur numeric(10,2),
  created_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  completed_at timestamptz
);
CREATE INDEX ON bookings (tenant_id, booking_date);

-- nps_responses
CREATE TABLE nps_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  booking_id uuid REFERENCES bookings(id),
  score int CHECK (score >= 0 AND score <= 10),
  feedback text,
  responded_at timestamptz DEFAULT now(),
  led_to_review boolean DEFAULT false
);

-- reviews
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  source text CHECK (source IN ('google','tripadvisor','yelp','thefork','other')),
  external_id text,
  rating int CHECK (rating >= 1 AND rating <= 5),
  author_name text,
  content text,
  created_at timestamptz,
  responded_by_owner boolean DEFAULT false,
  alerted_to_owner boolean DEFAULT false
);

-- content_calendar
CREATE TABLE content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  channel text CHECK (channel IN ('instagram','tiktok','blog','google_business')),
  content_type text,
  caption text,
  media_url text,
  hashtags text[],
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled','published','failed','cancelled')),
  published_at timestamptz,
  external_id text,
  metrics jsonb
);
CREATE INDEX ON content_calendar (tenant_id, scheduled_for);
```

## Tiempo de despliegue por cliente

- Setup workflows desde plantilla: **2 horas** (clonar 6 workflows, parametrizar variables, test)
- Setup Vapi número: **30 min** (comprar número español + configurar prompt)
- Setup tablas Supabase con tenant_id: **30 min**
- Test E2E reserva → WhatsApp → recordatorio → encuesta: **1 hora**
- Total: **4 horas técnicas para CORE**

## Métricas de salud (LENS)

- Workflows ejecutados / día (per workflow)
- Tasa de éxito por workflow (target > 99%)
- Latencia P95 por workflow
- Mensajes WhatsApp enviados (volumen + cost)
- Reseñas detectadas y filtradas (workflow 5)
- Recuperación clientes (% de reactivados con workflow 4)
