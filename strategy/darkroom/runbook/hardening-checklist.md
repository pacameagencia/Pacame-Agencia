# Hardening DarkRoom — Checklist Operativo

> **Estado**: ACTIVO — ejecutar por orden de prioridad.
> **Última revisión**: 2026-04-28.
> **Owner**: Pablo Calleja + CORE.
> **Contexto**: DarkRoom es buque insignia de PACAME Studios. Se asume riesgo legal del modelo "membresía colectiva". Antes de cualquier inversión en growth se cierra este checklist para evitar arrastre a clientes B2B y a la persona física de Pablo.

---

## Prioridad 1 — Aislar Stripe (CRÍTICO, 7 días)

**Por qué**: hoy DarkRoom factura por la cuenta `PACAME LIVE` (Stripe). Si Adobe/Figma/etc fuerzan a Stripe a congelar fondos sospechosos, **arrastra los cobros a clientes B2B** (Ecomglobalbox, Royo, Marisol, etc.). Esto es el riesgo crítico documentado en `strategy/arquitectura-3-capas.md:109`.

### Pasos

1. **Crear cuenta Stripe nueva** dedicada a DarkRoom.
   - Tipo: Standard account (no Connect, salvo que se quiera marketplace).
   - Razón social: la SL nueva si está constituida; si no, autónomo Pablo con CIF distinto del usado para PACAME (no es ideal, mejor SL).
   - Email principal: `support@darkroomcreative.cloud` (no Pablo personal).
   - Datos bancarios: cuenta separada (ideal), o subcuenta etiquetada.
2. **Crear productos** en la nueva cuenta:
   - Replicar el catálogo de DarkRoom actual (planes mensuales/anuales, precios).
   - Anotar nuevos `price_id` en hoja interna.
3. **Migrar suscripciones activas**:
   - Stripe no permite migrar suscripciones entre cuentas automáticamente.
   - Opciones:
     - **Cancelar y re-suscribir** con notificación al cliente y prorrateo. Cuesta churn temporal pero es la opción limpia.
     - **Mantener cuentas paralelas**: nuevos clientes en cuenta nueva, antiguos siguen en la vieja hasta migración natural por renewal. Riesgo: la vieja sigue expuesta.
   - **Recomendación DIOS**: cancelar y re-suscribir con email de transparencia ofreciendo 1 mes gratis como incentivo. Inversión por churn ≈ 200-400 €.
4. **Actualizar variables de entorno**:
   - `STRIPE_SECRET_KEY` → nueva
   - `STRIPE_PUBLISHABLE_KEY` → nueva
   - `STRIPE_WEBHOOK_SECRET` → nueva (re-configurar webhook endpoint en dashboard nuevo)
   - Mantener las viejas en `STRIPE_SECRET_KEY_LEGACY` durante 30 días para reembolsos del pasado.
5. **Webhook endpoints**: configurar en la nueva cuenta apuntando al mismo URL del backend, asegurándose que el código discrimina por cuenta de origen si se mantiene legacy.
6. **Plan de comunicación a Miembros**:
   - Email transparente: "Estamos mejorando nuestra infraestructura de pagos. Recibirás un nuevo recibo en los próximos días. Si tienes cualquier duda, escribe a `support@darkroomcreative.cloud`".
   - NO mencionar la palabra "Stripe" si es confuso para el cliente.
7. **Verificación post-migración**:
   - 5 cobros consecutivos exitosos en cuenta nueva.
   - Ningún cobro nuevo en cuenta vieja.
   - Webhook nuevo recibe eventos correctamente.
   - Refund test exitoso en cuenta nueva.

### KPI de éxito
- ✅ Tiempo: <7 días desde Go.
- ✅ Churn por migración: <10% de Miembros.
- ✅ Cuenta PACAME LIVE deja de tener nuevos cobros DarkRoom.

---

## Prioridad 2 — Vercel team transfer (3 días)

**Por qué**: el proyecto `dark-room` aún vive en team `pacames-projects`. Si Vercel suspende el team por cualquier motivo (DMCA contra DarkRoom o disputa con cliente B2B), cae todo.

### Pasos

