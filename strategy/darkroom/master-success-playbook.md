# DarkRoom — Master Success Playbook

> **Estado**: meta-plan estratégico vivo encima del plan operativo M0-M6.
> **Fecha**: 2026-04-29.
> **Owner**: Pablo Calleja (CEO) + agentes IA.
> **Pre-requisitos leídos**: los 6 docs de `strategy/darkroom/` + `PacameCueva/04-Workflows/santo-grial-visual.md`.
> **Para qué sirve**: ver TODOS los escenarios posibles de éxito de DarkRoom, apalancar el conocimiento del Santo Grial Visual sobre cada eje del plan operativo, e identificar qué notebooks adicionales hay que incorporar para tapar los huecos críticos.

---

## §1 — Norte estratégico

### One-liner del éxito (norte mes 12)

> **200 paid · 5.000 €/mes MRR · 30 afiliados activos · 40% del MRR vía afiliados · churn ≤ 8% · sin contratar humanos · sin levantar capital · modelo gris bajo radar.**

Si en mes 12 está cumplido, DarkRoom es éxito. Si excede 5.000 €/mes con churn ≤ 8% se considera la primera contratación humana (operativo cliente, no marketing — Pablo + agentes siguen cubriendo growth).

### 3 fronteras innegociables

1. **Cero menciones a PACAME** en cuentas, copy, UI, ads, landing, emails, RRSS, soporte. Regla `arquitectura-3-capas.md` línea 96. La Caleta y Ecomglobalbox tampoco.
2. **Cero dark patterns**: nada de tarjeta para trial, nada de "cancela hablando con soporte", nada de popups que obligan email. Refunds pro-rata sin discusión.
3. **Honestidad sobre el modelo**: comunicamos "membresía colectiva", explicamos zona gris en términos de uso, no prometemos imposibles. Anti-promesas explícitas en `positioning.md:194`.

### 4 palancas multiplicadoras

1. **Creators afiliados** — 30% recurring año 1 + 50€ bonus. Objetivo M6: 30 activos generando ≥40% MRR.
2. **Micronichos SEO** — 6 tools gratis como puerta funnel. Objetivo M6: 8.000-15.000 visitas/mes orgánicas.
3. **Contenido 70-20-10** — voz directa, valor real, BTS honesto, pitch puntual. 5 piezas/sem LinkedIn + 12-15/sem X + 3+5 stories/día IG desde M2.
4. **Lifetime deals + Black Friday** — 100 plazas a 499€ pre-launch (cashflow + embajadores semilla) + Black Friday año 1 Pro 199€ (vs 348€).

### Constraint duro

Pablo solo + agentes IA cubren: estrategia, copy, ads, comunidad, soporte, dev, ops. **Nada de hires hasta MRR > 5.000 €/mes**. El equipo es el cerebro PACAME entero (DIOS + 9 agentes + 120 sub-especialistas + 374 skills). Si llega un cuello de botella humano, primero se intenta automatizar; sólo si eso falla, se considera hire.

---

## §2 — Línea base auditada

### Estado real por capa al 2026-04-29

| Capa | Estado | Evidencia | Qué falta |
|---|---|---|---|
| **Estrategia** | ✅ Completa | 6 docs strategy/darkroom/ (1487 líneas commit `46dd35b`) | Nada — base sólida para 6 meses |
| **Producto: paletas MVP** | ✅ Código listo | Repo separado `dark-room` con micronicho #1 buildado | Deploy `paletas.darkroomcreative.cloud` + email capture + Plausible |
| **Producto: micronichos #2-#6** | ❌ No buildados | flywheel-micronichos.md describe los 6, sólo #1 existe | ~120h dev. M2 deploys #1 mejorado + #3, M3 deploy #5, M4-6 deploy #2 + #6 |
| **Producto: web app suscripciones** | ⚠️ Por verificar | Stripe MCP integrado en infra PACAME pero no confirmada infra DarkRoom independiente | Auth Supabase `dark-room-prod` + planes Stripe live + checkout flow + onboarding miembro |
| **Marketing: banco contenido** | ⚠️ Mes 1 listo, M2-6 vacío | banco-contenido-mes-1.md tiene 60+ piezas LinkedIn+X | Bancos M2 (con IG), M3 (con TikTok), M4-6 + plantillas reusables Santo Grial |
| **Marketing: ads playbook** | ❌ Vacío | Plan dice "M3 activar Ads 500€/mes" sin tactic deep | Testing matrix Meta+TikTok+Google + audience structure + scaling rules + creative ops |
| **Marketing: webinars** | ⚠️ Diseño conceptual | Plan menciona 1 webinar/mes desde M2 | Funnel webinar end-to-end (registro → recordatorios → live → replay → trial) |
| **Afiliados** | ⚠️ Schema diseñado | programa-afiliados.md schema SQL completo + 30 candidatos + 5 plantillas copy | Migration aplicada + endpoints `/api/affiliate/*` + dashboard afiliado + outreach M1-2 |
| **Comunidad** | ❌ No existe | Plan no menciona discord/slack/eventos | Discord DarkRoom M2 + sistema eventos M3 + retention loops comunitarios |
| **Retention/Lifecycle** | ❌ Vacío | Secuencia 5 emails diseñada conceptualmente, sin Resend conectado | Resend integrado + 5 emails post-captura + secuencia post-trial 30/60/90 + dunning + win-back |
| **Onboarding miembro** | ❌ Vacío | No hay flow producto definido | First-7-days quick wins + activación + primer logro |
| **Legal/Compliance** | ❌ Vacío | Modelo gris sin playbook de defensa preparado | plan-b-opensource.md + comms PR pre-cocinados + ToS analysis Stripe + GDPR |
| **Analytics** | ⚠️ Parcial | Plausible mencionado pero no integrado, eventos custom sin definir | Plausible + custom events conversión + dashboard MRR Stripe + export semanal Pablo |
| **Branding visual** | ⚠️ Voz definida, visual pendiente | NOVA tiene voz definida positioning.md:84, paleta + tipo pendiente | Identidad visual + og.png + favicon + sistema visual aplicado a 6 micronichos |

### Capas verdes (ready-to-go)

Sólo **estrategia**. Todo lo demás está en algún punto del rojo-amarillo. El plan asume que mes 0 cierra ✅ producto paletas + ⚠️ web app + ⚠️ analytics + ⚠️ afiliados schema y M1 arranca con esos 4 cubiertos.

### Capas críticas que el plan operativo M0-M6 actual NO cubre con suficiente profundidad

- **Lifecycle email post-trial** (D14-D90).
- **Discord/comunidad** como producto, no añadido.
- **Ads operacional** (M3 activación).
- **Plan B legal** y comms PR pre-cocinados.
- **Onboarding 7-day quick wins** del miembro.

Los 5 notebooks priorizados de §7 cubren exactamente estos 5 huecos.

---

## §3 — Los 9 escenarios + black swans

Cada escenario lleva probabilidad estimada, indicadores tempranos cuantificables, trigger de cambio, jugada pre-cocinada, métrica de salida y skill PACAME responsable.

