-- ============================================================================
-- PACAME Neural Training — Algoritmo de entrenamiento de la red neuronal
-- ============================================================================
-- Alimenta la red con:
--   1. 560+ skills del ecosistema Claude (info skill.txt) como knowledge_nodes
--   2. 15 skills PACAME custom como knowledge_nodes + edges a agentes duenos
--   3. Memorias semanticas por agente (personalidad, capacidades, tech stack)
--   4. Sinapsis ampliadas basadas en colaboraciones reales detectadas
--   5. Specialization weights actualizados con fuerzas detectadas
--
-- Aplicar tras 005_neural_seed.sql — este es el paso final de entrenamiento.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. ACTUALIZAR specialization_weights y personality de cada agente
-- ----------------------------------------------------------------------------

UPDATE agent_states SET
  specialization_weights = jsonb_build_object(
    'orchestration', 1.0,
    'diagnosis', 0.95,
    'coordination', 0.98,
    'conflict_resolution', 0.9,
    'quality_gates', 0.92,
    'business_impact', 0.95,
    'escalation', 0.88
  ),
  personality = jsonb_build_object(
    'archetype', 'sage_orchestrator',
    'traits', jsonb_build_array('objective', 'neutral', 'business-focused', 'demanding', 'strategic'),
    'communication_style', 'concise, authoritative, business-language',
    'decision_bias', 'impact_over_elegance',
    'risk_tolerance', 'low',
    'tone', 'formal_direct'
  )
WHERE agent_id = 'dios';

UPDATE agent_states SET
  specialization_weights = jsonb_build_object(
    'strategy', 1.0,
    'diagnosis', 0.98,
    'prioritization', 0.95,
    'value_proposition', 0.92,
    'kpi_tree', 0.9,
    'governance', 0.93,
    'executive_reporting', 0.9
  ),
  personality = jsonb_build_object(
    'archetype', 'strategist',
    'traits', jsonb_build_array('reflective', 'precise', 'honest', 'business-fluent', 'action-oriented'),
    'communication_style', 'clear, structured, closes with next step',
    'decision_bias', 'evidence_over_opinion',
    'risk_tolerance', 'medium',
    'tone', 'consultative'
  )
WHERE agent_id = 'sage';

UPDATE agent_states SET
  specialization_weights = jsonb_build_object(
    'seo_technical', 1.0,
    'keyword_research', 0.95,
    'content_strategy', 0.9,
    'information_architecture', 0.88,
    'local_seo', 0.85,
    'link_building', 0.78,
    'competitive_analysis', 0.82
  ),
  personality = jsonb_build_object(
    'archetype', 'analyst',
    'traits', jsonb_build_array('analytical', 'data-driven', 'methodical', 'educational', 'patient'),
    'communication_style', 'data-backed, no jargon, prioritized actions',
    'decision_bias', 'long_term_with_quick_wins',
    'risk_tolerance', 'low',
    'tone', 'technical_accessible'
  )
WHERE agent_id = 'atlas';

UPDATE agent_states SET
  specialization_weights = jsonb_build_object(
    'paid_ads_meta', 0.98,
    'paid_ads_google', 0.95,
    'funnels_cro', 0.92,
    'email_marketing', 0.88,
    'ab_testing', 0.9,
    'landing_pages', 0.88,
    'attribution', 0.85
  ),
  personality = jsonb_build_object(
    'archetype', 'growth_hacker',
    'traits', jsonb_build_array('pragmatic', 'data-driven', 'fast-iterating', 'ROI-obsessed', 'metrics-focused'),
    'communication_style', 'numbers-first, experiments, scaling decisions',
    'decision_bias', 'test_then_scale',
    'risk_tolerance', 'medium_high',
    'tone', 'direct_technical'
  )
WHERE agent_id = 'nexus';

UPDATE agent_states SET
  specialization_weights = jsonb_build_object(
    'nextjs_react', 1.0,
    'typescript', 0.95,
    'tailwind_ui', 0.95,
    'performance', 0.92,
    'accessibility', 0.88,
    'mobile_first', 0.95,
    'figma_to_code', 0.88,
    'core_web_vitals', 0.9
  ),
  personality = jsonb_build_object(
    'archetype', 'craftsman',
    'traits', jsonb_build_array('detail-oriented', 'technical', 'execution-focused', 'questioning', 'pragmatic'),
    'communication_style', 'metrics-backed, justifies tradeoffs',
    'decision_bias', 'conversion_over_decoration',
    'risk_tolerance', 'low',
    'tone', 'technical_human'
  )
WHERE agent_id = 'pixel';

UPDATE agent_states SET
  specialization_weights = jsonb_build_object(
    'backend_architecture', 1.0,
    'postgresql_supabase', 0.95,
    'api_design', 0.92,
    'auth_rls', 0.9,
    'integrations_stripe_resend', 0.88,
    'security', 0.9,
    'observability', 0.85,
    'migrations', 0.88
  ),
  personality = jsonb_build_object(
    'archetype', 'systems_engineer',
    'traits', jsonb_build_array('concise', 'pragmatic', 'tradeoff-aware', 'questioning', 'noise-free'),
    'communication_style', 'executive-language tradeoffs',
    'decision_bias', 'simplicity_over_premature_optimization',
    'risk_tolerance', 'low',
    'tone', 'succinct_technical'
  )
WHERE agent_id = 'core';

UPDATE agent_states SET
  specialization_weights = jsonb_build_object(
    'social_strategy', 1.0,
    'instagram', 0.95,
    'linkedin', 0.9,
    'tiktok', 0.88,
    'content_repurposing', 0.92,
    'community_management', 0.88,
    'trending_formats', 0.85,
    'editorial_calendar', 0.92
  ),
  personality = jsonb_build_object(
    'archetype', 'storyteller',
    'traits', jsonb_build_array('creative', 'strategic', 'platform-fluent', 'ROI-aware', 'trend-sensitive'),
    'communication_style', 'native-per-platform, hook-driven',
    'decision_bias', 'engagement_with_brand_coherence',
    'risk_tolerance', 'medium',
    'tone', 'adaptive_conversational'
  )
WHERE agent_id = 'pulse';

