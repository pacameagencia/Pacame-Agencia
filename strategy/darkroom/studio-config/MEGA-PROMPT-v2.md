# Dark Room · Mega Prompt v2.0

> **Estado**: Documento maestro vivo · v2 incorpora 21 hallazgos del doc CONOCIMIENTO PROMPT IA.txt (8/05/2026)
> **Sustituye**: MEGA-PROMPT-v1.md (referencia mantenida en repo para audit)
> **Inyección**: cargar al inicio de CADA conversación creativa via Session Initializer · NO arrancar render premium sin esto

---

## Version log
- **v2.0** (2026-05-08) — Aplicados 21 hallazgos: workflow 4-fase Soul base + Pro substitution + Pro/Soul cinematic vs authentic + JSON 9 categorías + texture stack + 360 Consistency Sheet master prompt + smart editor protocol + Nano Banana PRO Protocol DoP mindset + character anchor + ultra realism micro-imperfections
- **v1.0** (2026-05-08 earlier) — Inicial SOP "AI Creative Studio v1.0 March 2026" aplicada

---

## SECTION A · Studio Identity

(igual que v1 · cuenta `@darkroomcreative.cloud` 52.205 followers · audiencia LATAM 80% hombres 35-54 · pricing 24,90€/mes Pro + 349€ Lifetime · Soul Character `PACAME` reference_id `55ac4b3b-51f7-497a-8150-87563a969915`)

### NUEVO v2 · Character Bible Pablo

| Asset | Path |
|---|---|
| 360 Consistency Sheet | `tools/dark-frames/character-bibles/pablo/pablo-360-sheet-v1.png` |
| Soul Character ID Higgsfield | `55ac4b3b-51f7-497a-8150-87563a969915` (type `soul_2` · status `completed`) |
| Master prompt 360 sheet | guardado en este Mega Prompt §F.1 |
| Facial description (texto) | TODO · extraer con ChatGPT del 360 sheet |

---

## SECTION B · Visual Standards

(igual que v1 · paleta acid green canónica + 3 variants Vice City/BR2049 + tipografía Anton/Space Grotesk/JetBrains Mono + safe areas IG)

### NUEVO v2 · Cinematic vs Authentic decision matrix

Cada concept declara explícitamente su tier:

| Tier | Modelo principal | Prompt language | Use case Dark Room |
|---|---|---|---|
| **CINEMATIC** | Nano Banana Pro 2K (image) + Cinematic Studio Video V2 (video) | "cinematic lighting", "RED 8K", "professional cinematography", "color graded", "shot on 70mm film, Hasselblad X1D" | DARK_FRAMES hero · provocador · Dark Room directo |
| **AUTHENTIC** | Higgsfield Soul + Soul Cast (video) | "shot on iPhone 15 Pro Max", "natural light", "authentic", "unedited", "raw", "candid" | Stories diarias · UGC · BTS Pablo cotidiano · tendencia rápida |
| **HYBRID** | Soul para base scene + Pro para character substitution + Pro/Seedance para video | mix según fase | Piezas que necesitan iPhone realism + character precision |

---

## SECTION C · Output Specifications

(igual que v1)

### NUEVO v2 · Generation batch standard SOP

- **Imagen**: SIEMPRE generar 3 variations · evaluar contra 4 criterios (adherence · technical · impact · usability) · keep best
- **Video premium**: SOLO 1 generación por shot tras 2 SÍ Pablo + cost-guard token (cada gen $1-3 · no permitimos batch sin OK)

---

## SECTION D · Negative Constraints (NEVER) · Reforzado v2

### Prompts NEVER incluyen (lista actualizada con learnings concept 005 v1)

