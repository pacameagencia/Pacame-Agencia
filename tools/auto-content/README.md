# Auto-content pipeline · Dark Room en @pacamespain

Pipeline diario que produce 3 carruseles + 6 stories en @pacamespain sin intervención humana. Definido por `strategy/darkroom/calendario-mayo-2026-pivot-observatorio.md`.

## Arquitectura

```
05:00 UTC (07:00 ES)  daily-pipeline.mjs corre via GitHub Actions
   │
   ├─► research.mjs   Apify → top 24h hashtags IA → daily_trends
   │
   ├─► brief.mjs      Claude lee trends + brand bible → 3 briefs (AM/MID/PM)
   │
   ├─► render.mjs     Higgsfield CLI background (modelo según pilar UNLIMITED-first)
   │                  + compose-slides custom → 10 slides PNG
   │                  + caption.md
   │
   └─► enqueue.mjs    catbox.moe upload + Supabase content_queue insert
                      (status='pending' · scheduled_at por slot)

Master-cron Vercel (existente, PR #115/117)
   │
   ├─► 09:00 UTC → carrusel AM
   ├─► 12:30 UTC → carrusel MID
   └─► 17:30 UTC → carrusel PM

Stories: análogo · 6 slots horarios + render batch lunes
```

## Por qué GitHub Actions y no Vercel

Higgsfield CLI requiere binario nativo + auth login persistente. En Vercel
serverless no es viable. GitHub Actions runners pueden:

- Instalar el CLI via `curl install.sh` o npm pkg
- Mantener la sesión vía secret `HIGGSFIELD_AUTH_TOKEN` (TODO: auth no-interactivo)
- Tener Node, npm, ffmpeg para edición video reels
- Despachar el script en cron diario

## Stack

- Node 22+
- @apify/apify-client (research)
- @anthropic-ai/sdk (brief)
- @higgsfield/cli o binario directo (render)
- sharp + opentype.js (composer reuse de carruseles-darkroom)
- @supabase/supabase-js (enqueue)

## Estado

🚧 Stub inicial. Próximo PR: implementar research + brief end-to-end y
testear con un día de producción real antes de activar el cron.

## Ejecución manual (mientras se construye)

```bash
node tools/auto-content/daily-pipeline.mjs --dry-run --date=2026-05-09
```

## Variables de entorno requeridas

(Ya en `web/.env.local` excepto Anthropic key que es nueva)

```
APIFY_API_KEY              ✅ (ya configurado)
ANTHROPIC_API_KEY          ⚠️ (nuevo, para Claude API briefs)
HIGGSFIELD_AUTH_TOKEN      ⚠️ (TODO: capturar tras auth login local)
NEXT_PUBLIC_SUPABASE_URL   ✅
SUPABASE_SERVICE_ROLE_KEY  ✅
TELEGRAM_BOT_TOKEN         ✅ (digest diario)
TELEGRAM_CHAT_ID           ✅
```

## TODOs (próximos PRs)

- [ ] Migration Supabase `daily_trends` + `daily_briefs`
- [ ] `lib/research.mjs`: wrap Apify + insert filas
- [ ] `lib/brief.mjs`: Claude prompt brand-bible-aware + insert briefs
- [ ] `lib/render.mjs`: spawnear higgsfield CLI + compose-slides custom
- [ ] `lib/enqueue.mjs`: refactor de carruseles-darkroom/enqueue-content.mjs como módulo
- [ ] `daily-pipeline.mjs`: orquestador
- [ ] `.github/workflows/daily-content.yml`: cron 05:00 UTC
- [ ] `--dry-run` mode para tests sin gastar créditos ni publicar
- [ ] Smoke test: un día completo de producción manual antes de activar cron
