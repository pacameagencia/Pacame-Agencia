# M4.L2 — Nano Banana Pro · imagen cine + edición multi-imagen

> **Dura**: 14 min
> **Nivel progreso**: 57% → 59%
> **Requisito previo**: M4.L1

## Qué vas a sacar de aquí

Editas imágenes con Nano Banana Pro usando prompts multi-imagen numerados. Cambias fondo manteniendo el sujeto. Generas tu primera escena cinemática 2K con tu Soul Character integrado.

## El concepto (1 idea, no 5)

Nano Banana Pro es el modelo CINEMATIC de Higgsfield. Hace 3 cosas mejor que Soul:

1. **Resolución 2K** · output 2048x2048 vs Soul 1024.
2. **Edición multi-imagen con prompts numerados** · subes 2 imágenes y dices "use the first uploaded picture for character, use the second uploaded picture for background".
3. **Texturas cinemáticas reales** · poros piel, granos film stock, contact shadows producto.

Cuándo usar Nano Banana Pro vs Soul:

- **Soul** · daily, iPhone-look, AUTHENTIC, batch unlimited.
- **Nano Banana Pro** · hero piece, escena específica, CINEMATIC, cuesta créditos extra.

Una pieza típica usa los dos en cadena: Soul para generar tu retrato base, Nano Banana Pro para colocarlo en escena cinemática.

## El ejemplo real

**Caso · cliente fitness quiere hero image para landing · "él en gimnasio neon Tokyo"**

Workflow 2 herramientas en cadena:

1. **Generar retrato cliente (Higgsfield Soul)**:
   ```
   {cliente reference_id PACAME-FIT-CLIENT-001},
   athletic build, focused intense expression,
   shot on iPhone Pro, daylight, neutral pose.
   ```
   Output: `retrato_cliente.png` (1024x1024).

2. **Generar fondo escena (Nano Banana Pro o Soul)**:
   ```
   Empty modern gym in Tokyo at night, neon pink and cyan lighting,
   moody atmosphere, polished concrete floor, mirrors reflecting neon,
   cinematic wide shot 35mm.
   ```
   Output: `fondo_tokyo.png`.

3. **Edición multi-imagen Nano Banana Pro**:
   - Sube `retrato_cliente.png` como imagen 1.
   - Sube `fondo_tokyo.png` como imagen 2.
   - Prompt:
     ```
     Place the person from the first uploaded picture into the gym
     scene from the second uploaded picture. Keep the exact facial
     features, skin tone, and body proportions of the person from
     image 1. Match the lighting of image 2 (neon pink rim light from
     left, cyan back light from right). Maintain cinematic quality.
     ```
   - Genera 3 variations.
4. **Selecciona mejor** · descarga 2K.
5. **Three-Pass Review** (M4.L8) antes de entregar.

Tiempo: 10-15 min. Coste: ~$0.40 (3 generaciones Nano Banana Pro). Cliente paga 200-400€ por hero image cinemática.

## El prompt copiable

Plantilla edición multi-imagen Nano Banana Pro:

```
[Input: 2 imágenes subidas]

[Acción principal]
Place [subject from first uploaded picture] into [scene from second
uploaded picture].

[Reglas de preservación]
Keep the exact facial features, skin tone, hair, and body proportions
of the person from the first uploaded picture. Do not alter the face.

[Reglas de integración]
Match the lighting and color temperature of the second uploaded
picture. Add realistic contact shadows where the person touches the
floor. Preserve the architectural details of the background.

[Estilo cinemático]
Cinematic photography, 35mm lens, slight depth of field, professional
color grading.
```

Memoriza las 4 secciones (Acción / Preservación / Integración / Estilo). Cada una resuelve un problema distinto del modelo.

## Tu ejercicio (5 min)

Si tienes Higgsfield Plus o créditos Nano Banana:

- [ ] Genera un retrato con Soul Character.
- [ ] Busca o genera un fondo (cualquier escena).
- [ ] En Nano Banana, sube ambas como imagen 1 y 2.
- [ ] Aplica el prompt template.
- [ ] Genera 3 variations.

Compara: ¿la cara del retrato se mantuvo? ¿La iluminación encaja con el fondo? Ambas deben ser sí.

## Quick-win

**Regla R12 (REFERENCE) "While keeping everything else identical"**: cuando edites con Nano Banana, añade siempre la frase "while keeping everything else identical". Sin eso, el modelo se permite alterar elementos que no debías tocar. Es muletilla de prompt que salva piezas.

## Si quieres profundizar

- [ ] M4.L3 · Midjourney v7 · cuándo le sacas partido
- [ ] M4.L6 · Estructura prompt cinemático 5-step · DoP order PACAME
- [ ] `strategy/darkroom/studio-config/DARK-ROOM-REFERENCE.md` §9 reglas R10-R13 (edits + multi-image)

---

**Visual**: `TODO: visual · brief: "diagrama 3 imágenes en cadena · retrato Soul → fondo escena → resultado Nano Banana combinado · flechas conectoras + label de input 1/2 · fondo dark + acento dorado · estilo workflow visual"`

**Quiz check**:
- Pregunta: "Editas imagen con Nano Banana Pro multi-imagen y el modelo cambia ligeramente la cara del sujeto. ¿Qué añades al prompt?"
- Opciones: 'Hyperrealistic 4K' · 'While keeping the face identical and everything else unchanged' · 'Cinematic shot' · Nada, el modelo es malo.
- Correcta: 'While keeping the face identical and everything else unchanged'.
- Explicación: regla R12. Sin esa frase explícita, Nano Banana puede alterar elementos que no querías. Con esa frase, el modelo respeta lo que debe.

<!-- VISUAL_PENDIENTE -->