### Escenario 1 — Realista, slow but steady (probabilidad 50%)

**Resumen**: M1 cumple 15 paid · 440€ MRR. M3 cumple 60 paid · 1.740€ MRR. M6 cumple 200 paid · 5.000€ MRR. Conversión trial→paid 30%, churn 8-10%, CAC pagado <30€ desde M3, mix orgánico 60% / ads 40%.

**Indicadores tempranos**:
- Mes 1 cierra con ≥ 50 trials, ≥ 15 paid, ≥ 200 emails capturados.
- Mes 2 cierra con ≥ 30 paid acumulados y ≥ 5 afiliados activos.
- Mes 3 ROAS Ads ≥ 1.5x con CAC ≤ 30€ desde semana 4.

**Trigger de revisión**: si en mes 1 paid < 10 → re-evaluación (saltar a Escenario 3 conservador). Si en mes 1 paid > 25 → upside (preparar Escenario 2).

**Jugada pre-cocinada (= ejecución del plan operativo M0-M6 tal como está)**:
- M0-M1: ejecutar `plan-mensual-operativo.md` semana a semana sin desviación.
- M2: añadir IG + 1er webinar + abrir afiliados públicos.
- M3: activar Ads con framework BSC (notebook 3) + outreach 30 creators.
- M4-6: escalar Ads, Black Friday, embajadores VIP.

**Métrica de salida**: MRR mes 6 entre 4.500 € y 5.500 €. Si dentro de banda → escenario cumplido, plan año 2 (escalar a 15k € MRR).

**Skill PACAME**: NEXUS (growth) + COPY (banco semanal) + PULSE (programación) + LENS (KPIs).

---

### Escenario 2 — Hyperviral creator wave (probabilidad 12%)

**Resumen**: 1 creator top (≥ 200k followers nicho creativo hispano) entra en mes 2-3 y mete 30-80 paid en una semana. MRR salta a 3-5k € en M3 sin paid Ads.

**Indicadores tempranos**:
- Pico de tráfico orgánico ≥ 10x baseline en 48h.
- Spike de conversiones desde 1 sólo `?ref=` en `affiliate_clicks`.
- Soporte recibe ≥ 50 tickets en 1 semana mencionando 1 mismo creator.

**Trigger de cambio**: ≥ 25 paid en 7 días concentrados en 1 ref slug.

**Jugada pre-cocinada**:
1. Confirmar capacidad técnica del stack (Adobe/Figma rotación, no quemar cuentas) — protocolo de capacity check pre-aprobación signups.
2. Pause temporal Ads (no desperdiciar) hasta digerir wave.
3. Oferta personalizada al creator viral: comisión vitalicia 40% + acceso a producto roadmap (embajador VIP anticipado).
4. Activar **community onboarding intensivo** (Discord ya creado en M2 — ver notebook 4) para retener wave (riesgo: vienen frío, churn 20%+ si no hay belonging).
5. PR controlado: mensaje preparado para preguntas medios sobre el modelo.

**Métrica de salida**: 70%+ de la wave sigue activa a 60 días. Si <50%, churn fuera de límite → ir a Escenario 9 retention crisis.

**Skill PACAME**: SAGE (decisión estratégica) + NEXUS (oferta creator) + CORE (capacity) + COPY (PR pre-cocinado).

---

### Escenario 3 — Conservador orgánico puro (probabilidad 18%)

**Resumen**: Pablo decide no activar paid Ads en M3 (caja, miedo, falta de bandwidth). MRR estancado entre 1.000 y 2.000 € hasta M6. 60-100 paid totales.

**Indicadores tempranos**:
- M3 cierra con < 25 paid (vs objetivo 60).
- Visitas orgánicas estancadas en 3.500-4.500/mes (no escala con sólo 3 plataformas).
- 0 afiliados activos en M2.

**Trigger de cambio**: si M3 < 30 paid Y caja DarkRoom < 1.500€ → activar Escenario 3 oficialmente.

**Jugada pre-cocinada**:
1. **Doblar producción contenido orgánico** con plantillas reusables Santo Grial (carrusel canónico 10 slides + reel black-video lip-sync) para no bajar de 7 piezas/sem.
2. **Acelerar deploy micronichos #2 + #6** (mockup batch + carrusel IA) → más puertas SEO.
3. **Outreach manual afiliados** intensivo (5 candidatos/sem × 6 sem = 30 contactos) en lugar de outreach + ads.
4. **Webinar quincenal** en lugar de mensual.
5. Lifetime deal "second wave" — 50 plazas a 599€ para inyectar caja sin endeudarse.
6. Mantener guardrails (CAC > 60€ blocker sigue activo si más adelante se prueban Ads).

**Métrica de salida**: M6 con ≥ 100 paid · ≥ 2.500 € MRR. Si <1.500 € MRR M6 → revisar viabilidad o pivot.

**Skill PACAME**: ATLAS (SEO escala) + PULSE (contenido alto volumen) + COPY (banco M2-M6) + NEXUS (afiliados outreach).

---

### Escenario 4 — Adobe / Figma detectan modelo y bloquean (probabilidad 8%, impacto crítico)

**Resumen**: Adobe Legal o Figma envían cease-and-desist o suspenden 2-3 cuentas master gestionadas por DarkRoom en mismo mes. Riesgo existencial.

**Indicadores tempranos**:
- ≥ 2 cuentas master suspendidas en 30 días con razón "compartir / multi-IP".
- Email de Adobe Legal mencionando ToS específico DarkRoom.
- Aumento ≥ 40% en bounces de proveedores stack (saltones SMS, captchas masivos, bloqueos geo).
- Aparición de DarkRoom en Reddit/HN con mención "esto es ilegal".

**Trigger de cambio**: 1 cease-and-desist confirmada Y/O 2 cuentas master suspendidas en mismo mes.

**Jugada pre-cocinada**:
1. **Pause inmediato signups nuevos (24h)** — endpoint `POST /api/signups/disable` con kill switch en variable env Vercel.
2. **Comunicado a miembros activos** (email + dashboard banner): refund pro-rata + acceso 30d gracia + camino a plan B sin fricción.
3. **Activar Plan B "stack opensource gestionado"**: GIMP + Krita + DaVinci Resolve + Penpot + Flux self-hosted + Ollama → 19€/mes con soporte y cuestiones legales 100% limpias. Doc anexo `plan-b-opensource.md` (a crear con notebook 5).
4. **Reposicionamiento landing** (24-48h): de "stack premium colectivo" a "stack opensource gestionado para creators que no quieren pagar 240€/mes a Adobe". Copy ya preparado en cajón.
5. **Comms PR**: declaración pública asumiendo riesgo, transparencia total, agradeciendo comunidad. Post LinkedIn Pablo en primera persona, tono "lo arriesgué, no funcionó así, ahora vamos al plan B sólido".
6. **Refund automático** miembros que no quieran plan B (esperado 40-60% éxodo).
7. **Mantener afiliados en pausa** comisiones del último mes pre-evento + comms personal a cada uno.

