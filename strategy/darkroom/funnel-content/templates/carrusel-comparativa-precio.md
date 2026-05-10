# Template Carrusel · Comparativa Precio Stack (50% del feed · prioridad 1)

> Formato: Carrusel 7 slides · 1080×1350 4:5 · CINEMATIC tier · style anchor canónico Dark Room
> Coste producción: ~$0.84 (Soul V2 + Nano Banana Pro)
> Frequencia: 1-2 veces/semana con variants (cada vez una herramienta diferente como ancla)

---

## Slide 1 · HOOK (avatar creature IA mascot · curious pose)

**Visual**: avatar creature mira hacia el viewer · 3er ojo glow intenso · fondo negro mate `#0A0A0A` · luz acid green key.

**Texto overlay (Anton ALL CAPS centrado superior)**:
```
EL STACK QUE USAS TE
ASFIXIA MÁS QUE EL
ALQUILER.
```

**Subtexto (Space Grotesk Medium · inferior derecha)**:
```
mira el desglose →
```

---

## Slide 2 · DESGLOSE BRUTAL (números reales · 6 herramientas)

**Visual**: layout grid 2×3 con logos pixelados/abstraídos (no reales para evitar IP · usar iconos genéricos color blanco) + precios con tipografía Anton numérica gigante acid green.

**Texto centrado**:
```
ADOBE CREATIVE CLOUD     60€/MES
FIGMA PRO                15€/MES
CANVA PRO                12€/MES
CHATGPT PLUS             20€/MES
MIDJOURNEY               30€/MES
CINEMA 4D                95€/MES
───────────────────────────────────
TOTAL                   232€/MES
```

**Footer (JetBrains Mono small · esquina inferior)**:
```
sí, son los precios reales · sí, está validado · 2026.
```

---

## Slide 3 · AGRAVANTE (anualizado)

**Visual**: misma estética dark · pero centrado un solo número GIGANTE acid green pulsante.

**Texto centrado (Anton ALL CAPS · 200pt)**:
```
2.784 €
```

**Subtexto (Space Grotesk · debajo)**:
```
lo que te cuesta tu stack creativo al año.
antes de generar un solo euro.
```

---

## Slide 4 · DARK ROOM SOLUTION

**Visual**: avatar creature posicionado al lado del precio · pose "calm presenting" · 3er ojo glow

**Texto centrado**:
```
DARK ROOM

29 €/MES
```

**Subtexto**:
```
membresía colectiva.
mismo stack premium.
una fracción del precio.
```

---

## Slide 5 · LA RESTA (ahorro visible)

**Visual**: layout simple · operación matemática gigante centrada · acid green

**Texto centrado (Anton numérico)**:
```
232 € − 29 € = 203 €

cada mes en tu bolsillo.

2.436 € al año.
```

**Footer**:
```
suficiente para una cámara nueva.
o un viaje sin culpa.
o seis meses de aire para vivir.
```

---

## Slide 6 · CÓMO FUNCIONA (objection handling pre-compra)

**Visual**: avatar creature pointing hacia 3 puntos numerados · pose explicadora

**Texto (3 bullets cortos)**:
```
1. Pagas 29€/mes a Dark Room.

2. Te damos acceso al stack premium completo
   bajo modelo legal de membresía colectiva.

3. Tu única regla: usarlo tú · no compartirlo.

sin tarjeta para empezar · 14 días gratis · cancelas cuando quieras.
```

---

## Slide 7 · CTA (avatar creature · pose pointing al CTA)

**Visual**: avatar creature en posición central pointing a CTA · fondo black puro · acid green texto gigante.

**Texto centrado (Anton ALL CAPS)**:
```
EMPIEZA 14 DÍAS GRATIS.

DARKROOMCREATIVE.CLOUD
```

**Subtexto small (JetBrains Mono)**:
```
sin tarjeta · sin auto-renovación · sin asfixia.
```

**Hashtag overlay esquina inferior izquierda**:
```
#DarkRoom
#darkroomcreative
```

---

## Caption IG completa

```
El stack premium que necesitas para vivir del diseño cuesta 232€ al mes.
Hagamos la cuenta sin emojis ni humo:

→ Adobe Creative Cloud → 60€
→ Figma Pro → 15€
→ Canva Pro → 12€
→ ChatGPT Plus → 20€
→ Midjourney → 30€
→ Cinema 4D → 95€

2.784€ al año antes de facturar tu primer cliente.

Dark Room te da el mismo stack por 29€/mes mediante membresía colectiva legalmente posicionada. Mismas tools, una fracción del precio.

Te ahorras 2.436€/año reales. Esa cifra es tu margen, tu ahorro, tu cámara nueva, tus seis meses de aire.

Empieza 14 días gratis sin tarjeta en darkroomcreative.cloud.

Cancelas cuando quieras. Sin renovación automática silenciosa. Sin asfixia.

Comenta STACK si quieres la comparativa detallada de los 12 tools que incluimos.
Comenta AHORRO si quieres que te calcule tu ahorro personalizado anual.

#DarkRoom #darkroomcreative #freelance #diseñadores #creators #stack #adobealternative
```

---

## Variants reusables (mismo template · diferente ancla)

Una vez funcione este carrusel, generar 3 variants cambiando la herramienta-ancla:

- **Variant Adobe-focus**: empieza el slide 2 con Adobe 60€ destacado · ataca ese pain point específico
- **Variant Figma-focus**: empieza con Figma Pro 15€ · "y eso solo para diseñar UI, no para todo lo demás"
- **Variant Midjourney-focus**: empieza con Midjourney 30€ · "y eso solo para generar imágenes, no para editarlas"

Cada variant tiene el mismo skeleton pero pivota el dolor en una herramienta distinta. Multiplica el contenido por 3 sin reinventar.

---

## Generación técnica

**Modelo recomendado**: Nano Banana Pro 2K para slides con avatar (1, 4, 6, 7) · 4 generations × 2 cr = 8 cr.
**Slides texto/data** (2, 3, 5): Figma o Canva manual con tipografía Anton + paleta brand. Cero generación IA (es más limpio editar manualmente).

**Coste total estimado**: 8 cr Higgsfield ≈ $0.39 + 30 min Figma manual.

**Validación pre-publish**:
1. `node tools/dark-frames/validate-concept.mjs` sobre concept JSON del carrusel
2. visual-reviewer subagent → debe aprobar consistency avatar cross-slide
3. quality-reviewer subagent → debe aprobar copy sin anti-patrones (palabras IA prohibidas, CTAs agresivos, etc)

---

## Maintenance

- Update precios cada Q (Adobe sube precios · Figma cambia tiers · update numbers reales)
- Update avatar mascot pose si Pablo entrena Soul Character oficial en Phase B futura
- Si engagement <2% saves rate · pivotar el ángulo de la comparativa (no la idea · el pitch concreto)
