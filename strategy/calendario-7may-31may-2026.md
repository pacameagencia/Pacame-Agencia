# Calendario maestro @darkroomcreative.cloud · 7-may → 31-may 2026 (24 días)

> **Estado**: doc maestro vivo · v2 con 10 tipos de contenido rotando (iteración Pablo 2026-05-07).
> **Cuenta IG real**: `@darkroomcreative.cloud` (52.205 followers reales según Meta Graph API).
>   ⚠️ Antes referida coloquialmente como `@pacamespain`. La cuenta correcta y conectada al pipeline es darkroomcreative.cloud.
> **Audiencia REAL** (Meta Graph): 80% LATAM (MX 7.337 + AR 5.648 + COL 4.800 + CL 3.677 · ES solo 5.597 = 11%) · 78% hombres · 61% entre 35-54 años · top ciudades Santiago/Lima/CDMX/Bogotá/Caracas.
> **Audiencia OBJETIVO** (decisión Pablo 2026-05-07): creators IA + emprendedores digitales hispanohablantes. Aceptamos que la audiencia heredada actual reduzca engagement mientras construimos audiencia nueva alineada con producto Dark Room.
> **Periodo**: 24 días · 7-may a 31-may 2026.
> **Volumen total**: 231 filas en BD producción (status=draft) + 10 cost-guard tokens emitidos para reels DARK_FRAMES.
> **Filosofía**: research-first escalado por tier + auto-publish con quality gate de 11 checks.
> **Maintainer**: Claude Code (auto-pipeline) + Pablo (aprobación bloque semanal lunes 09:00 ES).
> **Aprobado por Pablo**: 2026-05-07 (v1) + iteración 10 tipos rotando (v2 mismo día).

---

## 0 · TL;DR (lo que hay que saber en 60 segundos)

- **3 fases lanzamiento Dark Room**: educar (7-15 may, 0% pitch) → introducir (16-23 may, 15% pitch) → drop Lifetime (24-31 may, 25% pitch + 100 plazas 349€).
- **10 tipos de contenido rotando** (3 carruseles/día con tipo distinto + 6 stories diarias + reels DARK_FRAMES martes/jueves-HERO/viernes):
  1. 💡 Idea negocio IA · 2. 💰 Caso real cifras · 3. ⚡ Prompt/workflow · 4. 🎯 Lista top X · 5. 🎬 DARK_FRAMES + storytime BTS · 6. 📊 Comparativa honesta · 7. 📺 Tutorial 60s reel · 8. 💔 Storytime emocional (1×mes) · 9. 🏠 IA cotidiana (vida real) · 10. 😂 Humor/meme IA.
- **Soul Character Pablo (`PACAME`)** disponible para reels DARK_FRAMES desde dark-frames-002 en adelante.
- **Quality gate research-first escalado por tier** (regla `feedback_research_first_escalado_por_tier.md`):
  - Tier `cine` (DARK_FRAMES, hero) → bloque research completo (DP+lentes+LUT+audio+fuentes)
  - Tier `noticia` (carruseles) → bloque source con `source_url` verificable + cita verbatim
  - Tier `trend` (stories) → bloque trend con Apify scrape ID + hashtag + engagement real
- **Auto-publish** activo en cron `/api/agents/auto-publish` para los 3 tiers tras pasar quality gate.
- **Pricing canónico**: 24,90€/mes Pro · **349€ Lifetime** (drop 100 plazas en fase 3) · trial 14 días sin tarjeta.
- **KPIs target periodo**: +12k followers · ≥36 conversiones DR · ≥10 lifetime deals · engagement ≥5% · coste <400 cr · <$70 USD infra.

---

## 0bis · Calendario semanal patrón (10 tipos rotando)

