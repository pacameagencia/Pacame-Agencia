# Dark Room · Knowledge Integration v1.0

> **Origen**: lectura exhaustiva CONOCIMIENTO PROMPT IA.txt (6907 líneas) realizada 2026-05-08 tras feedback Pablo "has leído el txt de principio a fin?".
> **Hallazgos previos** (21) eran subset · este doc consolida los **50+ hallazgos completos** extraídos línea por línea.
> **Orden**: críticos para concept 005 v3 + Dark Room en general listos primero · profundización después.

---

## SECTION 1 · LO QUE FALTABA PARA "MOVIMIENTOS FLUIDOS" (CRÍTICO Pablo)

### 1.1 · Start-Frame to Last-Frame system (líneas 1794-2090)

Este es **el motor real** de los movimientos fluidos cross-shot. NO lo había integrado en NARRATIVE-ARC-protocol-v1.

**Cómo funciona**:
- Cada video AI usa un sistema **start-frame → last-frame**
- **Start frame**: la imagen estática con la que empiezas
- **Last frame** (opcional pero potente): dónde quieres que termine la acción
- **In between**: el AI genera todo el movimiento que conecta los dos estados

**Por qué importa**:
- Sin last frame: AI genera motion pero puede no acabar donde quieres
- Con last frame: AI sabe exactamente dónde concluir → motion más natural y intencional

**Cómo generar last frames**:
1. Take ending state mental del shot (e.g. "Pablo de pie en proa yate, profile turned")
2. Generar la imagen del end state con Nano Banana Pro
3. Usar como `--end-image` (o equivalente) al video model

**Chaining videos para long-form**:
```
Step 1: Plan narrative · qué pasa en sec 0-4 / 4-8 / 8-12 / etc
Step 2: Generate first segment con start frame inicial
Step 3: Take last frame del Video 1 (screenshot o end-image) → use como new start frame
Step 4: Generate end frame nuevo con Nano Banana Pro
Step 5: Generate Video 2 con (new start + new end)
Step 6: Repeat hasta completar narrative
Step 7: Assemble en CapCut/ffmpeg/Premiere
```

**Aplicación INMEDIATA a concept 005 v3**:
- S1 ending: "Pablo's hand starts lifting off pastel pink sport car hood, head tilts off-camera left"
- S2 opening: "Pablo's hand grips motorbike handlebar, throttle wrist about to twist" (match action)
- → Necesitamos **generar el last frame de S1 = ending position** + usar como start frame
- → Necesitamos **generar end frame de S2 = burnout completo + smoke peak** + usar como end-image
- → Esto fuerza al video model (Cinematic Studio Video V2 / Seedance 2.0) a interpolar smoothly

**Coste extra**: 4 last-frames × 2 cr Nano Banana Pro = 8 cr · pequeño vs ~$5 video premium · IMPRESCINDIBLE para fluidity.

### 1.2 · Video prompt SIMPLE FORMULA (líneas 1822-1869)

A diferencia de imagen prompts (complex 5-layer funnel), video prompts son **mucho más simples**:

```
[Subject] + [Action] + [Emotional Tone] + [Dialogue (optional)]
```

**Phrase magic obligatoria**: `"with subtle human mannerisms and natural timing"` — esto solo elimina el "robot feel".

**Ejemplo line-by-line**:

❌ Demasiado complejo (image-prompt-style):
```
"Cinematic shot of Pablo on pastel pink Italian sport car, anamorphic 2x squeeze with horizontal lens flares, Beebe Miami Vice signature, sunset golden hour warm-cool split..."
```

✅ Video prompt correcto:
```
"Pablo turns head from open hood toward camera and smirks while saying 'lo hicimos en 3 horas', stable camera, no zoom, with subtle human mannerisms and natural timing."
```

**Dialogue pattern**: usar `"while saying"` para acción + diálogo simultáneo (natural humano).

**Camera control optional** (cuando NO quieres movement):
- `"stable camera"` — previene zoom o pan no deseado
- `"no zoom"` — keeps framing static
- `"static shot"` — no movement