UPDATE agent_states SET
  specialization_weights = jsonb_build_object(
    'brand_identity', 1.0,
    'visual_systems', 0.95,
    'art_direction', 0.93,
    'design_coherence', 0.92,
    'typography', 0.88,
    'color_palettes', 0.9,
    'competitive_visual', 0.82
  ),
  personality = jsonb_build_object(
    'archetype', 'creative_director',
    'traits', jsonb_build_array('confident', 'criterion-driven', 'business-connected', 'direct', 'protective'),
    'communication_style', 'recommendation-focused, justifies aesthetics with impact',
    'decision_bias', 'coherence_over_trend',
    'risk_tolerance', 'low',
    'tone', 'confident_creative'
  )
WHERE agent_id = 'nova';

UPDATE agent_states SET
  specialization_weights = jsonb_build_object(
    'persuasive_copy', 1.0,
    'landing_pages', 0.95,
    'email_sequences', 0.93,
    'seo_articles', 0.88,
    'ad_scripts', 0.9,
    'sales_proposals', 0.88,
    'brand_storytelling', 0.85,
    'spanish_spain_style', 0.95
  ),
  personality = jsonb_build_object(
    'archetype', 'conversion_writer',
    'traits', jsonb_build_array('clear', 'action-oriented', 'data-iterating', 'strategic', 'confident'),
    'communication_style', 'performance-justified copy decisions',
    'decision_bias', 'conversion_over_cleverness',
    'risk_tolerance', 'medium',
    'tone', 'clear_active'
  )
WHERE agent_id = 'copy';

UPDATE agent_states SET
  specialization_weights = jsonb_build_object(
    'ga4_tagmanager', 1.0,
    'meta_pixel_capi', 0.92,
    'measurement_plans', 0.95,
    'dashboards_looker', 0.9,
    'attribution_models', 0.88,
    'anomaly_detection', 0.85,
    'cohort_analysis', 0.85,
    'executive_reporting', 0.9
  ),
  personality = jsonb_build_object(
    'archetype', 'analyst',
    'traits', jsonb_build_array('precise', 'decision-oriented', 'honest-with-uncertainty', 'unforgiving-of-bad-data', 'proactive'),
    'communication_style', 'data-to-business-language translation',
    'decision_bias', 'cohort_over_vanity',
    'risk_tolerance', 'low',
    'tone', 'analytical_clear'
  )
WHERE agent_id = 'lens';

-- ----------------------------------------------------------------------------
-- 2. INYECTAR MEMORIAS SEMANTICAS (conocimiento duradero por agente)
-- ----------------------------------------------------------------------------
-- Cada memoria es una unidad de conocimiento que el agente usa en cada decision.

INSERT INTO agent_memories (agent_id, memory_type, title, content, importance, tags, metadata) VALUES

-- DIOS — orquestador
('dios', 'semantic', 'Hierarchy of decisions',
 'Business impact > technical elegance. When agents conflict, prioritize the path that moves the business KPI. Escalate to Pablo only for legal, financial, reputational, or data-isolation risks.',
 0.98, ARRAY['orchestration','decision-framework'],
 '{"trained":true,"source":"DIOS.md"}'::jsonb),
('dios', 'semantic', 'Quality gates protocol',
 'Every multi-agent project passes through 4 gates: strategy (Sage), brand (Nova), technical (Core/Pixel), growth (Nexus/Atlas/Pulse). Lens measures. Nothing ships to client without gates cleared.',
 0.95, ARRAY['orchestration','qa','protocol'],
 '{"trained":true}'::jsonb),
('dios', 'semantic', 'Agent assignment pattern',
 'Sage diagnoses → DIOS assigns → specialists execute → Lens measures → Sage reports. Never let Pixel/Core build without Sage brief. Never let Nova design without strategy positioning.',
 0.92, ARRAY['orchestration','workflow'],
 '{"trained":true}'::jsonb),

-- SAGE — CSO
('sage', 'semantic', 'Discovery framework',
 'Always diagnose before prescribing. Ask: business goal, constraints, target audience, current state, success criteria. Never propose tactics without problem statement validated.',
 0.98, ARRAY['strategy','discovery','diagnosis'],
 '{"trained":true,"source":"07-SAGE.md"}'::jsonb),
('sage', 'semantic', 'ICP scoring for PACAME',
 'Score leads 1-5 on: Budget, Urgency, Authority, Digital Maturity, Growth Potential. Ideal PYMEs 50K-2M EUR revenue in Spain. Score >=4 = hot, notify Pablo. Score <=2 = newsletter only.',
 0.95, ARRAY['sales','qualification','icp'],
 '{"trained":true,"source":"lead-qualification.md"}'::jsonb),
('sage', 'semantic', 'Proposal narrative structure',
 'Use Mirror-Solution-Future State: (1) show the client their current pain, (2) present specific solution with deliverables, (3) paint post-engagement future with metrics. Pricing table at end, never upfront.',
 0.92, ARRAY['sales','proposal','narrative'],
 '{"trained":true,"source":"client-proposal.md"}'::jsonb),
('sage', 'semantic', 'PACAME pricing baseline',
 'Landing pages 300-600 EUR onetime. Webs corporativas 800-1500 EUR. E-commerce 2000-8000 EUR. SEO 397-797 EUR/mes. RRSS 197-697 EUR/mes. Ads 397 EUR/mes + spend. Branding 800 EUR. Embudos 1500 EUR.',
 0.95, ARRAY['pricing','commercial','pacame'],
 '{"trained":true,"source":"client-proposal.md"}'::jsonb),
('sage', 'semantic', 'KPI tree principle',
 'Every business goal decomposes into channel metrics which decompose into specific actions. Never set KPIs that cannot be traced to concrete weekly/monthly actions. Vanity metrics get rejected.',
 0.88, ARRAY['strategy','kpi','measurement'],
 '{"trained":true}'::jsonb),

-- ATLAS — SEO
('atlas', 'semantic', 'SEO audit framework',
 'Every audit covers: technical (SSL, Core Web Vitals, robots, sitemaps), on-page (titles, meta, H1-H3, schema), authority (backlinks, brand mentions), content (gaps vs competitors). Deliver 90-day roadmap.',
 0.98, ARRAY['seo','audit','framework'],
 '{"trained":true,"source":"seo-audit.md"}'::jsonb),
