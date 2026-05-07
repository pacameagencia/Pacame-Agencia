# Moodboard · dark-frames-004 v2 · Trailer Mad Max en Tokio (HERO jueves)

> **v2 · 2026-05-07** — reescrito con research-first (regla `feedback_cine_real_research_first.md`).
> Fuentes: American Cinematographer Magazine May 2015 (John Seale Fury Road feature), BAFTA cinematography winner 2016 analysis, BFI technical database, Variety Tom Holkenborg interview 2015.
> **Pieza HERO de la serie · más cara · más compleja · jueves slot premium del calendario.**

## Referente cinematográfico real

**Película:** Mad Max: Fury Road (2015)
**Director:** George Miller
**DP:** John Seale ASC ACS (BAFTA cinematography winner 2016)
**Compositor:** Tom Holkenborg (Junkie XL)
**Escenas referente:** Citadel opening (warm tungsten) · Fury Road desert chase (orange-teal extreme) · night sequences (teal-blue crushed)

**Referente urbano post-apocalíptico:** Akira (1988) Otomo · Neo-Tokyo en ruinas (referencia atmosférica, NO copiar literal).

## Técnica de cámara real (citable en prompts)

| Aspecto | Dato real Fury Road | Fuente |
|---|---|---|
| Cámara principal | ARRI Alexa M (4:3 sensor) | American Cinematographer May 2015 |
| Cámara high-speed | Phantom Flex (inserts explosiones) | AC May 2015 |
| Lentes | Panavision Primo 40-50mm focal preferida | John Seale interview |
| **NO anamorphic** | spherical lenses · 4:3 sensor crop a 2.39:1 post | confirmed AC 2015 |
| Aspect | 2.39:1 DCP theatrical · 4K nativo ARRI Alexa M | DCI specs BFI |
| Apertura | T2.8-T4 day exterior (cerrada para legibilidad acción) | John Seale documented |
| DOF | NO shallow · profundidad legible para audiencia rápida | Seale interview IndieWire |
| Diffusion | tioulene 1/2 o 1/4 para suavizar luz directa desert | Seale documented |

## Iluminación John Seale signature

### Day exterior (shots 1+2+4)
- **NO diffusion masiva** — sun natural como key light extremo high contrast.
- **Bounce plates silver 20×20 pies** — relleno en sombras faciales.
- **Negative fill (black flags)** — tallar sombras + aumentar contraste.
- **Apertura cerrada** T2.8-T4 para legibilidad rápida.

### Day-for-night (shot 3 sunset/dusk hero)
- **Truck lights HMI 18K** simulan atardecer/noche.
- **Color temp mix**: tungsten 3200K + daylight 5600K = 4500K "magic hour" artificial.
- **NO mixed in gels** — Seale balanceó sensor neutro y separó tonalmente en post.

## Color grading orange-teal extreme (legendary Fury Road)

```
DI house:                Madman Films Melbourne (supervisión)
Colorista específico:    NO documentado en créditos públicos
                         (NO citar 'Eric Whipp Imageworks' = no verificable)
Curve method:            curve-lift shadows blue-cyan + pull highlights rojo-naranja
Highlights:              pushed amber/orange · saturation aggressive +25%
Shadows:                 crushed teal/cyan · desaturación selectiva
Saturation strategy:     +25% orange channel · -10% blue channel
Selective sat:           +0 acid green hasta shot 3 · +30 acid SELECTIVE en flames shot 3 only
Per-scene variation:
  shot 1 (Citadel-style): warm amber dominante (tungsteno simulated)
  shot 2 (Fury Road chase): orange-teal máximo contraste
  shot 3 (hero sunset): warm backlight + acid flames accent
  shot 4 (end card): orange-teal extreme silhouette
Aspect ratio:            2.39:1 DCP standard
Denaturalización:        coherente narrativamente (post-apocalipsis = mundo no-natural)
```

⚠️ **NO existe LUT 1:1 oficial Fury Road**. Múltiples "Fury Road inspired" LUTs en mercado, todas son aproximaciones. Citamos curve method documentado, NO LUT.

