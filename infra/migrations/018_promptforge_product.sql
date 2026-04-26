-- 018_promptforge_product.sql
-- Segundo micronicho de la factoría PACAME: PromptForge.
-- Mejorador de prompts NASA-tier para texto, imagen y video, con targets
-- específicos (ChatGPT, Claude, Midjourney, Sora, Veo3, Runway, etc.)
-- y output con variantes A/B/C que el user compara.

-- 1. Catálogo: insertar PromptForge como nuevo producto
INSERT INTO pacame_products (id, name, tagline, category, owner_agent, status, pricing, trial_days, features, marketing)
VALUES (
  'promptforge',
  'PromptForge',
  'Tu idea en bruto → prompt de cinco estrellas',
  'productividad',
  'copy',
  'beta',
  '[
    {"tier":"starter","name":"Starter","price_eur":9,"interval":"month","limits":{"prompts_per_month":50,"variants_per_prompt":2,"video_targets":false,"api":false},"stripe_price_id":null},
    {"tier":"pro","name":"Pro","price_eur":19,"interval":"month","limits":{"prompts_per_month":500,"variants_per_prompt":3,"video_targets":true,"api":false},"stripe_price_id":null,"recommended":true},
    {"tier":"studio","name":"Studio","price_eur":49,"interval":"month","limits":{"prompts_per_month":-1,"variants_per_prompt":5,"video_targets":true,"api":true},"stripe_price_id":null}
  ]'::jsonb,
  7,
  '[
    "Mejora prompts para 14 modelos: Claude · GPT · Midjourney · DALL·E · Flux · SDXL · Sora · Veo · Runway · Kling · Luma · Pika · Suno · ElevenLabs",
    "Genera 2-5 variantes A/B/C que puedes comparar y elegir",
    "Análisis del prompt original: qué le falta, ambigüedades, técnicas avanzadas que aplicar",
    "Modo experto: chain-of-thought, prompt caching, tool use hints, length control",
    "Plantillas por uso: marketing, ads, branding, código, educación, narrativa, fotografía, mockups",
    "Historial completo con búsqueda + favoritos + carpetas",
    "Detecta tu idioma y mantiene el tono (no fuerza inglés)",
    "Tier Studio: API REST para integrar en tus pipelines"
  ]'::jsonb,
  '{
    "hero_headline":"Escribe la idea. PromptForge te da el prompt que el modelo entiende.",
    "hero_sub":"Pegas la idea cruda. Eliges target (Claude, Midjourney, Sora, Veo, lo que sea). Recibes 2-5 variantes profesionales con análisis técnico. 7 días gratis sin tarjeta.",
    "target_persona":"Creators, marketers, devs y agencias que generan prompts a diario y necesitan calidad consistente",
    "pain_quote":"Mi prompt funciona la mitad de las veces. La otra mitad pierdo 20 minutos iterando hasta que sale algo decente.",
    "primary_color":"#283B70",
    "accent_color":"#E8B730",
    "trial_cta":"Prueba 7 días gratis"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  pricing = EXCLUDED.pricing,
  features = EXCLUDED.features,
  marketing = EXCLUDED.marketing,
  trial_days = EXCLUDED.trial_days,
  status = EXCLUDED.status;

-- 2. Tabla de historial de prompts mejorados
CREATE TABLE IF NOT EXISTS promptforge_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES pacame_product_users(id) ON DELETE CASCADE,
  modality text NOT NULL CHECK (modality IN ('text', 'image', 'video', 'audio')),
  target text NOT NULL,                   -- 'claude' | 'gpt' | 'midjourney' | 'sora' | 'veo' | ...
  use_case text,                          -- 'marketing' | 'ads' | 'narrative' | 'code' | 'photo' | ...
  raw_input text NOT NULL,                -- lo que el user escribió (max 4000 chars)
  context_notes text,                     -- info extra (audiencia, tono, restricciones)
  enhanced_prompts jsonb NOT NULL,        -- [{title, prompt, why_it_works, technique_tags}]
  analysis jsonb,                         -- {strengths_original, gaps_detected, suggestions}
  starred boolean DEFAULT false,
  folder text,
  llm_provider text,
  llm_model text,
  tokens_used integer,
  cost_usd numeric(10, 4),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pfp_user_created ON promptforge_prompts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pfp_user_starred ON promptforge_prompts(user_id, created_at DESC) WHERE starred = true;
CREATE INDEX IF NOT EXISTS idx_pfp_user_folder ON promptforge_prompts(user_id, folder) WHERE folder IS NOT NULL;