**Aplicación INMEDIATA a concept 005 v3**: simplificar los 4 motion arcs del concept JSON a video-prompt-style cuando lleguemos a Phase 4.

---

## SECTION 2 · LO QUE FALTABA PARA "VIDEOS INCREÍBLES" (calidad output)

### 2.1 · Three Levels of Editing (líneas 4235-4719)

Sistemático para refinement post-generation:

**Level 1 · Simple Element Modifications**
- "Make the man bald"
- "Change his expression to a smile"
- "Make his jacket leather instead of fabric"
- Use case: 1 small element mientras keeping 95% del image
- Phrase magic: `"While keeping everything else identical, [change]"`

**Level 2 · Position & Composition Changes**
- "Make the man sitting instead of standing"
- "Turn the character to face the camera"
- "Position the character on the left side of the frame"
- Use case: pose o composition mayor mientras keeping environment

**Level 3 · Element Substitution con Multi-Image Numbered References**
- Upload 2+ images (numbered: "first uploaded picture" / "second uploaded picture")
- Pattern: `"While keeping everything else the same, make [element from image 1] [use element from image 2]"`
- Use case: brand-consistent elements, reference jacket/weapon/object

**Aplicación a concept 005 v3**:
- Si el visual-reviewer flag refinements en frames hero, usar Level 1/2 antes de regenerar from scratch
- Phase 3 substitution YA usa Level 3 correctamente

### 2.2 · Skin Realism prompts COPY-PASTE (líneas 3614-3681)

6 pasos para forensic skin sin "AI-smooth plastic":

```
Step 1: "Enhance skin realism with subtle natural skin texture: visible pores, fine micro-bumps, gentle uneven smoothness. Keep it clean and healthy, not gritty. Keep everything else identical."

Step 2: "Add micro-imperfections for realism: tiny blemishes, faint redness around cheeks and nose, subtle under-eye texture, slight natural discoloration variation. Keep it tasteful and minimal."

Step 4: "Add realistic baby hairs and a few messy stray hair strands around the hairline and temples. Keep hairstyle the same, just add subtle flyaways."

Step 5: "Introduce subtle natural facial asymmetry: tiny differences in cheek tension and brow position, very slight unevenness that feels human. Do not change identity. Keep everything else identical."

Step 6: "Add soft camera artifacts for realism: slight film grain, gentle sharpening, natural skin micro-contrast, mild noise in shadows. Avoid over-sharpening."
```

**All-in-one prompt (paste al final de cualquier shot Pablo)**:
```
Increase skin realism with subtle natural pores, fine micro-bumps, and gentle uneven smoothness. Add tasteful micro-imperfections: tiny blemishes, faint redness, subtle under-eye texture, slight natural tone variation. Correct highlights to avoid plastic shine—soft realistic specular highlights with mild oiliness in the T-zone. Add a few natural baby hairs and minimal stray strands around the hairline. Introduce very subtle natural asymmetry without changing identity. Finish with soft camera realism: light grain, mild shadow noise, natural micro-contrast, no over-sharpening. Keep everything else identical: same face identity, same expression, same lighting, same camera angle.
```

### 2.3 · Object/Material Texture prompts COPY-PASTE (líneas 3686-3751)

4 pasos para "expensive mode" en objetos (sport car, motorbike, yacht):

```
Step 1: "Add subtle micro-scratches and small scuffs consistent with real handling. Keep them minimal and realistic, mostly on high-contact areas and edges."

Step 2: "Add faint fingerprint smudges and soft oily marks on glossy areas that slightly break reflections. Keep it subtle and realistic, not dirty. Preserve lighting and reflections."

Step 3: "Enhance fabric realism: visible weave/knit structure, natural fold tension, slight stitching irregularities, subtle pilling in high-friction areas, and tiny loose fibers."

Step 4: "Improve grounding: add realistic contact shadows where the object touches the surface, subtle occlusion in creases, and consistent shadow softness matching the scene lighting."
```

