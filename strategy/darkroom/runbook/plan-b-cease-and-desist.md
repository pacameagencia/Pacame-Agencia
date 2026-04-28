# Plan B — Respuesta a Cease-and-Desist (DarkRoom)

> **Estado**: RUNBOOK INTERNO — confidencial.
> **Última revisión**: 2026-04-28.
> **Owner**: Pablo Calleja + SAGE.
> **Activación**: ante recepción de cualquier comunicación legal (cease-and-desist, demanda, reclamación judicial o extrajudicial) de Adobe, Microsoft, Figma, Canva, Anthropic, OpenAI, Stripe o cualquier otro proveedor cuyos recursos formen parte de la membresía colectiva.
> **Tiempo objetivo de respuesta operativa**: 72 horas desde la notificación.

---

## 0. Reglas de oro (lee antes de actuar)

1. **NUNCA responder al remitente legal antes de leer este runbook completo.**
2. **NUNCA negar uso del recurso por escrito** sin asesoramiento legal previo. Una negación falsa documentada multiplica la exposición.
3. **NUNCA borrar evidencias** que ya pueda haber capturado la otra parte (web archive, screenshots, transacciones Stripe). El borrado posterior es indicio de mala fe en juicio.
4. **SÍ documentar TODO** desde el minuto cero: timestamp de recepción, vía de recepción, contenido completo, archivos adjuntos, remitente exacto.
5. **Pablo notifica primero a Pablo**: confidencialidad absoluta. NO mencionar a clientes B2B (Ecomglobalbox, Royo, Marisol…), NO mencionar a colaboradores externos, NO publicar nada en redes sociales.

---

## 1. Hora 0–6 — Triaje y contención

### 1.1. Capturar la notificación íntegra