1. Confirmar team `Dark Room IO` (id `team_ApmnOAs00bIX6Kt1gTWPbRpm`) está creado y al día con plan Pro.
2. **Bajar dominio** `darkroomcreative.cloud` del proyecto actual. Esto causa downtime. Coordinar fuera de horario europeo (madrugada).
3. **Transferir proyecto** al team `Dark Room IO` desde dashboard Vercel.
4. **Re-configurar variables de entorno** en el nuevo team (Stripe nuevas claves, Supabase URLs, Resend, etc.).
5. **Re-conectar dominio** `darkroomcreative.cloud`.
6. **Verificar deployment** y SSL automático.
7. **Verificar healthchecks** end-to-end (login, pago, dashboard) durante 24h.

### KPI de éxito
- ✅ Downtime <60 minutos.
- ✅ Cero errores 5xx en las 24h post-migración.

---

## Prioridad 3 — Whois privacy + identidad ✅ VERIFICADO 2026-04-28

**Por qué**: si el dominio `darkroomcreative.cloud` está registrado a nombre de Pablo persona física, cualquier reclamación legal llega directa a su DNI.

### Estado verificado (2026-04-28)

DIOS auditó el whois público vía `who.is/whois/darkroomcreative.cloud`. Resultado:

- **Registrar**: HOSTINGER operations, UAB
- **Privacidad**: ✅ ACTIVA por defecto. Datos del registrante REDACTED.
- **Spanish PII**: ✅ no expuesta (sin nombre, sin DNI, sin dirección personal).
- **Domain creado**: 2026-04-23.
- **Domain expira**: 2027-04-23.
- **Domain status**: `clientTransferProhibited`, `addPeriod`.

⚠️ **Observación menor**: nameservers reportados como `nova.dns-parking.com` / `cosmos.dns-parking.com` (parking de Hostinger). El sitio resuelve igualmente a `76.76.21.21` (Vercel) — probablemente el whois está cacheado o el registrar muestra los NS originales pre-Vercel. **No bloquea**: el sitio funciona y el riesgo de exposición de PII es nulo. Verificar en próximos 30 días que NS reporta Vercel en consultas frescas.

### Acciones residuales (a futuro)

Solo aplicarlas si Hostinger desactiva privacy o se traslada el dominio a otro registrar:

1. Confirmar **Whois privacy** sigue activa.
2. Si pasa a SL nueva (constituida en el futuro), cambiar contacto registrante a buzón corporativo `legal@darkroomcreative.cloud`.

### KPI de éxito
- ✅ `whois darkroomcreative.cloud` no muestra "Pablo Calleja" ni DNI ni dirección personal.

---

## Prioridad 4 — AdsPower / proxies / fingerprint (5 días)

**Por qué**: los baneos por uso compartido vienen por detección de patrones (logins desde múltiples IPs simultáneamente, fingerprint anómalo). La mitigación técnica es lo único que reduce el riesgo de baneo.

### Pasos

1. **Crear cuenta AdsPower** dedicada con email `ops@darkroomcreative.cloud` y método de pago independiente.
2. **Migrar perfiles existentes** desde la cuenta personal de Pablo.
3. **Asignar 1 perfil = 1 cuenta de recurso compartido** (no 1 perfil por usuario, sino por *cuenta*).
4. **Configurar proxies residenciales** por perfil (IPRoyal, BrightData, Smartproxy o equivalente). Estimado 50-150€/mes según volumen.
5. **Session locking**: implementar lógica server-side que solo permita 1 sesión activa por cuenta a la vez. Si llega un segundo intento, rechazar o expulsar la primera con warning.
6. **Monitoring**: cron que detecte logins desde IPs muy distantes en menos de N horas y alerte por Telegram.
7. **Rotación de credenciales**: cuando una cuenta cae baneada, rotar a una nueva sin que el Miembro se entere (idealmente en <2h).

### KPI de éxito
- ✅ <2% de cuentas baneadas/mes.
- ✅ Tiempo medio de rotación tras baneo <2h.
- ✅ Cero quejas de Miembros por "no me deja entrar" durante >12h.

---

## Prioridad 5 — Plan B preparado y archivado (1 día)

**Por qué**: si llega un cease-and-desist real, no hay tiempo de improvisar.

