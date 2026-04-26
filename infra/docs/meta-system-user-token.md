# Meta System User Token — Runbook PACAME

Token único permanente para WhatsApp + Instagram + Facebook + Meta Ads. **No expira nunca** mientras el System User exista en Meta Business Manager.

> **Por qué este token y no OAuth.** Los tokens OAuth long-lived (60 días) que entrega el flujo `/api/instagram/callback` requieren refresh cron y caen si fallan. El System User token es la única forma técnicamente real de "no expira nunca" en Meta. Cubre las 4 superficies (WhatsApp Cloud, IG Graph, FB Page, Marketing API) bajo un mismo bearer.

---

## Identidad PACAME (referencia rápida)

| Activo | ID |
|--------|-----|
| Meta App ID | `1255852116264384` |
| Facebook Page | `466597303200589` |
| Instagram Business Account | `17841464198401809` |
| WhatsApp Business Account (WABA) | `2852760131745681` |
| WhatsApp Phone Number ID | `1170407699480508` (+34 604 19 01 29) |

App Secret y demás credenciales en `web/.env.local` (NO commitear nunca).

---

## Generación del System User Token (5 min, único paso manual)

### 1. Acceder a Business Manager

Ir a https://business.facebook.com/settings/system-users con la cuenta de Pablo (admin del Business).

### 2. Crear o reutilizar el System User

- Si no existe → **Add** → tipo **Admin** → nombre `PACAME-Permanent`.
- Si ya existe `PACAME-Permanent` → seleccionarlo.

### 3. Asignar Apps al System User

En la fila del System User → **Add Assets** → pestaña **Apps**:
- Buscar app `1255852116264384` (PACAME)
- Permiso **Manage app**
- Save

### 4. Asignar Assets (Page + IG + WABA + Ad Account)

Mismo flujo **Add Assets**:

| Asset | Tipo | Permiso |
|-------|------|---------|
| Page `466597303200589` | Pages | **Full control** |
| Instagram `17841464198401809` | Instagram Accounts | **Full control** |
| WABA `2852760131745681` | WhatsApp Accounts | **Full control** |
| Ad Account de PACAME | Ad Accounts | **Manage campaigns** |

### 5. Generar el Token

En la página del System User → botón **Generate New Token**:

- **App**: PACAME (`1255852116264384`)
- **Token Expiration**: **Never** ← clave
- **Permissions**: marcar los 16 scopes:
  - `whatsapp_business_management`
  - `whatsapp_business_messaging`
  - `instagram_basic`
  - `instagram_content_publish`
  - `instagram_manage_comments`
  - `instagram_manage_insights`
  - `instagram_manage_messages`
  - `pages_show_list`
  - `pages_read_engagement`
  - `pages_manage_posts`
  - `pages_manage_metadata`
  - `pages_manage_engagement`
  - `pages_messaging`
  - `business_management`
  - `ads_management`
  - `ads_read`

Click **Generate Token** → copia el string `EAA...` (~250 chars). Pégalo en chat con Claude — Claude lo configura en `.env.local` + Vercel y valida.

> **Aviso de Meta.** El token se enseña una sola vez. Si se cierra el modal sin copiar, hay que regenerar (perdiendo el token anterior automáticamente). Pablo debe copiarlo a la primera.

---

## Configuración del token (lo hace Claude)

```bash
# Local
echo "META_SYSTEM_USER_TOKEN=EAA..." >> web/.env.local

# Vercel (los 3 entornos)
vercel env add META_SYSTEM_USER_TOKEN production
vercel env add META_SYSTEM_USER_TOKEN preview
vercel env add META_SYSTEM_USER_TOKEN development
```

Las libs `web/lib/instagram.ts`, `web/lib/whatsapp.ts` y `web/lib/social-publish.ts` ya consumen `META_SYSTEM_USER_TOKEN` automáticamente vía `web/lib/meta-token.ts`. No requiere cambios de código.