- Forwardear el correo original a `pablodesarrolloweb@gmail.com` (cuenta personal de Pablo, separada de PACAME) con `[CD-DARKROOM]` en el asunto.
- Guardar copia PDF del correo + headers completos en carpeta cifrada local: `C:\PrivadoPablo\DarkRoom\Legal\<YYYY-MM-DD>-cease-and-desist\`.
- Si la notificación llega en papel: escanear y archivar igual.

### 1.2. Identificar exactamente qué reclama la otra parte

Antes de hacer nada operativo, responder a estas 4 preguntas por escrito:

| Pregunta | Respuesta concreta |
|---|---|
| ¿Quién es el remitente legal? (despacho, empresa, individual) | … |
| ¿Qué recurso/marca alegan que se está infringiendo? | … |
| ¿Qué piden exactamente? (cese inmediato / información / dinero / todo) | … |
| ¿En qué plazo piden respuesta? (24h / 7 días / 30 días) | … |

### 1.3. Decisión de pausa operativa

Hasta tener asesoría legal:

- **Pausar inmediatamente** la captación pública (Ads, contenido, posts en RRSS que mencionen el recurso reclamado).
- **NO suspender el servicio a Miembros existentes** sin instrucción legal explícita — la suspensión unilateral puede generar reclamaciones de los propios Miembros y contradice una eventual defensa de buena fe contractual.
- **Mantener el sitio operativo** salvo que la reclamación sea por contenido específico de una página concreta, en cuyo caso se despublica solo esa página.

---

## 2. Hora 6–24 — Asesoramiento legal

### 2.1. Contactar abogado mercantil

Pablo declinó constituir SL separada y contratar abogado preventivo. Ante un C&D real, **el abogado deja de ser opcional**. Lista de despachos preferidos (a confirmar y preregistrar antes de que llegue el C&D):

- [PENDIENTE rellenar 1-3 despachos en Albacete / Madrid / Barcelona con experiencia en propiedad intelectual y contratos digitales]
- Coste esperado de primera consulta: 200–400 €.
- Coste esperado de redacción de respuesta: 800–2.500 € (en función de complejidad).

### 2.2. Información que el abogado necesita en la primera reunión

Tener preparado en una sola carpeta:

- Notificación legal recibida (íntegra).
- Términos y Condiciones publicados de Dark Room (`strategy/darkroom/legal/terminos-y-condiciones.md`).
- Política de Privacidad (`strategy/darkroom/legal/politica-privacidad.md`).
- Modelo de negocio descrito de forma honesta (no maquillado): qué se vende, cómo se accede, qué proveedores subyacen.
- Volumen de Miembros activos a la fecha.
- MRR a la fecha.
- Estructura societaria actual (entidad operadora, autónomo o SL).
- Cuenta Stripe usada y qué otras actividades comparten esa cuenta.

### 2.3. Decisiones que el abogado debe ayudar a tomar

- ¿Responder o ignorar dentro del plazo? (depende del tipo de notificación)
- ¿Negociar acuerdo extrajudicial? (importe, condiciones)
- ¿Pivotar producto inmediatamente o cesar definitivamente la membresía colectiva sobre ese recurso?
- ¿Reestructuración societaria urgente? (constituir SL para limitar responsabilidad personal a futuro)

---

## 3. Hora 24–48 — Respuesta operativa

### 3.1. Si la decisión es **PIVOTAR**

Mantener Dark Room funcionando, eliminar el recurso problemático:

1. **Eliminar de la oferta** el recurso reclamado (interfaz, copy, base de datos de licencias).
2. **Comunicación a Miembros**: email transparente explicando que "por motivos operativos hemos retirado X recurso. Se mantiene el resto de la membresía o se prorratea reembolso del periodo no consumido".
3. **Sustituir por alternativa** si existe: open-source, herramienta legítimamente licenciada, o crédito proporcional.
4. **Actualizar Términos** para reflejar la oferta vigente.

Plazo estimado: 5–10 días desde la decisión.

### 3.2. Si la decisión es **CESAR DARKROOM**

- **Suspender nuevos registros** de inmediato.
- **Continuar el servicio** a los Miembros activos hasta el final de su ciclo de facturación pagado, salvo orden judicial expresa de suspensión inmediata.
- **No emitir reembolsos masivos sin instrucción legal**: pueden ser reclamados como reconocimiento implícito.
- **Plan de comunicación** a Miembros gestionado con el abogado.
- **Conservar toda la documentación operativa** (logs, base de datos, pagos) durante el plazo legal correspondiente.

### 3.3. Si la decisión es **DEFENDER**

(Solo bajo recomendación expresa del abogado.)

- Respuesta formal redactada por el abogado argumentando la naturaleza de "membresía colectiva" y la ausencia de reventa directa de licencias.
- Ofrecer canal de diálogo / negociación.
- Mantener operación normal salvo medidas cautelares.

---

## 4. Hora 48–72 — Hardening reactivo

Independientemente de la decisión anterior, ejecutar este hardening como mitigación general:

### 4.1. Aislamiento financiero

- **Migrar Stripe** de la cuenta PACAME LIVE a una cuenta dedicada Dark Room (ver `strategy/darkroom/runbook/hardening-checklist.md` — acción #1). Esto tenía que estar hecho antes; en C&D pasa a urgencia máxima para evitar arrastre a clientes B2B.
- **Constituir SL** si aún no se hizo. Coste 30–45 días, pero iniciar el trámite cuanto antes para futura responsabilidad limitada.

### 4.2. Aislamiento de identidad

- Verificar **whois privacy** de `darkroomcreative.cloud`.
- Verificar que el operador legal del sitio no es Pablo persona física en ningún punto público.
- Cambiar todos los emails de soporte y administración a buzones genéricos: `support@`, `legal@`, `ops@`.

### 4.3. Aislamiento de comunicación pública

- **NO mencionar PACAME en relación con DarkRoom en ningún canal público** (ya está en la regla maestra `strategy/arquitectura-3-capas.md`, reforzar).
- **Pausar todo el orgánico** que mencione recursos de terceros directamente.
- **Eliminar de redes sociales** posts pasados que contengan nombres de marca de terceros (Adobe, Figma, etc.) si los hubiera.

### 4.4. Hardening operacional

- Auditoría de patrones de uso anómalo de cuentas compartidas.
- Implementar session locking definitivo si no estaba.
- Rotar perfiles AdsPower con nuevas credenciales.
- Cambiar IPs de salida si hay sospecha de fingerprint.

---

## 5. Comunicación interna

Durante toda la gestión:

- **Pablo**: único punto de contacto con el abogado.
- **DIOS / agentes IA**: pueden generar borradores y runbooks bajo dirección de Pablo, pero ningún agente envía comunicaciones externas reales sin Pablo.
- **Clientes B2B (Ecomglobalbox, Royo, Marisol…)**: no se les comunica nada sobre DarkRoom. Si preguntan, "Dark Room es un proyecto independiente que no afecta a sus servicios contratados con PACAME".
- **Equipo extendido**: si se incorpora alguien al equipo, NDA firmado antes de cualquier información.

---

## 6. Pos-mortem (a las 2 semanas de cerrado el incidente)

Realizar postmortem documentado con:

- Cronología real de los hechos.
- Coste económico total (abogados, reembolsos, oportunidad).
- Decisiones aprendidas.
- Cambios estructurales adoptados (SL, separación Stripe, etc.).
- Impacto en captación, MRR, churn de los próximos 90 días.

Archivar en `strategy/darkroom/postmortem/<YYYY-MM-DD>-cd-<remitente>.md` (ruta privada, no commitear si contiene PII).

---

## 7. Indicadores de escalada inmediata a Pablo (sin esperar el ciclo de 72h)

Activar contacto directo con abogado en menos de 6 horas si la notificación incluye:

- ⚠️ Solicitud de información sobre Miembros (lista de usuarios, datos personales).
- ⚠️ Notificación a Stripe / banco / Hostinger / Vercel pidiendo congelar fondos o suspender servicios.
- ⚠️ Demanda judicial ya admitida a trámite (no simple C&D).
- ⚠️ Solicitud de medidas cautelares.
- ⚠️ Mención de cantidades reclamadas superiores a 10.000 €.
- ⚠️ Implicación de varias jurisdicciones simultáneas.

En cualquiera de estos supuestos, **no actuar solo**. Pablo + abogado, no antes.

---

**Documento confidencial. No commitear si contiene PII real. La versión actual es plantilla genérica.**
