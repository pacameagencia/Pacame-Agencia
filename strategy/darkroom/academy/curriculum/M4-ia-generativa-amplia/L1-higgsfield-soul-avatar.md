# M4.L1 — Higgsfield Soul · tu avatar persistente

> **Dura**: 14 min
> **Nivel progreso**: 55% → 57%
> **Requisito previo**: M3 cerrado o M1 si saltas directo a IA

## Qué vas a sacar de aquí

Entrenas tu primer Soul Character con tu cara o la del cliente. Tienes un `reference_id` persistente que reusas en 200+ generaciones sin perder consistencia. Generas tu primer retrato AUTHENTIC iPhone-look propio.

## El concepto (1 idea, no 5)

Higgsfield Soul resuelve el problema número 1 de IA visual: **consistencia de personaje**.

Sin Soul: cada vez que generas una imagen de "tu avatar", el modelo crea una cara nueva. Misma persona, ojos distintos, mandíbula distinta, mirada distinta. Inservible para marca personal o reels que necesitan reconocer al "personaje".

Con Soul Character entrenado:
- Subes 5-10 fotos tuyas o del cliente.
- Higgsfield entrena un `reference_id` único (ej. `PACAME-PABLO-001`).
- Usas ese `reference_id` en cada prompt: "person with reference_id PACAME-PABLO-001 in a coffee shop".
- El modelo mantiene la cara idéntica en todas las generaciones.

3 fases para crear tu Soul Character:

1. **Recopilar 5-10 fotos** · variedad de ángulos (front, 3/4, profile), expresiones (neutra, sonriendo), iluminaciones (luz natural, interior). Foto NO selfies cutres: bien expuestas, foco nítido.
2. **Subir y entrenar** · panel Higgsfield Soul → "Train Character" → upload fotos → procesa 5-15 min.
3. **Verificar consistency** · genera 3-5 imágenes test con prompts variados. Si la cara cambia, vuelve a fase 1 con mejores fotos.

## El ejemplo real

**Caso · cliente coach quiere avatar IA para 30 reels al mes sin tener que grabarse**

Workflow:

1. **Cliente envía 8 fotos**:
   - 2 selfies frontales (móvil bueno luz natural).
   - 2 fotos profesionales 3/4 (de su perfil LinkedIn).
   - 2 fotos casual exterior (luz dorada).
   - 2 fotos interior estudio.
   - Todas pelo, expresión y outfit variados.

2. **Subir a Higgsfield**:
   - Panel Soul → Train Character.
   - Nombre del character: "CLIENTECOACH-2026" (memorable para reusar).
   - Upload las 8 fotos.
   - Higgsfield procesa ~10 min.

3. **Verificar consistency**:
   - Genera 3 retratos test con prompts variados ("at gym", "at office", "at park").
   - Si la cara coincide en los 3 → character listo.
   - Si no, vuelve a fase 1 con fotos mejor angle / luz.

4. **Producir contenido**:
   - Cada reel usa el `reference_id` del character.
   - 30 reels/mes en menos de 5 horas trabajo total.
   - Cliente nunca tiene que volver a grabarse.

Coste: 1 entrenamiento (~5-10 créditos Higgsfield) + generación regular cubierta por plan Plus.

## El prompt copiable

Prompts test que debes lanzar tras entrenar character (verificar consistencia):

```
1. Wide shot of {character reference_id} sitting at a coffee shop,
   morning light, candid casual moment.

2. Close-up portrait of {character reference_id}, looking at camera,
   confident expression, neutral background.

3. {character reference_id} walking through urban street at sunset,
   tracking shot from behind, golden hour light.
```

Los 3 deben dar la misma cara. Si una cambia, tu entrenamiento tiene fotos malas.

## Tu ejercicio (5 min)

Si tienes Higgsfield Plus:

- [ ] Selecciona 5-8 fotos tuyas (variadas en luz y ángulo).
- [ ] Entrena Soul Character "TuNombre-2026".
- [ ] Genera 3 retratos test con prompts variados.
- [ ] Verifica que la cara es consistente.

Si no tienes Plus aún: anota mentalmente que es el paso 1 ineludible de M4. Soul Character es la base. Sin él, ninguna otra técnica IA tuya tendrá consistencia.

## Quick-win

**Regla "fotos de entrenamiento son la diferencia"**: el 90% de Soul Characters fallan porque las fotos son malas (selfies oscuros, todos mismo ángulo, todos misma expresión). Invierte 30 minutos en hacer/elegir buenas fotos antes de entrenar. Vale por 200 generaciones después.

## Si quieres profundizar

- [ ] M4.L2 · Nano Banana Pro · imagen cine + edición multi-imagen
- [ ] M4.L8 · Three-Pass Review · 26 markers anti-AI-look
- [ ] `strategy/darkroom/studio-config/DARK-ROOM-REFERENCE.md` §6 (Soul Character workflow completo)

---

**Visual**: `TODO: visual · brief: "grid 6 imágenes mismo personaje generadas con Soul Character · 6 contextos distintos (café, oficina, parque, gym, casa, viaje) · mismo rostro consistente · fondo dark + acento dorado en label reference_id · estilo case study"`

**Quiz check**:
- Pregunta: "Generas 5 imágenes con Soul Character entrenado y 3 tienen caras ligeramente distintas. ¿Qué falla?"
- Opciones: El modelo es malo · Mis fotos de entrenamiento no eran consistentes · El prompt es genérico · Higgsfield necesita reentrenarse cada mes.
- Correcta: Mis fotos de entrenamiento no eran consistentes.
- Explicación: Soul Character aprende de las fotos que le das. Si subes 8 fotos con luz y ángulos muy distintos, aprende un "promedio" que sale inconsistente. Mejor 5 fotos buenas que 10 mediocres.

<!-- VISUAL_PENDIENTE -->
