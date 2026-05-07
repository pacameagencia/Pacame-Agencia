# Serie DARK_FRAMES · Cinemáticas IA en @pacamespain

> **Estado**: v1.0 · creada 2026-05-07 · serie cinemática IA con Dark Room como herramienta visible.
> **Cuenta**: `@pacamespain` (52.292 followers · pivot observatorio IA + DR ya activo).
> **Hashtag**: `#DarkFrames`
> **Owner**: PULSE (calendario) · NOVA (estética serie) · Pablo (aprobación bloque inicial 4 piezas).
> **Aprobado por Pablo**: 2026-05-07.
> **Brand bible base**: [`brand-bible.md`](./brand-bible.md) · esta serie HEREDA paleta + tipografía + tono.
> **Calendario base**: [`calendario-mayo-2026-pivot-observatorio.md`](./calendario-mayo-2026-pivot-observatorio.md) · esta serie SUSTITUYE las 4 piezas hero del jueves + reposiciona los 8 reels martes/viernes.

---

## 0 · Por qué existe esta serie

Pablo declaró textual el 2026-05-07: *"crear contenido TOP TOP de última calidad — no busco nada concreto, sino generar visitas a Instagram para crear comunidad. Dark Room es la herramienta que uso para generar este contenido"*.

DARK_FRAMES es la respuesta concreta: contenido viral cinemático **100% generado con IA desde cero** (sin footage real de pelis ni juegos), con Dark Room visible como el stack que lo permite. El motor de captación es la **calidad audiovisual** + el **morbo del "cómo lo hizo"**, no un pitch directo.

Es complementaria, no sustituta, del observatorio IA diario: los carruseles + stories siguen tal cual. Esta serie ocupa los 8 reels semanales + 4 piezas hero del jueves que ya estaban presupuestados.

---

## 1 · Posicionamiento (qué es y qué NO es)

### Es:
- **Cinemática AAA generada con IA**: trailers falsos de juegos/pelis que no existen, gameplays imposibles, escenas mash-up.
- **Calidad TOP siempre**: si una pieza no llega al listón, no se publica. Cero "pilotos en feed real" (regla `feedback_calidad_top_no_pilotos.md`).
- **Auto-publicada vía cron** tras pasar quality gate de 8 checks (regla revisada `feedback_no_video_auto.md`).
- **Outro Dark Room 2s obligatorio** + caption con CTA + hashtag `#DarkFrames`.

### NO es:
- Reedición de footage real (no hay derechos ni capacidad).
- Pitch directo a Dark Room ("compra ya"). DR aparece como herramienta, no como producto principal del frame.
- Humor absurdo / objetos que hablan / restaurante-modelo (esos conceptos se archivan a backlog mes 2 por no encajar con la estética cinemática).
- Reels educativos tipo "5 trucos IA". Esos siguen viviendo en el calendario observatorio normal.

---

## 2 · Estética visual (extensión de brand-bible Dark Room)

### Paleta extendida (sobre la base `bg #0A0A0A` + `acid #CFFF00` de DR):

| Token | Hex | Uso en DARK_FRAMES |
|---|---|---|
| `bg-deep` | `#000000` | Fondos exteriores nocturnos / espacio profundo |
| `acid` | `#CFFF00` | Acentos del HUD, neón en escena, outro card |
| `acid-glow` | radial `#CFFF00` 80% → 0% | Halos atmosféricos sobre fuentes de luz |
| `noir-warm` | `#1A0F0A` | Sombras cálidas en escenas tipo Tarantino / Mad Max |
| `cyber-magenta` | `#FF00FF` | **EXCEPCIÓN puntual** solo cuando moodboard lo justifica (Cyberpunk-style, complementario al acid) |
| `red` | `#FF3B3B` | Alertas in-scene (no precios), HUD warnings |
| `white` | `#F2F2F2` | Captions burned-in, subtítulos |

**Regla:** los colores extra (`cyber-magenta`, `noir-warm`) solo si la moodboard del concepto lo justifica explícitamente. Default: `bg` + `acid` + `white` (90% de las piezas).

### LUTs cinematográficos por concepto:
- **Sci-fi/cyberpunk**: Blade Runner 2049 (cool teal + amber), Cyberpunk Edgerunners (saturated magenta + cyan).
- **Tarantino**: Pulp Fiction warm grading (yellow lift + crushed blacks).
- **Mad Max**: orange-teal extreme (bypass + bleach).
- **GTA-style**: hyper-real high contrast (game cinematic preset).

