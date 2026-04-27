# Instagram Publishing · Setup permanente

> Última verificación: 2026-04-26 · Token tipo SYSTEM_USER · expiración: NEVER

## Estado actual

- Cuenta IG: **`@pacamespain`** (name "PACAME") · 52.292 followers · cuenta tipo Business/Creator vinculada a página FB
- IG Business Account ID: `17841464198401809`
- Página FB: `Pacame Marketing Digital` · ID `466597303200589`
- App Meta: `PACAME AGENCIA` · ID `1288928049839812`
- System User generador del token: `pacamewhatsappbot` (BM "Pacame Agencia Marketing Digital")
- Primer post publicado autonomously: https://www.instagram.com/p/DXlspElD5Gx/

## Cómo publica `publish-carrusel.mjs`

```
node carruseles-darkroom/publish-carrusel.mjs <carpeta_carrusel>
```

Flujo interno:
1. Lee `slide-1.png` ... `slide-N.png` de la carpeta
2. Convierte cada PNG a JPEG (Sharp · quality 90, baseline non-progressive · IG rechaza progressive)
3. Sube cada JPEG a `catbox.moe` (CDN simple sin Cloudflare-protection · IG-compatible)
4. Lee caption de `CAPTION.md` en la carpeta (toma el primer bloque ` ``` `)
5. IG Graph API:
   - `POST /{ig_id}/media` con `image_url` + `is_carousel_item: true` × N child containers
   - `POST /{ig_id}/media` con `media_type: CAROUSEL` + `children: [...]` + caption → carousel container
   - Espera 5s a que IG procese
   - `POST /{ig_id}/media_publish` con `creation_id` del container → publica
6. Devuelve post_id + URL `https://www.instagram.com/p/...`

## Issues conocidos y soluciones

### Issue 1 · IG rechaza URLs Supabase Storage (error 2207052)

**Síntoma**: subes a Supabase, la URL es 200 OK con `image/jpeg` correcto, pero IG responde:
```
{"error":{"message":"Only photo or video can be accepted as media type.",
"type":"OAuthException","code":9004,"error_subcode":2207052,
"error_user_msg":"El URI de este contenido no cumple nuestros requisitos."}}
```

**Causa**: incompatibilidad entre el fetcher de IG y URLs servidas via Cloudflare CDN de Supabase. La URL responde correcto a curl con cualquier User-Agent (incluido `facebookexternalhit`) pero IG internamente la rechaza por algún check propietario.

**Solución implementada**: subir a `catbox.moe` (https://files.catbox.moe/...) que es un CDN simple sin protección Cloudflare. IG lo acepta sin problemas. Esta es la lógica actual en `publish-carrusel.mjs::uploadFile()`.

### Issue 2 · IG rechaza JPEG progressive

**Síntoma**: similar al anterior, error 2207052 incluso con URL aceptada.

**Causa**: IG Graph API a veces falla parsing JPEGs progressive.

**Solución**: Sharp con `progressive: false, mozjpeg: false, chromaSubsampling: "4:2:0"` → JPEG baseline estándar.

### Issue 3 · Comentarios propios via API

**Síntoma**: `POST /{post_id}/comments` devuelve error 1772107 `"Tu comentario de Instagram no se ha añadido"`.

**Causa**: Meta restringe la creación de comentarios PROPIOS por el dueño de la cuenta vía API · solo permite RESPONDER a comentarios de otros (`/{comment_id}/replies`).

**Workaround**: Pablo añade el comentario fijado manual en la app IG · 5 segundos.

## Cómo regenerar token si se revoca

El token actual es System User y NO expira. Solo se invalida si:
- Pablo lo revoca manualmente desde BM → Usuarios del sistema → `pacamewhatsappbot` → `Revocar identificadores`
- El system user se elimina del BM
- Meta lo invalida por violación de policy

Si pasa, generar uno nuevo en 30 segundos:
1. https://business.facebook.com/settings/system-users
2. Selecciona `pacamewhatsappbot`
3. `Generar identificador`
4. App: `PACAME AGENCIA` · Vencimiento: `Nunca`
5. Permisos:
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_manage_comments`
   - `instagram_manage_insights`
   - `instagram_manage_messages`
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
6. Copiar el token (aparece UNA vez)
7. `sed -i "s|^INSTAGRAM_ACCESS_TOKEN=.*|INSTAGRAM_ACCESS_TOKEN=<TOKEN>|" web/.env.local`
8. Verificar con `GET /debug_token` que `expires_at: 0`

## Comandos útiles

### Verificar status del token actual

```bash
cd "c:/Users/Pacame24/Downloads/PACAME AGENCIA" && node --input-type=module -e '
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync("web/.env.local","utf8").split("\n").filter(l=>l&&!l.startsWith("#")&&l.includes("=")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["\x27]|["\x27]$/g,"")];}));
const r = await fetch(`https://graph.facebook.com/v21.0/debug_token?input_token=${env.INSTAGRAM_ACCESS_TOKEN}&access_token=${env.INSTAGRAM_ACCESS_TOKEN}`);
const j = await r.json();
console.log("type:", j.data?.type, "· expires_at:", j.data?.expires_at, "· valid:", j.data?.is_valid);
'
```

Output esperado: `type: SYSTEM_USER · expires_at: 0 · valid: true`

### Listar últimos posts publicados

```bash
node --input-type=module -e '
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync("web/.env.local","utf8").split("\n").filter(l=>l&&l.includes("=")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["\x27]|["\x27]$/g,"")];}));
const r = await fetch(`https://graph.facebook.com/v21.0/${env.INSTAGRAM_ACCOUNT_ID}/media?fields=id,permalink,caption,like_count,comments_count,timestamp&limit=10&access_token=${env.INSTAGRAM_ACCESS_TOKEN}`);
const j = await r.json();
(j.data||[]).forEach(p => console.log(p.timestamp, "·", p.permalink, "· likes", p.like_count, "· comments", p.comments_count));
'
```

### Publicar un carrusel nuevo

```bash
cd carruseles-darkroom
node publish-carrusel.mjs output/<carpeta-del-carrusel>
```

Requisitos previos en la carpeta:
- `slide-1.png` ... `slide-N.png` (2-10 slides) · 1080×1350 4:5 IG feed
- `CAPTION.md` con el caption en un bloque ` ``` ` (opcional · default fallback)

