# Política de Privacidad — Dark Room

> **Estado**: BORRADOR v1.0 — RGPD-compliant.
> **Última revisión**: 2026-04-28.
> **AVISO INTERNO**: borrador inicial. Antes de publicar requiere validación de un DPO o asesor RGPD humano. La identidad del responsable del tratamiento debe rellenarse al constituir la SL separada de Dark Room (recomendación DIOS) o, si se mantiene la entidad actual, al confirmar la información fiscal del operador.

---

## 1. Responsable del Tratamiento

| Dato | Valor |
|---|---|
| **Razón social** | [PENDIENTE — completar al constituir SL Dark Room o asignar entidad operadora] |
| **CIF** | [PENDIENTE] |
| **Domicilio social** | [PENDIENTE] |
| **Email de contacto** | `support@darkroomcreative.cloud` |
| **Delegado de Protección de Datos (DPO)** | `support@darkroomcreative.cloud` (a confirmar nombramiento formal si aplica) |

## 2. Datos Personales que Tratamos

Dark Room recopila y trata los siguientes datos personales en el marco de la prestación del Servicio:

### 2.1. Datos de identificación
- Nombre y apellidos.
- Dirección de correo electrónico.
- Datos de facturación (NIF/DNI/NIE, dirección postal, en su caso).

### 2.2. Datos de pago
Procesados directamente por el proveedor de pagos (Stripe). Dark Room no almacena en sus sistemas datos de tarjeta de crédito completos. Se conserva únicamente el identificador interno de cliente Stripe y los últimos 4 dígitos del medio de pago para fines de soporte.

### 2.3. Datos de uso
- Logs técnicos de acceso (timestamp, IP origen, user-agent).
- Patrones de uso de los recursos colectivos (frecuencia, tipo de recurso accedido).
- Cookies técnicas y de analítica (ver Política de Cookies).

### 2.4. Comunicaciones
- Tickets de soporte enviados a `support@darkroomcreative.cloud`.
- Respuestas a encuestas o feedback voluntario.

## 3. Finalidades del Tratamiento

Tratamos los datos personales con las siguientes finalidades:

| Finalidad | Base jurídica (RGPD) |
|---|---|
| Prestación del servicio de membresía colectiva | Ejecución de contrato (art. 6.1.b RGPD) |
| Gestión de cobros, facturación y obligaciones fiscales | Obligación legal (art. 6.1.c RGPD) |
| Atención al cliente y soporte técnico | Ejecución de contrato |
| Mejora del servicio y análisis de uso agregado | Interés legítimo (art. 6.1.f RGPD) |
| Detección de uso fraudulento o abusivo del Servicio | Interés legítimo + protección de la comunidad de Miembros |
| Envío de comunicaciones operativas (incidencias, cambios de Términos) | Ejecución de contrato |
| Envío de comunicaciones comerciales propias | Consentimiento (revocable) |
| Cumplimiento de requerimientos legales o de autoridad competente | Obligación legal |

## 4. Plazo de Conservación

| Tipo de dato | Plazo de conservación |
|---|---|
| Datos de identificación y facturación | Durante la relación contractual + 6 años (obligación fiscal/mercantil) |
| Datos de pago (referencia Stripe) | Durante la relación + 6 años |
| Logs técnicos de acceso | 90 días (luego anonimización agregada) |
| Tickets de soporte | 24 meses tras cierre del ticket |
| Datos de marketing (consentimiento) | Hasta revocación del consentimiento |

Tras los plazos indicados, los datos serán suprimidos o anonimizados de forma irreversible.

## 5. Destinatarios y Encargados de Tratamiento

Los datos personales podrán ser comunicados a los siguientes encargados de tratamiento, todos ellos vinculados por contratos de tratamiento de datos conformes al RGPD:

| Encargado | Servicio prestado | Ubicación |
|---|---|---|
| **Stripe** | Procesamiento de pagos | EEE / Estados Unidos (Standard Contractual Clauses) |
| **Supabase** | Base de datos y autenticación | UE (Frankfurt — `dark-room-prod`) |
| **Vercel** | Hosting de la plataforma web | Global (CDN; cláusulas-tipo) |
| **Resend** | Envío de correos transaccionales | EEE / Estados Unidos (SCC) |
| **Cloudflare** (en su caso) | Protección DDoS y CDN | Global |

No se realizan transferencias internacionales de datos fuera de los encargados anteriormente indicados, todos ellos amparados por los mecanismos legales correspondientes.

**Dark Room no comparte ni vende datos personales a terceros con fines comerciales.**

## 6. Derechos de los Miembros

Conforme al RGPD y a la LOPDGDD, los Miembros tienen los siguientes derechos:

- **Acceso**: a los datos personales que tratamos.
- **Rectificación**: de datos inexactos o incompletos.
- **Supresión** ("derecho al olvido"): cuando los datos ya no sean necesarios.
- **Limitación** del tratamiento.
- **Oposición** al tratamiento basado en interés legítimo.
- **Portabilidad** de los datos a otro responsable.
- **No ser objeto** de decisiones automatizadas con efectos jurídicos significativos.
- **Retirar el consentimiento** en cualquier momento, sin que ello afecte a la licitud del tratamiento previo.

Para ejercer cualquiera de estos derechos, el Miembro puede dirigirse por escrito a `support@darkroomcreative.cloud` aportando copia de un documento identificativo válido. Responderemos en el plazo máximo de **un mes** desde la recepción de la solicitud, prorrogable a dos meses en casos complejos.

Si el Miembro considera que el tratamiento de sus datos no se ajusta a la normativa, podrá presentar reclamación ante la **Agencia Española de Protección de Datos** (`www.aepd.es`) o ante la autoridad de control de su país de residencia.

## 7. Medidas de Seguridad

Dark Room aplica medidas técnicas y organizativas apropiadas para garantizar la seguridad de los datos personales, incluyendo:

- Cifrado en tránsito (HTTPS/TLS 1.3).
- Cifrado en reposo de la base de datos (Supabase).
- Control de acceso basado en roles y autenticación reforzada.
- Logs de auditoría para accesos sensibles.
- Aislamiento de infraestructura respecto a otros proyectos del operador.
- Plan de respuesta ante incidentes de seguridad.

En caso de brecha de seguridad que afecte a datos personales, se notificará a la AEPD y, cuando proceda, a los Miembros afectados, en el plazo legal establecido.

## 8. Menores de Edad

El Servicio está dirigido **exclusivamente a personas mayores de 18 años**. Dark Room no recopila ni trata conscientemente datos personales de menores. Si se detecta que un Miembro es menor de edad, se procederá a la suspensión inmediata de la cuenta y a la eliminación de los datos asociados.

## 9. Cookies

El uso de cookies y tecnologías similares se rige por la **Política de Cookies** de Dark Room, accesible en `darkroomcreative.cloud/cookies`.

## 10. Modificaciones

Dark Room podrá modificar la presente Política de Privacidad para adaptarla a cambios normativos, técnicos u operativos. Las modificaciones sustanciales se notificarán a los Miembros a través de su correo electrónico con un preaviso mínimo de **15 días naturales**.

---

**Versión**: 1.0
**Fecha de entrada en vigor**: pendiente.
