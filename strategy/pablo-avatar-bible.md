# Pablo Avatar Bible · Personaje recurrente PACAME/Dark Room

> Documento canónico · base para todo reel cinematográfico, hero shot, behind-scenes
> Última revisión: 2026-04-27
> Reference principal: `C:/Users/Pacame24/Downloads/WORKFLOWS/highlights/_MG_7518.jpg` (sesión pro mayo 2024)
> 42 fotos disponibles en la carpeta highlights/

---

## 1 · Identidad visual del personaje

### Rasgos faciales (descripción canónica para prompts IA · v2 actualizado 2026-04-27)

```
Spanish male, late 20s / early 30s
Height: 1.78 m · Weight: 74 kg → slim-athletic build, normal BMI 23.4
Light/medium olive skin (mediterraneo)
VOLUMINOUS dark brown hair styled UPWARD and BACK (5-6 cm length on top, sleek pomp/quiff style),
   with very tight undercut fade on the SIDES and back (skin fade to short)
Short LIGHT facial hair: subtle stubble on cheeks + thin "candado/goatee" mustache + small soul patch
   (NOT a full thick beard · current 2026 look is closer-shaved)
Medium-thick dark eyebrows, slightly arched
Brown almond-shaped eyes, intense focused gaze

⚠️ PIERCING (DEFINITIVO 2026-04-27 v3 verificado por Pablo):
   Tipo: NOSTRIL piercing (aro pequeño metálico NEGRO matte, ~6-8mm diámetro)
   Posición: LADO IZQUIERDO DE LA NARIZ DE PABLO
   Cómo aparece en foto frontal: en el lado DERECHO de la imagen (desde POV del observador)
   NO tiene septum · NO tiene labret · NO tiene piercings en otro lado
   Solo este UNO: aro negro pequeño en aleta nasal izquierda (left nostril)

   PROMPT RULE EXACTO:
   "Small black metal hoop nose ring on the LEFT NOSTRIL of the subject (Pablo's own left side ·
    appears on the viewer's RIGHT side in a frontal photograph). NO septum nose ring · NO labret ·
    NO lip piercings · only one small black hoop on left nostril. Preserve exactly as in reference."

Slim-athletic build, square shoulders.
Default neutral expression with slight upward curl of lips (subtle smile).
Slight asymmetry in smile (more on the right side).
```

### Photo references (en orden de utilidad)

**Reference A (default frontal)**: `C:/Users/Pacame24/Downloads/yo pablo/photo_2026-04-27_18-31-35.jpg`
- Frontal · sonrisa sutil · luz natural ventana · selfie 2026-04-27
- Mejor para hero shots y cara mirando cámara

**Reference B (¾ profile)**: `C:/Users/Pacame24/Downloads/yo pablo/photo_2_2026-04-27_18-32-54.jpg`
- Perfil ¾ · luz natural · pelo voluminoso muy definido
- Mejor para shots de lado, working shots, ¾ profile

**Reference C (frontal serio)**: `C:/Users/Pacame24/Downloads/yo pablo/photo_5_2026-04-27_18-33-17.jpg`
- Frontal · expresión seria/intensa · luz suave
- Mejor para shots dramáticos · hero noir Dark Room

48 fotos totales en `C:/Users/Pacame24/Downloads/yo pablo/` (subidas 27-abr 18:30-18:33).
Reference antiguas (mayo 2024) en `WORKFLOWS/highlights/` están **OBSOLETAS** · NO usar.

### Vestuario default (3 looks)

**Look A · "Founder casual"** (default para 70% del contenido)
```
Plain black t-shirt or hoodie
Optional: subtle white text on chest "Nineteen Ninety / Sports & Leisure"
Dark jeans or black pants (off-camera)
Minimalist · expensive feel · streetwear founder
```

**Look B · "Cinematic noir"** (para reels Dark Room)
```
Black hoodie up over head (optional)
Black t-shirt underneath
Hands visible, working with laptop or phone
Underlit by acid green neon
Mood: Mr. Robot × cyberpunk founder
```

**Look C · "Brand authority"** (para reels PACAME B2B)
```
Dark blazer over black t-shirt
Smart casual · approachable but professional
Background: minimalist office / concrete wall / dark wood desk
Mood: Apple keynote × Stripe founder profile
```

---

## 2 · Iluminación característica por marca

### PACAME mode (B2B · violeta + cyan)
```
Key light: warm soft from front-above
Rim light: violet #7C3AED from one side
Accent: cyan #06B6D4 from opposite side
Color graded violet-blue-black
Mood: editorial premium B2B
```

