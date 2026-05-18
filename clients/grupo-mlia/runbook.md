# Runbook técnico — Grupo MLIA

> Cómo intervenir el WordPress de Grupo MLIA sin romperlo. **Backup obligatorio**
> antes de cualquier escritura en producción (regla
> `feedback_backup_antes_de_tocar_prod_cliente`). Solo lecturas eximen.

## Antes de tocar nada

1. **Backup**: ¿hay UpdraftPlus / API hosting / dump < 24h? Si NO → crear backup
   ANTES de cualquier escritura masiva.
2. **Verificar estado**: `client_websites.status` debe ser `connected` y
   `last_error` vacío.
3. **Probar primero en 1 entrada** (1 página/post) antes de cualquier batch.
4. **Avisar** si la operación tiene riesgo de downtime > 30s.

## Acceso

### Vía WordPress REST API (preferente)
- Base: `{base_url}/wp-json/wp/v2/...` (namespace estándar).
- Auth: Basic con `MLIA_WP_USER` + `MLIA_WP_APP_PASS` (application password WP).
- Driver PACAME: `web/lib/wordpress.ts` (`wpClient(wid)`, `wpRequest`,
  `wpListPosts`, `wpCreatePost`, `wpUpdatePost`).
- Endpoints PACAME: `POST /api/clients/{id}/websites/{wid}/wp` (passthrough),
  `/sync` (listar posts), `/publish` (publicar contenido), `/test` (validar).

### Vía dashboard PACAME
- `client_websites` (Supabase) guarda credenciales cifradas AES-256-GCM.
- `POST /api/clients/{id}/websites/{wid}/test` revalida la conexión.

### Vía plugin MU PACAME (excepcional, follow-up)
- NO instalado en el alta. Necesario solo para purga de caché / SQL parametrizado
  / operaciones que la REST API estándar no cubre. HMAC con `MLIA_PACAME_SECRET`.

### Vía API hosting (excepcional)
- Solo para restart o backup forzado si no hay alternativa programática.
- Loguear en `history/YYYY-MM-DD-<accion>.md`.

## Operaciones comunes

### Onboarding / revalidar conexión
```bash
node clients/grupo-mlia/scripts/onboard.mjs            # idempotente: alta + test
node clients/grupo-mlia/scripts/onboard.mjs --test-only # solo re-test conexión
```
**Lee de:** `web/.env.local`. **Escribe en:** Supabase `clients` +
`client_websites` (credenciales cifradas). **Reversible:** sí (borrar fila).

### SEO (Yoast)
- Meta título/descripción vía post meta `_yoast_wpseo_title` /
  `_yoast_wpseo_metadesc` (lo maneja `wpCreatePost`/`wpUpdatePost` con
  `seoPlugin='yoast'`). Auditar antes con `GET wp/v2/posts` + `yoast/v1`.

### Producción de contenido
- Publicar como **draft** primero (`status: "draft"`), revisar, luego `publish`.
- Idempotente si se guarda `external_id` (no duplica posts).

### Recuperación / rollback
- Restaurar backup (UpdraftPlus / hosting).
- Revertir post concreto vía REST API a la revisión previa.

## Anti-patrones

- ❌ No escribir directamente en la BD del cliente sin script revisado.
- ❌ No subir secretos al repo (ni comentados). Viven en `web/.env.local` + vault.
- ❌ No publicar contenido directo a `publish` sin pasar por `draft` y revisión.
- ❌ No tocar config crítica (permalinks, tema, plugins) sin backup y aviso.
- ❌ No mezclar branding PACAME con el branding del cliente.

## Log de cambios estructurales
- 2026-05-18: alta cliente Capa 2 (modelo Royo). Registro cifrado en
  `client_websites` (Yoast, sin WooCommerce). Test de conexión: ver README.
