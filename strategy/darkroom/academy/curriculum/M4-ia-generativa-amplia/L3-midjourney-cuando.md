# M4.L3 — Midjourney v7 · cuándo le sacas partido

> **Dura**: 12 min
> **Nivel progreso**: 59% → 61%
> **Requisito previo**: M4.L2

## Qué vas a sacar de aquí

Sabes los 3 casos donde Midjourney v7 supera a Higgsfield + Nano Banana. Generas tu primera imagen con estilo propio. Entiendes por qué Midjourney NO es para todo (es para estética, no para precisión).

## El concepto (1 idea, no 5)

Midjourney v7 (2026) es el modelo de imagen con **estética más distintiva** del mercado. Es bueno en:

1. **Imagen estilizada con look propio** · pintura digital, ilustración, conceptos artísticos.
2. **Moodboards rápidos** · cuando necesitas 20 thumbnails de "dirección visual" para presentar a cliente.
3. **Conceptos creativos sin referencia fotográfica** · personajes fantásticos, lugares inventados, surreal.

Donde NO es bueno:

1. **Realismo iPhone-look** · Soul gana fácil.
2. **Edición de imagen existente** · Midjourney es generación pura, edición limitada.
3. **Soul Character persistente** · Midjourney no tiene reference IDs entrenables como Soul.
4. **Productos cliente reales** · no garantiza fidelidad al producto físico.

## El ejemplo real

**Caso 1 · Moodboard concepto cliente nueva marca**

Workflow rápido Midjourney:

1. En Discord (donde vive Midjourney) o Web App: `/imagine`.
2. Prompt simple:
   ```
   minimalist organic skincare brand, soft pastel tones, dewy texture,
   marble surfaces, natural light, art direction reference --ar 4:5
   ```
3. Genera 4 variations en 60 segundos (~$0.30 con plan Standard 10€/mes).
4. Pide variations de la mejor (botón V1/V2/V3/V4).
5. En 15 minutos tienes 20 thumbnails distintos para mostrar al cliente "esta es la dirección visual".

Cliente elige una dirección. Tú la profundizas con Nano Banana o Photoshop después.

**Caso 2 · Ilustración para newsletter cliente**

```
illustration of a peaceful morning routine, watercolor textures,
warm sunrise palette, hand-drawn linework, editorial style --ar 16:9
```

Output: ilustración tipo "editorial New Yorker" usable en hero de newsletter.

**Caso 3 · NO usar Midjourney**

Cliente envía foto producto real (botella crema) y pide foto cinemática con el producto.

→ **NO Midjourney**. Midjourney no garantiza fidelidad al producto. Usa:
- Photoshop para componer fondo nuevo manteniendo producto real.
- O Nano Banana Pro multi-imagen pasando el producto como imagen 1.

## El prompt copiable

3 prompts Midjourney que cubren 80% de casos creativos:

```
1. Moodboard marca:
   {sector} brand visual identity, {3 adjetivos estilo},
   {medium · digital painting / photograph / illustration},
   {paleta color}, art direction reference --ar 4:5 --v 7

2. Ilustración editorial:
   illustration of {scene}, {medium · watercolor / vector / line art},
   {paleta}, editorial style, hand-drawn quality --ar 16:9 --v 7

3. Concepto fantástico:
   {personaje o lugar imposible}, cinematic atmosphere,
   {director reference · style of Denis Villeneuve / Wes Anderson},
   detailed environment, dramatic lighting --ar 21:9 --v 7
```

`--ar` define ratio (4:5 IG carrusel, 16:9 web, 21:9 cinema), `--v 7` versión, `--stylize` (0-1000) intensidad estética (default 100, 500+ se vuelve muy estilizado).

## Tu ejercicio (5 min)

Si tienes Midjourney (10€/mes mínimo):

- [ ] Genera 1 moodboard de "dirección visual" para una marca ficticia.
- [ ] Genera 1 ilustración editorial.
- [ ] Compara con resultado equivalente en Higgsfield Soul.

¿Cuál encaja mejor para qué caso? Midjourney suele ganar en "estilizado", Soul gana en "iPhone-real".

Si no tienes Midjourney: salta esta lección o suscríbete temporalmente 1 mes solo para probar.

## Quick-win

**Regla "Midjourney es para empezar, no para entregar"**: usa Midjourney para explorar dirección visual rápido. Una vez decides el look, vuelves a Soul / Nano Banana / Photoshop para producir el output final con consistencia y edición. Midjourney como tool de moodboard, no de producción final.

## Si quieres profundizar

- [ ] M4.L4 · ChatGPT + Claude · IA texto en tu workflow
- [ ] M4.L6 · Estructura prompt cinemático 5-step (aplicable a Midjourney también)
- [ ] [Midjourney v7 documentation](https://docs.midjourney.com) (oficial)

---

**Visual**: `TODO: visual · brief: "grid comparativo · 1 moodboard Midjourney (ilustrativo) · 1 retrato Higgsfield Soul (iPhone-look) · 1 hero Nano Banana Pro (cine) · 3 outputs con label de uso ideal · fondo dark + estilo case study"`

**Quiz check**:
- Pregunta: "Cliente envía foto producto botella crema y pide ponerla en cocina cinemática. ¿Midjourney o Nano Banana Pro?"
- Opciones: Midjourney · Nano Banana Pro · Photoshop · Soul.
- Correcta: Nano Banana Pro.
- Explicación: producto real requiere fidelidad. Midjourney genera sin garantizar que mantenga la forma exacta de la botella. Nano Banana multi-imagen sí (sube producto + fondo, combina).

<!-- VISUAL_PENDIENTE -->