### Dark Room mode (B2C · acid green)
```
Key light: minimal / dim
Rim light: ACID GREEN #CFFF00 strong from one side
Accent: subtle warm amber from below
Color graded green-black with extreme contrast
Mood: cinematic noir · Mr. Robot × cyberpunk
```

### Mixed / Behind scenes
```
Natural daylight or softbox
Background: minimalist studio
Color graded neutral with subtle accent
Mood: documentary editorial (think NYT Magazine portrait)
```

---

## 3 · Composiciones recurrentes

| Composición | Uso | Descripción |
|---|---|---|
| **Frontal medio cuerpo** | Hero shots / opening reels | Mirada directa cámara · pecho hacia arriba · plano abierto a la izquierda para typography |
| **¾ profile** | Behind scenes · trabajando | Mirando a un lado · pantalla iluminándole la cara · cinematic |
| **Silueta backlit** | Reveals · transiciones | Backlit por neón verde/violeta · misterio · solo silueta reconocible |
| **Hands close-up** | Demos · screen interactions | Solo manos sobre teclado / móvil · cara fuera de frame · enfoque en lo que hace |
| **Walking shot** | Brand films · openings | Caminando hacia/desde cámara · low angle · cinematográfico |

---

## 4 · Prompt base para gpt-image-2/edit (reusable)

Template: usar foto `_MG_7518.jpg` (o cualquier highlights/) como input + este prompt de variación:

```
Transform this real portrait photograph into [SCENE] while keeping the EXACT SAME PERSON:
- Same facial features (face shape, beard, eyes, septum piercing, hair)
- Same general body type
- Same skin tone

NEW SCENE: [describir aquí · ej: "in a dark cinematic noir hallway with acid green neon practical light from behind"]
NEW LIGHTING: [Dark Room mode | PACAME mode | Mixed mode · ver bible §2]
NEW WARDROBE: [Look A | B | C · ver bible §1]
NEW COMPOSITION: [Composición §3]

ATMOSPHERE: 35mm film grain, cinematic editorial mood, premium magazine quality, [genre specific keywords].

CRITICAL: preserve facial identity exactly · this is the same person, not a stylized version. No replacement of face, no change of hair color or beard shape, no removal of septum piercing.

LAYOUT (Instagram safe area · ver IG-SAFE-AREAS.md):
- Subject in middle 60% of frame
- Top 80px and bottom 240px reserved for safe area + typography
- No overlap with the safe zones
```

---

## 5 · Pipeline producción reels con personaje

### Workflow estándar (basado en TEASER + AI PODCASTER de Pablo)

**Paso 1 · Key art master** (1 imagen)
- Modelo: `openai/gpt-image-2-developer/edit` vía Atlas
- Input: 1 foto Pablo de highlights (ej. `_MG_7518.jpg`)
- Prompt: bible §4 con escena hero del reel
- Validar visualmente coherencia facial · si no respeta → reroll una vez

**Paso 2 · Anchors derivados** (4-6 imágenes)
- Modelo: `openai/gpt-image-2-developer/edit` con KEY ART (no la foto original) como input
- Prompt: variación de escena pero misma cara/personaje
- Cada anchor representa un beat del reel (intro, problema, revelación, solución, CTA)

**Paso 3 · Video clips** (4-6 × 5s)
- Modelo: `bytedance/seedance-2.0/reference-to-video` ($0.127/seg) o `bytedance/seedance-2.0-fast/image-to-video` ($0.101/seg)
- **Reference-to-video es SUPERIOR para personaje recurrente** (mantiene cara entre clips)
- Pasar la foto Pablo original como reference + el anchor como image input
- Prompt: movimiento sutil (pan, push, tilt) + Pablo realiza acción específica

**Paso 4 · Voz over**
- ElevenLabs voz Brian (multilingual_v2) por defecto · cinematográfico autoritativo
- O voz Pablo clonada (custom · creator tier permite 1 voice clone)

**Paso 5 · Edición ffmpeg**
- Concat clips con xfade transitions
- LUT cinematográfico Dark Room (verde-negro) o PACAME (violeta-cyan)
- Subs burned-in (CapCut style)
- Música: YouTube Audio Library trending phonk/cinematic

### Coste por reel con personaje
- 1 key art (gpt-image-2 edit) · $0.012
- 5 anchors derivados · $0.06
- 5 clips video Seedance Fast image-to-video · $2.53
- Voz Brian · $0 (free creator tier)
- **Total**: ~$2.60 / reel · 8 reels mes = **$21**

### Si Seedance reference-to-video falla coherencia
Fallback escalado:
1. **Vidu Q3 reference-to-video** ($0.042/seg) — más barato, especializado en character consistency
2. **Higgsfield character workflow** (si está disponible vía Atlas) — específico Mr. Robot style
3. **Sin personaje en frame · solo voz Pablo + escenarios** — caso peor, mantenemos voz pero perdemos cara

