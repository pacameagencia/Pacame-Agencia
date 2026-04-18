-- Migration 020: Expansion del catalogo — 18 productos nuevos sin codigo.
-- Aplicada via Supabase MCP apply_migration.
-- Todos usan runners declarativos existentes (llm_text/llm_structured/llm_image/llm_image_multi/html_zip_render).
-- Los 2 'custom' (brand-guidelines-mini PDF, favicon-pack ya existente) tendran clase TS en Sprint 7 si se priorizan.
-- Resultado: 6 productos iniciales → 24 productos activos.

-- Los inserts originales estan aplicados en Supabase. Este archivo documenta el contenido para version control.
-- Si necesitas re-aplicar: usar las VALUES del Supabase MCP log, o re-ejecutar via dashboard SQL editor.

-- ═════ COPY & CONTENT (4 productos) ═════
-- bio-instagram (19€, copy, llm_structured)
-- post-tiktok (25€, pulse, llm_structured, featured)
-- post-linkedin (29€, copy, llm_structured)
-- caption-optimization (15€, copy, llm_structured)

-- ═════ WEB & LANDING (2 productos) ═════
-- thank-you-page (29€, pixel, html_zip_render)
-- 404-page (19€, pixel, html_zip_render)

-- ═════ BRANDING (2 productos) ═════
-- color-palette (29€, nova, llm_structured)
-- brand-guidelines-mini (79€, nova, custom — requiere clase TS Sprint 7)

-- ═════ SEO (3 productos) ═════
-- meta-tags-optimization (39€, atlas, llm_structured)
-- schema-markup-setup (39€, atlas, llm_structured)
-- google-business-setup (49€, sage, llm_structured, featured)

-- ═════ ADS (2 productos) ═════
-- meta-pixel-setup (39€, nexus, llm_structured)
-- utm-strategy (19€, lens, llm_structured)

-- ═════ APPS / AUTOMATIZACIONES (2 productos) ═════
-- whatsapp-button (19€, core, llm_structured)
-- contact-form-setup (29€, core, html_zip_render)

-- ═════ ANALYTICS (1 producto) ═════
-- ga4-setup (49€, lens, llm_structured)

-- ═════ TEMPLATES (2 productos) ═════
-- email-sequence-5 (49€, copy, llm_structured, featured)
-- newsletter-1-month (39€, copy, llm_structured)

-- Updates a subscription_plans.included_services para referenciar nuevos slugs:
-- start (29/mes): post-instagram, bio-instagram
-- pro (99/mes): 6 productos (social + copy + SEO basico)
-- growth (249/mes): 11 productos (+ analytics + ads + email)
-- scale (599/mes): 21 productos (catalogo quasi-completo)

-- Ver migracion en produccion:
--   SELECT slug, name, price_cents/100 as eur, agent_id, category, runner_type, is_featured
--   FROM service_catalog WHERE is_active=true ORDER BY sort_order;
