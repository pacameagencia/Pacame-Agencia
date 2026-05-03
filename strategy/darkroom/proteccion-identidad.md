# DarkRoom — Protección de Identidad de Pablo

> **Estado**: política activa — aplica a TODO contenido público DarkRoom.
> **Fecha**: 2026-04-29.
> **Owner**: Pablo (decisiones) + DIOS (enforcement) + COPY (revisión textos).
> **AVISO**: este doc es **interno**. No se publica en `/legal`.

---

## Por qué esta política existe

Pablo lo dijo claro: *"quiero tener mucho en cuenta los aspectos de proteger mi identidad por eso no quiero mostrar mis datos en cualquier lado si los ponemos es en una pagina de politicas que sera super extensa y es dificil encontrar el dni y no sera accesible a las politicas desde cualquier lugar"*.

DarkRoom opera en zona gris legal (modelo membresía colectiva). La regla `arquitectura-3-capas.md` ya establece que **DarkRoom no se asocia públicamente a PACAME**. Esta política complementa con:

- Ningún producto / landing / RRSS / soporte / agente / pieza de marketing menciona "Pablo Calleja" como persona física vinculada a DarkRoom.
- Los datos legales obligatorios (DNI/NIE, dirección fiscal) **existen** en políticas (cumplimiento RGPD/LSSI), pero están **diluidos** y **no accesibles desde links visibles**.
- El operador legal público es una sociedad española (SL a constituir o ya constituida). El nombre de la SL es lo que aparece donde sea legalmente obligatorio.

---

## Las 6 reglas duras

### Regla 1 — Cero nombre propio en piezas públicas

**NO aparece en**: landing, web, copy de RRSS, ads, descripciones de bots, perfiles públicos, casos de éxito, FAQ, atención al cliente, emails masivos.

Donde **SÍ puede aparecer** (interno):
- Comunicaciones legales privadas a clientes específicos cuando lo requiera la ley (ej. reembolso > 100 €).
- Actas de constitución, escrituras, banca, pagos a proveedores.
- En `darkroomcreative.cloud/legal/aviso-legal` SOLO si la SL constituida no exime de mostrar el nombre del administrador único — y aun así, en una sección al final, sin destacar.

### Regla 2 — Datos legales obligatorios existen pero diluidos

La política de privacidad y aviso legal contienen los datos legales mínimos exigidos por:

- **LSSI-CE** (España): nombre comercial, NIF, domicilio, contacto.
- **RGPD**: Responsable del tratamiento, DPO si aplica, derechos.

**Dilución**: la política mide ~25 secciones. Los datos identificativos están en la **sección 14** (responsable del tratamiento) y la **sección 24** (resolución de disputas), nunca en sección 1, sección 2, etc. donde son más visibles.

Datos a mostrar (cuando la SL esté constituida):

```
Razón social: Dark Room IO SL (o nombre que se elija)
NIF: [Bxxxxxxxx]
Domicilio social: [dirección de la SL]
Email contacto: support@darkroomcreative.cloud
```

**NO se muestra**: nombre+DNI del administrador único, salvo que la legislación obligue a ello en un caso concreto (poco frecuente para SL).

**Si Pablo opera como autónomo** (sin SL todavía), la solución legal es:
- Constituir SL ya, antes de promocionar DarkRoom (decisión Pablo).
- O usar una sociedad existente (si hay) para facturar DarkRoom.
- O incluir DNI con la mínima visibilidad posible (sección 14 política).

**Decisión actual de Pablo**: aplazar SL hasta MRR > 1k€ (ver `plan-mensual-operativo.md`). Mientras tanto, los placeholders en políticas dicen `[PENDIENTE — completar al constituir SL DarkRoom]` y el promo público no se hace agresivamente para minimizar exposición.

### Regla 3 — Cero link visible a documentación legal en cualquier parte de la landing (v3)

**Actualización 2026-05-03**: tras analizar a la competencia (ScaleBoost y operadores similares en zona gris) Pablo confirma que NO ponen link visible a documentación, cookies, ni aviso legal en sus landings. Las políticas existen pero ocultas. **Adoptamos el mismo método** (footer v3).

Footer landing DarkRoom v3:

```
darkroomcreative.cloud
soporte: support@darkroomcreative.cloud
```

Eso es TODO. Sin links a "Términos", "Privacidad", "Aviso legal", "Cookies". Ni siquiera el link discreto "legal" que la v2 contemplaba — eliminado.

**¿Cómo cumplimos LSSI / RGPD entonces?**

