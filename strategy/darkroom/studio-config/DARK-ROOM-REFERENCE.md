# Dark Room · REFERENCE · Sistema definitivo unificado

> **Fuente única de verdad.** Consolida MEGA-PROMPT-v2 + STYLE-ANCHOR-v2 + KNOWLEDGE-INTEGRATION-v2 + NARRATIVE-ARC-protocol-v1 + CONSISTENCY-CHECKLIST-v1 + AUDIT-knowledge-gaps en un solo documento.
>
> **Para uso diario rápido**: [`DARK-ROOM-PLAYBOOK.md`](DARK-ROOM-PLAYBOOK.md) (recipe card 1-página).
>
> **Schema validable**: [`DARK-ROOM-TEMPLATE.json`](DARK-ROOM-TEMPLATE.json).
>
> **Inyección obligatoria**: este REFERENCE + PLAYBOOK + TEMPLATE se cargan al inicio de cada conversación creativa Dark Room via `session-initializer.mjs`. Sin los tres = NO render premium.

---

## 1 · Studio Identity

| Campo | Valor |
|---|---|
| Cuenta IG | `@darkroomcreative.cloud` (52,205 followers · verificado Meta Graph 2026-05-07) |
| Audiencia real | 80% LATAM · 78% hombres · 61% rango 35-54 años (top México/Argentina/España=11%) |
| Audiencia objetivo | Creators IA + emprendedores digitales hispanohablantes |
| Pricing | 24,90€/mes Pro · 349€ Lifetime |
| Mission statement | "Convertimos cualquier idea visual en piezas cinema-grade hechas con IA. Te enseñamos a dirigir el modelo, no a usarlo." |
| Soul Character | `PACAME` reference_id `55ac4b3b-51f7-497a-8150-87563a969915` (type `soul_2` · status `completed`) |
| 360 Consistency Sheet | `tools/dark-frames/character-bibles/pablo/pablo-360-sheet-v1.png` (3.8MB) |
| Marca pública | Dark Room (NO mencionar PACAME / La Caleta / Ecomglobalbox en feed) |
| Buzón único real | `support@darkroomcreative.cloud` (NUNCA `hola@`) |
| Hashtag canónico | `#DarkFrames` (cinemáticas hero) · `#DarkRoom` (resto) · `#darkroomcreative` siempre |

---

## 2 · Visual Standards

### 2.1 · Decision Matrix Cinematic vs Authentic vs Hybrid

Cada concept declara explícitamente su tier. NO mezclar phrases entre tiers en el mismo prompt.

| Tier | Modelo principal | Prompt language signature | Use case Dark Room |
|---|---|---|---|
| **CINEMATIC** | Nano Banana Pro 2K (image) + Cinematic Studio Video V2/V3 (video) | `shot on 70mm film` · `Hasselblad X1D` · `RED 8K` · `ray-traced global illumination` · `Kodak Portra 400 push +1` · `professional cinematography` | DARK_FRAMES hero · provocador · Dark Room directo · pieza Hollywood-grade |
| **AUTHENTIC** | Higgsfield Soul + Soul Cast (video) | `shot on iPhone 15 Pro Max` · `natural light` · `authentic` · `unedited` · `raw` · `candid` · `phone selfie crop` | Stories diarias · UGC · BTS Pablo cotidiano · tendencia rápida |
| **HYBRID** | Soul para base scene + Pro para character substitution + Pro/Seedance para video | mix según fase · NUNCA mezclar phrases en mismo prompt | Piezas que necesitan iPhone realism + character precision |

### 2.2 · Paleta canónica

- **Base oscura**: Deep ink black `#0A0A0A`
- **Acid green hero**: `#CFFF00` (CTA · texto destacado · neon HUD overlay)
- **Off-white**: `#F2F2F2` o `#F4F1EA` (text body · cream variant)
- **Variants** según concept (no romper canónica · añadir):
  - **Vice City sunset**: pastel pink `#FFB5C5` · pastel teal `#7FE8E0` · sunset orange `#FF8C42` · sunset purple `#9B5DE5`
  - **BR2049**: amber-orange `#E8A547` · deep teal-cyan `#0E3B4F`
  - **Mad Max**: saturated orange `#FF6F1A` · teal-cyan sky `#007E91`
  - **Miami Vice 2006**: deep teal-blue night · neon magenta-pink (subtler · NOT MTV-saturated)

### 2.3 · Tipografía

- **Display ALL CAPS**: Anton Regular (captions burned-in · slide titles)
- **Body**: Space Grotesk Bold/Medium (caption text · longer reads)
- **Mono code**: JetBrains Mono (timestamps · code overlay)
- **NUNCA**: scripts decorativos · Comic Sans · system-ui sin fallback

### 2.4 · Safe areas IG (reels 1080×1920)

- Top 280px: clear de texto crítico (avatar handle se solapa)
- Bottom 380px: clear (caption preview + audio info se solapa)
- Sides 80px margin

### 2.5 · Output specs por formato

| Formato | Aspect ratio | Resolución mín | File format |
|---|---|---|---|
| Reel / Story | 9:16 | 1080×1920 | MP4 H.264 yuv420p AAC |
| Carrusel feed | 4:5 | 1080×1350 | PNG / JPG baseline |
| Post feed cuadrado | 1:1 | 1080×1080 | PNG / JPG |
| YouTube / paisaje | 16:9 | 1920×1080 | MP4 H.264 |

---

## 3 · Style Variants (6 canónicos)

Cada variant es un prompt fragment portable de 50-200 palabras que se concatena al prompt de generación. Va al **final del prompt** (después de subject/action/camera/Soul anchor) — el orden importa para weighting.

### 3.1 · Variant CANÓNICO (CINEMATIC default)