- **IP marks de terceros explícitos**: GTA · Vice City · Liberty City · Rockstar · Ducati · Lamborghini · Aventador · Ferrari · Stranger Things · Hawkins · Mario · Nintendo · Disney · Marvel · Star Wars · Adobe · Figma · Midjourney · Coca-Cola · Nike · Apple · etc → Higgsfield rechaza con `ip_detected` y **cobra créditos igual** (45 cr tirados en concept 005 v1)
- **Sustituciones SAFE para evitar IP**: "GTA Vice City" → "1980s Florida-inspired open-world game aesthetic" · "Lamborghini" → "pastel pink Italian sport car" · "Ducati" → "Italian sport motorbike" · "Rockstar RAGE engine" → "AAA game cinematic CGI hyperreal"
- **Texto inventado IA en señales/letreros** (kanji ilegible · neón fake · receipts con palabras inventadas) — añadir `no readable kanji or japanese text` · `no readable text on signs` · `no logos visible`
- **Caras múltiples reconocibles** excepto Soul Character `PACAME` con sheet 360
- **Faces sonriendo glamour stock-style** — añadir `no smiling glamour` · `no stock-photo aesthetic`
- **Manos con 6+ dedos / extra fingers / deformed limbs** — negative prompt obligatorio
- **Watermarks competidores visibles**

### Visualmente NEVER aparece

(mismo v1 · gradient azul-violeta techbro · stock con auriculares · emojis fuego · "increíble revolucionario" · symmetric centered · HDR over-processed · plastic CGI · midday overcast sin justificación)

### Operacionalmente NEVER

- Generar video premium (Veo / Seedance / Kling / Cinematic Studio Video) sin **2 SÍ explícitos Pablo formato exacto** (regla `feedback_doble_aprobacion_videos.md`)
- Editar `meta.json::approved` a mano
- Generar tokens cost-guard con `openssl rand` (solo `emit-cost-guard.mjs` Supabase RPC)
- Crear flags `--skip-*` (visual-reviewer · checks · etc)
- Publicar pieza sin pasar Three-Pass Review (Technical · Style · Creative)
- Mencionar PACAME (la agencia) o La Caleta o Ecomglobalbox en feed `@darkroomcreative.cloud`
- Tests genéricos "test" en modelo video premium (cada gen $1-3 ÷ propósito)
- **NUEVO v2**: Generar shot video sin pasar antes por Fase 3 substitution Soul → Pro (workflow 4-fase obligatorio)
- **NUEVO v2**: Renderizar `cinematic_studio_3_0` o cualquier video premium SIN `--medias start_image` cuando concept incluye Soul Character (concept 005 v1 falló por esto · Pablo no apareció)

---

## SECTION E · Workflow Instructions · Reescrito v2 al WORKFLOW 4-FASE OBLIGATORIO

### Fase 1 · Character Anchor (1 vez por character · reusable forever)

```bash
hf generate create text2image_soul_v2 \
  --soul-id 55ac4b3b-51f7-497a-8150-87563a969915 \
  --prompt "[MASTER PROMPT 360 CONSISTENCY SHEET · §F.1]" \
  --aspect_ratio 3:4 --wait
```

Guardar el output como `tools/dark-frames/character-bibles/[character]/[character]-360-sheet-v[N].png`.
Coste típico: 0.12-25 cr (depende de complejidad prompt).
Reusable en TODOS los shots futuros del character.

### Fase 2 · Base Scenes (sin character)

Para cada shot del concept, generar la ESCENA SIN PABLO con el modelo según tier:

```bash
# CINEMATIC tier (DARK_FRAMES hero · Dark Room directo)
hf generate create nano_banana_2 \
  --prompt "[JSON 9-category prompt · §F.2 · subject = 'modern minimalist Vice City beach with empty pastel pink sport car parked at sunset' · NO Pablo]" \
  --aspect_ratio 4:5 --resolution 2k --wait

# AUTHENTIC tier (UGC · stories · tendencia rápida)
hf generate create text2image_soul_v2 \
  --prompt "[JSON 9-category con 'shot on iPhone 15 Pro Max' + natural light · NO Pablo]" \
  --aspect_ratio 3:4 --wait
```

Coste típico:
- Cinematic Pro 2K: 2 cr × 4 base scenes = 8 cr
- Authentic Soul: 0.12 cr × 4 = 0.48 cr (free pool)

### Fase 3 · Character Substitution (Pablo en cada base scene)

```bash
# Subir base scene + 360 sheet + smart editor prompt
hf generate create nano_banana_2 \
  --prompt "While keeping everything else identical, replace the placeholder area where a person should be in the first uploaded picture with the trained subject from the 360 consistency sheet (second uploaded picture). Maintain exact facial features, skin tone, hair, and identity from the consistency sheet. Adapt body posture and clothing to fit the scene context naturally. Preserve all environmental details, lighting, color grading, and composition from the first picture exactly as they are." \
  --image base-scene.png --image 360-sheet.png \
  --aspect_ratio 4:5 --resolution 2k --wait
```

