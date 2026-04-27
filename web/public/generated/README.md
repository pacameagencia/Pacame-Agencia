# PACAME · Generated Assets

Esta carpeta contiene los **assets visuales** generados con **GPT Image 2 vía Atlas Cloud** para `pacameagencia.com`.

## Cómo regenerar (todos)

```bash
cd web
node scripts/generate-pacame-assets.mjs                  # generate all (skip existing)
node scripts/generate-pacame-assets.mjs --retry          # regenerate even if exists
node scripts/generate-pacame-assets.mjs --only=hero-poster,agents/nova
node scripts/generate-pacame-assets.mjs --category=service-icon
node scripts/generate-pacame-assets.mjs --dry-run        # preview without API calls
```

Coste promedio: **$0.032/imagen** (model `openai/gpt-image-2-developer`). Cascade fallback automático a Imagen 4 Ultra → Seedream → Flux Dev → Flux Schnell.

## Cómo optimizar (WebP + AVIF)

```bash
cd web
node scripts/optimize-images.mjs                          # optimize all PNGs
node scripts/optimize-images.mjs --slug=hero-poster      # one slug
node scripts/optimize-images.mjs --force                  # re-optimize even if WebP exists
```

Genera `optimized/<slug>-{640w,1024w,1536w}.{webp,avif}` para Next.js `<Image>` responsive.

## ⚠️ FOTO REAL DE PABLO PENDIENTE

El componente `AuthoritySection.tsx` muestra el avatar del fundador desde:
```
/public/generated/pablo-calleja.jpg
```

Esta foto **NO está generada por IA** (decisión del briefing). Pablo necesita subir manualmente:

1. **JPG profesional vertical 4:5** (recomendado 800×1000 px mínimo, calidad 85+).
2. **Estética Spanish Modernism**: luz natural lateral, paper-tone background, ropa indigo/terracota o neutra.
3. **Composición editorial estilo El País / Forbes**: encuadre cintura arriba o medio cuerpo, gaze cámara o ligeramente lateral.
4. **Sin filtros AI / sin photoshop pesado**.

Mientras no haya foto real, el componente devuelve un 404 silencioso en la imagen (Next.js Image fallback). Para evitar el espacio vacío, puedes:
- Subir cualquier foto temporal con el mismo nombre, o
- Comentar el bloque del avatar en `AuthoritySection.tsx` líneas 56-65.

## Lista de assets

Ver `web/scripts/asset-manifest.json` para los 63 prompts completos. Categorías:

| Categoría | Cantidad | Ejemplos |
|---|---|---|
| `hero` | 3 | hero-poster, hero-mobile, hero-cinematic-bg |
| `service-icon` | 8 | services/web, services/seo, services/social, ... |
| `agent-portrait` | 7 | agents/nova, agents/atlas, ... (fotorrealistas + disclaimer) |
| `sector-photo` | 8 | sectors/restaurant, sectors/hotel, ... |
| `case-mockup` | 6 | cases/case-1 a case-6 (Macbook+iPhone mockups) |
| `og-image` | 10 | og/home, og/servicios, ... (1 por página core) |
| `og-programmatic` | 9 | og/sector-*, og/ciudad-template |
| `custom-icon` | 8 | icons/check, icons/arrow, icons/star, ... |
| `pattern` | 4 | pattern/azulejo-1, pattern/sun-burst, ... |

## Disclaimer agentes IA

Los retratos `agents/{nova,atlas,nexus,pixel,core,pulse,sage}.png` son **personajes editoriales generados por IA**. NO representan personas reales. La página `/agentes` debe mostrar este disclaimer visible (Schema.org `Person` con `additionalType: "https://schema.org/AICharacter"` custom).

## Logos placeholder

`/public/logos/{associations,partners,press}/*.svg` son **placeholders SVG editoriales** (texto Fraunces sobre paper). Sustituir por logos oficiales cuando:
- Sequra confirme verificación → reemplazar `sequra.svg` con su SVG oficial
- ICEX, Cámara, Confebask, ENAC: idem
- Stripe Partner, Google Partner, Meta Business: descargar de sus brand kits oficiales
- Forbes, El País, Genbeta, M4E, Startup Pulse: cuando publiquen artículo

## Variables de entorno

```bash
ATLAS_API_KEY=...                                # Atlas Cloud GPT Image 2
PACAME_ADMIN_SECRET=...                          # Para /api/atlas/generate (rotable)
```

Ambas en `web/.env.local` y Vercel env (production + preview).