```
Premium editorial noir cinematic style, shot on Hasselblad X1D with 70mm film emulation, 35mm anamorphic 2x squeeze with oval bokeh and subtle horizontal lens flares, low-angle three-quarter perspective with rule of thirds composition (subject left or right two-thirds, negative space asymmetric), Kodak Portra 400 film push +1 stop with subtle silver halide grain and halation on highlights, color palette strict deep ink black #0A0A0A acid neon green #CFFF00 off-white #F2F2F2, single safelight neon green key from above casting hard chiaroscuro shadows contrast ratio 6:1, atmospheric haze with floating dust particles, ray-traced global illumination, subsurface scattering, texture-rich materials, micro-imperfections (subtle scratches on metal, faint fingerprints on glossy surfaces, fabric weave visible, contact shadows where objects touch surfaces), uncompromising detail, premium commercial advertising look, mood clandestine craftsmanship reminiscent Crewdson cinematic and Saul Leiter color sensibility, no faces visible besides Soul Character if applicable, no competitor brand logos, no readable text on signs, no emojis, no symmetric centered layouts, no plastic CGI cleanliness, no HDR over-processing, no smiling glamour stock-photo aesthetic.
```

### 3.2 · Variant VICE CITY SUNSET (CINEMATIC)

```
Premium editorial cinematic 1980s Florida-inspired open-world sunset variant, shot on Hasselblad X1D with 70mm film emulation, 35mm anamorphic 2x squeeze with oval bokeh and horizontal lens flares (Dion Beebe Miami Vice 2006 signature reference), Hoyte van Hoytema Tenet IMAX golden hour secondary reference, color palette pastel pink #FFB5C5 pastel teal #7FE8E0 sunset orange #FF8C42 sunset purple #9B5DE5 deep ink black #0A0A0A acid neon green #CFFF00 only for HUD overlay, sunset golden hour 5pm Miami latitude warm-cool split (sun-side pink-orange · shadow-side teal-cyan), Kodak Portra 400 push +1 grain hybrid digital, low-angle three-quarter perspective rule of thirds, ray-traced global illumination, subsurface scattering on skin, micro-imperfections (sand on car paint, fingerprints on chrome, fabric texture visible, salt mist on glass), mood late afternoon swagger summer 1986 nostalgia, NO MTV-80s saturated neon (subtler pastel tones), NO Vice City literal city naming, NO Lamborghini Aventador literal naming (use "pastel pink Italian sport car"), NO Ducati literal naming (use "Italian sport motorbike" or "red sport bike"), NO Rockstar IP marks, NO competitor brand logos visible, NO readable text on signs, NO HDR over-processing, NO plastic CGI cleanliness.
```

### 3.3 · Variant BR2049 SCI-FI NEON CORRIDOR (CINEMATIC)

```
Premium editorial sci-fi corridor variant, shot on Arri Alexa 65 with Cooke S4i Prime 32mm anamorphic, Roger Deakins Blade Runner 2049 reference (American Cinematographer Oct 2017), color palette amber-orange #E8A547 against deep teal-cyan #0E3B4F shadows, atmospheric haze dense with dust particles caught in volumetric light beams, single key light high angle warm against cool ambient fill ratio 8:1 high contrast noir, Kodak Portra grain emulation push +1 stop, low-angle three-quarter perspective rule of thirds, ray-traced global illumination, subsurface scattering, texture-rich corroded materials, micro-imperfections (rust on pipes, condensation on glass, oil stains, scratched chrome, fabric weave visible), mood corporate dystopia clandestine, NO faces visible besides Soul Character, NO competitor brand logos, NO neon green (this variant uses amber-teal palette only), NO Vice City pastel, NO HDR over-processing.
```

### 3.4 · Variant MAD MAX WASTELAND (CINEMATIC)

```
Premium editorial post-apocalyptic wasteland variant, shot on Arri Alexa Mini LF with Panavision Primo 21mm wide, John Seale Mad Max Fury Road 2015 reference (American Cinematographer May 2015), color palette saturated orange #FF6F1A against teal-cyan sky #007E91 (DI signature), high-noon brutal direct sun creating hard chiaroscuro shadows contrast ratio 8:1, dust storm haze with airborne particles, ray-traced global illumination, subsurface scattering on skin and leather, micro-imperfections (dust on every surface, sand grain in fabric, sweat-stained denim, rust on metal, cracked leather, scratched goggles), mood relentless survival kinetic, low-angle three-quarter perspective rule of thirds, Kodak Portra 400 push +1 grain hybrid digital, NO HDR over-processing, NO plastic CGI cleanliness, NO competitor brand logos, NO readable text on vehicles, NO Mad Max literal naming (use "post-apocalyptic wasteland" / "war rig" / "interceptor").
```

### 3.5 · Variant AUTHENTIC iPHONE UGC (AUTHENTIC tier)

```
Authentic shot on iPhone 15 Pro Max main camera, natural daylight or indoor practical lighting, candid framing with mild lens distortion at edges, raw unedited slight motion blur acceptable, JPEG color science Apple Smart HDR signature, no professional lighting setup, no color grade applied, hand-held framing slight tilt, depth of field natural (f/1.78 main wide), micro-imperfections preserved (skin pores texture, fabric wrinkles real, slight focus drift, ambient noise in shadows), mood real cotidiano honesto, no cinematic LUT, no anamorphic bokeh, no halation, no Kodak grain emulation (this is digital iPhone), no symmetric centered framing, no studio lighting, no professional color grade, no HDR over-processing, no glamour beauty retouching.
```

### 3.6 · Variant MIAMI VICE 2006 BEEBE SIGNATURE (CINEMATIC alternative to Vice City)

```
Premium editorial cinematic Miami Vice 2006 Dion Beebe ASC signature, shot on Sony CineAlta F900 high-def video (period-accurate digital cinema), Cooke S4i 25-50mm anamorphic, low-light tropical magic hour, color palette deep teal-blue night sky against neon magenta-pink street signage bokeh, sodium-vapor street light amber accents, hand-held kinetic camera with subtle natural sway, atmospheric humid haze, motion blur on movement preserved, mood erotic clandestine action, low-angle three-quarter perspective rule of thirds, micro-imperfections (rain on glass, sweat on skin, fabric humid stuck to body), NO MTV saturated neon (Beebe's intentionally desaturated naturalistic look), NO competitor brand logos, NO readable text on signs, NO HDR over-processing, NO film grain (this is digital video).
```

