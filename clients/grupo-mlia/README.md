# Cliente: Grupo MLIA

## Identidad
- **Nombre comercial:** Grupo MLIA
- **Razón social:** (pendiente — completar en vault)
- **Capa:** 2 (cliente B2B externo)
- **Industria:** Catering y eventos (marca "M-Lía" — catering, venta de
  entradas/eventos; web corporativa, sin tienda online). Confirmar detalle con Pablo.
- **Web cliente:** https://grupomlia.com
- **Plataforma:** WordPress + Yoast SEO (sin WooCommerce)

## Contactos
- **Decisor:** ver vault `PacameCueva/02-Clientes/grupo-mlia/contactos.md`.
- **Contacto técnico:** ídem vault.
- **Canal preferente:** (pendiente — confirmar con Pablo).

## Accesos (referencia, NO valores)
- **Hosting:** pendiente identificar (Hostinger / otro). Token en vault si aplica.
- **WP-admin / REST API:** usuario admin + *application password* WP.
  Credenciales en `web/.env.local` raíz PACAME (`MLIA_WP_USER`,
  `MLIA_WP_APP_PASS`) y cifradas en Supabase `client_websites`
  (`wp_app_password_ciphertext/iv/tag`, AES-256-GCM con `WP_SECRET_KEY`).
- **Webhook MU PACAME:** `MLIA_PACAME_SECRET` (HMAC) — solo si se sube plugin MU.
- **DB:** sin acceso directo (vía REST API / plugin MU si se instala).

## Scope contratado
- Mantenimiento web mensual (fixes técnicos, mejoras, soporte ad-hoc).
- SEO (técnico + on-page con Yoast, contenido orientado a posicionamiento).
- Producción de contenido (redacción y publicación de páginas/posts).

> NO incluye enrichment de catálogo / tienda (no es WooCommerce).

## Estado
- **Estado:** activo.
- **Alta:** 2026-05-18 (modelo Royo — capa de mantenimiento WP PACAME).
- **Última intervención:** 2026-05-18 (onboarding).
- **Próximo hito:** Sprint 1 — auditoría SEO técnica Yoast + plan de contenido.

## Stack del cliente
- WordPress (REST API estándar `wp/v2`).
- Yoast SEO.
- Sin WooCommerce (web corporativa / catálogo).
- Plugin MU PACAME (`mu-plugins/`) — NO subido en el alta; follow-up si el
  scope requiere purga de caché / operaciones avanzadas (igual que Royo).

## Servicios PACAME activos
- [x] Mantenimiento web mensual
- [x] SEO (Yoast — técnico + on-page)
- [x] Producción de contenido
- [ ] Optimización catálogo/enrichment (N/A — no es tienda)
- [ ] Ads Meta/Google (no contratado)

## Decisiones clave (registro)
- 2026-05-18: alta como cliente Capa 2 replicando patrón Royo. Web corporativa,
  Yoast confirmado, sin WooCommerce. Registro cifrado en `client_websites`.

## Conexión PACAME (verificada 2026-05-18)
- **clients.id:** `d30b8178-8283-4676-a1dd-0d0d4f523858`
- **client_websites.id:** `ce525afc-e4d6-40e4-a0e8-f3d5146ecb29`
- **Usuario WP:** `pablodesarrolloweb@gmail.com` ("Pablo Desarrollo web", id 4, rol `administrator`)
- **Estado conexión:** `connected` ✓ (test `wp/v2/users/me` OK).
- **Yoast:** namespace `yoast/v1` confirmado en el sitio.
- **Lectura verificada:** 3 páginas detectadas (Catering M-Lía, Trabaja con
  nosotros, Venta de entradas). 0 posts de blog (base para scope de contenido).

## Scripts en este cliente
```
clients/grupo-mlia/scripts/
└── onboard.mjs   # alta one-off: upsert clients + insert client_websites cifrado + test conexión
```
Lee credenciales de `web/.env.local` (`SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SUPABASE_URL`, `WP_SECRET_KEY`, `MLIA_WP_*`). Ver `runbook.md`.

## Vínculos
- **Memoria Claude:** `MEMORY.md` → `project_grupo_mlia_client.md`.
- **Vault Obsidian:** `PacameCueva/02-Clientes/grupo-mlia/`.
- **Tabla cifrada:** `client_websites` en Supabase (PR #71, schema
  `infra/migrations/029_client_websites.sql`).
- **Cliente modelo:** `clients/royo/` (mismo patrón Capa 2 WP).
