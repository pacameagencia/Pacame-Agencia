# RETOMAR-AQUI · Punto de entrada DARK_FRAMES + Calendario @darkroomcreative.cloud

> **Si abres un nuevo chat de Claude Code y la conversación menciona DARK_FRAMES, cinemáticas IA, reels darkroomcreative.cloud, calendario mayo 2026, lanzamiento Dark Room, o continuación del trabajo creativo → LEE ESTE ARCHIVO PRIMERO.**

> **Última actualización**: 2026-05-07 (tercera iteración) · PR #122 + #124 + #126 + #131 + #133 + (próximo PR · v2 con 10 tipos contenido).

## ⚠️ Datos clave que cambian todo

- **Cuenta IG real**: `@darkroomcreative.cloud` (52.205 followers · NO @pacamespain como decíamos coloquialmente · token Meta correctamente conectado).
- **Audiencia REAL** (Meta Graph API verificado 2026-05-07): 80% LATAM (MX > US > AR > ES = solo 11%) · 78% hombres · 61% entre 35-54 años · top ciudades Santiago/Lima/CDMX/Bogotá/Caracas.
- **Audiencia OBJETIVO** (decisión Pablo): creators IA + emprendedores digitales hispanohablantes. Aceptamos perder engagement de la audiencia heredada para construir audiencia nueva alineada con producto Dark Room.
- **Soul Character Pablo**: reference_id = `PACAME` (entrenado Higgsfield · disponible en `web/.env.local` como `PACAME_SOUL_CHARACTER_ID`).
- **Pricing canónico**: 24,90€/mes Pro · 349€ Lifetime (drop 100 plazas fase 3) · trial 14 días sin tarjeta.

---

## ¿Qué es DARK_FRAMES?

Serie cinemática IA para `@darkroomcreative.cloud` (52k followers heredados). Cada pieza:

- 100% generada con IA (Cinema Studio Video 3.0 / Seedance 2.0).
- Replica técnica REAL de Hollywood (DPs concretos, lentes, LUTs, ritmo, audio).
- Outro Dark Room 2s obligatorio (única conexión con la marca).
- Auto-publicada via cron tras pasar quality gate de 11 checks.
- Soul Character Pablo `PACAME` disponible desde dark-frames-002 en adelante.

Objetivo declarado por Pablo: *"crear contenido TOP TOP de última calidad para generar visitas a Instagram y crear comunidad. Dark Room es la herramienta que uso para generar este contenido"*.

---

## 📅 Calendario @darkroomcreative.cloud · 10 tipos de contenido rotando

| Día | AM 09:00 | MID 14:30 | PM 19:30 |
|---|---|---|---|
| **Lun** | 💡 Idea negocio IA | 🎯 Lista top X | 📊 Comparativa honesta |
| **Mar** | 💰 Caso real cifras | 🏠 IA cotidiana | 🎬 Reel DARK_FRAMES |
| **Mié** | ⚡ Prompt/workflow | 😂 Humor/meme IA | 💡 Idea negocio IA #2 |
| **Jue** | 🎯 Lista TOP X (ancla) | 📰 Tendencia hot IA | 🎬 Reel HERO DARK_FRAMES |
| **Vie** | 🎬 Storytime BTS reel | 🏠 IA cotidiana | 🎬 Reel DARK_FRAMES |
| **Sáb** | 📊 Comparativa honesta | 😂 Humor/meme IA | ⚡ Prompt/workflow |
| **Dom** | 📺 Tutorial 60s reel | 📅 Recap semana IA | 💔 Storytime emocional (1×mes) |

+ 6 stories diarias rotativas (tendencia / repromo / tip / BTS / repromo / recap CTA Dark Room).

**Distribución 231 filas BD prod** · `select content_type, count(*) from content_queue where source like 'calendar-skeleton%' group by content_type`:
story_general 150 · dark_frames_storytime 15 · tendencia_hot 10 · prompt_workflow 7 · lista_top 7 · ia_cotidiana 7 · comparativa 7 · humor_meme 7 · idea_negocio 6 · tutorial_60s 4 · recap_semana 4 · storytime_emocional 4 · caso_real 3.

---

## Mapa de archivos críticos (lee en este orden)