### 3.7 · Reglas de aplicación de variants

1. Style Anchor SIEMPRE va al final del prompt (después de subject/action/camera/Soul anchor)
2. Texture stack §6.3 SIEMPRE va inmediatamente después del Style Anchor en tier CINEMATIC
3. NO modificar el Style Anchor por gen · si necesitas cambiar algo → es señal de que ese concept requiere variant nuevo (crear y versionar)
4. Verificar que NO contradice el specific de la pieza · si hay conflicto → log y resolver
5. Variant se elige según `concept.style_anchor_variant` field en JSON (default: `canónico`)
6. Tier (CINEMATIC vs AUTHENTIC vs HYBRID) declarado en `concept.tier` field — bloquea si no se declara
7. NO mezclar cinematic phrases (`shot on 70mm`) con authentic phrases (`shot on iPhone`) en mismo prompt
8. IP marks PROHIBIDOS en cualquier variant — usar sustituciones safe del §4

---

## 4 · Negative Constraints + IP-safe substitutions

### 4.1 · Prompts NEVER incluyen

**IP marks de terceros explícitos** (Higgsfield rechaza con `ip_detected` y **cobra créditos igual** · 45 cr tirados en concept 005 v1):

GTA · Vice City · Liberty City · Rockstar · Ducati · Lamborghini · Aventador · Ferrari · Stranger Things · Hawkins · Mario · Nintendo · Disney · Marvel · Star Wars · Adobe · Figma · Midjourney · Coca-Cola · Nike · Apple · Tesla · BMW · Mercedes · Audi · Porsche · Cybertruck · iPhone (en imagen visible · OK como "shot on iPhone" en prompt) · MacBook · Pokémon · Simpsons · Family Guy · cualquier marca/franquicia/título reconocible.

### 4.2 · Sustituciones SAFE para evitar IP

| Original (PROHIBIDO) | Sustitución SAFE |
|---|---|
| GTA Vice City | `1980s Florida-inspired open-world game aesthetic` |
| Lamborghini Aventador | `pastel pink Italian sport car` |
| Ducati / Italian motorbike marca | `Italian sport motorbike` o `red sport bike` |
| Rockstar RAGE engine | `AAA game cinematic CGI hyperreal` |
| Stranger Things | `1980s small-town americana sci-fi mystery aesthetic` |
| Hawkins | `fictional 1983 Indiana small town` |
| Simpsons | `2D yellow-skinned cartoon family suburban americana satire` |
| Cybertruck | `angular polygonal stainless-steel pickup truck` |
| iPhone (objeto visible) | `flat-glass black smartphone slab` |
| Mac (laptop visible) | `silver aluminum laptop with backlit keyboard` |
| Adobe Photoshop UI | `digital image editor interface with toolbar` |

### 4.3 · Otros NEVER en prompts

- **Texto inventado IA en señales/letreros** (kanji ilegible · neón fake · receipts con palabras inventadas) — añadir `no readable kanji or japanese text` · `no readable text on signs` · `no logos visible`
- **Caras múltiples reconocibles** excepto Soul Character `PACAME` con sheet 360
- **Faces sonriendo glamour stock-style** — añadir `no smiling glamour` · `no stock-photo aesthetic`
- **Manos con 6+ dedos / extra fingers / deformed limbs** — negative prompt obligatorio
- **Watermarks competidores visibles**

### 4.4 · Visualmente NEVER aparece

- Gradient azul-violeta techbro (signature de IA genérica · scroll past instant)
- Stock con auriculares (look "team de startup")
- Emojis fuego o "increíble revolucionario" (lenguaje de bot)
- Symmetric centered layouts (excepto justified por intent · default = rule of thirds)
- HDR over-processed (highlights blown · shadows lifted · plastic glow)
- Plastic CGI cleanliness (skin sin poros · superficies sin textura)
- Midday overcast sin justificación (luz plana · aburrida)

### 4.5 · Operacionalmente NEVER

- Generar video premium (Veo / Seedance / Kling / Cinematic Studio Video) sin **2 SÍ explícitos Pablo formato exacto** (regla `feedback_doble_aprobacion_videos.md`)
- Editar `meta.json::approved` a mano
- Generar tokens cost-guard con `openssl rand` (solo `emit-cost-guard.mjs` Supabase RPC)
- Crear flags `--skip-*` (visual-reviewer · checks · etc)
- Publicar pieza sin pasar Three-Pass Review (Technical · Style · Creative)
- Mencionar PACAME (la agencia) o La Caleta o Ecomglobalbox en feed `@darkroomcreative.cloud`
- Tests genéricos "test" en modelo video premium (cada gen $1-3 ÷ propósito)
- Generar shot video sin pasar antes por Fase 3 substitution Soul → Pro (workflow 4-fase obligatorio)
- Renderizar `cinematic_studio_3_0` o cualquier video premium SIN `--medias start_image` cuando concept incluye Soul Character

---

## 5 · Workflow 4-fase obligatorio

### 5.1 · Fase 1 · Character Anchor (1 vez por character · reusable forever)

```bash
hf generate create text2image_soul_v2 \
  --soul-id 55ac4b3b-51f7-497a-8150-87563a969915 \
  --prompt "[MASTER PROMPT 360 CONSISTENCY SHEET · §6.1]" \
  --aspect_ratio 3:4 --wait
```

Guardar como `tools/dark-frames/character-bibles/[character]/[character]-360-sheet-v[N].png`.
Coste típico: 0.12-25 cr (depende complejidad prompt).
Reusable en TODOS los shots futuros del character.

### 5.2 · Fase 2 · Base Scenes (sin character)

Para cada shot del concept, generar la ESCENA SIN PABLO con el modelo según tier:

```bash
# CINEMATIC tier
hf generate create nano_banana_2 \
  --prompt "[JSON 9-category · §6.2 · subject = 'modern minimalist Vice City beach with empty pastel pink sport car parked at sunset' · NO Pablo]" \
  --aspect_ratio 4:5 --resolution 2k --wait

# AUTHENTIC tier
hf generate create text2image_soul_v2 \
  --prompt "[JSON 9-category con 'shot on iPhone 15 Pro Max' + natural light · NO Pablo]" \
  --aspect_ratio 3:4 --wait
```