Coste típico: 2 cr × 4 substitutions = 8 cr.

### Fase 4 · Video premium (image-to-video · REQUIERE 2 SÍ Pablo)

```bash
# Solo tras 2 SÍ Pablo formato exacto + cost-guard token via emit-cost-guard.mjs

hf generate create cinematic_studio_video_v2 \
  --prompt "[Action description · 'Subject does X while saying Y' · stable camera no zoom]" \
  --medias <substitution-image-uuid> \
  --aspect_ratio 9:16 --duration 5 --genre action --wait

# O si concept requiere multi-shot consistent identity SOTA:
hf generate create seedance_2_0 \
  --prompt "[same]" \
  --medias <substitution-image-uuid> \
  --aspect_ratio 9:16 --duration 5 --genre action --resolution 720p --mode std --wait
```

Coste típico:
- Cinematic Studio Video V2 5s 9:16 action: 7.5 cr × 4 shots = 30 cr
- Seedance 2.0 5s std: 22.5 cr × 4 shots = 90 cr

### Fase 5 · Composition + Outro

ffmpeg concat shots + outro v2 (`outro-darkroom-2s-v2.mp4` "TODO HECHO CON · darkroomcreative.cloud") + LUT cinematográfico + captions burned-in + loop seamless 10s.

### Three-Pass Review obligatorio antes de aprobar pieza

(igual que v1 · §6.1 SOP · 26 markers · Pass 1 Technical + Pass 2 Style 11 checks + Pass 3 Creative 8 checks)

---

## SECTION F · Master Prompts Reference

### F.1 · 360 Consistency Sheet master prompt (CHARACTER)

(de CONOCIMIENTO PROMPT IA.txt líneas 2752-2782)

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

### F.2 · JSON 9-category prompt template

(de doc CONOCIMIENTO PROMPT IA.txt líneas 5770-5816)

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

### F.3 · Texture stack obligatorio (paste al final de cada prompt cinematic)

(de CONOCIMIENTO PROMPT IA.txt líneas 6841-6845)

```
Texture stack realism: shot on 70mm film, Hasselblad X1D, f/2.8, ray-traced global illumination, subsurface scattering, texture-rich materials, micro-imperfections (subtle scratches on metal, faint fingerprints on glossy, fabric weave visible, contact shadows where objects touch surfaces), uncompromising detail, premium commercial advertising look, Kodak Portra 400 push +1 grain emulation, halation on highlights, no plastic CGI cleanliness, no HDR over-processing.
```

### F.4 · Smart Editor Protocol (in-painting natural language)

(de CONOCIMIENTO PROMPT IA.txt líneas 4255-4310 · 4434-4467)

**Formula**: "While keeping everything else identical, [describe ONLY the change]. Maintain [list elements to preserve]."

**Ejemplos válidos**:
- ✅ "While keeping everything else identical, change the blue jacket to a textured crimson leather jacket. Maintain lighting interaction, shadows, and the same identity."
- ✅ "While keeping everything else identical, replace the person in the first uploaded picture with the subject from the 360 consistency sheet (second uploaded picture). Maintain exact facial features and identity."
- ❌ "Add a person + change lighting + new background" (3 cambios = regenerar desde cero, no in-painting)

### F.5 · Character anchor in scene prompt (Base DNA repeat)

(de CONOCIMIENTO PROMPT IA.txt líneas 6754-6772)

Cuando NO se usa 360 sheet (concept ad-hoc), repetir 2-3 identity anchors dentro del prompt:

```
BASE DNA: Photorealistic [AGE] [GENDER] with [HAIR DETAILS], [EYES], wearing [DEFINING OUTFIT]. [SHARP FACIAL FEATURES], [SKIN TEXTURE].

[Scene prompt continues with anchors repeated 2-3 times throughout]
```

---

## SECTION G · Pattern de interacción con Pablo (igual que v1 + ajustes v2)