**Métrica de salida**: <30% churn definitivo en transición + base mantenida ≥ 100 miembros plan B + 0 demandas legales escaladas. Ratio cash recovery ≥ 50% del MRR pre-evento.

**Skill PACAME**: SAGE (pivot estratégico) + COPY (comms PR) + CORE (kill switch + plan B tech) + LENS (tracking transición).

**NOTA CRÍTICA**: Plan B exige notebook 5 (Modelos legales gris SaaS) ANTES de necesitarse. Sin notebook 5 = plan B improvisado = churn >70% = cierre.

---

### Escenario 5 — Competidor copia el modelo en LATAM/España (probabilidad 6%)

**Resumen**: aparece otro grupo (probablemente operado desde Argentina, México, o España) ofreciendo lo mismo a precio menor (15-20€/mes) o agresivo en marketing.

**Indicadores tempranos**:
- Aparición de competidor visible en búsquedas keyword DarkRoom.
- Caída CTR ads Google en keyword "alternativa adobe creative cloud" del 40%+.
- Afiliados reportan "ya hay otro" en outreach.
- Spike de cancelaciones citando precio del competidor.

**Trigger de cambio**: competidor con > 50 visitas/día detectado en SimilarWeb / SEMrush.

**Jugada pre-cocinada**:
1. **No competir por precio**. DarkRoom mantiene 29€/mes Pro. Posicionamiento se refuerza en "transparencia + soporte español + jurisdicción europea + comunidad real".
2. **Doblar inversión comunidad** (Discord eventos, AMAs Pablo, retention loops) — la comunidad es el moat (notebook 4).
3. **Acelerar producto exclusivo**: deploy todos micronichos restantes en 6 sem + 1 feature exclusiva DarkRoom (e.g. plugin Figma "DarkRoom assets" ó plantillas mensuales premium).
4. **Outreach embajadores VIP** (top 5 afiliados → 40% lifetime + acceso roadmap) para crear lock-in de creators.
5. **Análisis competidor profundo**: dump completo de su modelo, pricing, ToS, vulnerabilidades (¿soporte? ¿uptime? ¿transparencia?). Aprovechar gaps en copy Y posts BTS.
6. **Programa "embajadores VIP" público** — top 5 afiliados → 40% comisión vitalicia + acceso a roadmap. Lock-in.

**Métrica de salida**: churn no excede +3 puntos sobre baseline + cuota visible en SEO mantenida + 0 fuga embajadores VIP.

**Skill PACAME**: SAGE (análisis competitivo) + NOVA (diferenciación visual) + PULSE (comunidad) + COPY (anti-narrativa).

---

### Escenario 6 — Single-creator dependency (probabilidad 15% dado Escenario 1)

**Resumen**: 1 afiliado representa ≥ 40% del MRR mes 4-5. Dependencia tóxica.

**Indicadores tempranos**:
- 1 `affiliate_id` con > 30% del MRR en 2 meses consecutivos.
- 1 creator pide condiciones especiales (más comisión, exclusividad, beta).
- Caída de 1 sola pieza viral del creator → caída visible en signups.

**Trigger de cambio**: 1 afiliado > 35% del MRR durante 2 meses.

**Jugada pre-cocinada**:
1. **Diversificar outreach**: añadir 10 candidatos nuevos al outreach M5-6 (notebook 2).
2. **Subir comisión a otros afiliados activos** temporalmente para incentivar push (15% extra durante 60 días).
3. **No regalar exclusividad** al creator dominante. Mantener oferta estándar 30%+50€.
4. **Preparar comms** por si el creator se va: 5 plantillas pre-cocinadas + plan de re-conversión por email a esa cohort de miembros via Pablo en persona.
5. **Renegociar quietamente**: ofrecer al creator dominante embajador VIP (40% lifetime) a cambio de 12 meses compromiso de promoción (no exclusividad).

**Métrica de salida**: en 60 días, ningún afiliado > 25% MRR. Si no se logra, plan B = preparar adquisición/contratación del creator como partner equity.

**Skill PACAME**: NEXUS (diversificación) + SAGE (negociación) + COPY (comms recovery).

---

### Escenario 7 — PR negativo / artículo viral acusatorio (probabilidad 4%, impacto reputacional)

**Resumen**: Periodista de Genbeta, Xataka, El País Tecnología, Hipertextual o similar publica artículo "DarkRoom es ilegal / es Adobe pirata maquillado". Comparte virally en LinkedIn/X. Picos negativos.

**Indicadores tempranos**:
- Mención DarkRoom en medio mainstream con tono crítico.
- Spike negativo en menciones X/LinkedIn.
- Afiliados activos preguntan "¿esto es legal?" en privado.
- Cancelaciones citando "vi un artículo".

**Trigger de cambio**: 1 artículo viral con > 5k shares + sentimento mayoritariamente negativo.

**Jugada pre-cocinada**:
1. **No silencio, no defensiva**. Respuesta pública en 24h, tono honesto, sin atacar al periodista. Pablo en primera persona LinkedIn + X. Tono: "tienes razón en X, te corrijo en Y, esto es lo que hacemos exactamente".
2. **Transparency dump**: post detallado en blog DarkRoom explicando modelo legal, ToS interpretación, jurisdicción, cómo gestionamos cuentas, cómo asumo el riesgo. Material ya preparado en cajón.
3. **Llamar al periodista**: ofrecer entrevista directa Pablo. La mayoría de periodistas tech españoles aceptan rectificar / matizar si tienen acceso a fundador.
4. **Comunicar a comunidad**: email a miembros + Discord post + AMA Pablo en directo en 7 días.
5. **Activar afiliados embajadores VIP** para que defiendan modelo desde sus canales (no astroturfing — defensa honesta y opcional).
6. **Monitorear churn semanal** en lugar de mensual durante 60 días.

**Métrica de salida**: spike de churn < 2x baseline durante 30 días + recuperación a baseline en 60 días + ningún afiliado VIP rompe relación.

**Skill PACAME**: COPY (PR + entrevista) + SAGE (estrategia comms) + LENS (monitoreo sentimiento).

---

### Escenario 8 — Internacionalización temprana LATAM (probabilidad 25%, oportunidad upside)

**Resumen**: Tráfico orgánico desde México, Argentina, Colombia, Chile representa > 30% en M3-M4 (ICP secundario `positioning.md:46`). Oportunidad de pivotear marketing 30% a LATAM.

**Indicadores tempranos**:
- > 30% del tráfico Plausible viene de LATAM en M3.
- > 20% de los emails capturados son de LATAM.
- Conversión LATAM trial→paid igual o superior a España (ICP encaja).

**Trigger de cambio**: M3 cierra con > 25% MRR generado por usuarios LATAM.

**Jugada pre-cocinada**:
1. **Localizar landing** a español neutro / variantes regionales (no traducir, adaptar). Pricing en USD opcional para LATAM (29€ ≈ 32 USD, mantenemos cuota).
2. **Outreach 10 creators LATAM** específicamente (notebook 2 — sub-lista regional).
3. **Adaptar precios LATAM**: plan Pro 29€ se mantiene, pero crear plan "LATAM Starter" en 12€/mes (sólo Adobe básico + Figma + 1 IA) para penetrar mercado donde 29€ aún es alto.
4. **Pago vía PayPal** activado (más usado en LATAM que SEPA).
5. **Webinar dedicado LATAM** en M4 con horario MX/AR.
6. **Casos reales LATAM** en banco contenido M4-6 (testimonials de México y Argentina con fotos, datos).

