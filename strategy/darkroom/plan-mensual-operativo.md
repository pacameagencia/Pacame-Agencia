# DarkRoom — Plan Mensual Operativo Completo (Mes 0 → Mes 6)

> **Estado**: plan operativo vivo — se actualiza con datos reales al cierre de cada mes.
> **Fecha**: 2026-04-29.
> **Owner**: Pablo Calleja (CEO) + DarkRoom team.
> **Pre-requisitos leídos**: `positioning.md` · `flywheel-micronichos.md` · `landing-copy-v1.md` · `rrss-humanizadas-70-20-10.md`.

---

## Cómo se lee este plan

Cada mes tiene 4 bloques fijos:

1. **Objetivo cuantificable** (MRR, subs, afiliados, tráfico).
2. **Setup operativo** (qué desplegar, configurar, integrar).
3. **Calendario de contenido** semanal (LinkedIn / X / Instagram / TikTok).
4. **KPIs de control + decisiones de Pablo** (lo que solo él puede hacer).

Al final está el **programa de afiliados** completo (ver doc separado `programa-afiliados.md`).

Reglas duras que aplican TODO el plan:
- Cero menciones a PACAME en cuentas DarkRoom (regla `arquitectura-3-capas.md:96`).
- Voz de marca: directa, cómplice, honesta sobre el modelo membresía colectiva (ver `positioning.md`).
- Regla 70/20/10 (valor / BTS / pitch) en TODO el contenido.
- Cero dark patterns (popup oblige email, trial con tarjeta).

---

## MES 0 — Pre-lanzamiento (2 semanas)

**Objetivo**: tener todo listo para publicar el día 1 sin agujeros operativos.

### Setup operativo

| Tarea | Owner | Estado actual | Plazo |
|---|---|---|---|
| Deploy `paletas.darkroomcreative.cloud` (MVP listo en repo) | Pablo (vercel link) | 🟡 código listo | día 1 |
| Generar `og.png` + favicon DarkRoom con `imagen` Gemini | NOVA + Pablo | ⏳ pendiente | día 2 |
| Configurar Plausible Analytics en paletas + landing principal | CORE | ⏳ pendiente | día 3 |
| Email capture endpoint (Resend → Supabase Dark Room IO) | CORE | ⏳ pendiente | día 4 |
| Secuencia 5 emails post-captura (D0/D2/D5/D8/D12) cargada en Resend | COPY + CORE | ⏳ pendiente | día 5 |
| Vercel team transfer `dark-room` → `Dark Room IO` | Pablo | ⏳ pendiente | día 6 |
| Landing pública `darkroomcreative.cloud` con copy v1 | PIXEL + NOVA | ⏳ pendiente | día 7-10 |
| Crear cuentas RRSS DarkRoom (IG, TikTok, X, LinkedIn page) | Pablo | ⏳ pendiente | día 11 |
| Bio + foto perfil + linktree de cada cuenta | NOVA | ⏳ pendiente | día 12 |
| Subir 9 piezas pre-cargadas en cada plataforma (no publicar) | PULSE + COPY | ⏳ pendiente | día 13 |
| Programa afiliados: tabla SQL + tracking links + cookie 30d | CORE | ⏳ pendiente | día 14 |

### Contenido (NO publicar todavía)

Generar y dejar en buffer (pre-cargado en Buffer / Later / Notion):

- **9 posts educativos** (LinkedIn + X + IG carrusel) — bloque VALOR.
- **3 posts BTS** (Pablo desarrollando, screenshots reales, fallos honestos).
- **2 posts pitch suave** (DarkRoom existe, pero sin spam).

Ver `banco-contenido-mes-1.md` para piezas concretas listas para publicar.

### Decisiones de Pablo en Mes 0

1. **Cuántas plataformas activas el mes 1**: recomendación = empezar con **2** (X + LinkedIn). Añadir IG en mes 2, TikTok en mes 3. Evitar abrir 5 frentes y abandonar.
2. **Quién postea**: ¿Pablo en persona o agente automatizado con voz Pablo? Recomendación: Pablo escribe los hooks, el agente los pule. Híbrido.
3. **Estructura de comisión afiliados**: ver opciones en `programa-afiliados.md`. Recomendación: **30% recurrente del MRR del primer año + 50€ bonus por trial→paid**.

---

## MES 1 — Lanzamiento suave

**Objetivo**: 50 trial signups · 15 paid subs · ~440€ MRR · 1.500 visitas a landing · 200 emails capturados.

### Setup adicional