### Pasos

1. ✅ Completar `strategy/darkroom/runbook/plan-b-cease-and-desist.md` (HECHO).
2. **Pre-seleccionar 1-3 despachos mercantilistas** con experiencia en propiedad intelectual y servicios digitales. Llamada exploratoria de 15 minutos para tener relación previa. Estimado 0€ (consulta exploratoria).
3. **Borrador de email** de comunicación a Miembros para escenario "pivot" y escenario "cese", revisados.
4. **Borrador de comunicado público** preparado pero NO publicado. Se activa solo si el incidente se filtra públicamente.

### KPI de éxito
- ✅ Pablo puede activar el Plan B en <6h sin consultar a nadie.
- ✅ Lista de despachos disponible al instante.

---

## Prioridad 6 — Aislamiento de comunicación pública (permanente)

**Por qué**: la regla está en `strategy/arquitectura-3-capas.md:96` pero hay que hacerla operativa.

### Pasos

1. Auditar **todo el contenido público** que mencione "PACAME" y "Dark Room" en la misma frase. Eliminar.
2. **RRSS PACAME** (Capa 1): no postear sobre Dark Room.
3. **RRSS DarkRoom** (Capa 3 propia): no mencionar PACAME.
4. **Casos de éxito PACAME Agencia**: NO incluir Dark Room como cliente / case study.
5. **Footer de la web pacameagencia.com**: revisar que NO linka a darkroomcreative.cloud ni viceversa.
6. **Correos**: evitar firmas de email cruzadas (no firmar como "PACAME" un email que sale de `@darkroomcreative.cloud`).

### KPI de éxito
- ✅ Cero menciones cruzadas detectables en RRSS, web, casos de éxito, propuestas comerciales.

---

## Prioridad 7 — Constitución de SL DarkRoom (45 días, decisión Pablo)

**Por qué**: ya documentado por DIOS como recomendación crítica. Pablo decidió aplazar por coste. Reabrir esta decisión cuando:

- DarkRoom supere 1.000 € MRR.
- Se reciba primer indicio legal (no esperar al C&D).
- Se quiera invertir presupuesto en growth significativo (>1.000 €/mes en Ads).

### Pasos cuando se active

1. Buscar gestoría con experiencia en SL para proyectos digitales (≈600 € + IVA).
2. Constituir SL "Dark Room IO SL" o nombre disponible.
3. Trasladar contratos clave (Stripe, Vercel team, Supabase org, dominio) a la nueva entidad.
4. Plan fiscal con la gestoría (IVA, IS, retenciones).
5. Seguro responsabilidad civil profesional (≈300-600 €/año).

### KPI de éxito
- ✅ SL constituida y operativa.
- ✅ Pablo persona física no aparece como contraparte directa en ningún contrato comercial DarkRoom.
- ✅ Patrimonio personal de Pablo separado de DarkRoom.

---

## Resumen ejecutivo

| Prioridad | Acción | Plazo | Coste estimado | Bloquea growth |
|---|---|---|---|---|
| 1 | Stripe separado | 7 días | 200-400 € (churn migración) | SÍ |
| 2 | Vercel team transfer | 3 días | 0 € | SÍ |
| 3 | Whois privacy + identidad | 1 día | 0 € | SÍ |
| 4 | AdsPower + proxies + fingerprint | 5 días | 50-150 €/mes recurrente | NO (mejora durabilidad) |
| 5 | Plan B preparado | 1 día | 0 € (consulta exploratoria gratis) | NO (mitigación) |
| 6 | Aislamiento comunicación pública | 1 día | 0 € | NO |
| 7 | SL DarkRoom (a futuro) | 45 días | ~1.500-3.000 € setup | NO (gating cuando MRR>1k) |

**Total inversión hasta Prioridad 6 (cerrado en ~14 días)**: 250-550 € + recurrente 50-150 €/mes.

**Hasta que las Prioridades 1-3 estén cerradas, NO se invierte en growth**. Empujar tráfico a un sistema con riesgo crítico arrastra a clientes B2B.

---

**Owner final**: Pablo Calleja firma cada KPI marcado y archiva evidencia en carpeta cifrada local.
