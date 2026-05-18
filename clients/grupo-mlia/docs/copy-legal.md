# Copy legal RGPD/LSSI-CE — Grupo M-LÍA

> Páginas legales para corregir el hallazgo **P0** de la auditoría (hoy solo
> existe la demo Axiomthemes en inglés). Se crean como **borrador** vía REST y
> se publican cuando Pablo confirme los datos del responsable. El banner de
> cookies ya lo cubre el plugin activo `wp-gdpr-compliance` (Cookie Information).

## Datos del responsable — PENDIENTE confirmar con Pablo

| Campo | Valor | Estado |
|---|---|---|
| Denominación social | `[RAZÓN SOCIAL S.L./S.L.U.]` | ⛔ pendiente |
| NIF/CIF | `[CIF]` | ⛔ pendiente |
| Nombre comercial | Grupo M-LÍA | ✔ |
| Domicilio | Avenida Castilla-La Mancha 1, 02400 Hellín (Albacete) | ✔ (verificar CP) |
| Email de contacto | `[email RGPD]` | ⛔ pendiente |
| Teléfono | `[teléfono]` | ⛔ pendiente |
| Web | https://grupomlia.com | ✔ |

> Sin estos campos las páginas quedan en **borrador** (no se publican). El
> texto está redactado y validado; solo falta sustituir los `[corchetes]`.

---

## 1. Aviso Legal (slug `/aviso-legal/`)

**Identificación (LSSI-CE art. 10).** En cumplimiento de la Ley 34/2002 (LSSI-CE):
titular `[RAZÓN SOCIAL]`, NIF `[CIF]`, domicilio en Avenida Castilla-La Mancha 1,
02400 Hellín (Albacete), email `[email]`. Sitio web: https://grupomlia.com.

**Objeto.** Las presentes condiciones regulan el uso del sitio grupomlia.com,
cuyo objeto es informar sobre los servicios de hostelería, restauración,
eventos, bodas, comuniones, catering y ocio de Grupo M-LÍA en Hellín.

**Condiciones de uso.** El usuario se compromete a hacer un uso adecuado de los
contenidos y a no emplearlos para actividades ilícitas. La reserva de mesa o la
solicitud de presupuesto de eventos no constituye contrato hasta su confirmación
expresa por parte de Grupo M-LÍA.

**Propiedad intelectual e industrial.** Todos los contenidos del sitio (textos,
fotografías, logotipos, marca M-LÍA y MANÍA) son titularidad de `[RAZÓN SOCIAL]`
o de terceros que han autorizado su uso. Queda prohibida su reproducción sin
autorización.

**Responsabilidad.** Grupo M-LÍA no se responsabiliza de los daños derivados del
mal uso del sitio ni de la indisponibilidad temporal por causas técnicas.

**Legislación aplicable.** Legislación española. Para cualquier controversia,
las partes se someten a los juzgados y tribunales de Albacete.

---

## 2. Política de Privacidad (slug `/politica-de-privacidad/`)

**Responsable del tratamiento.** `[RAZÓN SOCIAL]`, NIF `[CIF]`, Avenida
Castilla-La Mancha 1, 02400 Hellín (Albacete). Email: `[email]`.

**Finalidad.** Tratamos los datos que nos facilitas a través de los formularios
(contacto, solicitud de presupuesto de eventos/bodas/comuniones, reservas,
"Trabaja con nosotros") con estas finalidades: (a) atender tu consulta o
solicitud de presupuesto; (b) gestionar reservas y eventos; (c) gestionar
candidaturas de empleo; (d) si lo consientes, enviarte información sobre
nuestros servicios.

**Legitimación.** Consentimiento del interesado (art. 6.1.a RGPD) y, en su caso,
medidas precontractuales a petición del interesado (art. 6.1.b RGPD).

**Conservación.** Los datos se conservarán mientras dure la relación y, después,
durante los plazos legalmente exigibles. Las candidaturas de empleo se conservan
un máximo de 1 año.

**Destinatarios.** No se ceden datos a terceros salvo obligación legal. Se
emplean encargados de tratamiento (alojamiento web, email, herramientas de
formulario) con contrato conforme al art. 28 RGPD.

**Derechos.** Puedes ejercer tus derechos de acceso, rectificación, supresión,
oposición, limitación y portabilidad escribiendo a `[email]`, acreditando tu
identidad. Tienes derecho a reclamar ante la Agencia Española de Protección de
Datos (www.aepd.es).

**Seguridad.** Aplicamos medidas técnicas y organizativas apropiadas para
proteger tus datos.

---

## 3. Política de Cookies (slug `/politica-de-cookies/`)

**Qué son.** Las cookies son archivos que se descargan en tu dispositivo al
visitar el sitio y permiten su funcionamiento y la obtención de información.

**Cookies utilizadas en grupomlia.com:**
- **Técnicas (necesarias):** sesión, preferencias, balanceo. No requieren
  consentimiento.
- **Analíticas:** Google Site Kit / Analytics y Jetpack Stats — miden el uso del
  sitio de forma agregada. Requieren consentimiento.
- **De terceros:** YouTube/Google Maps incrustados, redes sociales (Facebook,
  Instagram). Requieren consentimiento.

**Gestión del consentimiento.** El banner gestionado por el plugin de Cookie
Information permite aceptar, rechazar o configurar las cookies no necesarias.
Puedes cambiar tu elección en cualquier momento desde el enlace de configuración
de cookies del pie de página, o eliminándolas desde tu navegador.

**Más información.** Consulta la Política de Privacidad para conocer el
tratamiento de los datos obtenidos.

---

## Implementación

1. Crear 3 páginas vía REST (`/wp/v2/pages`, `status=draft`), Gutenberg/HTML
   simple y legible (sin Elementor), con Yoast meta (ver `seo-yoast.mjs`:
   añadir entradas legales tras conocer los IDs).
2. Sustituir `[corchetes]` con datos reales de Pablo.
3. Publicar y enlazar en el footer (cuando se rediseñe el footer / vía menú).
4. Borrar las páginas demo: `privacy-policy` (12954, demo Axiomthemes),
   `refund-and-returns-policy` (17479) — en Sprint 2C tras backup.