### Tipografía (heredada brand-bible):
- **Captions burned-in**: Anton ALL CAPS huge (impacto), Space Grotesk Bold (sub).
- **Outro Dark Room**: JetBrains Mono `darkroomcreative.cloud · 24,90€/mes`.
- **HUD in-scene** (cuando aplique): JetBrains Mono cyan/acid, glitch sutil.

### Audio:
- **Voz en off** (cuando aplique): ElevenLabs voz Brian / Adam (multilingual_v2, free tier 10k chars).
- **Música**: Suno copyright-free (50 canciones/mes free) o stems específicos por género (synthwave, drone cinematográfico, percusión épica).
- **SFX**: riser + impactos + atmosféricos. Mezcla -14 LUFS broadcast.

### Outro Dark Room 2s (template fijo):
- Fondo: `#0A0A0A` puro con grano sutil 2%.
- Logo Dark Room en el centro, 320px alto, `#CFFF00`.
- Línea inferior JetBrains Mono 32px `#F2F2F2`: `darkroomcreative.cloud · 24,90€/mes`.
- Sin animación brusca, fade-in 0.3s + hold 1.4s + fade-out 0.3s.
- Generado UNA SOLA VEZ con `tools/dark-frames/render-outro.mjs`. Reusado en todas las piezas.

---

## 3 · Tono del caption (template fijo)

```
{HOOK_TEXTO_CORTO_QUE_RESUME_LA_PIEZA}.

Stack usado: {LISTA_MODELOS_IA · ej: Veo 3.1 · Kling 3.0 · ElevenLabs}
Coste real: ${COSTE_GENERACIÓN}
Tiempo: {MINUTOS} min

Acceso a este stack en bio · Dark Room · 24,90€/mes

#DarkFrames #IA #{HASHTAG_TEMA · ej: SciFi, Tarantino, GTA} #darkroomcreative
```

**Regla:** el caption es parte del valor — el dato del coste real ($1.20 por un reel cinemático) es el hook racional que justifica la suscripción. El reel es el hook emocional.

---

## 4 · Pipeline técnico de cada pieza (v2 · research-first + tier system)

```
0. RESEARCH                   investigar peli/juego/director referente
                              (lentes, LUT, ritmo, audio, structure)
                              → documentar en concept.research (5 campos obligatorios)
1. concept JSON v2            tools/dark-frames/concepts/dark-frames-XXX.json
                              schema_version=2 · tier (top/standard/cheap) · structure_template
                              · research bloque · shots con tier + structure_role
2. moodboard MD v2            tools/dark-frames/moodboards/dark-frames-XXX.md
                              referencias visuales reales + técnica citable
3. render-piece.mjs           bloquea si research vacío · model-router resuelve por tier
                              · genera shots Higgsfield → ffmpeg → outro → meta.json
4. visual-reviewer subagent   valida estética + safe areas → meta.visual_reviewer_status='approved'
5. enqueue-reel.mjs           quality gate 8 checks → catbox.moe → content_queue (format='reel')
6. cron auto-publish          publishReel() → IG Graph v21 media_type=REELS → publicado
7. telegram digest            notifica a Pablo con permalink + opción retirar
```

### Schema v2 obligatorio (concepts/*.json)

Cada concept debe tener:

```json
{
  "schema_version": 2,
  "tier": "top|standard|cheap",
  "structure_template": "trailer_3_act|vignette_atmospheric|pov_immersive|trailer_4_beat",
  "research": {
    "references": ["peli/juego · año · director"],
    "dp_references": ["DP nombre · técnica signature"],
    "lens_specs": ["cámara · lente · apertura"],
    "lut_reference": "LUT/grading method documentado",
    "pacing_template": "estructura ritmo + cuts/min",
    "audio_references": ["compositor · tracks · sound design"],
    "research_sources": ["fuentes verificables citadas"]
  },
  "shots": [
    { "shot": 1, "kind": "video", "tier": "top",
      "structure_role": "act 1 SETUP · what does this shot do",
      "prompt": "...con referencias técnicas reales (DP, LUT, ritmo)...",
      "validation_must_have": [...] }
  ]
}
```

### Tier system (model-router)