Las env vars legadas (`INSTAGRAM_ACCESS_TOKEN`, `WHATSAPP_TOKEN`, `META_PAGE_ACCESS_TOKEN`) quedan como fallback — no estorban.

---

## Validación

### Inspección detallada del token

```bash
curl -X POST https://pacameagencia.com/api/admin/meta/inspect-token \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Output esperado de un token correcto:
```json
{
  "is_valid": true,
  "type": "system_user",
  "is_system_user": true,
  "is_permanent": true,
  "expires_at": "never",
  "scope_completeness": "16/16",
  "missing_scopes": [],
  "whatsapp_accessible": true,
  "recommendation": "PERFECTO — System User permanente con los 16 scopes. Listo para producción."
}
```

### Smoke tests E2E (7 chequeos)

```bash
curl -X POST https://pacameagencia.com/api/admin/meta/test-suite \
  -H "Authorization: Bearer $CRON_SECRET"
```

Output esperado:
```json
{
  "passed": 7,
  "failed": 0,
  "all_pass": true,
  "summary": "Token Meta operativo: WhatsApp + Instagram + Facebook + Ads + Webhooks OK."
}
```

---

## Rotación / regeneración

Si el token se compromete o el System User se borra:

1. Repetir pasos 1-5 arriba (generar uno nuevo).
2. `vercel env rm META_SYSTEM_USER_TOKEN <env>` y volver a añadirlo con el nuevo valor (los 3 entornos).
3. `vercel deploy --prod` para forzar recarga del lambda.
4. `curl /api/admin/meta/inspect-token` para confirmar.

---

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| `Error validating access token: Session has expired` | Token User long-lived (no es System User) | Regenerar como System User con expiration **Never** |
| `(#10) Application does not have permission for this action` | Scope faltante | Regenerar token marcando el scope que falte (ver `missing_scopes` del inspect) |
| `Cannot get application info due to a system error` | Token de otra App / App Secret incorrecto | Verificar que la App seleccionada al generar el token sea `1255852116264384` |
| WhatsApp 401 pero IG 200 | Token sin scope `whatsapp_business_management` o WABA no asignado al System User | Add WABA `2852760131745681` como asset del System User → regenerar |
| Webhook entra pero responde 401 | `WHATSAPP_VERIFY_TOKEN` o `INSTAGRAM_VERIFY_TOKEN` no coinciden con lo configurado en Meta App Dashboard | Sincronizar con `pacame_wa_verify_2026` / `pacame_ig_verify_2026` |

---

## Webhook subscriptions (independiente del token)

Los `verify_token` de webhook NO cambian al rotar el access token. Si necesitas resuscribir:

```bash
# IG
curl -X POST "https://graph.facebook.com/v21.0/${INSTAGRAM_APP_ID}/subscriptions" \
  -d "object=instagram" \
  -d "callback_url=https://pacameagencia.com/api/instagram/webhook" \
  -d "verify_token=pacame_ig_verify_2026" \
  -d "fields=messages,messaging_postbacks,comments,mentions" \
  -d "access_token=${INSTAGRAM_APP_ID}|${INSTAGRAM_APP_SECRET}"

# WhatsApp
curl -X POST "https://graph.facebook.com/v21.0/${INSTAGRAM_APP_ID}/subscriptions" \
  -d "object=whatsapp_business_account" \
  -d "callback_url=https://pacameagencia.com/api/whatsapp/webhook" \
  -d "verify_token=pacame_wa_verify_2026" \
  -d "fields=messages" \
  -d "access_token=${INSTAGRAM_APP_ID}|${INSTAGRAM_APP_SECRET}"
```

---

## Fecha de implantación
- Andamiaje (libs + endpoints + runbook): 2026-04-26
- System User token activo: pendiente (Pablo en Business Manager)
- Diagnóstico previo: los 3 tokens legados (IG, Page, WhatsApp) caducaron entre 16-Apr y 26-Apr. Por eso publicar/enviar estaba caído.
