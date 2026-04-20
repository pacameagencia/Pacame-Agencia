-- ============================================================
-- Migration 009: Seed Marketplace (6 productos entry)
-- Ejecutar DESPUES de 008_marketplace.sql
-- ============================================================

-- 1. LOGO EXPRESS (49€, Nova, 2h)
INSERT INTO service_catalog (
  slug, name, tagline, description, price_cents, agent_id,
  delivery_sla_hours, deliverable_kind, revisions_included,
  inputs_schema, features, faq, sort_order, is_active
) VALUES (
  'logo-express',
  'Logo Express',
  'Tu logo profesional en 2 horas',
  'Nuestra IA Nova crea 3 variantes unicas de logo adaptadas a tu marca. Incluye versiones PNG, SVG y fondo transparente. 2 revisiones incluidas.',
  4900,
  'nova',
  2,
  'logo_pack',
  2,
  '{
    "type":"object",
    "required":["business_name","vibe","color_preference"],
    "properties":{
      "business_name":{"type":"string","title":"Nombre del negocio","minLength":2,"maxLength":80},
      "tagline":{"type":"string","title":"Eslogan (opcional)","maxLength":120},
      "vibe":{"type":"array","title":"Estilo (marca 1-3)","items":{"type":"string","enum":["moderno","minimalista","elegante","divertido","tecnologico","artesanal","corporativo","natural","urbano","lujo"]},"minItems":1,"maxItems":3},
      "color_preference":{"type":"string","title":"Preferencia de colores","enum":["azul_corporate","verde_natural","negro_premium","rojo_energia","pastel_suave","monocromo","libre"]},
      "avoid":{"type":"string","title":"Que evitar","maxLength":200},
      "references":{"type":"string","title":"Referencias/inspiracion (URLs)","maxLength":500}
    }
  }'::jsonb,
  '["3 variantes unicas","PNG alta resolucion","SVG vectorial","Fondo transparente","2 revisiones incluidas","Entrega en 2h","Garantia 100%"]'::jsonb,
  '[
    {"q":"En cuanto tiempo recibo mi logo?","a":"En menos de 2 horas desde que completes el brief. Normalmente en 30-60 minutos."},
    {"q":"Incluye versiones editables?","a":"Si, te entregamos SVG vectorial editable + PNG en alta resolucion + fondo transparente."},
    {"q":"Puedo pedir revisiones?","a":"Si, incluimos 2 revisiones gratuitas. Si necesitas mas, hablamos."},
    {"q":"Quien hace el logo?","a":"Nuestra IA Nova entrenada para branding, supervisada por Pablo en caso de dudas."}
  ]'::jsonb,
  10,
  TRUE
) ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, tagline=EXCLUDED.tagline, description=EXCLUDED.description,
  price_cents=EXCLUDED.price_cents, inputs_schema=EXCLUDED.inputs_schema,
  features=EXCLUDED.features, faq=EXCLUDED.faq, updated_at=NOW();


-- 2. FAVICON PACK (19€, Nova, 1h)
INSERT INTO service_catalog (
  slug, name, tagline, description, price_cents, agent_id,
  delivery_sla_hours, deliverable_kind, revisions_included,
  inputs_schema, features, faq, sort_order, is_active
) VALUES (
  'favicon-pack',
  'Favicon Pack',
  'Kit completo de favicons para tu web',
  'Generamos tu favicon en todos los tamanos necesarios: 16, 32, 64, 192, 512px + Apple touch icon + manifest.json. Listos para subir a tu web.',
  1900,
  'nova',
  1,
  'favicon_pack',
  1,
  '{
    "type":"object",
    "required":["source"],
    "properties":{
      "source":{"type":"string","title":"De donde partir","enum":["logo_upload","logo_express_order","from_scratch"]},
      "logo_upload_url":{"type":"string","title":"URL del logo (si subes uno)","format":"uri"},
      "logo_express_order_id":{"type":"string","title":"ID de pedido Logo Express (si compraste)"},
      "business_name":{"type":"string","title":"Nombre negocio (si from scratch)","maxLength":40},
      "color":{"type":"string","title":"Color principal (hex)","pattern":"^#[0-9a-fA-F]{6}$"}
    }
  }'::jsonb,
  '["favicon.ico","PNG 16/32/64/192/512px","Apple touch icon 180px","manifest.json","Listo para subir","Entrega en 1h"]'::jsonb,
  '[
    {"q":"Como instalo los favicons en mi web?","a":"Te damos un archivo ZIP con instrucciones de instalacion por tipo de web (HTML, WordPress, Next.js, etc.)"},
    {"q":"Que formatos incluye?","a":"favicon.ico tradicional + PNGs en todos los tamanos modernos + Apple touch icon + manifest.json para PWA."}
  ]'::jsonb,
  20,
  TRUE
) ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, tagline=EXCLUDED.tagline, description=EXCLUDED.description,
  price_cents=EXCLUDED.price_cents, inputs_schema=EXCLUDED.inputs_schema,
  features=EXCLUDED.features, faq=EXCLUDED.faq, updated_at=NOW();


