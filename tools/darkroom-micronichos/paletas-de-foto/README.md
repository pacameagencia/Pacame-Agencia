# Paletas desde foto · DarkRoom micronicho #1

Tool gratis que extrae 8 colores dominantes de una imagen, todo client-side. URL destino: `paletas.darkroomcreative.cloud`.

---

## Qué hace

- Drag & drop de imagen (jpg/png/webp), pegado desde portapapeles, o file picker.
- Extracción de **8 colores dominantes** con **k-means++** sobre 20.000 píxeles muestreados.
- Vista de paleta con click-para-copiar hex.
- Export a **hex list / CSS variables / Tailwind config / JSON**.
- Procesado **100% en navegador** — la imagen nunca toca un servidor.
- Cero registro, cero cookies de tracking, cero dependencias npm.

---

## Stack

| Pieza | Implementación |
|---|---|
| HTML | Vanilla, server-renderable directamente. |
| CSS | Custom, dark mode minimalista voz DarkRoom. |
| JS | Vanilla. K-means++ implementado a mano (~70 líneas). Sin librerías externas. |
| Build | Ninguno. Es estático puro. |
| Hosting | Vercel / Cloudflare Pages / cualquier estático. |
| DNS | Subdominio de `darkroomcreative.cloud` apuntando al provider. |

---

## Estructura

```
paletas-de-foto/
├── index.html       # UI + meta tags SEO + schema.org
├── styles.css       # Paleta DarkRoom (dark, acento #E11D48)
├── app.js           # Drop, k-means, export
├── vercel.json      # Headers de seguridad + cache + cleanUrls
└── README.md        # Este archivo
```

Total: ~5 archivos, ~30 KB sin gzip.

---

## Cómo desplegar

### Opción A — Vercel CLI (recomendado)

```bash
cd tools/darkroom-micronichos/paletas-de-foto
vercel link --project paletas-darkroom --yes
vercel --prod
```

Después en el dashboard Vercel (team `Dark Room IO`):
1. Settings → Domains → añadir `paletas.darkroomcreative.cloud`.
2. Apuntar el subdominio en Hostinger DNS al CNAME que Vercel indica.
3. Esperar SSL automático (<60s).

### Opción B — Cloudflare Pages

1. Conectar repo en Cloudflare Pages.
2. Build command: vacío. Output directory: `tools/darkroom-micronichos/paletas-de-foto`.
3. Custom domain: `paletas.darkroomcreative.cloud`.

### Opción C — drag-drop manual

Cualquier estático: Netlify drop, Surge, GitHub Pages. La carpeta `paletas-de-foto/` se sirve tal cual.

---

## Test local

```bash
cd tools/darkroom-micronichos/paletas-de-foto
# Cualquier servidor estático
python3 -m http.server 8080
# o
npx http-server . -p 8080 -c-1
```

Abre `http://localhost:8080`. No hace falta build, hot reload, ni `npm install`.

Tests manuales mínimos:
- [ ] Drag & drop de jpg → muestra 8 swatches en <2s.
- [ ] Click en swatch → copia hex y muestra toast.
- [ ] Export hex / CSS / Tailwind / JSON → cada formato copia al portapapeles correctamente.
- [ ] Botón "otra foto" → resetea estado.
- [ ] Pegado con Ctrl+V de imagen → procesa igual.
- [ ] Imagen >10 MB → muestra error.
- [ ] Imagen no soportada → muestra error.

---

## Producción — pendiente antes de lanzar

- [ ] Generar `og.png` 1200×630 con headline + logo DarkRoom (usar `imagen` Gemini).
- [ ] Generar `favicon.ico` y `apple-touch-icon.png`.
- [ ] Añadir Plausible Analytics tracker (cuando se confirme la cuenta).
- [ ] Añadir email capture opcional bajo el botón "exportar" (NO antes de usar la tool — regla anti-dark-pattern).
- [ ] Backlinks SEO desde landing principal de DarkRoom y otros micronichos cuando existan.
- [ ] Schema markup adicional: BreadcrumbList si la URL pasa de `/` a otras secciones.

---

## Roadmap v2

- Sliders para ajustar K (4/6/8/12 colores).
- Modo "paleta armónica" (genera complementaria, triada, análoga desde una base extraída).
- Export adicional: Adobe `.ase`, Procreate `.swatches`, Sketch `.sketchpalette`.
- Botón "Abrir en Figma" via plugin scheme.
- Histórico de paletas en `localStorage` (cero PII).
- Modo color blind-friendly (verifica contraste WCAG entre los colores extraídos).

---

## Algoritmo k-means — notas técnicas

Implementación en `app.js`:

1. Reduce la imagen a máximo 400px lado mayor (suficiente para extracción dominante; bajada de ms drástica).
2. Sample uniforme de hasta **20.000 píxeles** (skipea transparentes con alpha < 128).
3. **K-means++**: inicialización ponderada por distancia al cuadrado (mejor estabilidad que random).
4. Iteraciones máximas: **24** (converge típicamente en 8-12).
5. Convergencia: para si ninguna asignación cambia entre iteraciones.
6. Ordena centroides por luminosidad (BT.601) ascendente — coherente con la voz visual oscura DarkRoom.

Tiempo medio en imagen 1920×1080: **<800 ms** en MacBook Air M1, **<2 s** en móvil mid-range.

---

## SEO target

Keywords primarias:
- "extractor paleta colores foto"
- "color picker imagen"
- "paleta hex desde imagen"
- "generar paleta tailwind"
- "extraer colores foto online"

Keywords secundarias:
- "paleta para figma"
- "tailwind config desde imagen"
- "css variables desde foto"

Meta title: `Paletas desde foto · extrae 8 colores en 2 segundos` (≤60 chars).
Meta description: 150 chars con keywords + diferencial (procesado local).

---

## Voz visual aplicada

- Fondo `#0A0A0A`, texto `#F5F5F0`.
- Acento principal: `#E11D48` (rojo señal).
- Tipografía: Space Grotesk (titulares) + Inter (body) + JetBrains Mono (hex codes).
- Cero gradientes azul-violeta tech-bro.
- Cero stock photo de creators.
- Cero emojis fuego.
- Microcopy directa, tutea siempre.
- CTA pie a DarkRoom: discreto, una línea.

Definido en [`strategy/darkroom/positioning.md`](../../../strategy/darkroom/positioning.md).

---

**Estado**: MVP listo para deploy. Próximo paso: subir a Vercel y validar primer mes de tráfico orgánico.
