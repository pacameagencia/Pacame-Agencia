# Fonts · Composer Dark Room

5 TTFs descargadas para que `compose-slides.mjs` y `compose-stories.mjs` funcionen en cualquier entorno.

| Archivo | Origen | Uso |
|---|---|---|
| `Anton-Regular.ttf` | google/fonts (OFL) | Display titles ALL CAPS |
| `SpaceGrotesk-Bold.ttf` | **Poppins-Bold** (fallback temporal · OFL) | Headlines · sub-hooks |
| `SpaceGrotesk-Medium.ttf` | **Poppins-Medium** (fallback temporal · OFL) | Body text |
| `SpaceGrotesk-Variable.ttf` | google/fonts variable original | Backup |
| `JetBrainsMono-Regular.ttf` | JetBrains/JetBrainsMono (OFL) | Captions · precios mono |
| `JetBrainsMono-Bold.ttf` | JetBrains/JetBrainsMono (OFL) | Etiquetas mono bold |

## Por qué Poppins en lugar de Space Grotesk Bold/Medium real

Brand bible Dark Room v2.0 especifica Space Grotesk Bold y Medium estáticos. El repo upstream `floriankarsten/space-grotesk` no expone los TTFs estáticos por raw URL, y `google/fonts` solo ofrece la versión variable (no compatible directamente con `opentype.js@2` para weight axis).

**Solución temporal:** sustituir por Poppins (geometric sans similar). El composer aplica `auto-fit` a todos los textos para que la diferencia de anchura entre fuentes no rompa layouts.

**Cuando se quiera Space Grotesk genuino**: subir Bold/Medium TTFs estáticas manualmente al repo (descargar de https://github.com/floriankarsten/space-grotesk releases o de Google Fonts ZIP).