-- 3. LANDING 1 PAGINA (79€, Pixel, 24h)
INSERT INTO service_catalog (
  slug, name, tagline, description, price_cents, agent_id,
  delivery_sla_hours, deliverable_kind, revisions_included,
  inputs_schema, features, faq, sort_order, is_active
) VALUES (
  'landing-1page',
  'Landing 1 Pagina',
  'Landing profesional lista para lanzar en 24h',
  'Pixel crea una landing de una pagina optimizada para conversion: hero + propuesta de valor + social proof + CTA + footer. HTML + CSS + responsive. Lista para subir.',
  7900,
  'pixel',
  24,
  'html_zip',
  2,
  '{
    "type":"object",
    "required":["business_name","service","target_audience","main_cta"],
    "properties":{
      "business_name":{"type":"string","title":"Nombre del negocio","maxLength":80},
      "service":{"type":"string","title":"Que ofreces","maxLength":200},
      "target_audience":{"type":"string","title":"A quien te diriges","maxLength":200},
      "main_cta":{"type":"string","title":"Llamada a la accion principal","maxLength":60},
      "unique_value":{"type":"string","title":"Tu ventaja unica (que te diferencia)","maxLength":300},
      "brand_colors":{"type":"string","title":"Colores de marca (hex separados por coma)","maxLength":50},
      "logo_url":{"type":"string","title":"URL de tu logo (opcional)","format":"uri"},
      "tone":{"type":"string","title":"Tono","enum":["profesional","cercano","divertido","lujo","tecnico"]}
    }
  }'::jsonb,
  '["Hero seccion impactante","Propuesta de valor clara","Social proof section","CTA optimizado para conversion","Responsive mobile/tablet","HTML + CSS listos para subir","2 revisiones incluidas","Entrega en 24h"]'::jsonb,
  '[
    {"q":"Me dais el codigo o solo la vista?","a":"Te damos el ZIP con HTML, CSS y assets. Puedes subirlo a cualquier hosting o nosotros te podemos hacer el deploy por un extra."},
    {"q":"Es editable?","a":"Si, HTML plano. Si necesitas que sea editable tipo WordPress/Elementor, hablamos."},
    {"q":"Incluye dominio y hosting?","a":"No en este producto. Mira nuestro plan Start (29€/mes) que incluye hosting + dominio + mantenimiento."}
  ]'::jsonb,
  30,
  TRUE
) ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, tagline=EXCLUDED.tagline, description=EXCLUDED.description,
  price_cents=EXCLUDED.price_cents, inputs_schema=EXCLUDED.inputs_schema,
  features=EXCLUDED.features, faq=EXCLUDED.faq, updated_at=NOW();


-- 4. COPY HERO + CTA (39€, Copy, 30 min)
INSERT INTO service_catalog (
  slug, name, tagline, description, price_cents, agent_id,
  delivery_sla_hours, deliverable_kind, revisions_included,
  inputs_schema, features, faq, sort_order, is_active
) VALUES (
  'copy-hero-cta',
  'Copy Hero + CTA',
  'Copy de impacto para tu home en 30 minutos',
  'Nuestra IA Copy escribe 3 variantes de copy para tu hero: titular, subtitulo y llamada a la accion. Optimizado para conversion.',
  3900,
  'copy',
  1,
  'text',
  2,
  '{
    "type":"object",
    "required":["business","audience","main_benefit"],
    "properties":{
      "business":{"type":"string","title":"Que hace tu negocio","maxLength":200},
      "audience":{"type":"string","title":"A quien te diriges","maxLength":200},
      "main_benefit":{"type":"string","title":"Principal beneficio/transformacion","maxLength":200},
      "current_copy":{"type":"string","title":"Copy actual (si tienes)","maxLength":500},
      "tone":{"type":"string","title":"Tono","enum":["profesional","cercano","agresivo","inspirador","tecnico","divertido"]},
      "avoid":{"type":"string","title":"Que evitar","maxLength":200}
    }
  }'::jsonb,
  '["3 variantes de titular","3 subtitulos","3 CTAs optimizados","Justificacion estrategica","2 revisiones incluidas","Entrega en 30 min"]'::jsonb,
  '[
    {"q":"Como me entregais el copy?","a":"Documento con 3 variantes completas (hero + subtitulo + CTA) + explicacion de cada una para que elijas la mejor."},
    {"q":"Puedo pedir revisiones?","a":"Si, 2 revisiones incluidas por si quieres ajustar tono o mensaje."}
  ]'::jsonb,
  40,
  TRUE
) ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, tagline=EXCLUDED.tagline, description=EXCLUDED.description,
  price_cents=EXCLUDED.price_cents, inputs_schema=EXCLUDED.inputs_schema,
  features=EXCLUDED.features, faq=EXCLUDED.faq, updated_at=NOW();


