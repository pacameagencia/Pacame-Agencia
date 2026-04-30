# Joyería Royo — Borradores y Tooling

Trabajo preparado para ejecutar en cuanto Pablo desbloquee con backup + application password. Cliente Royo ya creado en `clients` Supabase: `id=2c56ab18-5074-4bc7-b9d1-16c4a5a233cf`.

## Findings que justifican estos borradores

Audit completo del 2026-04-29:

| # | Severidad | Problema | Evidencia |
|---|---|---|---|
| 1 | 🔴 CRÍTICO | "Sobre Nosotros" con texto demo del tema Ecomus en INGLÉS | "We are Ecomus", "women's clothing store", "Robert Smith" |
| 2 | 🔴 CRÍTICO | "Contacto" con datos demo | "66 Mott St New York", mapa Tower of London, EComposer@example.com |
| 3 | 🔴 CRÍTICO | 961/974 imágenes sin alt (98.7%) | WC Store API audit |
| 4 | 🟠 ALTO | 467/593 productos con 1 sola imagen (78.8%) | WC Store API audit |
| 5 | 🟠 ALTO | 486/593 productos sin short_description (82%) | WC Store API audit |
| 6 | 🟠 ALTO | "/marcas/" vacía (solo H1) | GET wp/v2/pages/10804 |
| 7 | 🟠 ALTO | Blog vacío (0 posts) | sitemap.xml |
| 8 | 🟡 MEDIO | Atributos Woo casi inexistentes (24/593 = 4%) | WC Store API audit |
| 9 | 🟡 MEDIO | 24 productos sin SKU | WC Store API audit |
| 10 | 🟡 MEDIO | 4 productos con precio 0 | WC Store API audit |
| 11 | 🟡 MEDIO | Atributo duplicado "color" vs "Color" | WC Store API audit |

## Borradores incluidos

- **`01-sobre-nosotros.md`** — reescritura completa con storytelling de heritage 50+ años. Marca `[CONFIRMAR]` los datos que Pablo debe validar (año fundación, generaciones, equipo, certificaciones).
- **`02-contacto.md`** — datos correctos: Tesifonte Gallego 2 Albacete, +34 967 21 79 03, jroyo@joyeriaroyo.com. Marca `[CONFIRMAR]` horario real.
- **`03-marcas.md`** — landing real con 11 marcas top, counts reales del catálogo (Tissot 100, Seiko 76, Casio 58, Longines 34, etc.), CTA por marca a su categoría Woo. Pendiente añadir logos oficiales.

## Tooling incluido

- **`fix-image-alts.mjs`** — script Node que lee los 593 productos vía WC Store API, genera alt según patrón ("Reloj {marca} {modelo} {ref}" para relojes, nombre directo para joyas) y aplica vía `wp/v2/media/{id}`. Tiene flags `--dry-run` (default), `--apply`, `--limit=N`, `--product=ID`, `--pause-ms=N`.

## Bloqueos para ejecutar (lo que tiene que hacer Pablo)

### Para fix de alt (Sprint 1C, el más rápido y con mayor impacto SEO)

1. Backup completo de Royo en hPanel.
2. Registrar el backup en `/dashboard/clients/2c56ab18-5074-4bc7-b9d1-16c4a5a233cf` con el botón "Registrar backup manual".
3. Crear application password en `joyeriaroyo.com/wp-admin/` → Usuarios → Tu perfil → Application Passwords → "PACAME".
4. Conectar el WP de Royo en el dashboard PACAME (form de URL + user + app password).
5. Pasarme las credenciales por env vars o yo las leo desde `client_websites` cifradas.

Tras eso ejecuto el script primero en `--dry-run --limit=10` para verificar la salida, después `--apply --limit=10` (test small), y finalmente `--apply` (full batch). Tiempo total estimado: 30 min.

### Para reescribir páginas demo (Sprint 1A/B/D)

Las páginas Sobre Nosotros, Contacto y Marcas usan widgets Elementor en su `_elementor_data` post meta. Para reescribirlas hacen falta DOS opciones:

**Opción simple** (recomendada): subir el plugin `pacame-connect.php` (que está en `infra/wordpress-plugin/pacame-connect/`) por SFTP a `wp-content/mu-plugins/`, añadir `define('PACAME_WEBHOOK_SECRET', '...');` a `wp-config.php`. **AÑADIR un endpoint** `/pacame/v1/page/{id}/reset-to-gutenberg` que vacíe el `_elementor_data` y permita escribir nuevo `post_content`. Pendiente de añadir al plugin.

**Opción manual** (sin plugin): Pablo entra a wp-admin Elementor, edita las 3 páginas a mano usando los textos de los borradores. Más trabajo manual pero cero código.

## Orden de ataque sugerido tras desbloqueo

1. **Día 1 (1h)**: Sprint 1C — bulk fix de alt en imágenes (script ya listo, solo desbloquear). 974 imágenes → cero impacto visual, máximo impacto SEO.
2. **Día 2-3**: Sprint 1A/B/D — reescritura Sobre Nosotros, Contacto, Marcas (con datos confirmados de Pablo o defaults seguros).
3. **Día 4-5**: Sprint 2A — short_description para 486 productos (LLM ATLAS lo genera, Pablo aprueba muestra de 20).
4. **Semana 2**: Sprint 2C blog SEO (5 posts ATLAS), Sprint 3 atributos Woo, Sprint 4 galería rica.