### 0. ⭐ Calendario maestro 24 días (7-may → 31-may 2026)
[`strategy/calendario-7may-31may-2026.md`](../calendario-7may-31may-2026.md) — **plan completo** · 232 piezas · 3 fases lanzamiento (educar/introducir/drop Lifetime) · quality gate research-first escalado por tier (cine/noticia/trend) · 24 cards día por día · pricing canónico 349€ Lifetime · KPIs target periodo. **El doc maestro vivo del periodo**.

### 1. Brand bible serie DARK_FRAMES
[`strategy/darkroom/serie-dark-frames.md`](./serie-dark-frames.md) — visión + 16 conceptos + 13 reglas duras + tier system + pipeline técnico.

### 2. Pipeline técnico
- [`tools/dark-frames/README.md`](../../tools/dark-frames/README.md) — uso end-to-end del pipeline.
- [`tools/dark-frames/render-piece.mjs`](../../tools/dark-frames/render-piece.mjs) — orquestador concept→shots→ffmpeg→meta.json.
- [`tools/dark-frames/enqueue-reel.mjs`](../../tools/dark-frames/enqueue-reel.mjs) — quality gate 10 checks bloqueantes.
- [`tools/dark-frames/lib/model-router.mjs`](../../tools/dark-frames/lib/model-router.mjs) — tier system (top/standard/cheap).

### 3. Conceptos schema v2 (cada uno con research-first real)
- [`tools/dark-frames/concepts/dark-frames-001.json`](../../tools/dark-frames/concepts/dark-frames-001.json) · sci-fi pasillo Wallace Corp · BR2049 · Roger Deakins
- [`tools/dark-frames/concepts/dark-frames-002.json`](../../tools/dark-frames/concepts/dark-frames-002.json) · Tarantino × Stranger Things · Sekuła + Tim Ives
- [`tools/dark-frames/concepts/dark-frames-003.json`](../../tools/dark-frames/concepts/dark-frames-003.json) · GTA Tokio POV · Lance Acord + REDengine
- [`tools/dark-frames/concepts/dark-frames-004.json`](../../tools/dark-frames/concepts/dark-frames-004.json) · Mad Max Tokio HERO · John Seale · BAFTA 2016

### 4. Backend en producción
- `infra/migrations/044_content_queue_video.sql` (✅ aplicada Supabase prod)
- `web/lib/instagram.ts::publishReel()` (Graph v21 media_type=REELS)
- `web/app/api/agents/auto-publish/route.ts` (cron extendido a format='reel')

### 5. Plan de la sesión inicial
[`C:\Users\Pacame24\.claude\plans\estoy-con-una-conversacion-floating-rainbow.md`](../../../../../.claude/plans/estoy-con-una-conversacion-floating-rainbow.md)

---

## Reglas de memoria activas (cargadas auto en cada chat)

