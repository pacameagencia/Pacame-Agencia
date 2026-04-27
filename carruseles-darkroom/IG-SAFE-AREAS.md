# Instagram Safe Areas · Especificación canónica

> Referencia única para todos los composers, prompts gpt-image-2 y producción de assets.
> Si una pieza no cumple esto, **NO se publica**.

## Por qué esto importa

Instagram superpone elementos UI sobre el contenido del post/story:
- **Posts feed**: nombre cuenta + icono "..." arriba · iconos like/comment/save/share abajo
- **Stories**: progress bar + nombre + close arriba · "responder" + share abajo

Si tu texto crítico cae en esas zonas, queda **tapado o cortado**. Pasó con el primer carrusel publicado (`ÚLTIMAS PLAZAS LIFETIME` se solapaba con el botón share).

---

## Post Feed · 1080×1350 (4:5)

```
                      1080 px ancho
            ┌─────────────────────────────────────┐  0
            │░░░░░░░ TOP UNSAFE 100px ░░░░░░░░░░░░│
            │░ icono ⋯ · nombre cuenta · sticker ░│  ← IG pone aquí
            │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
1350 px alto├─────────────────────────────────────┤  100
            │ ░                                 ░ │
            │ ░                                 ░ │  60px
            │ ░    ZONA SEGURA TEXTO + SUBJ    ░ │  margen
            │ ░                                 ░ │  L y R
            │ ░       960 × 990 px crítica      ░ │
            │ ░                                 ░ │
            │ ░                                 ░ │
            │ ░                                 ░ │
            ├─────────────────────────────────────┤  1090
            │░░░░░░ BOTTOM UNSAFE 260px ░░░░░░░░░░│
            │░ ❤ comment · paper-plane · save 🔖 ░│  ← IG pone aquí
            │░ caption preview (las 2 primeras   ░│
            │░ líneas), reels icon, etc          ░│
            └─────────────────────────────────────┘  1350
```

### Reglas duras

- **TOP UNSAFE**: 0-100 px → solo background/atmósfera, **NO texto crítico, NO subject importante**
- **BOTTOM UNSAFE**: 1090-1350 px → idem, solo background
- **LEFT/RIGHT MARGIN**: 60 px cada lado → texto nunca toca el borde
- **ZONA SEGURA**: x=60-1020, y=100-1090 = **960 × 990 px** para todo lo que importa
- **Watermark `@darkroom` o `@pacamespain`**: dentro de zona segura, esquina superior-derecha (x≈900-1020, y≈110-150)
- **Counter de página** (`C1·01/05`): dentro de zona segura, esquina inferior-izquierda (x≈80-280, y≈1050-1080)

### Constantes para composers

```js
const POST = {
  W: 1080,
  H: 1350,
  TOP_UNSAFE: 100,    // solo background
  BOT_UNSAFE: 260,    // solo background
  MARGIN_X: 60,
  // Zona segura calculada
  SAFE_X: 60,
  SAFE_Y: 100,
  SAFE_W: 960,        // 1080 - 60*2
  SAFE_H: 990,        // 1350 - 100 - 260
};
```

---

## Story · 1080×1920 (9:16)

```
                      1080 px ancho
            ┌─────────────────────────────────────┐  0
            │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
            │░ progress bar · nombre · X cerrar ░░│
            │░░░░░░ TOP UNSAFE 250px ░░░░░░░░░░░░░│  ← IG pone aquí
            │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
            ├─────────────────────────────────────┤  250
            │ ░                                 ░ │
            │ ░                                 ░ │
            │ ░                                 ░ │  80px
            │ ░    ZONA SEGURA STORY            ░ │  margen
            │ ░                                 ░ │  L y R
1920 px alto│ ░       920 × 1420 px crítica     ░ │
            │ ░                                 ░ │
            │ ░                                 ░ │
            │ ░                                 ░ │
            │ ░                                 ░ │
            ├─────────────────────────────────────┤  1670
            │░░░░░░ BOTTOM UNSAFE 250px ░░░░░░░░░░│
            │░ "Enviar mensaje" input ↗ share    ░│  ← IG pone aquí
            │░ "Ver más" si hay link sticker     ░│
            └─────────────────────────────────────┘  1920
```

### Reglas duras