**Métrica de salida**: 30% del MRR de M6 viene de LATAM y CAC LATAM ≤ 25€.

**Skill PACAME**: SAGE (estrategia regional) + COPY (localización) + NEXUS (creators LATAM) + CORE (Stripe multi-currency).

---

### Escenario 9 — Churn alto > 12%/mes desde M3 (probabilidad 20%, riesgo producto)

**Resumen**: el modelo no retiene. Miembros pasan trial → paid pero cancelan en 30-60 días. NPS < 30. Razones reportadas: "no uso suficiente", "problemas de acceso intermitente", "esperaba más comunidad".

**Indicadores tempranos**:
- Churn mes 3 > 12% (vs objetivo ≤ 8%).
- NPS encuesta primer mes < 30 (vs objetivo ≥ 35).
- > 30% cancelaciones citan "problemas técnicos" en exit survey.
- Average time-to-cancel < 45 días.

**Trigger de cambio**: 2 meses consecutivos churn > 10% Y NPS < 30.

**Jugada pre-cocinada**:
1. **Freeze nuevos signups** (banner landing "lista de espera") durante 30 días — concentrar bandwidth en retention crisis.
2. **Calls 1-on-1** Pablo con últimos 30 cancelados + 30 activos low-engagement → root cause analysis. Codificar reasons.
3. **Implementar onboarding intensivo 7-day** (notebook 1 + notebook 4): D0 quick win + D2 first achievement + D5 community welcome + D7 milestone celebration.
4. **Retention emails post-trial** (notebook 1): D14 check-in personal Pablo, D30 expansion offer (upgrade Studio), D60 win-back si churneo.
5. **Mejorar uptime**: si churn técnico, doble revisión proveedores stack + redundancia + comunicación proactiva incidentes.
6. **Activar Discord** YA si no existe (notebook 4) — el "no comunidad" es un dolor reportado real.
7. **Pausar Ads** hasta retention > 92%.

**Métrica de salida**: churn baja a ≤ 8% en 60 días + NPS recupera a ≥ 35.

**Skill PACAME**: PULSE (comunidad emergencia) + COPY (retention emails) + CORE (uptime) + LENS (root cause + cohort analysis).

---

### Tabla resumen escenarios

| # | Escenario | Probabilidad | Tipo | MRR M6 esperado | Acción primaria |
|---|---|---|---|---|---|
| 1 | Realista slow but steady | 50% | Base case | 5.000 € | Ejecutar plan operativo M0-M6 |
| 2 | Hyperviral creator wave | 12% | Best case | 6.000-9.000 € | Capacity check + comunidad intensiva |
| 3 | Conservador orgánico puro | 18% | Downside soft | 2.500 € | Doblar contenido + acelerar micronichos |
| 4 | Adobe / Figma detectan | 8% | Black swan crítico | 1.500-2.500 € (plan B) | Pause + plan B opensource + comms |
| 5 | Competidor copia | 6% | Defensa competitiva | 4.000-5.000 € | No competir precio + comunidad + diferenciación |
| 6 | Single-creator dependency | 15%* | Riesgo concentración | depende | Diversificar afiliados + embajador VIP |
| 7 | PR negativo viral | 4% | Black swan reputacional | 3.500-4.500 € | Respuesta 24h + transparency dump |
| 8 | Internacionalización LATAM | 25%* | Upside lateral | 5.500-7.000 € | Localizar + creators LATAM + LATAM Starter |
| 9 | Churn alto producto | 20% | Riesgo producto | 2.000-3.500 € (degradado) | Freeze + onboarding + Discord + retention |

\* Probabilidad condicional (dado que Escenario 1 esté sucediendo).

Suma probabilidades > 100% porque varios escenarios no son mutuamente excluyentes (LATAM + Realista; Single-creator dependency + Realista; PR negativo + Realista).

---

## §4 — Santo Grial aplicado al plan operativo

Mapping concreto: para cada eje de contenido / producción del plan operativo M0-M6, qué dump del Santo Grial alimenta la pieza, con preset esperado.

### §4.1 Tabla cruz contenido × Santo Grial

| Mes / sem | Plataforma | Tipo pieza | Santo Grial input | Preset esperado |
|---|---|---|---|---|
| M0 día 13 | LinkedIn / X / IG | 9 piezas pre-cargadas buffer | `00-overview.md` (alto nivel patrón) + `04-prompts.md` (frameworks ASPECT/PAS/4-Step Viral) | Hooks layered, 70/20/10 respetado |
| M1 sem1 lun | LinkedIn | Hilo "240€ vs 29€" | `04-prompts.md` framework PAS + `09-frameworks-acronimos.md` ROSAS | 7 tweets max, dato concreto en cada uno, CTA discreto |
| M1 sem1 lun | X | Thread lanzamiento | `06-virality-hooks.md` layered hook + open loops | 5 tweets, hook contradictorio slide 1 |
| M1 sem1 lun | IG | Carrusel "Por qué construí DarkRoom" | `11-carruseles-reels.md` estructura 10 slides Hook→Setup→Reframe→Value×2→Update→Climax→Save→CTA + `01-modelos-imagen.md` (Nano Banana Pro / Imagen FX) | 4:5 1080×1350, cover 80%, sin wall of text |
| M1 sem1-4 | IG | Reel demo paletas tool | `02-modelos-video.md` Veo 3.1 oscuro cinematográfico + `06-virality-hooks.md` retention dopamine cuts + `05-audio-tts-musica.md` ducking -20dB | 9:16, 8-12s, loop seamless, captions Thrive/Poppins shadow+glow+fade-in 0.2s |
| M1 sem4 | LinkedIn | Carrusel "preguntas que me hacéis" | `11-carruseles-reels.md` + `07-anti-patterns.md` (evitar wall of text + AI loop + estilos contradictorios) | 7-10 slides, 1 idea/slide |
| M2 sem1 | IG | Reels "casos primeros miembros" | `03-workflows.md` workflow #4 UGC E-Commerce Ad pattern + `02-modelos-video.md` SeaDance 2.0 Turbo | 9:16 vertical, B-roll real screenshots facturas, lip-sync black-video si entrevista asíncrona |
| M2 sem2 | LinkedIn | Carruseles webinar recap | `11-carruseles-reels.md` + Gamma App / Type Grow shortcut (de `08-tools-saas-extensiones.md`) | 10 slides, exportar PNG IG + PDF LinkedIn, música embebida (push a Reels algorithm) |
| M2 todos | TikTok (debate) | Reels rápidos 7-15s | `06-virality-hooks.md` + `10-stack-end-to-end.md` (Higgsfield API bulk, AutoWhisk) | 9:16, hook visual primer 1.5s, sin diálogo entre comillas (anti-pattern) |
| M3 sem1+ | Meta Ads | Static + video variantes | `08-tools-saas-extensiones.md` AutoWhisk + Autoflow Chrome para bulk variantes + notebook 3 (testing matrix) | 12 variantes/sem para A/B Meta, 1:1 + 4:5 + 9:16 stories |
| M3 sem1+ | TikTok Ads | UGC ads | `03-workflows.md` workflow #4 UGC E-Commerce Ad + creators-look-alike audience | 9:16, primer 1s hook visual shock |
| M3 sem1+ | Google Ads | Display + responsive search | Dump no aplica directamente, ver notebook 3 | Ad copy reuses landing-copy-v1 hooks |
| M4 sem1 | YouTube (corto) | Tutoriales reales 10-15min | `10-stack-end-to-end.md` Cinematic Long-Form workflow | 16:9, > 10min para RPM, B-roll demo real |
| M4-6 | LinkedIn / IG | Carruseles bulk Black Friday | `11-carruseles-reels.md` + AutoWhisk bulk | 30 carruseles producidos en 1 sprint con Autoflow |
| M4-6 | Email newsletter | Newsletter quincenal | `09-frameworks-acronimos.md` (Brick-by-Brick para narrativa) | 600-900 palabras, 1 idea, 1 CTA |