**All-in-one prompt object realism**:
```
Enhance object realism with correct material behavior and micro-texture. Add subtle micro-scratches, tiny scuffs on edges, and realistic roughness variation. Add faint fingerprint smudges on glossy areas that gently break reflections (keep it clean, not dirty). Ensure accurate lighting response: realistic specular highlights, natural reflection clarity, and proper highlight roll-off. Add grounding with soft contact shadows and occlusion consistent with the scene lighting. Keep everything else identical: same camera angle, same lighting direction, same composition.
```

**Product-in-Hand integration prompt**:
```
Integrate the product naturally into the hand: match scale, perspective, and lighting. Align grip and finger contact points. Add realistic contact shadows and occlusion around fingers, slight pressure marks where the hand holds the product, and consistent reflections. Keep everything else identical.
```

### 2.4 · Object Consistency Sheet master prompt (líneas 3187-3208)

**CRÍTICO** · paralelo al 360 character sheet pero para objetos. Permitiría mantener IDÉNTICO el sport car / motorbike / yacht cross-shot.

**Prompt master objeto** (NUEVO en framework):
```
Ultra-high-resolution 360-degree object reference sheet of the uploaded object, presented as a precise studio contact-sheet grid with open rectangular frames only. Each frame contains a single object view with no borders, no circles, no rings, no overlays, no UI elements touching or intersecting the object.

The same object is shown from all critical structural angles:
dead-center front, 15° left, 30° left, 45° left, full left profile, rear-left three-quarter, exact back, rear-right three-quarter, full right profile, 45° right, 30° right, 15° right, plus top-down and bottom-up views.

The object remains perfectly static and unchanged across all views.
No deformation, no rotation drift, no scale variation, no geometry warping, no material changes.
Absolute consistency of shape, proportions, and alignment.

Surface detail rendered with forensic realism:
true dimensions and proportions, edge sharpness, curvature continuity, surface micro-texture, material grain, wear patterns, scratches, dents, seams, joints, fasteners, logos if present, engraving, embossing, subtle asymmetries, and manufacturing imperfections.

Material properties remain identical across all angles:
exact color preserved from the source image, physically accurate reflectance, roughness, metallicity, translucency if applicable, realistic subsurface scattering where relevant, no smoothing, no beautification, no stylization.

Background is pure matte charcoal black, evenly lit, no gradients.
Lighting is clinical studio scan lighting, soft cross-polarized, shadow-neutral, optimized for object reconstruction, 3D modeling, and VFX reference.
```

**Aplicación a Dark Room**:
- Generar Object Sheet del **pastel pink Italian sport car** (único modelo cross-shot)
- Generar Object Sheet del **red sport bike** (único modelo cross-shot)
- Generar Object Sheet del **luxury white yacht** (único modelo cross-shot)
- Coste: 3 × 2 cr Nano Banana Pro 2K = 6 cr · UNA vez por proyecto
- Resultado: el coche/moto/yate son IDÉNTICOS en todos los shots (no random variation)

### 2.5 · 6-Input Mood Board Method (líneas 6820-6840)

Maximum control para Hollywood-grade premium:

**6 reference inputs**:
1. Product reference (the bottle/item · ej. sport car en concept 005)
2. Logo reference (graphic/typography · ej. outro Dark Room)
3. Lighting reference (the vibe · ej. Beebe Miami Vice 2006 still)
4. Composition reference (layout/framing · ej. Tenet sunset still)
5. Color palette reference (ej. GTA VI trailer 2023 frame)
6. Texture/material reference (ej. Hasselblad product still)

**Blend prompt template**:
```
Combine the product from Image 1 with the lighting style of Image 3. Place it using the composition layout of Image 4. Apply the color palette of Image 5 and the material texture of Image 6. Preserve logo accuracy from Image 2. Keep the result photorealistic, commercial advertising quality.
```

**Aplicación**: cuando concept JSON declara research-first con N references, en lugar de citar "Beebe Miami Vice signature" como text en prompt, **subir la imagen referencia y citar Image N** → resultados Hollywood-grade.

### 2.6 · Luxury Material Texture Stack OBLIGATORIO (líneas 6841-6845)

Paste al final de cualquier prompt cinematic premium para "expensive mode":

