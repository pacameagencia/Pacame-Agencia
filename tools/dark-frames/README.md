# DARK_FRAMES — Pipeline de cinemáticas IA para @pacamespain

Serie cinemática IA con auto-publish + quality gate de 8 checks.
Brand bible: [`strategy/darkroom/serie-dark-frames.md`](../../strategy/darkroom/serie-dark-frames.md).
Memoria: `feedback_no_video_auto.md` (revisada 2026-05-07) y `feedback_calidad_top_no_pilotos.md`.

## Estructura

```
tools/dark-frames/
├── README.md                       (este archivo)
├── render-outro.mjs                genera outro Dark Room 2s reusable (1 vez)
├── render-piece.mjs                concept JSON → MP4 final + meta.json
├── enqueue-reel.mjs                quality gate 8 checks → catbox + content_queue
├── concepts/                       briefs JSON de cada pieza
│   ├── dark-frames-001.json       sci-fi pasillo neón
│   ├── dark-frames-002.json       Tarantino dirige Stranger Things
│   ├── dark-frames-003.json       GTA 7 leak Tokio
│   └── dark-frames-004.json       trailer Mad Max en Tokio (HERO)
├── moodboards/                     referencias visuales por concepto
│   ├── dark-frames-001.md
│   ├── dark-frames-002.md
│   ├── dark-frames-003.md
│   └── dark-frames-004.md
├── assets/
│   └── outro-darkroom-2s.mp4      generado una vez por render-outro.mjs
└── output/
    └── <concept-id>/               carpeta por pieza renderizada
        ├── reel.mp4                pieza final
        ├── CAPTION.md              caption + hashtags
        ├── meta.json               metadata para quality gate
        └── shots/                  shots intermedios
```

## Uso end-to-end de UNA pieza

### 1. Generar outro reusable (solo una vez por proyecto)

```bash
node tools/dark-frames/render-outro.mjs
```

Output: `tools/dark-frames/assets/outro-darkroom-2s.mp4`. Verifica visualmente antes de seguir.

### 2. Render una pieza desde su concept

**Concept solo Kling (gratis):**

```bash
node tools/dark-frames/render-piece.mjs --concept=dark-frames-001
```

**Concept con modelo premium (Veo/Seedance/Soul Cinema) — requiere doble OK Pablo + cost-guard:**

```bash
# 1. Pablo aprueba en chat (1er SÍ)
# 2. Pablo confirma de nuevo (2º SÍ)
# 3. Generar cost-guard token (32 chars random)
TOKEN=$(openssl rand -hex 16)

node tools/dark-frames/render-piece.mjs \
  --concept=dark-frames-004 \
  --approved-by-pablo \
  --cost-guard-token=$TOKEN
```

**Dry-run (no toca APIs, muestra plan):**

```bash
node tools/dark-frames/render-piece.mjs --concept=dark-frames-001 --dry-run
```

### 3. Visual-reviewer revisa el reel

Tras el render, edita `output/<concept-id>/meta.json` y cambia:

```json
"visual_reviewer_status": "approved",
"visual_reviewer_at": "2026-05-12T14:30:00Z"
```

Solo cuando el subagent visual-reviewer del proyecto + Pablo aprueben.

### 4. Enqueue auto-publish con quality gate

```bash
node tools/dark-frames/enqueue-reel.mjs tools/dark-frames/output/dark-frames-001 \
  --when=2026-05-12T17:30:00Z
```

El script ejecuta 8 checks; si todos pasan → sube MP4 a catbox.moe + insert en `content_queue` con `format='reel'`. El cron `/api/agents/auto-publish` lo publica en la ventana programada.

## Quality gate (8 checks bloqueantes)

| # | Check | Falla si… |
|---|---|---|
| 1 | files_present | falta reel.mp4, CAPTION.md o meta.json |
| 2 | concept_id_present | meta.json sin concept_id válido |
| 3 | concept_id_registered | concept_id no existe en `concepts/` |
| 4 | cost_guard_token | usa modelo premium sin token válido |
| 5 | visual_reviewer_approved | meta.visual_reviewer_status ≠ 'approved' |
| 6 | duration_range | duración < 5s o > 90s |
| 7 | resolution_correct | no es 1080×1920 |
| 8 | outro_present | outro Dark Room ausente (frame-diff) |
| 9 | caption_has_cta | caption sin "Dark Room" o "darkroomcreative.cloud" |
| 10 | series_hashtag_present | falta #DarkFrames o equivalente |

Cada intento (pase o no) se registra en tabla `dark_frames_quality_log` para auditoría e iteración.

## Reglas duras (no negociables)

1. **NUNCA** ejecutar render-piece sin concept_id en `concepts/` → bloquea prompts basura tipo "test".
2. **NUNCA** llamar Veo/Seedance/Soul Cinema sin `--approved-by-pablo` + `--cost-guard-token`.
3. **NUNCA** publicar manualmente sin pasar enqueue-reel (saltarse el gate).
4. **SIEMPRE** outro Dark Room presente — única conexión que monetiza.
5. **SIEMPRE** caption con CTA + #DarkFrames.

## Crear un concept nuevo

1. Copia `concepts/dark-frames-001.json` como `dark-frames-NNN.json`.
2. Crea moodboard `moodboards/dark-frames-NNN.md`.
3. Refina prompts iterando con `--dry-run` antes del render real.
4. Si usa Veo/Seedance: documenta justificación en `approval_notes` del JSON.

## Backlog conceptos (mes 2+)

Ver `strategy/darkroom/serie-dark-frames.md` sección 5 — 12 conceptos pre-storyboard listos.

## Troubleshooting

| Síntoma | Posible causa | Fix |
|---|---|---|
| `concept_id no existe` | falta JSON en `concepts/` | crea el JSON antes de renderizar |
| `cost-guard-token <16 chars` | token mal generado | `openssl rand -hex 16` |
| Quality gate falla check 7 (resolution) | Higgsfield devolvió otro aspect | revisa `--aspect-ratio 9:16` en CLI |
| Quality gate falla check 8 (outro) | ffmpeg no concatenó outro | regenera outro: `render-outro.mjs --force` |
| `higgsfield: command not found` | CLI no instalado | `curl -fsSL https://raw.githubusercontent.com/higgsfield-ai/cli/main/install.sh | sh` |
| Cron auto-publish no publica reel | format='reel' no se procesa | verifica que el deploy del PR con `route.ts` extendido está en producción |