### §4.2 Carrusel canónico — plantilla fija reusable

Estructura aplicada **SIEMPRE** en carruseles DarkRoom (LinkedIn + IG):

```
Slide 1 (cover, 80% del trabajo) — Hook visual + texto contradictorio (ej: "Pago 29€ por lo que costaba 240€")
Slide 2 — Setup (contexto del problema)
Slide 3 — Reframe (giro narrativo)
Slide 4 — Value 1 (insight accionable)
Slide 5 — Value 2 (insight accionable)
Slide 6 — Update (BTS / dato real DarkRoom)
Slide 7 — Climax (revelación / decisión)
Slide 8 — Value 3 o Save Prompt ("guarda esto si...")
Slide 9 — Caso real / dato concreto
Slide 10 — CTA discreto (link en bio / responde / DM)
```

Ratio: **4:5 1080×1350** SIEMPRE (Santo Grial dump 11 + virality dump 06).
Tipografía captions: **Thrive o Poppins**, shadow + glow + fade-in 0.2s.
Música embebida en IG carrusel → push a algoritmo Reels.
Export: PNG individuales para IG, PDF para LinkedIn.

Producer técnico recomendado para Mes 2+: `tools/darkroom-carousels.mjs` (a crear como follow-up) — input texto largo + plantilla = 10 PNG + caption.

### §4.3 Reel canónico — plantilla fija reusable

```
0.0-1.5s — Hook visual shock (acción brusca + hook texto + sound risers)
1.5-3s — Setup problema relatable
3-7s — Reframe + insight valor
7-10s — Loop seamless al inicio (si stand-alone) o CTA visual
```

Ratio: **9:16 1080×1920**.
Audio ducking SFX nativo del modelo de vídeo a -20dB.
Captions Thrive con shadow + fade-in 0.2s.
Vignette global ligera.
Si entrevista asíncrona con creator: **black-video lip-sync** (ElevenLabs voice cloning + black frame con captions sobreimpresos) — coste ≈ 0.

### §4.4 Workflow producción semanal apalancado

Cada semana (M1+) Pablo + agentes producen:

1. **2 carruseles canónicos** (1 LinkedIn + 1 IG si M2+). Tiempo si plantilla establecida: 90 min/carrusel con producer.
2. **2-3 reels** (IG + TikTok desde M3). Tiempo: 60 min/reel con plantilla.
3. **5 hilos / posts LinkedIn**. Tiempo: 30 min/post.
4. **15 tweets** (sueltos + 2-3 hilos). Tiempo: 15 min/tweet, 45 min/hilo.

Total semanal contenido: **~10-12 horas Pablo + agentes** — sostenible con AutoWhisk + Autoflow + plantilla canónica fija.

### §4.5 Cobertura dumps Santo Grial

Los 13 dumps se referencian al menos 1 vez en este doc:

| Dump | Usado en |
|---|---|
| `00-overview.md` | §4.1 mes 0 buffer |
| `01-modelos-imagen.md` | §4.1 carruseles M1, generación covers |
| `01-modelos-img-video.md` | §4.1 (variante de 01) |
| `02-modelos-video.md` | §4.1 reels M1, M2 |
| `03-workflows.md` | §4.1 UGC ads M2-M3, workflow #4 |
| `04-prompts.md` | §4.1 hilos LinkedIn M1, frameworks ASPECT/PAS |
| `05-audio-tts-musica.md` | §4.1 reels (audio ducking) + lip-sync black-video |
| `06-virality-hooks.md` | §4.1 reels todos meses, retention rules |
| `07-anti-patterns.md` | §4.1 carruseles M1 sem4 (no wall of text) |
| `08-tools-saas-extensiones.md` | §4.1 ads M3+ (AutoWhisk + Autoflow), §4.2 producer |
| `09-frameworks-acronimos.md` | §4.1 hilos M1 (ROSAS), newsletter M4-6 (Brick-by-Brick) |
| `10-stack-end-to-end.md` | §4.1 YouTube M4 (Cinematic Long-Form), TikTok M2 (Higgsfield) |
| `11-carruseles-reels.md` | §4.2 carrusel canónico + §4.3 reel canónico |
| `12-claude-code-mcp-deploy.md` | Producer reusable §4.2 (Vercel/GitHub MCP), workflow factory |

---

## §5 — Apalancamientos clave

Las 6 jugadas que multiplican impacto sin multiplicar esfuerzo. Cada una con coste, expected leverage, primera implementación.

### 5.1 Carrusel canónico sistematizado

- **Coste**: 8h dev producer `tools/darkroom-carousels.mjs` (input texto + plantilla → 10 PNG + caption + PDF).
- **Leverage**: 1 carrusel/día sin pensar en formato (vs 90 min/carrusel manual). Saving: ~5h/sem.
- **Implementación**: M1 sem4 (después validar plantilla con primeros 10 carruseles manuales).

### 5.2 Reels black-video lip-sync

- **Coste**: ≈ 0 (ElevenLabs free tier 10k chars/mes + ffmpeg). Skill PACAME `elevenlabs` ya disponible.
- **Leverage**: entrevistas asíncronas con afiliados (top 5 creators) sin que tengan que grabarse a sí mismos. Coste 0, retention alta.
- **Implementación**: M2 sem1 con primer afiliado activo.

### 5.3 AutoWhisk + Autoflow Chrome para bulk variantes

- **Coste**: setup 6h Pablo (tutorial + workflow). Skill `pacame-viral-visuals` ya tiene la base.
- **Leverage**: 100 variantes ads/sprint vs 5 manuales. CTR testing matrix viable.
- **Implementación**: M3 sem1 al activar Ads.

### 5.4 Cookie 30d afiliados + UTM tracking + Plausible custom events

- **Coste**: 12h dev (schema ya diseñado en `programa-afiliados.md`). CORE migration + endpoints + cookie + Plausible custom events.
- **Leverage**: atribución real día 1. Sin esto, programa afiliados es teatro.
- **Implementación**: M0 día 14.

