# Dirección de arte — Grupo M-LÍA

> Deriva de [`brand.md`](brand.md). Gobierna: prompts Higgsfield, sistema de
> diseño de las páginas premium, criterios de `visual-reviewer`. Estética:
> **grupo hostelero serio, contemporáneo, negro + dorado, cálido, real**.
> NO: stock genérico, saturado, "AI obvio", rústico castellano, frío nórdico.

## 1. Sistema de diseño (páginas premium PACAME)

Tokens (CSS embebido autocontenido en cada página, sin dependencia externa):

```
--mlia-black:#000000  --mlia-surface:#0E0E0E  --mlia-surface-2:#181818
--mlia-gold:#D1A932   --mlia-gold-soft:#E8C766  --mlia-gold-deep:#8C7020
--mlia-white:#FFFFFF   --mlia-text:#F2EFE8      --mlia-text-dim:#9A9A9A
font-display: "Blantick Script" (hero/título de espacio · @font-face self-host)
font-body:    "Montserrat", system fallback (todo lo demás · pesos 300/400/600/700)
```

Patrones: fondo negro dominante, secciones full-width, foto a sangre con
overlay negro 30-55 %, filete/keyline dorado 1 px, titulares Blantick grandes,
texto Montserrat amplio interlineado, CTA dorado sólido (texto negro) +
secundario outline dorado. Mobile-first (probar 375 px). Lighthouse ≥90:
imágenes `loading="lazy"` salvo hero (`eager`+preload), `width/height`, WebP.
Accesibilidad AA: contraste dorado sobre negro OK; texto blanco/crema sobre foto
siempre con overlay.

## 2. Fotografía real primero, Higgsfield rellena huecos

1. **Prioridad:** fotos reales del cliente (eventos 31, Cielo 8, carta).
   Selección, recorte, corrección de color cálida coherente.
2. **Higgsfield** solo para: hero atmosféricos, huecos sin foto buena, texturas
   de sección, ambientación (no falsear espacios que no existen). Coste imagen
   bajo, sin doble aprobación (regla dura solo aplica a vídeo).

## 3. Recetas Higgsfield por espacio (skill `higgsfield-generate` — Capa 1)

Modelo por defecto **`gpt_image_2`** (interiores realistas). **`soul_cinema`**
para hero dramáticos (bodas, El Cielo, Terraza noche). Aspect `16:9` web /
`4:5` social / `9:16` stories. Sufijo común de estilo en todos los prompts:

> `…, contemporary upscale Spanish hospitality, deep black interior with warm
> golden #D1A932 accent lighting, elegant not flashy, real candid atmosphere,
> editorial photography, 35mm, shallow depth of field, natural warm white
> balance, high-end, no text, no logos, no watermark`

| Pieza | Prompt núcleo | Modelo |
|---|---|---|
| Hero **El Cielo de M-LÍA** | "elegant celebration venue with dramatic illuminated ceiling as focal point, long banquet tables set for a wedding, golden ambient light, intimate sophisticated" | soul_cinema |
| Hero **Bodas** | "luxury wedding banquet hall, beautifully set round tables, floral centerpieces, warm golden chandeliers, guests softly blurred, emotional refined" | soul_cinema |
| **Comuniones** | "bright elegant celebration room set for a family communion lunch, tasteful decor, daylight + warm accents, joyful but refined, Spanish venue" | gpt_image_2 |
| **Eventos empresa** | "corporate gala dinner setup, sleek black and gold table styling, stage lighting, professional networking ambiance" | gpt_image_2 |
| Hero **Terraza M-LÍA (DJs)** | "rooftop terrace at night, DJ booth with subtle golden stage light, crowd silhouettes dancing, plants, modern elegant nightlife, summer Spain" | soul_cinema |
| **MANÍA** discoteca | "modern upscale nightclub interior, black and gold, dramatic moody lighting, DJ stage, dance floor energy, sophisticated" | soul_cinema |
| **Restaurante** | "contemporary Mediterranean restaurant dining room, set tables white linen, warm golden lighting, plants, diners softly blurred" | gpt_image_2 |
| Platos carta | usar **`higgsfield-product-photoshoot`** modo lifestyle_scene: "Mediterranean signature dish, dark slate, warm side light, fine dining plating" | product-photoshoot |
| Textura/sección | "abstract dark luxury background, subtle gold bokeh, soft black gradient, premium hospitality texture" | gpt_image_2 |

## 4. Quality gate visual (obligatorio, 3 capas)

1. **Capa 1:** invocar skill `higgsfield-generate` (o `higgsfield-product-photoshoot`).
2. **Capa 2 checklist:** paleta negro/dorado real (no random) · luz cálida ·
   gente natural · sin texto/logos/placeholder · sin "AI obvio" · ratio correcto
   · coherente con grupo hostelero serio.
3. **Capa 3:** subagente `visual-reviewer` → APROBADO obligatorio antes de subir
   a media o marcar página lista. Si BLOQUEA, iterar prompt.

## 5. Anti-patrones (bloquean en review)

Gradientes Tailwind random · morado/azul SaaS · stock con marca de agua ·
SVG placeholder · system-ui en branded · saturación excesiva · ambiente frío ·
fotos que inventan espacios inexistentes · texto IA en copy · logos generados.
