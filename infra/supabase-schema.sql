-- ============================================================
-- PACAME v3.0: Schema definitivo
-- Ejecutar en SQL Editor de Supabase en este orden exacto
-- ============================================================

-- ===================
-- TABLAS PRINCIPALES
-- ===================

-- CLIENTES
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  linkedin TEXT,
  tiktok TEXT,
  google_business_url TEXT,
  plan TEXT,
  monthly_fee NUMERIC(10,2),
  status TEXT DEFAULT 'onboarding' CHECK (status IN ('onboarding', 'active', 'paused', 'churned')),
  brand_guidelines JSONB DEFAULT '{}',
  onboarding_data JSONB DEFAULT '{}',
  notes TEXT,
  source TEXT,
  referred_by UUID REFERENCES clients(id),
  onboarded_at TIMESTAMPTZ,
  churned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- LEADS
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  business_name TEXT,
  business_type TEXT,
  problem TEXT,
  budget TEXT,
  source TEXT,
  score INTEGER DEFAULT 0 CHECK (score BETWEEN 0 AND 5),
  sage_analysis JSONB DEFAULT '{}',
  status TEXT DEFAULT 'new' CHECK (status IN (
    'new', 'contacted', 'nurturing', 'qualified',
    'proposal_sent', 'proposal_viewed', 'negotiating',
    'won', 'lost', 'dormant'
  )),
  lost_reason TEXT,
  nurturing_step INTEGER DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  last_response_at TIMESTAMPTZ,
  converted_to_client UUID REFERENCES clients(id),
  assigned_to TEXT DEFAULT 'pacame',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CONVERSACIONES
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  lead_id UUID REFERENCES leads(id),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'telegram', 'web_chat', 'phone', 'instagram_dm')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'audio', 'image', 'document', 'voice_call_transcript', 'system')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  mode TEXT DEFAULT 'auto' CHECK (mode IN ('auto', 'human')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CONTENIDO
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'twitter', 'tiktok', 'blog', 'email', 'youtube')),
  content_type TEXT CHECK (content_type IN ('post', 'story', 'reel', 'carousel', 'article', 'newsletter', 'email_sequence', 'ad_copy', 'video_script')),
  title TEXT,
  body TEXT NOT NULL,
  hashtags TEXT,
  cta TEXT,
  image_url TEXT,
  image_prompt TEXT,
  video_url TEXT,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'scheduled', 'published', 'rejected')),
  rejection_reason TEXT,
  rejection_feedback TEXT,
  batch_id TEXT,
  subagents_used TEXT[],
  engagement_data JSONB DEFAULT '{}',
  quality_score NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CAMPANAS DE ADS
CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('meta', 'google', 'tiktok')),
  campaign_name TEXT NOT NULL,
  objective TEXT,
  budget_daily NUMERIC(10,2),
  budget_total NUMERIC(10,2),
  budget_spent NUMERIC(10,2) DEFAULT 0,
  target_audience JSONB DEFAULT '{}',
  ad_copies JSONB DEFAULT '[]',
  creatives JSONB DEFAULT '[]',
  landing_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'paused', 'completed', 'error')),
  meta_campaign_id TEXT,
  google_campaign_id TEXT,
  performance JSONB DEFAULT '{}',
  nexus_strategy JSONB DEFAULT '{}',
  optimization_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PROPUESTAS
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  brief_original TEXT NOT NULL,
  sage_analysis JSONB DEFAULT '{}',
  services_proposed JSONB DEFAULT '[]',
  total_onetime NUMERIC(10,2) DEFAULT 0,
  total_monthly NUMERIC(10,2) DEFAULT 0,
  pdf_url TEXT,
  preview_web_url TEXT,
  sample_posts JSONB DEFAULT '[]',
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- LLAMADAS DE VOZ
CREATE TABLE voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  client_id UUID REFERENCES clients(id),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  purpose TEXT,
  duration_seconds INTEGER,
  transcript TEXT,
  summary TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  outcome TEXT,
  next_action TEXT,
  vapi_call_id TEXT,
  cost_eur NUMERIC(6,3),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TAREAS DE AGENTES
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent TEXT NOT NULL,
  subagent TEXT,
  task_type TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  lead_id UUID REFERENCES leads(id),
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'needs_review')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_usd NUMERIC(8,4) DEFAULT 0,
  model_used TEXT DEFAULT 'claude-sonnet-4-6',
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- METRICAS DE AGENTES (diarias)
CREATE TABLE agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  avg_duration_ms INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  cost_total_usd NUMERIC(8,4) DEFAULT 0,
  quality_avg NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent, date)
);

-- FINANZAS
CREATE TABLE finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('income', 'expense')),
  category TEXT,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id),
  invoice_number TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- REPORTES MENSUALES
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  report_data JSONB NOT NULL,
  summary TEXT,
  highlights JSONB DEFAULT '[]',
  concerns JSONB DEFAULT '[]',
  next_actions JSONB DEFAULT '[]',
  pdf_url TEXT,
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'sent')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NOTIFICACIONES
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  sent_via TEXT DEFAULT 'telegram',
  sent BOOLEAN DEFAULT false,
  read_by_pablo BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CONFIGURACION GLOBAL
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ONBOARDING CHECKLIST
CREATE TABLE onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  category TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SOLUCIONES IA PARA CLIENTES (Nivel 2 - crear tabla ahora, usar despues)
CREATE TABLE client_ai_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  solution_type TEXT,
  description TEXT,
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'building' CHECK (status IN ('building', 'testing', 'active', 'paused')),
  monthly_fee NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- CONFIGURACION INICIAL