### 5.5 Lifetime deal pre-launch (100 plazas a 499€)

- **Coste**: ≈ 4h ops (landing, copy, Stripe one-time price, comms).
- **Leverage**: 100 × 499€ = **49.900€ cashflow inmediato** + 100 embajadores naturales (red afiliados semilla M2).
- **Implementación**: M1 sem1 simultáneo al lanzamiento público.

### 5.6 Webinar mensual lead-magnet recurrente

- **Coste**: 3h preparación + 1h entrega + 2h promoción = 6h/mes Pablo.
- **Leverage**: 80-150 registrants/mes (objetivo M2+) × 20% conversión trial = 16-30 trials/mes adicionales = **+460 a +870 € MRR/mes incremental**.
- **Implementación**: M2 (1er webinar). M3+ recurrente primer jueves del mes.

---

## §6 — Métricas de control + guardrails

### 6.1 KPIs leading (revisión semanal Pablo)

- Impresiones LinkedIn + X agregadas (Buffer + Plausible).
- Emails capturados nuevos esa semana (Resend + Supabase).
- Trials iniciados (Stripe).
- % trial→paid últimas 2 semanas (Stripe cohort).
- MRR delta semanal (Stripe).
- Churn rate semanal (Stripe).
- Affiliate clicks + conversions (Supabase `affiliate_*`).

### 6.2 KPIs lagging (revisión mensual último viernes)

- MRR total (objetivo M6: 5.000€).
- Paid activos (objetivo M6: 200).
- % MRR via afiliados (objetivo M6: ≥ 40%).
- CAC pagado (objetivo M3+: ≤ 30€).
- LTV (objetivo: ≥ 90€ con churn 8% y ARPU 29€).
- LTV / CAC (objetivo: ≥ 3).
- NPS encuesta primer mes (objetivo: ≥ 35 M2, ≥ 40 M6).
- % miembros via micronicho free (objetivo: ≥ 60%).
- Visitas mensuales agregadas (objetivo M6: 15.000).

### 6.3 Guardrails con trigger automático de pause

| Guardrail | Trigger | Acción inmediata |
|---|---|---|
| **CAC > 60€ durante 2 semanas consecutivas** | Reporte semanal Stripe + Ads | Pause Ads. Diagnóstico creative + audience. No reactivar hasta CAC ≤ 35€ con muestra mínima 50 conversions. |
| **Churn > 12%/mes** | Reporte mensual Stripe | Freeze nuevos signups (banner landing). Reunión emergencia retention. Activar Escenario 9. |
| **Quejas legales > 2 en 1 mes** | Bandeja entrada `support@darkroomcreative.cloud` | Activar protocolo Escenario 4 (plan B opensource a stand-by). |
| **NPS < 20** | Encuesta primer mes | Freeze growth, focus retention. Llamadas 1-on-1 Pablo a últimos 30 paid. |
| **Pablo trabajando > 60h/sem 2 semanas** | Self-report Pablo en checkin Mon AM | Pause crecimiento, foco automatización 1 semana. Skill `dispatching-parallel-agents` para descargar. |
| **Caja DarkRoom < 1.500€** | Stripe balance + cuenta operativa | Pause Ads + Lifetime deal "second wave" + considerar Escenario 3. |
| **1 afiliado > 35% MRR durante 2 meses** | Reporte mensual `affiliate_payouts` | Activar Escenario 6 (diversificar). |

### 6.4 Frecuencia de reporte

- **Lunes 09:00**: dashboard semanal Pablo (LENS skill `analytics-report` o cron auto-publish a Telegram bot).
- **Último viernes mes 17:00**: revisión mensual completa (KPIs lagging + scenario check + decisión próximo mes).
- **Trimestral**: revisión estratégica completa (escenario activo + ajustes plan + decisiones bloqueantes Pablo).

---

## §7 — Top 5 notebooks adicionales solicitados a Pablo

Priorizados por impacto y orden de incorporación. Cada notebook lleva: por qué crítico, qué desbloquea concretamente en este plan, qué sección enriquece, expected probability of use.

### Notebook 1 — Lifecycle Email & SaaS Activation

**Fuentes sugeridas**: Lenny's Newsletter (Lenny Rachitsky activation episodes), Patrick Campbell (ProfitWell/Paddle), Kieran Flanagan (HubSpot growth), Andrew Chen (a16z growth book), Reforge Lifecycle Marketing course.

**Por qué crítico**: la secuencia de 5 emails post-captura está diseñada conceptualmente (D0/D2/D5/D8/D12 en `flywheel-micronichos.md:286`) pero falta TODO el playbook D14-D90 (post-trial, paid retention, dunning Stripe, win-back, expansion revenue). El 12% de churn en mes 2-3 cae aquí si no se construye. Sin esto, Escenario 9 (probabilidad 20%) se materializa.

**Desbloquea**:
- Secuencia post-trial 30/60/90 (check-ins, milestones, expansion).
- Dunning Stripe automatizado (recuperar tarjetas fallidas — recupera ~5% del MRR).
- Win-back 60d después de churn (recupera 8-15% churned).
- Onboarding 7-day del miembro (D0 quick win → D7 milestone celebration).
- Expansion offer Pro → Studio en momento óptimo (típicamente día 45-90).

**Encaja**: §3 Escenario 9 retention + §6 guardrail churn + §2 capa retention/lifecycle + onboarding miembro.

**Probability of use**: 100% (la secuencia post-trial se construye sí o sí en M2-M3).

---

### Notebook 2 — Creator Economy Affiliate Playbooks

**Fuentes sugeridas**: case studies Notion ambassador program, Webflow partner program, Loom referral, ConvertKit creator marketing, Common Thread Collective creator strategy, Modern Retail / Creator Economy podcast.

**Por qué crítico**: `programa-afiliados.md` tiene base sólida (schema SQL, 3 opciones comisión, 30 candidatos, 5 plantillas copy) pero falta la táctica fina de activación (kit onboarding pulido tipo Notion partner kit, gamificación leaderboards, sistema embajadores VIP, prevención fraude, métricas creator-side, cohort analysis de afiliados, comms triggers).

**Desbloquea**:
- Outreach M3 30 creators con kit profesional (no las 5 plantillas crudas).
- Sistema embajadores VIP M5-M6 (top 5 a 40% lifetime + acceso roadmap).
- Leaderboard público afiliados (gamificación visible que motiva push).
- Detección y prevención fraude (clicks self-referred, conversions sospechosas).
- Comms triggers automáticos (nuevo afiliado activado, primera comisión, primera baja).

**Encaja**: §3 Escenario 6 single-creator dependency + §3 Escenario 5 competidor copia + §5.5 lifetime deal + §2 capa afiliados.

**Probability of use**: 95% (programa afiliados es palanca crítica del plan, M3 outreach es pivote).

---

### Notebook 3 — Paid Ads B2C Operacional (Meta + TikTok + Google)

