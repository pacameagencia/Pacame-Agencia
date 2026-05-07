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
- 2026-05-07: Sprint 2A global, enrichment determinista 589 productos (atributos + Yoast SEO + HTML Tissot reescrito en los que aplican). Coste 0€.
- 2026-05-07: Sprint 2B, limpieza de nombres con SKU pegado al final. 287 relojes renombrados (joyería intacta). Match exacto contra `sku` oficial = 0 falsos positivos. Coste 0€.
- 2026-05-07: Estética CSS luxury cargado vía `/pacame/v1/css/set` (no estaba en producción antes). Sección 16 añadida: fix precio duplicado en botón add-to-cart, ocultar cards demo `ecomus-icon-box-widget`, refinos galería y sticky ATC.
- 2026-05-07: Sprint 2C parcial, imágenes oficiales Tissot (~50 de 107, cobertura 47%). Pipeline: scraper tissotwatches.com/es-es/{SKU}.html → variantSku → packshot principal → upload-from-url → featured-image. Imágenes antiguas no se borran (rollback con UpdraftPlus o reasignación destacada manual). Resto Tissot legacy + Longines + Casio pendiente otra sesión.
- 2026-05-07 (tarde): **Bug crítico carrito + checkout solucionado.** El tema Ecomus tenía 4 `ecomus_builder` (post_type custom) en estado `publish` que secuestraban el render del cart/checkout/archive/single product. Despublicados (status=draft) los 4 IDs: 10399 (Cart Page), 10400 (Checkout Page), 11096 (PRODUCT ARCHIVE), 11237 (SINGLE PRODUCT). Tres opciones globales `ecomus_*_builder_enable` puestas a "0". Página /carrito/ regenerada en Gutenberg con shortcode puro + trust grid 3 cards reales. Filtro de traducciones gettext + output buffer instalado como mu-plugin (`pacame-royo-translate.php`) — debe permanecer activo. Hallazgo seguridad: `PACAME_WEBHOOK_SECRET` añadido a wp-config.php (rotación recomendada).

## Bug Ecomus builder secuestra render — diagnóstico

Si carrito/checkout/single product/archive vuelve a mostrarse vacío o con "Cart Page Builder / It seems like you've turned on...":

1. Verificar `wp_posts` post_type='ecomus_builder' status='publish'. Ponerlos a draft.
2. Verificar `wp_options` `ecomus_*_builder_enable` valores. Deben ser "0" o vacíos.
3. Verificar `wp_options` `woocommerce_cart_page_id` apunta a la página correcta (10822 = `/carrito-compra-joyeria-royo/`).
