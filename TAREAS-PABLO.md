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

### 5. Verificar dominio en Resend
- Ir a https://resend.com/domains
- Verificar que `pacameagencia.com` esta verificado con DNS records
- Si no esta, anadir los registros TXT/MX que indique Resend en Hostinger
- **Por que:** sin verificacion, los emails van a spam

### 6. Hacer un pago de prueba en Stripe
- Ir a https://pacameagencia.com/dashboard/payments
- Generar un link de pago y probarlo (puedes usar tu tarjeta y reembolsar)
- Verificar que el webhook llega y se registra en Supabase
- **Por que:** confirma que el flujo de cobro funciona end-to-end

### 7. Configurar Meta Graph API token
- Ir a https://developers.facebook.com
- Crear token de pagina con permisos: `pages_manage_posts`, `pages_read_engagement`
- Anadir como `META_PAGE_ACCESS_TOKEN` en Vercel
- **Por que:** permite publicar automaticamente en Instagram/Facebook

## DESEABLES (para mas adelante)

### 8. Google Search Console
- Verificar `pacameagencia.com` en Search Console
- Subir sitemap: `https://pacameagencia.com/sitemap.xml`
- **Por que:** indexar las 1600+ paginas SEO programaticas

### 9. Google Analytics / Plausible
- Crear propiedad GA4 o cuenta Plausible para `pacameagencia.com`
- Anadir el ID de medicion al proyecto
- **Por que:** medir trafico real, conversion de visitantes

### 10. Primer cliente real
- Cuando todo lo anterior este listo, lanzar primera campana outbound:
  - Dashboard → Lead Gen → Scrapear un nicho en tu ciudad
  - Dashboard → Comercial → Enviar emails de outreach
  - Dashboard → Llamadas → Llamar con Sage a los que respondan
  - Dashboard → Propuestas → Generar y enviar propuesta
  - Dashboard → Pagos → Cobrar via Stripe