- Deploy micronicho **#4 Comparador alternatives** con 5 pares (Adobe vs Affinity, Figma vs Penpot, Photoshop vs Krita, Premiere vs DaVinci Resolve, Midjourney vs Flux).
- Lanzar **lifetime deal pre-launch** (100 plazas a 499€ lifetime) — embajadores + cashflow inicial.
- Activar primeros 3 afiliados invitados manualmente (creators del nicho que ya conoce Pablo).

### Calendario de contenido — Mes 1 semana a semana

#### Semana 1 (lanzamiento)

| Día | LinkedIn | X / Twitter | Instagram |
|---|---|---|---|
| Lun | Hilo "240€ vs 29€: la matemática del stack creativo" (VALOR) | Tweet "Hoy lanzo DarkRoom" + thread (BTS) | Carrusel "Por qué construí DarkRoom" (BTS) |
| Mar | Post recursos: 5 alternativas open-source que SÍ funcionan (VALOR) | Hilo "5 herramientas free que sustituyen Adobe" (VALOR) | Reel "Stack mensual de un creator que cobra 35€/h" (VALOR) |
| Mié | Caso real: "Lucia bajó de 240€ a 29€/mes" (PITCH 10%) | Tweet "Pregunta abierta: ¿qué te cuesta más, Adobe o el alquiler?" (VALOR) | Story Q&A en directo (BTS) |
| Jue | Opinión: "Por qué Adobe perdió a los freelance" (VALOR) | Hilo "El error de Adobe Creator Plan" (VALOR) | Post foto behind-the-scenes (BTS) |
| Vie | Reflexión semana lanzamiento (BTS) | Resumen aprendizajes lanzamiento (BTS) | Story "primeros 5 miembros, gracias" (BTS) |

#### Semana 2

| Día | LinkedIn | X | Instagram |
|---|---|---|---|
| Lun | Tutorial gratis: "extraer paleta de cualquier foto" (VALOR — link a paletas.darkroomcreative.cloud) | Hilo dato: "el stack creativo medio en España = 187€/mes" (VALOR) | Reel demo paletas tool (VALOR) |
| Mar | Recurso: "10 plantillas Notion gratis para freelance creativo" (VALOR) | Tweet conversación con otro creator (VALOR) | Story compartiendo opinión sobre Adobe Express (VALOR) |
| Mié | Estudio comparativo: "Figma Pro vs Penpot 2026" (VALOR — link a comparador) | Hilo "5 razones por las que pago Adobe aunque me duela" (VALOR) | Carrusel "5 herramientas IA que cobran 30€/mes" (VALOR) |
| Jue | Opinión afilada: "Open-source no es la respuesta para creators que facturan" (VALOR) | Tweet polémico "Adobe es Spotify Premium para diseñadores" (VALOR) | Reel mostrando stack DarkRoom (PITCH suave) |
| Vie | BTS: "primera factura de DarkRoom" (BTS) | Resumen semana 2 (BTS) | Story DM responses (BTS) |

#### Semana 3

| Día | LinkedIn | X | Instagram |
|---|---|---|---|
| Lun | Hilo: "Cómo pasé de pagar 240€/mes a 29€" — formato narrativo (VALOR) | Hilo numerado "10 lecciones tras 30 días de DarkRoom" (VALOR + BTS) | Reel "antes / después de mi setup" (BTS + VALOR) |
| Mar | Recurso descargable: "Excel cálculo ROI de tu stack creativo" (VALOR) | Tweet recurso: "tabla de precios stack creativo 2026" (VALOR) | Carrusel "Mi flujo Adobe → DarkRoom en 3 pasos" (VALOR) |
| Mié | Caso real con datos: "X miembro pasó de freelance esporádico a 2.000€/mes" (PITCH) | Conversación con creator del nicho (VALOR) | Story sondeo "¿cuál es tu mayor gasto creativo?" (VALOR) |
| Jue | Reflexión: "Cuando vender no es vender" (BTS) | Hilo educativo "qué es realmente una membresía colectiva" (VALOR) | Reel rápido "tip extracción colores" (VALOR) |
| Vie | Resumen + agradecimiento primera comunidad (BTS) | Tweet de cierre semana (BTS) | Story comunidad creciendo (BTS) |

#### Semana 4

