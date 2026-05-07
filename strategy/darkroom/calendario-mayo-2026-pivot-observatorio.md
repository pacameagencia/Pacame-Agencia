# Calendario @pacamespain · Mayo 2026 · Pivot Observatorio IA + Dark Room

> **Estado**: estratégico vivo · sustituye `strategy/calendario-30-dias-v2.md` para mayo 2026.
> **Cuenta**: `@pacamespain` (52.292 followers · cuenta única).
> **Pivot**: la cuenta deja de hablar como agencia PACAME. Se reposiciona como **observatorio diario de IA** con Dark Room como respuesta natural al dolor.
> **Arrancado**: 2026-05-08 (primer post auto: C1 "Factura IA" 11:00 ES).
> **Maintainer**: PULSE (programación) · COPY (briefs) · NOVA (visual) · Pablo (aprobación reels premium con cost-guard).

---

## 1 · Volumen mensual expandido (vs calendario v2)

Aprovechando los modelos UNLIMITED de Higgsfield Plus (Soul V2/Cinema/Location 0.12 cr, Kling 3.0 unlimited, GPT Image 2 unlimited, Seedream V5 Lite unlimited, Nano Banana 2 Flash 2K unlimited, Flux 2 Pro 1K unlimited), escalamos sin disparar coste:

| Pieza | Calendario v2 | Pivot Mayo | Coste créditos/mes |
|---|---|---|---|
| Carruseles auto | 60 (2/día) | **90 (3/día)** | ~50 cr (mayoría UNLIMITED) |
| Stories auto | 120 (4/día) | **180 (6/día)** | ~25 cr (composer + Imagen FX) |
| Reels temáticos manuales | 8 (2/sem) | **8 (2/sem)** Kling 3.0 UNLIMITED | 0 cr |
| Piezas virales hero "experimentos IA" | 4 (1/sem) | **4 (1/sem)** | ~270 cr (Seedance/Veo/MS) |
| Posts adhoc por tendencia hot | — | **2-3/sem según hot trends** | ~10 cr |
| **TOTAL** | 192 piezas | **~290 piezas** | **~355 cr / 1.000** |

Margen: 645 créditos libres en bucket Plus para iterar piezas defectuosas o experimentos extras.

---

## 2 · Mix de 6 pilares (90 carruseles/mes)

| Pilar | % | # mes | Modelo Higgsfield | Slot horario preferido |
|---|---|---|---|---|
| **1 · Tendencia / Noticia IA del día** | 35% | 32 | GPT Image 2 (UNLIMITED) | 09:00 ES (matinal "qué pasó hoy") |
| **2 · VALOR (tutoriales · frameworks · tips)** | 25% | 23 | GPT Image 2 (UNLIMITED) | 14:30 ES (sobremesa "saca un rato") |
| **3 · Stack IA práctico** | 15% | 13 | Seedream V5 Lite (UNLIMITED) | 19:30 ES (post-trabajo) |
| **4 · Dark Room directo** | 15% | 13 | Soul Location (0.12) + Nano Banana 2 Flash UNLIMITED | 19:30 ES (post-trabajo, alterno) |
| **5 · Provocador / opinión** | 5% | 5 | Nano Banana 2 Flash UNLIMITED | 21:30 ES (cuando engagement pico) |
| **6 · BTS Pablo Soul Character** | 5% | 4 | Soul V2 (0.12) + Soul Cast video puntual | 14:30 ES o 19:30 ES rotando |

Regla 70/20/10 cumplida:
- **VALOR puro**: pilar 1 + 2 + 6 = **65%** + Stack 3 = **80%** valor
- **PITCH suave**: pilar 4 = **15%**
- **PROVOCADOR / picos virales**: pilar 5 = **5%**

---

## 3 · Stories diarias (6/día = 180/mes)

Slots aprovechados al máximo:

