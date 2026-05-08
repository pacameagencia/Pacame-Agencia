# Dark Room · Narrative Arc Protocol v1.0

> **Pillar 4** del SOP (NUEVO 2026-05-08) · garantiza que cada concept multi-shot tiene **sentido narrativo entre escenas** y **movimientos fluidos del personaje** frame-to-frame.
> **Origen**: feedback Pablo 8/05/2026 + CONOCIMIENTO PROMPT IA.txt secciones multi-shot consistency, motion smoothness, action verb chaining, camera continuity.
> **Aplicación**: cada concept JSON declara `sequence` field con 5 sub-fields (order · wardrobe · motion · transitions · audio_sync).
> **Bloqueante**: visual-reviewer rechaza si wardrobe inconsistent OR motion arcs no declarados OR transitions sin handoff.

---

## Pilar 1 · Wardrobe Continuity (cross-shot)

**Regla dura**: el personaje LLEVA EL MISMO WARDROBE en TODOS los shots de la pieza, salvo que el concept declare **explícitamente** "wardrobe-progression" justificada por jump-cut temporal (mañana/atardecer/noche con cambio explicit on-screen).

| Caso | Wardrobe rule | Ejemplo |
|---|---|---|
| **Single-day arc** (caso default) | UNA sola wardrobe en toda la pieza | Hawaiian shirt + linen pants + aviators en frames 1, 2, 3, 4 (concept 005 v3) |
| **Day-to-night progression** | 2 wardrobes con transición visible | Hawaiian día → tuxedo noche con on-screen "later that night" cut |
| **Multi-character arc** | Cada character con SU wardrobe consistente | Pablo Hawaiian + Maria red dress en todos los shots donde aparezcan |

**Anti-patrón prohibido**: cambio wardrobe random shot-a-shot sin justificación narrativa = se siente "stitched", rompe inmersión, look-and-feel "stock photo collage" en lugar de cinematic.

**Validación**: visual-reviewer compara wardrobe descriptors entre shots — si difference >30% sin field `wardrobe_change_justification` → REJECT.

---

## Pilar 2 · Motion Arcs (subject + camera per shot)

**Cada shot declara DOS motion vectors** en concept JSON:

```json
{
  "shot_id": "S1_beach_lambo",
  "subject_motion": "Pablo turns head from looking at car hood toward camera, then takes one step forward leaning right hand on hood, slow confident movement",
  "camera_motion": "Slow dolly-in from wide to medium-wide, stable on tripod, no shake, push 30% closer over 5 seconds, ending at three-quarter framing",
  "motion_priority": "subject" 
}
```

### Subject motion language (action verbs encadenados)

**Verbos válidos** (extraído CONOCIMIENTO PROMPT IA texture stack motion):
- Slow movements: turn, lean, glance, breathe, reach, settle, drift, glide, shift weight
- Medium movements: walk, step, twist, nod, gesture, adjust, pull, rotate
- Fast movements: jump, sprint, throw, swing, accelerate, drift (vehicle), whip turn

**Anti-patrón**: "Pablo does action" sin verbo concreto. Siempre usar verbo + dirección + duración + qualifier.

❌ "Pablo poses confidently"
✅ "Pablo turns head left-to-camera over 1.5s with calm dominant gaze, slight smirk emerging at the corner of mouth"

### Camera motion language (lentes + dolly + handheld)

**Camera moves válidos** (Higgsfield Cinematic Studio Video V2 / Cinematic Studio 3.0 / Seedance 2.0):
- **Stable/static**: tripod locked, no movement
- **Dolly-in / Dolly-out**: smooth track forward/back, no shake
- **Push-in / Pull-back**: in-camera zoom equivalent, smooth
- **Drone pull-back / drone push-in**: aerial reveal/conceal
- **Handheld kinetic**: subtle natural sway, mimics documentary
- **Whip pan**: rapid horizontal pan for transition
- **Orbital / arc**: circle around subject
- **Crane up / crane down**: vertical lift
- **Tilt up / tilt down**: vertical pivot

**Anti-patrón**: "cinematic camera movement" genérico. Siempre nombrar el move concreto + speed.

❌ "Beautiful camera angle moves"
✅ "Slow dolly-in from 4m to 2.5m over 5s, stable on Steadicam, three-quarter low-angle preserved throughout"

### Motion priority

Cada shot declara cuál vector domina:
- `"subject"`: subject moves significantly, camera mostly stable
- `"camera"`: camera moves significantly, subject mostly held
- `"both"`: both move (más caro de generar · requiere SOTA modelo · usar parsimoniously)

Para image-to-video con `--medias start_image`, **priorizar `"subject"` o `"camera"` (no ambos)** porque con prompts simples los modelos cinemáticos rinden mejor.

---

## Pilar 3 · Transitions Handoff (frame-to-frame)