| Día | AM 09:00 | MID 14:30 | PM 19:30 |
|---|---|---|---|
| **Lun** | 💡 Idea negocio IA | 🎯 Lista top X | 📊 Comparativa honesta |
| **Mar** | 💰 Caso real cifras | 🏠 IA cotidiana | 🎬 Reel DARK_FRAMES |
| **Mié** | ⚡ Prompt/workflow | 😂 Humor/meme IA | 💡 Idea negocio IA #2 |
| **Jue** | 🎯 Lista TOP X (ancla) | 📰 Tendencia hot IA | 🎬 Reel HERO DARK_FRAMES |
| **Vie** | 🎬 Storytime BTS reel | 🏠 IA cotidiana | 🎬 Reel DARK_FRAMES |
| **Sáb** | 📊 Comparativa honesta | 😂 Humor/meme IA | ⚡ Prompt/workflow |
| **Dom** | 📺 Tutorial 60s reel | 📅 Recap semana IA | 💔 Storytime emocional (1×mes) |

Distribución real verificada en BD (231 filas con `content_type` asignado):
- story_general: 150 · dark_frames_storytime: 15 · tendencia_hot: 10
- prompt_workflow: 7 · lista_top: 7 · ia_cotidiana: 7 · comparativa: 7 · humor_meme: 7
- idea_negocio: 6 · tutorial_60s: 4 · recap_semana: 4 · storytime_emocional: 4 · caso_real: 3

---

## 1 · 3 fases lanzamiento gradual

### Fase 1 · EDUCAR · 7-15 may (9 días)

**Tono narrativo**: el observatorio IA habla de tendencias, modelos nuevos, comparativas. Dark Room aparece SOLO como "el stack que uso" sin pitch agresivo. 0% pitch directo. 100% valor.

**Mix pilares**: 1 (Tendencia 40%) + 2 (VALOR 30%) + 3 (Stack 15%) + 6 (BTS 10%) + 5 (Provocador 5%). Pilar 4 (Dark Room directo) **SUSPENDIDO** esta fase.

**Volumen**: 27 carruseles + 54 stories + 3 DARK_FRAMES + 1 hero jueves + 2 adhocs.

**Hito clave**: 8-may 11:00 ES carrusel C1 "Factura IA" (id `adae4bb5-b471-43a0-bfe5-447ddbc909d1`) sale como pieza ancla del periodo.

### Fase 2 · INTRODUCIR · 16-23 may (8 días)

**Tono narrativo**: Dark Room entra como solución natural al dolor expuesto en fase 1. Casos reales (Lucía, Marta), comparativas explícitas, BTS de Pablo construyendo Dark Room. 15% pitch suave.

**Mix pilares**: 1 (Tendencia 30%) + 2 (VALOR 25%) + 3 (Stack 15%) + **4 (Dark Room directo 20%)** + 6 (BTS 5%) + 5 (Provocador 5%).

**Volumen**: 24 carruseles + 48 stories + 2 DARK_FRAMES + 1 hero jueves + 2 adhocs.

**Hito clave**: 18-may carrusel "Pre-anuncio Lifetime drop · estamos preparando 100 plazas a 349€ · te aviso por DM si me dices YA". Captación lista de espera.

### Fase 3 · DROP LIFETIME · 24-31 may (8 días)

**Tono narrativo**: drop Lifetime activo. Escasez real (100 plazas, contador descendente en stories diarias 22:30). Casos reales recientes ("Marta canceló 5 suscripciones · ahorra 196€/mes"). Última semana = push agresivo controlado. 25% pitch (excepción autorizada al 70/20/10 estándar por evento de lanzamiento).

**Mix pilares**: 1 (Tendencia 20%) + 2 (VALOR 20%) + 3 (Stack 15%) + **4 (Dark Room directo 30%)** + 6 (BTS 5%) + 5 (Provocador 10%).

**Volumen**: 21 carruseles + 42 stories + 2 DARK_FRAMES + 1 hero jueves + 2 adhocs.

**Hitos clave**:
- 24-may: anuncio oficial drop Lifetime (carrusel hero pilar 4 + reel DARK_FRAMES + 6 stories sequenciadas).
- 28-may: "quedan 47 plazas" (urgencia primera ola).
- 30-may HERO jueves: pieza cinemática DARK_FRAMES con CTA Lifetime explícito.
- 31-may 22:00 ES: cierre drop · "última hora · quedan X plazas" + carrusel "lo que pasó".

---

## 2 · Volumen detallado por tipo de pieza