## Composición + movimiento George Miller

### Centered intent (shots 1+3)
- Protagonista (figura armored) **70% frame environment, 30% subject**.
- **Centered o ligero off-center-left** para audience eyeline tracking automática.
- **Readable even en cuts de 1-2s** (Miller intent: cualquier audiencia debe entender el frame instantly).

### Editing rhythm
- **Fury Road real**: 2.5-3s/shot avg vs Hollywood 4-6s.
- **Trailer official Fury Road**: 1.5-2s cuts hiperkinético.
- **NUESTRO TRAILER**: 4-5 shots en 18s = ~3.6-4.5s/shot avg (más contemplativo que Fury Road · razón: IA mantiene coherencia mejor con shots largos).

### Camera mounts/movements
- **Shot 1**: slow zoom in 5s (5s wide hold equivalent).
- **Shot 2**: low-angle lateral tracking dolly Edge Arm rig style (real-time speed NO slow-mo).
- **Shot 3**: low angle hero from below + slight push-in 0.2 m/s.
- **Shot 4**: slow pull back 2s smooth.
- **NO whip pans** (Fury Road sí los usa pero queremos coherencia IA).
- **NO shaky cam handheld**.

## Audio Junkie XL Mad Max signature

### Música
- **Style**: Tom Holkenborg (Junkie XL) Mad Max Fury Road OST.
- **Suno keywords**: `Junkie XL Tom Holkenborg Mad Max Fury Road epic trailer cinematic taiko war drums electric guitar reverb distorted post apocalyptic intense brothers in arms hybrid`.
- **Key**: D minor.
- **Tempo**: build 80bpm → 120bpm climax (accelerate gradually).
- **LUFS target**: -14 cinema cargado (más alto que -16 standard porque trailer es agresivo).

### Estructura música (sync con shots)
```
0-5s    SETUP    build tension percussive + sandstorm whoosh as instrument
5-10s   ESCALATE percussive accelerate · motorcycle as instrument
10-13s  CLIMAX   build to peak
13-14s  DROP     silencio abrupto · solo viento + flame crackle (Villeneuve breathing 1s)
14s     HIT      percussive taiko hit -3dB peak normalized · VO entry
14-17s  SWELL    music ducks -6dB under VO · build emotion
17s     THUD     deep subgrave thud · title reveal -2dB peak · sustain reverb 1s
17-18s  SUSTAIN  percussive sustain into outro
```

### Sound design (Fury Road discipline)
- **Engines as instruments**: motorcycle roar shot 2 = melodic part.
- **Sandstorm whoosh as Foley melodic**: continuous shot 1.
- **Subgrave 60Hz cinema** constante (chest-thumping).
- **Silencio estratégico segundo 13** (Villeneuve breathing).
- **Mix dynamics**: peaks normalized cinema TL-3 -6dB ref · range 20dB (cine NO streaming flat).

### VO ElevenLabs
- **Provider**: ElevenLabs Brian (multilingual_v2).
- **Idioma**: ES.
- **Texto**: "Cuando el mundo se acabó... el último guerrero llegó a la ciudad equivocada." (76 chars).
- **Delivery**: epic deep slow trailer voice español · pauses dramatic · low frequency push +3dB fundamental · classic movie trailer narrator gravitas.
- **Timing**: entry segundo 14 sync con percussive hit · spans 14-17s · ducks music -6dB.

## Estructura trailer Mad Max 3-act formula