```
shot on 70mm film, Hasselblad X1D, f/2.8, ray-traced global illumination, subsurface scattering, texture-rich materials, micro-imperfections, uncompromising detail, premium commercial advertising look
```

**Ya está en MEGA-PROMPT-v2 §F.3** ✓

**Pro tip nuevo**: si outputs become "overcooked" (CG-heavy), remove 1-2 render terms (keep photographic, not CG-heavy).

---

## SECTION 3 · DECISIÓN MATRIX modelos confirmada (líneas 4906-5267)

### 3.1 · Higgsfield Soul vs Nano Banana Pro

**Higgsfield Soul** (text2image_soul_v2):
- Optimizado para iPhone/smartphone aesthetic
- Hyperrealistic, authentic-looking
- Mobile-quality lighting (natural)
- **Video-ready** (animation works mejor con Soul que Pro)
- Use case: stories diarias · UGC · BTS Pablo · tendencia rápida

**Nano Banana Pro** (nano_banana_2):
- Cinematic, polished
- Professional lighting setups
- Rich color grading
- **Edit precision** mejor (entiende complex editing instructions)
- Use case: DARK_FRAMES hero · provocador · Dark Room directo

**Workflow split RECOMENDADO** (líneas 5050-5267):
```
Phase 1: Generate base scene with Higgsfield Soul (hyperrealistic iPhone aesthetic)
Phase 2: Edit / character substitution with Nano Banana Pro (precision)
Phase 3: Use result for animation (smooth, natural-looking video)
```

**¿Por qué hyperrealistic iPhone images animan MEJOR?** (líneas 5224-5246):
1. **Motion prediction**: animation software predice motion based on lighting/depth cues. Hyperrealistic images dan accurate cues.
2. **Lighting continuity**: iPhone-quality lighting (natural) continúa naturalmente en motion. Cinematic dramatic shadows pueden break apart.
3. **Texture consistency**: hyperrealistic textures animate smoothly · stylized textures shimmer/artifact.
4. **Viewer acceptance**: image looks "really real" → motion looks natural.

**Aplicación a concept 005 v3**:
- Phase 2 base scenes: hicimos con **Nano Banana Pro 2K** (cinematic) — esto está bien para STILLS hero
- Pero si Phase 4 video premium tiene drift en motion, considerar regenerar base scenes con **Higgsfield Soul** primero, después substitution con Pro · usar Pro-edited para video
- Para stories diarias y UGC: Higgsfield Soul desde día 1

### 3.2 · Cuándo usar cada modelo (decision matrix)

**Use Higgsfield Soul WHEN**:
- ✓ Creating content para animation/video
- ✓ iPhone/smartphone aesthetic
- ✓ Hyperrealistic, authentic-looking
- ✓ Target social media (Instagram, TikTok, YouTube)
- ✓ Believability over cinematic polish
- ✓ UGC o creator content
- ✓ Planning to animate result later

**Use Nano Banana Pro WHEN**:
- ✓ Cinematic content
- ✓ High-end brand campaigns
- ✓ Short films o narrative work
- ✓ Luxury/fashion/high-end marketing
- ✓ Visual impact > authenticity
- ✓ Professional commercial work
- ✓ Portfolio/artistic pieces

**Use BOTH together WHEN**:
- ✓ Animation-ready content
- ✓ Realistic base + creative editing
- ✓ Combining multiple elements
- ✓ Hyperrealism con character substitution

---

## SECTION 4 · 5-Layer Funnel Prompt Structure (líneas 5300-5697)

Funnel desde broad → specific. Cada layer construye sobre el previo:

**Layer 1 · Main Scene + Action + Characters** (Foundation)
- Primary Subject (qué/quién es focus)
- Action & Pose (qué hace · don't just describe, show in motion)
- Character Physical Details (age, gender, ethnicity, clothing, distinctive features)
- Emotional Tone (aggressive, serene, melancholic, triumphant)
- Key Relationships (cómo interactúan)

**Layer 2 · Environment Description** (Setting)
- Setting Type (indoors/outdoors)
- Spatial Depth (foreground/middle/background)
- Time of Day & Weather
- Background Features

**Layer 3 · Texture Details** (THE MAKE-OR-BREAK)
3 categorías:
- **Surface Quality**: rough/smooth/glossy/matte/satin/weathered/distressed/pristine
- **Material Type**: metal (steel/brass/copper)/wood (oak/cedar)/fabric (cotton/silk/leather)/stone (granite)/organic (skin/bark/leaf/water)
- **Pattern & Element Structure**: geometric/organic/repetitive/random/distressed

Apply textures to characters: skin pores, blemishes, beard stubble, hairline, wrinkles, hair texture (tight coils/waves/locs)

Apply textures to environments: "richly carved dark oak table with weathered hand-oiled finish showing natural grain patterns and subtle scratches from use" (vs simple "wooden table")

**Layer 4 · Camera Angles + Lighting + Color**

Camera angles (5 types):
- Eye Level (boring/neutral)
- Low Angle (powerful, dominant, heroic) ← USAR para Pablo en concept 005 v3
- High Angle (vulnerability, smallness)
- Bird's Eye View (aerial, spatial relationships)
- Worm's Eye View (extreme low, dramatic, immersion)

Lighting (mood power tool):
- Golden hour / harsh midday / soft overcast / moonlight / blue hour
- Neon / studio / candlelight / fluorescent / streetlights
- Front lighting (flat) / side lighting (dramatic) / backlighting (silhouettes) / rim lighting (separation, glamorous)

Color palette moods:
- Cinematic (slightly desaturated, rich contrast)
- Vintage (warm, nostalgic)
- Cyberpunk (neon dark)
- Ethereal (soft, dreamy)
- Noir (high contrast B&W o blue-black)

**Layer 5 · Art Direction + Style** (Finishing Touch)
- Specific keywords (photorealistic / oil painting / digital illustration / cinematic / cartoon / anime / surreal / abstract)
- O artist references (más efectivo · upload reference image + cite "in the style of [reference Image N]")

**Regla del 70%/95%**:
- Layer 1+2 = 70% calidad
- Layer 3+4+5 = 95% calidad
- Texture details (Layer 3) = el biggest jump from amateur to professional

---

## SECTION 5 · JSON Prompting expandido (líneas 5698-6041)

JSON 9-category template **YA en MEGA-PROMPT-v2 §F.2** ✓

**Hallazgos NUEVOS sobre JSON**:
1. **Speed of iteration**: cambias UN field, regeneras → no risk de break otros elementos
2. **Series consistency**: keep character description identical, swap solo `environment` field para series mismo character en N escenarios
3. **Extra Notes (hidden power)**: usar para emphasize priorities → `"prioritize texture detail on the leather jacket, ensure the face is clear and expressive, high quality rendering"`
4. **Don't overthink categories**: simple landscape solo necesita environment + color_language + camera_details + art_direction + extra_notes (NO subject/posture/face)
5. **Keep descriptions concise**: AI focuses on what matters · verbose hurts

---

## SECTION 6 · Workflows nuevos identificados

### 6.1 · Generation Best Practices (líneas 3796-4168)

- **3 images per generation MÍNIMO** (60-80% success vs 30-40% single)
- **Quality "High"** o "Maximum" siempre · cost diff negligible
- **Resolution**: 1024x1024 baseline · 2048x2048 max · NO experimental hasta confidence
- **Evaluate against 4 criteria**:
  1. Prompt Adherence (matches request)
  2. Technical Quality (no distortions, hands/faces correct)
  3. Emotional Impact (mood/feeling intended)
  4. Usability (in focus, composition usable)
- **Score 3-4 well = keeper** · Score 2 or fewer = regenerate
- **Regenerate when**: all 3 failed OR prompt unclear/incomplete
- **Don't over-refine**: 5+ edits = step back, regenerate from scratch

### 6.2 · Conversation Workflow Editing (líneas 4039-4054)

Nano Banana Pro acepta conversational instructions sobre uploaded image:
1. Generate first
2. Upload best result
3. Conversational refine: "Make the lighting more dramatic with deeper shadows on the left side"
4. Generate refined
5. Iterate hasta polish
6. Export

This is FASTER than regenerating from scratch every time.

### 6.3 · Multi-Character Worlds (líneas 645-654)

Crear 3-4 personas para diferentes audiencias compartiendo brand:
- Zara (edgy 18-25 audience)
- Marcus (sporty 20-35)
- Luna (luxe 25-40)
- All maintain consistency · cost less than ONE human influencer

**Aplicación a Dark Room**: además de Pablo Soul Character, considerar 2 personas adicionales para diferentes pillars:
- "Pablo PACAME" (founder · BTS · DARK_FRAMES hero)
- "María García" (creator IA UGC stories · 30s · LATAM target)
- "Carlos Rodríguez" (emprendedor digital pillar tendencia · 40s · negocio enfocado)

Coste: 3 × 21 cr 360 sheets = 63 cr · UNA vez · libera contenido infinito 3 ángulos audiencias.

### 6.4 · UGC outperforms professional ads 3-5x (líneas 240-256)

UGC ads outperform professional ads by 3-5x · authenticity > polish · brands love.

**Aplicación inmediata Dark Room**: stories diarias DEBEN tener tier AUTHENTIC iPhone (Higgsfield Soul) · NO tier CINEMATIC. Reels temáticos pillar tendencia/stack también AUTHENTIC. Solo DARK_FRAMES hero + provocador + Dark Room directo van CINEMATIC.

---

## SECTION 7 · DoP (Director of Photography) Mindset (líneas 6727-6739)

Most people prompt AI like friendly assistant. Difference between average y premium = treat AI like **production pipeline**.

**Cada prompt DEBE answer en este orden**:
1. **What MUST be correct** (text, logo, identity, product shape)
2. **What it is** (object + materials)
3. **How it's shot** (lighting, lens, camera, mood)
4. **Where it is** (environment kept simple si accuracy matters)

**Aplicación**: prompts del concept JSON deben empezar con "Pablo PACAME (identity · 360 sheet) wearing [exact wardrobe] doing [exact action]" antes de "shot on Hasselblad..." (technical specs).

---

## SECTION 8 · Nano Banana PRO Protocol específico (líneas 6720-6848)

### 8.1 · Perfect Packaging Prompt (text 100% readable)

Goal: Make product text 100% readable (ej. logo "darkroomcreative.cloud" en outro)
- **Priorizar Text Node ANTES de scenery** en prompt
- Si text glitches: simplify background (AI "spends" detail budget on scenery)
- Keep typography clear: font style + placement + emboss/print + color
- Use "macro" + "sharp focus on text" para forzar priority

### 8.2 · Character Consistency 2 ways

**Way 1**: Importing reference image of character (lo que hicimos · 360 sheet ✓)

**Way 2 · Define Base DNA (sin reference image)**:
```
BASE DNA: Photorealistic [AGE] [GENDER] with [HAIR], [EYES], wearing [OUTFIT]. [FACE FEATURES], [SKIN TEXTURE].
```

**Pro tip**: si consistency drifts, repeat 2-3 identity anchors INSIDE the scene prompt (hair + eyes + defining outfit).

### 8.3 · 360° Studio Synthesis (Turnarounds)

Generate consistent variations: side, top, rear desde un winning hero shot.

Prompt formula:
```
[INPUT IMAGE / SEED] + view instruction
```

Examples:
- `[Input Image] --view: side_profile left`
- `[Input Image] --view: top_down flatlay`
- `[Input Image] --view: rear_angle product_detail`

Use case: product campaigns con hero + detail + flatlay + alternate angles · sin rebuilding prompts from scratch.

---

## SECTION 9 · Nuevas reglas DURAS para Dark Room

Tras lectura completa, estas reglas DEBEN aplicarse a TODA generación futura:

| # | Regla | Source line |
|---|---|---|
| R1 | Generate 3 images mínimo per prompt (60-80% success vs 30-40%) | 3796-3818 |
| R2 | Evaluate 4 criteria binario (adherence + quality + impact + usability) | 3879-3981 |
| R3 | Use Higgsfield Soul para AUTHENTIC tier · Nano Banana Pro para CINEMATIC tier (no mezclar) | 4906-5267 |
| R4 | Workflow split: Soul base → Pro substitution → Soul-quality animation (cuando hay video) | 5050-5267 |
| R5 | Last frame = motion fluidity · siempre generar last frame para shots video premium | 1794-2090 |
| R6 | Video prompt formula simple: `[Subject] + [Action] + [Tone] + [Dialogue]` + "with subtle human mannerisms and natural timing" | 1822-1869 |
| R7 | Texture stack obligatorio paste al final cada prompt CINEMATIC (5-layer Funnel L3) | 6841-6845 |
| R8 | Skin Realism 6-step prompt para todo close-up Pablo | 3614-3681 |
| R9 | Object Texture 4-step prompt para todo product/vehicle prominent | 3686-3751 |
| R10 | Object Consistency Sheet OBLIGATORIO si vehículo/producto cross-shot (idéntico) | 3187-3208 |
| R11 | DoP Mindset: prompt structure What MUST be correct → What → How → Where | 6727-6739 |
| R12 | "While keeping everything else identical" phrase MAGIC para edits Level 1-2-3 | 4660 |
| R13 | Image numbering "first uploaded picture" / "second uploaded picture" para Level 3 substitutions | 4434-4467 |
| R14 | UGC outperforms professional 3-5x · stories diarias y reels tendencia → AUTHENTIC tier siempre | 240-256 |
| R15 | Don't over-refine: 5+ edits → regenerate from scratch | 4133 |

---

## SECTION 10 · Acciones inmediatas concept 005 v3

Tras este análisis, ANTES de Phase 4 video premium:

### 10.1 · Generar last frames de los 4 shots (Phase 3.5)
- 4 last-frames × 2 cr Nano Banana Pro 2K = 8 cr
- Cada last frame describe el end state del shot
- Ejemplo S1 last frame: "Pablo's hand lifting off pastel pink sport car hood, head turned 90° off-camera left toward incoming sport bike sound source, Vice City Art Deco hotels and palm trees in bokeh, sunset golden hour rim light"

### 10.2 · Generar Object Sheets (opcional pero recomendado)
- Pastel pink Italian sport car · 2 cr
- Red sport bike · 2 cr
- Luxury white yacht · 2 cr
- Total: 6 cr · garantiza vehicles IDÉNTICOS cross-shot en cualquier futuro re-generation

### 10.3 · Aplicar Skin Realism + Texture Stack a frames hero existentes
- Si visual-reviewer flag drift → Level 1 edit con prompts §2.2 + §2.3 above
- 4 × 2 cr Nano Banana Pro 2K refines = 8 cr · solo si necesario

### 10.4 · Phase 4 video premium con Last Frames
- Usar `--medias start_image` (hero frame) + `--end-image` (last frame Phase 3.5)
- 4 shots × cinematic_studio_3_0 25 cr = 100 cr · video premium con motion fluidity garantizada
- Coste total Phase 3.5 + 4 + Object Sheets opcional: 8 + 100 + 6 = 114 cr ($5.59)

### 10.5 · Phase 5 ffmpeg concat + outro v2 + captions
- ffmpeg concat 4 shots
- Concat outro-darkroom-2s-v2.mp4
- LUT cinematográfico Vice City sunset pastel
- Captions burned-in (Anton ALL CAPS · Space Grotesk Bold · JetBrains Mono)
- Música Suno synthwave 80s · LUFS -16
- 0 cr (local · Sharp + ffmpeg)

---

## SECTION 11 · Maintenance

- v1.0 → v1.1 cuando se identifique pattern recurrent NUEVO
- v1.x → v2.0 cuando complete framework migrate a SOP-COMPLETE-v2
- Sincronizar con MEGA-PROMPT-v[N].md cuando hallazgo se promote a regla dura
- Sincronizar con CONSISTENCY-CHECKLIST-v[N].md cuando hallazgo añada check NUEVO

**Version log**:
- v1.0 (2026-05-08) — Inicial · 50+ hallazgos extraídos línea por línea de CONOCIMIENTO PROMPT IA.txt 6907 lines · 15 reglas duras NUEVAS Dark Room