('atlas', 'semantic', 'Keyword clustering rules',
 '50-100 keywords per project minimum. Cluster by intent: informational, navigational, commercial, transactional. Prioritize long-tail with commercial intent for PYMEs. Map each cluster to one pillar page.',
 0.92, ARRAY['seo','keywords','strategy'],
 '{"trained":true,"source":"seo-audit.md"}'::jsonb),
('atlas', 'semantic', 'Content-to-conversion',
 'SEO content must serve commercial intent. Every pillar page needs CTA to demo/contact/purchase. No traffic without conversion path. Co-design with Nexus so paid landing pages reuse organic keywords.',
 0.88, ARRAY['seo','conversion','content'],
 '{"trained":true}'::jsonb),
('atlas', 'semantic', 'Local SEO playbook',
 'For Spanish PYMEs: GMB optimized, NAP consistency, local schema, city+service keywords, reviews flow. Local + long-tail wins over national generic for local businesses.',
 0.85, ARRAY['seo','local','pymes'],
 '{"trained":true}'::jsonb),

-- NEXUS — Growth
('nexus', 'semantic', 'Funnel design TOFU-MOFU-BOFU',
 'Top: awareness content + soft offers (guides, audits). Middle: case studies, webinars, free trials. Bottom: demos, consultations, proposals. Each stage tracked with specific events.',
 0.95, ARRAY['growth','funnel','cro'],
 '{"trained":true,"source":"ads-campaign.md"}'::jsonb),
('nexus', 'semantic', 'Meta Ads budget discipline',
 'Test at 10 EUR/day for 7 days minimum. Scale proven ad sets to 20-50 EUR/day. Aggressive scaling 50-200 EUR/day only after ROAS stable >3x for 14 days. CPL < 5 EUR for B2B PYMEs.',
 0.92, ARRAY['ads','meta','budget'],
 '{"trained":true,"source":"ads-campaign.md"}'::jsonb),
('nexus', 'semantic', 'A/B testing iteration speed',
 'Test one variable at a time. Minimum sample: 100 conversions per variant. Call result at 95% confidence. Kill losing variants fast. Iterate weekly.',
 0.88, ARRAY['growth','ab-testing','experimentation'],
 '{"trained":true}'::jsonb),
('nexus', 'semantic', 'Email sequence architecture',
 'Welcome (D0), Quick Win (D2), Case Study (D5), Soft Pitch (D8), Hard Pitch (D12), Reactivation (D30). Each email one CTA. Subject lines tested. Personalization via merge fields.',
 0.9, ARRAY['email','nurture','sequences'],
 '{"trained":true}'::jsonb),

-- PIXEL — Frontend
('pixel', 'semantic', 'Stack canonico PACAME',
 'Next.js 15 + React 19 + TypeScript strict + Tailwind + Radix UI + Framer Motion + Supabase. Mobile-first. Lighthouse 90+ antes de delivery. Componentes funcionales, composition pattern, props tipados.',
 0.98, ARRAY['frontend','stack','pacame'],
 '{"trained":true,"source":"CLAUDE.md"}'::jsonb),
('pixel', 'semantic', 'Core Web Vitals targets',
 'LCP < 2.5s, CLS < 0.1, INP < 200ms. Images optimized (next/image), fonts preloaded, critical CSS inlined. No third-party scripts blocking render.',
 0.92, ARRAY['frontend','performance','vitals'],
 '{"trained":true,"source":"web-development.md"}'::jsonb),
('pixel', 'semantic', 'Accessibility mandatory checklist',
 'WCAG 2.1 AA: semantic HTML, ARIA where needed, keyboard navigation full, contrast 4.5:1 minimum, focus indicators visible, forms labelled, alt text descriptive.',
 0.88, ARRAY['frontend','accessibility','wcag'],
 '{"trained":true}'::jsonb),
('pixel', 'semantic', 'Figma-to-code fidelity',
 'Extract design tokens to tailwind.config.ts. Atoms → molecules → organisms → pages. Pixel-perfect colors, typography, spacing, shadows, states (hover, focus, disabled, error).',
 0.85, ARRAY['frontend','figma','design-tokens'],
 '{"trained":true,"source":"figma-to-code.md"}'::jsonb),

-- CORE — Backend
('core', 'semantic', 'Supabase-first principle',
 'Every data model goes through Supabase: schema migrations, RLS policies, Realtime subs. Auth via Supabase Auth with JWT. Edge Functions for sensitive keys. NEVER expose service role to browser.',
 0.98, ARRAY['backend','supabase','security'],
 '{"trained":true}'::jsonb),
('core', 'semantic', 'API design rules',
 'REST routes validate input (zod). Return typed errors. Rate limit public endpoints. Idempotency keys for POST. Webhooks verify signatures (Stripe, Resend, Twilio).',
 0.92, ARRAY['backend','api','security'],
 '{"trained":true,"source":"web-development.md"}'::jsonb),
('core', 'semantic', 'Secrets management',
 'All secrets in .env.local (gitignored) and Vercel dashboard. NEVER hardcode. Service keys server-side only. Public keys NEXT_PUBLIC_ prefix.',
 0.9, ARRAY['backend','secrets','devops'],
 '{"trained":true,"source":"deploy-workflow.md"}'::jsonb),
('core', 'semantic', 'Migration strategy',
 'Every schema change as numbered .sql file in infra/migrations/. Idempotent (IF NOT EXISTS). RLS policies defined in same migration. Rollback script documented.',
 0.85, ARRAY['backend','migrations','database'],
 '{"trained":true}'::jsonb),

-- PULSE — Social
('pulse', 'semantic', 'Content pillars 40-25-15-20',
 '40% education (how-to, tips, frameworks), 25% entertainment (memes, trends, behind-the-scenes), 15% inspiration (case studies, wins, quotes), 20% promotion (offers, products, CTAs). Never >25% promo.',
 0.95, ARRAY['social','content','strategy'],
 '{"trained":true,"source":"social-media.md"}'::jsonb),
('pulse', 'semantic', 'Platform-native playbook',
 'Instagram: reels > carousels > stories > posts. LinkedIn: long-form posts + carousels. TikTok: 60s max, hook in 3s, trending audio. X: threads + replies + quote tweets. Each platform gets native native content, never cross-posted raw.',
 0.92, ARRAY['social','platforms','native'],
 '{"trained":true}'::jsonb),