| Requisito | Cumplido por |
|---|---|
| Banner de cookies obligatorio (LSSI 22.2) con consentimiento granular | Sí — primera visita, links "más info" → privacidad/cookies. Único punto público de exposición. |
| Acceso a Términos antes del contrato | Sí — checkbox obligatorio en signup/checkout: "Acepto los [términos] y la [política de privacidad]". |
| Acceso a Aviso Legal LSSI 10 | Sí — URL directa `darkroomcreative.cloud/legal/aviso-legal`. NO linkado desde landing/menú/footer. |
| Acceso a Política de Privacidad RGPD 13.1 | Sí — URL directa + checkbox + banner. |
| Identificación del prestador | Sí — sección 14 política privacidad + aviso legal. |

**Hub `/legal`**: existe pero NO está linkado desde la landing. Es accesible para quien:
- Lo escriba directamente (URL).
- Llegue desde el banner de cookies (vía "más info").
- Llegue desde el checkbox de signup/checkout.

Quien llega **lo hace deliberadamente**. La landing no señaliza.

Así operan los competidores del modelo membresía colectiva. Cumplimos lo legal sin destacarlo. Quien busca la info la encuentra; quien pasa, no la ve.

**Detalle en `landing-copy-v1.md` sección 10 (footer v3)** — instrucciones HTML+CSS para PIXEL.

### Regla 4 — Bots y agentes nunca mencionan nombres propios

**Aplicación 2026-05-03**: la regla está enforced en código en `web/lib/darkroom/community/voice.ts` (`DR_SYSTEM_PROMPT_BASE` sección "# Identidad y anonimato") con instrucciones explícitas para los 3 agentes IRIS / NIMBO / VECTOR.

Cosas que los agentes NUNCA escriben:
- Nombres propios de personas físicas (fundador, CEO, dueño, admin, soporte humano).
- Frases tipo "llamada con [Nombre]" → dicen "llamada con el equipo".
- Frases tipo "te paso a [Nombre]" → dicen "te paso al equipo".
- "yo soy [Nombre]" → son "el equipo DarkRoom".
- Menciones a PACAME u otras marcas vinculadas al operador.

Si un usuario pregunta "quién está detrás", "quién es el dueño", "con quién hablo", "quién es el fundador" o similar, los agentes responden EXACTAMENTE:
> "DarkRoom es operada por una sociedad. Para detalles legales, escríbenos a support@darkroomcreative.cloud."

Si insiste, ofrecen "llamada con el equipo" sin nombres.

**Auditoría 2026-05-03 (DIOS)**: barrido del código encontró 4 violaciones en NIMBO + VECTOR (`llamada 15min con Pablo`, `escalas a Pablo`, `Pablo te escribe en directo`, etc.). Todas corregidas a "el equipo" / "el equipo te escribe". `escalateToPablo` se mantiene como nombre interno de función (no se ve por usuarios) pero se renombrará en futuro refactor cuando convenga.

### Regla 5 — Whois del dominio en privacy mode

Ya verificado (ver `runbook/hardening-checklist.md` Prioridad 3 ✅): `darkroomcreative.cloud` está con **whois privacy ACTIVA** vía Hostinger UAB. Sin Spanish PII expuesta.

Verificación de control: cada 90 días, hacer `who.is/whois/darkroomcreative.cloud` y confirmar que sigue redactado.

### Regla 6 — Cero menciones cruzadas con PACAME / La Caleta

Ya en `arquitectura-3-capas.md` y reforzado en RRSS humanizadas 70/20/10. Recordatorio:

- DarkRoom RRSS NO menciona PACAME ni a Pablo.
- PACAME RRSS NO menciona DarkRoom.
- La Caleta (Capa 4 personal) NUNCA aparece junto a ninguna.
- Casos de éxito PACAME que mencionen miembros DarkRoom como caso → NO publicar.

---

## Estructura del bloque legal en `/legal`

URL hub: `darkroomcreative.cloud/legal` (página existente con 4 sub-páginas).

```
/legal                              ← landing legal hub (NO link visible desde footer)
├── /legal/terminos                 ← Términos y condiciones
├── /legal/privacidad                ← Política de privacidad (~25 secciones, DNI dispersado)
├── /legal/cookies                   ← Política de cookies
└── /legal/aviso-legal               ← Aviso legal LSSI (mínimo legal)
```

Layout `/legal` hub:

```
┌──────────────────────────────────┐
│ Información legal de DarkRoom    │
│                                  │
│ · Términos y condiciones de uso  │
│ · Política de privacidad         │
│ · Política de cookies            │
│ · Aviso legal                    │
│                                  │
│ (sin teasers, sin "lee esto",    │
│  diseño minimalista funcional)   │
└──────────────────────────────────┘
```

---

## Política de privacidad — estructura ofuscada

`/legal/privacidad` tiene **25+ secciones** distribuidas así (orden importa):