- Always **present 3-4 prompt variations** before generating major piece (excepto si ya hay concept JSON aprobado)
- After each gen, **provide self-critique** identifying matched vs drifted vs SOP-grade
- When Pablo says "refine X" → adjust ONLY X via Smart Editor Protocol §F.4 · do not rewrite todo
- Organize ALL outputs using naming convention `[project]_[concept]_[variant]_v[N]_[YYYYMMDD]`
- If request contradicts Mega Prompt → **flag conflict before proceeding** (NO ejecutar y luego reportar)
- **NUEVO v2**: Si Pablo autoriza "ejecuta todo" → arranca SOLO Fases 1-3 (imagen · NO premium) · PARAR antes de Fase 4 video premium · pedir 2 SÍ explícitos
- **NUEVO v2**: Si IP detection rechaza un prompt → reformular con sustituciones safe (§D) · NO seguir intentando con misma IP

---

## SECTION I · Frame-to-Frame Continuity (NUEVO v2.1 · feedback Pablo 2026-05-08)

> **Pillar 4 NUEVO** del SOP · garantiza sentido narrativo + movimientos fluidos cross-shot · doc completo en [`NARRATIVE-ARC-protocol-v1.md`](./NARRATIVE-ARC-protocol-v1.md).

### Reglas duras

1. **Wardrobe continuity** — el personaje LLEVA EL MISMO WARDROBE en TODOS los shots de la pieza, salvo que el concept declare wardrobe-progression con justificación temporal explícita.
2. **Motion arcs declarados** — cada shot del concept JSON declara `subject_motion` + `camera_motion` + `motion_priority` (`subject` / `camera` / `both`) con verbos concretos + duración + dirección.
3. **Transitions handoff** — cada cut entre shots declara `type` + `ending_frame` + `opening_frame` + `audio_handoff`. Tipos válidos: `match_cut`, `j_cut_audio`, `whip_pan_continuation`, `push_in_to_closeup`, `match_action`, `color_match`, `symbolic_match`.
4. **Audio sync points** — cada shot declara mínimo 1 punto de sincronía (engine rev / tire screech / music drop / ambient).
5. **Lighting continuity** — misma key light direction + color temperature cross-shot, salvo justificación temporal (mañana → atardecer).

### Anti-patrones bloqueantes

- ❌ Cambio wardrobe shot-a-shot sin justificación → look "stitched stock photo collage"
- ❌ "Pablo poses confidently" sin verbo concreto → motion drift
- ❌ "Cinematic camera angle" sin nombrar el move + speed → ambigüedad
- ❌ Hard cut sin handoff (a menos que el género lo justifique como jump-scare)
- ❌ Identity wobbles cross-cut (different face) → break inmersión

### Validación visual-reviewer (checks 27-33 NUEVOS)

- Check 27: Wardrobe continuity coherente en todos los shots
- Check 28: Subject identity cross-shot match 360 sheet
- Check 29: Lighting continuity (key + temperature)
- Check 30: Motion arcs declarados cada shot
- Check 31: Transitions handoff declaradas cada cut
- Check 32: Audio sync points mínimo 1 por shot
- Check 33: Narrative arc coherente (hook → build → climax → reveal)

### Workflow operativo aplicado (extiende §E Workflow 4-fase)

- **Antes de Fase 2** (base scenes): redactar `sequence` field del concept JSON con narrative arc + 4 pilares (10 min planning)
- **En Fase 3** (substitution): inyectar prompt `WARDROBE COHERENCIA con S[N-1]: SAME [wardrobe descriptors]` en cada substitution
- **Antes de Fase 4** (video premium): validar motion arcs + transitions + audio sync listos · si gap → completar antes de quemar créditos video
- **Three-Pass Review**: añade los 7 checks NUEVOS (27-33) a Pass 2 Style

---

## SECTION H · Maintenance

(igual que v1)

- v2.0 → v2.1 cuando se identifique drift recurrent
- v2.x → v3.0 cuando audiencia objetivo se valide o brand evolucione

---

**Inyección obligatoria**: Este Mega Prompt v2 + `STYLE-ANCHOR-v2.md` + `CONSISTENCY-CHECKLIST-v1.md` + `NARRATIVE-ARC-protocol-v1.md` deben cargarse al inicio de cada conversación creativa via `studio-config/session-initializer.mjs`. Sin los cuatro = NO render premium multi-shot.