**Fuentes sugeridas**: Tier Eleven (Ed Leake) Meta Ads playbooks, Andrew Hubbard (CTC) creative testing, Mongoose Media Meta+TikTok, Foxwell Founders / Foxwell Digital, Common Thread Collective creative ops, AKNF (Charley Tichenor) account structure, Google Ads Performance Max masterclass.

**Por qué crítico**: el plan dice "M3 activar Ads 500€/mes" pero sin testing matrix, audience structure, scaling rules, frequency caps, creative iteration cadence concretos. Dilapidar 500€ × 3 meses sin playbook = -1.500€ y CAC roto = caer en Escenario 3 (conservador) por mala ejecución, no por falta de demanda.

**Desbloquea**:
- Framework BSC (Broad Audience Strategy + Creative Testing + Scaling Rules) listo para Meta.
- Audience structure (lookalike emails capturados + creators-look-alike TikTok + intent keywords Google).
- Testing matrix (3 hooks × 4 angles × 2 formatos = 24 ad variantes/sem para A/B con AutoWhisk).
- Rules de pause / scale / kill (CAC > 60€ pause, ROAS > 2.5x scale +20% budget).
- Cadence creative iteration (refresh ads cada 14 días o caída CTR > 30%).
- CAC objetivo ≤ 30€ achievable con framework probado.

**Encaja**: §3 Escenario 1 mes 3+ + §4.1 ads M3 mapping Santo Grial + §6 guardrail CAC + §5.3 AutoWhisk leverage.

**Probability of use**: 90% (Ads se activan M3 sí o sí salvo Escenario 3; aún en Escenario 3 conservador, parte del notebook se reusa para promoción orgánica boost).

---

### Notebook 4 — Community-Led Growth para SaaS B2C (Discord/Slack/Eventos)

**Fuentes sugeridas**: Commsor / The Community Club, Dropbox community case study, On Deck founder cohorts, Indie Hackers community case, Notion community Reddit, Discord SaaS communities playbook, BetterUp / Substack community ops, Rosie Sherry (community-led growth blog).

**Por qué crítico**: DarkRoom es membresía COLECTIVA por diseño. La comunidad NO es un añadido — es producto. El plan operativo M0-M6 NO contempla cómo se construye Discord/Slack, eventos AMAs, retention via belonging, mecánicas de engagement. Sin esto, Escenario 9 (churn alto) se materializa porque el miembro no tiene "razón emocional" para quedarse cuando no usa Adobe esa semana.

**Desbloquea**:
- Discord DarkRoom M2 con structure clara (channels, roles, onboarding bot).
- Sistema eventos M3+ (AMAs Pablo, talleres invitados, demo days miembros).
- Retention loops comunitarios (badge primer logro, leaderboard contribuciones, recognition mensual).
- Bajada churn proyectada 12% → 6% (impacto +24 paid retenidos M6 = +700€ MRR).
- Defensa moat vs Escenario 5 (competidor copia precio pero no copia comunidad).
- Lock-in afiliados embajadores VIP (privileges en Discord).

**Encaja**: §2 capa comunidad + §3 Escenario 9 retention + §3 Escenario 5 defensa competidor + §3 Escenario 2 hyperviral wave (capacity emocional para retener) + onboarding miembro.

**Probability of use**: 100% (Discord se monta sí o sí M2 — si no, Escenario 9 se cumple).

---

### Notebook 5 — Modelos legales gris en SaaS / Group buying playbooks

**Fuentes sugeridas**: análisis ToS Adobe / Figma / Microsoft 365 multi-user, group buying SaaS case studies (ScaleBoost, Toolzilla, Tugboat), Stripe terms para modelos colectivos / multi-tenant, GDPR + jurisdicción europea LLC operations, abogados especializados SaaS gris (consulta uno-shot), Reddit r/groupbuying historic threads, Hacker News debates "is this legal" sobre Adobe sharing.

**Por qué crítico**: el modelo gris exige defensa pre-construida ANTES de necesitarse. Hoy no hay playbook si Adobe Legal escribe (Escenario 4 — probabilidad 8%, impacto catastrófico). Sin notebook 5 = plan B improvisado en 48h = churn > 70% = cierre. Es el único notebook donde NO usarlo es riesgo existencial directo.

**Desbloquea**:
- `strategy/darkroom/plan-b-opensource.md` viable (qué stack, qué precio, cómo migra técnicamente).
- Comms PR pre-cocinados (post LinkedIn Pablo, email comunidad, Q&A respuestas) listos en cajón.
- ToS analysis Stripe para modelo colectivo (¿es Stripe ToS-compatible? ¿requiere acuerdo separado?).
- Jurisdicción europea defensa (Hostinger UAB Lithuania como host vs Adobe USA jurisdicción).
- Refund automation pro-rata en pause masivo (lógica técnica preparada).
- Comms a afiliados pre-cocinados (qué hacer con comisiones in-flight).

**Encaja**: §3 Escenario 4 black swan legal + §6 guardrail quejas legales + §2 capa legal/compliance.

**Probability of use**: 100% como seguro (paga 8% × impacto cierre = expected value muy alto). El notebook se incorpora aunque nunca se "active" porque sirve para sleep at night.

---

### §7.1 Anexo notebooks futuros (después de los 5 críticos)

8 ramas vacías de menor prioridad para incorporar en M4+ o por demanda específica:

