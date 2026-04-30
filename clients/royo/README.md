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

## Estado (a 2026-04-30)
- **Estado:** activo.
- **Última intervención:** 2026-04-29 (Sprint 1C — bulk fix 974 alts vacíos, 98.7% → 0%).
- **Sprint actual:** 1A/B/D pendiente + Sprint 2-4 roadmap.
- **Producción confirmada:** 39/100 productos Tissot enriquecidos en PROD (commit 1a61992).

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

Ver `history/` para detalle.

## Scripts en este cliente

```
clients/royo/scripts/
├── enrich-all-products.mjs       # batch enrichment WooCommerce
├── enrich-tissot-products.mjs    # enrichment específico marca Tissot
└── fix-image-alts.mjs            # bulk fix alts vacíos
```

Todos leen credenciales de `.env.local` raíz PACAME. Ver `runbook.md` para uso.

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
