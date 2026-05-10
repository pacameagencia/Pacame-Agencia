# M2.L1 — Photoshop esencial · 7 herramientas que cubren el 90%

> **Dura**: 14 min
> **Nivel progreso**: 15% → 17%
> **Requisito previo**: M1 cerrado (recomendado L6)

## Qué vas a sacar de aquí

Dominas las 7 herramientas de Photoshop que cubren el 90% del trabajo real: layers, masks, adjustment layers, generative fill, clone stamp, brush, transform. Editas tu primera foto cliente sin tutoriales adicionales.

## El concepto (1 idea, no 5)

Photoshop tiene 200+ funciones. Vas a usar 7 cada día. El resto las abres una vez al año y para entonces ya has olvidado dónde están.

Las 7 esenciales:

1. **Layers** · base de todo. Cada elemento en su capa. Si no entiendes capas, no entiendes Photoshop.
2. **Masks** · mostrar/ocultar parte de una capa sin destruirla. Reversible. La mascara es tu seguro.
3. **Adjustment layers** · ajustar color/brillo sobre todas las capas debajo sin tocarlas. Niveles, curvas, hue/saturation.
4. **Generative fill** · seleccionas un área, escribes qué quieres, Adobe IA rellena. Cambia tu velocidad por 5x en retoque.
5. **Clone stamp + Spot healing** · borrar imperfecciones (poste de luz, mancha en piel, basura en suelo).
6. **Brush + Eraser** · pintar, retocar, ajustar máscaras. El más usado tras la herramienta de selección.
7. **Free transform (Ctrl+T / Cmd+T)** · escalar, rotar, deformar. Lo usas en cada pieza.

Si dominas estas 7, cierras el 90% de los encargos foto que te entran.

## El ejemplo real

**Caso · cliente envía foto producto sobre mesa de cocina, necesita misma foto con fondo estudio blanco**

Workflow en Photoshop:

1. Abre foto original (.jpg cliente).
2. **Crea selección del producto**: Tool Object Selection (clic en producto, IA detecta bordes).
3. **Copia a layer nueva**: Ctrl+J. Tienes 2 layers: original + producto recortado.
4. **Crea layer color blanco debajo**: New Layer → Fill White. La pones entre original y producto.
5. **Oculta layer original**: clic en ojo. Ves producto sobre fondo blanco.
6. **Refina máscara**: Brush sobre la máscara, blanco para mostrar / negro para ocultar (atajo X para alternar).
7. **Adjustment layer Levels** sobre el producto: ajusta blancos puros y oscuros.
8. **Generative fill** si hay sombra: selecciona donde quieres sombra → "soft drop shadow under product".
9. **Free transform** si necesitas centrar.
10. **Exporta**: File → Export As → JPG calidad 90.

Tiempo: 5-10 min por foto. Cliente paga 30-80€ por foto producto en este estilo.

## El prompt copiable

Tu "kit de atajos" Photoshop para primera semana (memorízalos):

```
Ctrl+J         Duplicar layer
Ctrl+T         Free transform
Ctrl+Shift+I   Invertir selección
Ctrl+D         Deseleccionar
B              Brush
E              Eraser
V              Move tool
X              Alternar color foreground/background (clave en máscaras)
[ y ]          Reducir/aumentar tamaño brush
Ctrl+Alt+Z     Step back (deshacer paso a paso)
Ctrl+Shift+S   Save As
```

Imprime esto y pégalo al monitor 2 semanas. Luego ya los tienes en músculo.

## Tu ejercicio (5 min)

Coge una foto tuya (móvil vale). Abre Photoshop:

- [ ] Crea nueva layer y pinta una raya roja con Brush.
- [ ] Crea máscara en esa layer y oculta la mitad de la raya con Brush negro.
- [ ] Añade Adjustment Layer "Hue/Saturation" y mueve hue.
- [ ] Usa Generative Fill: selecciona un trozo del fondo y escribe "small plant in pot".
- [ ] Exporta como JPG.

Si haces los 5 pasos, ya manejas Photoshop básico. El resto es práctica.

## Quick-win

**Regla "Adjustment Layers en lugar de Image → Adjustments"**: si abres un menú "Image → Adjustments → Levels", lo estás haciendo mal. Es destructivo (no se revierte). Crea Adjustment Layer (icono medio círculo abajo en panel layers). Es reversible y editable después.

## Si quieres profundizar

- [ ] M2.L2 · Lightroom para fotógrafos no fotógrafos
- [ ] M2.L8 · Decisión Photoshop vs IA · cuándo cada uno
- [ ] Recurso oficial: [Adobe Photoshop tutorials](https://helpx.adobe.com/photoshop/tutorials.html) (los oficiales · ignora YouTubers genéricos)

---

**Visual**: `TODO: visual · brief: "screenshot Photoshop con anotaciones señalando las 7 herramientas esenciales en la barra lateral · números 1-7 en círculos dorados · fondo oscuro Photoshop · estilo tutorial anotado"`

**Quiz check**:
- Pregunta: "Cliente pide cambiar fondo de foto producto. ¿Qué herramienta usas primero?"
- Opciones: Brush · Object Selection + máscara · Generative Fill · Crop tool.
- Correcta: Object Selection + máscara.
- Explicación: máscara reversible es siempre mejor que borrado destructivo. Generative Fill solo para extender o completar, no para recortar.

<!-- VISUAL_PENDIENTE -->