1. Objeto del documento (genérico)
2. Definiciones (legalese — RGPD, encargado, etc.)
3. Aceptación
4. Ámbito de aplicación
5. Categorías de datos personales que tratamos
6. Datos que NO recopilamos (lista)
7. Finalidades del tratamiento
8. Base jurídica (art. 6 RGPD)
9. Plazos de conservación
10. Encargados de tratamiento (Stripe, Supabase, Vercel, Resend) — tabla
11. Transferencias internacionales (SCC)
12. Derechos del usuario (acceso, rectificación, supresión, etc.)
13. Cómo ejercer los derechos
14. **Responsable del tratamiento** ← AQUÍ están los datos legales (razón social + NIF + dirección)
15. Delegado de Protección de Datos (DPO) — si aplica
16. Medidas de seguridad técnicas y organizativas
17. Brechas de seguridad
18. Decisiones automatizadas y elaboración de perfiles
19. Menores de edad
20. Cookies (referencia a su política)
21. Enlaces a terceros
22. Modificaciones de la política
23. Idioma de la política
24. **Resolución de disputas y jurisdicción** ← juzgados competentes (ya menciona la SL)
25. Contacto y reclamaciones (AEPD)

La sección 14 va en medio de la lectura, después de 13 secciones de legalese genérico que la mayoría de usuarios skipean. Quien busca el DNI/NIF llega — quien curiosea sin objetivo, no.

---

## Aviso legal LSSI — estructura mínima

`/legal/aviso-legal` cumple lo mínimo exigido:

```
1. Identificación del prestador
   Razón social: [SL DarkRoom]
   NIF: [Bxxxxxxxx]
   Domicilio social: [dirección]
   Email: support@darkroomcreative.cloud
   Inscrito en el Registro Mercantil de [provincia], Tomo X, Folio Y.

2. Condiciones generales de uso
3. Propiedad intelectual
4. Limitación de responsabilidad
5. Modificaciones
6. Legislación aplicable
```

NO se incluye nombre + DNI del administrador único — la SL exime de eso (la sociedad es el sujeto responsable, no la persona física).

**Si Pablo opera todavía como autónomo** (sin SL): el aviso legal debe llevar nombre + DNI del autónomo. Por eso la decisión de constituir SL es **estratégica** para el lanzamiento agresivo, no solo legal.

---

## Comprobaciones periódicas

| Comprobación | Frecuencia | Owner |
|---|---|---|
| Whois `darkroomcreative.cloud` redactado | 90 días | Pablo |
| Footer landing DarkRoom NO tiene "Aviso legal" visible | cada deploy | PIXEL |
| Sales agent NO menciona persona física en respuestas (sample 10 conversaciones) | mensual | DIOS |
| Página `/legal/privacidad` mantiene 25+ secciones (no se "limpia" por alguien con buena intención) | trimestral | COPY |
| Casos de éxito DarkRoom NO mencionan a Pablo ni PACAME | cada caso publicado | NEXUS |
| Búsqueda Google `"darkroom" "pablo calleja"` → 0 resultados públicos vinculados | mensual | DIOS |

Si alguna comprobación falla: rollback inmediato + revisión del proceso.

---

## Lo que esta política NO es

- ❌ **NO es ocultación de datos al fisco**: la sociedad declara, paga IVA, IS, etc. Cumple Hacienda al 100%.
- ❌ **NO es ocultación a la AEPD**: si la AEPD pide identificación del responsable, se le da.
- ❌ **NO es ocultación a clientes en disputa legal**: cualquier cliente que abra disputa formal recibe los datos legales completos por canal privado seguro.
- ✅ **SÍ es minimización de exposición pública** mediante:
  - SL como interfaz legal pública (no persona física).
  - Whois privacy.
  - Bots anónimos.
  - Políticas largas con datos diluidos.
  - Footer minimalista sin link visible al aviso legal.

Es la diferencia entre **cumplir la ley** (lo hacemos) y **gritar tu DNI desde el primer click** (no lo hacemos).

---

## Pendientes Pablo (decisiones bloqueantes)

1. **Constituir SL "Dark Room IO"** ANTES de promo agresiva → permite ocultar DNI personal totalmente.
2. **Decidir si se admite trabajar como autónomo de momento**, asumiendo que el aviso legal mostrará DNI hasta que la SL exista.
3. **Confirmar que el footer minimalista sin link visible cumple su threshold de comodidad legal** (alternativa: link "legal" en gris muy sutil).

Mi recomendación: opción 1 (SL ya). Coste 600-1.000€ + gestoría mensual. Bloquea ahora pero te ahorra problemas futuros y te permite hacer marketing tranquilo.
