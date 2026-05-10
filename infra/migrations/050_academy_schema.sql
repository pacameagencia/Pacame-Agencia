-- 050_academy_schema.sql
-- Dark Academy v1 — schema para la academia de formación IA visual.
--
-- Plan maestro: strategy/darkroom/academy/curriculum.md (6 módulos, 0-100%)
-- Arquitectura: strategy/darkroom/academy/architecture.md
--
-- Dependencias:
--   · NO depende de auth.users todavía (Supabase Auth no configurado aún · bloqueador documentado).
--     academy_users.id es UUID propio. Cuando se habilite Auth, añadir FK ALTER TABLE.
--   · Tablas viven en proyecto Supabase actual (PACAME). Migración a proyecto aislado
--     `dark-room-prod` queda como decisión Sprint posterior · ver SPRINT-B-BLOCKERS.md.
--
-- Política RLS:
--   · Todas las tablas con ENABLE ROW LEVEL SECURITY.
--   · Políticas explícitas se aplican fuera de esta migración (panel Supabase o
--     migración 051 cuando Supabase Auth esté disponible para `auth.uid()`).
--   · Service role siempre tiene full access (bypass RLS por defecto).

-- ─── Lead magnets (catálogo · uno por módulo) ──────────────────

CREATE TABLE IF NOT EXISTS academy_lead_magnets (
  id              text PRIMARY KEY,                  -- 'lm-m1-stack-2026', 'lm-m3-three-pass-review'
  module_id       text,                              -- 'M1'..'M6' (FK lógica · academy_modules se crea después)
  slug            text UNIQUE NOT NULL,
  title           text NOT NULL,
  description     text NOT NULL,
  format          text NOT NULL CHECK (format IN ('pdf','notion','json','csv','zip')),
  asset_url       text NOT NULL,                     -- path en Supabase Storage bucket 'academy-public'
  capture_url     text NOT NULL,                     -- '/academia/lead-magnet/{slug}'
  captured_count  int NOT NULL DEFAULT 0,
  published       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_lead_magnets_module    ON academy_lead_magnets(module_id);
CREATE INDEX IF NOT EXISTS idx_academy_lead_magnets_slug      ON academy_lead_magnets(slug);
CREATE INDEX IF NOT EXISTS idx_academy_lead_magnets_published ON academy_lead_magnets(published);

ALTER TABLE academy_lead_magnets ENABLE ROW LEVEL SECURITY;

-- ─── Módulos (catálogo · semi-static, sync desde curriculum.md) ─

CREATE TABLE IF NOT EXISTS academy_modules (
  id           text PRIMARY KEY,                     -- 'M1','M2','M3','M4','M5','M6'
  slug         text UNIQUE NOT NULL,                 -- 'fundamentos-ia-visual'
  title        text NOT NULL,
  position     int  NOT NULL,
  weight_pct   numeric(5,2) NOT NULL CHECK (weight_pct > 0 AND weight_pct <= 100),
  pct_start    numeric(5,2) NOT NULL,
  pct_end      numeric(5,2) NOT NULL,
  description  text,
  -- lead_magnet linkado vía academy_lead_magnets.module_id (relación 1:N magnet → módulo)
  published    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_modules_position  ON academy_modules(position);
CREATE INDEX IF NOT EXISTS idx_academy_modules_published ON academy_modules(published);

ALTER TABLE academy_modules ENABLE ROW LEVEL SECURITY;

-- ─── Lecciones (catálogo · 1 fila por lección) ──────────────────

CREATE TABLE IF NOT EXISTS academy_lessons (
  id                  text PRIMARY KEY,              -- 'M1.L1', 'M3.L7', etc.
  module_id           text NOT NULL REFERENCES academy_modules(id) ON DELETE CASCADE,
  slug                text NOT NULL,
  title               text NOT NULL,
  position            int  NOT NULL,
  duration_min        int  NOT NULL CHECK (duration_min BETWEEN 5 AND 30),
  pct_start           numeric(5,2) NOT NULL,
  pct_end             numeric(5,2) NOT NULL,
  content_md          text,                          -- markdown completo de la lección
  video_url           text,
  prompt_copiable     text,
  exercise_brief      text,
  quick_win           text,
  prereq_lesson_id    text REFERENCES academy_lessons(id),
  visual_asset_url    text,
  published           boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_academy_lessons_module_position
  ON academy_lessons(module_id, position);
CREATE INDEX IF NOT EXISTS idx_academy_lessons_prereq    ON academy_lessons(prereq_lesson_id);
CREATE INDEX IF NOT EXISTS idx_academy_lessons_published ON academy_lessons(published);

ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;

-- ─── Usuarios (sin FK a auth.users hasta Sprint posterior) ──────

CREATE TABLE IF NOT EXISTS academy_users (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                    text UNIQUE NOT NULL,
  locale                   text NOT NULL DEFAULT 'es' CHECK (locale IN ('es','pt','en')),
  display_name             text,
  source                   text,                     -- 'leadmagnet_m1','organic','noticias','newsletter','feed_ig','feed_tt'
  current_module           text NOT NULL DEFAULT 'M1',
  current_lesson           text NOT NULL DEFAULT 'M1.L1',
  total_progress_pct       numeric(5,2) NOT NULL DEFAULT 0
                             CHECK (total_progress_pct >= 0 AND total_progress_pct <= 100),
  last_active_at           timestamptz NOT NULL DEFAULT now(),
  newsletter_subscribed    boolean NOT NULL DEFAULT true,
  marketing_consent        boolean NOT NULL DEFAULT false,
  unsubscribe_token        text UNIQUE,              -- para link 1-click unsubscribe sin login
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_users_email           ON academy_users(email);
CREATE INDEX IF NOT EXISTS idx_academy_users_last_active     ON academy_users(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_academy_users_source          ON academy_users(source);
CREATE INDEX IF NOT EXISTS idx_academy_users_newsletter      ON academy_users(newsletter_subscribed);

ALTER TABLE academy_users ENABLE ROW LEVEL SECURITY;

-- ─── Progreso (1 fila por user × lección · marca completada) ───

CREATE TABLE IF NOT EXISTS academy_progress (
  user_id                  uuid NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  lesson_id                text NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,
  completed_at             timestamptz NOT NULL DEFAULT now(),
  quiz_score               numeric(5,2) CHECK (quiz_score IS NULL OR (quiz_score >= 0 AND quiz_score <= 100)),
  exercise_submitted_url   text,                     -- link opcional a entrega del alumno
  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_academy_progress_user   ON academy_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_progress_lesson ON academy_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_academy_progress_compl  ON academy_progress(completed_at DESC);

ALTER TABLE academy_progress ENABLE ROW LEVEL SECURITY;

-- ─── Quizzes (1 por lección · 5-7 preguntas en JSONB) ──────────

CREATE TABLE IF NOT EXISTS academy_quizzes (
  id                text PRIMARY KEY,                -- 'qz-m1-l5', 'qz-m3-l7'
  lesson_id         text NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,
  questions         jsonb NOT NULL,                  -- [{ q, options:[], correct_idx, explanation }]
  pass_threshold    numeric(5,2) NOT NULL DEFAULT 60.0
                       CHECK (pass_threshold >= 0 AND pass_threshold <= 100),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_quizzes_lesson ON academy_quizzes(lesson_id);

ALTER TABLE academy_quizzes ENABLE ROW LEVEL SECURITY;

-- ─── Noticias / periódico IA (/noticias) ───────────────────────

CREATE TABLE IF NOT EXISTS academy_news (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text UNIQUE NOT NULL,
  title                 text NOT NULL,
  excerpt               text NOT NULL,
  body_md               text NOT NULL,
  source_url            text NOT NULL,
  source_name           text NOT NULL,               -- 'OpenAI','Anthropic','HuggingFace','Reddit r/MachineLearning'
  source_published_at   timestamptz,
  category              text CHECK (category IN ('release','paper','tutorial','opinion','workflow')),
  hero_image_url        text,
  ai_summary            boolean NOT NULL DEFAULT true,
  reviewed_by_human     boolean NOT NULL DEFAULT false,
  published             boolean NOT NULL DEFAULT false,
  published_at          timestamptz,
  views_count           int NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_news_published_at ON academy_news(published_at DESC)
  WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_academy_news_category     ON academy_news(category);
CREATE INDEX IF NOT EXISTS idx_academy_news_reviewed     ON academy_news(reviewed_by_human);

ALTER TABLE academy_news ENABLE ROW LEVEL SECURITY;

-- ─── Newsletter quincenal (Resend) ─────────────────────────────

CREATE TABLE IF NOT EXISTS academy_newsletter (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number           int UNIQUE NOT NULL,
  title                  text NOT NULL,
  body_md                text NOT NULL,
  sent_at                timestamptz,
  recipients_count       int,
  open_rate              numeric(5,2),
  click_rate             numeric(5,2),
  resend_broadcast_id    text,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_newsletter_sent ON academy_newsletter(sent_at DESC);

ALTER TABLE academy_newsletter ENABLE ROW LEVEL SECURITY;

-- ─── Lead magnet captures (1 fila por descarga · email + magnet) ─

CREATE TABLE IF NOT EXISTS academy_lead_captures (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL,
  lead_magnet_id      text NOT NULL REFERENCES academy_lead_magnets(id),
  user_id             uuid REFERENCES academy_users(id), -- nullable hasta que se cree el user
  source_utm          text,
  affiliate_code      text,                              -- futuro: ref crew
  status              text NOT NULL DEFAULT 'captured',  -- captured | delivered | unsubscribed
  delivered_at        timestamptz,
  unsubscribed_at     timestamptz,
  meta                jsonb DEFAULT '{}'::jsonb,         -- firstname, source_url, etc
  captured_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_lead_captures_email     ON academy_lead_captures(email);
CREATE INDEX IF NOT EXISTS idx_academy_lead_captures_magnet    ON academy_lead_captures(lead_magnet_id);
CREATE INDEX IF NOT EXISTS idx_academy_lead_captures_status    ON academy_lead_captures(status);
CREATE INDEX IF NOT EXISTS idx_academy_lead_captures_captured  ON academy_lead_captures(captured_at);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_academy_lead_captures_email_magnet
  ON academy_lead_captures(email, lead_magnet_id);

ALTER TABLE academy_lead_captures ENABLE ROW LEVEL SECURITY;

-- ─── Seed inicial · 6 módulos del curriculum ───────────────────

INSERT INTO academy_modules (id, slug, title, position, weight_pct, pct_start, pct_end, description, published) VALUES
  ('M1','fundamentos-ia-visual','Fundamentos IA visual',         1, 15.00,   0.00,  15.00, 'Mapa del stack · qué herramienta para qué cosa · tier system.',         false),
  ('M2','prompting-basico',     'Prompting básico',              2, 15.00,  15.00,  30.00, 'Estructura 5-step cinematográfica · JSON · bot ayudante.',              false),
  ('M3','imagen-ia',            'Imagen IA',                     3, 25.00,  30.00,  55.00, 'Personajes consistentes · 360 sheet · objetos · texturas hiperrealistas.', false),
  ('M4','video-ia-cinematico',  'Video IA cinemático',           4, 20.00,  55.00,  75.00, 'Research-first · Decision Tree formato · start/last frame chaining.',   false),
  ('M5','workflows-productivos','Workflows productivos',         5, 15.00,  75.00,  90.00, 'Avatar persistente · batch · 6 tipos de ads · calendario 10 slots.',    false),
  ('M6','monetizacion',         'Monetización + portfolio',      6, 10.00,  90.00, 100.00, 'Anti-promesas · marco honesto € · portfolio · canales LATAM-ES.',       false)
ON CONFLICT (id) DO NOTHING;

-- ─── Seed inicial · 6 lead magnets (uno por módulo) ────────────

INSERT INTO academy_lead_magnets (id, module_id, slug, title, description, format, asset_url, capture_url, published) VALUES
  ('lm-m1-stack-2026',          'M1','mapa-stack-ia-2026',
    'Mapa del stack IA 2026',
    '18 herramientas IA agrupadas por función (imagen, video, voz, edición, deploy). 1 página descargable.',
    'pdf', 'academy-public/lm-m1-stack-2026.pdf',
    '/academia/lead-magnet/mapa-stack-ia-2026', false),

  ('lm-m2-20-prompts',          'M2','20-prompts-copiables',
    '20 prompts copiables para empezar',
    'Prompts agrupados por uso (retrato, producto, paisaje, mockup, comic, cinematic). Notion público.',
    'notion','academy-public/lm-m2-20-prompts.html',
    '/academia/lead-magnet/20-prompts-copiables', false),

  ('lm-m3-three-pass-review',   'M3','three-pass-review-checklist',
    'Checklist Three-Pass Review · 26 markers anti-AI-look',
    'Lista para imprimir y ticar en cada pieza. Detecta el ojo de IA antes de publicar.',
    'pdf','academy-public/lm-m3-three-pass-review.pdf',
    '/academia/lead-magnet/three-pass-review-checklist', false),

  ('lm-m4-decision-tree',       'M4','decision-tree-formato',
    'Decision Tree formato · 1-act / 2-act / 3-act / story / carrusel',
    'Mapa visual para decidir formato antes de generar. Evita el anti-patrón 4 escenas en 14s.',
    'pdf','academy-public/lm-m4-decision-tree.pdf',
    '/academia/lead-magnet/decision-tree-formato', false),

  ('lm-m5-30-piezas',           'M5','30-piezas-3-horas',
    '30 piezas en 3 horas · template de batch generation',
    'Notion + concept JSON con 5 prompts + setup batch + planning slot. Resultado verificable.',
    'notion','academy-public/lm-m5-30-piezas.html',
    '/academia/lead-magnet/30-piezas-3-horas', false),

  ('lm-m6-precios-honestos',    'M6','marco-honesto-precios-euros',
    'Marco honesto de precios € · 6 paquetes con desglose',
    'Starter 300€ · Standard 600-1.200€ · Premium 1.500-3.000€ · Retainer 800-2.000€/mes. Con anti-promesas explícitas.',
    'pdf','academy-public/lm-m6-precios-honestos.pdf',
    '/academia/lead-magnet/marco-honesto-precios-euros', false)
ON CONFLICT (id) DO NOTHING;

-- ─── Comentarios documentales ──────────────────────────────────

COMMENT ON TABLE academy_users IS
  'Dark Academy · usuarios registrados. UUID propio hasta que Supabase Auth se configure y se añada FK a auth.users.';
COMMENT ON TABLE academy_modules IS
  'Dark Academy · 6 módulos del curriculum (M1..M6). Pesos suman 100%. Seed inicial incluido en esta migración.';
COMMENT ON TABLE academy_lessons IS
  'Dark Academy · lecciones individuales. content_md = markdown completo redactado por subagente dark-academy.';
COMMENT ON TABLE academy_progress IS
  'Dark Academy · 1 fila por (user × lesson) cuando se completa. Trigger pendiente para recalcular academy_users.total_progress_pct.';
COMMENT ON TABLE academy_quizzes IS
  'Dark Academy · quiz por lección. questions jsonb = array [{ q, options[], correct_idx, explanation }].';
COMMENT ON TABLE academy_news IS
  'Dark Academy · periódico IA (/noticias). Scraper cron diario genera candidatos con published=false; review humano publica.';
COMMENT ON TABLE academy_newsletter IS
  'Dark Academy · issues newsletter quincenal vía Resend broadcast.';
COMMENT ON TABLE academy_lead_magnets IS
  'Dark Academy · catálogo de lead magnets (1 por módulo). Seed inicial con 6 magnets en esta migración.';
COMMENT ON TABLE academy_lead_captures IS
  'Dark Academy · captura email para descargar magnet específico. Trigger upsert academy_users si email nuevo.';
