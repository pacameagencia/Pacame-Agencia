# Runbook técnico — Joyería Royo

> Cómo intervenir el WordPress de Royo sin romperlo. **Backup obligatorio** antes de cualquier escritura masiva (regla `feedback_backup_antes_de_tocar_prod_cliente`).

## Antes de tocar nada

1. **Verificar UpdraftPlus** activo y backup < 24h. Si no → forzar backup desde wp-admin > UpdraftPlus.
2. **Verificar plugin MU PACAME** instalado (`mu-plugins/pacame-support.php`). Permite operaciones sin entrar a wp-admin.
3. **Probar primero en 1 producto** antes de ejecutar batch sobre 593.

## Acceso

### Vía dashboard PACAME (preferente)
- URL: `pacameagencia.com/dashboard/clients/royo` (cuando esté wired).
- Permite: ver estado, lanzar scripts predefinidos, leer logs.

### Vía plugin MU PACAME
- Endpoint: `https://joyeriaroyo.com/wp-json/pacame/v1/...`
- Token Bearer en `.env.local` raíz: `ROYO_MU_TOKEN`.
- Operaciones: leer products, update meta, fix alts, ejecutar SQL parametrizado.

### Vía WooCommerce REST API
- Consumer key/secret en vault.
- Read-only por defecto. Write solo para enrichment.

### Vía Hostinger API (excepcional)
- Key en `reference_apis_pacame` (vault).
- Para reinicio servicio o backup forzado.

## Scripts disponibles

### `enrich-all-products.mjs`
**Qué hace:** itera todos los productos WooCommerce, llama LLM (Claude Sonnet 4.6 / DeepSeek según tier), genera descripción + meta SEO, escribe vía REST API.
**Lee de:** WooCommerce REST `GET /products` (paginado).
**Escribe en:** WooCommerce REST `PUT /products/<id>` (description, meta).
**Reversible:** sí (script guarda diff antes de write en `history/<fecha>-enrichment.jsonl`).
**Coste estimado:** ~0.30€ por 100 productos (Sonnet 4.6).
**Comando:**
```bash
node clients/royo/scripts/enrich-all-products.mjs --dry-run     # primero
node clients/royo/scripts/enrich-all-products.mjs --batch=20    # producción
```

### `enrich-tissot-products.mjs`
**Qué hace:** versión específica para productos marca Tissot (filtro por categoría/etiqueta).
**Estado actual:** 39/100 ejecutados en producción (commit `1a61992`).
**Comando:**
```bash
node clients/royo/scripts/enrich-tissot-products.mjs --batch=10
```

### `fix-image-alts.mjs`
**Qué hace:** rellena el atributo `alt` de imágenes producto vacías usando título + marca + categoría.
**Estado:** ejecutado 2026-04-29, 974 alts arreglados (98.7% → 0%).
**Reversible:** sí (jsonl de diff).
**Comando:**
```bash
node clients/royo/scripts/fix-image-alts.mjs --dry-run
node clients/royo/scripts/fix-image-alts.mjs --apply
```

## Recuperación / rollback

- **Backup full WP** vía UpdraftPlus → "Restore" en wp-admin.
- **Rollback enrichment** → `node clients/royo/scripts/<script>.mjs --rollback --from=history/<fecha>.jsonl`.
- **Restart hosting** (último recurso) → Hostinger API: `POST /websites/<id>/restart`.

## Anti-patrones

- ❌ No editar productos manualmente desde wp-admin si hay script disponible (registro disperso).
- ❌ No ejecutar enrichment en horario comercial (10:00–20:00 ES) sin avisar — la web se ralentiza.
- ❌ No tocar plugin Elementor sin backup (rompe layouts si la versión cambia).
- ❌ No mezclar paletas / branding PACAME con branding Royo (su CSS custom luxury vive en `scripts/css-custom-luxury.css`).

## Log de cambios estructurales
- 2026-04-29: instalación plugin MU PACAME, fix bulk alts.
- 2026-04-30: enrichment Tissot 39/100 productos.
