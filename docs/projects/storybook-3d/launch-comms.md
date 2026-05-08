# Plan de comunicación — Lanzamiento Storybook 3D

> Cómo anunciar el rediseño de pacameagencia.com el día del switch del flag a producción.

## Filosofía

El rediseño es **parte del producto que vendemos** ("mira lo que podemos hacer"). Comunicarlo en silencio sería desperdiciar el momentum. Asumimos un evento de lanzamiento moderado: post LinkedIn + email + thread X + reel Instagram, en ese orden.

## Calendario propuesto (ejemplo, ajustar fechas reales al cierre Fase 7)

| Día | Hora (CET) | Canal | Acción |
|---|---|---|---|
| D-1 | 19:00 | Vercel | Flag `STORYBOOK_HOME=1` en preview env, smoke test final |
| D-1 | 22:00 | Telegram | Aviso al canal interno PACAME-DEV: "mañana 09:00 CET launch" |
| D | 09:00 | Vercel | Flag a producción |
| D | 09:15 | Slack/Telegram | Smoke test post-deploy: `curl /` + Lighthouse + lead test |
| D | 10:00 | LinkedIn | Post (Pablo) |
| D | 11:00 | X / Twitter | Thread 5 tweets |
| D | 13:00 | Email | Newsletter a base existente |
| D | 18:00 | Instagram | Reel + post |
| D+1 | 11:00 | Sentry / GA4 | Primera revisión 24h métricas |
| D+7 | 11:00 | docs/projects/storybook-3d/ | `storybook-launch-report.md` con baseline |

## 1. Post LinkedIn (Pablo)

**Formato**: 3-4 párrafos + screenshot Storybook + link a `/`.

**Borrador (sin palabras IA prohibidas, tutea, números concretos):**

```
Llevábamos meses con la web acumulando secciones. 12 al final.
Cada visitante tenía que decidir solo qué le aplicaba. Conversión: regular.

Decidí cambiar el approach. En vez de explicarlo todo en la home, te llevo
por un mapa 3D donde tú eliges qué servicio te interesa. 5 islas, 1 escenario
final con auditoría 15 min sin compromiso.

Construido con React Three Fiber + GSAP + Lenis. Mobile real (no fallback
fake). Lighthouse 87 mobile / 92 desktop. Y sí, sigue funcionando con
JavaScript desactivado y screen readers (aquí lo del NoScriptContent SSR
con 5 secciones semánticas + Schema.org Service[]).

Cada elemento del mapa es cerámica modernista mate. Inspiración: Loewe
craft prize + Cruz Novillo + arquitectura modernista catalana. Cero
gradientes Tailwind random. Cero "look genérico AI".

Pruébalo: pacameagencia.com
Y dime qué te falla.
```

**Notas:**
- NO mencionar competidores.
- NO mencionar precio en este post (eso lo lleva el form).
- Adjuntar 2-3 screenshots: hero overview + isla mostaza (Loewe-look) + form auditoría.
- Tag: nadie por defecto. Si Pablo quiere, mencionar 1-2 colaboradores que ayudaron.

## 2. Thread X / Twitter (5 tweets)

**Tweet 1 (hook):**
```
Acabo de relanzar pacameagencia.com.

Un mapa 3D de cerámica modernista donde eliges tu escenario. 5 islas, 1 form
auditoría al final.

Hilo 🧵
```

**Tweet 2:**
```
El problema:
- Home con 12 secciones
- Conversión regular
- Visitantes saturados
- Métrica más alta era "scroll depth", no leads

La solución no era más copy. Era menos.
```

**Tweet 3 (técnico):**
```
Stack:
- React Three Fiber v9
- @react-three/drei v10
- GSAP + Lenis (smooth scroll)
- Next.js 16 (App Router)
- Tailwind con paleta Spanish Modernism

Bundle 3D ~700kB gz. Mobile real WebGL2 con LOD agresivo.
```

**Tweet 4 (a11y):**
```
Algo que nadie hace y debería:
- NoScriptContent SSR con 5 secciones semánticas (crawlers + screen readers)
- Toggle "3D off" persistente para usuarios con prefers-reduced-motion
- Atajos teclado 1..5 para saltar a islas
- Schema.org Org + Service[] + BreadcrumbList completo
```

**Tweet 5 (CTA):**
```
Pruébalo: pacameagencia.com

Si quieres una auditoría real de tu web/SEO/redes/ads/branding, hay un form
en el último escenario. 15 min, sin compromiso.

(Y si encuentras un bug, mejor — pásamelo)
```

## 3. Email a base existente

