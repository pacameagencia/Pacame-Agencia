-- Migration 012: Seed 4 planes mensuales + PACAME Contact app
-- Aplicada via Supabase MCP apply_migration.

INSERT INTO subscription_plans (
  slug, tier, name, tagline, description, price_monthly_cents, price_yearly_cents,
  features, quotas, included_services, included_apps, sort_order, is_featured, is_active
) VALUES
  ('start','start','PACAME Start','Tu presencia digital basica','Web + dominio + email + 1 post RRSS/mes',2900,29000,
   '["Web 1 pagina","Dominio incluido","SSL + hosting","Email profesional","1 post RRSS/mes"]'::jsonb,
   '{"social_posts":1,"landing_pages":1}'::jsonb,
   '["post-instagram"]'::jsonb,'[]'::jsonb,10,FALSE,TRUE),
  ('pro','pro','PACAME Pro','Tu presencia digital profesional','Web 5 pags + blog + 4 posts + audit SEO + newsletter',9900,99000,
   '["Web hasta 5 pags","Blog 2/mes","4 posts RRSS/mes","Audit SEO trimestral","Newsletter mensual"]'::jsonb,
   '{"social_posts":4,"blog_posts":2,"seo_audits_quarterly":1,"newsletters":1,"landing_pages":5}'::jsonb,
   '["post-instagram","copy-hero-cta"]'::jsonb,'[]'::jsonb,20,TRUE,TRUE),
  ('growth','growth','PACAME Growth','Tu equipo digital completo con Ads + Analytics','Todo Pro + Ads + Email marketing + Analytics + App WhatsApp',24900,249000,
   '["Todo de Pro","Ads Meta+Google 500/mes","Email marketing","Analytics GA4","App PACAME Contact","12 posts RRSS/mes"]'::jsonb,
   '{"social_posts":12,"blog_posts":4,"seo_audits_monthly":1,"newsletters":4,"ads_spend_eur":500,"whatsapp_messages":5000}'::jsonb,
   '["post-instagram","copy-hero-cta","seo-audit-pdf","landing-1page"]'::jsonb,
   '["pacame-contact"]'::jsonb,30,TRUE,TRUE),
  ('scale','scale','PACAME Scale','Agencia completa as-a-service para PYMEs ambiciosas','Equipo digital completo. 1/10 del precio de agencia.',59900,599000,
   '["Todo de Growth","Ads 2000/mes","25+ posts/mes","Branding completo","Web ilimitada + ecommerce","Apps ilimitadas","Pablo 8h/mes"]'::jsonb,
   '{"social_posts":25,"blog_posts":8,"seo_audits":2,"newsletters":8,"ads_spend_eur":2000,"pablo_hours":8,"whatsapp_messages":25000,"apps_included":"unlimited"}'::jsonb,
   '["post-instagram","copy-hero-cta","seo-audit-pdf","landing-1page","logo-express","favicon-pack"]'::jsonb,
   '["pacame-contact","pacame-crm"]'::jsonb,40,FALSE,TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, tagline=EXCLUDED.tagline, description=EXCLUDED.description,
  price_monthly_cents=EXCLUDED.price_monthly_cents, price_yearly_cents=EXCLUDED.price_yearly_cents,
  features=EXCLUDED.features, quotas=EXCLUDED.quotas,
  included_services=EXCLUDED.included_services, included_apps=EXCLUDED.included_apps,
  updated_at=NOW();

INSERT INTO apps_catalog (
  slug, name, tagline, description, price_monthly_cents, price_yearly_cents,
  features, integrations, config_schema, category, tags, is_active, is_featured, sort_order
) VALUES
  ('pacame-contact','PACAME Contact','Asistente WhatsApp IA + mini CRM',
   'Atiende 24/7 con IA entrenada para tu negocio. Templates por sector. Mini-CRM.',
   7900,79000,
   '["Asistente IA 24/7 WhatsApp","Mini-CRM","Auto-reservas","Templates por sector","Analytics","5000 msg/mes","Escalada a humano"]'::jsonb,
   '["whatsapp_business","google_calendar","stripe"]'::jsonb,
   '{"type":"object","required":["business_name","sector","business_description"],"properties":{"business_name":{"type":"string","title":"Nombre del negocio"},"sector":{"type":"string","title":"Sector","enum":["restaurante","clinica","clinica_dental","peluqueria","gimnasio","ecommerce","consultoria","academia","inmobiliaria","otro"]},"business_description":{"type":"string","title":"Describe tu negocio","maxLength":500},"opening_hours":{"type":"string","title":"Horario","maxLength":200},"location":{"type":"string","title":"Direccion","maxLength":200},"faq":{"type":"string","title":"Preguntas frecuentes","maxLength":2000},"escalate_to_human_on":{"type":"array","title":"Escalar a humano cuando","items":{"type":"string","enum":["complaint","sale_high_value","appointment_conflict","cancellation","custom_quote"]}},"tone":{"type":"string","title":"Tono","enum":["profesional","cercano","divertido","formal"]}}}'::jsonb,
   'apps', ARRAY['whatsapp','chatbot','crm','atencion','ia'], TRUE, TRUE, 10)
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, tagline=EXCLUDED.tagline, description=EXCLUDED.description,
  price_monthly_cents=EXCLUDED.price_monthly_cents,
  features=EXCLUDED.features, config_schema=EXCLUDED.config_schema,
  updated_at=NOW();

UPDATE apps_catalog SET provider_id = (SELECT id FROM providers WHERE slug='pacame' LIMIT 1) WHERE provider_id IS NULL;