-- 3. Plantillas predefinidas (catálogo público que el user puede clonar/personalizar)
CREATE TABLE IF NOT EXISTS promptforge_templates (
  id text PRIMARY KEY,                    -- 'photo-product-shot' | 'ad-meta-hook' | ...
  modality text NOT NULL,
  target text,                            -- target sugerido (puede ser null si vale para varios)
  use_case text,
  title text NOT NULL,
  description text,
  example_input text,
  enhanced_template text NOT NULL,        -- prompt template con {{vars}}
  variables jsonb DEFAULT '[]'::jsonb,    -- [{name, label, type, options?}]
  popularity integer DEFAULT 0,
  is_pro boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Seed: 8 plantillas iniciales (las top demandadas por creators)
INSERT INTO promptforge_templates (id, modality, target, use_case, title, description, enhanced_template, variables) VALUES
  (
    'photo-product-shot',
    'image',
    'midjourney',
    'photo',
    'Producto en escena cinematográfica',
    'Foto producto con luz cinematográfica, fondo coherente con el target.',
    'Cinematic product photography of {{product}}, {{setting}}, soft volumetric lighting, shallow depth of field f/1.8, hasselblad medium format, golden hour rim light, hyperdetailed material textures, magazine editorial style --ar 4:5 --style raw --v 6.1',
    '[{"name":"product","label":"Producto","type":"text","placeholder":"botella de aceite de oliva premium"},{"name":"setting","label":"Escenario","type":"text","placeholder":"sobre madera de roble con ramita de tomillo"}]'
  ),
  (
    'ad-meta-hook',
    'text',
    'claude',
    'ads',
    'Hook de Meta Ads alta conversión',
    'Genera 5 hooks para anuncio Meta optimizados para 3-segundos de atención.',
    'Eres un copywriter senior especializado en Meta Ads para PYMEs españolas. Genera 5 hooks (primer línea del anuncio) para vender {{product}} a {{audience}}. Cada hook: 8-15 palabras, sin clichés, sin emojis innecesarios, con un giro inesperado o pregunta provocadora. Devuelve numerados 1-5 sin explicación.',
    '[{"name":"product","label":"Qué vendes","type":"textarea","placeholder":"curso de fotografía móvil para emprendedores"},{"name":"audience","label":"A quién","type":"text","placeholder":"freelancers 25-40 que venden por Instagram"}]'
  ),
  (
    'video-cinematic-30s',
    'video',
    'veo',
    'narrative',
    'Spot cinematográfico 30 segundos',
    'Veo3 prompt para spot 30s con shot list y sound design.',
    'A 30-second cinematic commercial about {{topic}}. Shot 1 (0-5s): wide establishing aerial of {{location}} at golden hour, slow camera dolly in. Shot 2 (5-15s): medium close-up of {{subject}}, shallow DoF, natural sound design with ambient {{ambient}}. Shot 3 (15-25s): macro detail shot of {{detail}} with rim light. Shot 4 (25-30s): {{climax}} with subtle voiceover whispering "{{tagline}}". Cinematic color grade, 35mm anamorphic lens, no text overlays.',
    '[{"name":"topic","label":"Tema","type":"text"},{"name":"location","label":"Localización","type":"text"},{"name":"subject","label":"Sujeto","type":"text"},{"name":"ambient","label":"Sonido ambiente","type":"text"},{"name":"detail","label":"Detalle macro","type":"text"},{"name":"climax","label":"Clímax visual","type":"text"},{"name":"tagline","label":"Tagline","type":"text"}]'
  ),
  (
    'logo-brand-identity',
    'image',
    'midjourney',
    'branding',
    'Logo modular con sistema visual',
    'Logo + paleta + tipografía como sistema, no solo símbolo aislado.',
    'Brand identity sheet for {{brand_name}}: minimalist geometric logomark suitable for {{industry}}, paired with {{font_style}} wordmark. Show 3 variations on neutral background. Color palette: {{palette_hint}}. Style: {{aesthetic}}, balanced negative space, vector-clean. Layout: editorial grid presentation. --ar 16:9 --v 6.1',
    '[{"name":"brand_name","label":"Nombre marca","type":"text"},{"name":"industry","label":"Sector","type":"text","placeholder":"hostelería · clínica dental · fitness"},{"name":"font_style","label":"Estilo tipo","type":"text","placeholder":"serif moderno con personalidad"},{"name":"palette_hint","label":"Paleta","type":"text","placeholder":"terracota cálido + crema"},{"name":"aesthetic","label":"Estética","type":"text","placeholder":"Spanish modernism, Cruz Novillo"}]'
  ),
  (
    'instagram-carousel-hook',
    'text',
    'claude',
    'marketing',
    'Carrusel Instagram 8 slides educativo',
    'Estructura completa carrusel con hook, payoff y CTA.',
    'Crea un carrusel Instagram de 8 slides sobre {{topic}} para {{audience}}. Estructura: Slide 1 hook que pare scroll (8 palabras max), slide 2 contexto/dato concreto, slides 3-7 puntos accionables (uno por slide, frase + 1 ejemplo), slide 8 CTA suave. Tono: directo, sin clichés, tutea, frases cortas. Devuelve numerado con título visual + cuerpo.',
    '[{"name":"topic","label":"Tema","type":"text"},{"name":"audience","label":"Audiencia","type":"text"}]'
  ),
  (
    'code-prompt-engineer',
    'text',
    'claude',
    'code',
    'Refactor de código con análisis previo',
    'Prompt que pide análisis antes de tocar código (evita refactor a ciegas).',
    'Eres un senior engineer revisando este código:\n\n```{{lang}}\n{{code}}\n```\n\nAntes de refactorizar, analiza:\n1. Smells visibles (3 max, ordenados por impacto)\n2. Asunciones que no se pueden verificar sin más contexto\n3. Tests que harían falta para garantizar que el refactor no rompe nada\n\nDespués propón el refactor con diff conceptual. NO me des código entero hasta que confirme la dirección. Mantén pragmatismo: no refactorices lo que está bien.',
    '[{"name":"lang","label":"Lenguaje","type":"select","options":["typescript","python","go","rust","java","sql"]},{"name":"code","label":"Código","type":"textarea"}]'
  ),
  (
    'sora-realistic-portrait',
    'video',
    'sora',
    'photo',
    'Sora retrato hiperrealista 10s',
    'Vídeo retrato 10s con micro-movimiento, no rígido.',
    'Hyperrealistic close-up portrait of {{subject}}, {{mood}}, natural micro-expressions, blink every 4 seconds, subtle head tilt, soft window light from camera left, shallow depth of field, 50mm lens. Background: {{background}} slightly out of focus. Color grade: {{grade}}. 10 seconds, locked camera, no zoom. Audio: ambient room tone, no music, no dialogue.',
    '[{"name":"subject","label":"Sujeto","type":"text","placeholder":"chef español 50s con mandil de lino"},{"name":"mood","label":"Estado de ánimo","type":"text","placeholder":"reflexivo, ligeramente sonriente"},{"name":"background","label":"Fondo","type":"text","placeholder":"cocina industrial con vapor"},{"name":"grade","label":"Color grade","type":"text","placeholder":"warm filmic, Kodak Portra"}]'
  ),
  (
    'voice-elevenlabs-narrator',
    'audio',
    'elevenlabs',
    'narrative',
    'Narrador ElevenLabs con prosodia',
    'Texto con marcadores SSML/prosodia para voz natural no robótica.',
    'Texto narrado en español, voz {{voice_style}}, ritmo {{pace}}.\n\n{{script}}\n\nMarcadores prosodia:\n- Pausas largas con [...] entre frases clave\n- Énfasis con CAPITALIZACIÓN en palabras decisivas\n- Cambios de tempo con — guión largo —\n- Respiración natural cada 12-15 palabras (no marcar, solo escribir frases con esa cadencia)\n\nNo añadir efectos sonoros. Solo voz. Total: {{duration_sec}} segundos aproximados a {{wpm}} palabras/minuto.',
    '[{"name":"script","label":"Texto base","type":"textarea"},{"name":"voice_style","label":"Estilo voz","type":"text","placeholder":"profunda, cercana, hombre 35-45"},{"name":"pace","label":"Ritmo","type":"select","options":["pausado","normal","ágil"]},{"name":"duration_sec","label":"Duración (s)","type":"number","placeholder":"30"},{"name":"wpm","label":"Palabras/min","type":"number","placeholder":"150"}]'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  enhanced_template = EXCLUDED.enhanced_template,
  variables = EXCLUDED.variables;

COMMENT ON TABLE promptforge_prompts IS
  'Historial de prompts mejorados por user. enhanced_prompts es array de variantes A/B/C que el user puede comparar.';
COMMENT ON TABLE promptforge_templates IS
  'Catálogo público de plantillas pre-construidas. enhanced_template tiene {{vars}} que el user rellena.';
