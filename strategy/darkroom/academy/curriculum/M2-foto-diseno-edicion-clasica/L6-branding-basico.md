# M2.L6 — Branding básico · paleta, tipografía, logo simple

> **Dura**: 14 min
> **Nivel progreso**: 25% → 27%
> **Requisito previo**: M2.L5

## Qué vas a sacar de aquí

Construyes un mini brand kit en 1 hora (paleta + 2 tipografías + logo simple) que entregable a cliente para empezar a operar. Sabes qué NO meter para no inflar el precio innecesariamente.

## El concepto (1 idea, no 5)

Un "brand kit mínimo viable" para cliente que empieza tiene **3 piezas**:

1. **Paleta de 4-6 colores** con código HEX. Primary, secondary, 2 neutrales, opcional 1 accent.
2. **2 tipografías** con jerarquía. Una para titulares (display) y otra para cuerpo (body).
3. **Logo simple** en versión horizontal + vertical + solo isotipo. 3 variantes.

Eso es el 80% de uso real. El otro 20% (iconografía, ilustraciones, foto direction, brand book de 50 páginas) lo cobras aparte cuando el cliente crece.

Cobra mínimo:
- Brand kit MVP (los 3 anteriores): 300-600€.
- Brand kit completo (con guidelines + iconografía + tono de voz): 1.500-3.500€.

## El ejemplo real

**Paleta** (4 colores · ejemplo Dark Academy):

```
#0A0A0A    Background dark (negro casi-negro, mejor que #000)
#D4AF37    Gold accent (dorado anti-cliché vs amarillo plástico)
#E0E0E0    Text soft (no blanco puro · cansa los ojos)
#71717A    Text low / borders (gris zen)
```

Reglas paleta:
- Nunca uses `#000000` puro · siempre `#0A0A0A` o `#111111`. Negro puro huele a "default Bootstrap".
- Nunca uses `#FFFFFF` puro como texto sobre fondo oscuro. Usa `#F5F5F0` o `#E0E0E0`. Más fácil para leer.
- Limita a 6 colores totales. Más es ruido.
- Verifica contraste con [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/). Mínimo 4.5:1 para texto.

**Tipografías** (2 fuentes · regla "display + body"):

```
Display (titulares):
  Space Grotesk · sans modern · pesos 700 y 400
  Alternativas: Söhne, Inter Display, DM Sans

Body (cuerpo de texto):
  Inter · sans neutro · pesos 400 y 600
  Alternativas: Söhne, Roboto, DM Sans
```

Reglas tipografía:
- Máximo 2 familias. Si añades una tercera (mono code) que sea solo para snippets.
- Variable fonts (Inter Variable, Space Grotesk Variable) son la opción 2026 porque cargan más rápido en web.
- Tipografías gratis serias: Google Fonts (filtra "Highlights from Google" para evitar las cutres).

**Logo simple**:

- Wordmark (texto) o monograma (2-3 letras) en SVG.
- Versión horizontal (para headers).
- Versión vertical (para perfiles redes).
- Versión solo isotipo (para favicon, app icon).
- Color y B/N.

## El prompt copiable

Plantilla de entrega Brand Kit MVP (envíala al cliente como ZIP):

```
ClienteNombre-BrandKit-v1.zip
├─ 01-Logos
│   ├─ logo-horizontal-color.svg
│   ├─ logo-horizontal-bn.svg
│   ├─ logo-vertical-color.svg
│   ├─ logo-vertical-bn.svg
│   ├─ logo-isotipo-color.svg
│   ├─ logo-isotipo-bn.svg
│   └─ logo-preview-1000px.png
├─ 02-Colors
│   ├─ paleta.pdf (4 colores con HEX, RGB, CMYK)
│   └─ paleta.ase (Adobe Swatch Exchange · drag-and-drop a Adobe apps)
├─ 03-Typography
│   ├─ Inter.zip (familia completa · descarga Google Fonts)
│   ├─ SpaceGrotesk.zip
│   └─ ejemplos-uso.pdf (H1/H2/H3 + body con espaciado)
├─ 04-Aplicación
│   ├─ mockup-instagram.png
│   ├─ mockup-tarjeta.png
│   └─ mockup-web-hero.png
└─ README.md (instrucciones uso para no-diseñadores)
```

Pega esto como template `entrega-brand-kit-mvp.zip` en `/Plantillas`.

## Tu ejercicio (5 min)

Coge una marca personal o ficticia. Define en 5 minutos:

- [ ] 4 colores HEX (escríbelos con código).
- [ ] 2 tipografías (Google Fonts vale).
- [ ] 1 nombre + 1 idea de logo (puede ser solo iniciales).

No tienes que diseñar nada todavía. Solo decidir. Esa decisión inicial guarda 3 horas de pruebas-y-error después.

## Quick-win

**Regla "verifica accesibilidad antes de aprobar paleta"**: si tu combinación text/background no supera 4.5:1 contraste, el cliente vendrá en 2 meses diciendo "no se lee en móvil". Verifica desde el día 1. Lleva 30 segundos.

## Si quieres profundizar

- [ ] M2.L7 · Mockups · cómo presentar tu trabajo
- [ ] [Coolors.co](https://coolors.co) (generador paletas rápido)
- [ ] [Type Wolf](https://www.typewolf.com) (pairings tipográficos curados)

---

**Visual**: `TODO: visual · brief: "mockup brand kit mostrando paleta swatches + tipografías H1 H2 body + logo en 3 versiones · todo sobre fondo oscuro Dark Room con acento dorado · estilo case study"`

**Quiz check**:
- Pregunta: "Cliente quiere brand kit con 8 colores, 3 tipografías y 5 versiones de logo. ¿Es señal de buen briefing?"
- Opciones: Sí, cuanto más mejor · No, demuestra falta de criterio · Da igual mientras cobre · Solo si paga 5.000€.
- Correcta: No, demuestra falta de criterio.
- Explicación: brand kit con más de 6 colores y 2 fuentes es ruido. Si el cliente lo pide así, edúcalo · no des por bueno el briefing porque sí.

<!-- VISUAL_PENDIENTE -->