| Tipo | Total 24d | Por día | Cron slot | Tier research | Modelo IA |
|---|---|---|---|---|---|
| Carrusel AM (Tendencia) | 24 | 1 (lun-dom) | 09:00 ES | `noticia` | GPT Image 2 UNLIMITED |
| Carrusel MID (VALOR/BTS) | 24 | 1 (lun-dom) | 14:30 ES | `noticia` | GPT Image 2 UNLIMITED |
| Carrusel PM (Stack/DR/Provocador) | 24 | 1 (lun-dom) | 19:30 ES | `noticia` | Seedream V5 Lite UNLIMITED · Soul Location 0.12cr |
| Story matinal (tendencia 1-frase) | 24 | 1 | 08:30 ES | `trend` | composer JS + Imagen FX |
| Story repromoción AM | 24 | 1 | 11:30 ES | n/a (repost) | n/a |
| Story tip valor | 24 | 1 | 13:00 ES | `trend` | composer JS |
| Story BTS Pablo | 24 | 1 | 17:00 ES | `trend` | composer JS · Soul Character |
| Story repromoción PM | 24 | 1 | 20:00 ES | n/a (repost) | n/a |
| Story recap + CTA Dark Room | 24 | 1 | 22:30 ES | `trend` | composer JS |
| **Reel DARK_FRAMES martes** | 3 | — | mar 19:30 ES | `cine` | Cinema Studio Video 3.0 |
| **Reel DARK_FRAMES viernes** | 4 | — | vie 19:30 ES | `cine` | Cinema Studio Video 3.0 |
| **Hero jueves DARK_FRAMES** | 3 | — | jue 19:30 ES | `cine` | Cinema Studio Video 3.0 + Seedance 2.0 |
| Adhocs tendencia hot | 6 | ~2/sem | adhoc | `noticia` | tier según urgencia |
| **TOTAL** | **232** | | | | |

---

## 3 · Quality gate por tier (cómo se valida CADA pieza antes de auto-publish)

### Tier `cine` (DARK_FRAMES + hero pieces)

Schema concept JSON v2 con bloque `research` obligatorio (DP, lentes, LUT, ritmo, audio + fuentes). Render-piece BLOQUEA si vacío. Pipeline completo en [`tools/dark-frames/README.md`](../tools/dark-frames/README.md). Quality gate de 10 checks bloqueantes en `enqueue-reel.mjs`.

### Tier `noticia` (carruseles AM/MID/PM)

Brief generador (`/api/agents/generate-brief`) extiende para incluir bloque `source` obligatorio:

```json
{
  "research_tier": "noticia",
  "source": {
    "source_url": "https://anthropic.com/news/...",
    "source_quote": "claim verbatim del anuncio oficial",
    "source_date": "2026-05-08",
    "verification_check": "Apify scrape 2026-05-08 + manual link visit + cross-check con TechCrunch"
  },
  "cited_data": [
    { "value": "$15/Mtok input", "source": "anthropic.com/api/pricing" },
    { "value": "200k context", "source": "release notes" }
  ]
}
```

Generador BLOQUEA si:
- `source.source_url` ausente o devuelve 404 al verificar (HEAD request automático).
- Cualquier dato numérico/precio en slides sin entry en `cited_data`.
- `source_date` >7 días viejo para pilar Tendencia (35% mix · debe ser noticia fresca).

### Tier `trend` (stories)

Composer stories (`compose-stories.mjs`) lee fila `daily_trends` con `used=false`. Bloque `trend` mínimo:

```json
{
  "research_tier": "trend",
  "trend": {
    "apify_scrape_id": "uuid_de_daily_trends",
    "hashtag_origin": "#nanobananapro",
    "top_post_engagement": 23847,
    "scraped_at": "2026-05-08T05:00:00Z"
  }
}
```

Composer BLOQUEA si:
- `trend.apify_scrape_id` ausente.
- Fila Apify >24h vieja sin renovar.
- Si Apify no devolvió tendencias frescas ese día → composer **skipea** ese slot story (mejor saltar que inventar).

### Tier 0 (auto-skip)

