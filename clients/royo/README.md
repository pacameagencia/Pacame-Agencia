# Cliente: Joyería Royo

## Identidad
- **Nombre comercial:** Joyería Royo
- **Capa:** 2 (cliente B2B externo)
- **Industria:** Retail joyería (relojería + joyería + óptica)
- **Localización:** Albacete, España
- **Web cliente:** joyeriaroyo.com
- **Plataforma:** WordPress + Elementor + WooCommerce + Tema Ecomus

## Contactos
- **Decisor:** ver vault `PacameCueva/02-Clientes/royo/contactos.md`.
- **Canal preferente:** WhatsApp.

## Accesos (referencia)
- **Hosting:** Hostinger (gestión vía API key — `reference_apis_pacame`).
- **WP-admin:** credenciales en vault Obsidian.
- **DB:** acceso vía plugin MU PACAME (no directo).
- **WooCommerce:** vía REST API con keys en vault.

## Scope contratado
- Mantenimiento web mensual (primer cliente que estrena el servicio PACAME).
- Optimización catálogo (alts, descripciones, enrichment).
- Soporte ad-hoc por petición.

## Estado (a 2026-05-07)
- **Estado:** activo.
- **Última intervención:** 2026-05-07 (Sprint 2A + 2B + Estética + Sprint 2C parcial Tissot).
- **Sprint actual:** Sprint 1A/B/D bloqueado (necesita aprobación pages Elementor), Sprint 2C continúa con Longines + Casio + Tissot legacy en próxima sesión, Sprint 3-4 sin empezar.
- **Producción confirmada:** 974 alts arreglados + 589 productos enriquecidos (atributos+SEO) + 287 nombres limpiados + 50 Tissot con foto packshot oficial.

## Stack del cliente
- WordPress 6.x
- Elementor (page builder)
- WooCommerce (catálogo + checkout)
- Tema Ecomus (custom)
- Plugin MU PACAME (`mu-plugins/pacame-support.php`) para soporte sin tocar wp-admin.

## Servicios PACAME activos
- [x] Mantenimiento web mensual
- [x] Optimización catálogo (alts, descripciones, enrichment Tissot)
- [x] Plugin MU para soporte remoto
- [ ] SEO programático (roadmap Sprint 3)
- [ ] Ads Google Shopping (roadmap Sprint 4)

## Sprints completados

| Sprint | Fecha | Resumen | Commit |
|--------|-------|---------|--------|
| 1C | 2026-04-29 | Bulk fix 974 alts vacíos (98.7% → 0%) | (en `history/`) |
| Tissot enrich | 2026-04-30 | 39/100 productos enriquecidos prod | `1a61992` |
| 2A global | 2026-05-07 | Enrichment determinista 589/602 productos (atributos Woo + Yoast SEO + HTML Tissot reescrito en 7) · 0€ | (esta PR) |
| 2B nombres | 2026-05-07 | 287 relojes con SKU recortado del nombre (joyería intacta, match exacto SKU oficial) · 0€ | (esta PR) |
| Estética v2 | 2026-05-07 | CSS luxury cargado vía MU + sección 16 (precio duplicado, cards demo, galería, sticky ATC) | (esta PR) |
| 2C Tissot parcial | 2026-05-07 | 50/107 packshots oficiales Tissot (47% cobertura) · scraper tissotwatches.com → upload-from-url → featured-image | (esta PR) |
| **Fix carrito + traducciones** | 2026-05-07 (tarde) | Despublicado ecomus_builder que secuestraba render + cart regenerado en Gutenberg + filtro gettext+ob | (esta PR) |

Ver `history/` para detalle.

## Scripts en este cliente

```
clients/royo/scripts/
├── enrich-all-products.mjs       # Sprint 2A: batch enrichment determinista (atributos+SEO+HTML)
├── enrich-tissot-products.mjs    # Enrichment específico marca Tissot (Sprint Tissot 2026-04-30)
├── fix-image-alts.mjs            # Sprint 1C: bulk fix alts vacíos
├── clean-product-names.mjs       # Sprint 2B: recortar SKU del nombre (match exacto)
├── replace-tissot-images.mjs     # Sprint 2C: scraping packshots oficiales Tissot
├── rebuild-cart-page.mjs         # Reset /carrito/ a Gutenberg + trust grid
├── fix-cart-and-translate.mjs    # Bootstrap fix integral 2026-05-07 tarde
└── css-custom-luxury.css         # Estética v2: paleta + tipografía + fixes single product

clients/royo/mu-plugins/
└── pacame-royo-translate.php     # Filtro gettext + output buffer ES (debe permanecer activo)
```

Todos leen credenciales de env vars o `.env.local` raíz PACAME. Ver `runbook.md` para uso.

### Plugin MU PACAME — endpoints usados
- `/pacame/v1/css/set` · `/cache/clear` · `/media/upload-from-url` · `/products/{id}/featured-image`.
- Auth: Basic (`ROYO_WP_USER` + `ROYO_WP_APP_PASS`) + HMAC `X-PACAME-Signature` (`ROYO_PACAME_SECRET`, definido en `wp-config.php` como `PACAME_WEBHOOK_SECRET`).

## Drafts de contenido

```
clients/royo/docs/
├── 01-sobre-nosotros.md
├── 02-contacto.md
└── 03-marcas.md
```

CSS custom luxury en `clients/royo/scripts/css-custom-luxury.css` (cargar vía Elementor custom CSS).

## Assets visuales

```
clients/royo/assets/
├── royo-prx-12091-DESPUES.jpeg          # before/after enrichment producto
└── royo-tissot-gentleman-DESPUES.jpeg   # before/after Tissot
```

## Vínculos
- **Memoria Claude:** `MEMORY.md` → `project_joyeria_royo.md`.
- **Vault Obsidian:** `PacameCueva/02-Clientes/royo/`.
- **Plugin MU:** ver memoria `project_client_support_layer.md` (PR #72).
- **Tabla cifrada:** `client_websites` en Supabase (PR #71).