---

## 6 · Reglas duras del personaje

1. **Coherencia facial**: cada generación debe ser RECONOCIBLE como Pablo · si los ojos/barba/piercing cambian, REGENERAR
2. **Vestuario consistente por reel**: si el reel empieza con hoodie negro, NO cambiar a blazer en clip 3
3. **Mismo lighting mode por reel**: no mezclar PACAME violeta con Dark Room verde en el mismo reel · una marca por pieza
4. **Septum piercing visible**: detalle reconocible · debe aparecer en TODOS los frontales y ¾
5. **Mirada cámara intencional**: cuando habla a cámara → mirada directa · cuando trabaja → no cámara
6. **Sin filtros estilizados**: cara realista · NO anime, NO comic style, NO airbrush extremo · realismo editorial
7. **Una sola persona en el frame**: salvo behind scenes específico · evitar otras personas que distraigan
8. **Manos visibles cuando aplique**: muestran acción + humanizan

---

## 7 · Antipatrones (NUNCA)

- ❌ Cambiar la edad aparente (Pablo no es ni un crío de 18 ni un señor de 50)
- ❌ Cambiar el género (es claramente masc · no usar "person" genérico que el modelo interprete amba/femenino)
- ❌ Quitar el septum piercing por "limpieza" · es seña reconocible
- ❌ Cambiar color de pelo o longitud · castaño oscuro corto with undercut
- ❌ Añadir gafas si Pablo no las usa habitualmente · revisar fotos de referencia
- ❌ Estilizar como cartoon · 3D Pixar · anime · keep it real
- ❌ Mezclar Pablo con otras caras famosas (avoid celebrity bias del modelo)
- ❌ Usar el avatar para anuncios fake o testimonios falsos · solo donde Pablo realmente diría eso

---

## 8 · Lista de fotos disponibles para uso (highlights/)

42 fotos JPG verificadas (sesión profesional mayo 2024 · `C:/Users/Pacame24/Downloads/WORKFLOWS/highlights/`):

```
_MG_7518.jpg ← reference principal (frontal, neutral, well-lit)
_MG_7519.jpg
_MG_7520.jpg
_MG_7525.jpg
_MG_7526.jpg
_MG_7527.jpg
_MG_7529.jpg
_MG_7533.jpg
... +34 más
```

Pablo dijo: "si necesitas más fotos mías me las pides". Si para algún reel necesitamos:
- **Foto en exterior** (parque, calle, ciudad)
- **Foto trabajando con portátil**
- **Foto con ropa específica** (blazer, traje)
- **Foto con expresión específica** (sonriendo, serio extremo)

→ pediremos a Pablo · 5 min con móvil sirve para reference adicional.

---

## 9 · Validación inicial · TEST OBLIGATORIO antes de producir reels

Antes de gastar $20+ produciendo 8 reels con personaje, validamos con un test mínimo:

**Test #1 · Coherencia facial gpt-image-2/edit** ($0.012)
- Input: `_MG_7518.jpg`
- Prompt: bible §4 con escena Dark Room cinematic noir
- Output: 1 imagen
- Validación: ¿se reconoce a Pablo? sí/no
- Si NO → cambiar approach a Vidu Q3 o sin personaje

**Test #2 · Coherencia entre 2 anchors** ($0.024)
- Input: foto Pablo
- Generar anchor #1 (Pablo en sala con neón verde)
- Generar anchor #2 usando anchor #1 como input + prompt nueva escena
- Validación: ¿la cara es la MISMA en ambos? sí/no

**Test #3 · Coherencia en video** ($0.50)
- Input: anchor #1
- Seedance 2.0 reference-to-video · 5 segundos
- Validación: ¿la cara se mantiene durante los 5 segundos? sí/no

**Coste total tests**: $0.55. Si los 3 pasan → green light a producción reels. Si fallan → reset estrategia.

---

## 10 · Próximos pasos inmediatos

1. **HOY**: ejecutar Test #1 · gpt-image-2/edit con `_MG_7518.jpg` + prompt Dark Room
2. **HOY**: mostrar resultado a Pablo · GO/NO-GO
3. Si GO: Test #2 + Test #3 ($0.55 acumulado)
4. Si todo OK: producir Reel #1 hero (Stack creador 2026 · Mar 28 abr según calendario v2) · ~$3 coste
5. Iterar: usar feedback de cada reel para refinar bible

---

**Maintainer**: Pablo Calleja · **Bible version**: v1.0 · **Próxima revisión**: tras Test #1