Cualquier pieza que NO tenga research del tier que le corresponde NO se publica. Mejor saltar el slot del calendario que publicar contenido inventado. Slot vacío se loggea en `content_quality_log`.

---

## 4 · Calendario día por día (24 cards)

> Cada día tiene: 3 carruseles (AM/MID/PM con pilar declarado) + 6 stories + reel/hero si aplica.
> El cron `/api/agents/render-and-enqueue` (06:00 UTC) lee este calendario y produce las piezas del día.

### FASE 1 · EDUCAR (7-15 may)

| Día | Fecha | AM (Tend.) | MID (VALOR/BTS) | PM (Stack/DR/Prov.) | Reel/Hero |
|---|---|---|---|---|---|
| Mié | **7 may** | "GPT-5 vs Claude Opus 4.7" comparativa | "Framework: cómo elegir modelo IA según tarea" | Stack: "Las 12 herramientas IA que pago hoy" | — |
| Jue | **8 may** | C1 "FACTURA IA: 308€/MES" (ancla periodo) | "Tutorial: prompt cinematográfico research-first" | Stack: "Por qué Cinema Studio Video 3.0 vs Veo" | **HERO**: DARK_FRAMES `dark-frames-001` (sci-fi pasillo BR2049) |
| Vie | **9 may** | "Higgsfield añade Seedance 2.0 al plan" | BTS Pablo: "12h investigando Roger Deakins" | Provocador: "Veo es batch tool, no cinemático" | **REEL**: DARK_FRAMES `dark-frames-002` (Tarantino × Stranger Things) |
| Sáb | **10 may** | "Top 5 anuncios IA semana" | "Tutorial: cómo verificar fuente noticia IA" | Stack: "Mi setup ElevenLabs free tier" | — |
| Dom | **11 may** | "Resumen IA semana en 60s" | BTS: "Mi domingo construyendo pipeline" | Stack: "Suno free tier · 50 canciones/mes" | — |
| Lun | **12 may** | "Lunes hot: noticia IA top weekend" | "Framework: cuándo NO usar IA" | Stack: "Apify hashtag scraper setup" | — |
| Mar | **13 may** | "Modelo nuevo X salió ayer · primer review" | "Tutorial: composer carrusel zero coste" | Stack: "Catbox.moe vs Supabase storage" | **REEL**: DARK_FRAMES `dark-frames-003` (GTA Tokio POV) |
| Mié | **14 may** | "Comparativa precios APIs IA mayo 2026" | BTS: "Cómo gestiono 232 piezas/mes" | Stack: "Mi cron master GitHub Actions" | — |
| Jue | **15 may** | "Anuncio: lo que viene la semana que viene" | "Tutorial: dual-cuenta IG personal+brand" | Provocador: "Si tu agencia te cobra 3000€/mes por esto, te están robando" | **HERO**: DARK_FRAMES backlog (Cyberpunk Tokyo bike) |

### FASE 2 · INTRODUCIR (16-23 may)

| Día | Fecha | AM (Tend.) | MID (VALOR/BTS) | PM (Stack/DR) | Reel/Hero |
|---|---|---|---|---|---|
| Vie | **16 may** | "Modelo nuevo Y release notes" | "Caso: cuánto ahorra creator real con stack IA" | **DR**: "Lo que hago a diario en Dark Room" | **REEL**: DARK_FRAMES `dark-frames-004` (Mad Max Tokio HERO) |
| Sáb | **17 may** | "Sábado: trending hashtags IA" | "Framework: workflow creator 2026" | **DR**: "Por qué construí Dark Room" | — |
| Dom | **18 may** | "Domingo recap semana IA" | "Tutorial: comparativa Adobe vs alternativas" | **DR**: pre-anuncio Lifetime drop "te aviso por DM si me dices YA" | — |
| Lun | **19 may** | "Lunes hot: noticia IA" | "Caso real Lucía 297€→29€/mes" | **DR**: "Stack incluido en Dark Room (12 herramientas)" | — |
| Mar | **20 may** | "Modelo Z review primera impresión" | "Tutorial: prompt research-first paso a paso" | **DR**: "Trial 14 días sin tarjeta" | **REEL**: DARK_FRAMES backlog (Western moderno IA) |
| Mié | **21 may** | "Comparativa modelo nuevo vs SOTA actual" | BTS: "Cómo entrené Soul Character mio" | Provocador: "Adobe perdió a freelance en 2013" | — |
| Jue | **22 may** | "Anuncio comunidad creators 2026" | "Caso: Marta canceló 5 subs · ahorra 196€/mes" | **DR**: "Cómo se gestiona Dark Room (zona gris explicada)" | **HERO**: DARK_FRAMES backlog (Akira live-action moto) |
| Vie | **23 may** | "Resumen anuncios IA semana 2" | "Framework: cuándo cancelar suscripción IA" | **DR**: "Recordatorio Lifetime drop mañana" | **REEL**: DARK_FRAMES backlog (Wes Anderson dirige GTA) |