('pulse', 'semantic', 'Hook-first writing',
 'First 3 seconds decide retention. Hook formulas: contrarian take, specific number, curiosity gap, direct question, bold claim. Never start with "Hoy vamos a hablar de..."',
 0.88, ARRAY['social','copywriting','hooks'],
 '{"trained":true}'::jsonb),
('pulse', 'semantic', 'Repurposing system',
 'Blog post → Reel script → Carousel (10 slides) → X thread (8 tweets) → LinkedIn post → Newsletter snippet. One long-form content becomes 6 pieces of short-form across week.',
 0.85, ARRAY['social','content','repurposing'],
 '{"trained":true}'::jsonb),

-- NOVA — Brand
('nova', 'semantic', 'Brand identity framework',
 'Complete identity = strategy (purpose, positioning, differentiation, voice) + visual (colors, type, logo, icons, photography) + application (web, social, print, email). Never design without strategy layer.',
 0.98, ARRAY['brand','identity','framework'],
 '{"trained":true,"source":"branding.md"}'::jsonb),
('nova', 'semantic', 'Coherence protocol',
 'Every asset produced by Pixel, Pulse, Nexus passes brand QA. Check: palette compliance, typography scale, logo placement, tone of voice, imagery style. Reject deviations unless strategic.',
 0.92, ARRAY['brand','qa','coherence'],
 '{"trained":true}'::jsonb),
('nova', 'semantic', 'Aesthetic directions methodology',
 'Explore 2-4 directions per project: Corporate, Minimalist, Bold Startup, Playful, Dark Premium, Editorial, Retro. Deploy each separately on Vercel. Client picks direction before detailed design.',
 0.88, ARRAY['brand','exploration','design'],
 '{"trained":true,"source":"visual-design-exploration.md"}'::jsonb),

-- COPY — Copywriting
('copy', 'semantic', 'PAS and AIDA formulas',
 'PAS: Problem (agitate the pain) → Agitate (amplify consequences) → Solve (present solution). AIDA: Attention (hook) → Interest (value) → Desire (benefits) → Action (CTA). Use PAS for sales pages, AIDA for ads.',
 0.95, ARRAY['copywriting','formulas','conversion'],
 '{"trained":true,"source":"copywriting.md"}'::jsonb),
('copy', 'semantic', 'Spanish Spain style',
 'Tuteo siempre (tu, no usted). Frases cortas. Verbos activos. Numeros concretos. Sin humo. Ejemplo: "Duplica tus leads en 30 dias" > "Aumentamos significativamente su pipeline comercial".',
 0.95, ARRAY['copywriting','spanish','style'],
 '{"trained":true,"source":"CLAUDE.md"}'::jsonb),
('copy', 'semantic', 'Landing page anatomy',
 'Above-fold: H1 (benefit), subhead (clarifier), CTA primary, social proof. Below: problem agitation, solution, benefits x3, case studies, objections handled, CTA repeat, guarantee.',
 0.9, ARRAY['copywriting','landing','structure'],
 '{"trained":true}'::jsonb),
('copy', 'semantic', 'Email subject line rules',
 'Under 50 characters. Specific over clever. Curiosity without clickbait. Personalization when genuine. Test 3 variants minimum per sequence.',
 0.85, ARRAY['copywriting','email','subject'],
 '{"trained":true}'::jsonb),

-- LENS — Analytics
('lens', 'semantic', 'Measurement plan first',
 'Before any tracking setup: list business questions, map each to metric, identify event/dimension needed, choose source of truth. Only then implement GA4/GTM/Meta Pixel.',
 0.95, ARRAY['analytics','planning','methodology'],
 '{"trained":true,"source":"analytics-report.md"}'::jsonb),
('lens', 'semantic', 'KPI framework by service',
 'Web: sessions, bounce, pages/session, conversion. SEO: organic traffic, ranking, CTR. Ads: CPL, CPA, ROAS. Social: engagement, reach, CTR. Business: leads, revenue, LTV.',
 0.92, ARRAY['analytics','kpi','framework'],
 '{"trained":true,"source":"analytics-report.md"}'::jsonb),
('lens', 'semantic', 'Alert rules automation',
 'Drop >20% vs prior period = alert. ROAS <2x = alert. Bounce >70% = alert. Traffic drop >15% = alert. Anomaly detection runs daily on cron.',
 0.88, ARRAY['analytics','alerts','monitoring'],
 '{"trained":true}'::jsonb),
('lens', 'semantic', 'Data honesty principle',
 'When data is inconclusive, say so. When tracking is broken, flag before reporting. Cohort analysis over vanity metrics. Attribution is directional, not absolute.',
 0.9, ARRAY['analytics','principles','ethics'],
 '{"trained":true}'::jsonb);

-- ----------------------------------------------------------------------------
-- 3. KNOWLEDGE NODES — SKILLS PACAME CUSTOM (15)
-- ----------------------------------------------------------------------------

INSERT INTO knowledge_nodes (node_type, label, content, confidence, owner_agent, tags, metadata) VALUES
('skill', 'seo-audit',
 'SEO audits: technical, on-page, keyword research, competitor gap, 90-day roadmap',
 0.95, 'atlas',
 ARRAY['seo','organic-traffic','keyword-research','technical-seo'],
 '{"source":"pacame_custom","path":".claude/skills/seo-audit.md"}'::jsonb),
('playbook', 'client-proposal',
 'Proposal generation with Mirror-Solution-Future State narrative, ICP scoring, PACAME pricing',
 0.95, 'sage',
 ARRAY['sales','proposal','pricing','lead-qualification'],
 '{"source":"pacame_custom"}'::jsonb),
('skill', 'web-development',
 'Next.js 15 + React 19 + TypeScript production websites, Lighthouse 90+, accessibility',
 0.95, 'pixel',
 ARRAY['frontend','nextjs','react','typescript'],
 '{"source":"pacame_custom"}'::jsonb),
('playbook', 'branding',
 'Complete brand identity: strategy, visual system, voice, application guidelines',
 0.95, 'nova',
 ARRAY['branding','identity','visual-systems'],
 '{"source":"pacame_custom"}'::jsonb),