Coste típico:
- CINEMATIC Pro 2K: 2 cr × 4 base scenes = 8 cr
- AUTHENTIC Soul: 0.12 cr × 4 = 0.48 cr (free pool)

### 5.3 · Fase 3 · Character Substitution (Pablo en cada base scene)

```bash
hf generate create nano_banana_2 \
  --prompt "While keeping everything else identical, replace the placeholder area where a person should be in the first uploaded picture with the trained subject from the 360 consistency sheet (second uploaded picture). Maintain exact facial features, skin tone, hair, and identity from the consistency sheet. Adapt body posture and clothing to fit the scene context naturally. Preserve all environmental details, lighting, color grading, and composition from the first picture exactly as they are." \
  --image base-scene.png --image 360-sheet.png \
  --aspect_ratio 4:5 --resolution 2k --wait
```

Coste típico: 2 cr × 4 substitutions = 8 cr.

### 5.4 · Fase 3.5 NUEVA · Last frames + Object sheets (concept 005 learning)

Para video premium con motion fluidity SOTA:
- Generar 4 last frames Nano Banana Pro 2K (descripción end state cada shot · 8 cr)
- Generar 3 Object Sheets si aplica (vehículos · productos cross-shot · 6 cr)
- TOTAL: 14 cr

### 5.5 · Fase 4 · Video premium (image-to-video · REQUIERE 2 SÍ Pablo)

```bash
# SOLO tras 2 SÍ Pablo formato exacto + cost-guard token via emit-cost-guard.mjs

# Cinematic Studio Video V2/V3 (HYBRID/CINEMATIC default)
hf generate create cinematic_studio_video_v2 \
  --prompt "[Action description · 'Subject does X while saying Y' · stable camera no zoom]" \
  --medias <substitution-image-uuid> \
  --end-image <last-frame-uuid> \
  --aspect_ratio 9:16 --duration 5 --genre action --wait

# Seedance 2.0 (multi-shot consistent identity SOTA)
hf generate create seedance_2_0 \
  --prompt "[same]" \
  --medias <substitution-image-uuid> \
  --end-image <last-frame-uuid> \
  --aspect_ratio 9:16 --duration 5 --genre action --resolution 720p --mode std --wait
```

Coste típico:
- Cinematic Studio Video V2 5s 9:16 action: 7.5 cr × N shots
- Seedance 2.0 5s std: 22.5 cr × N shots

### 5.6 · Fase 5 · Composition + Outro

ffmpeg pipeline:
1. Upscale shots a 1080×1920 30fps (lanczos)
2. Aplicar LUT del concept (curves cyan-magenta para Vice City · amber-teal para BR2049 · etc)
3. Burn captions Anton ALL CAPS con drawtext
4. Concat shots + outro Dark Room (`outro-darkroom-2s-v2.mp4` "TODO HECHO CON · darkroomcreative.cloud")
5. Master export H.264 yuv420p AAC 192k

Template ffmpeg post: ver `tools/dark-frames/render-007-final.sh` (3-act trailer pipeline).

---

## 6 · Master Prompts Reference

### 6.1 · 360 Consistency Sheet master prompt

(de CONOCIMIENTO PROMPT IA.txt líneas 2752-2782 · usado para Fase 1 Character Anchor)

```
Ultra-high-resolution 360-degree facial reference sheet of the trained subject, presented as a precise studio contact sheet grid with open rectangular frames only. Each frame contains a single head view with no borders, no circles, no rings, no overlays, no UI elements touching or intersecting the face.

The same face is shown from all critical anatomical angles: dead-center front, 15° left, 30° left, 45° left, full left profile, rear-left three-quarter, exact back of head, rear-right three-quarter, full right profile, 45° right, 30° right, 15° right, plus top-down and bottom-up views.

The subject maintains a neutral, expressionless face across all views. Eyes relaxed, mouth closed, jaw at rest. No pose drift, no expression change, no identity morphing.

Facial detail rendered with forensic realism: true cranial proportions, cheekbone structure, jawline, nasal bridge and nostrils, eyelid folds, eyebrow density, lip volume and texture, ear anatomy, hairline irregularities, freckles, pores, subtle asymmetry, micro-wrinkles.

Hair styling, fringe, and accessories remain identical across all angles, with zero motion. Skin tone preserved exactly from the source image, rendered in warm ivory with natural undertone variation, realistic subsurface scattering, no smoothing, no beauty retouching.

Background is pure matte charcoal black, evenly lit, no gradients. Lighting is clinical studio scan lighting, soft cross-polarized, shadow-neutral, optimized for facial reconstruction and VFX reference.

Captured as if shot on a medium-format digital camera, absolute sharpness, documentary realism.

Camera settings: 120mm macro lens, f/11, ISO 100, 1/125s, vertical orientation, symmetrical grid layout, infinite depth of field.

No decorative elements. No frames touching the face. No stylization. This is a technical facial capture sheet, not an editorial portrait.
```

### 6.2 · JSON 9-category prompt template

```json
{
  "subject": "Main character/object/focus description (specific physical details, clothing texture)",
  "posture": "What they're doing / their position / pose / action verbs",
  "face_details": "Face-specific: expression, eye shape, lips, defining features (skip if no character)",
  "body_details": "Physical characteristics, clothing materials, visible texture",
  "environment": "Setting, time of day, weather, background depth (foreground/midground/background)",
  "color_language": "Overall color mood, palette HEX, warm vs cool, saturation level",
  "camera_details": "Angle (low/high/eye-level), lens (35mm anamorphic / 120mm macro / iPhone 15), framing, perspective",
  "art_direction": "Style reference (Crewdson cinematic / Saul Leiter color / Beebe Miami Vice 2006 / Deakins BR2049 / iPhone authentic UGC), medium",
  "extra_notes": "Texture stack: micro-imperfections, lighting emphasis, priority elements, technical render quality"
}
```