Las 6 reglas que rigen el trabajo creativo @pacamespain están en `C:\Users\Pacame24\.claude\projects\c--Users-Pacame24-Downloads-PACAME-AGENCIA\memory\` y se cargan solas:

1. **`feedback_cine_real_research_first.md`** — antes de cualquier prompt cine: investigar referente real (DP, lentes, LUT, ritmo, audio). Render-piece BLOQUEA si research vacío.
2. **`feedback_research_first_escalado_por_tier.md`** ⭐ NUEVA — research-first se aplica a TODO contenido @pacamespain (no solo DARK_FRAMES) escalado por tier: `cine` (hero) · `noticia` (carruseles con source_url verificable) · `trend` (stories con Apify scrape ID). Tier 0 = bloquea si no cumple.
3. **`feedback_calidad_top_aprovecha_unlimited.md`** — Cinema Studio Video 3.0 / Seedance 2.0 default cinemático. NO Veo. Ahorrar solo en piezas funcionales con unlimited del plan Plus.
4. **`feedback_calidad_top_no_pilotos.md`** — calidad TOP siempre. Prohibido tests/pilotos en feed real.
5. **`feedback_no_video_auto.md`** REVISADA 2026-05-07 — auto-publish OK con quality gate.
6. **`feedback_doble_aprobacion_videos.md`** — modelos premium requieren 2 SÍ Pablo + cost-guard token (≥16 chars).

---

## Estado actual (snapshot 7-may-2026 · segunda iteración)

| Item | Estado |
|---|---|
| Backend DARK_FRAMES (migration + publishReel + auto-publish) | ✅ Producción |
| Pipeline tools/dark-frames/ | ✅ Listo |
| Outro Dark Room 2s | ✅ Generado y verificado (`tools/dark-frames/assets/outro-darkroom-2s.mp4`) |
| 4 conceptos schema v2 + moodboards research-first | ✅ Listos para renderizar |
| ⭐ Doc maestro calendario 24 días (7-may → 31-may) | ✅ Creado · `strategy/calendario-7may-31may-2026.md` |
| ⭐ Regla research-first escalado por tier (cine/noticia/trend) | ✅ Memoria persistente activa |
| ⭐ Pricing canónico 349€ Lifetime alineado en banco-contenido | ✅ |
| Render real concept 001 | ⚠️ Pendiente · requiere doble OK Pablo + cost-guard |
| Visual-reviewer subagent sobre primer corte | ⏸ Pendiente tras render real |
| Enqueue + auto-publish primer reel + carrusel C1 Factura IA | ⏸ Pendiente · arranque mañana 8-may |
| Pipeline auto generate-brief con tier `noticia` source_url | ⚠️ Stub · pendiente implementar bloqueo en `/api/agents/generate-brief` |
| Composer stories con tier `trend` apify_scrape_id | ⚠️ Stub · pendiente implementar bloqueo en `compose-stories.mjs` |

---

## Próximo paso accionable

1. Pablo aprueba el bloque de 4 conceptos (revisión moodboards + JSON).
2. Render real concept 001 con `--approved-by-pablo --cost-guard-token=$(openssl rand -hex 16)`.
3. Visual-reviewer subagent valida `output/dark-frames-001/reel.mp4`.
4. Si OK → `enqueue-reel.mjs` programa publicación martes 12 may.
5. Cron auto-publish dispara `publishReel()` a Graph v21 → publicado en feed.

Comando exacto para arrancar render real cuando Pablo dé OK:

```bash
cd tools/dark-frames
node render-piece.mjs --concept=dark-frames-001 \
  --approved-by-pablo \
  --cost-guard-token=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
```

---

## Patrón replicable a CUALQUIER referente

El schema v2 + research-first se aplica a CUALQUIER tipo de pieza cinemática (videojuego, peli fantasía, acción, terror, animación, documental falso). Para crear un concepto nuevo:

1. Identificar referente concreto (peli/juego/director).
2. Lanzar `Web_Researcher` agent con prompt tipo el usado para BR2049/Mad Max/Tarantino: pedir DP, lentes, LUT, ritmo, audio con fuentes verificables.
3. Crear concept JSON copiando estructura `dark-frames-001.json` y rellenando bloque `research` con datos reales.
4. Crear moodboard MD copiando estructura `moodboards/dark-frames-001.md`.
5. `render-piece --dry-run` para verificar que pasa el bloqueo research-first.
6. Render real con doble OK + cost-guard.

Conceptos backlog ya con storyboard básico en `serie-dark-frames.md` sección 5 (12 conceptos · Cyberpunk Tokyo bike, Western moderno, Akira live-action, Wes Anderson dirige GTA, Backrooms, Witcher 4 falso, found footage extraterrestre, drift Tokyo F&F, Star Wars cantina, Inception, The Last of Us 3, Studio Ghibli realista).

---

## Si algo no encaja con lo que está aquí

Esto es snapshot del 2026-05-07. Si abres un chat semanas/meses después:

1. Comprobar últimos commits: `git log --oneline -20 --grep="dark-frames"`.
2. Comprobar si hay PRs nuevos sobre el pipeline: `gh pr list --search "dark-frames"`.
3. Re-leer `serie-dark-frames.md` — es el doc maestro vivo.
4. Reglas en memoria pueden haber sido revisadas (mira fecha en frontmatter).

---

**Versión**: 1.0 · creado 2026-05-07 tras merge PR #122 commit `ed6b74c`.
**Sincronizado con**: `PacameCueva/04-Workflows/dark-frames-pipeline.md` (vault Obsidian).
