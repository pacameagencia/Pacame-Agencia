# Tareas pendientes de Pablo

Cosas que solo tu puedes hacer. De mas a menos prioritaria.

## CRITICAS (bloquean funcionalidad)

### 1. Cambiar password del dashboard
- El password actual es `pacame2026` (por defecto)
- Cambialo en Vercel → Environment Variables → `DASHBOARD_PASSWORD`
- **Por que:** cualquiera que vea el codigo puede entrar

### 2. Vapi / Twilio — migrar caller ID al nuevo numero +34 604 190 129
- ⚠️ **Cambio de numero empresa**: el numero viejo era +34 722 669 381 (ahora movil personal de Pablo). El nuevo numero empresa es **+34 604 190 129**.
- ✅ Numero +34 604 190 129 dado de alta en Vapi.
- ✅ Numero +34 604 190 129 dado de alta como sending number en Twilio.
- ✅ `TWILIO_PHONE_NUMBER=+34604190129` actualizado en Vercel (Production + Development). Preview usa default del codigo.
- [ ] **Meter manualmente** en Vercel el nuevo `VAPI_PHONE_NUMBER_ID` (el UUID que da Vapi al numero +34 604 190 129). Vercel → Settings → Environment Variables → editar `VAPI_PHONE_NUMBER_ID` → pegar UUID → aplicar a Production + Preview + Development.
- [ ] SSH al VPS (72.62.185.125) y actualizar `voice-server/.env`:
  ```
  TWILIO_PHONE_NUMBER=+34604190129
  VOICE_MODE=test
  VOICE_TEST_ALLOWED_PHONES=+34722669381
  ```
  Luego reiniciar:
  ```
  docker compose restart voice-server   # o: pm2 restart voice
  ```
- ✅ Webhook ya configurado: `https://pacameagencia.com/api/calls/webhook`
- ✅ Pipeline completo: llamada → transcripcion → analisis IA → notificacion

### 2.b — Modo test de llamadas (SEGURIDAD) ✅ INSTALADO
- ✅ **Guard instalado en 3 capas** (`web/app/api/calls/route.ts`, `web/lib/brain/channels/voice.ts`, `voice-server/server.js`). Mientras `VOICE_MODE=test`, Vapi/Twilio SOLO llama a los numeros de `VOICE_TEST_ALLOWED_PHONES`. Cualquier otro destino devuelve 403.
- ✅ Default seguro en el codigo: `VOICE_MODE=test`, allowlist = `+34722669381` (movil personal de Pablo). Aunque falten las env vars en un entorno, el comportamiento por defecto es bloquear todo excepto a Pablo.
- ✅ Vercel configurado: `VOICE_MODE=test` + `VOICE_TEST_ALLOWED_PHONES=+34722669381` en Production + Development. Preview hereda del default del codigo (tambien test + movil Pablo).
- [ ] Configurar en el **VPS `voice-server/.env`** (ver tarea 2, arriba).
- [ ] **Cuando todo este probado**, activar llamadas a leads reales:
  - Vercel production: cambiar `VOICE_MODE=live`.
  - VPS voice-server: cambiar `VOICE_MODE=live` en el .env + restart.
  - Dejar `VOICE_MODE=test` en development (y preview via default) para que el dev/staging siga seguro.
- [ ] **Como probar ya**: desde dashboard → Llamadas → pulsar "Llamar" y marcar tu movil (+34 722 669 381). Intenta tambien con otro numero → debe devolver error "voice_test_mode_blocked".

### 3. Crear cuenta ElevenLabs (opcional)
- Ir a https://elevenlabs.io → Crear cuenta
- Elegir/clonar una voz en espanol
- Copiar: `ELEVENLABS_VOICE_ID`
- Anadir en Vercel → Environment Variables
- **Por que:** mejora la voz de Sage en llamadas. Sin esto usa una voz por defecto

### ~~4. Configurar Telegram Bot (alertas en tiempo real)~~ ✅ HECHO
- ✅ Bot token y chat ID configurados en Vercel
- ✅ Webhook configurado: `https://pacameagencia.com/api/telegram/webhook`
- ✅ Comandos: `/status`, `/leads`, `/cron`, `/takeover`, `/release`
- ✅ Alertas automaticas: leads calientes, sistema degradado, web caida

## IMPORTANTES (mejoran conversion)

### ~~5. Verificar dominio en Resend~~ ✅ HECHO
- ✅ Dominio `pacameagencia.com` verificado en Resend

### 6. Hacer un pago de prueba en Stripe — LISTO PARA PROBAR
- ✅ Cupon `TEST100` creado (100% descuento, hasta 50 usos)
- ✅ Checkout acepta codigos promocionales
- Genera un pago desde dashboard o propuesta, usa codigo **TEST100** en el checkout
- Verificar que el webhook llega y se registra en Supabase
- **Por que:** confirma que el flujo de cobro funciona end-to-end

### 7. Configurar WhatsApp Business API
- Ir a https://developers.facebook.com → WhatsApp → Getting Started
- Crear una app de negocio con WhatsApp Cloud API
- Copiar `Phone Number ID` y `Permanent Token`
- Anadir en Vercel:
  - `WHATSAPP_PHONE_ID` = el Phone Number ID
  - `WHATSAPP_TOKEN` = el token permanente
- Configurar webhook en Meta: URL = `https://pacameagencia.com/api/whatsapp/webhook`, Verify Token = `pacame_wa_verify_2026`
- **Por que:** TODO el codigo esta listo — bienvenida leads, followups, auto-respuesta IA con Claude, propuestas por WhatsApp. Solo falta la API key.

### 8. Configurar Meta Graph API token (publicacion RRSS)
- Ir a https://developers.facebook.com
- Crear token de pagina con permisos: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`
- Anadir en Vercel:
  - `META_PAGE_ACCESS_TOKEN` = token de pagina
  - `META_PAGE_ID` = ID de tu pagina Facebook
  - `INSTAGRAM_ACCOUNT_ID` = ID de tu cuenta Instagram Business
- **Alternativa:** Si prefieres Buffer, solo necesitas `BUFFER_ACCESS_TOKEN` de buffer.com
- **Por que:** el contenido se genera y aprueba, pero no se publica solo. Con esta key, Pulse publica automaticamente 3x/dia

## DESEABLES (para mas adelante)

### 9. Google Search Console
- Verificar `pacameagencia.com` en Search Console
- Subir sitemap: `https://pacameagencia.com/sitemap.xml`
- **Por que:** indexar las 1600+ paginas SEO programaticas

### 10. Google Analytics / Plausible
- Crear propiedad GA4 o cuenta Plausible para `pacameagencia.com`
- Anadir el ID de medicion al proyecto
- **Por que:** medir trafico real, conversion de visitantes

### 11. Primer cliente real
- Cuando todo lo anterior este listo, lanzar primera campana outbound:
  - Dashboard → Lead Gen → Scrapear un nicho en tu ciudad
  - Dashboard → Comercial → Enviar emails de outreach
  - Dashboard → Llamadas → Llamar con Sage a los que respondan
  - Dashboard → Propuestas → Generar y enviar propuesta
  - Dashboard → Pagos → Cobrar via Stripe