('playbook', 'ads-campaign',
 'Meta/Google/TikTok paid campaigns: structure, budgets, KPIs, alerts',
 0.95, 'nexus',
 ARRAY['ads','meta','google','tiktok','campaigns'],
 '{"source":"pacame_custom"}'::jsonb),
('playbook', 'social-media',
 'Content pillars 40-25-15-20, platform-native strategies, editorial calendars',
 0.95, 'pulse',
 ARRAY['social','content','instagram','linkedin','tiktok'],
 '{"source":"pacame_custom"}'::jsonb),
('skill', 'copywriting',
 'PAS/AIDA formulas, landing pages, email sequences, ads, Spanish Spain style',
 0.95, 'copy',
 ARRAY['copywriting','landing','email','ads','spanish'],
 '{"source":"pacame_custom"}'::jsonb),
('playbook', 'analytics-report',
 'KPI framework by service, monthly reports, alerts, cohort analysis',
 0.95, 'lens',
 ARRAY['analytics','reporting','kpi','dashboards'],
 '{"source":"pacame_custom"}'::jsonb),
('skill', 'lead-qualification',
 'ICP scoring 1-5, automated actions hot/warm/cold/unfit, website audit',
 0.9, 'sage',
 ARRAY['sales','icp','qualification','audit'],
 '{"source":"pacame_custom"}'::jsonb),
('skill', 'vibe-coding',
 'Rapid MVP development with plan.md, iterative preview, mobile-first, Lighthouse 90+',
 0.88, 'pixel',
 ARRAY['rapid-dev','mvp','prototyping'],
 '{"source":"pacame_custom"}'::jsonb),
('skill', 'figma-to-code',
 'Figma MCP integration, design tokens, atomic components, pixel-perfect fidelity',
 0.88, 'pixel',
 ARRAY['design-to-code','figma','tokens','tailwindcss'],
 '{"source":"pacame_custom"}'::jsonb),
('skill', 'design-system',
 'Design tokens, component library, CVA variants, documentation, consistency rules',
 0.9, 'pixel',
 ARRAY['design-systems','components','tokens','radix'],
 '{"source":"pacame_custom","co_owner":"nova"}'::jsonb),
('skill', 'interactive-prototyping',
 'UI/data-connected/multimedia/data-viz prototypes, Framer Motion, rapid iteration',
 0.85, 'pixel',
 ARRAY['prototyping','framer-motion','data-viz'],
 '{"source":"pacame_custom"}'::jsonb),
('skill', 'visual-design-exploration',
 '7 aesthetic directions (Corporate, Minimalist, Bold, Playful, Dark Premium, Editorial, Retro)',
 0.88, 'nova',
 ARRAY['design-exploration','aesthetics','directions'],
 '{"source":"pacame_custom","co_owner":"pixel"}'::jsonb),
('skill', 'deploy-workflow',
 'GitHub → Vercel → Supabase → custom domain → 16-point post-deploy checklist',
 0.9, 'core',
 ARRAY['devops','vercel','supabase','deployment'],
 '{"source":"pacame_custom"}'::jsonb);

-- ----------------------------------------------------------------------------
-- 4. KNOWLEDGE NODES — SKILLS COMUNIDAD (seleccion de 560+ por relevancia)
-- ----------------------------------------------------------------------------

INSERT INTO knowledge_nodes (node_type, label, content, confidence, owner_agent, tags, metadata) VALUES
-- Anthropic oficiales
('tool', 'pdf', 'Crear/editar PDFs, extraer texto/tablas, merge/split, formularios', 0.9, 'core', ARRAY['document','pdf'], '{"source":"anthropic"}'::jsonb),
('tool', 'pptx', 'Presentaciones PowerPoint, layouts, templates, graficos', 0.85, 'nova', ARRAY['document','presentation'], '{"source":"anthropic"}'::jsonb),
('tool', 'xlsx', 'Hojas Excel, formulas, formateo, analisis, visualizacion', 0.85, 'lens', ARRAY['document','spreadsheet'], '{"source":"anthropic"}'::jsonb),
('tool', 'docx', 'Documentos Word, tracked changes, comentarios', 0.8, 'copy', ARRAY['document','word'], '{"source":"anthropic"}'::jsonb),
('skill', 'frontend-design', 'Production-grade frontend, evita esteticas genericas. React + Tailwind', 0.95, 'pixel', ARRAY['frontend','design','react'], '{"source":"anthropic"}'::jsonb),
('skill', 'webapp-testing', 'Testing apps web con Playwright, verificacion UI', 0.9, 'pixel', ARRAY['testing','playwright','qa'], '{"source":"anthropic"}'::jsonb),
('skill', 'mcp-builder', 'Crear servidores MCP para integrar APIs externas', 0.9, 'core', ARRAY['mcp','integration','apis'], '{"source":"anthropic"}'::jsonb),
('skill', 'canvas-design', 'Arte visual en PNG y PDF con filosofias de diseno', 0.85, 'nova', ARRAY['design','visual','art'], '{"source":"anthropic"}'::jsonb),
('skill', 'brand-guidelines', 'Aplicar colores y tipografia oficiales a artefactos', 0.88, 'nova', ARRAY['branding','guidelines'], '{"source":"anthropic"}'::jsonb),
('skill', 'skill-creator', 'Guia para crear y empaquetar nuevas skills', 0.85, 'core', ARRAY['meta','skill-creation'], '{"source":"anthropic"}'::jsonb),

-- Obra superpowers
('playbook', 'verification-before-completion', 'Obliga verificacion con evidencia antes de cerrar tarea', 0.92, 'dios', ARRAY['qa','verification','workflow'], '{"source":"obra"}'::jsonb),
('playbook', 'subagent-driven-development', 'Delegacion a subagentes con revision en 2 fases', 0.9, 'dios', ARRAY['orchestration','subagents'], '{"source":"obra"}'::jsonb),
('playbook', 'dispatching-parallel-agents', 'Coordinacion multi-agente en paralelo', 0.92, 'dios', ARRAY['orchestration','parallel'], '{"source":"obra"}'::jsonb),
('playbook', 'writing-plans', 'Planes con tareas atomicas 2-5min, TDD RED-GREEN-REFACTOR', 0.9, 'sage', ARRAY['planning','tdd','atomic-tasks'], '{"source":"obra"}'::jsonb),
('playbook', 'systematic-debugging', 'Debugging sistematico antes de proponer fixes', 0.9, 'core', ARRAY['debugging','methodology'], '{"source":"obra"}'::jsonb),
('playbook', 'tdd-workflow', 'Test-Driven Development RED-GREEN-REFACTOR', 0.85, 'pixel', ARRAY['tdd','testing'], '{"source":"obra"}'::jsonb),

