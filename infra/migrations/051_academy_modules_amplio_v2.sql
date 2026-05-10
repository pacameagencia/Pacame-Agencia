-- 051_academy_modules_amplio_v2.sql
-- Dark Academy v2 — giro de scope · pasa de vertical IA cine a stack creativo digital AMPLIO.
--
-- Razón (2026-05-10): Pablo aclara que Dark Room cubre dropshippers + editores foto/video
-- clásicos + IA generativa + e-commerce + marketing. La academia debe reflejar esa amplitud.
--
-- Plan maestro v2: strategy/darkroom/academy/curriculum.md v2.
-- Migración idempotente · UPDATE no destructivo · sin DROP de tablas.

-- ─── Update módulos · títulos + descripciones + pesos v2 ───────

UPDATE academy_modules
   SET title       = 'Tu stack creativo digital · panorámica',
       description = 'Panorámica de las 6 disciplinas + cómo decidir antes de hacer + setup primeras 3 cuentas críticas.',
       weight_pct  = 15.00,
       pct_start   = 0.00,
       pct_end     = 15.00
 WHERE id = 'M1';

UPDATE academy_modules
   SET title       = 'Foto, diseño y edición clásica',
       slug        = 'foto-diseno-edicion-clasica',
       description = 'Photoshop, Lightroom, Figma, Canva, Illustrator. Mockups + branding mínimo + decisión Photoshop vs IA.',
       weight_pct  = 20.00,
       pct_start   = 15.00,
       pct_end     = 35.00
 WHERE id = 'M2';

UPDATE academy_modules
   SET title       = 'Video · edit clásico + IA generativa',
       slug        = 'video-edit-clasico-ia',
       description = 'Premiere, DaVinci Resolve, CapCut, After Effects, Topaz Video AI + Seedance, Kling, Cinematic Studio. Decision Tree formato.',
       weight_pct  = 20.00,
       pct_start   = 35.00,
       pct_end     = 55.00
 WHERE id = 'M3';

UPDATE academy_modules
   SET title       = 'IA generativa amplia',
       slug        = 'ia-generativa-amplia',
       description = 'Higgsfield Soul, Nano Banana Pro, Midjourney, ChatGPT, Claude, ElevenLabs. Three-Pass Review 26 markers.',
       weight_pct  = 15.00,
       pct_start   = 55.00,
       pct_end     = 70.00
 WHERE id = 'M4';

UPDATE academy_modules
   SET title       = 'E-commerce y dropshipping',
       slug        = 'ecommerce-dropshipping',
       description = 'Shopify desde cero, suppliers (CJ Dropshipping, Spocket, Zendrop), product research, mockups IA, primer test ads.',
       weight_pct  = 15.00,
       pct_start   = 70.00,
       pct_end     = 85.00
 WHERE id = 'M5';

UPDATE academy_modules
   SET title       = 'Marketing, ads y monetización',
       slug        = 'marketing-ads-monetizacion',
       description = 'Meta Ads, TikTok Ads, Google Ads, copywriting honesto, funnels, email marketing, marco honesto de precios €.',
       weight_pct  = 15.00,
       pct_start   = 85.00,
       pct_end     = 100.00
 WHERE id = 'M6';

-- ─── Update lead magnets · alineados al scope v2 ───────────────

UPDATE academy_lead_magnets
   SET slug        = 'mapa-stack-creativo-digital-2026',
       title       = 'Mapa del stack creativo digital 2026',
       description = '30+ herramientas agrupadas en 6 disciplinas: foto/diseño, video clásico+IA, IA generativa, e-commerce, marketing, automatización. PDF 1 página.',
       capture_url = '/academia/lead-magnet/mapa-stack-creativo-digital-2026',
       asset_url   = 'academy-public/lm-m1-stack-2026.pdf'
 WHERE id = 'lm-m1-stack-2026';

UPDATE academy_lead_magnets
   SET slug        = '50-atajos-photoshop-figma-canva',
       title       = '50 atajos Photoshop + Figma + Canva',
       description = 'Cheat sheet imprimible con los atajos que cubren el 90% del trabajo diario en edición foto y diseño.',
       capture_url = '/academia/lead-magnet/50-atajos-photoshop-figma-canva'
 WHERE id = 'lm-m2-20-prompts';

UPDATE academy_lead_magnets
   SET slug        = 'decision-tree-video',
       title       = 'Decision Tree video · edit clásico vs IA generativa',
       description = 'Mapa visual para decidir antes de empezar: ¿edit en Premiere o generar con Seedance? Tabla de formatos + costes reales.',
       capture_url = '/academia/lead-magnet/decision-tree-video'
 WHERE id = 'lm-m3-three-pass-review';

UPDATE academy_lead_magnets
   SET slug        = 'three-pass-review-checklist',
       title       = 'Checklist Three-Pass Review · 26 markers anti-AI-look',
       description = 'Lista para imprimir y ticar en cada pieza IA. Detecta los 26 markers que delatan output de IA antes de publicar.',
       capture_url = '/academia/lead-magnet/three-pass-review-checklist',
       module_id   = 'M4'
 WHERE id = 'lm-m4-decision-tree';

UPDATE academy_lead_magnets
   SET slug        = 'checklist-lanzamiento-shopify',
       title       = 'Checklist lanzamiento Shopify · 40 puntos pre-go-live',
       description = 'Los 40 puntos que tienes que ticar antes de abrir tu tienda al público. Pagos, envíos, fichas, legal, ads.',
       capture_url = '/academia/lead-magnet/checklist-lanzamiento-shopify',
       module_id   = 'M5'
 WHERE id = 'lm-m5-30-piezas';

-- M6 ya estaba bien · solo refrescamos description
UPDATE academy_lead_magnets
   SET description = 'Starter 300€ · Standard 600-1.200€ · Premium 1.500-3.000€ · Retainer 800-2.000€/mes. Con anti-promesas explícitas y comparativa europea.'
 WHERE id = 'lm-m6-precios-honestos';

-- ─── Notas ────────────────────────────────────────────────────

COMMENT ON TABLE academy_modules IS
  'Dark Academy v2 · 6 módulos amplios que cubren foto/diseño, video clásico+IA, IA generativa, e-commerce, marketing. Pesos suman 100%.';
COMMENT ON TABLE academy_lead_magnets IS
  'Dark Academy v2 · 6 lead magnets alineados a scope amplio. M1=mapa stack amplio, M2=atajos foto/diseño, M3=decision tree video, M4=Three-Pass anti-AI, M5=Shopify launch, M6=precios honestos.';
