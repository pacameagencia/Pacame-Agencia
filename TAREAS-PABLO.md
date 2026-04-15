# Tareas pendientes de Pablo

Cosas que solo tu puedes hacer. De mas a menos prioritaria.

## CRITICAS (bloquean funcionalidad)

### 1. Cambiar password del dashboard
- El password actual es `pacame2026` (por defecto)
- Cambialo en Vercel → Environment Variables → `DASHBOARD_PASSWORD`
- **Por que:** cualquiera que vea el codigo puede entrar

### 2. ~~Crear cuenta Vapi + comprar numero~~ ✅ HECHO
- ✅ Cuenta Vapi creada
- ✅ Numero +34 722 669 381 registrado (via Twilio)
- ✅ `VAPI_API_KEY` y `VAPI_PHONE_NUMBER_ID` configurados en Vercel
- ✅ Webhook configurado: `https://pacameagencia.com/api/calls/webhook`
- ✅ Pipeline completo: llamada → transcripcion → analisis IA → notificacion

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