### 6.3 · Texture stack obligatorio (paste al final de cada prompt CINEMATIC)

```
Texture stack realism: shot on 70mm film, Hasselblad X1D, f/2.8, ray-traced global illumination, subsurface scattering, texture-rich materials, micro-imperfections (subtle scratches on metal, faint fingerprints on glossy, fabric weave visible, contact shadows where objects touch surfaces), uncompromising detail, premium commercial advertising look, Kodak Portra 400 push +1 grain emulation, halation on highlights, no plastic CGI cleanliness, no HDR over-processing.
```

### 6.4 · Smart Editor Protocol (in-painting natural language)

**Formula**: "While keeping everything else identical, [describe ONLY the change]. Maintain [list elements to preserve]."

**Ejemplos válidos**:
- ✅ "While keeping everything else identical, change the blue jacket to a textured crimson leather jacket. Maintain lighting interaction, shadows, and the same identity."
- ✅ "While keeping everything else identical, replace the person in the first uploaded picture with the subject from the 360 consistency sheet (second uploaded picture). Maintain exact facial features and identity."
- ❌ "Add a person + change lighting + new background" (3 cambios = regenerar desde cero, no in-painting)

### 6.5 · Skin Realism prompt 6-step (close-ups Pablo · obligatorio R8)

```
Add subtle natural skin texture: visible pores, fine micro-bumps, gentle uneven smoothness. Add micro-imperfections: tiny blemishes, faint redness around cheeks and nose, subtle under-eye texture, slight natural discoloration variation. Real highlights: oily zones forehead/nose with realistic specular highlights, NOT plastic shine. Add realistic baby hairs and minimal stray hair strands around hairline and temples. Introduce subtle natural facial asymmetry: tiny differences in cheek tension and brow position, very slight unevenness that feels human, do not alter facial structure dramatically. Add soft camera artifacts: slight film grain, gentle sharpening, natural skin micro-contrast, mild noise in shadows. Keep everything else identical: same face identity, same expression, same lighting, same camera angle.
```

### 6.6 · Object Texture prompt 4-step (vehicles/products prominent · obligatorio R9)

```
Add subtle micro-scratches and small scuffs consistent with real handling, minimal and realistic, mostly on high-contact areas and edges. Add faint fingerprint smudges and soft oily marks on glossy areas that slightly break reflections. For fabric: visible weave/knit structure, natural fold tension, slight stitching irregularities, subtle pilling in high-friction areas. Improve grounding: realistic contact shadows where the object touches the surface, subtle occlusion in creases, consistent shadow softness matching scene lighting. Keep everything else identical: same camera angle, same lighting direction, same composition.
```

### 6.7 · Character anchor in scene prompt (Base DNA repeat · si NO 360 sheet)

```
BASE DNA: Photorealistic [AGE] [GENDER] with [HAIR DETAILS], [EYES], wearing [DEFINING OUTFIT]. [SHARP FACIAL FEATURES], [SKIN TEXTURE].

[Scene prompt continues with anchors repeated 2-3 times throughout]
```

Ejemplo aplicado a Pablo:
```
BASE DNA: Photorealistic Spanish man late 30s/early 40s, athletic-stocky LEAN SLIM build with V-shape torso (broad shoulders narrow waist), short-cropped dark brown hair, well-groomed dark-brown beard with subtle gray hints, brown eyes, warm olive Mediterranean skin, defined cheekbones, lean sharp jawline, prominent collarbones, flat stomach, NOT bulky NOT chubby NOT muscular bodybuilder, NOT round face.
```

---

## 7 · Frame-to-Frame Continuity (4 pilares)

### 7.1 · Pilar 1 · Wardrobe Continuity (cross-shot)

**Regla dura**: el personaje LLEVA EL MISMO WARDROBE en TODOS los shots de la pieza, salvo que el concept declare **explícitamente** "wardrobe-progression" justificada por jump-cut temporal (mañana/atardecer/noche con cambio explicit on-screen).

| Caso | Wardrobe rule | Ejemplo |
|---|---|---|
| **Single-day arc** (default) | UNA sola wardrobe en toda la pieza | Hawaiian shirt + linen pants + aviators en frames 1-4 |
| **Day-to-night progression** | 2 wardrobes con transición visible | Hawaiian día → tuxedo noche con on-screen "later that night" cut |
| **Multi-character arc** | Cada character con SU wardrobe consistente | Pablo Hawaiian + Maria red dress en todos sus shots |

**Anti-patrón**: cambio wardrobe random shot-a-shot sin justificación = look "stitched stock photo collage" en lugar de cinematic.

**Validación**: visual-reviewer compara wardrobe descriptors entre shots — si difference >30% sin field `wardrobe_change_justification` → REJECT.

### 7.2 · Pilar 2 · Motion Arcs (subject + camera per shot)

Cada shot declara DOS motion vectors en concept JSON:

```json
{
  "shot_id": "S1_beach",
  "subject_motion": "Pablo turns head from looking at car hood toward camera, then takes one step forward leaning right hand on hood, slow confident movement",
  "camera_motion": "Slow dolly-in from wide to medium-wide, stable on tripod, no shake, push 30% closer over 5 seconds, ending at three-quarter framing",
  "motion_priority": "subject"
}
```

**Subject motion language (verbos válidos)**:
- Slow: turn, lean, glance, breathe, reach, settle, drift, glide, shift weight
- Medium: walk, step, twist, nod, gesture, adjust, pull, rotate
- Fast: jump, sprint, throw, swing, accelerate, drift (vehicle), whip turn

**Anti-patrón motion**:
- ❌ "Pablo poses confidently" (sin verbo concreto)
- ✅ "Pablo turns head left-to-camera over 1.5s with calm dominant gaze, slight smirk emerging"

**Camera motion vocabulary**:
- Stable/static · Dolly-in/out · Push-in/Pull-back · Drone pull-back · Handheld kinetic · Whip pan · Orbital/arc · Crane up/down · Tilt up/down

**Motion priority**:
- `"subject"`: subject moves, camera stable
- `"camera"`: camera moves, subject held
- `"both"`: ambos (más caro · usar parsimoniously · prompt simple rinde mejor con una sola priority)