| Tier | Modelos default video | Modelos default image | Coste | Uso |
|---|---|---|---|---|
| `top` | Cinema Studio Video 3.0 (primary) · Seedance 2.0 (fallback) | Soul Cinema · Cinema Studio Image 2.5 | $$$ | DARK_FRAMES, hero, viral cinematic |
| `standard` | Kling 3.0 Pro (UNLIMITED) | GPT Image 2 (UNLIMITED) | 0 cr | carruseles, stories cuidadas |
| `cheap` | Minimax Hailuo · Wan 2.6 | Z Image · Nano Banana 2 | $ | batch, noticias, relleno |

DARK_FRAMES default = `tier: top`. Veo 3.1 NO se usa como default cinemático (es batch tool). Cinema Studio Video 3.0 = "Soul Cinema 3.5" con nomenclatura actualizada.

### Quality gate enqueue-reel (10 checks bloqueantes)

1. files_present (reel.mp4 + CAPTION.md + meta.json)
2. concept_id_present en meta.json
3. concept_id_registered en `tools/dark-frames/concepts/`
4. cost_guard_token válido (si modelo premium)
5. visual_reviewer_approved status='approved'
6. duration_range 5-90s
7. resolution_correct 1080×1920
8. outro_present (frame-diff vs referencia, threshold 40)
9. caption_has_cta ("Dark Room" o "darkroomcreative.cloud")
10. series_hashtag_present (#DarkFrames)

Si CUALQUIER check falla → no entra a `content_queue`, registra rechazo en `dark_frames_quality_log`.

---

## 5 · Banco de 16 conceptos (mes 1: 4 + backlog: 12)

### Mes 1 — bloque inicial (refinar en paralelo, aprobar en bloque, publicar en orden):

| ID | Título de trabajo | LUT/estética | Modelo principal | Slot destino |
|---|---|---|---|---|
| `dark-frames-001` | Sci-fi: pasillo Wallace Corp | Blade Runner 2049 (Roger Deakins ASC) | DaVinci custom · cool teal + green-amber híbrido BR2049 | Cinema Studio Video 3.0 | Reel mar |
| `dark-frames-002` | Tarantino dirige Stranger Things | Pulp Fiction (Andrzej Sekuła) × Stranger Things (Tim Ives ASC) | Hybrid warm Pulp + split warm/teal Stranger Things | Cinema Studio Video 3.0 + ElevenLabs Brian | Reel vie |
| `dark-frames-003` | GTA 7 leak Tokio nocturno (POV) | Lost in Translation (Lance Acord) × Drive (Sigel) × Cyberpunk 2077 REDengine | Cyberpunk Night City sat +18% magenta/cyan + long-exposure trail Drive | Cinema Studio Video 3.0 + Seedance 2.0 | Reel mar+1 |
| `dark-frames-004` | Trailer Mad Max en Tokio | Mad Max: Fury Road (John Seale ASC ACS · BAFTA 2016) | Orange-teal extreme curve-lift documented | Cinema Studio Video 3.0 + Seedance 2.0 + ElevenLabs Brian | HERO jueves |

**Coste estimado bloque mes 1 (v2 con research-first + tier=top default)**: $0.40 + $1.20 + $1.00 + $2.50 = **~$5.10 USD**. Cero créditos del bucket Higgsfield (tier=top usa modelos premium fuera del bucket unlimited). Veo 3.1 ELIMINADO de la serie como default cinemático.

### Backlog mes 2+ (12 conceptos pre-storyboard, listos para refinar tras validar formato):

| ID | Título | LUT | Modelo |
|---|---|---|---|
| `dark-frames-005` | Cyberpunk Tokyo bike chase | Edgerunners saturated | Kling 3.0 |
| `dark-frames-006` | Western moderno · cowboy IA | Sergio Leone wide | Kling 3.0 |
| `dark-frames-007` | Animé live-action: Akira moto bike scene | Animé cel-shading + grain | Veo 3.1 |
| `dark-frames-008` | Si Wes Anderson dirigiera GTA | Pastel symmetric Wes | Kling 3.0 |
| `dark-frames-009` | Backrooms liminal POV | Liminal yellow grading | Kling 3.0 |
| `dark-frames-010` | Trailer The Witcher 4 falso | Fantasy desaturated | Veo 3.1 |
| `dark-frames-011` | Found footage extraterrestre | VHS grain + chromatic | Kling 3.0 |
| `dark-frames-012` | Drift Tokyo nocturno F&F | Neón saturado high contrast | Kling 3.0 |
| `dark-frames-013` | Star Wars: cantina alien IA | SW Mos Eisley warm | Veo 3.1 |
| `dark-frames-014` | Inception spinning hallway | Cool teal + spinning | Veo 3.1 |
| `dark-frames-015` | The Last of Us 3 trailer fake | Post-apoc green grading | Veo 3.1 |
| `dark-frames-016` | Studio Ghibli realista (Spirited Away IRL) | Ghibli pastel + lush | Veo 3.1 |

---

## 6 · Reglas duras de la serie (v2 · research-first integrated)

1. **Research-first obligatorio** (`feedback_cine_real_research_first.md`) — antes de cualquier prompt: investigar peli/director/DP/LUT/ritmo/audio del referente. Render-piece BLOQUEA si research vacío. Sin investigación real = no se renderiza.
2. **Calidad TOP siempre** — si dudas, no publiques (`feedback_calidad_top_no_pilotos.md`).
3. **Calidad TOP por defecto + aprovecha unlimited** (`feedback_calidad_top_aprovecha_unlimited.md`) — DARK_FRAMES default tier=top = Cinema Studio Video 3.0 / Seedance 2.0. NO Veo 3.1. Standard/cheap solo en piezas funcionales (NO en esta serie).
4. **Quality gate obligatorio** antes de auto-publish (`feedback_no_video_auto.md` revisada · 10 checks bloqueantes).
5. **Doble aprobación + cost-guard** para modelos premium (`feedback_doble_aprobacion_videos.md`). Cinema Studio Video 3.0 + Seedance 2.0 + Soul Cinema = premium. El model-router lo aplica automático según tier.
6. **NUNCA prompt ad-hoc tipo "test"** — render-piece.mjs rechaza si no hay concept_id en `tools/dark-frames/concepts/`. Bloquea la causa raíz del incidente histórico de prompts basura.
7. **Estructura Hollywood obligatoria** — concept.structure_template debe ser uno de: `trailer_3_act` · `vignette_atmospheric` · `pov_immersive` · `trailer_4_beat`. Cada shot tiene `structure_role` declarado.
8. **Outro Dark Room 2s obligatorio** — sin excepciones. Es la única conexión que monetiza.
9. **NO mencionar PACAME, La Caleta, Ecomglobalbox** (`feedback_no_mencionar_personal_con_pacame.md`).
10. **Cero footage real con copyright** — todo generado con IA. Cero rostros de actores reales (legal + uncanny). Cero logos copyrighted (Mad Max, Demogorgon, Mia Wallace, etc.). Cero textos legibles en escena (kanji, signs, títulos copyright).
11. **Captions burned-in en ES** (audiencia primaria ES + LATAM, 85% mira muted).
12. **70/20/10 respetado** — DARK_FRAMES son piezas de espectáculo (cuentan como BTS visual + valor implícito). Si una semana hay 2+ DARK_FRAMES con CTA Lifetime → bajar a CTA Trial.
13. **Tras auto-publicación**: Telegram a Pablo con permalink + opción `retirar` si engagement primer 30min < 50% baseline.

---

## 7 · KPIs específicos de la serie (mes 1)

Sobre los KPIs base de @pacamespain pivot observatorio:

| Métrica | Baseline reel temático | Target DARK_FRAMES |
|---|---|---|
| Views por reel | 10-15k | **≥ 30k** (×2-3) |
| Saves por reel | 200-400 | **≥ 600** (×1.5) |
| Profile visits desde reel | 100-200 | **≥ 500** (×3) |
| Conversiones DR atribuibles (UTM bio) | 1-2 | **≥ 5** |
| Engagement rate | 5% | **≥ 8%** |
| Coste promedio por pieza | 0 cr (Kling) | **≤ $0.50** (mix Kling + Veo puntual) |

**Trigger evolución**: si tras las 4 piezas mes 1 se cumplen 4/6 KPIs → continuar con backlog mes 2. Si se cumplen 2/6 → ajustar formato (más voz, menos voz, más HUD, menos HUD). Si se cumplen 0/6 → pausar y replantear.

---

## 8 · Próximas validaciones

- **Pendiente Pablo (esta sesión)**: revisar y aprobar/corregir los 4 conceptos JSON + 4 moodboards cuando estén creados.
- **Render outro 2s**: pendiente generar una vez con calidad TOP.
- **Render concepto #1**: dry-run + iteración con Kling 3.0 hasta TOP. Pasar primer corte a Pablo.
- **Bloque aprobado → enqueue 4 piezas en martes/viernes/jueves disponibles tras aprobación.

---

**Versión**: 1.0 · **Fecha**: 2026-05-07 · **Próxima revisión**: tras publicar el bloque inicial de 4 piezas.
