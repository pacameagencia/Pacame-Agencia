# M4.L6 — Estructura prompt cinemático 5-step · DoP order PACAME

> **Dura**: 14 min
> **Nivel progreso**: 65% → 67%
> **Requisito previo**: M4.L5

## Qué vas a sacar de aquí

Aplicas la estructura 5-step que separa prompts profesionales de "cinematic vibe genérico". Sabes el orden DoP (Director of Photography) que el modelo IA prefiere: subject → setting → camera → look. Generas tu primer prompt que aguanta comparación cara a cara con cine real.

## El concepto (1 idea, no 5)

Un prompt cinemático estructurado tiene **5 partes** en orden estricto:

1. **Subject + action (lo que DEBE estar bien)** · qué/quién es el sujeto, qué hace, expresión.
2. **Setting + atmosphere** · dónde, condiciones de luz, mood.
3. **Camera + lens + motion** · tipo de toma, lente, movimiento de cámara.
4. **Look + LUT + style** · color grading, referencia visual concreta (peli, DP).
5. **Dialogue / audio sync** (opcional, solo si el modelo soporta) · línea de diálogo o sync de sonido.

El orden importa porque el modelo IA procesa el prompt secuencialmente. Si pones "lente 35mm" antes que "sujeto", el modelo le da más peso a "lente". Si pones sujeto primero, garantizas que esa es la prioridad.

## El ejemplo real

**Mal prompt (sin estructura)**:
```
A cinematic shot at golden hour with a person, moody atmosphere,
4K hyperrealistic, beautiful lighting, dramatic.
```
Output: genérico, ningún elemento es prioridad clara, el modelo improvisa.

**Buen prompt (5-step DoP order)**:

```
[1. SUBJECT + ACTION]
A 32 year old man with a short dark beard, wearing a worn leather
jacket, leaning against a brick wall, looking off-camera with a
contemplative expression.

[2. SETTING + ATMOSPHERE]
Late afternoon in a narrow alley of Buenos Aires, soft golden light
filtering between buildings, faint mist rising from the pavement.

[3. CAMERA + LENS + MOTION]
Medium shot at 35mm anamorphic, slight low angle, static framing
with subtle handheld movement, shallow depth of field with subject
in focus and background slightly blurred.

[4. LOOK + LUT + STYLE]
Color graded with warm amber highlights and deep cool shadows,
inspired by "Drive" 2011 cinematography by Newton Thomas Sigel.
Slight film grain texture, Kodak Vision3 250D film stock emulation.

[5. AUDIO SYNC (si el modelo lo permite)]
Sound design: faint distant traffic, brief soft footsteps.
```

Output: pieza con dirección clara, look real cine, no improvisada.

## El prompt copiable

Template DoP 5-step (pega en Notion):

```
[1. SUBJECT + ACTION]
{Describe sujeto: edad, género, características físicas, ropa,
expresión, acción que hace.}

[2. SETTING + ATMOSPHERE]
{Lugar concreto, hora del día, condiciones de luz, mood, detalles
ambientales.}

[3. CAMERA + LENS + MOTION]
{Tipo de toma: wide / medium / close-up · lente específico · ángulo ·
movimiento cámara · depth of field.}

[4. LOOK + LUT + STYLE]
{Color grading descriptivo · referencia peli concreta + DP · LUT o
film stock · texture · grain.}

[5. AUDIO/DIALOGUE (opcional)]
{Sound design · diálogo si aplica · sync points.}
```

Rellénalo 10 veces y la estructura entra en músculo. Después generas prompts cine en 3 minutos.

## Tu ejercicio (5 min)

Coge una idea para pieza video o imagen. Rellena la plantilla 5-step:

- [ ] 1. Subject + action: ¿quién y qué?
- [ ] 2. Setting + atmosphere: ¿dónde y mood?
- [ ] 3. Camera + lens + motion: ¿cómo se ve?
- [ ] 4. Look + LUT + style: ¿qué peli inspira?
- [ ] 5. Audio (opcional): ¿qué se oye?

Compara con un prompt "cinematic vibe" típico. La diferencia es brutal.

## Quick-win

**Regla "el orden no es estético, es algoritmo"**: cuando el modelo procesa tu prompt, le da más peso a las primeras frases. Si pones "shot on 35mm" antes de describir al sujeto, garantizas que el lente domina sobre el sujeto. Subject siempre primero. Camera al final. Es regla algorítmica, no preferencia.

## Si quieres profundizar

- [ ] M4.L7 · JSON prompts · schema validable
- [ ] M4.L8 · Three-Pass Review · 26 markers anti-AI-look (cierra módulo)
- [ ] `strategy/darkroom/studio-config/DARK-ROOM-REFERENCE.md` §9 regla R11 (DoP order)

---

**Visual**: `TODO: visual · brief: "diagrama 5 cajas verticales numeradas con cada step (subject/setting/camera/look/audio) · ejemplo prompt anotado al lado · fondo dark + acento dorado en numeración · estilo cheatsheet técnica"`

**Quiz check**:
- Pregunta: "Pones 'shot on 35mm anamorphic' como PRIMERA frase del prompt antes de describir al sujeto. ¿Qué pasa?"
- Opciones: Nada, el modelo entiende todo · El lente domina la composición · La pieza sale en blanco · El modelo elige otro lente.
- Correcta: El lente domina la composición.
- Explicación: el modelo da más peso a las primeras frases. Si el lente va primero, prioriza características técnicas sobre el sujeto. Subject siempre primero · camera al final.

<!-- VISUAL_PENDIENTE -->