### 7.3 · Pilar 3 · Transitions Handoff (frame-to-frame)

| Tipo | Ending frame N | Opening frame N+1 | Use case |
|---|---|---|---|
| **Match cut** | Same composition + similar action | Same composition + new context | Pablo turns left → Pablo continues turning left en nuevo entorno |
| **J-cut audio** | Audio del próximo shot empieza | Visual cambia | "We hear engine rev before we see the bike" |
| **Whip pan continuation** | Camera whips left | Camera whips left and reveals new scene | Vice City sunset → moto burnout |
| **Push-in to close-up** | Wide of Pablo | Close-up Pablo face same scene | Concept 005 final |
| **Match action** | Pablo grabs handlebar | Pablo on bike accelerating | Continuity de acción |
| **Color match** | Pastel pink dominant | Pastel pink dominant new scene | Color anchor |
| **Symbolic match** | Sun setting on horizon | Yacht silhouette against same horizon | Visual rhyme |

**Anti-patrón transitions**:
- ❌ Hard cut sin handoff (excepto género horror jump-scare)
- ❌ Wardrobe cambia sin handoff explícito
- ❌ Lighting cambia 180° sin justificación temporal
- ❌ Subject identity wobbles (different face) cross-cut

### 7.4 · Pilar 4 · Audio Sync Points

Cada shot tiene mínimo 1 audio sync point alineado con cut o action key.

| Action visible | Audio sync obligatorio |
|---|---|
| Engine ignition | engine-start.wav frame 0 of S2 |
| Wheel burnout | tire-screech.wav + smoke-hiss.wav loop |
| Car door closes | door-slam.wav frame X |
| Drone sweep | drone-whoosh.wav over 5s |
| Sunset reveal | ambient-marina.wav + soft pad music |
| Music drop | drop coordinado con biggest cut (usually S1→S2 si action-driven) |

**LUFS target**: -16 LUFS cinema standard.
**Música**: Suno copyright-free generada con prompt específico al género del concept.

---

## 8 · Three-Pass Review (26 markers binarios)

### 8.1 · PASS 1 · TECHNICAL (binary reject si CUALQUIERA fail)

| # | Marker | Pregunta |
|---|---|---|
| 1 | Resolution | ¿Reel = 1080×1920? · ¿Carrusel = 1080×1350? · ¿Story = 1080×1920? |
| 2 | Aspect ratio | ¿Reel/Story = 9:16? · ¿Carrusel = 4:5? |
| 3 | File format | ¿Reel = MP4 H.264 yuv420p AAC audio? · ¿Carrusel = PNG/JPG baseline? |
| 4 | Naming convention | ¿Sigue patrón `[project]_[concept]_[variant]_v[N]_[YYYYMMDD].[ext]`? |
| 5 | Duration | ¿Reel duration objetivo ±0.5s? · ¿Outro 2s incluido si DARK_FRAMES? |
| 6 | Frame rate | ¿24-30 fps? · ¿No drops/jumps? |
| 7 | Bitrate | ¿≥1.5 Mbps video · ≥128 kbps audio? |

**Si 1+ fail → REJECT INMEDIATO · regenerar specs correctos · NO continuar a Pass 2.**

### 8.2 · PASS 2 · STYLE (11 checks bloqueantes)

| # | Marker | Pregunta |
|---|---|---|
| 1 | Color Palette canónico | ¿Solo HEX `#0A0A0A` · `#CFFF00` · `#F2F2F2` (+ variant si declarado)? · Cero gradients azul-violeta |
| 2 | Lighting | ¿Single safelight neón verde acid (canónico) O variant DP-specific? · Contrast ratio 6:1+ |
| 3 | Composition | ¿Rule of thirds? · Subject left/right two-thirds · Negative space asymmetric · Depth FG+MG+BG |
| 4 | Texture | ¿35mm grain + halation visible? · Surfaces mate (no plastic CGI) · Kodak Portra 400 push+1 |
| 5 | Photography style | ¿Editorial premium noir? · 35mm anamorphic 2x squeeze · Low-angle three-quarter NO flat front-on |
| 6 | Soul Character | ¿Pablo `PACAME` reconocible cross-shot? · Misma cara · mismo outfit en TODOS los shots |
| 7 | Typography | ¿Anton ALL CAPS display? · Space Grotesk Bold/Medium body · JetBrains Mono captions |
| 8 | Excluded elements | ¿Cero IP marks? · Cero competitor logos · Cero readable text inventado · Cero faces glamour stock |
| 9 | Safe areas IG | ¿Top 280px + bottom 380px clear de texto crítico? · Sides 80px margin |
| 10 | Brand outro (DARK_FRAMES) | ¿Outro 2s `outro-darkroom-2s-v2.mp4` concatenado al final? |
| 11 | Hashtag canónico | ¿`#DarkFrames` (DARK_FRAMES) O `#DarkRoom` (resto) · `#darkroomcreative` siempre |

**Si 2+ fail → REJECT · refine targeted o regenerar.**

### 8.3 · PASS 3 · CREATIVE (gut feel · subjective)

| # | Marker | Pregunta |
|---|---|---|
| 1 | Hollywood test | ¿Aguanta comparación lado-a-lado con trailer real del referente declarado? |
| 2 | Hook 0-1.5s | ¿Movimiento en frame 1 (no estático)? · Scroll-stop en feed IG · Cara reconocible primer frame |
| 3 | Cuts kinetic | ¿Cuts cada 1-2.5s (8-12 cuts en reel 15s)? · NO un solo plano largo aburrido |
| 4 | Emotional arc | ¿Hook (descubrimiento) · Build (acción) · Climax + reveal (outro)? |
| 5 | Audio sync | ¿Música drop con cut clave? · SFX por cada acción visible · LUFS -16 cinema |
| 6 | Outro reveal | ¿Genera "espera ¿es IA?" en viewer? · NO obvio desde frame 1 |
| 7 | CTA implícito | ¿Comments trigger word presente ("Comenta GTA y te mando el ebook")? · NO CTA agresivo |
| 8 | Flow | ¿Pasaría tu propio "would I be proud to publish this"? · Si gut dice no → refine |