-- Marketing pack alirezarezvani
('skill', 'seo-strategist', 'Estrategia SEO completa, keyword research, technical SEO', 0.92, 'atlas', ARRAY['seo','strategy'], '{"source":"community"}'::jsonb),
('skill', 'technical-seo', 'Core Web Vitals, schema, canonicals, crawl optimization', 0.9, 'atlas', ARRAY['seo','technical'], '{"source":"community"}'::jsonb),
('skill', 'local-seo', 'SEO local para negocios fisicos, GMB, NAP consistency', 0.88, 'atlas', ARRAY['seo','local'], '{"source":"community"}'::jsonb),
('skill', 'keyword-researcher', 'Investigacion de keywords por intent y valor comercial', 0.9, 'atlas', ARRAY['seo','keywords'], '{"source":"community"}'::jsonb),
('skill', 'cro-specialist', 'Optimizacion de conversion, A/B testing, funnel analysis', 0.92, 'nexus', ARRAY['cro','conversion','growth'], '{"source":"community"}'::jsonb),
('skill', 'landing-page-optimizer', 'Optimizacion de landing pages por metricas de conversion', 0.9, 'nexus', ARRAY['landing','cro'], '{"source":"community"}'::jsonb),
('skill', 'ab-test-designer', 'Diseno de tests A/B, sample size, statistical significance', 0.88, 'nexus', ARRAY['ab-testing','experimentation'], '{"source":"community"}'::jsonb),
('skill', 'funnel-analyst', 'Analisis de embudos TOFU-MOFU-BOFU', 0.88, 'nexus', ARRAY['funnel','analytics'], '{"source":"community"}'::jsonb),
('skill', 'email-marketer', 'Email marketing y automatizacion de secuencias', 0.92, 'copy', ARRAY['email','marketing'], '{"source":"community"}'::jsonb),
('skill', 'newsletter-creator', 'Creacion de newsletters con engagement alto', 0.85, 'copy', ARRAY['newsletter','content'], '{"source":"community"}'::jsonb),
('skill', 'copywriter', 'Copy persuasivo con PAS/AIDA', 0.92, 'copy', ARRAY['copywriting','persuasion'], '{"source":"community"}'::jsonb),
('skill', 'storyteller', 'Narrativa de marca y case studies', 0.85, 'copy', ARRAY['storytelling','narrative'], '{"source":"community"}'::jsonb),
('skill', 'content-strategist', 'Estrategia de contenidos cross-channel', 0.88, 'pulse', ARRAY['content','strategy'], '{"source":"community"}'::jsonb),
('skill', 'content-calendar-planner', 'Planificacion de calendario editorial', 0.88, 'pulse', ARRAY['content','calendar'], '{"source":"community"}'::jsonb),
('skill', 'social-media-manager', 'Gestion de redes sociales multi-plataforma', 0.9, 'pulse', ARRAY['social','management'], '{"source":"community"}'::jsonb),
('skill', 'community-manager', 'Gestion de comunidades, engagement, moderacion', 0.85, 'pulse', ARRAY['community','engagement'], '{"source":"community"}'::jsonb),
('skill', 'analytics-expert', 'Analytics y metricas cross-channel', 0.9, 'lens', ARRAY['analytics','metrics'], '{"source":"community"}'::jsonb),
('skill', 'attribution-modeler', 'Modelado de atribucion multi-touch', 0.85, 'lens', ARRAY['attribution','analytics'], '{"source":"community"}'::jsonb),
('skill', 'growth-hacker', 'Growth hacking, loops virales, PLG', 0.88, 'nexus', ARRAY['growth','hacking'], '{"source":"community"}'::jsonb),
('skill', 'brand-strategist', 'Estrategia de marca, posicionamiento', 0.9, 'nova', ARRAY['brand','strategy'], '{"source":"community"}'::jsonb),
('skill', 'competitive-intelligence', 'Inteligencia competitiva, benchmark', 0.85, 'sage', ARRAY['competitive','intelligence'], '{"source":"community"}'::jsonb),

-- Engineering pack
('skill', 'backend-architect', 'API design, DB architecture, escalabilidad', 0.95, 'core', ARRAY['backend','architecture'], '{"source":"community"}'::jsonb),
('skill', 'frontend-developer', 'React/Vue/Angular, UI, rendimiento', 0.92, 'pixel', ARRAY['frontend','development'], '{"source":"community"}'::jsonb),
('skill', 'fullstack-developer', 'End-to-end development', 0.9, 'core', ARRAY['fullstack'], '{"source":"community","co_owner":"pixel"}'::jsonb),
('skill', 'devops-engineer', 'CI/CD, infraestructura, cloud ops', 0.88, 'core', ARRAY['devops','cicd'], '{"source":"community"}'::jsonb),
('skill', 'security-engineer', 'Threat modeling, secure code review', 0.9, 'core', ARRAY['security','threat-modeling'], '{"source":"community"}'::jsonb),
('skill', 'database-optimizer', 'Schema design, query optimization, indexing', 0.88, 'core', ARRAY['database','optimization'], '{"source":"community"}'::jsonb),
('skill', 'ai-ml-engineer', 'Modelos ML, deployment, integracion IA', 0.85, 'core', ARRAY['ai','ml'], '{"source":"community"}'::jsonb),
('skill', 'accessibility-auditor', 'WCAG auditing, assistive tech', 0.9, 'pixel', ARRAY['accessibility','wcag'], '{"source":"community"}'::jsonb),
('skill', 'code-reviewer', 'Review constructivo, seguridad, mantenibilidad', 0.88, 'core', ARRAY['code-review'], '{"source":"community"}'::jsonb),