## Variables de entorno relevantes (web/.env.local)

```
INSTAGRAM_ACCESS_TOKEN=<system_user_token_permanent>
INSTAGRAM_ACCOUNT_ID=17841464198401809
META_PAGE_ACCESS_TOKEN=<page_token>  # legacy, no usado por publish-carrusel.mjs
META_PAGE_ID=466597303200589
INSTAGRAM_APP_ID=<app_id>
INSTAGRAM_APP_SECRET=<app_secret>
SUPABASE_SERVICE_ROLE_KEY=<service_role>  # legacy fallback path
NEXT_PUBLIC_SUPABASE_URL=<supa_url>
```

## Costes recurrentes

- Token: $0 (System User permanent)
- catbox.moe: $0 (free, sin auth, retención permanente)
- Meta Graph API publish: $0 (publishing es free para cuentas Business)
- Generación de imágenes (Atlas Cloud gpt-image-2): $0.012/img · ~$0.06 por carrusel de 5 slides
- **Coste total por carrusel publicado**: ~$0.06 (solo imagen IA · publishing es gratis)

## Próximos pasos sugeridos

- [ ] Configurar webhook de IG (`/instagram/webhook` ya existe en `web/app/api/`) para auto-respond DMs y comments
- [ ] Cron diario que ejecute `getInsights()` y guarde métricas en Supabase `content_published`
- [ ] Auto-trigger publish desde calendario editorial 30 días (cron + lookup en `strategy/plan-contenido-30-dias.md`)
