# Template 1-act 8s · Cinemática Conectada al Producto (15% del feed)

> Formato: 1-act 8s · 1 shot continuo · 1080×1920 9:16
> Tier: CINEMATIC (Seedance 2.0 + Soul V2 base scenes) o HYBRID
> Función funnel: TOP scroll-stop · viceral + relatable + connected al producto Dark Room
> Coste/pieza: ~$1.10 (Seedance 2.0 single shot 8s)
> Doble SÍ Pablo obligatorio (es video premium)
> Frecuencia: 1 vez/semana o cada 10 días

---

## Concepto base · "Stack Asphyxia Relief"

UNA acción evolutiva continua de 8s: creator hispano (cara no visible · usar perfiles parciales · manos · POV detrás de pantalla) mira factura Adobe en pantalla · expresión stress · cierra laptop bruscamente · abre Dark Room dashboard · cara/postura alivio · respiración profunda.

**Importante**: NO usar avatar creature como protagonista de esta pieza · esta categoría requiere HUMANO relatable (puede ser cualquier creator anónimo · NO Pablo cara real). Avatar puede aparecer en outro 2s o como icon en pantalla del dashboard Dark Room.

---

## Storyboard 8s · single shot continuo

**0-1.5s** · CLOSE-UP MANOS sobre teclado · luz blue de pantalla laptop · ambient quiet · subject_motion: "fingers stop typing, hover above keys"

**1.5-3s** · POV de pantalla mostrando email Adobe "Your subscription has been renewed · 60€" · subject_motion: "eyes (off-frame) read · slow blink · jaw tightens" · audio: subtle email notification sound + breath in

**3-5s** · WIDE shot back · creator visible solo desde detrás (silueta + parte del torso · cara NO visible) cierra laptop bruscamente · subject_motion: "right hand slams laptop shut · 30° body rotation away from desk"

**5-6.5s** · POV otra pantalla (iPad o teléfono) mostrando dashboard Dark Room landing page (29€/mes visible) · subject_motion: "thumb taps DarkRoom button on screen"

**6.5-8s** · CLOSE-UP perfil (3/4 desde atrás · cara aún no visible) creator respira profundo · cara hacia ventana con luz natural · postura más relajada · subject_motion: "shoulders drop · slow exhale · slight smile profile (cheek visible)"

**camera_motion**: handheld kinetic subtle sway · lens 35mm · stable rig · NO whip pans · vibe natural cotidiana

**motion_priority**: subject (la cámara solo apoya · no protagoniza)

---

## Audio plan 5 sync points

| Tiempo | SFX/Audio | Loudness |
|---|---|---|
| 0s | ambient quiet office/cafe + soft keyboard typing | -32 LUFS bg |
| 1.8s | email notification "ping" subtle | -22 LUFS |
| 2.5s | breath in audible (frustrated) | -24 LUFS |
| 4s | laptop slam crisp impact | -14 LUFS peak |
| 5.5s | finger tap on tablet glass | -18 LUFS |
| 7s | long slow breath out + ambient calm pad enters | -16 LUFS music sustain |

**LUFS target master**: -16 cinema standard
**Música**: minimal · NO synthwave dramatic (eso era para concept 005/007 obsoleto) · ambient pad calm + único piano note resolution en 7s. **Mood**: real, intimate, cotidiano · no cinemático Hollywood.

---

## Caption arriba del video (overlay text · 2 frames)

**Frame 0-3s** (cuando ve la factura):
```
HOY ME COBRARON 60€ POR ADOBE.
```
Tipografía: Anton ALL CAPS · color `#F2F2F2` · upper third · animation: typewriter 0.4s · hold 2.6s

**Frame 5-8s** (cuando abre Dark Room):
```
DESDE HOY, NUNCA MÁS.
```
Tipografía: Anton ALL CAPS · color acid green `#CFFF00` · lower third · animation: glitch_in 0.2s · hold 2.6s

---

## Caption IG completa

```
Hoy renovó Adobe 60€.
Otra vez.
Sin avisar.
Sin pedir permiso.

He pagado 60€ todos los meses durante 3 años.
Suma 2.160€. Lo conté esta noche.

Dark Room me da el mismo Adobe (y Figma · ChatGPT · Midjourney · Cinema 4D...) por 29€/mes mediante membresía colectiva legal.

A partir de hoy, 31€ menos cada mes en gastos invisibles.

Si tu stack creativo te asfixia más que el alquiler, prueba 14 días gratis sin tarjeta.

darkroomcreative.cloud

Comenta STACK si quieres la comparativa precio detallada.
Comenta AHORRO si quieres que te calcule tu ahorro anual personalizado.

#DarkRoom #darkroomcreative #freelance #creator #stack #adobealternative
```

