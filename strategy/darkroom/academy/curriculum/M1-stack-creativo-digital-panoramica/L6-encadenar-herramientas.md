# M1.L6 — Encadenar 2 herramientas · output → input

> **Dura**: 12 min
> **Nivel progreso**: 12.5% → 15%
> **Requisito previo**: M1.L5

## Qué vas a sacar de aquí

Encadenas tu primer workflow con 2 herramientas en cadena (foto editada en Photoshop + texto generado por ChatGPT, o imagen Soul + edición Nano Banana). Cierras M1. Tienes 15% de progreso en la academia.

## El concepto (1 idea, no 5)

Toda pieza profesional en Dark Room sale de **encadenar herramientas**. No del modelo "uso 1 tool a fondo". Del modelo "uso 2 tools, cada una en lo suyo".

Patrón básico: **output A → input B**.

- Tomas el resultado de la herramienta A.
- Lo metes como entrada en la herramienta B.
- B lo refina, edita o transforma.
- Sale la pieza final.

3 reglas para encadenar bien:

1. **Cada herramienta hace una cosa**. Si una herramienta intenta hacer dos pasos seguidos, mejor parte en dos.
2. **Output → input es siempre el mismo formato**. No conviertas PNG a JPG a WebP entre pasos. Cada conversión pierde datos.
3. **Guarda el intermedio**. El output de la herramienta A se queda en `/03-trabajo/` por si tienes que volver atrás.

## El ejemplo real

### Cadena 1 · Brief → Copy estructurado (texto)

```
Notion (brief en markdown)
   │
   │  output: brief.md
   ▼
ChatGPT Plus (asistente)
   │  prompt: "tomas este brief y devuelves 3 versiones de copy
   │           para anuncio Instagram, 30 palabras cada una,
   │           tono cómplice tutea, cero superlativos vacíos"
   │  output: 3 versiones copy
   ▼
Notion (banco copy del cliente)
   final: 3 textos listos para mostrar al cliente
```

Tiempo total: 5 minutos. Sin encadenar (escribiendo copy a mano): 30-60 minutos.

### Cadena 2 · Retrato consistente (imagen)

```
Higgsfield Soul (generación base)
   │  prompt: avatar con tu cara
   │  output: 1 imagen retrato_base.png
   ▼
Nano Banana Pro (edición)
   │  inputs: retrato_base.png + prompt "replace background with
   │         neon Tokyo night, keep face identical"
   │  output: 1 imagen retrato_tokyo.png
   ▼
Descarga + uso en feed
   final: imagen lista para publicar
```

Tiempo total: 3-5 minutos. Sin encadenar: imposible (Soul no hace fondos cinemáticos, Nano Banana no tiene tu cara consistente).

### Cadena 3 · Foto producto (mixto)

```
Cámara móvil o foto cliente (input raw)
   │
   ▼
Photoshop (limpieza + máscara)
   │  output: producto recortado sobre fondo transparente
   ▼
Nano Banana Pro (escena nueva)
   │  inputs: producto.png + prompt "place this product on
   │         marble kitchen counter, soft morning light"
   │  output: producto + escena cinemática
   ▼
Lightroom (ajuste color final)
   │  output: producto_final.jpg con LUT consistente
   ▼
Entrega
```

3 herramientas en cadena. Resultado: foto producto que vale 100-300€ a cliente. Tiempo: 30-45 min/foto.

## El prompt copiable

Plantilla de workflow para anotar antes de empezar:

```
WORKFLOW: ____________________

Paso 1 · Herramienta: __________   Acción: __________   Output: __________
Paso 2 · Herramienta: __________   Acción: __________   Output: __________
Paso 3 · Herramienta: __________   Acción: __________   Output: __________
                                                        FINAL: __________

Tiempo presupuestado total: ____ min
Coste créditos (si IA paga): ____ €
```

Si tu cadena tiene más de 3-4 herramientas, párate. Probablemente hay una que te sobra.

## Tu ejercicio (5 min)

Haz tu primera cadena 2-pasos:

1. Abre ChatGPT. Pídele: *"Dame brief para una foto producto de unas zapatillas blancas runner para vender en Instagram. Tono casual."*
2. Coge la respuesta. Ábrete Higgsfield Soul (o Nano Banana si tienes Plus).
3. Pega el brief como base del prompt y genera 1 imagen.
4. Guarda ambos: el brief en Notion banco de prompts, la imagen en `/Personal/portfolio-piezas/`.

Has encadenado 2 herramientas. Felicidades. M1 terminado.

## Quick-win

**Regla del peor eslabón**: tu cadena final tiene la calidad del peor paso. Si Soul te da 9/10 y luego comprimes en CapCut a 480p, la pieza es 4/10. Cuando una pieza no sale, no busques mejorar el primer paso. Busca el peor.

## Si quieres profundizar

- [ ] **Has cerrado M1 (15% progreso) ✓**
- [ ] M2.L1 · Photoshop esencial · 7 herramientas que cubren el 90%
- [ ] M3.L1 · Premiere Pro · interfaz, timeline, cortes básicos
- [ ] M4.L1 · Higgsfield Soul · tu avatar persistente
- [ ] Decide cuál abrir según tu auto-diagnóstico de M1.L1

---

**Visual**: `TODO: visual · brief: "diagrama 3 bloques en cadena horizontal · Tool A → Tool B → Output final · flechas con etiqueta del formato intermedio (PNG, MD, JPG) · fondo dark + flechas doradas · estilo flowchart limpio"`

**Quiz check**:
- Pregunta: "Tu cadena es Higgsfield Soul (9/10) → Nano Banana edit (8/10) → CapCut compress 480p (3/10). ¿Qué paso optimizas primero?"
- Opciones: Soul (subir a 10) · Nano Banana (subir a 9) · CapCut compress (subir resolución) · Todos por igual.
- Correcta: CapCut compress.
- Explicación: regla del peor eslabón. La pieza final es 3/10. Mejorar Soul a 10 no sube la pieza final si CapCut sigue comprimiendo a 480p.

<!-- VISUAL_PENDIENTE -->

---

## ✓ Módulo 1 cerrado · 15% de Dark Academy

Has completado las 6 lecciones del Módulo 1. Próximos pasos:

- Descarga el lead magnet "Mapa del stack creativo digital 2026" si aún no.
- Elige tu próximo módulo según tu interés:
  - **Te tira foto y diseño** → M2 (10 lecciones, ~2 horas).
  - **Te tira video** → M3 (10 lecciones, ~2.5 horas).
  - **Te tira IA generativa** → M4 (8 lecciones, ~1.5 horas).
  - **Quieres montar tienda** → M5 (7 lecciones, ~1.5 horas).
  - **Quieres captar clientes** → M6 (8 lecciones, ~2 horas).

No tienes que hacerlos en orden. Salta al que te apriete.
