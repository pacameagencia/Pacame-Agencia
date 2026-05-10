# M4.L5 — ElevenLabs · voice over con emoción

> **Dura**: 10 min
> **Nivel progreso**: 63% → 65%
> **Requisito previo**: M4.L4

## Qué vas a sacar de aquí

Generas tu primera voz IA para narración de video. Sabes diferenciar Multilingual v2 (calidad cine) de Turbo v2.5 (rapidez). Aplicas la voz a un reel sin que suene "robot AI".

## El concepto (1 idea, no 5)

ElevenLabs es el modelo voz IA top 2026. Multilingual v2 cubre español con emoción y entonación realista.

3 tipos de output:

1. **Voces preset (preset library)** · 50+ voces listas. Plan free 10k chars/mes.
2. **Voces clonadas (Voice Lab)** · subes 3-10 min de tu voz, ElevenLabs entrena clon. Plan paid 22€/mes.
3. **Voces multilingual** · misma voz hablando 30+ idiomas. Útil para cliente LATAM-ES.

Cuándo NO usar voz IA:

- Mensaje muy emocional / personal (boda, condolencia, terapia). Cuesta credibilidad si se nota.
- Marca personal del cliente · él/ella prefiere su voz real.
- Anuncios de productos sensibles (médicos, financieros). Algunos países restringen voz IA en advertising.

Cuándo SÍ:

- Voice over reels marca (creators que no quieren grabarse).
- Tutoriales / explainers cortos.
- Narración video corporativo.
- Audio para podcast (versión IA del presentador cuando viaja).

## El ejemplo real

**Caso · cliente coach quiere 4 reels al mes con narración tipo "vlog interior" sin tener que grabar voz**

Workflow ElevenLabs:

1. **Ir a [elevenlabs.io](https://elevenlabs.io)**.
2. **Seleccionar voz preset**:
   - Para voz masculina española: "Brian" (Multilingual v2, español neutro, tono cómplice).
   - Para voz femenina española: "Charlotte" o "Bella".
3. **Pegar texto**:
   ```
   Hoy te quiero contar lo que pasa cuando piensas en irte del gym
   y te cuesta volver. No es falta de motivación. Es falta de método.
   Te explico en 30 segundos qué cambio aplicar esta semana.
   ```
4. **Generar** · ~5 segundos. Coste ~150 chars del plan free.
5. **Descargar mp3**.
6. **Ajustar** si suena "robótico":
   - Sliders Stability 50 + Similarity 75 (defaults).
   - Si suena monótono, baja Stability a 40 (más expresivo).
   - Si suena exagerado, sube Stability a 70 (más controlado).
7. **Llevar a CapCut**:
   - Importa el mp3.
   - Sincroniza con captions del reel.
   - Música ambient debajo al 20%.

Tiempo total: 8-10 min por reel. Cliente paga 80-120€/reel.

## El prompt copiable

Texto template "vlog interior 30s reel" (rellena variables):

```
Hoy te quiero contar lo que pasa cuando [problema típico audiencia].

[1-2 frases analizando · sin "no es solo, es"]

Te explico en 30 segundos [solución que ofreces] para esta semana.

[Cierre · 1 acción concreta o pregunta abierta]
```

Pega este template en Notion. Cada reel del cliente toma 5 min porque solo cambias variables.

## Tu ejercicio (5 min)

- [ ] Abre ElevenLabs (free tier vale).
- [ ] Pega el template arriba con variables tuyas.
- [ ] Selecciona voz "Brian" o "Charlotte" Multilingual v2.
- [ ] Genera mp3.
- [ ] Escucha 3 veces y juzga: ¿suena natural o robot?

Si suena robot, baja Stability a 40. Si suena exagerado, sube a 70.

## Quick-win

**Regla "lee el texto en voz alta antes de generar"**: si el texto no suena natural cuando TÚ lo lees, no va a sonar natural cuando lo lea ElevenLabs. Edita el texto hasta que sea hablado, no escrito. Frases ≤15 palabras. Sin frases subordinadas largas. Sin gerundios encadenados.

## Si quieres profundizar

- [ ] M4.L6 · Estructura prompt cinemático 5-step
- [ ] M4.L8 · Three-Pass Review · 26 markers anti-AI-look
- [ ] [ElevenLabs voice library](https://elevenlabs.io/voice-library)

---

**Visual**: `TODO: visual · brief: "interfaz ElevenLabs con texto + sliders Stability/Similarity + botón Generate · panel de waveform output debajo · fondo dark + acento dorado en botón · estilo screenshot anotado"`

**Quiz check**:
- Pregunta: "Generas voz IA y suena demasiado plana / monótona. ¿Qué ajustas?"
- Opciones: Subo Stability · Bajo Stability · Cambio de voz preset · Reescribo el texto más corto.
- Correcta: Bajo Stability.
- Explicación: Stability alto produce voz controlada (más plana). Stability bajo produce voz expresiva con más variación emocional. Para vlog interior queremos bajo (35-45). Para narrador corporativo queremos alto (70-80).

<!-- VISUAL_PENDIENTE -->