```
Act 1 SETUP atmospheric (shot 1, 5s)
  · establecimiento mundo post-apocalíptico Tokio
  · slow zoom in
  · NO acción, solo atmósfera
  · sandstorm + Tokyo Tower silhouette
  · George Miller centered intent

Act 2 ESCALATE motion (shot 2, 5s)
  · introduce vehículo/héroe
  · custom war motorcycle alley persecution
  · low tracking lateral
  · sparks + dust trails
  · helmet face hidden

Act 3 CLIMAX payoff (shot 3, 4s)
  · hero shot rooftop
  · figura armored backlit silhouette
  · flames acid green tinted
  · George Miller centered intent
  · push-in 0.2 m/s

Act 4 END CARD pre-title (shot 4, 2s)
  · slow pull back motorcycle silhouette
  · vacío central lower third para título
  · orange-teal sunset
  · NO text yet (added in ffmpeg post)

Title reveal (último 1s shot 4)
  · "MAD MAX: TOKYO FURY" Anton 96px acid green
  · punch-in 0.2s sync con thud
  · sustain reverb 1s

Outro Dark Room (concat 2s)
  · template fijo `outro-darkroom-2s.mp4`
```

## Anti-patrones específicos

- ❌ Tokio moderno limpio sin destrucción (rompe el concepto)
- ❌ Cara visible del héroe (helmet o backlit silhouette obligatorio)
- ❌ Logos Mad Max copyright o George Miller copyright visible
- ❌ Mel Gibson o Tom Hardy faces reconocibles (legal + uncanny)
- ❌ Estética desert Mad Max original Australia (queremos Tokio destruido específicamente)
- ❌ Voz off "narrador comercial" (queremos epic deep slow trailer voice gravitas)
- ❌ Carteles japoneses legibles
- ❌ Smiling, modern intact buildings, daytime clear sky
- ❌ Anamorphic letterbox proper black bars muy gruesas (subtle 2.39 in 9:16)
- ❌ Slow motion en shot 2 motorcycle (queremos real-time speed)
- ❌ Whip pans / shaky cam handheld
- ❌ Acid green en otros shots que no sean shot 3 flames (queremos color contrast deliberate)
- ❌ Citar 'Eric Whipp Imageworks' como DI house oficial (NO documentado verificable)

## Outro

Los últimos 2s son el outro Dark Room (`tools/dark-frames/assets/outro-darkroom-2s.mp4`) concatenado por ffmpeg.

## Checklist visual-reviewer

- [ ] Shot 1: Tokio post-apocalíptico sandstorm · Tokyo Tower silueta tattered · orange-teal grade · slow zoom · 2.39 letterbox sutil · NO faces NO text
- [ ] Shot 2: war motorcycle low-tracking · sparks · helmet covers face · real-time speed · orange-teal · NO slow-mo · NO logos
- [ ] Shot 3: lone armored figure rooftop · centered low-angle · helmet · tattered flag · flames acid green · backlit · 30/70 framing
- [ ] Shot 4: pull back motorcycle silhouette · vacío central lower third · orange-teal sunset · NO text yet · slow 2s
- [ ] Title "MAD MAX: TOKYO FURY" Anton 96px acid · punch-in segundo 17 sync con thud
- [ ] VO Brian español entra segundo 14 · ducks music -6dB
- [ ] Music drop silencio segundo 13 (Villeneuve breathing)
- [ ] Outro Dark Room presente último 2s
- [ ] Audio: Junkie XL style taiko + electric guitar · subgrave 60Hz · LUFS -14

## Coste real

- **Modelo principal**: Cinema Studio Video 3.0 (shots 1, 3, 4 = ambición establishing/hero/end-card) → 11s × $0.20 = $2.20.
- **Shot 2**: Seedance 2.0 (motion-heavy persecución requiere SOTA motion) → 5s × $0.10 = $0.50 (descuento volumen).
- **VO ElevenLabs**: free 10k chars/mes (consume ~80).
- **Música Suno**: free 50/mes.
- **ffmpeg edit**: $0.
- **Total estimado**: ~$2.50.

⚠️ Pieza más cara de la serie. Aprobada por ser HERO jueves del calendario semanal.

## Aprobación requerida

- Pablo doble SÍ (regla `feedback_doble_aprobacion_videos.md`).
- Cost-guard token ≥16 chars (`openssl rand -hex 16`).
- Notificación previa por chat: estimación 38 min total + $2.50 + complejidad audio sync drops.