---

## Outro 1.7s Dark Room

Concat al final del shot 8s: `tools/dark-frames/assets/outro-darkroom-2s-v2.mp4` (1.7s) con texto "TODO HECHO CON · darkroomcreative.cloud"

**Total master**: 8s shot + 1.7s outro = **9.7s reel**

---

## Pipeline producción

1. **Pre-pro** (30 min):
   - Decidir creator stand-in (puede ser Pablo silueta sin cara · puede ser actor amateur · puede ser AI-generated humano genérico via Soul V2 con cara hidden)
   - Storyboard 3 frames clave (factura · slam · alivio)

2. **Phase 2 base scenes** (Soul V2 · 6 frames):
   - Frame 1: hands on keyboard ($0.06)
   - Frame 2: Adobe charge screen POV ($0.06)
   - Frame 3: laptop slam mid-action ($0.06)
   - Frame 4: tablet dashboard Dark Room ($0.06)
   - Frame 5: profile breath out ($0.06)
   - Frame 6: end frame (3/4 profile · slight smile · last) ($0.06)
   - Total: ~$0.36

3. **Phase 4 video premium** (Seedance 2.0 single 8s):
   - `--medias start_frame` (frame 1) `--end-image` (frame 6) `--duration 8 --aspect_ratio 9:16`
   - Doble SÍ Pablo obligatorio
   - Coste: ~$1.10

4. **Phase 5 composition** (ffmpeg post):
   - LUT cinematic noir subtle (no Vice City magenta-cyan · ese era concept 005)
   - Burn captions Anton (frames 0-3s y 5-8s)
   - Concat outro 1.7s
   - Audio mix 6 sync points + minimal music pad
   - Master 9.7s · 1080×1920 30fps H.264 yuv420p

**Coste total estimado**: $1.10 (Seedance) + $0.36 (Soul V2 frames) = **$1.46** + 2-3h producción post.

---

## Validación pre-render

1. `node tools/dark-frames/validate-concept.mjs <path-concept.json>` → exit 0
2. concept-reviewer subagent → APROBADO
3. visual-reviewer subagent post-Seedance → cara creator NO visible · CTA outro presente · numbers Adobe 60€/Dark Room 29€ correctos · mood cotidiano (no dramatic)

---

## Anti-patrones de esta pieza

- ❌ Usar a Pablo PACAME Soul Character cara visible (rompe anonimato · ESO ES LEGACY)
- ❌ Avatar creature como protagonista (en esta pieza es solo icon en pantalla dashboard · no main character)
- ❌ Estética dramatic Vice City / GTA / cinematic Hollywood (esto es cotidiano relatable · NO el mood concept 005/007)
- ❌ Música synthwave 80s drop dramatic (ambient pad calm only)
- ❌ Múltiples escenas con cortes (ES 1-ACT · 1 sola toma continua · NO 4 escenas inconexas error concept 007)
- ❌ Olvidar el CTA outro (la pieza NO funciona sin Dark Room CTA al final)

---

## Métrica clave

- **Comments con keyword STACK/AHORRO**: target 30-50/post
- **Saves rate**: ≥3% (saves = audience guarda para volver · mejor señal algorithm que likes)
- **Watch completion**: ≥75% (8s + 1.7s outro = pieza corta · debería completarse)
- **Trial signups asociados al post** (Stripe attribution): target 3-8/post

---

## Variants reusables

Una vez funcione este template piloto, crear variants:

- **Variant Figma**: factura Figma Pro 15€ en lugar de Adobe · mood "y solo es Figma..."
- **Variant Midjourney**: factura Midjourney 30€ · "y solo es generación de imágenes"
- **Variant suma total**: facturas múltiples acumuladas · stress mayor · "232€ este mes en suscripciones"
- **Variant testimonial real**: creator real (con permission) cuenta su historia en cámara con voz off Pablo narrating

Cada variant mantiene la estructura 1-act 8s + outro + CTA · pivota el dolor en herramienta específica.
