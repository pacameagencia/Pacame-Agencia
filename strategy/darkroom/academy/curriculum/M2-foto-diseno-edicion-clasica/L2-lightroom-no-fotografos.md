# M2.L2 — Lightroom para fotógrafos no fotógrafos

> **Dura**: 12 min
> **Nivel progreso**: 17% → 19%
> **Requisito previo**: M2.L1

## Qué vas a sacar de aquí

Procesas 30 fotos en 10 minutos con presets + batch. Sabes cuándo usar Lightroom y cuándo Photoshop. Aplicas el primer LUT consistente a un set de fotos cliente.

## El concepto (1 idea, no 5)

Photoshop es para **una foto profunda**. Lightroom es para **muchas fotos parecidas**.

La diferencia clave: en Lightroom todos los ajustes son **no-destructivos** y se aplican sobre el archivo RAW (datos sin procesar). Puedes revertir cualquier cosa siempre. En Photoshop trabajas sobre JPG/PSD ya procesado y los ajustes destructivos rompen calidad.

Ejemplos de cuándo Lightroom:
- 50 fotos boda → batch presets.
- 20 fotos producto e-commerce → mismo color grading.
- Foto RAW móvil → ajuste exposición, sombras, color.
- Crear "look" propio (preset reutilizable).

Ejemplos de cuándo Photoshop:
- 1 foto retoque profundo (pieles, manchas, generative fill).
- Composición de elementos (producto + fondo nuevo).
- Mockup con varios layers.
- Texto sobre imagen.

## El ejemplo real

**Caso · cliente envía 30 fotos producto del mismo set, quiere todas con mismo look "premium minimalista"**

Workflow Lightroom:

1. Importa las 30 fotos al catálogo Lightroom.
2. Selecciona la foto más representativa (la mejor expuesta).
3. **En módulo Develop**, ajusta:
   - Exposure (subir 0.3 si están oscuras).
   - Highlights -30 (recuperar luces quemadas).
   - Shadows +20 (abrir sombras).
   - Whites +15, Blacks -10 (rango dinámico).
   - HSL: ajusta saturación de colores específicos (ej. desaturar amarillos +15, saturar azules +10).
   - Tone Curve: leve curva S para contraste.
4. **Guarda como preset**: clic derecho en panel Presets → "Create Preset" → "Premium Minimalista 01".
5. **Sincroniza al resto**: vuelve a Library, selecciona las 30, clic derecho → Sync Settings → aplica preset.
6. **Revisión rápida**: pasa con flechas, ajusta excepciones (1-2 fotos pueden necesitar diferente exposición).
7. **Exporta batch**: File → Export → 30 JPG en carpeta destino, calidad 85, tamaño largo 2048px.

Tiempo total: 12-15 min para 30 fotos. Sin batch: 3-4 horas.

## El prompt copiable

Tu primer preset "look Dark Academy" (úsalo como base):

```
Exposure:    +0.10
Highlights:  -45
Shadows:     +25
Whites:      +18
Blacks:      -15
Vibrance:    +8
Saturation:  -5  (más sutil)
Clarity:     +12
Texture:     +6

Tone Curve: leve S (contraste alto)
HSL · Orange: saturación -10 (piel menos saturada)
HSL · Blue:   saturación +12 (cielos / azules más vivos)
```

Pega esto en Lightroom Develop module en una foto cualquiera, guarda como preset, y úsalo de base. Iteras hasta tu look propio.

## Tu ejercicio (5 min)

Importa 5 fotos tuyas (móvil vale) a Lightroom:

- [ ] Aplica el preset de arriba a una.
- [ ] Ajusta 2 sliders más a tu gusto.
- [ ] Guarda como preset propio "Mi look 01".
- [ ] Sincroniza a las otras 4 (Sync Settings).
- [ ] Exporta el batch.

Tienes tu primer batch processing funcional.

## Quick-win

**Regla "RAW siempre que puedas"**: si el cliente o tu móvil pueden enviar RAW (.dng, .cr2, .arw), pídelo. Lightroom saca 10x más información de un RAW que de un JPG. Si solo hay JPG, OK, pero pierdes margen de edición.

## Si quieres profundizar

- [ ] M2.L3 · Figma desde cero · frames, components, variants
- [ ] M2.L8 · Decisión Photoshop vs IA · cuándo cada uno
- [ ] [Adobe Lightroom presets gratis](https://lightroompresets.com) (cuidado: muchos son malos · prefiere crear los tuyos)

---

**Visual**: `TODO: visual · brief: "before/after de una foto procesada · panel Develop Lightroom anotado con los sliders clave · fondo dark + flechas doradas señalando ajustes · estilo split-screen"`

**Quiz check**:
- Pregunta: "Tienes 50 fotos de un evento con la misma luz. Quieres aplicar el mismo look a todas. ¿Cuál es más eficiente?"
- Opciones: Photoshop · Lightroom Sync Settings · Procesar una a una · Subir a Canva.
- Correcta: Lightroom Sync Settings.
- Explicación: Lightroom está diseñado exactamente para batch processing no-destructivo. Photoshop te llevaría 10x más tiempo.

<!-- VISUAL_PENDIENTE -->
