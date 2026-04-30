# Runbook técnico — [NOMBRE CLIENTE]

> Cómo intervenir la infraestructura del cliente sin romperla. Toda operación de escritura/restart sobre prod requiere **backup previo** (regla maestra `feedback_backup_antes_de_tocar_prod_cliente`).

## Antes de tocar nada

1. **Backup**: ¿hay UpdraftPlus / API hosting / SFTP dump activo de las últimas 24h? Si NO → crear backup ANTES de cualquier escritura.
2. **Verificar estado**: dashboard PACAME → cliente → "estado actual" (sin errores).
3. **Avisar** si la operación tiene riesgo de downtime > 30s.

## Acceso

### Vía dashboard PACAME (preferente)
- URL: ...
- Permite: ver estado, lanzar scripts predefinidos, leer logs, NO escribir directo.

### Vía API hosting (Hostinger / Vercel / etc.)
- Tokens en vault Obsidian.
- Comandos típicos: ...

### Vía panel del cliente (excepcional)
- Solo si no hay alternativa programática.
- Loguear qué se tocó en `history/YYYY-MM-DD-<accion>.md`.

## Operaciones comunes

### Enrichment / sync de datos
```bash
node clients/<slug>/scripts/<script>.mjs
```
**Lee de:** ... | **Escribe en:** ... | **Reversible:** sí/no.

### Cambio de configuración
- Antes: backup config actual.
- Cambio: ...
- Verificar: ...

### Recuperación / rollback
- Si algo va mal: ...
- Restaurar backup: ...

## Anti-patrones

- ❌ No escribir directamente en BD del cliente sin script revisado.
- ❌ No subir secretos al repo (ni siquiera comentados).
- ❌ No tocar config crítica (cron, payments, auth) en horario laboral del cliente sin avisar.
- ❌ No mezclar paletas / branding PACAME con branding del cliente.

## Log de cambios estructurales
- YYYY-MM-DD: ...