1. **Internacionalización LATAM** (Escenario 8 upside) — pricing PPP, payment methods (PayPal MX, MercadoPago AR), localización cultural.
2. **SEO programmatic deep** (micronicho #4 alternativas + landings cluster) — schema markup ComparisonReview, técnicas Glen Allsop / Bibby SEO programmatic.
3. **Webinar funnels** (registración → recordatorios → live → replay → trial) — Tara Shah / Jenna Kutcher / Jasmine Star webinar funnels.
4. **Branding sonoro/audiovisual de marca** (logo sound, audio brand kit ElevenLabs, intro reels distintiva).
5. **Churn analytics tools** (Mixpanel / Amplitude / Heap cohort analysis para SaaS B2C).
6. **Retention via gamification / behavioral design** (Yu-kai Chou Octalysis, BJ Fogg Tiny Habits aplicado a SaaS).
7. **PR underground / earned media** (cómo conseguir cobertura simpática en medios tech españoles + LATAM).
8. **Black Friday SaaS playbooks** (urgencia genuina, anchoring, lifetime vs annual offer mix).

Estas se incorporan a demanda. No son bloqueantes para M0-M6.

---

## §8 — Anexos

### §8.1 Glosario abreviaturas

- **MRR**: Monthly Recurring Revenue (ingresos recurrentes mensuales).
- **ARR**: Annual Recurring Revenue (= MRR × 12).
- **ARPU**: Average Revenue Per User.
- **CAC**: Customer Acquisition Cost.
- **LTV**: Lifetime Value (= ARPU / churn rate).
- **LTV/CAC**: ratio salud SaaS (≥ 3 sano).
- **Churn**: % miembros que cancelan en periodo.
- **NPS**: Net Promoter Score (-100 a +100).
- **ICP**: Ideal Customer Profile.
- **CTR**: Click-Through Rate.
- **CPL**: Cost Per Lead.
- **CPM**: Cost Per Mille (1000 impresiones).
- **CPA**: Cost Per Acquisition (= CAC con frecuencia ads).
- **ROAS**: Return On Ad Spend (revenue ads / spend ads).
- **BSC**: Broad Audience Strategy + Creative testing + Scaling (framework Meta Ads notebook 3).

### §8.2 Cross-refs docs strategy/darkroom/

- `positioning.md` — ICP primario/secundario/terciario + anti-ICP, voz de marca, pricing 3 tiers (Starter 15€ / Pro 29€ / Studio 49€), métricas estrella, anti-promesas.
- `flywheel-micronichos.md` — 6 micronichos diseñados (paletas, mockup batch, hooks, alternatives, prompts, carrusel), funnel email D0-D18, stack técnico común, estructura repo separado.
- `landing-copy-v1.md` — copy aprobado hero→FAQ→pricing→footer para build PIXEL.
- `plan-mensual-operativo.md` — plan operativo M0→M6 semana a semana con KPIs cuantitativos por mes.
- `programa-afiliados.md` — 3 opciones comisión (A 30%+50€ recomendada), schema SQL completo (4 tablas), tracking flow, 5 plantillas copy, 30 candidatos outreach, plantilla email outreach.
- `banco-contenido-mes-1.md` — 60+ piezas LinkedIn+X listas Mes 1 con hook/body/CTA/hashtags + distribución 70/20/10 verificada (42 valor / 12 BTS / 6 pitch).

### §8.3 Cross-refs Santo Grial Visual

- Doc maestro: `PacameCueva/04-Workflows/santo-grial-visual.md` (12 ejes destilados, 5 workflows canónicos, 7 fórmulas prompt, 9 anti-patterns).
- Dumps crudos: `C:\tmp\notebooklm-santo-grial-raw\` (13 archivos numerados 00-12).
- Notebook URL: https://notebooklm.google.com/notebook/d29104fe-a466-4d93-9025-3b5d25a63819
- Skills enriquecidos con Santo Grial: `pacame-viral-visuals`, `pacame-contenido`, `nano-banana`, `video-toolkit/CLAUDE.md` (sección "Update 2026-04-28").

### §8.4 Cross-refs memoria interna

- `feedback_focus_proyectos_propios` — DarkRoom es Capa 3, foco prioritario.
- `feedback_no_mencionar_personal_con_pacame` — cero menciones cruzadas.
- `project_arquitectura_3_capas` — DarkRoom dentro de Capa 3 SaaS propios PACAME.
- `reference_dark_room_mailboxes` — único buzón real `support@darkroomcreative.cloud`.
- `feedback_pr_merge_automatico` — ciclo entrega → main automático.
- `feedback_no_video_auto` — cron auto-publish solo carruseles, reels manual con `publish-reel.mjs`.
- `feedback_doble_aprobacion_videos` — Veo 3.1 6s = 1.20$, doble OK Pablo antes generar.

### §8.5 Decisiones bloqueantes que solo Pablo puede tomar

Resumidas de los 6 docs + emergentes del análisis de escenarios:

| # | Decisión | Bloquea | Plazo |
|---|---|---|---|
| 1 | Estructura comisión afiliados (A / B / C) | Schema migration + outreach M1-2 | M0 día 14 |
| 2 | Cuántas plataformas activas M1 (recomendado 2: X + LinkedIn) | Banco contenido M1 final | M0 día 7 |
| 3 | Quién postea (Pablo vs agente híbrido) | Workflow producción semanal | M0 día 7 |
| 4 | Aprobar Lifetime deal pre-launch 100 plazas a 499€ | Cashflow M1 | M0 día 10 |
| 5 | Vercel team transfer dark-room → Dark Room IO | Deploy M0 | M0 día 6 |
| 6 | Aprobar pricing 3 tiers (Starter 15€ / Pro 29€ / Studio 49€) o ajustar | Stripe products live | M0 día 7 |
| 7 | Constituir SL DarkRoom (cuándo MRR > 1k€) | Capacidad facturación + separación legal de Pablo | M3-M4 |
| 8 | Aprobar Black Friday Pro 199€ año 1 | Comms M5 | M5 día 1 |
| 9 | Aprobar primer hire (cuándo MRR > 5k€) | Capacidad operativa M7+ | M7+ |
| 10 | (Emergente) Aprobar incorporar notebook 5 (legal gris) **inmediatamente** | Plan B existencial Escenario 4 | M0 día 7 |
| 11 | (Emergente) Activar Discord DarkRoom M2 sí o sí | Escenario 9 retention | M1 sem4 |
| 12 | (Emergente) Aceptar protocolo capacity check pre-Escenario 2 (hyperviral wave) | Capacidad técnica stack si llega wave | M2 |

---

## §9 — Validación final del playbook

Este doc se considera completo y vivo si pasa estos 7 checks:

1. **Cobertura escenarios** ✅ — los 9 escenarios listados con probabilidad + 3 indicadores + trigger + jugada + métrica salida + skill responsable.
2. **Mapping Santo Grial** ✅ — los 13 dumps referenciados al menos 1 vez en §4.
3. **Top 5 notebooks** ✅ — cada uno con por qué crítico + qué desbloquea + encaje + probability of use.
4. **Cross-refs** ✅ — 6 docs strategy/darkroom/ + Santo Grial + memoria + decisiones bloqueantes.
5. **Reglas duras** ✅ — cero menciones PACAME / La Caleta / Ecomglobalbox como marca propia (sólo en cross-refs internos del meta-protocolo).
6. **Sin huérfanos** ✅ — todas las referencias a §X corresponden a sección existente.
7. **Densidad** ✅ — entre 700-900 líneas (este doc).

### §9.1 Próximos pasos accionables

1. **Pablo decide bloqueante #10** (notebook 5 legal): aprobarlo prioridad #1 esta semana.
2. **Pablo envía notebook 1** (lifecycle email) — primer notebook que aterrizo en plan: M2-M3 critical path.
3. **Pablo confirma bloqueante #1** (estructura comisión A/B/C — recomendado A) antes M0 día 14.
4. **Empezar producción banco contenido M2** YA con plantilla §4.2 carrusel canónico (no esperar M1 fin).
5. **CORE arranca migration afiliados** (schema en `programa-afiliados.md:79`) en paralelo a deploy paletas.
6. **PIXEL arranca Discord DarkRoom estructura** M1 sem4 para tener listo M2 (notebook 4 lo orienta).

### §9.2 Cómo se actualiza este doc

- Cada cierre de mes (último viernes 17:00): Pablo + LENS revisan KPIs reales vs §3 escenarios. Si el escenario activo cambia → update §3 y §6 con datos reales.
- Cada nuevo notebook incorporado (§7): añadir en §4 los hooks específicos y en §6 los guardrails que desbloquea.
- Cada decisión bloqueante tomada (§8.5): mover a "tomada" con fecha y rationale.
- Cualquier cambio en `strategy/darkroom/*.md` que afecte la línea base: actualizar §2 con la nueva línea base auditada.