| Día | LinkedIn | X | Instagram |
|---|---|---|---|
| Lun | Hilo: "Errores en el lanzamiento" (BTS) | Hilo "¿por qué tan poca gente cuestiona Adobe?" (VALOR) | Reel "el día que me dijeron 'eso es ilegal'" (BTS) |
| Mar | Recurso: "Plantilla brief creativo gratis" (VALOR) | Tweet de un caso real DM (PITCH) | Carrusel "preguntas que me hacéis (y respondo todas)" (VALOR) |
| Mié | Análisis: "qué stack usan los top creators 2026" (VALOR) | Hilo "lo que aprendí gestionando 50 miembros" (VALOR + BTS) | Reel demo otro tool (VALOR) |
| Jue | Resumen mes 1 con datos reales (BTS) | Resumen mes 1 (BTS) | Carrusel "30 días después: lo que ha pasado" (BTS) |
| Vie | Pitch directo: "membresía abierta hasta domingo" (PITCH) | Tweet pitch limpio + link landing (PITCH) | Story con countdown (PITCH) |

### KPIs Mes 1

| Métrica | Objetivo | Cómo medir |
|---|---|---|
| Visitas a landing | ≥ 1.500 | Plausible |
| Emails capturados (paletas + landing) | ≥ 200 | Supabase + Resend |
| Trials iniciados | ≥ 50 | Stripe |
| Trials → Paid | ≥ 30% (15 paid) | Stripe |
| MRR fin de mes | ≥ 440€ | Stripe |
| Lifetime deals vendidos | ≥ 8 | Stripe |
| Followers IG/X/LinkedIn agregado | ≥ 600 | Nativo |
| Engagement rate medio | ≥ 4% | Plausible + Buffer |

---

## MES 2 — Validación + escalado de contenido

**Objetivo**: 100 trial · 30 paid · 870€ MRR · primer afiliado activo factura · 4.000 visitas mes.

### Setup adicional

- Deploy micronicho **#1 Paletas** mejorado (email capture funcionando + analytics).
- Deploy micronicho **#3 Hooks Virales** (LLM cheap tier).
- Activar Instagram como tercera plataforma.
- Programa afiliados público (cualquiera se puede registrar via formulario).

### Calendario de contenido

Mantiene la regla 70/20/10 con ajustes:

- Más BTS de **resultados de los primeros miembros** (con permiso, anonimizados si hace falta).
- Más colaboraciones con creators (citarlos, taggearlos en posts).
- **1 webinar gratis** mes 2: "Cómo bajar tu stack creativo de 240€ a 29€/mes en 1 hora" → captura emails + cierra trials.

Frecuencia recomendada:
- LinkedIn: 5 posts/semana (mantenido)
- X: 12-15 tweets/semana + 2-3 hilos
- Instagram: 3 posts + 5 stories/día

### KPIs Mes 2

| Métrica | Objetivo |
|---|---|
| Visitas mes | ≥ 4.000 |
| Emails capturados acumulados | ≥ 700 |
| Trials nuevos | ≥ 50 (acumulado 100) |
| Paid totales | ≥ 30 |
| MRR | ≥ 870€ |
| Afiliados activos | ≥ 5 |
| Primer afiliado en facturar comisión | ≥ 1 |
| NPS encuesta primer mes miembros | ≥ 35 |

---

## MES 3 — Aceleración + afiliados activos + paid Ads

**Objetivo**: 60 paid · 1.740€ MRR · 12 afiliados activos · 8.000 visitas mes · primer mes con paid Ads.

### Setup adicional

- Deploy micronicho **#5 Prompts Pulidos** (recompacta concepto PromptForge).
- **Activar Paid Ads** (Meta + TikTok + Google) con presupuesto inicial 500€/mes. CAC objetivo <30€.
  - Meta: lookalike de los emails capturados.
  - TikTok: creators-look-alike audience.
  - Google: keywords de cola larga ("alternativa adobe creative cloud", "figma compartido").
- Lanzar **programa afiliados público** + outreach a 30 creators del nicho (lista en `programa-afiliados.md`).

### Calendario de contenido

- Doblar producción de Reels/TikTok (de 1/sem a 3/sem).
- 2 colaboraciones con creators del nicho (entrevistas o invitados).
- 1 webinar mensual fijo el primer jueves del mes.

### KPIs Mes 3

| Métrica | Objetivo |
|---|---|
| MRR | ≥ 1.740€ |
| Paid totales | ≥ 60 |
| Afiliados activos | ≥ 12 |
| % paid via afiliados | ≥ 25% |
| CAC pagado | ≤ 30€ |
| ROAS primer mes Ads | ≥ 1.5x |
| Webinar registrants | ≥ 80 |
| Webinar → trial conversion | ≥ 20% |

