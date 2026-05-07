# Moodboard · dark-frames-003 v2 · GTA 7 leak Tokio nocturno POV

> **v2 · 2026-05-07** — reescrito con research-first (regla `feedback_cine_real_research_first.md`).
> Fuentes: American Cinematographer 2003 (Lance Acord Lost in Translation), American Cinematographer 2012 (Sigel Drive), CD Projekt Red GDC 2020, GTA modding technical wikis (no oficial Rockstar).

## Referente cinematográfico real (mash-up de 4 universos)

### Universo A — Lost in Translation (Tokio melancólico)
- **Película**: Lost in Translation (2003) · dir. Sofia Coppola · DP Lance Acord
- **Aplicado**: estética Shibuya documentary feel, lente Zeiss Master Anamorphic 40mm T2.1 (adaptado a spherical 32mm para POV gameplay), color desaturado lluvia.

### Universo B — Drive (neon rain)
- **Película**: Drive (2011) · DP Newton Thomas Sigel
- **Aplicado**: long exposure trail capture en luces autos, warm neon reflejos en asfalto mojado, viñeta oscura, anamorphic Panavision C Series 40mm (referencia, no usada literal en POV).

### Universo C — Cyberpunk 2077 + Edgerunners
- **Juego**: Cyberpunk 2077 (CD Projekt Red, REDengine 4, ray tracing patch 1.5+)
- **Anime**: Edgerunners (Studio Trigger 2022)
- **Aplicado**: saturation +18% magenta/cyan, volumetric neon halo, subsurface scattering signage glow, color pipeline anime-influenced post-render.
- **Score**: P. T. Adamczyk + Marcin Przybyłowicz synthwave 120-130 BPM (referencia, slow ambient para este reel).

### Universo D — GTA cinematics (technical foundation)
- **Engine**: RAGE engine (interno Rockstar, NO documentado público).
- **Cinemáticas**: FOV 45-50°, motion blur per-object 12ms, walking pace 1.4 m/s con head bobbing +2° (datos de modding wikis · NO oficial Rockstar).
- **Aplicado**: foundation técnica POV walking pace.

## Técnica de cámara real (citable en prompts)

| Aspecto | Dato real | Fuente |
|---|---|---|
| Cámara virtual | POV gameplay style | GTA V cinematics modding wikis |
| Focal POV | Cooke S4/i 32mm spherical equivalente (NO anamorphic en POV) | Dan Laustsen John Wick 4 reference adaptado |
| Apertura | f/2.8 equivalente · ISO 3200 low-light night | Newton Thomas Sigel Drive 2011 |
| FOV | 45-50° (GTA V cinematics community reference) | gtalib.com modding wiki · NO oficial |
| Aspect | 9:16 nativo NO letterboxed (queremos gameplay feel) | criterio del concept |
| Motion blur | per-object 12ms equivalente | GTA V cinematics technical |
| Head bobbing | +2° vertical lerp · walking pace 1.4 m/s | GTA technical wiki |
| Long exposure | 1/4-1/8s equivalent capture trail luces autos | Sigel Drive 2011 |

## Iluminación + atmósfera

### Shot 1 — Walking Shibuya
- **Source primary**: neon billboards verticales (magenta + cyan dominantes).
- **Bounce**: asfalto mojado refleja neón = doble fuente de luz.
- **Atmosphere**: lluvia heavy continua + steam de manholes catching neon.
- **Color contrast**: magenta + cyan hyper-saturated · highlight neon push · blacks lifted +12 IRE para detail wet asphalt.

### Shot 2 — Head-up koi reveal
- **Source primary**: holographic koi emanating magenta + acid green glow.
- **Volumetric**: rain particles in light shafts visible.
- **Subsurface scattering**: en neon signage Cyberpunk 2077 REDengine reference.
- **Anime-influenced post**: saturation shift Edgerunners style aplicado en post NO en escena.

## Color grading (Cyberpunk 2077 Night City + Drive neon hybrid)

```
base color temp:    night cool 5000K
shadows:            lifted +12 IRE (detail wet asphalt)
midtones:           neutral
highlights:         pushed neon · saturation +18% magenta channel · +18% cyan channel
selective sat:      +25 acid green ONLY on koi reveal shot 2
desat:              none (queremos saturated cyberpunk)
volumetric:         halo on all neon signs (REDengine ref)
trail capture:      long exposure on car headlights (Drive Sigel)
anime post:         Edgerunners saturation shift (subtle, post-only)
```

## Composición + movimiento POV

### Shot 1
- POV first-person eye-level 170cm.
- Walking pace 1.4 m/s.
- Subtle head bobbing +2° vertical lerp.
- Vertical 9:16 nativo (NO letterbox).
- Crowd parallel + oncoming pedestrians.
- Neon billboards verticales dominantes.