### 8.4 · NUEVOS checks 27-33 (Frame-to-Frame Continuity · NARRATIVE-ARC)

| # | Marker | Pregunta |
|---|---|---|
| 27 | Wardrobe continuity | ¿Mismo wardrobe TODOS los shots O wardrobe-progression justificada explícitamente? |
| 28 | Subject identity | ¿Mismo character (Pablo PACAME) reconocible cross-shot · 360 sheet match? |
| 29 | Lighting continuity | ¿Misma key light direction + color temperature cross-shot O justified by time-of-day shift? |
| 30 | Motion arcs declarados | ¿Cada shot tiene `subject_motion` + `camera_motion` + `motion_priority`? |
| 31 | Transitions handoff | ¿Cada cut tiene `type` + `ending_frame` + `opening_frame` + `audio_handoff`? |
| 32 | Audio sync points | ¿Cada shot tiene mínimo 1 audio sync point en concept JSON? |
| 33 | Narrative arc | ¿La pieza completa cuenta una historia coherente (hook → build → climax → reveal)? |

### 8.5 · Resultado final del Three-Pass Review

| Pass 1 Technical | Pass 2 Style | Pass 3 Creative | Resultado |
|---|---|---|---|
| ALL pass | ALL pass | ALL pass | ✅ APPROVED · sign Ed25519 · enqueue · publish |
| ALL pass | ALL pass | 1-2 fail | ⚠️ REFINE creative targeted · regenerar |
| ALL pass | 1 fail | ALL pass | ⚠️ REFINE style targeted · regenerar fail-marker only |
| ALL pass | 2+ fail | — | ❌ REJECT · regenerar concept más amplio |
| 1+ fail | — | — | ❌ REJECT TÉCNICO · regenerar con specs correctos |

---

## 9 · 21 Reglas Duras (KNOWLEDGE-INTEGRATION-v2)

| # | Regla | Source TXT |
|---|---|---|
| **R1** | Generate 3 images mínimo per prompt (60-80% success vs 30-40%) | 3796-3818 |
| **R2** | Evaluate 4 criteria binario: Adherence + Technical Quality + Emotional Impact + Usability | 3879-3981 |
| **R3** | Higgsfield Soul para AUTHENTIC tier · Nano Banana Pro para CINEMATIC tier (no mezclar) | 4906-5267 |
| **R4** | Workflow split: Soul base → Pro substitution → Soul-quality animation | 5050-5267 |
| **R5** | Last frame = motion fluidity · generar last frame para CADA shot video premium | 1794-2090 |
| **R6** | Video prompt formula simple `[Subject]+[Action]+[Tone]+[Dialogue]` + "with subtle human mannerisms and natural timing" | 1822-1869 |
| **R7** | Texture stack obligatorio paste al final cada prompt CINEMATIC | 6841-6845 |
| **R8** | Skin Realism 6-step prompt para close-ups Pablo | 3614-3681 |
| **R9** | Object Texture 4-step prompt para products/vehicles prominent | 3686-3751 |
| **R10** | Object Consistency Sheet OBLIGATORIO si vehículo/producto cross-shot | 3187-3208 |
| **R11** | DoP Mindset: What MUST be correct → What → How → Where | 6727-6739 |
| **R12** | "While keeping everything else identical" phrase MAGIC para edits surgical | 4660 |
| **R13** | Image numbering "first/second uploaded picture" para Level 3 substitutions | 4434-4467 |
| **R14** | UGC outperforms 3-5x · stories diarias + reels tendencia = AUTHENTIC tier siempre | 240-256 |
| **R15** | Don't over-refine: 5+ edits → regenerate from scratch | 4133 |
| **R16** | Daily workflow = SIEMPRE parallel (nodes/batch) · NUNCA sequential (-80% time) | 1037-1056 |
| **R17** | TODO video corto sigue 3-Act estructura: Hook 1-2s + Content 3-4s + CTA 1-2s | 1668-1700 |
| **R18** | Posting cadence: 1-2 posts/día IG (algorithm penaliza 5+/día) | 793, 1067 |
| **R19** | Para single scenario: crear 3 prompt variations (diferentes emotions/angles/details) | 1064-1065 |
| **R20** | Quarterly seasonal updates obligatorios (Q1 winter / Q2 spring / Q3 summer / Q4 fall) | 1408-1409 |
| **R21** | Use Nodes WHEN: 10+ variations · WHEN MANUAL OK: one-off, 1-3 variations | 2718-2724 |

---

## 10 · Cinematic vs Authentic Vocabulary Bank

### 10.1 · CINEMATIC Language signals "make this look like a film"

- `Cinematic lighting`
- `Professional cinematography`
- `Dramatic shadows`
- `Color graded`
- `Film production`
- `Camera: RED 8K` / `Professional camera`
- `Directional lighting`
- `Highly polished`
- `Studio lighting setup`
- `Movie-quality`

**Result**: Perfect, elevated, obviously-professional look.

### 10.2 · AUTHENTIC Language signals "real person took it"

- `Shot on iPhone` / `Shot on smartphone`
- `Casual photography`
- `Natural light`
- `Authentic`
- `Unedited`
- `Raw`
- `Candid`
- `Documentary style`
- `Real moment`
- `Simple phone camera`
- `Daylight`
- `No studio setup`
- `Realistic`

**Result**: Real, relatable, believable, human-captured look.

### 10.3 · 6 Render Dimensions Shift

| Dimension | CINEMATIC | AUTHENTIC |
|---|---|---|
| **Lighting** | Carefully positioned, dramatic, intentional shadows | Flat, even, directional (window/daylight) |
| **Color Grading** | Rich, saturated, color-corrected | Muted, realistic |
| **Composition** | Rule of thirds, dynamic angles | Simple framing, centered, casual |
| **Detail Level** | Every texture visible, hyper-detailed | Normal phone photo level |
| **Perfection** | Everything perfect | Slight imperfections, natural variations |
| **Equipment** | AI assumes professional camera/lenses/rig | AI assumes smartphone/consumer camera |