---

## MES 4-6 — Optimización + escalado

**Objetivo final mes 6**: ≥ 200 paid · ≥ 5.000€ MRR · ≥ 30 afiliados activos · 15.000 visitas mes.

### Setup adicional

- Deploy micronichos restantes: **#2 Mockup batch** + **#6 Carruseles IA**.
- Iterar landing tras datos reales (variantes A/B en hero).
- Reinvertir 30% del MRR en Ads (escalar el que mejor convierta).
- Constituir SL DarkRoom (cuando MRR > 1k€) → trasladar contratos.
- Considerar **Black Friday early access** noviembre (1er año Pro a 199€).

### Roadmap de contenido

- Sprint editorial trimestral en lugar de mensual (calendario más amplio).
- 1 video largo YouTube/mes (tutoriales reales: "cómo edito en Photoshop sin pagar Adobe").
- 1 newsletter semanal (sustituye email blast).
- Programa **embajadores VIP** (los top 5 afiliados → comisión vitalicia 40%).

### KPIs Mes 4-6 (acumulado)

| Métrica | Objetivo Mes 6 |
|---|---|
| MRR | ≥ 5.000€ |
| Paid totales activos | ≥ 200 |
| Afiliados activos (con ≥ 1 venta) | ≥ 30 |
| Embajadores VIP | ≥ 5 |
| % MRR via afiliados | ≥ 40% |
| Visitas mes (orgánico + ads + tools) | ≥ 15.000 |
| Churn mensual | ≤ 8% |
| LTV / CAC | ≥ 3 |
| NPS | ≥ 40 |

---

## Calendario condensado de hitos

```
MES 0 — pre-lanzamiento (2 sem)
├── Deploy paletas + landing + secuencia email
├── Crear cuentas RRSS + bio + 9 posts buffer
└── Estructura afiliados en Supabase

MES 1 — lanzamiento suave
├── 2 plataformas activas (X + LinkedIn)
├── Lifetime deal pre-launch 100 plazas
├── 3 afiliados invitados manualmente
└── KPI: 15 paid · 440€ MRR

MES 2 — validación
├── Activar Instagram (3ª plataforma)
├── Deploy micronicho #1 mejorado + #3 (hooks)
├── Programa afiliados público
├── 1er webinar
└── KPI: 30 paid · 870€ MRR

MES 3 — aceleración
├── Paid Ads 500€/mes (Meta + TikTok + Google)
├── Deploy #5 (prompts)
├── Outreach 30 creators afiliados
└── KPI: 60 paid · 1.740€ MRR

MES 4-6 — escalado
├── Deploy #2 + #6 (mockup batch + carruseles)
├── Activar TikTok como 4ª plataforma
├── Constituir SL DarkRoom
├── Black Friday early access
├── Programa embajadores VIP top 5
└── KPI mes 6: 200 paid · 5.000€ MRR · 30 afiliados activos
```

---

## Reglas duras a respetar TODO el plan

1. **Cero menciones a PACAME** en cuentas y contenido DarkRoom.
2. **Cero dark patterns**: popup oblige email, trial con tarjeta, "cancela contactando soporte".
3. **70/20/10 inquebrantable**: si en una semana hay >2 pitch directos, paramos pitch hasta restaurar ratio.
4. **Honestidad sobre el modelo**: comunicamos "membresía colectiva", explicamos zona gris, no prometemos imposibles.
5. **Cero promesas falsas a afiliados**: si tu link genera 0€, recibes 0€. No commission inflation.
6. **Reembolsos pro-rata** sin discusión si alguien cancela en <7 días.
7. **Soporte humano** en español <24h Pro / <12h Studio.
8. **Capa 4 (La Caleta) y Capa 1 (PACAME) NUNCA aparecen** asociadas a DarkRoom.

---

## Lo que NO entra en este plan (decisión consciente)

- ❌ YouTube como canal principal hasta mes 4 (consume mucho tiempo, retorno lento).
- ❌ Podcast propio (mismo motivo).
- ❌ Eventos presenciales año 1 (caros, ROI no validado).
- ❌ Press releases o noticias en medios mainstream (riesgo legal del modelo).
- ❌ Contratar humanos hasta MRR > 5.000€ (Pablo + agentes IA cubren todo).

---

**Próxima revisión**: cierre Mes 1 (datos reales vs objetivo). Si MRR < 200€ a final mes 1 → revisar positioning + cambiar canal de captación. Si MRR > 600€ → adelantar Paid Ads al Mes 2.