### FASE 3 · DROP LIFETIME (24-31 may)

| Día | Fecha | AM (Tend.) | MID (VALOR/BTS) | PM (DR-heavy) | Reel/Hero |
|---|---|---|---|---|---|
| Sáb | **24 may** | "Sábado IA roundup" | "Tutorial: setup completo creador IA" | **DROP LIFETIME 100 plazas 349€** (carrusel hero pilar 4) | — |
| Dom | **25 may** | "Domingo: 1 modelo IA infravalorado" | BTS: "Mis primeros 24h del drop · números reales" | **DR**: "Quedan 78 plazas · cómo se calcula amortiza en 35 días" | — |
| Lun | **26 may** | "Lunes hot · noticia IA fresca" | "Caso real cliente DR (con consentimiento)" | **DR**: "Quedan 65 plazas" | — |
| Mar | **27 may** | "Modelo IA del momento · review pro" | "Tutorial: cómo migrar de Adobe a Dark Room en 1h" | **DR**: "Quedan 53 plazas + reseñas reales" | **REEL**: DARK_FRAMES backlog (Backrooms liminal POV) |
| Mié | **28 may** | "Lo que pasó esta semana en IA" | BTS: "El backstage de un drop · inversión real" | **DR**: "Quedan 47 plazas · 48h restantes" | — |
| Jue | **29 may** | "Anuncio próxima semana" | "Framework: ROI suscripciones IA freelance" | Provocador: "Lo que NUNCA encontrarás en Dark Room (transparencia)" | **HERO**: DARK_FRAMES backlog (Witcher 4 fake trailer) |
| Vie | **30 may** | "Resumen mes IA mayo 2026" | "Caso: 14 lifetime deals primeros 7 días" | **DR**: "Quedan 25 plazas · 24h restantes" | **REEL**: DARK_FRAMES backlog (Found footage extraterrestre) |
| Sáb | **31 may** | "Mes mayo IA: top 10 anuncios" | "BTS: lo que aprendí del mes 1 (cifras reales)" | **CIERRE DROP**: "Quedan X plazas · última hora · 22:00 ES cierre" | — |

---

## 5 · Slots horarios maestros (cron auto-publish)

Sin cambios vs `calendario-mayo-2026-pivot-observatorio.md` (ya en producción).

| UTC | Hora ES | Pieza | Prioridad | Quality gate |
|---|---|---|---|---|
| 06:30 | 08:30 | Story matinal (tendencia) | P0 | tier `trend` |
| 07:00 | 09:00 | **Carrusel AM** (Tendencia 35%) | P0 | tier `noticia` |
| 09:30 | 11:30 | Story repromoción AM | P1 | n/a (repost) |
| 11:00 | 13:00 | Story tip valor | P1 | tier `trend` |
| 12:30 | 14:30 | **Carrusel MID** (VALOR 25% o BTS 5%) | P0 | tier `noticia` |
| 15:00 | 17:00 | Story BTS | P1 | tier `trend` |
| 17:30 | 19:30 | **Carrusel PM** (Stack/DR/Provocador) | P0 | tier `noticia` |
| 17:30 mar/jue/vie | 19:30 | **Reel DARK_FRAMES** (override mar/jue/vie) | P0 | tier `cine` |
| 18:00 | 20:00 | Story repromoción PM | P1 | n/a (repost) |
| 20:30 | 22:30 | Story recap + CTA Dark Room | P1 | tier `trend` |