-- 5. AUDITORIA SEO PDF (29€, Atlas, 2h)
INSERT INTO service_catalog (
  slug, name, tagline, description, price_cents, agent_id,
  delivery_sla_hours, deliverable_kind, revisions_included,
  inputs_schema, features, faq, sort_order, is_active
) VALUES (
  'seo-audit-pdf',
  'Auditoria SEO Express',
  'Informe SEO profesional en PDF en 2h',
  'Atlas audita tu web: velocidad, on-page, backlinks, competencia, keywords. Entrega informe PDF con diagnostico + plan de accion.',
  2900,
  'atlas',
  2,
  'pdf',
  1,
  '{
    "type":"object",
    "required":["website_url","main_keywords"],
    "properties":{
      "website_url":{"type":"string","title":"URL de tu web","format":"uri"},
      "main_keywords":{"type":"string","title":"Keywords principales (separadas por coma)","maxLength":200},
      "competitors":{"type":"string","title":"Competidores (URLs separadas por coma)","maxLength":500},
      "main_goal":{"type":"string","title":"Objetivo principal SEO","enum":["mas_trafico","mejor_posicionamiento","convertir_mas","reputacion_marca","local_seo"]},
      "target_location":{"type":"string","title":"Ubicacion objetivo","maxLength":100}
    }
  }'::jsonb,
  '["Analisis tecnico (velocidad, mobile, indexacion)","Analisis on-page (titles, meta, headings)","Keywords research","Analisis de competencia","Plan de accion priorizado","PDF profesional 10-15 paginas","Entrega en 2h"]'::jsonb,
  '[
    {"q":"Que incluye el informe?","a":"Analisis tecnico, on-page, keywords, competencia, backlinks detectables y plan de accion priorizado. 10-15 paginas."},
    {"q":"Ejecutais vosotros el plan?","a":"En este producto solo entregamos el diagnostico. Si quieres que lo ejecutemos, mira nuestro plan Pro o Growth."}
  ]'::jsonb,
  50,
  TRUE
) ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, tagline=EXCLUDED.tagline, description=EXCLUDED.description,
  price_cents=EXCLUDED.price_cents, inputs_schema=EXCLUDED.inputs_schema,
  features=EXCLUDED.features, faq=EXCLUDED.faq, updated_at=NOW();


-- 6. POST INSTAGRAM (19€, Pulse, 1h)
INSERT INTO service_catalog (
  slug, name, tagline, description, price_cents, agent_id,
  delivery_sla_hours, deliverable_kind, revisions_included,
  inputs_schema, features, faq, sort_order, is_active
) VALUES (
  'post-instagram',
  'Post Instagram',
  'Post profesional listo para publicar en 1h',
  'Pulse crea tu post de Instagram: imagen + caption + hashtags optimizados. Listo para publicar y con alto engagement.',
  1900,
  'pulse',
  1,
  'social_post',
  1,
  '{
    "type":"object",
    "required":["topic","goal","business_name"],
    "properties":{
      "business_name":{"type":"string","title":"Nombre del negocio","maxLength":80},
      "topic":{"type":"string","title":"Tema del post","maxLength":200},
      "goal":{"type":"string","title":"Objetivo","enum":["engagement","ventas","educativo","branding","lanzamiento"]},
      "tone":{"type":"string","title":"Tono","enum":["profesional","cercano","divertido","inspirador","tecnico"]},
      "include_image":{"type":"boolean","title":"Incluir imagen generada IA","default":true},
      "image_style":{"type":"string","title":"Estilo imagen (si incluida)","enum":["fotografico","ilustracion","minimalista","colorido","vintage"]},
      "brand_colors":{"type":"string","title":"Colores de marca (hex)","maxLength":50},
      "cta":{"type":"string","title":"Call to action","maxLength":100}
    }
  }'::jsonb,
  '["Imagen generada IA optimizada para IG (1:1)","Caption largo optimizado","Hashtags estrategicos (30)","Sugerencia hora de publicacion","Entrega en 1h"]'::jsonb,
  '[
    {"q":"Lo publicais vosotros?","a":"Podemos, si tienes cuenta vinculada. O te entregamos imagen + caption para que lo publiques tu."},
    {"q":"Que resolucion tiene la imagen?","a":"1080x1080px (cuadrado IG). Podemos hacer formato story si lo necesitas."}
  ]'::jsonb,
  60,
  TRUE
) ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, tagline=EXCLUDED.tagline, description=EXCLUDED.description,
  price_cents=EXCLUDED.price_cents, inputs_schema=EXCLUDED.inputs_schema,
  features=EXCLUDED.features, faq=EXCLUDED.faq, updated_at=NOW();

-- FIN Migration 009 Seed