### Shot 2
- POV continuation.
- Head turn upward 0-60° smooth lerp en 3s.
- Cámara virtual rotation suave NO whip.
- Reveal: holographic koi/dragon entre rascacielos.
- Final pose mantiene look-up 2s.

## Audio (Cyberpunk × Akira × diegetic Tokio)

### Música
- **Style**: Cyberpunk 2077 P. T. Adamczyk atmospheric synthwave pad + Akira taiko distant.
- **Suno keywords**: `Cyberpunk 2077 P. T. Adamczyk Marcin Przybylowicz synthwave atmospheric Tokyo cyberpunk ambient pad-driven Akira taiko distant rain night ethereal`.
- **Key**: F minor.
- **Tempo**: 70bpm slow drone, pad-driven, no perceptible beat.
- **Swell**: ethereal subtle on koi reveal shot 2 (segundo 8). NO bombast.
- **LUFS target**: -16 cinema.

### Diegetic dominant (Lance Acord documentary discipline)
- Rain heavy continuous on wet asphalt + drops metal/umbrella loop.
- Tokyo crowd murmur low + Japanese conversation snippets (NO words audible).
- Subgrave 40Hz constant under everything (psicoacústica).
- Neon sign electric buzz pan stereo subtle.
- Distant car horns + traffic bass.
- Steam manhole hiss intermitente.

### Sound design transitions
- Pause/breath cuando POV empieza a girar arriba (segundo 5).
- Ethereal whoosh sync con koi (segundo 6).
- Music swell subtle segundo 8 underscoring reveal.

## HUD overlay (post ffmpeg)

```
position:        bottom-right · 80px from edge safe
shape:           circular wireframe radius 70px
color:           #CFFF00 60% opacity
content:         1 dot pulsando 2Hz (player) + 4 dots distantes static (NPCs)
NO labels        NO "PRESS X TO INTERACT" · NO ammo · NO stamina · NO compass
animation:       rotation 360° cada 30s · dots pulsando 2Hz
intent:          MUY sutil · vendemos la duda no afirmamos juego
```

Si el HUD se nota demasiado obvio = MAL. Es una pista visual ambigua, no un statement.

## Anti-patrones específicos

- ❌ Kanji o letras japonesas legibles (IA falla casi siempre)
- ❌ Caras de peatones legibles (privacy + uncanny)
- ❌ HUD demasiado obvio tipo "PRESS X TO INTERACT" o ammo counter (queremos sutil)
- ❌ Day-time lighting (debe ser noche cerrada con neón)
- ❌ Estética anime 2D explícita Akira directo (queremos hyper-real, NO 2D cel-shading)
- ❌ Anamorphic letterbox (queremos vertical nativo gameplay feel)
- ❌ Wide shot 3rd person (queremos POV first-person)
- ❌ Logos copyright Rockstar / Cyberpunk visibles
- ❌ Música percussive bombast (queremos ambient pad-driven)
- ❌ Cámara whip/abrupt en shot 2 (queremos lerp 3s suave)

## Outro

Los últimos 2s son el outro Dark Room (`tools/dark-frames/assets/outro-darkroom-2s.mp4`) concatenado por ffmpeg.

## Checklist visual-reviewer

- [ ] Shot 1: POV walking eye-level · vertical 9:16 nativo · neon magenta/cyan · long exposure trail luces · rain heavy · NO kanji legible · NO rostros legibles
- [ ] Shot 2: head-turn-up smooth 0-60° en 3s · holographic koi visible mid-frame · magenta/cyan/acid glow · rain particles volumetric in light shafts
- [ ] HUD minimap bottom-right · 60% opacity · sin labels · sutil
- [ ] Caption "GTA 7 · TOKYO DLC · LEAK" glitch-in 0.4s segundo 0
- [ ] Caption "¿LO COMPRARÍAS?" punch-in segundo 8.5
- [ ] Outro Dark Room presente último 2s
- [ ] Audio: subgrave 40Hz constante · diegetic dominant · ethereal swell sutil koi reveal · NO bombast

## Coste real

- **Modelo principal**: Cinema Studio Video 3.0 (tier=top) → ~$0.20/s × 10s = ~$2.00 si todo Cinema Studio.
- **Mix realista**: shot 1 Cinema Studio (POV con multitud requiere SOTA) · shot 2 Seedance 2.0 (head-turn motion + holographic) = ~$1.00.
- **Música Suno**: free 50/mes.
- **HUD post**: ffmpeg drawtext + overlay PNG generado Sharp = $0.
- **Total estimado**: $1.00.

## Aprobación requerida

- Pablo doble SÍ (regla `feedback_doble_aprobacion_videos.md`).
- Cost-guard token ≥16 chars (`openssl rand -hex 16`).