- **TOP UNSAFE**: 0-250 px → background, sticker NUNCA aquí
- **BOTTOM UNSAFE**: 1670-1920 px → idem
- **LEFT/RIGHT MARGIN**: 80 px cada lado
- **ZONA SEGURA**: x=80-1000, y=250-1670 = **920 × 1420 px**
- **CTA "swipe up" o "link en bio"**: aún dentro de safe area (no en bottom unsafe)
- **Sticker enlace** (cuando se use): centro-bottom de la zona segura, NO en el bottom unsafe

### Constantes para composers

```js
const STORY = {
  W: 1080,
  H: 1920,
  TOP_UNSAFE: 250,
  BOT_UNSAFE: 250,
  MARGIN_X: 80,
  SAFE_X: 80,
  SAFE_Y: 250,
  SAFE_W: 920,
  SAFE_H: 1420,
};
```

---

## Reel / TikTok · 1080×1920 (9:16)

Mismo que Story para el video pero con dos consideraciones extras:

- **Caption + hashtags**: bottom 350px puede taparlos parcialmente (más generoso que Story)
- **Cover image**: el frame que aparece en el feed grid de tu perfil → debe respetar safe area de POST 4:5 cuando se comprime al cuadro del perfil (1080×1350 visible al cuadrado)
- **Audio waveform**: a veces IG superpone visualizador de audio si elige autoplay con sonido · zona variable, no garantizada

### Recomendación reels

```js
const REEL = {
  W: 1080,
  H: 1920,
  TOP_UNSAFE: 280,    // un poco más que story
  BOT_UNSAFE: 380,    // caption + hashtags + audio info
  MARGIN_X: 80,
};
```

---

## LinkedIn Feed · 1200×1500 (4:5) o 1200×627 (1.91:1)

Más permisivo que Instagram (sin botones flotantes sobre el contenido), pero mantenemos margen profesional:

- **TOP MARGIN**: 60 px
- **BOTTOM MARGIN**: 60 px
- **SIDE MARGIN**: 80 px

---

## Validación automática (composers)

Cada función `textPath()` o subject coordinate **debe verificar**:

```js
function checkSafeArea(format, x, y, textWidth, textHeight) {
  const F = format === 'post' ? POST : STORY;
  const violations = [];
  if (y < F.SAFE_Y) violations.push(`text top y=${y} < SAFE_Y=${F.SAFE_Y}`);
  if (y + textHeight > F.SAFE_Y + F.SAFE_H) violations.push(`text bottom y=${y+textHeight} exceeds SAFE_H`);
  if (x < F.SAFE_X) violations.push(`text left x=${x} < SAFE_X`);
  if (x + textWidth > F.SAFE_X + F.SAFE_W) violations.push(`text right x=${x+textWidth} exceeds SAFE_W`);
  if (violations.length) {
    console.warn(`⚠️ SAFE AREA: ${violations.join(' · ')}`);
  }
}
```

Si una pieza tiene warnings → revisar manualmente antes de publicar.

---

## Reglas para prompts gpt-image-2

Cada prompt de imagen IA con texto debe incluir esta cláusula EXPLÍCITA:

```
LAYOUT (Instagram safe areas · MANDATORY):
- Top 100px (post) or 250px (story) reserved for IG UI overlay · NO text or critical subject in this zone
- Bottom 260px (post) or 250px (story) reserved for IG UI overlay · NO text or critical subject in this zone
- Side margins: 60px (post) or 80px (story) on left and right · NO text touching edges
- Typography zone: x=60 to x=1020 (post) · y=100 to y=1090 (post)
- All text and important visual subjects MUST stay within the typography zone
- Watermark may appear in top-right corner of safe area only, never in unsafe zones
```

Esto garantiza que gpt-image-2 sitúe texto y subject DENTRO de los límites seguros, no tocando bordes que IG va a tapar.

---

## Cómo verificar manualmente antes de publicar

1. Abre la imagen en VS Code Read tool o app de imagen
2. Mide visualmente: ¿texto crítico está al menos 100px del borde superior y 260px del inferior (post)?
3. Cualquier botón IG debería caer SOBRE background, no sobre texto
4. Si dudas, usa la app IG en modo edición (vista previa antes de publicar) → arrastra los iconos imaginarios del UI sobre la imagen y verifica

---

**Última actualización**: 2026-04-26 · **Maintainer**: Pablo / agente PULSE