3 carruseles + 6 stories diarias + 1 reel/hero según día.

---

## 6 · Pipeline operativo (cómo se ejecuta cada día)

```
05:00 UTC · /api/agents/research-trends
    Apify scrape 8 hashtags IA prioritarios → daily_trends (Supabase)
    + verificación HEAD request links → fuentes verificables
    → Telegram resumen "top trend: X (Y likes)"

05:30 UTC · /api/agents/generate-brief
    Lee daily_trends + brand bible + plan-mensual + KPIs ayer
    Claude genera 3 briefs según rotación pilar día:
      - AM: pilar 1 (Tendencia)
      - MID: pilar 2 o 6 (VALOR o BTS)
      - PM: pilar 3, 4 o 5 (Stack/DR/Provocador) - varía según fase
    Briefs incluyen bloque `source` con source_url verificable + cited_data.
    Bloquea si fuente <404 o ausente. Genera placeholder pidiendo intervención manual.
    → daily_briefs (Supabase) status=pending

06:00 UTC · /api/agents/render-and-enqueue
    Para cada brief pending:
      1. Llama Higgsfield CLI con modelo del pilar (UNLIMITED-first según tier)
      2. Compose-slides custom con brief
      3. Genera CAPTION.md con CTA según fase
      4. enqueue-content.mjs <carpeta> --brand=darkroom --slot={am|mid|pm}
      5. Update daily_briefs.status='enqueued'
    Para reels DARK_FRAMES martes/viernes/jueves (si día corresponde):
      1. Lee tools/dark-frames/concepts/<id>.json
      2. render-piece.mjs (con cost-guard pre-aprobado bloque semanal Pablo)
      3. visual-reviewer subagent valida → meta.visual_reviewer_status='approved'
      4. enqueue-reel.mjs (quality gate 10 checks)
    → Telegram resumen "✅ 3 carruseles + 1 reel encolados para hoy"

06:30 UTC · cron auto-publish despacha todo lo programado <= now()
    publishCarousel/publishPost/publishStory/publishReel via IG Graph v21
    Telegram digest tras cada publicación con permalink
```

### Aprobación bloque semanal Pablo (1×/semana)

**Lunes 09:00 ES**: Pablo revisa el bloque semanal entrante en dashboard. Aprueba:
- 7 carruseles AM (pilar 1) + 7 MID + 7 PM = 21 carruseles
- 42 stories (los 6 slots × 7 días)
- 2 reels DARK_FRAMES (mar+vie, 1 si solo mar) + 1 hero jueves si aplica
- Cualquier adhoc tendencia hot

Aprobación en bloque o pide cambios específicos. Cron auto-publica el resto de la semana con calendario fijado. Sin esto = lunes 12:00 ES bloqueo automático del cron + Telegram alerta a Pablo.

---

## 7 · KPIs target periodo (24 días)

Recalculado proporcionalmente al periodo de 24 días sobre los KPIs mensuales del calendario v2:

| Métrica | Mes 1 (30d) | Periodo (24d) |
|---|---|---|
| Followers (52k → ?) | +15k | **+12k** |
| Engagement rate avg | ≥5% | **≥5%** |
| DMs cualificados | ≥150 | **≥120** |
| Conversiones Dark Room (Pro/Lifetime) | ≥45 | **≥36** |
| **Lifetime deals** | ≥12 | **≥10** (target conservador · drop fase 3) |
| Coste créditos Higgsfield | <400 | **<320** |
| Coste $ infra (Higgsfield + ElevenLabs + Suno) | <$80 | **<$70** |
| **Adicional fase 3**: revenue Lifetime drop | n/a | **≥3.490€** (10 deals × 349€) |

---

## 8 · Reglas duras del periodo (heredadas + ampliadas)