| Slot ES | Tipo | Contenido |
|---|---|---|
| **08:30** | Tendencia rápida 1-frase | "Hoy salió X · esto cambia Y" + sticker votación |
| **11:30** | Repromoción post matinal | Repost del carrusel AM con sticker "más en feed" |
| **14:00** | Tip valor 1-frase | Tutorial micro o framework rápido + emoji + sticker pregunta |
| **17:00** | Behind the scenes | Pablo Soul Character / screenshot agente IA / proceso |
| **20:00** | Repromoción post tarde | Repost del carrusel PM con sticker enlace a Dark Room |
| **22:30** | Recap + CTA Dark Room | "Hoy +X seguidores · 3 nuevos lifetime · quedan Y plazas" + sticker enlace |

Total 6 stories × 30 días = **180 piezas**.

Backbone: composer JS (cero coste) con templates ST01-ST10 reposicionados a safe areas (PR #118 merged).

Templates rotativos:
- 08:30 / 14:00: ST09-reto, ST10-si-supieras (data points + pregunta)
- 11:30 / 20:00: ST08-recomendacion (variantes con copy del post del día)
- 17:00: ST04-preguntame, ST06-ilegal (BTS humanizado)
- 22:30: ST03-pov, ST07-setup, ST01-stack (con ahorro acumulado)

---

## 4 · Reels semanales (8/mes · 2/sem) — ahora serie DARK_FRAMES

> **Cambio 2026-05-07**: los 8 reels martes/viernes pasan a ser piezas de la serie cinemática **DARK_FRAMES** (`strategy/darkroom/serie-dark-frames.md`), no reels educativos genéricos. Auto-publicadas tras pasar quality gate de 8 checks (regla revisada `feedback_no_video_auto.md`).

| Día | Tipo | Modelo Higgsfield | Coste cr | Hashtag |
|---|---|---|---|---|
| Mar 19:30 | DARK_FRAMES (cinemática IA) | **Kling 3.0** (UNLIMITED) | **0** | `#DarkFrames` |
| Vie 19:30 | DARK_FRAMES (cinemática IA) | **Kling 3.0** (UNLIMITED) | **0** | `#DarkFrames` |

Total 8 reels × 0 créditos = **0 créditos consumidos**. Los reels DARK_FRAMES son 5-15s, multi-shot, con outro Dark Room 2s obligatorio. Cumplen regla doble aprobación + cost-guard token si suben a Veo/Seedance puntualmente.

**Pipeline**: `tools/dark-frames/render-piece.mjs` → visual-reviewer → `enqueue-reel.mjs` (quality gate 8 checks) → `content_queue` format=`reel` → cron `auto-publish` → `publishReel()` IG Graph v21.

---

## 5 · Piezas virales hero (4/mes · 1/jueves) — ahora DARK_FRAMES AAA

> **Cambio 2026-05-07**: los 4 conceptos absurdos originales (objetos que hablan, modelos restaurantes, videoclub, modelo invade servidor) se archivan a **backlog mes 2** — no encajan con la dirección cinemática que Pablo ha pedido. Los jueves pasan a piezas DARK_FRAMES AAA con Veo 3.1 lite + Soul Cinema. Hashtag `#DarkFrames`.

| Jueves | Concepto DARK_FRAMES | concept_id | Modelo principal | Coste estimado |
|---|---|---|---|---|
| 8 may (HOY) | (calendario actual reel temático mantiene C1 Factura IA carrusel · primer DARK_FRAMES tras aprobación bloque) | — | — | — |
| 15 may | "Trailer Mad Max en Tokio" 18s | `dark-frames-004` | Veo 3.1 lite + Kling 3.0 | $0.90 + 0 cr |
| 22 may | (placeholder backlog: Cyberpunk Tokyo bike chase) | `dark-frames-005` | Kling 3.0 | 0 cr |
| 29 may | (placeholder backlog: Trailer The Witcher 4 falso) | `dark-frames-010` | Veo 3.1 lite | $0.75 |

**Total hero piezas: ~$1.65 USD + 0 cr (versus ~290 cr presupuestado con conceptos absurdos).**

**Reglas operativas hero DARK_FRAMES**:
- Brief Claude + moodboard concreto (`tools/dark-frames/moodboards/<id>.md`)
- 3-5 shots multi-modelo (Kling base + Veo puntual para shots establecedores)
- Voz ElevenLabs multilingual_v2 voz Brian (free 10k chars/mes)
- Música Suno cinematográfica épica (free 50 canciones/mes)
- Outro Dark Room 2s obligatorio (`tools/dark-frames/assets/outro-darkroom-2s.mp4`)
- Captions Anton/JetBrains Mono burned-in
- Cost-guard token + 2 SÍ Pablo antes de generar Veo/Seedance/Soul Cinema
- Quality gate 8 checks antes de auto-publish

### Backlog conceptos absurdos (archivados, recuperables mes 2 si se valida formato)

- "Las cosas que hablan" (5 objetos noir oficina)
- "Si los modelos IA fueran restaurantes" (7 modelos chefs cocina)
- "Videoclub modelos extintos" (tour videoclub 90s)
- "Cuando un modelo nuevo entra al stack" (pseudo-noticia)

Estos no se pierden — viven en backlog para mes 2 si Pablo decide volver a ese registro.

---

## 6 · Slots maestros del cron auto-publish

Master-cron despacha `/api/agents/auto-publish` con SCHEDULE:

| UTC | Hora ES | Pieza | Prioridad |
|---|---|---|---|
| 06:30 | 08:30 | Story matinal (tendencia) | P0 |
| 07:00 | 09:00 | **Carrusel AM** (pilar Tendencia 35%) | P0 |
| 09:30 | 11:30 | Story repromoción AM | P1 |
| 11:00 | 13:00 | Story tip valor | P1 |
| 12:30 | 14:30 | **Carrusel MID** (pilar VALOR 25% o BTS 5%) | P0 |
| 15:00 | 17:00 | Story BTS | P1 |
| 17:30 | 19:30 | **Carrusel PM** (pilar Stack 15% / DR 15% / Provocador 5%) | P0 |
| 18:00 | 20:00 | Story repromoción PM | P1 |
| 20:30 | 22:30 | Story recap + CTA Dark Room | P1 |

3 carruseles + 6 stories diarias en horarios optimizados según engagement IG B2C español.

---

## 7 · Pipeline automático (research → brief → render → enqueue)

### Cron diario (master-cron despacha)

| UTC | Hora ES | Endpoint | Función |
|---|---|---|---|
| 05:00 | 07:00 | `/api/agents/research-trends` | Apify scrape hashtags IA top 24h → tabla `daily_trends` |
| 05:30 | 07:30 | `/api/agents/generate-brief` | Claude lee daily_trends + brand bible → genera 3 briefs JSON (AM/MID/PM) → tabla `daily_briefs` |
| 06:00 | 08:00 | `/api/agents/render-and-enqueue` | Para cada brief: llama Higgsfield CLI → composer → enqueue-content.mjs |
| 06:30 | 08:30 | (cron auto-publish ya activo) | Despacha cualquier story/carrusel con scheduled_at ≤ now |

### Tablas Supabase nuevas

```sql
-- Tendencias IA detectadas cada mañana
create table daily_trends (
  id uuid primary key default gen_random_uuid(),
  scraped_at timestamptz not null default now(),
  source text not null,                  -- 'apify-instagram-hashtag-scraper'
  hashtag text not null,                 -- '#nanobananapro' '#veo3' etc
  top_post_url text,
  top_post_engagement int,
  trend_summary text,                    -- 1-2 frases qué pasó
  raw_data jsonb,
  used boolean default false             -- ya consumido por brief generator
);

-- Briefs generados para producción
create table daily_briefs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  slot text check (slot in ('am','mid','pm')),
  pilar int check (pilar between 1 and 6),
  hook text not null,
  brief jsonb not null,                  -- { title, slides[], hashtags[], background_prompt, cta }
  status text default 'pending' check (status in ('pending','rendering','rendered','enqueued','published','failed')),
  rendered_folder text,
  enqueued_id uuid references content_queue(id),
  created_at timestamptz default now()
);
```

### Flujo de cada endpoint

**`/api/agents/research-trends`** (cada día 05:00 UTC):
1. Llama Apify `instagram-hashtag-scraper` con 8 hashtags IA prioritarios
2. Extrae top 10 reels/posts de últimas 24h por engagement
3. Insert filas en `daily_trends`
4. Resumen Telegram: "Top trend hoy: X (Y likes/Z comments)"

**`/api/agents/generate-brief`** (05:30 UTC):
1. Lee `daily_trends.scraped_at >= today` ordenado por engagement
2. Lee brand bible + plan-mensual + banco-contenido + KPIs ayer
3. Claude genera 3 briefs según rotación pilar (alternos por día):
   - AM: Tendencia (pilar 1)
   - MID: VALOR o BTS (pilar 2 o 6)
   - PM: Stack/DR/Provocador (pilar 3, 4 o 5)
4. Insert filas en `daily_briefs` con `status='pending'`

**`/api/agents/render-and-enqueue`** (06:00 UTC):
1. Lee `daily_briefs.status='pending'` para hoy
2. Para cada uno:
   - Llama Higgsfield CLI con modelo del pilar (UNLIMITED-first)
   - Descarga PNG en `/tmp/brief-<id>/background.png`
   - Inyecta brief en compose-slides custom (carpeta nueva con slide-1..10)
   - Genera CAPTION.md
   - Llama `enqueue-content.mjs <carpeta> --brand=darkroom --slot={am|mid|pm} --when=ISO`
   - Update `daily_briefs.status='enqueued'` con `enqueued_id`
3. Resumen Telegram: "✅ 3 carruseles encolados para hoy"

---

## 8 · KPIs control mes 1 expandido

Aumentamos producción 50% → KPIs proporcionalmente:

| Métrica | Calendario v2 | Pivot Mayo |
|---|---|---|
| Followers (52k → ?) | +10k | **+15k** |
| Engagement rate avg | ≥4% | **≥5%** |
| DMs cualificados | ≥100 | **≥150** |
| Conversiones Dark Room (Pro/Lifetime) | ≥30 | **≥45** |
| Lifetime deals | ≥8 | **≥12** |
| Coste créditos Higgsfield | <300 | **<400** |
| Coste $ infra (Higgsfield + ElevenLabs + Suno) | $50-100 | **$50-100** (sin cambio) |

---

## 9 · Reglas duras (heredadas + ampliadas)

1. **Cero menciones a PACAME como agencia** en cuentas y contenido — la cuenta es ahora "observatorio IA + Dark Room"
2. **Safe areas IG**: validadas en cada pieza por composer hardenado (PR #117 + #118)
3. **Doble aprobación + cost-guard** para video premium (Veo/Seedance/Kling) — sin cambio
4. **Cero dark patterns**: tarjeta para trial, "cancela hablando con soporte", popups
5. **70/20/10**: si en 1 semana >2 pitches DR consecutivos, paramos pitch hasta restaurar
6. **Pivot orgánico, no anuncio**: nunca decir "ahora hablamos de IA en lugar de marketing"
7. **Capa 4 (La Caleta) + Capa 1 PACAME** NUNCA aparecen asociadas a Dark Room en este feed
8. **Brand bible v2.0** estricta para pilares 4 + 5 (acid green Dark Room) · paleta extendida en pilares 1 + 2 + 3 (acentos por marca de modelo IA)

---

## 10 · Próximas validaciones

- **Mañana 8 may 11:00 ES**: C1 "Factura IA" v2 publicado en feed (id `adae4bb5-b471-43a0-bfe5-447ddbc909d1`). Validar: no texto tapado, brand mark visible, 10 slides cargan, hashtags ok.
- **Día 1-3**: producir manualmente 9 carruseles (3/día con mix pilares 1-6) para alimentar cola mientras se construye el pipeline auto.
- **Día 4-7**: deploy de los 3 endpoints + tablas Supabase. Primer ciclo automático completo.
- **Día 8-30**: el sistema corre solo. Pablo solo aprueba reels premium semanales y revisa digest Telegram nocturno.

---

**Versión**: 1.0 · **Fecha**: 2026-05-07 · **Próxima revisión**: 8 jun 2026 (cierre mes 1)