Cada shot tiene **opening frame** y **ending frame**. El opening frame del shot N+1 debe enlazar coherentemente con el ending frame del shot N.

### Tipos de handoff válidos

| Tipo | Ending frame N | Opening frame N+1 | Use case |
|---|---|---|---|
| **Match cut** | Same composition + similar action | Same composition + new context | Pablo turns left in S1 → Pablo continues turning left in S2 nuevo entorno |
| **J-cut audio** | Audio del próximo shot empieza | Visual cambia | "We hear engine rev before we see the bike" |
| **Whip pan continuation** | Camera whips left | Camera whips left and reveals new scene | Vice City sunset shot → moto burnout shot |
| **Push-in to close-up** | Wide of Pablo near Lambo | Close-up Pablo face same scene | Concept 005 final shot |
| **Match action** | Pablo grabs handlebar | Pablo on bike accelerating | Continuity de acción |
| **Color match** | Pastel pink dominant | Pastel pink dominant new scene | Color anchor |
| **Symbolic match** | Sun setting on horizon | Yacht silhouette against same horizon | Visual rhyme |

### Anti-patrón handoff

❌ Hard cut sin handoff (a menos que el género lo justifique como horror jump-scare)
❌ Wardrobe cambia sin handoff explícito
❌ Lighting cambia 180° sin justificación temporal
❌ Subject identity wobbles (different face) cross-cut

### Declaración en concept JSON

```json
{
  "transitions": [
    {
      "from_shot": "S1_beach_lambo",
      "to_shot": "S2_motorbike",
      "type": "whip_pan_continuation",
      "ending_frame_S1": "Pablo turns body weight to camera left, eyes scan toward off-frame left",
      "opening_frame_S2": "Whip pan reveals Pablo already on motorbike, throttle wrist about to twist",
      "audio_handoff": "We hear engine rev start during last 0.3s of S1"
    }
  ]
}
```

---

## Pilar 4 · Audio Sync Points

Cada shot tiene mínimo 1 audio sync point alineado con cut o action key.

| Action visible | Audio sync obligatorio |
|---|---|
| Engine ignition | engine-start.wav frame 0 of S2 |
| Wheel burnout | tire-screech.wav + smoke-hiss.wav loop S2 |
| Car door closes | door-slam.wav frame X |
| Drone sweep | drone-whoosh.wav over 5s |
| Sunset reveal | ambient-marina.wav + soft pad music |
| Music drop | drop coordinated con biggest cut (usually S1→S2 if action-driven) |

**LUFS target**: -16 LUFS cinema standard.

**Música**: Suno copyright-free generada con prompt específico al género del concept (synthwave 80s para Vice City · ambient electronic para BR2049 · etc.)

---

## Concept JSON v3 schema · campo `sequence` obligatorio