1. **Research-first escalado por tier** (`feedback_research_first_escalado_por_tier.md`) — TODO contenido pasa por su gate.
2. **Calidad TOP siempre** (`feedback_calidad_top_no_pilotos.md`) — si dudas, no publiques. Mejor saltar slot.
3. **Calidad TOP por defecto + aprovecha unlimited** (`feedback_calidad_top_aprovecha_unlimited.md`) — Cinema Studio + Seedance default cinemático · GPT Image 2 unlimited carruseles.
4. **No video sin quality gate** (`feedback_no_video_auto.md` revisada) — los reels SÍ se auto-publican si pasan los 10 checks.
5. **Doble aprobación + cost-guard** (`feedback_doble_aprobacion_videos.md`) — modelos premium tier=top.
6. **Cero menciones PACAME como agencia** — la cuenta es observatorio IA + Dark Room.
7. **Cero menciones La Caleta + Ecomglobalbox** (`feedback_no_mencionar_personal_con_pacame.md`).
8. **Cero rostros copyright + cero logos copyright + cero kanji legible** en escena.
9. **Pricing canónico 349€ Lifetime** (NO 499€ · banco-contenido alineado 2026-05-07).
10. **70/20/10 mix inviolable EXCEPTO fase 3** que sube pitch a 30% por evento drop Lifetime (excepción autorizada por Pablo · vuelve a 70/20/10 en mes 2).
11. **Safe areas IG validadas** en cada pieza (composer hardenado PR #117 + #118).
12. **Cero dark patterns** — nada de "tarjeta para trial", "cancela hablando con soporte", popups invasivos.
13. **Tras auto-publish reel/hero**: Telegram a Pablo con permalink + opción `retirar` si engagement primer 30min < 50% baseline.

---

## 9 · Próximos pasos para arrancar (orden cronológico)

1. **Hoy 7-may noche**: Pablo revisa este calendario maestro · OK o ajustes.
2. **Mañana 8-may 09:00 ES**: render concept `dark-frames-001` (sci-fi pasillo BR2049) con doble OK + cost-guard. Visual-reviewer valida. Auto-publish 19:30 ES como HERO jueves del periodo. Carrusel C1 "Factura IA" sale 11:00 ES auto.
3. **8-15 may**: fase 1 EDUCAR corre con cron · 0% pitch directo.
4. **Cada lunes 09:00 ES**: Pablo aprueba bloque semanal (~30 min revisión).
5. **16-may**: pivot narrativo a fase 2 INTRODUCIR · activar pilar 4 (Dark Room directo 20%).
6. **24-may**: drop Lifetime activo · 100 plazas 349€ · Stripe configurado · landing actualizada · contador descendente en stories diarias 22:30.
7. **31-may 22:00 ES**: cierre drop · post-mortem mes 1 · review KPIs vs target.
8. **1-jun**: nuevo plan junio (mes 2) basado en aprendizajes.

---

## 10 · Documentos relacionados

- [`strategy/darkroom/serie-dark-frames.md`](darkroom/serie-dark-frames.md) — pipeline completo cinemáticas IA.
- [`strategy/darkroom/calendario-mayo-2026-pivot-observatorio.md`](darkroom/calendario-mayo-2026-pivot-observatorio.md) — calendario base mes 1.
- [`strategy/darkroom/banco-contenido-mes-1.md`](darkroom/banco-contenido-mes-1.md) — banco de copy listo (60+ piezas).
- [`strategy/darkroom/brand-bible.md`](darkroom/brand-bible.md) — sistema visual completo.
- [`strategy/darkroom/positioning.md`](darkroom/positioning.md) — voz + tono + zona gris explicada.
- [`strategy/darkroom/RETOMAR-AQUI.md`](darkroom/RETOMAR-AQUI.md) — punto de entrada continuidad para cualquier chat.
- [`tools/dark-frames/README.md`](../tools/dark-frames/README.md) — pipeline técnico DARK_FRAMES.
- [`tools/auto-content/README.md`](../tools/auto-content/README.md) — auto-pipeline daily.

---

**Versión**: 1.0 · **Fecha**: 2026-05-07 · **Próxima revisión**: 1-jun-2026 (cierre periodo).
**Maintainer**: Claude Code (auto-pipeline) · Pablo (aprobación bloque semanal lunes 09:00 ES).
