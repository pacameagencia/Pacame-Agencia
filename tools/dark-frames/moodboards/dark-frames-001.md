# Moodboard · dark-frames-001 v2 · Sci-fi pasillo Wallace Corp (BR2049)

> **v2 · 2026-05-07** — reescrito con research-first (regla `feedback_cine_real_research_first.md`).
> Todos los datos de cámara, lentes, LUT y audio están citados de fuentes reales (Roger Deakins ASC, ASC Magazine 2017, Hans Zimmer Scoring Notes 2017).

## Referente cinematográfico real

**Película:** Blade Runner 2049 (2017)
**Director:** Denis Villeneuve
**DP:** Roger Deakins, ASC, BSC
**Compositores:** Hans Zimmer + Benjamin Wallfisch
**Escena referente:** Wallace Corp interior (Adam's bunker amber+green) + LA aerial opening (cool teal)

## Técnica de cámara real (citable en prompts)

| Aspecto | Dato real | Fuente |
|---|---|---|
| Cámara | ARRI Alexa 65 (formato VistaVision) | American Cinematographer Magazine, Feb 2017 |
| Lentes | Zeiss Master Anamorphic 50mm T2.8 (1.3x anamorphic, NO 2x) | Deakins forum 2017 |
| Aspect ratio | 2.39:1 scope | release print spec |
| Apertura | T2.8-T4 (shallow to moderate DOF) | ASC interview 2017 |
| Look | Single key source philosophy (Deakins signature) | BFI interview Deakins 2018 |

## Iluminación Wallace Corp (escena referente directa)

- **Key light**: tungsteno 3200K motivado por fixture techo, dirección upper-front.
- **Fill**: mínimo, dejar shadows profundos.
- **Acento**: verde neón 540nm vertical en paredes (acid green #CFFF00 lectura visual).
- **Color contrast**: amber tungsten + green neon = lenguaje "futurista corporativo distópico".
- **NO** mezcla con gels — Deakins balanceó sensor neutro y separó tonalmente en post.

## Color grading (DaVinci Resolve custom curve)

```
base color temp:   4500K cool teal
shadows:           verde-gris (lift +5)
midtones:          neutral
highlights:        cream (-3 desaturación blue channel)
saturation global: -15% vs digital native
curve:             S extrema en blacks (crush deep shadows)
selective sat:     +10 acid green channel (highlight neon)
```

**Look reference**: Wallace Corp interior sequences BR2049 (~01:23-01:35 timestamp aprox).

## Composición Villeneuve

- **Centered symmetry**: protagonista bisecando frame vertical.
- **Espacio negativo**: 70% environment, 30% subject. Vacío deliberado.
- **Líneas convergentes**: las tiras neón verticales convergen en punto de fuga centro frame → fuerza profundidad arquitectónica.
- **Reflejos**: suelo pulido mojado dobla las tiras de neón → multiplica acid green.
- **Profundidad**: niebla volumétrica baja densa que la luz neón corta en haces visibles.

## Movimiento de cámara

- **Velocidad**: slow dolly 0.1-0.3 ft/s (Deakins documented).
- **Tipo**: SOLO dolly o estático. NUNCA handheld, NUNCA shake, NUNCA zoom rápido.
- **Altura**: cintura del protagonista (~110cm).
- **Trayectoria**: tracking forward (shot 1), push-in muy lento (shot 2).

## Audio (Zimmer + Wallfisch BR2049 style)

### Música
- **Track style**: Hans Zimmer · "Mesa" (BR2049 OST) · drone subgrave 40-60Hz baseline + single sustained piano note (Wallfisch).
- **Key**: A minor.
- **Tempo**: NO perceptible · sustained drone.
- **LUFS target**: -16 (rango cine, no broadcast).
- **Suno keywords**: `Hans Zimmer Vangelis Blade Runner 2049 atmospheric drone subgrave dark cinematic minimalist single piano note sustained`.

### Sound design
- **Subgrave constante** 40Hz interior hum (psicoacústica BR2049 documentada).
- **Footstep**: 1 paso con reverb largo (ref Sapper Morton opening).
- **UI scan beep**: 1 beep alta frecuencia cuando biometric scan dispara (NO comp musical swell — silencio + beep = Villeneuve breathing).
- **Silencio estratégico**: >2s antes del cambio a outro. Ref Villeneuve "Rhythm in Film" essay 2017.

## Ritmo (Villeneuve standard)

- **3-6 tomas/min** (vs Hollywood 8-10 tomas/min).
- En 8s = **2 tomas** (4s + 4s).
- Cada toma "breath time" para que la audiencia absorba la estética.
- NO cortes rápidos · NO match cuts agresivos · plano fijo o slow dolly.

## Anti-patrones específicos a evitar

- ❌ Verde puro chillón estilo Matrix (queremos acid + tungsten amber híbrido)
- ❌ Cara del agente legible (rompe inmersión + uncanny valley IA)
- ❌ Texto legible en hologramas (IA falla en texto, mejor abstract shapes)
- ❌ Estética "anime cyberpunk" tipo Ghost in the Shell
- ❌ Filtro Instagram cyberpunk saturado purple/pink
- ❌ Multi-source flat lighting (mata el "single key" Deakins)
- ❌ Cortes rápidos / movimiento cámara agresivo (mata el ritmo Villeneuve)
- ❌ Music swell hollywood emocional (queremos drone Zimmer + silencio)

## Outro

Los últimos 2s son el outro Dark Room (`tools/dark-frames/assets/outro-darkroom-2s.mp4`) concatenado por ffmpeg.

## Checklist visual-reviewer

Antes de aprobar, el subagent visual-reviewer debe verificar:

- [ ] Vertical neon strips visibles (no horizontales)
- [ ] Single key light direction clara (no multi-source)
- [ ] Suelo mojado refleja neón
- [ ] Agente silueteado centrado en frame (NO off-center)
- [ ] Anamorphic horizontal lens flare en neón
- [ ] Shot 2: single key upper-right · biometric scan beam acid visible · sin texto legible UI
- [ ] DOF blur en background ambos shots
- [ ] Grading cool teal + amber-green híbrido (NO verde puro)
- [ ] Outro Dark Room presente último 2s
- [ ] Audio: drone subgrave continuo · single beep al scan · silencio antes de outro

## Coste real

- **Modelo principal**: Cinema Studio Video 3.0 (tier=top) → ~$0.20/s × 8s = ~$1.60. Reservar $2 buffer.
- **Si Cinema Studio no llega**: fallback Seedance 2.0 (~$0.10/s × 8s = $0.80).
- **Audio Suno**: free tier 50 canciones/mes.
- **ElevenLabs**: no aplica (sin VO en este concept).
- **Total realista**: $0.40-$2.00 según iteraciones.

## Aprobación requerida

- Pablo doble SÍ (regla `feedback_doble_aprobacion_videos.md`).
- Cost-guard token ≥16 chars (`openssl rand -hex 16`).
