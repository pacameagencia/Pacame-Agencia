# PACAME Games — Unity WebGL Integration Guide

Guia completa para exportar un proyecto Unity y subirlo como game jugable en
`pacameagencia.com/games/[slug]`.

## 1. Export desde Unity (Build Settings WebGL)

Editor Unity → `File > Build Settings`:

1. Selecciona la plataforma **WebGL** y pulsa **Switch Platform**.
2. Pulsa **Player Settings**:
   - **Resolution and Presentation**
     - Default Canvas Width/Height: 1920x1080 (o lo que aplique segun aspect_ratio)
     - Run in Background: true
   - **Publishing Settings**
     - Compression Format: **Gzip** (recomendado) o **Brotli** (menor tamaño pero requiere Cloudflare/Nginx con Brotli)
     - Decompression Fallback: **true** (safety net para navegadores sin el header correcto)
     - Enable Exceptions: **Explicitly Thrown Exceptions Only** (mejor performance)
     - Data Caching: **true**
   - **Other Settings**
     - Managed Stripping Level: **High** (reduce bundle size)
     - Scripting Backend: **IL2CPP**
     - Api Compatibility Level: **.NET Standard 2.1**
3. Pulsa **Build** y elige una carpeta de output (ej. `web-build/`).

Unity genera estos archivos en `web-build/Build/`:
- `{product}.loader.js` — bootstrapper
- `{product}.data` (o `.data.gz`) — asset bundle
- `{product}.framework.js` (o `.framework.js.gz`) — runtime
- `{product}.wasm` (o `.wasm.gz`) — codigo compilado

Ademas un `index.html` y `TemplateData/` (no los necesitamos — usamos nuestro UnityLoader).

## 2. Subir al Supabase Storage

Bucket: `unity-games/` (ya configurado).

1. Via Supabase Dashboard: **Storage → unity-games**
2. Crea una carpeta con el slug de tu game: `unity-games/{slug}/`
3. Sube los 4 archivos (`.loader.js`, `.data[.gz]`, `.framework.js[.gz]`, `.wasm[.gz]`)
4. Configura **Content-Type** manualmente si es necesario:
   - `.loader.js` → `application/javascript`
   - `.data` → `application/octet-stream`
   - `.framework.js` → `application/javascript`
   - `.wasm` → `application/wasm`
   - Si estan gzipeados (`.gz`): añade header `Content-Encoding: gzip`

**Importante**: los archivos deben ser publicos (lectura anonima) para que el
navegador del usuario los descargue.

## 3. Registrar en PACAME

Dashboard → **Games → Subir nuevo build**:

1. Rellena **slug** (mismo que usaste en la carpeta de Storage), **titulo**,
   **descripcion**, **engine: Unity WebGL**, **aspect_ratio** (16:9 recomendado).
2. Pulsa **Crear entrada catalogo** — queda como `is_active=false` hasta que subas URLs.
3. Vuelve al listado y edita el game via API o SQL para rellenar:
   - `loader_url` = URL publica de `{slug}.loader.js`
   - `data_url` = URL publica de `{slug}.data`
   - `framework_url` = URL publica de `{slug}.framework.js`
   - `wasm_url` = URL publica de `{slug}.wasm`
4. Toggle `is_active` a true en la tabla de admin. El game aparece en `/games`.

## 4. Testing

Visita `pacameagencia.com/games/{slug}` en Chrome / Firefox / Safari / Edge.
Checklist:
- [ ] Loading bar real se actualiza durante download (no se queda en 0% ni salta a 100%)
- [ ] Canvas renderiza sin artifactos
- [ ] Keyboard + mouse funcionan dentro del canvas
- [ ] Fullscreen via F11 (o boton de Unity si lo expones)
- [ ] Resize del navegador: canvas mantiene aspect ratio
- [ ] Cerrar pestaña durante carga: no lanza errores en consola
- [ ] Consola browser sin warnings de CORS, compression, o mime types

## 5. Troubleshooting

**"Failed to load .wasm"**
- Asegura que `Content-Type: application/wasm` esta en los headers
- Supabase Storage a veces pone `application/octet-stream` → overridealo

**"Unable to parse Build/xxx.framework.js.gz!"**
- Si usaste Gzip compression: el header `Content-Encoding: gzip` DEBE estar
- Alternativa: export con Compression Format: Disabled (mas grande pero sin headers)

**"Out of memory"**
- En `games_catalog.memory_size_mb` bump a 512 o 1024
- Unity Player Settings → Memory Size: aumenta tambien alla

**"UnityLoader.js is not a function"**
- El file loader.js es diferente por Unity version. Re-exporta con mismo Unity
  Editor version que tu codigo.

**iOS Safari: audio no suena hasta gesto del usuario**
- Normal. Unity WebGL requiere user interaction para unlock WebAudio.

**Bundle demasiado grande (>50MB)**
- Managed Stripping Level: High
- Texture compression: ASTC en Player Settings
- Disable unused modules (Physics 2D, Cinemachine, etc.)
- Target: <30MB gzipped para buena UX mobile

## 6. Roadmap de engines alternativos

- **Three.js** — experiencias 3D ligeras, puro JS, integra nativo con React Three Fiber
  (ya tenemos instalado). Bundle tipico <500KB.
- **Phaser 3** — games 2D arcade, tilemaps, puzzles. Bundle ~200KB.
- **HTML5 Canvas** — puro JS sin framework, demo minimal 10KB.

Todos siguen el mismo pattern: `engine` en `games_catalog` + componente
custom renderer en `components/games/`. Si pides uno, el ui-designer + 3d-artist
agents de PACAME pueden ayudar.

## 7. Analytics de play

El field `play_count` en `games_catalog` se puede incrementar via endpoint futuro
`/api/public/games/{slug}/play` — llamado desde el client al `onReady` del UnityLoader.
Por ahora queda placeholder (manual bump).

---

**Links utiles:**
- Unity WebGL docs: https://docs.unity3d.com/Manual/webgl-building.html
- Bundle size analyzer: https://webpack.github.io/analyse/
- Supabase Storage: https://supabase.com/dashboard/project/kfmnllpscheodgxnutkw/storage/buckets