**Subject line**: `He cambiado mi web. Mira esto.`

**Cuerpo (texto plano, no template gigante):**

```
Hola {{nombre}},

Te escribo para decirte una cosa: he relanzado pacameagencia.com con un
formato totalmente nuevo.

En vez de la home llena de secciones explicando todo, ahora hay un mapa 3D
donde tú navegas por nuestros 5 servicios (web, SEO, redes, ads, branding)
y al final te ofrezco una auditoría 15 min gratuita.

¿Por qué te lo cuento? Porque tú ya pasaste por nuestro funnel y conoces
la versión vieja. Quiero saber qué piensas.

Echa 30 segundos y dime: ¿se entiende? ¿te resulta más cómodo? ¿te perdiste
en algún sitio?

→ pacameagencia.com

Gracias por el tiempo.
Pablo

P.D. Si quieres saltar el mapa y ver tu auditoría directa:
pacameagencia.com/auditoria-3d
```

**Segmentación**: lista completa pero excluyendo:
- Leads con `status="lost"` desde hace >180 días.
- Unsubscribes.
- Bounces hard previos.

**Hora envío**: martes 13:00 CET (según métricas del CRM, mejor open rate).

## 4. Reel Instagram + post

**Reel** (15-20s):
- Pantalla 1: "Cómo era mi web antes" → screenshot vieja con scroll rápido
- Pantalla 2: "Cómo es ahora" → captura del Storybook 3D rotando entre islas
- Pantalla 3: "Quiero algo así" + URL pacameagencia.com
- Audio: trending suave Instagram (algo modernista no electrónico)
- Caption corto:

```
Rediseño total. 3D real. Mobile. SEO. A11y completa.

pacameagencia.com (link en bio)
```

**Captura de pantalla del reel**: usar OBS o `capture-screen` skill local.
Tutorial corto en `docs/projects/storybook-3d/RECORD-REEL.md` (post-V1).

## 5. Monitoring 7 días post-launch

Métricas a vigilar (definir baseline el día D):

| Métrica | Tool | Objetivo |
|---|---|---|
| Bounce rate `/` | Vercel Analytics | < bounce rate clásica + 5pp |
| Time on page `/` | Vercel Analytics | > 30s |
| % visitas que llegan a `/auditoria-3d` | Vercel Analytics | > 8% |
| Leads desde Storybook (`source LIKE 'storybook%'`) | Supabase | > 3/semana baseline |
| Lighthouse Performance mobile | LH CI | ≥85 |
| Lighthouse SEO | LH CI | ≥95 |
| Errores Sentry / día | Sentry | < 5/día |
| 4xx/5xx en `/api/leads` | Vercel logs | < 2% requests |

**Si alguna métrica cae > 30% del baseline → activar rollback RUNBOOK-ROLLBACK.md nivel 1 (flag OFF).**

## 6. Quality Gate pre-lanzamiento

Antes de flippar el flag a `1` en producción, verificar 1 a 1:

- [ ] PR #142 (Fase 0) merged
- [ ] PR #154 (Fase 1) merged
- [ ] PR #158 (Fase 2) merged
- [ ] PR #160 (Fase 3) merged
- [ ] PR #161 (Fase 4) merged
- [ ] PR #163 (Fase 5) merged
- [ ] PR #164 (Fase 6) merged
- [ ] PR #?? (Fase 7) merged
- [ ] Build Vercel preview verde con flag=1
- [ ] Smoke test manual: home, 5 islas, click cada isla, form auditoría
- [ ] Lead test E2E: enviar form auditoría real → verificar Telegram + Resend + Supabase
- [ ] Lighthouse mobile preview ≥85
- [ ] BrowserStack iPhone 13 + Pixel 7: home funcional
- [ ] OG image renderiza en Twitter Card Validator
- [ ] JSON-LD pasa Rich Results Test
- [ ] Tag `v1.0-pre-storybook` en remoto
- [ ] Backup BD Supabase del día (Vercel Postgres backup automático cuenta)

Si todo OK → flag a producción + ejecutar plan comunicación.

## 7. Plan rollback de comunicación

Si tras lanzar en RRSS hay queja masiva (>10 mentions negativas en 24h):

1. Despublicar reels y posts (NO borrar, dejar archivados como referencia interna).
2. Email de seguimiento a la base: "tomamos nota, volvemos a la versión anterior temporalmente".
3. Flag OFF en Vercel (RUNBOOK-ROLLBACK.md nivel 1).
4. Post-mortem en `docs/projects/storybook-3d/post-mortem-launch.md` con métricas exactas + decisiones.
