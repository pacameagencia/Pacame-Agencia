-- 041_darkroom_community.sql
-- Dark Room comunidad WhatsApp + Discord + 3 agentes IA (IRIS, NIMBO, VECTOR).
-- Ver plan: C:\Users\Pacame24\.claude\plans\ya-que-tienes-acceso-glittery-rain.md
--
-- Decisiones (master-success-playbook §3 Esc 9 + Notebook 4):
--   · Pack completo (sin segmentar por nicho) → tabla members tiene tier (starter/pro/studio/crew/crew_vip)
--   · Multi-canal: cada miembro puede tener Discord ID + WhatsApp phone consolidados
--   · Onboarding 7-day reactivo → eventos en darkroom_community_events D0/D2/D5/D7
--   · IRIS/NIMBO/VECTOR escriben en darkroom_community_messages para tracking + memory
--   · Aislamiento estricto Capa 3: cero refs a tablas PACAME, RLS service_role only

-- ─── Members (perfil consolidado cross-canal) ───────────────────

CREATE TABLE IF NOT EXISTS darkroom_community_members (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                  uuid REFERENCES darkroom_leads(id) ON DELETE SET NULL,
  stripe_customer_id       text UNIQUE,                    -- nullable: lurker comunidad sin pago todavía
  discord_user_id          text UNIQUE,                    -- snowflake Discord
  discord_username         text,
  whatsapp_phone           text,                           -- formato internacional sin + (e.g. 34666...)
  display_name             text,
  email                    text,
  tier                     text NOT NULL DEFAULT 'lurker',
                                                           -- lurker | trial | starter | pro | studio | crew | crew_vip | founder
  joined_at                timestamptz NOT NULL DEFAULT now(),
  last_active_at           timestamptz NOT NULL DEFAULT now(),
  status                   text NOT NULL DEFAULT 'active', -- active | paused | banned | left
  lead_score               int NOT NULL DEFAULT 0,         -- 0..100 (VECTOR scoring acumulado)
  affiliate_code           text REFERENCES darkroom_affiliates(code) ON DELETE SET NULL,
  meta                     jsonb NOT NULL DEFAULT '{}'::jsonb,
                                                           -- objections, profile (dropship/creator/student/freelance), preferred_lang
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dr_cm_discord   ON darkroom_community_members(discord_user_id);
CREATE INDEX IF NOT EXISTS idx_dr_cm_whatsapp  ON darkroom_community_members(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_dr_cm_email     ON darkroom_community_members(email);
CREATE INDEX IF NOT EXISTS idx_dr_cm_stripe    ON darkroom_community_members(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_dr_cm_tier      ON darkroom_community_members(tier);
CREATE INDEX IF NOT EXISTS idx_dr_cm_status    ON darkroom_community_members(status);
CREATE INDEX IF NOT EXISTS idx_dr_cm_score     ON darkroom_community_members(lead_score);
CREATE INDEX IF NOT EXISTS idx_dr_cm_active    ON darkroom_community_members(last_active_at);

ALTER TABLE darkroom_community_members ENABLE ROW LEVEL SECURITY;

-- ─── Messages (registro de cada interacción agente↔miembro) ────

CREATE TABLE IF NOT EXISTS darkroom_community_messages (
  id                  bigserial PRIMARY KEY,
  member_id           uuid NOT NULL REFERENCES darkroom_community_members(id) ON DELETE CASCADE,
  channel             text NOT NULL,
                                                            -- discord:soporte-ai | discord:bienvenida | whatsapp:dm | whatsapp:soporte-rapido | telegram:bot | ig:dm
  direction           text NOT NULL,                        -- inbound | outbound
  agent_handler       text,                                  -- iris | nimbo | vector | human:pablo
  intent_detected     text,                                  -- support | lead | feedback | cancellation | abuse | unknown
  content_hash        text NOT NULL,                         -- SHA256 del content (no almacenamos PII raw aquí)
  content_preview     text,                                  -- primeros 240 chars (truncated, anonimizado)
  lead_score_delta    int NOT NULL DEFAULT 0,
  escalated           boolean NOT NULL DEFAULT false,
  llm_tier            text,                                  -- titan | standard | economy | none
  llm_confidence      numeric(3,2),                          -- 0.00..1.00
  meta                jsonb NOT NULL DEFAULT '{}'::jsonb,    -- token_usage, latency_ms, escalation_reason
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dr_cmsg_member   ON darkroom_community_messages(member_id);
CREATE INDEX IF NOT EXISTS idx_dr_cmsg_channel  ON darkroom_community_messages(channel);
CREATE INDEX IF NOT EXISTS idx_dr_cmsg_intent   ON darkroom_community_messages(intent_detected);
CREATE INDEX IF NOT EXISTS idx_dr_cmsg_agent    ON darkroom_community_messages(agent_handler);
CREATE INDEX IF NOT EXISTS idx_dr_cmsg_created  ON darkroom_community_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_dr_cmsg_escal    ON darkroom_community_messages(escalated) WHERE escalated = true;

ALTER TABLE darkroom_community_messages ENABLE ROW LEVEL SECURITY;

-- ─── Events (onboarding 7-day, retention triggers, churn risk) ─

CREATE TABLE IF NOT EXISTS darkroom_community_events (
  id                  bigserial PRIMARY KEY,
  member_id           uuid NOT NULL REFERENCES darkroom_community_members(id) ON DELETE CASCADE,
  event_type          text NOT NULL,
                                                            -- onboarding:d0 | onboarding:d2 | onboarding:d5 | onboarding:d7
                                                            -- churn_risk_detected | retention_offer_sent | retention_offer_accepted
                                                            -- showcase_post | tutorial_consumed | webinar_registered | webinar_attended
                                                            -- crew_invited | crew_joined | lifetime_offered | lifetime_purchased
                                                            -- abuse_flagged | banned
  payload             jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivered_via       text,                                  -- discord_dm | whatsapp_template | discord_channel:NAME | telegram | email
  status              text NOT NULL DEFAULT 'recorded',      -- recorded | delivered | failed | acknowledged
  created_at          timestamptz NOT NULL DEFAULT now(),
  delivered_at        timestamptz
);

CREATE INDEX IF NOT EXISTS idx_dr_cevt_member  ON darkroom_community_events(member_id);
CREATE INDEX IF NOT EXISTS idx_dr_cevt_type    ON darkroom_community_events(event_type);
CREATE INDEX IF NOT EXISTS idx_dr_cevt_status  ON darkroom_community_events(status);
CREATE INDEX IF NOT EXISTS idx_dr_cevt_created ON darkroom_community_events(created_at);

ALTER TABLE darkroom_community_events ENABLE ROW LEVEL SECURITY;

-- ─── Known issues (KB para IRIS · soporte) ─────────────────────

CREATE TABLE IF NOT EXISTS darkroom_known_issues (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text UNIQUE NOT NULL,                  -- ej "credenciales-no-funcionan", "refund-prorata"
  title               text NOT NULL,
  symptom_keywords    text[] NOT NULL DEFAULT '{}',          -- "no me deja entrar", "credenciales", "password incorrecto"
  resolution          text NOT NULL,                          -- respuesta canónica (DR voz · ≤120 palabras · tutear)
  escalate_to_human   boolean NOT NULL DEFAULT false,        -- true = IRIS responde + escala SIEMPRE a Pablo
  category            text NOT NULL DEFAULT 'general',       -- access | billing | tools | refund | general
  active              boolean NOT NULL DEFAULT true,
  hits_count          int NOT NULL DEFAULT 0,                -- analytics: cuántas veces resolvió este issue
  last_used_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dr_ki_slug      ON darkroom_known_issues(slug);
CREATE INDEX IF NOT EXISTS idx_dr_ki_active    ON darkroom_known_issues(active);
CREATE INDEX IF NOT EXISTS idx_dr_ki_category  ON darkroom_known_issues(category);
CREATE INDEX IF NOT EXISTS idx_dr_ki_keywords  ON darkroom_known_issues USING gin(symptom_keywords);

ALTER TABLE darkroom_known_issues ENABLE ROW LEVEL SECURITY;

-- ─── Extender darkroom_leads (acquisition_channel + member ref) ─

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'darkroom_leads' AND column_name = 'acquisition_channel'
  ) THEN
    ALTER TABLE darkroom_leads
      ADD COLUMN acquisition_channel text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'darkroom_leads' AND column_name = 'community_member_id'
  ) THEN
    ALTER TABLE darkroom_leads
      ADD COLUMN community_member_id uuid REFERENCES darkroom_community_members(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dr_leads_channel ON darkroom_leads(acquisition_channel);
CREATE INDEX IF NOT EXISTS idx_dr_leads_member  ON darkroom_leads(community_member_id);

-- ─── Comments ───────────────────────────────────────────────────

COMMENT ON TABLE darkroom_community_members IS
  'Perfil consolidado de un miembro DR cross-canal (Discord + WhatsApp + Telegram). Una persona = una fila.';
COMMENT ON TABLE darkroom_community_messages IS
  'Registro de cada mensaje agente↔miembro. content_hash + preview (no PII raw). Alimenta dashboard LENS y memoria neural.';
COMMENT ON TABLE darkroom_community_events IS
  'Hitos del miembro · onboarding 7-day, churn risk, ofertas, lifetime, abuse. Cron lo lee para disparar acciones reactivas.';
COMMENT ON TABLE darkroom_known_issues IS
  'KB de IRIS · soporte. Cada issue con symptom_keywords + resolution. Se actualiza cuando aparece patrón nuevo.';