-- ===================

INSERT INTO config (key, value, description) VALUES
  ('telegram_chat_id', '"PENDIENTE"', 'Chat ID de Pablo en Telegram'),
  ('telegram_bot_token', '"PENDIENTE"', 'Token del bot de Telegram'),
  ('claude_api_key', '"PENDIENTE"', 'API key de Anthropic'),
  ('meta_graph_token', '"PENDIENTE"', 'Token de Meta Graph API'),
  ('meta_ads_token', '"PENDIENTE"', 'Token de Meta Marketing API'),
  ('meta_ad_account_id', '"PENDIENTE"', 'ID de cuenta de Meta Ads'),
  ('whatsapp_phone_id', '"PENDIENTE"', 'Phone Number ID de WhatsApp Business'),
  ('resend_api_key', '"PENDIENTE"', 'API key de Resend'),
  ('buffer_api_key', '"PENDIENTE"', 'API key de Buffer'),
  ('vapi_api_key', '"PENDIENTE"', 'API key de Vapi'),
  ('elevenlabs_api_key', '"PENDIENTE"', 'API key de ElevenLabs'),
  ('elevenlabs_voice_id', '"PENDIENTE"', 'ID de voz espanola en ElevenLabs'),
  ('ga4_property_id', '"PENDIENTE"', 'ID de propiedad de GA4'),
  ('default_model', '"claude-sonnet-4-6"', 'Modelo por defecto para agentes'),
  ('volume_model', '"claude-haiku-4-5-20251001"', 'Modelo para tareas de volumen'),
  ('strategy_model', '"claude-opus-4-6"', 'Modelo para orquestacion DIOS'),
  ('monthly_budget_limit_eur', '500', 'Limite mensual de gasto en APIs'),
  ('monthly_ads_limit_eur', '1000', 'Limite mensual de gasto en ads propios'),
  ('content_auto_approve', 'false', 'Si true, contenido se publica sin revision de Pablo'),
  ('lead_score_threshold_hot', '4', 'Score minimo para notificar lead caliente'),
  ('quiet_hours_start', '"23:00"', 'Hora de inicio de silencio'),
  ('quiet_hours_end', '"08:00"', 'Hora de fin de silencio'),
  ('proposal_expiry_days', '14', 'Dias hasta que una propuesta caduca'),
  ('min_price_landing', '300', 'Precio minimo landing page'),
  ('min_price_web', '800', 'Precio minimo web corporativa'),
  ('min_price_social_monthly', '197', 'Precio minimo redes sociales mensual'),
  ('referral_discount_pct', '10', 'Porcentaje descuento por referido'),
  ('annual_discount_pct', '10', 'Porcentaje descuento pago anual'),
  ('pack_discount_pct', '15', 'Porcentaje descuento por pack web+recurrente');

-- ===================
-- INDICES
-- ===================

CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_leads_status_score ON leads(status, score);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_conversations_channel ON conversations(channel, created_at);
CREATE INDEX idx_conversations_client ON conversations(client_id, created_at);
CREATE INDEX idx_conversations_lead ON conversations(lead_id, created_at);
CREATE INDEX idx_conversations_mode ON conversations(mode) WHERE mode = 'human';
CREATE INDEX idx_content_client_status ON content(client_id, status);
CREATE INDEX idx_content_scheduled ON content(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_content_pending ON content(status) WHERE status = 'pending_review';
CREATE INDEX idx_content_batch ON content(batch_id);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_agent_tasks_agent ON agent_tasks(agent, status);
CREATE INDEX idx_agent_tasks_created ON agent_tasks(created_at);
CREATE INDEX idx_agent_metrics_date ON agent_metrics(agent, date);
CREATE INDEX idx_finances_date ON finances(date, type);
CREATE INDEX idx_notifications_pending ON notifications(sent) WHERE sent = false;
CREATE INDEX idx_onboarding_client ON onboarding_checklist(client_id, completed);

-- ===================
-- FUNCIONES UTILES
-- ===================

-- Funcion para calcular MRR
CREATE OR REPLACE FUNCTION calculate_mrr()
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(monthly_fee), 0) FROM clients WHERE status = 'active';
$$ LANGUAGE sql;

-- Funcion para contar leads calientes
CREATE OR REPLACE FUNCTION count_hot_leads()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM leads WHERE score >= 4 AND status NOT IN ('won', 'lost');
$$ LANGUAGE sql;

-- Funcion para coste API del mes actual
CREATE OR REPLACE FUNCTION current_month_api_cost()
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(cost_usd), 0) FROM agent_tasks
  WHERE created_at >= date_trunc('month', now());
$$ LANGUAGE sql;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER content_updated_at BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER ad_campaigns_updated_at BEFORE UPDATE ON ad_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===================
-- ROW LEVEL SECURITY
-- ===================

-- Habilitar RLS en todas las tablas con datos sensibles
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Politica: service_role tiene acceso total (n8n y backend usan service_role)
CREATE POLICY "Service role full access" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON content FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON ad_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON voice_calls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON finances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON reports FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime para tablas clave
ALTER PUBLICATION supabase_realtime ADD TABLE agent_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE content;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