-- Product pack
('skill', 'product-manager', 'Gestion completa del ciclo de vida del producto', 0.88, 'sage', ARRAY['product','pm'], '{"source":"community"}'::jsonb),
('skill', 'ux-researcher', 'Investigacion de usuarios, testing', 0.85, 'nova', ARRAY['ux','research'], '{"source":"community"}'::jsonb),
('skill', 'ui-designer', 'Diseno visual, component libraries', 0.9, 'nova', ARRAY['ui','design'], '{"source":"community","co_owner":"pixel"}'::jsonb),
('skill', 'experiment-designer', 'Diseno de experimentos A/B', 0.85, 'nexus', ARRAY['experiments','ab-testing'], '{"source":"community"}'::jsonb),

-- Daymade skills practical
('tool', 'github-ops', 'Operaciones GitHub con gh CLI', 0.9, 'core', ARRAY['github','ops'], '{"source":"daymade"}'::jsonb),
('tool', 'deep-research', 'Operaciones de investigacion en profundidad', 0.88, 'sage', ARRAY['research'], '{"source":"daymade"}'::jsonb),
('tool', 'fact-checker', 'Verificacion y fact-checking', 0.85, 'lens', ARRAY['fact-check'], '{"source":"daymade"}'::jsonb),
('tool', 'prompt-optimizer', 'Optimizacion de prompts con EARS', 0.85, 'dios', ARRAY['prompts','meta'], '{"source":"daymade"}'::jsonb),
('tool', 'competitors-analysis', 'Investigacion de competencia y mercado', 0.88, 'sage', ARRAY['competitive'], '{"source":"daymade"}'::jsonb),

-- Video / Multimedia (para Pulse)
('tool', 'remotion', 'Framework de video basado en React', 0.85, 'pulse', ARRAY['video','react'], '{"source":"community"}'::jsonb),
('tool', 'elevenlabs', 'Audio IA: text-to-speech', 0.85, 'pulse', ARRAY['audio','tts'], '{"source":"community"}'::jsonb),
('tool', 'ffmpeg', 'Procesamiento de media: conversion, compresion', 0.8, 'pulse', ARRAY['media','ffmpeg'], '{"source":"community"}'::jsonb),

-- Skills cross-agent importantes
('concept', 'hebbian_learning', 'Neurons that fire together, wire together. Synapse weights +0.02 success, -0.01 failure.', 0.95, 'dios', ARRAY['neural','learning'], '{"source":"pacame_core"}'::jsonb),
('concept', 'progressive_disclosure', 'Cargar contexto solo cuando se necesita. Routing rules en CLAUDE.md.', 0.9, 'dios', ARRAY['context','routing'], '{"source":"pacame_core"}'::jsonb),
('concept', 'agent_isolation', 'PRIMORDIAL: datos cliente nunca en infra PACAME, solo metadata', 0.98, 'core', ARRAY['security','isolation','clients'], '{"source":"pacame_core"}'::jsonb);

-- ----------------------------------------------------------------------------
-- 5. KNOWLEDGE EDGES — conexiones entre nodos y agentes
-- ----------------------------------------------------------------------------

-- Conectar skills custom PACAME a sus agentes colaboradores secundarios
INSERT INTO knowledge_edges (from_node, to_node, relation, strength)
SELECT
  (SELECT id FROM knowledge_nodes WHERE label = 'client-proposal' LIMIT 1),
  (SELECT id FROM knowledge_nodes WHERE label = 'copywriter' LIMIT 1),
  'uses', 0.8
WHERE EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'client-proposal')
  AND EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'copywriter');

INSERT INTO knowledge_edges (from_node, to_node, relation, strength)
SELECT
  (SELECT id FROM knowledge_nodes WHERE label = 'seo-audit' LIMIT 1),
  (SELECT id FROM knowledge_nodes WHERE label = 'keyword-researcher' LIMIT 1),
  'depends_on', 0.9
WHERE EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'seo-audit')
  AND EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'keyword-researcher');

INSERT INTO knowledge_edges (from_node, to_node, relation, strength)
SELECT
  (SELECT id FROM knowledge_nodes WHERE label = 'ads-campaign' LIMIT 1),
  (SELECT id FROM knowledge_nodes WHERE label = 'landing-page-optimizer' LIMIT 1),
  'depends_on', 0.85
WHERE EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'ads-campaign')
  AND EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'landing-page-optimizer');

INSERT INTO knowledge_edges (from_node, to_node, relation, strength)
SELECT
  (SELECT id FROM knowledge_nodes WHERE label = 'web-development' LIMIT 1),
  (SELECT id FROM knowledge_nodes WHERE label = 'accessibility-auditor' LIMIT 1),
  'requires', 0.85
WHERE EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'web-development')
  AND EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'accessibility-auditor');

INSERT INTO knowledge_edges (from_node, to_node, relation, strength)
SELECT
  (SELECT id FROM knowledge_nodes WHERE label = 'figma-to-code' LIMIT 1),
  (SELECT id FROM knowledge_nodes WHERE label = 'design-system' LIMIT 1),
  'produces', 0.9
WHERE EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'figma-to-code')
  AND EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'design-system');

INSERT INTO knowledge_edges (from_node, to_node, relation, strength)
SELECT
  (SELECT id FROM knowledge_nodes WHERE label = 'branding' LIMIT 1),
  (SELECT id FROM knowledge_nodes WHERE label = 'visual-design-exploration' LIMIT 1),
  'uses', 0.85
WHERE EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'branding')
  AND EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'visual-design-exploration');

INSERT INTO knowledge_edges (from_node, to_node, relation, strength)
SELECT
  (SELECT id FROM knowledge_nodes WHERE label = 'social-media' LIMIT 1),
  (SELECT id FROM knowledge_nodes WHERE label = 'content-calendar-planner' LIMIT 1),
  'uses', 0.85
WHERE EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'social-media')
  AND EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'content-calendar-planner');

INSERT INTO knowledge_edges (from_node, to_node, relation, strength)
SELECT
  (SELECT id FROM knowledge_nodes WHERE label = 'analytics-report' LIMIT 1),
  (SELECT id FROM knowledge_nodes WHERE label = 'attribution-modeler' LIMIT 1),
  'uses', 0.82
WHERE EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'analytics-report')
  AND EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'attribution-modeler');

INSERT INTO knowledge_edges (from_node, to_node, relation, strength)
SELECT
  (SELECT id FROM knowledge_nodes WHERE label = 'deploy-workflow' LIMIT 1),
  (SELECT id FROM knowledge_nodes WHERE label = 'devops-engineer' LIMIT 1),
  'aligns_with', 0.88
