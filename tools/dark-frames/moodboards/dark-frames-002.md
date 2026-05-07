# Moodboard · dark-frames-002 v2 · Si Tarantino dirigiera Stranger Things

> **v2 · 2026-05-07** — reescrito con research-first (regla `feedback_cine_real_research_first.md`).
> Datos cámara, lentes, LUT, audio extraídos de fuentes públicas: American Cinematographer (Sekuła Pulp Fiction 1994), ASC database Tim Ives, IndieWire Tarantino-Richardson analysis, Variety Kyle Dixon Survive interview.

## Referente cinematográfico real

**Mash-up de 2 universos:**

### Universo A — Tarantino
- **Películas referente**: Pulp Fiction (1994) + Reservoir Dogs (1992)
- **DPs**: Andrzej Sekuła (Pulp Fiction), Robert Richardson (Tarantino later)
- **Aplicado en shots**: 1 (warm grade) + 3 (key from below + slow push-in + briefcase homage)

### Universo B — Stranger Things
- **Series referente**: Stranger Things S1-S2 (2016-2017)
- **DPs**: Tim Ives ASC + Caleb Heymann
- **Compositores**: Kyle Dixon + Michael Stein (banda Survive · score Carpenter-inspired)
- **Aplicado en shots**: 1 (kids BMX composition + anamorphic Cooke) + 2 (split-grade warm/teal + fog)

### Universo C — Score híbrido
- Synthwave Survive × Western Morricone fusion
- Kavinsky × Ennio Morricone fusion vibe

## Técnica de cámara real (citable en prompts)

| Aspecto | Pulp Fiction (Sekuła) | Stranger Things (Ives) | Mash-up final |
|---|---|---|---|
| Cámara | Panavision 35mm spherical | Arricam LT 35mm anamorphic | Mix por shot |
| Aspect | 2.39:1 | 2.39:1 anamorphic | 2.39:1 letterbox embedded en 9:16 |
| Lentes | Zeiss Master Primes 50-85mm | Cooke Anamorphic vintage flare | 40mm establisher · 50-85mm close-ups |
| Apertura | T2.8-T4 | T2.8-T4 | shallow-to-moderate DOF |
| Stock | Kodak Vision2 250D/500T | Kodak Vision2 emulation | grain emulation 35mm Vision2 |

## Iluminación por shot

### Shot 1 (setup · BMX Hawkins)
- **Key light**: tungsten 3200K motivado por streetlights 80s practicals (Tim Ives style).
- **Fill**: golden hour sun bajo ámbar.
- **Color grade**: Pulp Fiction warm yellow Andrzej Sekuła. Highlights warm 240-255 Rec709, sat +50 amber channel, desat azules.
- **Stock emulation**: Kodak Vision2 250D grain.

### Shot 2 (conflict · bosque noche)
- **Key light**: single overhead practical (hanging fixture o lámpara) tungsten 3200K **desde arriba a abajo** = underlit faces (Tarantino · Sekuła Pulp Fiction signature).
- **Fill**: cool teal 5600K cyan/magenta cast en fog (Tim Ives Upside Down split-grade).
- **Color grade**: split-grade warm/teal · shadows lifted +5-8 units · stock Vision2 500T emulation grain.
- **Atmósfera**: fog volumétrica catching the light.

### Shot 3 (payoff · briefcase reveal)
- **Key light**: ACID GREEN #CFFF00 desde dentro de la caja (referencia directa Pulp Fiction maletín dorado, sustituyendo dorado por acid).
- **Fill**: warm yellow Sekuła grade alrededor (NO acid).
- **Color grade**: deep crushed blacks 0-10 IRE · single acid punch · slow push-in 25mm→50mm en 4s (Tarantino signature).
- **Lente**: spherical NO anamorphic (Tarantino preferred 35mm spherical Pulp Fiction documented).

## Color grading (DCP cinema standard)

```
base ground:          DCP 1.2 gamma · P3 colorspace
shadows:              crushed 0-15 IRE (Sekuła style)
midtones:             warm yellow lift (+50 amber channel)
highlights:           warm 240-255 Rec709
desaturation:         azules -30%
saturation:           +50 amber/orange channel
selective sat:        +0 acid green hasta shot 3 ↑ +30 acid en box reveal
stock emulation:      Kodak Vision2 250D (shot 1) · 500T (shot 2-3) grain
```

## Composición + movimiento

