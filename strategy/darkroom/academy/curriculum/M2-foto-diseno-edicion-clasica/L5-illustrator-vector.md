# M2.L5 — Illustrator · vector cuándo lo necesitas

> **Dura**: 12 min
> **Nivel progreso**: 23% → 25%
> **Requisito previo**: M2.L4

## Qué vas a sacar de aquí

Sabes cuándo abrir Illustrator y cuándo no. Creas un logo vector limpio en 30 minutos. Entiendes la diferencia raster vs vector para que no entregues nunca un logo en JPG a cliente.

## El concepto (1 idea, no 5)

Photoshop / Figma / Canva trabajan con **píxeles** (raster). Cada imagen es una matriz de puntos de color. Si escalas, se pixela.

Illustrator trabaja con **vectores** (líneas matemáticas). Cada forma es una fórmula. Si escalas, sigue nítida. Da igual si imprimes el logo en una tarjeta o en una valla de carretera.

Cuándo es obligatorio Illustrator:

- **Logos** · siempre vector. Cliente lo va a imprimir en sitios variados.
- **Iconos** · vector escala mejor en cualquier tamaño UI.
- **Ilustración limpia** · personajes flat, infografías con formas geométricas.
- **Tipografía custom** · letras dibujadas a mano para marca.

Cuándo NO necesitas Illustrator:

- Edición fotográfica → Photoshop.
- Diseño con plantilla → Canva.
- UI/UX → Figma (Figma maneja vector básico bien).
- Imagen IA → Higgsfield / Midjourney.

## El ejemplo real

**Caso · cliente pide logo simple wordmark + isotipo, presupuesto 250€**

Workflow Illustrator (~3 horas trabajo, distribuido en 2-3 sesiones):

1. **Sesión 1 · Research + concepto** (45 min, no Illustrator)
   - 10 referencias logos del sector en Pinterest.
   - Define dirección: serif/sans, mayúsculas/mixed case, color palette tentativa.

2. **Sesión 2 · Bocetos** (45 min)
   - Sketches a mano o en iPad (Procreate / Concepts).
   - 5-7 conceptos rápidos.
   - Elige 2 finalistas para vectorizar.

3. **Sesión 3 · Vectorizar en Illustrator** (60 min)
   - Tipografía: empieza con sans-serif (Inter, DM Sans, Söhne) y deforma.
   - Pen Tool (P) para isotipo · clic-clic-arrastrar para curvas Bezier.
   - Pathfinder → unite / minus front para combinar formas.
   - Outline strokes (Object → Expand Appearance) para convertir grosores en formas reales.

4. **Sesión 4 · Variantes + entrega** (30 min)
   - Versión horizontal + vertical + solo isotipo.
   - Versión positiva (sobre claro) + negativa (sobre oscuro).
   - Export: .ai (editable), .svg (web), .pdf (print), .png (preview 1000px).

Entregables al cliente: 1 .zip con 4 archivos × 3 versiones = 12 archivos. Cliente paga 250€, tú dedicaste 3 horas reales.

## El prompt copiable

Atajos clave Illustrator primera semana:

```
P              Pen tool (dibujar paths)
A              Direct selection (mover puntos de un path)
V              Selection (mover objetos enteros)
Ctrl+J         Join (cerrar path)
Ctrl+8         Compound path (combinar)
Ctrl+Shift+O   Create outlines (texto → vector)
Ctrl+G         Group
Ctrl+Shift+G   Ungroup
[ y ]          Brush size +/-
Pathfinder window: Unite, Minus Front, Intersect, Divide
```

## Tu ejercicio (5 min)

Abre Illustrator:

- [ ] New file 1000x1000px.
- [ ] Texto "DR" con Inter Bold tamaño 400.
- [ ] Selecciona el texto · Type → Create Outlines (lo conviertes a vector).
- [ ] Selecciona los 2 caracteres · ventana Pathfinder → Unite.
- [ ] Color de relleno: dorado #D4AF37.
- [ ] Export As → SVG.

Tienes tu primer "iso-letras" en vector. Súbelo a 4K y sigue nítido.

## Quick-win

**Regla "nunca entregues logo en JPG"**: si entregas un logo en JPG, demuestras que no sabes diseño. Entrega siempre SVG (web) + PDF (print) + PNG transparente (preview). Si el cliente pide JPG porque "no sabe abrir SVG", tú le exportas el JPG desde el SVG, pero tu archivo maestro es vector.

## Si quieres profundizar

- [ ] M2.L6 · Branding básico · paleta, tipografía, logo simple
- [ ] M2.L7 · Mockups · cómo presentar tu trabajo
- [ ] [The Logo Design Process](https://www.canva.com/learn/how-to-design-a-logo/) (artículo Canva irónicamente bueno sobre el proceso)

---

**Visual**: `TODO: visual · brief: "split comparison · izquierda logo PNG ampliado 5x pixelado · derecha mismo logo SVG ampliado 5x nítido · etiquetas RASTER vs VECTOR · fondo dark + acento dorado"`

**Quiz check**:
- Pregunta: "Cliente te pide logo. ¿En qué formato es el archivo maestro?"
- Opciones: JPG · PNG · PSD · AI/SVG vector.
- Correcta: AI/SVG vector.
- Explicación: vector escala sin perder calidad y permite editarse. JPG/PNG son entregables derivados, no archivo maestro. PSD es para foto, no logos.

<!-- VISUAL_PENDIENTE -->
