# M2.L3 — Figma desde cero · frames, components, variants

> **Dura**: 14 min
> **Nivel progreso**: 19% → 21%
> **Requisito previo**: M2.L2 (recomendado M1.L4 para tener cuenta)

## Qué vas a sacar de aquí

Diseñas tu primera landing en Figma con frames + auto-layout + components. Entiendes la diferencia entre "Photoshop digital" y "diseño con sistema". Si vienes de Canva, das el salto.

## El concepto (1 idea, no 5)

Canva genera diseños bonitos. Figma genera **diseños mantenibles**. La diferencia:

- En Canva, si quieres cambiar el color de marca en 30 diseños, los cambias uno a uno.
- En Figma, defines una variable color, cambias la variable, y los 30 diseños se actualizan a la vez.

Eso es **diseño con sistema**. Para freelance que entrega 1 logo y se va, Canva sobra. Para freelance que mantiene marca de cliente durante meses o año, Figma es obligatorio.

Conceptos clave Figma (todos hoy):

1. **Frame** · contenedor con dimensiones (ej. 1920x1080 desktop, 375x812 móvil, 1080x1080 IG). Es como un artboard.
2. **Auto-layout** · frame que se ajusta automáticamente al contenido. Botones que crecen con el texto, listas que se reorganizan.
3. **Components** · elementos reutilizables (botón, card, header). Cambias el master, cambian todas las instancias.
4. **Variants** · variaciones de un component (botón primary/secondary/disabled, card large/small).
5. **Variables** · valores reutilizables (color marca, espaciado base, tipografía).
6. **Pages** · páginas del archivo (Cover, Wireframes, UI Desktop, UI Mobile, Components).

## El ejemplo real

**Caso · diseñar landing simple para una marca cliente (1 hora desde cero)**

Pasos en Figma:

1. **New file** → renombra "Cliente-NombreLanding".
2. **Crea frame 1440x900** (desktop estándar 2026). Tecla F → click → arrastra.
3. **Define variables de color**: ventana derecha → Local variables → crea 4 colores: `Brand/Primary`, `Brand/Secondary`, `Bg/Dark`, `Text/Soft`.
4. **Hero section**: frame interno con auto-layout vertical · padding 80px · contenido: H1 + subtítulo + botón CTA.
5. **Crea component botón**: selecciona botón → Cmd+Alt+K (Create component) · luego crea variant secondary.
6. **Sections**: hero / 3 bullets / pricing / footer. Cada section frame con auto-layout.
7. **Móvil version**: duplica frame, cambia tamaño a 375x812. Auto-layout adapta casi todo solo.
8. **Comparte link**: ventana arriba → Share → "Anyone with the link can view" → copia link.

Resultado: landing diseñada + responsive móvil + link compartible al cliente. Sin export PSD ni JPG.

## El prompt copiable

Estructura mínima para cualquier landing v1 en Figma (cópialo como template):

```
Page 1 · Cover
  └─ Frame 1200x630 con nombre proyecto + cliente + fecha

Page 2 · UI Desktop (1440x900)
  ├─ Hero (full width) · H1 + sub + CTA · auto-layout vertical
  ├─ Three benefits (3 columns) · cards components
  ├─ Pricing (3 plans) · card components · variant featured
  ├─ FAQ (vertical accordion · 5 items)
  └─ Footer (links + copyright)

Page 3 · UI Mobile (375x812)
  └─ Misma estructura · auto-layout responsive

Page 4 · Components
  └─ Botón primary/secondary/disabled · Card default/featured · Input · etc.

Page 5 · Variables
  └─ Colors · Spacing · Typography
```

Importa el [Figma Community template "Landing v1"](https://figma.com/community) buscando "minimalist landing" si quieres ahorrar setup.

## Tu ejercicio (5 min)

Abre Figma. Crea un archivo nuevo. Haz **solo** estos 4 pasos:

- [ ] Frame 1440x900 (tecla F).
- [ ] Texto "Hola" dentro · cambia tipografía a Inter, tamaño 80, peso bold.
- [ ] Botón debajo · rectángulo + texto encima · agrúpalos (Cmd+G) · convierte a component (Cmd+Alt+K).
- [ ] Duplica frame a 375x812 con el botón dentro · activa auto-layout en el frame (Shift+A).

Tienes tu primer micro-landing con auto-layout funcional.

## Quick-win

**Regla "siempre auto-layout"**: cuando crees frames con contenido, activa auto-layout (Shift+A). El 70% de la edición posterior se evita porque el contenido se reorganiza solo cuando cambia. Si trabajas sin auto-layout, vas a sufrir.

## Si quieres profundizar

- [ ] M2.L4 · Canva Pro · cuándo sí y cuándo Figma
- [ ] M2.L9 · Trabajo en equipo · Figma libraries + Drive shared
- [ ] [Figma Config 2025 keynote](https://config.figma.com) (resumen oficial cambios anuales)

---

**Visual**: `TODO: visual · brief: "screenshot Figma con landing diseñada · panel layers a la izquierda mostrando estructura jerárquica · panel design a la derecha con variables color · estilo screenshot anotado"`

**Quiz check**:
- Pregunta: "Cliente cambia el color de marca de azul a rojo. ¿En qué herramienta es más rápido aplicar el cambio a 20 diseños?"
- Opciones: Photoshop · Canva · Figma con variables · Illustrator.
- Correcta: Figma con variables.
- Explicación: variables Figma permiten cambiar el color en 1 sitio y propagarlo a todos los diseños conectados. Canva y Photoshop requieren cambio manual uno a uno.

<!-- VISUAL_PENDIENTE -->