### Shot 1
- Stranger Things signature: kids on bikes wide establishing.
- Tim Ives composition: symmetric centered, vanishing point central.
- Camera: low-angle tracking dolly lateral 0.5 m/s a child eye-level.
- Anamorphic Cooke flare horizontal sobre streetlights.

### Shot 2
- Reservoir Dogs reference: low-angle looking up at faces from ground level.
- Tarantino key-from-below = underlit faces.
- Camera: estática o muy ligero pull-back.
- Anamorphic 2.39:1 letterbox.

### Shot 3
- Pulp Fiction reference: extreme close-up + slow push-in zoom 25mm→50mm en 4s.
- Hand + box only (NO full face).
- Camera: spherical 35mm (Tarantino documented preference shot specific).
- Slow motion 0.3x sobre el momento de apertura del box.

## Audio (Survive × Morricone fusion)

### Música
- **Style**: synthwave Kyle Dixon Survive Stranger Things × spaghetti western Morricone harmonica.
- **Suno keywords**: `Kyle Dixon Survive Stranger Things synthwave drone 80s Carpenter Halloween synth Moog Prophet-5 spaghetti western Morricone harmonica hybrid retro pulp`.
- **Key**: D minor.
- **Tempo**: 60bpm slow drone, no perceptible beat, pad-driven.
- **LUFS target**: -16 cinema.

### VO ElevenLabs
- **Provider**: ElevenLabs voz Brian (multilingual_v2).
- **Idioma**: ES.
- **Texto**: "En 1985, los niños buscaban tesoros en bicicleta. Ahora buscan algo distinto. Y a veces... lo encuentran." (116 chars)
- **Delivery**: low slow philosophical noir · Mia Wallace-style cool detached · pauses dramáticas.
- **Timing**: entry segundo 9, spans 9-12s overlapping payoff.

### Sound design (Tarantino diegetic discipline)
- BMX chain wind shot 1.
- Foggy forest ambient + cricket distant + footstep crunch shot 2.
- Wooden box creak + acid hum reveal shot 3.
- Music ducks -6dB cuando entra VO.

## Ritmo (NO Tarantino kinetic, queremos contemplative para IA)

- **3 actos · 4s cada uno** = 12s total (sin outro).
- **1-2 tomas por acto** (no kinetic editing Tarantino real, queremos slow para que la IA mantenga coherencia).
- **15 takes/min máximo** (Villeneuve standard).

## Anti-patrones específicos

- ❌ Caras infantiles legibles (uncanny + ético)
- ❌ Bicis modernas / smartphones / coches modernos
- ❌ Demogorgon o monstruos copyright Stranger Things
- ❌ Mia Wallace o personajes Pulp Fiction copyright reconocibles
- ❌ Verde cyberpunk en bosque (queremos warm/teal split, acid SOLO en box reveal)
- ❌ Voz off "narrador documental neutral" (queremos noir filosófico grave Mia Wallace style)
- ❌ Tarantino kinetic editing (queremos slow contemplative)
- ❌ Beauty lighting soft fill (queremos hard shadows + underlit shot 2)

## Outro

Los últimos 2s son el outro Dark Room (`tools/dark-frames/assets/outro-darkroom-2s.mp4`) concatenado por ffmpeg.

## Checklist visual-reviewer

- [ ] Shot 1: BMX 80s · tracking lateral child-eye-level · warm Pulp grade · anamorphic flare horizontal · rostros NO legibles
- [ ] Shot 2: underlit faces single key from above · split-grade warm/teal · fog volumétrica · NO Demogorgon visible
- [ ] Shot 3: hand+box close-up · acid green emanando · slow push-in · chin/lower-face only · NO upper face · grain Vision2 500T
- [ ] VO Brian español entra solo en shot 3 (segundo 9)
- [ ] Outro Dark Room presente último 2s
- [ ] Audio: Survive × Morricone híbrido · diegetic prioritized · ducks -6dB cuando VO

## Coste real

- **Modelo principal**: Cinema Studio Video 3.0 (tier=top) → ~$0.20/s × 12s = ~$2.40 si todo Cinema Studio.
- **Mix realista**: shot 1 Cinema Studio · shot 2 Seedance 2.0 · shot 3 Cinema Studio = ~$1.20.
- **VO ElevenLabs**: free tier 10k chars/mes (consume ~120).
- **Música Suno**: free 50/mes.
- **Total estimado**: $1.20.

## Aprobación requerida

- Pablo doble SÍ (regla `feedback_doble_aprobacion_videos.md`).
- Cost-guard token ≥16 chars (`openssl rand -hex 16`).