**Irony**: BOTH approaches use SAME AI MODEL. Difference is entirely prompt language.

---

## 11 · Anti-patrones (5 transversal · K1-K5)

| # | Anti-patrón | Por qué bloquea |
|---|---|---|
| **K1** | Don't try to edit a bad image into being good. If base flawed → regenerate | Editing best on already-solid images · 5+ edits sobre base mala = wasted time |
| **K2** | Don't waste time with single generations. Time diff negligible · quality diff massive | Single gen 30-40% success vs 3 gens 60-80% (R1) |
| **K3** | Don't chase perfection. Point of diminishing returns | 1-2 edits suficiente · 5+ edits = step back regenerate |
| **K4** | Don't over-refine: 5+ edits → step back regenerate from scratch | El prompt original probablemente estaba mal · iterar el prompt, no el image |
| **K5** | Don't craft prompts manually when bot saves 10 min/prompt. Use bot every time | Custom GPT Prompt Engineering Bot da JSON estructurado · adopta DoP mindset automático |

---

## 12 · Troubleshooting matrix (4 issues + solutions)

### 12.1 · ISSUE: Face doesn't match consistency sheet

**Solution**:
- Use more detailed consistency sheet reference
- Add explicit facial description: `[Asian woman, red hair, dramatic makeup, confident expression, exact face from consistency sheet]`
- Use Nano Banana Pro instead of other models
- If still failing: Use prompt enhancer (Custom GPT Prompt Engineering Bot)

### 12.2 · ISSUE: Body position looks unnatural

**Solution**:
- Specify pose clearly: `Standing naturally, hands at sides, looking at camera`
- Add context: `Professional pose, comfortable stance, natural positioning`
- Generate 3 variations · choose best (R1)

### 12.3 · ISSUE: Clothing doesn't match scene

**Solution**:
- Specify outfit in scenario: `Girl wearing casual gym clothes, holding water bottle`
- Or specify clothing change in integration: `Girl in athletic wear for gym scene`
- Update consistency sheet as needed (re-genera 360 con nuevo wardrobe)

### 12.4 · ISSUE: Lighting looks wrong

**Solution**:
- Specify lighting in base scene: `Natural daylight from window, warm afternoon`
- Ensure consistency between base scene and integrated character
- Integration model usually matches lighting automatically (Smart Editor preserves)

### 12.5 · Microhallazgos issues

| Problem | Solution |
|---|---|
| Some images unsalvageable with editing | Faster regenerate refined prompt |
| Editing best on already-solid images | Build from good foundations |
| Consistency drift detection late | Test consistency early · before 20 images |
| Text glitches on packaging | Simplify background (AI spends detail on scenery) |
| Outputs become overcooked CG-heavy | Remove 1-2 render terms (keep photographic, not CGI) |

---

## 13 · Pattern de interacción con Pablo

- Always **present 3-4 prompt variations** before generating major piece (excepto si concept JSON aprobado)
- After each gen, **provide self-critique** identifying matched vs drifted vs SOP-grade
- When Pablo says "refine X" → adjust ONLY X via Smart Editor Protocol §6.4 · do not rewrite todo
- Organize ALL outputs using naming convention `[project]_[concept]_[variant]_v[N]_[YYYYMMDD]`
- If request contradicts this REFERENCE → **flag conflict before proceeding** (NO ejecutar y luego reportar)
- Si Pablo autoriza "ejecuta todo" → arranca SOLO Fases 1-3 (imagen · NO premium) · PARAR antes de Fase 4 video premium · pedir 2 SÍ explícitos
- Si IP detection rechaza un prompt → reformular con sustituciones safe (§4.2) · NO seguir intentando con misma IP
- **Tutear siempre** · tono directo, cercano, sin humo · frases cortas · verbos activos · números concretos · cierre con próximo paso accionable

---

## 14 · Maintenance + Version log

### 14.1 · Cuándo update este REFERENCE

- Se identifica drift recurrent en outputs (e.g. siempre sale plano · añadir "low-angle three-quarter perspective" reforzado al variant canónico)
- Se demuestra un nuevo patrón de antibacteria/anti-pattern → añadir a §11
- Se descubre nuevo formato canónico (rara vez · disciplina)
- Cambio brand bible (paleta · tipografía · audiencia)
- Nuevo modelo Higgsfield top-tier (re-tarifar §5)

### 14.2 · Cómo update

1. Modificar este REFERENCE en branch nueva
2. Actualizar `DARK-ROOM-PLAYBOOK.md` quick links/tabla maestra si cambian formatos/tiers/costes
3. Actualizar `DARK-ROOM-TEMPLATE.json` schema si campos requeridos cambian
4. Actualizar `tools/dark-frames/validate-concept.mjs` si validation rules cambian
5. Actualizar `infra/scripts/knowledge-gate-hook.py` triggers si nuevos formatos
6. Update `.claude/agents/concept-reviewer.md` si markers nuevos
7. Bump version log abajo
8. PR + merge a main siguiendo protocolo PR + merge automático PACAME

### 14.3 · Version log

- **v1.0** (2026-05-10) — Consolidación inicial. Unifica MEGA-PROMPT-v2 + STYLE-ANCHOR-v2 + KNOWLEDGE-INTEGRATION-v2 + NARRATIVE-ARC-protocol-v1 + CONSISTENCY-CHECKLIST-v1 + AUDIT-knowledge-gaps. 14 secciones · 21 reglas duras · 26+7 markers · 6 style variants · 5 anti-patrones · 5 issues troubleshooting. Reemplaza estos 6 docs como single source of truth (los originales se mantienen en `_archive/` para histórico).

---

**Inyección obligatoria**: este REFERENCE + [`DARK-ROOM-PLAYBOOK.md`](DARK-ROOM-PLAYBOOK.md) + [`DARK-ROOM-TEMPLATE.json`](DARK-ROOM-TEMPLATE.json) deben cargarse al inicio de cada conversación creativa via `session-initializer.mjs`. Sin los tres = NO render premium multi-shot.
