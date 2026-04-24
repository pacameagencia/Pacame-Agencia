# asset-library/

Biblioteca personal de assets descargados desde Freepik Premium API (licencia comercial activa).

## Qué es

Downloader masivo contra Freepik vía API oficial. Rellena `assets/<categoria>/` con archivos reales + `catalog/index.json` con metadata (id, título, tags, URL origen, licencia, fecha descarga).

Usa la `FREEPIK_API_KEY` que ya vive en `web/.env.local`.

## Cómo se usa

```bash
# 1. Editar lista de categorías y cantidades
code asset-library/categories.json

# 2. Preview (sin descargar nada, solo busca)
node asset-library/downloader.mjs --dry-run

# 3. Descarga real
node asset-library/downloader.mjs
```

El script:
- Busca en Freepik por `term` + filtros de cada categoría
- Llama al endpoint `/resources/{id}/download` para URL firmada
- Guarda el archivo en `assets/<slug>/<id>_<titulo>.<ext>`
- Registra metadata en `catalog/index.json`
- Es **idempotente**: si un `id` ya está en el catálogo lo salta, puedes relanzar sin duplicar
- Respeta rate limit (1.5 s entre requests)

## Estructura

```
asset-library/
├── categories.json        # config editable
├── downloader.mjs         # script
├── catalog/
│   └── index.json         # metadata de todo lo descargado
└── assets/
    ├── mockups-producto/
    ├── mockups-device/
    ├── logos-minimalist/
    └── ...
```

## Cuándo usar un asset para un cliente

Freepik Premium tiene licencia comercial amplia pero **guarda registro de uso**. Mejor práctica:

1. Coge el asset del catálogo local
2. Entrégalo al cliente
3. Anota en Supabase / CRM: `asset_id`, `client`, `project`, `delivered_at`

Así si hay disputa de licencia tienes trazabilidad.

## Escalar

Para más categorías: añade al `categories.json` y relanza. Los ya descargados se saltan. Tipos válidos de `content_type`: `photo`, `vector`, `illustration`, `psd`, `mockup`. `license`: `free` o `premium`.