```json
{
  "concept_id": "dark-frames-005-pablo-gta-vi",
  "version": "v3",
  "tier": "CINEMATIC",
  "style_anchor_variant": "vice_city_sunset_v2",
  "sequence": {
    "narrative_arc": "Lifestyle Vice City sunset · Pablo arrives in Lambo → starts moto for night ride → contemplates from yacht bow → close-up identity reveal with smile",
    "wardrobe_continuity": "Single wardrobe entire piece: pastel cream Hawaiian shirt unbuttoned over white tank top, light beige loose linen pants, white leather sneakers, gold cuban-link chain, premium aviators on forehead",
    "wardrobe_change_justification": null,
    "shots": [
      {
        "shot_id": "S1_beach_lambo",
        "duration_seconds": 3.5,
        "subject_motion": "Pablo turns head from car hood toward camera over 1s, slight smirk emerging, calm dominant gaze locks on viewer last 1.5s",
        "camera_motion": "Stable Steadicam wide three-quarter, very subtle 5% push-in over 3.5s, no shake",
        "motion_priority": "subject",
        "audio_sync": "ambient-beach-waves.wav + distant-engine-rev.wav at 3.0s"
      },
      {
        "shot_id": "S2_motorbike",
        "duration_seconds": 4.0,
        "subject_motion": "Pablo right wrist twists throttle hard, head leans forward 10°, body weight shifts onto bike, controlled rolling burnout begins",
        "camera_motion": "Low-angle handheld kinetic with subtle natural sway, slight orbit around bike from frame-left to frame-right over 4s",
        "motion_priority": "both",
        "audio_sync": "engine-rev-burnout.wav frame 0 + tire-screech.wav at 1.5s + cyan smoke-hiss.wav loop"
      },
      {
        "shot_id": "S3_yacht_bow",
        "duration_seconds": 4.0,
        "subject_motion": "Pablo at yacht bow looking sunset, slowly turns profile toward camera last 1.5s, breeze flutters open linen shirt naturally",
        "camera_motion": "Drone pull-back from medium to wide over 4s revealing full yacht + marina + sunset, smooth aerial",
        "motion_priority": "camera",
        "audio_sync": "ambient-marina-water.wav + soft-pad-synthwave.wav build"
      },
      {
        "shot_id": "S4_closeup_smile",
        "duration_seconds": 3.5,
        "subject_motion": "Pablo locked on camera, eyes warm, smirk grows into a subtle smile last 1.5s, slight head tilt right",
        "camera_motion": "Slow push-in from medium close-up to tight close-up over 3.5s, stable, no shake",
        "motion_priority": "camera",
        "audio_sync": "synthwave-music-drop.wav at 1.0s + dialogue-VO-or-text-overlay.wav at 2.5s"
      }
    ],
    "transitions": [
      {
        "from": "S1_beach_lambo",
        "to": "S2_motorbike",
        "type": "j_cut_audio + match_action",
        "ending_S1": "Pablo's hand starts lifting off Lambo hood, head tilts off-camera left",
        "opening_S2": "Match action: Pablo's same hand now grips motorbike handlebar, throttle wrist about to twist",
        "audio_handoff": "Engine rev starts at last 0.5s of S1, dominates frame on S2 open"
      },
      {
        "from": "S2_motorbike",
        "to": "S3_yacht_bow",
        "type": "whip_pan_continuation + color_match",
        "ending_S2": "Cyan smoke fills frame · whip pan motion blur",
        "opening_S3": "Whip pan resolves into yacht bow medium · cyan-magenta sunset matches the smoke-magenta palette",
        "audio_handoff": "Engine fade-out crossfaded with marina ambient over 0.4s"
      },
      {
        "from": "S3_yacht_bow",
        "to": "S4_closeup_smile",
        "type": "push_in_to_closeup + symbolic_match",
        "ending_S3": "Drone wide on yacht silhouette against sunset, subject just turned profile to 3/4",
        "opening_S4": "Match cut to close-up Pablo face, sunset bokeh background matches yacht's sunset",
        "audio_handoff": "Synthwave drop at S4 open · last 0.3s of S3 builds anticipation"
      }
    ],
    "outro": {
      "duration_seconds": 2,
      "asset": "tools/dark-frames/assets/outro-darkroom-2s-v2.mp4",
      "transition_into": "fade-from-S4-final-frame to outro-darkroom over 0.3s"
    }
  }
}
```

---

## Validación visual-reviewer

Antes de aprobar pieza multi-shot, recorrer estos checks NUEVOS además de los 26 markers Three-Pass Review:

| # | Marker | Pregunta | Y/N |
|---|---|---|---|
| 27 | Wardrobe continuity | ¿Mismo wardrobe en TODOS los shots O wardrobe-progression justificada explícitamente? | |
| 28 | Subject identity | ¿Mismo character (Pablo PACAME) reconocible cross-shot · 360 sheet match? | |
| 29 | Lighting continuity | ¿Misma key light direction + color temperature cross-shot O justified by time-of-day shift? | |
| 30 | Motion arcs declarados | ¿Cada shot tiene `subject_motion` + `camera_motion` + `motion_priority` en concept JSON? | |
| 31 | Transitions handoff | ¿Cada cut tiene `type` + `ending_frame` + `opening_frame` + `audio_handoff` declarado? | |
| 32 | Audio sync points | ¿Cada shot tiene mínimo 1 audio sync point en concept JSON? | |
| 33 | Narrative arc | ¿La pieza completa cuenta una historia coherente (hook → build → climax → reveal)? | |

**Si 2+ fail → REJECT REFINE**.
**Si 1 fail → puede salvar con refinement targeted al shot/transition específico**.

---

## Workflow operativo aplicado

1. **Antes de generar Fase 2 base scenes**: Pablo + Claude redactan `sequence` field del concept JSON (10 min de planning).
2. **Antes de generar Fase 3 substitution**: validar wardrobe continuity con prompts EXPLÍCITOS "SAME WARDROBE as previous scene" en cada substitution.
3. **Antes de generar Fase 4 video premium**: validar motion arcs + transitions declarados + audio sync points listos.
4. **Visual-reviewer**: aplica checks 27-33 sobre concept JSON + frames antes de aprobar pieza.
5. **Si refinement necesario**: targeted al shot/transition específico, no rewrite todo.

---

## Maintenance

- Actualizar cuando se identifique un pattern recurrent de frame-to-frame drift
- Versionar v1 → v1.1 si añades/quitas pilars
- Sincronizar con MEGA-PROMPT-v[N].md §I (NEW section a añadir)
- Sincronizar con CONSISTENCY-CHECKLIST-v[N].md (añadir checks 27-33 a Pass 2 Style)

**Version log**:
- v1.0 (2026-05-08) — Inicial · feedback Pablo "entre escena y escena todo tiene que tener sentido y movimientos fluidos del personaje" · 4 pilares (wardrobe + motion arcs + transitions + audio sync) · 7 checks NUEVOS visual-reviewer
