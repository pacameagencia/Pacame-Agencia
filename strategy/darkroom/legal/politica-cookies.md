# Política de Cookies — Dark Room

> **Estado**: BORRADOR v1.0.
> **Última revisión**: 2026-04-28.
> **AVISO INTERNO**: borrador inicial. La tabla concreta de cookies en uso debe actualizarse después de auditoría real (Cookiebot, GTM debug o inspector manual). Lista provisional basada en stack conocido (Next.js + Supabase + Stripe + Resend).

---

## 1. ¿Qué son las cookies?

Las cookies son pequeños archivos de texto que un sitio web instala en el dispositivo del usuario al navegarlo. Permiten reconocer al usuario, recordar sus preferencias y mejorar su experiencia de uso. Algunas cookies son esenciales para el funcionamiento básico del sitio; otras tienen finalidades analíticas o de marketing.

## 2. ¿Qué cookies utiliza Dark Room?

Dark Room utiliza únicamente **cookies estrictamente necesarias** y **cookies analíticas anonimizadas** para mejorar el Servicio. **No se utilizan cookies publicitarias de terceros**.

### 2.1. Cookies estrictamente necesarias (sin consentimiento previo, art. 22.2 LSSI)

| Nombre | Proveedor | Finalidad | Duración |
|---|---|---|---|
| `sb-access-token` | Dark Room (Supabase Auth) | Autenticación de sesión del Miembro | Sesión |
| `sb-refresh-token` | Dark Room (Supabase Auth) | Renovación segura del token de sesión | 7 días |
| `__darkroom_csrf` | Dark Room | Protección frente a ataques CSRF en formularios | Sesión |
| `__darkroom_consent` | Dark Room | Almacena la preferencia de consentimiento del usuario sobre cookies | 12 meses |

### 2.2. Cookies de proveedores de pago (esenciales para procesar transacciones)

| Nombre | Proveedor | Finalidad | Duración |
|---|---|---|---|
| `__stripe_mid` | Stripe | Detección antifraude en el flujo de pago | 12 meses |
| `__stripe_sid` | Stripe | Identificador de sesión de pago | 30 minutos |

### 2.3. Cookies analíticas (requieren consentimiento)

| Nombre | Proveedor | Finalidad | Duración |
|---|---|---|---|
| `_pa` | Plausible Analytics (auto-hospedado, sin IP) | Analítica agregada y anonimizada de uso del sitio | 30 días |

Plausible es un sistema de analítica respetuoso con la privacidad: **no usa identificadores personales, no rastrea entre sitios y cumple RGPD por diseño**. Aun así, se solicita consentimiento como buena práctica.

## 3. Cookies de terceros con fines publicitarios

**Dark Room no instala cookies publicitarias de terceros (Google Ads, Meta Pixel, TikTok Pixel, LinkedIn Insight u otros).** Esta política puede actualizarse en el futuro si se incorporan canales de marketing pagado, en cuyo caso se notificará a los usuarios y se solicitará consentimiento expreso.

## 4. Gestión del consentimiento

La primera vez que el usuario accede a la Plataforma, se muestra un banner de consentimiento que le permite:

- **Aceptar todas las cookies**.
- **Rechazar todas las no esenciales**.
- **Configurar** preferencias por categoría.

El usuario puede modificar sus preferencias en cualquier momento desde el enlace `Configuración de Cookies` ubicado en el pie de página.

## 5. ¿Cómo bloquear o eliminar cookies?

El usuario puede configurar su navegador para bloquear, eliminar o aceptar selectivamente las cookies. La forma de hacerlo varía según el navegador:

- **Chrome**: `chrome://settings/cookies`
- **Firefox**: `about:preferences#privacy`
- **Safari**: Preferencias → Privacidad
- **Edge**: `edge://settings/content/cookies`

Bloquear las cookies estrictamente necesarias puede impedir el correcto funcionamiento del Servicio (en particular, la autenticación y el procesamiento de pagos).

## 6. Modificaciones de la Política

Dark Room se reserva el derecho a modificar la presente Política de Cookies. Cualquier cambio significativo se notificará al usuario mediante el banner de consentimiento, requiriendo su renovación.

---

**Versión**: 1.0
**Fecha de entrada en vigor**: pendiente.
**Contacto**: `support@darkroomcreative.cloud`