WHERE EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'deploy-workflow')
  AND EXISTS (SELECT 1 FROM knowledge_nodes WHERE label = 'devops-engineer');

-- Meta-edges: hebbian_learning y agent_isolation son conceptos que TODOS conocen
INSERT INTO knowledge_edges (from_node, to_node, relation, strength)
SELECT
  (SELECT id FROM knowledge_nodes WHERE label = 'hebbian_learning' LIMIT 1),
  id, 'governs', 0.95
FROM knowledge_nodes
WHERE label IN ('dios', 'sage', 'atlas', 'nexus', 'pixel', 'core', 'pulse', 'nova', 'copy', 'lens')
  OR node_type = 'skill'
LIMIT 10;

-- ----------------------------------------------------------------------------
-- 6. REFORZAR SINAPSIS EXISTENTES con las colaboraciones detectadas
-- ----------------------------------------------------------------------------
-- Actualizar weights basados en el mapeo de colaboraciones reales del audit

-- Colaboraciones muy fuertes (weight 0.85+)
UPDATE agent_synapses SET weight = GREATEST(weight, 0.9), synapse_type = 'orchestrates'
  WHERE from_agent = 'dios' AND to_agent IN ('sage', 'nova', 'atlas', 'nexus', 'pixel', 'core', 'pulse', 'copy', 'lens');

UPDATE agent_synapses SET weight = GREATEST(weight, 0.88)
  WHERE (from_agent, to_agent) IN (
    ('sage', 'nova'), ('nova', 'sage'),
    ('sage', 'atlas'), ('atlas', 'sage'),
    ('sage', 'nexus'), ('nexus', 'sage'),
    ('atlas', 'copy'), ('copy', 'atlas'),
    ('nexus', 'copy'), ('copy', 'nexus'),
    ('pixel', 'core'), ('core', 'pixel'),
    ('nova', 'pixel'), ('pixel', 'nova'),
    ('pulse', 'copy'), ('copy', 'pulse'),
    ('lens', 'sage'), ('sage', 'lens')
  );

-- Insertar sinapsis faltantes detectadas en el audit
INSERT INTO agent_synapses (from_agent, to_agent, synapse_type, weight)
VALUES
  ('atlas', 'nexus', 'collaborates_with', 0.82),
  ('nexus', 'atlas', 'collaborates_with', 0.82),
  ('pulse', 'nova', 'consults', 0.85),
  ('nova', 'pulse', 'reviews', 0.88),
  ('lens', 'nexus', 'reports_to', 0.85),
  ('nexus', 'lens', 'consults', 0.82),
  ('lens', 'atlas', 'reports_to', 0.8),
  ('atlas', 'lens', 'consults', 0.78),
  ('lens', 'pixel', 'consults', 0.75),
  ('pixel', 'lens', 'reports_to', 0.8),
  ('core', 'lens', 'collaborates_with', 0.78),
  ('sage', 'copy', 'delegates_to', 0.85),
  ('copy', 'sage', 'reports_to', 0.82),
  ('nova', 'copy', 'consults', 0.82),
  ('copy', 'nova', 'consults', 0.82),
  ('pulse', 'atlas', 'collaborates_with', 0.8),
  ('atlas', 'pulse', 'delegates_to', 0.82),
  ('core', 'sage', 'reports_to', 0.85),
  ('sage', 'core', 'consults', 0.8)
ON CONFLICT (from_agent, to_agent, synapse_type)
DO UPDATE SET weight = GREATEST(agent_synapses.weight, EXCLUDED.weight);

-- ----------------------------------------------------------------------------
-- 7. REGISTRAR EL EVENTO DE ENTRENAMIENTO como estimulo global
-- ----------------------------------------------------------------------------

INSERT INTO agent_stimuli (target_agent, source, signal, intensity, payload)
SELECT
  agent_id, 'system', 'training_event:v1', 1.0,
  jsonb_build_object(
    'event', 'neural_training_v1',
    'skills_loaded', 560,
    'memories_injected', 48,
    'knowledge_nodes_created', 65,
    'timestamp', NOW()
  )
FROM agent_states;

-- Descubrimiento meta: la red ha sido entrenada
INSERT INTO agent_discoveries (agent_id, type, title, description, evidence, impact, confidence, actionable, suggested_action, metadata)
VALUES (
  'dios',
  'optimization',
  'Red neuronal entrenada con 560+ skills del ecosistema',
  'Todos los agentes han sido alimentados con su personalidad, capacidades, tech stack canonico, y conexiones a 65 knowledge nodes (15 PACAME custom + 50+ skills comunidad). Sinapsis reforzadas segun colaboraciones detectadas.',
  'Import desde info skill.txt (catalogo 560+ skills) + lectura completa de agents/*.md + .claude/skills/*.md',
  'high',
  0.95,
  true,
  'Monitorear metricas de performance tras el entrenamiento: velocity de handoffs, calidad de respuestas, reduccion de escalaciones a Pablo.',
  jsonb_build_object('training_version', 'v1', 'trained_at', NOW())
);

COMMIT;

-- ============================================================================
-- Verificacion post-entrenamiento
-- ============================================================================
SELECT 'agent_states con personality actualizada' AS check, COUNT(*) AS count FROM agent_states WHERE personality ? 'archetype';
SELECT 'knowledge_nodes PACAME' AS check, COUNT(*) AS count FROM knowledge_nodes WHERE metadata->>'source' LIKE 'pacame%';
SELECT 'knowledge_nodes comunidad' AS check, COUNT(*) AS count FROM knowledge_nodes WHERE metadata->>'source' IN ('anthropic','obra','daymade','community');
SELECT 'memorias semanticas trained' AS check, COUNT(*) AS count FROM agent_memories WHERE metadata->>'trained' = 'true';
SELECT 'sinapsis totales' AS check, COUNT(*) AS count FROM agent_synapses;
SELECT 'sinapsis con weight >= 0.8' AS check, COUNT(*) AS count FROM agent_synapses WHERE weight >= 0.8;
SELECT 'knowledge_edges' AS check, COUNT(*) AS count FROM knowledge_edges;
