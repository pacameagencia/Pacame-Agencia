---
type: skill
title: pacame-contenido
tags:
  - type/skill
created: '2026-04-25T21:44:21.681Z'
source_path: >-
  C:/Users/Pacame24/Downloads/PACAME
  AGENCIA/.claude/skills/pacame-contenido/SKILL.md
neural_id: a470b33a-4e53-4d49-bf9f-22c0b3ef2d42
---

# PACAME-CONTENIDO · Manual maestro de producción

> 🛑 **GATEKEEPER GASTO VIDEO — LEE ANTES DE GENERAR**
>
> Pablo perdió ~20€ en pruebas de prompt con Veo. Esta skill toca producers que cobran $0.05–$0.20 por segundo. Antes de cualquier producción de **video**, **reel** o **teaser**:
>
> 1. **Lee [[santo-grial-visual]]** (master playbook: modelos, prompts, anti-patterns, formatos).
> 2. **Verifica que el producer importe `assertVideoApproved()`** desde `carruseles-darkroom/lib/cost-guard.mjs`. Si NO lo importa y llama a Veo/Seedance/Kling/Sora → añadirlo ANTES de ejecutar.
> 3. **Tests de prompt SOLO con imagen barata** (Nano Banana / Imagen FX). Nunca con video top.
> 4. **Doble SÍ humano** + estimación de coste explícita antes de aprobar token. Tabla de costes por modelo más abajo en este mismo documento (sección §Cálculos por tipo de pieza).
> 5. Aprobar con: `node carruseles-darkroom/lib/cost-guard.mjs approve --model="..." --cap=<USD_max> --uses=1 --ttl=30 --what="..."`
> 6. **Carruseles SÍ pueden ir al cron auto-publish** (regla `feedback_no_video_auto`). Reels/videos NO — siempre manual.

---

Capa superior que orquesta cualquier petición de contenido del proyecto PACAME (factoría agencia IA · capa 1) y Dark Room (proyecto propio · capa 3). NO duplica `pacame-viral-visuals` ni `pacame-web` — las invoca como subskills cuando aplica. Es el **router + manual + brand bibles + inventario de stack** unificado.

Toda otra skill, agente PACAME (PULSE, NOVA, COPY, SAGE…) o el propio Pablo debe consultar este documento antes de producir cualquier contenido para evitar reinventar el flujo.

---

## Cuándo se invoca

Activadores: `carrusel · story · stories · reel · tiktok · post · feed · video · teaser · voiceover · voz over · voz IA · narración · sticker · meme · whatsapp · comparativa · before after · press kit · affiliate kit · manual de marca · brand book · calendario editorial · plan de contenido · pieza social · creatividad ads · creativo · fondo IA · background hero · key art · asset social`

Y combinaciones tipo: "necesito X para [Dark Room|PACAME]" · "haz [carrusel|reel|story]" · "crea contenido sobre Y" · "plan de mes".

---

## Filosofía PACAME (3 reglas duras · innegociables)

### 1 · Research antes de generar
Nunca produzcas a ciegas. Antes de la primera generación: revisa qué rompe en el nicho HOY (Apify scrape vía `pacame-viral-visuals`), extrae patrón, consulta `viral_brief.json` cacheado si lo hay.

### 2 · Coherencia visual estricta
Misma paleta, tipografía, grain en todo el batch. Reels: 1 key art master + anchors derivados con `edit` (NO text-to-image independiente).

### 3 · No genérico
Test final: "¿Esto podría estar en el Explore de Instagram AHORA?". Si no, iterar.

---

## Router de decisión

| Petición usuario | Marca | Pipeline | Script | Skills satélite |
|---|---|---|---|---|
| Carrusel feed IG · 1080×1350 (4:5) | input | composer SVG + opentype.js | `compose-slides.mjs` | `copywriting`, `marketing-psychology`, `marketing-carousel-growth-engine` |
| Stories template · 1080×1920 (9:16) rellenable | input | composer + zona dashed | `compose-stories.mjs` | `social-content`, `marketing-instagram-curator` |
| WhatsApp meme · 1080×1350 chat fake | input | composer chat dark mode | `compose-whatsapp.mjs` | `marketing-psychology` |
| Comparativa antes/después · 1080×1350 | input | composer 2-col / ticket / checklist | `compose-comparativas.mjs` | `copywriting` |
| Sticker 512×512 transparente | input | composer + alpha | `compose-stickers.mjs` | `canvas-design` |
| Reel/teaser 30-45s · 9:16 | input | key art → image-to-video Seedance + voz + ffmpeg | `generate-backgrounds-atlas.mjs` + ffmpeg | `video-prompting`, `video-content-strategist`, `marketing-short-video-editing-coach`, `elevenlabs`, `ffmpeg` |
| Voz over TTS español | — | ElevenLabs `eleven_multilingual_v2` | `generate-voiceover-samples.mjs` | `elevenlabs` |
| Backgrounds editoriales hero | input | Atlas Cloud cascade | `generate-backgrounds-atlas.mjs` | `design-image-prompt-engineer` |
| Research nicho viral | — | Apify + Gemini Vision | (delegar) `pacame-viral-visuals` | `pacame-viral-visuals` |
| Calendario editorial / plan mes | ambas | consultar plan-contenido-30-dias.md | (consulta) | `social-media-manager`, `content-strategy` |
| Press kit / Affiliate kit | input | recopilación + composer + PDF | (manual) | `design-brand-guardian`, `referral-program` |
| Landing / web | input | Next.js + Vercel | (delegar) `pacame-web` | `pacame-web`, `landing-page-generator` |
| Email sequence | input | Resend + copy | manual con `web/lib/resend.ts` | `email-sequence`, `cold-email`, `copywriting` |
| Carrusel viral 6-slide desde URL | input | URL → análisis → carrusel | (delegar) `marketing-carousel-growth-engine` | `marketing-carousel-growth-engine` |

---

## Inventario APIs cableadas (estado real · 2026-04-25)

| API | Variable env | Estado | Uso | Coste |
|---|---|---|---|---|
| **Atlas Cloud** | `ATLAS_API_KEY` | OK · saldo variable | Imagen + Video (305 modelos) | $0.012-$0.20/output |
| **ElevenLabs** | `ELEVENLABS_API_KEY` | Free · 7k+ chars libres | Voz multilingual_v2 · 21 voces premade ES | 10k chars/mes free · $5/mes Starter |
| **Apify** | `APIFY_API_KEY` | Free · ~$3.89 libres | Scrape IG hashtags, reels | $5/mes free quota |
| **Nebius AI** | `NEBIUS_API_KEY` | OK | LLM texto (DeepSeek, Qwen, Gemma) | 500k tokens/día gratis |
| **Gemini AI** | `GEMINI_API_KEY` | Free sin imagen | LLM + Vision · imagen requiere paid | Free solo texto |
| **Instagram + Meta** | `INSTAGRAM_ACCESS_TOKEN` + `META_PAGE_ACCESS_TOKEN` | OK | Publishing + insights + DMs | Sin coste API |
| **Resend** | `RESEND_API_KEY` | OK | Email transaccional | Free 100 emails/día |
| **Stripe** | `STRIPE_SECRET_KEY` | LIVE | Pagos · webhooks | Por transacción |
| **Telegram** | `TELEGRAM_BOT_TOKEN` | OK | Notificaciones bot Pablo | Gratis |
| **Vapi** | `VAPI_API_KEY` | OK | Voz IA telefónica | Pay-per-minute |
| **OpenAI** | `OPENAI_API_KEY` | ❌ Hard limit | Referencia · usar Atlas Cloud | Bloqueado |
| **Freepik** | `FREEPIK_API_KEY` | ❌ Trial agotado | Histórico · referencia | Bloqueado |
| **Vertex AI** | `VERTEX_ACCESS_TOKEN` | ❌ Token expirado | Imagen 3 GCP · refresh manual | Bloqueado |

Path env: `web/.env.local`

---

## Inventario scripts ejecutables

Path base: `carruseles-darkroom/`

### Composers (cero coste · output local)

| Script | Output | Dimensión | Características |
|---|---|---|---|
| `compose-slides.mjs` | PNG carrusel 4:5 | 1080×1350 | 30 slides DR. Auto-fit titulares. Counter "C1 · 01/10". |
| `compose-stories.mjs` | PNG stories 9:16 | 1080×1920 | 10 templates × 2 versiones (vacía + ejemplo). |
| `compose-whatsapp.mjs` | PNG WhatsApp memes | 1080×1350 | Chat fake Dark Mode 2026 con burbujas + ticks azules. |
| `compose-comparativas.mjs` | PNG comparativas | 1080×1350 | 3 templates: ticket factura, 2-col antes/después, checklist. |
| `compose-stickers.mjs` | PNG transparente | 512×512 | 12 stickers con alpha · Telegram/WhatsApp/Discord. |

Tooling: `sharp` + `opentype.js` · fonts en `carruseles-darkroom/fonts/` (Anton, Space Grotesk, JetBrains Mono).

### Generadores IA (requieren API + saldo)

| Script | Provider | Modelos | Coste |
|---|---|---|---|
| `generate-backgrounds-atlas.mjs` | Atlas Cloud | cascade gpt-image-2 → imagen4 → seedream → flux | $0.003-$0.06/img |
| `generate-backgrounds.mjs` | OpenAI directo | gpt-image-2/1.5/1/1-mini | $0.004-$0.032/img · ⚠️ hard limit |
| `generate-backgrounds-gemini.mjs` | Google AI Studio | gemini-2.5-flash-image | ⚠️ paid plan |
| `generate-voiceover-samples.mjs` | ElevenLabs | eleven_multilingual_v2 + voces premade | $0 free tier |

---

## Wrappers reutilizables `web/lib/`

| Archivo | Exporta | Uso |
|---|---|---|
| `llm.ts` | `llmChat()` dispatcher | Router LLM titan/premium/standard/economy |
| `nebius.ts` | `nebiusChat()`, `NEBIUS_MODELS` | DeepSeek V3.2, Qwen 3.5, Llama, GLM |
| `gemma.ts` | `gemmaChat()` | Gemma 4 e2b VPS gratis |
| `freepik.ts` | `generateMystic()`, `imageToVideo()` | Trial agotado · referencia API shape |
| `instagram.ts` | `publishPost()`, `getInsights()`, `sendDM()` | IG Business API v21 |
| `social-publish.ts` | `publishToMeta()` | Cross-poster IG + Facebook |
| `image-generation.ts` | cascade Freepik → DALL-E → Pollinations | Histórico, deprecated |
| `telegram.ts` | `sendTelegram()` | Notificaciones bot Pablo |
| `resend.ts` | `sendEmail()` | Email transaccional |
| `stripe.ts` | helpers pagos | Checkout + webhooks |

---

## Skills satélite (delegación · NO duplicar)

| Para qué | Skill |
|---|---|
| Investigar virales IG/TikTok | `pacame-viral-visuals` |
| Generar landing/web | `pacame-web` · `landing-page-generator` |
| Editar video pro CapCut/Premiere | `marketing-short-video-editing-coach` |
| Prompts fotográficos gpt-image-2 | `design-image-prompt-engineer` |
| Sistema marca completo | `design-brand-guardian` · `branding` |
| Storytelling visual / infografías | `design-visual-storyteller` · `infographics` |
| Copy AIDA/PAS · captions · ads | `copywriting` · `marketing-psychology` |
| TikTok específico (FYP, trends) | `marketing-tiktok-strategist` |
| Instagram (algoritmo, formats) | `marketing-instagram-curator` |
| Plan editorial multi-canal | `marketing-content-creator` · `social-media-manager` |
| Carruseles autónomos desde URL | `marketing-carousel-growth-engine` |
| Ads paid (Meta/Google/TikTok) | `paid-media-creative-strategist` (NEXUS) |
| Voz IA + voice cloning | `elevenlabs` |
| Procesado audio/video final | `ffmpeg` |
| Composiciones visuales sofisticadas | `canvas-design` |
| Animaciones React | `remotion` · `remotion-best-practices` |
| SEO contenido orgánico | `seo-audit` · `ai-seo` · `content-research-writer` |
| LinkedIn B2B | `marketing-linkedin-content-creator` |
| X/Twitter community | `marketing-twitter-engager` · `x-twitter-growth` |
| Email cold outreach | `cold-email` · `email-sequence` |
| Programmatic SEO | `programmatic-seo` |
| Crear nuevas skills | `skill-creator` |
| Optimizar prompts | `prompt-optimizer` |
| Lanzar tareas paralelas | `dispatching-parallel-agents` |

---

## Brand bibles

> Versión completa: `strategy/plan-contenido-30-dias.md` § 2.

### A · PACAME (factoría · capa 1 · `pacameagencia.com`)

- **Paleta**: Electric Violet `#7C3AED` · Indigo `#4338CA` · Cyan `#06B6D4` · Bg `#0D0D0D` · Texto `#F5F5F0`
- **Gradient**: `linear-gradient(135deg, #7C3AED, #4338CA, #06B6D4)`
- **Tipografía**: Space Grotesk 700/500 (titulares) · Inter 400/500/600 (cuerpo) · JetBrains Mono (datos)
- **Arquetipo**: El Mago + El Rebelde
- **Tono**: directo · cercano · sin humo · realismo brutal · verbos activos · tutear · frases cortas
- **Tagline**: "Tu equipo digital. Sin límites."
- **USPs**: 10 agentes IA + 798 skills · velocidad (3-14 días vs 8 semanas) · precio variable Hormozi · proveedor único · contacto directo agentes
- **Target**: PYMEs/SaaS/ecommerce 5-100 empleados · facturación 100k-2M€ · decisor CTO/VP Growth/Founder
- **Frases icónicas**: "Cualquier problema digital. Resuelto más rápido, mejor y más barato." · "Regalar para ganar más." · "Realismo brutal. Sin humo."
- **NUNCA**: superlativos vacíos · promesas sin condiciones · jerga agencia · IA pura sin equipo humano

### B · Dark Room (proyecto propio · capa 3 · `darkroomcreative.cloud`)

- **Paleta**: Verde ácido neón `#CFFF00` · Negro profundo `#0A0A0A` · Rojo strike `#FF3B3B` · Blanco roto `#F2F2F2` · Gris plomo `#4A4A4A`
- **Tipografía**: Anton (titulares ALL CAPS) · Space Grotesk Bold/Medium (cuerpo) · JetBrains Mono (precios + counter)
- **Tono**: directo · provocador · insider · sin censura sobre group buy
- **Target**: B2C creators + freelancers + dropshippers · 18-40 años · ES + LATAM
- **USPs**: 12 herramientas IA premium · 24,90 €/mes · 349 € lifetime · group buy legal · soporte Discord 24/7 · contrato escrito
- **Frases icónicas**: "Esto debería ser ilegal" · "12 herramientas. 0,83 €/día" · "Lifetime es lifetime" · "El stack del creador 2026"
- **NUNCA**: mencionar PACAME · paleta violeta · linkear afiliado oficial · prometer ganar dinero específico

### C · Reglas de aislamiento (capa 1 vs capa 3)

> Fuente: `strategy/arquitectura-3-capas.md`

| Recurso | PACAME | Dark Room |
|---|---|---|
| Dominio | pacameagencia.com | darkroomcreative.cloud |
| Email | hola@pacameagencia.com | support@darkroomcreative.cloud |
| Stripe | PACAME LIVE | reutiliza PACAME hasta MRR>1k€ |
| Supabase org | pacameagencia | Dark Room IO |
| Marca visible | PACAME | DARK ROOM (sin referencia PACAME) |
| Identidad | violeta + cyan + Mago/Rebelde | verde ácido + negro · noir + insider |

**Regla dura**: ningún post Dark Room linkea ni menciona PACAME. Ningún post PACAME revela ser dueño de Dark Room.

---

## Formats óptimos por plataforma

| Plataforma | Formato | Ratio | Dimensión | Duración | Notas |
|---|---|---|---|---|---|
| Instagram Feed | Carrusel 8-12 slides | 4:5 | 1080×1350 | — | Brand mark + counter |
| Instagram Reels | Vídeo vertical | 9:16 | 1080×1920 | 15-30s · max 90s | Subs burned 100% · cover frame manual |
| Instagram Stories | PNG/MP4 | 9:16 | 1080×1920 | 7-15s | Safe area top 250px + bottom 250px |
| TikTok | Vídeo vertical | 9:16 | 1080×1920 | 21-34s sweet spot | Cuts 4-5/s · trending audio |
| LinkedIn Feed | Carrusel PDF | 1:1 o 4:5 | 1200×1200 | — | Texto largo · datos · case studies |
| LinkedIn Post | Imagen única | 1.91:1 | 1200×627 | — | Texto pre-imagen 800-1300 chars |
| X / Twitter | Imagen única | 16:9 o 1:1 | 1200×675 | — | Hilos > posts sueltos |
| YouTube Shorts | Vídeo vertical | 9:16 | 1080×1920 | 15-45s | Cover thumbnail importante |

---

## Reglas de calidad (no negociables)

1. Hook en frame 0 / slide 1 · scroll rate IG = 0,8s
2. Subs burned-in siempre en reels · 85% mira sin sonido
3. Texto ≤ 20% del área en imagen
4. Cuts 4-5/s en reels nicho group buy (DR)
5. Cuts 2-3/s en reels brand film B2B (PACAME) · cinemático
6. Voz IA español → `eleven_multilingual_v2` (no v1 ni turbo)
7. Upscale + bg cleanup antes de publicar
8. Aislamiento estricto marca · DR sólo verde+negro · PACAME sólo violeta+cyan
9. Test final: "¿Esto podría estar en el Explore AHORA?"
10. Brand mark esquina superior derecha en todas las piezas estáticas
11. Counter de página obligatorio en carruseles ("C1 · 01/10")

---

## Pipeline maestro de 7 fases

### Fase 0 · Pre-producción (gratis · 5-15 min)
Marca · plataforma · pilar · ángulo · storyboard · guión voz si aplica · aprobación opcional Pablo.

### Fase 1 · Research (gratis o cents)
Apify scrape vía `pacame-viral-visuals` o reuso `viral_brief.json`.

### Fase 2 · Key art master (~$0.012)
1 imagen hero del batch. `openai/gpt-image-2-developer/text-to-image` vía Atlas. Iterar 2-3 versiones.

### Fase 3 · Anchors derivados ($0.012 × N)
Resto imágenes con `gpt-image-2-developer/edit` usando key art como input + variación de escena. Garantiza coherencia.

### Fase 4 · Producción (variable)
- Carrusel/Stories/WhatsApp/Sticker/Comparativa: composer (cero coste)
- Reel: anchors → `bytedance/seedance-2.0-fast/image-to-video` ($0.101/seg)

### Fase 5 · Audio (gratis típicamente)
- Voz: `generate-voiceover-samples.mjs` con Brian/Adam · `eleven_multilingual_v2` (free 10k chars/mes)
- Música: YouTube Audio Library / Pixabay royalty-free
- SFX: ElevenLabs Sound Effects o sintetizado ffmpeg

### Fase 6 · Edición (gratis · ffmpeg local)
- Concat: `ffmpeg -i list.txt -c copy out.mp4`
- Color grading: `lut3d` cinematic
- Subs burned: `subtitles=subs.srt` o `drawtext` kinetic
- Audio mix: `amix=inputs=3`
- Export: `1080×1920 9:16 60fps H.264`

### Fase 7 · Quality control + entrega
Test mute · test thumb · test brand. Si pasa → output. Si falla → iterar fase específica.

---

## Comandos de arranque típicos

### "Genera un carrusel Dark Room sobre [tema X]"
1. Consultar `strategy/plan-contenido-30-dias.md` para pilar/ángulo similar
2. Si reusable en `output/carrusel-{1,2,3}-*/` → reusar
3. Si no: storyboard 8-10 slides + brief PULSE
4. Editar `compose-slides.mjs` array `SLIDES`, ejecutar
5. Output `carruseles-darkroom/output/`

### "Necesito un reel PACAME 30s sobre [Y]"
1. Storyboard 6-9 clips × 5s
2. Key art PACAME (violeta) gpt-image-2
3. 5-8 anchors con `gpt-image-2-developer/edit`
4. 6-9 clips video con `seedance-2.0-fast/image-to-video`
5. Voz Brian con `eleven_multilingual_v2`
6. ffmpeg concat + subs + música
7. Output `carruseles-darkroom/reels/pacame-{tema}-v1.mp4`
8. Coste $4-8

### "Plan editorial semana W"
Consultar `plan-contenido-30-dias.md` § calendario día a día. Devolver checklist piezas.

### "Voz over español"
Voz Brian (default) o Adam · `eleven_multilingual_v2` · stability 0.5 · similarity 0.75 · style 0.4 · speaker_boost true.

---

## Costes Atlas Cloud (referencia · 2026-04-25)

### Imagen text-to-image

| Modelo | $/img | Uso |
|---|---|---|
| `openai/gpt-image-2-developer/text-to-image` | $0.012 | **Default hero shots** |
| `openai/gpt-image-1.5/text-to-image` | $0.008 | Iteración barata |
| `openai/gpt-image-1-mini/text-to-image` | $0.004 | Bulk · 100+ variaciones |
| `google/imagen4-ultra` | $0.06 | Hollywood premium |
| `google/imagen4` | $0.04 | Top alternativa |
| `google/imagen4-fast` | $0.02 | Iteración rápida |
| `google/nano-banana-pro/text-to-image-ultra` | $0.15 | Premium absoluto |
| `google/nano-banana-2/text-to-image` | $0.08 | Top creator reels |
| `bytedance/seedream-v5.0-lite` | $0.032 | Posters/typography |
| `black-forest-labs/flux-dev` | $0.012 | Editorial artístico |
| `black-forest-labs/flux-schnell` | $0.003 | Bulk testing |
| `qwen/qwen-image-2.0/text-to-image` | $0.028 | Alt asiático |
| `alibaba/wan-2.7/text-to-image` | $0.026 | Más barato |

### Video image-to-video

| Modelo | $/seg | Uso |
|---|---|---|
| `bytedance/seedance-2.0-fast/image-to-video` | $0.101 | **Default** balance |
| `bytedance/seedance-2.0/image-to-video` | $0.127 | Hero clips premium |
| `google/veo3.1-lite/image-to-video` | $0.05 | Más barato |
| `google/veo3.1-fast/image-to-video` | $0.10 | Top alt |
| `google/veo3.1/image-to-video` | $0.20 | Hollywood B2B |
| `kwaivgi/kling-v3.0-pro/image-to-video` | $0.095 | Movimiento natural |
| `openai/sora-2/image-to-video` | $0.10 | Cinematic |

### Endpoints Atlas Cloud

```
POST https://api.atlascloud.ai/api/v1/model/generateImage
POST https://api.atlascloud.ai/api/v1/model/generateVideo
GET  https://api.atlascloud.ai/api/v1/predictions/{prediction_id}   ← polling
Headers: Authorization: Bearer {ATLAS_API_KEY}
```

---

## Cálculos por tipo de pieza

| Pieza | Coste | Tiempo |
|---|---|---|
| Carrusel 10 slides (composer) | $0 | 5 min |
| Carrusel + 3 backgrounds IA | $0.04 | 8 min |
| Story template (composer) | $0 | 3 min |
| WhatsApp meme (composer) | $0 | 2 min |
| Sticker pack 12 (composer) | $0 | 4 min |
| Comparativa (composer) | $0 | 3 min |
| Reel 30s (key art + 6 anchors + 6 clips Fast + voz) | $4-5 | 30-45 min |
| Reel 30s premium (Veo 3.1) | $9 | 30-45 min |
| Teaser 45s (9 clips + voz) | $5-7 | 45-60 min |
| Voz over 60s (~600 chars) | $0 free tier | 1 min |
| 18 backgrounds variados (6 × 3) | $0.22 | 4-5 min |

---

## Pre-flight checklist

Antes de gastar 1 céntimo de API:

- [ ] Marca identificada (DR o PACAME · NO mezclar)
- [ ] Plataforma · ratio + dimensión correctos
- [ ] Pilar de contenido identificado
- [ ] Hook redactado (no genérico)
- [ ] Storyboard / outline texto plano
- [ ] Brand bible aplicada
- [ ] Reglas aislamiento respetadas
- [ ] Script ejecutable identificado
- [ ] APIs con saldo
- [ ] Output path definido

---

## Anti-patrones (NUNCA)

| ❌ Mal | ✅ Bien |
|---|---|
| 12 imágenes text-to-image independientes para reel | 1 key art + 11 edits derivados |
| Pedir al modelo renderizar texto ("PACAME" grande) | Background sin texto + composer encima |
| Paleta DR (verde) en pieza PACAME o viceversa | Cada marca paleta estricta |
| Mencionar PACAME en pieza Dark Room | Aislamiento legal estricto |
| Reel 60s en TikTok nicho group buy | 21-34s sweet spot · 30s default |
| Generar sin research previo | Apify scrape o `viral_briefs` cacheado |
| Subir reel sin subs burned | Subs 100% · 85% mira sin sonido |
| Carrusel sin counter ni brand mark | Brand mark + counter obligatorios |
| Voz IA `multilingual_v1` o `turbo` | Siempre `multilingual_v2` para ES |
| OpenAI gpt-image-2 directo | Atlas Cloud (50× más barato + sin hard limit) |
| 130 piezas/mes a mano | Composers + reuso + automatización progresiva |

---

## Estado actual de assets producidos (2026-04-25)

### Carruseles Dark Room v1 (`carruseles-darkroom/output/`)
- `carrusel-1-factura/` · 10 PNG · Pilar ahorro económico
- `carrusel-2-stack/` · 10 PNG · Pilar stack reveal
- `carrusel-3-ilegal/` · 10 PNG · Pilar provocador + FAQ

### UGC Kit Dark Room (`carruseles-darkroom/ugc-kit/`)
- `pack-1-stories/` · 20 PNG (10 templates × 2 versiones)
- `pack-2-whatsapp/` · 6 PNG chat memes
- `pack-3-comparativas/` · 6 PNG (3 templates × 2)
- `pack-4-stickers/` · 12 PNG transparente
- `pack-5-voiceovers/` · 2 MP3 (Brian + Adam)
- `pack-6-affiliate/` · pendiente
- `pack-7-press/` · pendiente

---

## Cómo invocar esta skill desde otra (delegación)

Si eres otro agente PACAME (PULSE, NOVA, COPY, SAGE, NEXUS) o conversación con Pablo pide pieza de contenido:

1. Detecta tipo output
2. Consulta router de decisión
3. Ejecuta script ejecutable correspondiente (no reinventar)
4. Aplica brand bible según marca destino
5. Sigue pipeline 7 fases
6. Pasa pre-flight checklist antes de gastar APIs
7. Tras publicar registra métricas en `content_published` y dispara sinapsis

Esta skill es el contrato entre todos los agentes PACAME para producir contenido coherente sin reinventar el flujo cada vez.

---

## Path de archivos de referencia

| Archivo | Propósito |
|---|---|
| `strategy/plan-contenido-30-dias.md` | Calendario 30 días + banco ideas + hashtag packs |
| `strategy/arquitectura-3-capas.md` | Reglas aislamiento marcas |
| `IDENTIDAD-PABLO.md` | Filosofía + tono Pablo |
| `agents/06-PULSE.md` | Head Social — pilares oficiales |
| `agents/01-NOVA.md` | Head Branding — paleta + sistema visual |
| `agents/08-COPY.md` | Head Copy — tono, hooks, frases icónicas |
| `agents/07-SAGE.md` | Head Strategy — segmentación target, USPs |
| `agents/03-NEXUS.md` | Head Ads — campañas pago (fuera scope orgánico) |
| `.claude/skills/pacame-viral-visuals/SKILL.md` | Pipeline research virales (subskill) |
| `.claude/skills/pacame-web/` | Construcción landing/web (subskill) |
| `web/.env.local` | Variables entorno |
| `web/lib/` | Wrappers TS reutilizables |
| `carruseles-darkroom/` | Composers + generadores + outputs |

---

**Última revisión**: 2026-04-25 · **Skill version**: v1.0

---

## Update 2026-04-28 — Santo Grial Visual (NotebookLM)

**Doc maestro de referencia**: [[santo-grial-visual]] (en `04-Workflows/`).

### Estructura canónica de carrusel (10 slides)

A partir de hoy, todo carrusel PACAME / Dark Room / cliente sigue esta estructura por defecto. Saltarse pasos solo con justificación explícita en el brief.

| Slide | Función | Regla |
|---|---|---|
| 1 | **Hook** (cover) | El cover hace 80% del trabajo. Lectura < 2s. Alto contraste. Caras expresivas o tipografía dominante. |
| 2 | Setup | Plantar el problema/contradicción. NO desvelar solución. |
| 3 | Reframe | Cambio de óptica. Por qué lo "obvio" no aplica. |
| 4 | Value 1 | Idea/insight 1 (1 idea por slide, regla dura). |
| 5 | Value 2 | Idea/insight 2. |
| 6 | Update | Mini-recap + tease del clímax. |
| 7 | Climax | Insight más fuerte / payoff principal. |
| 8 | Save Prompt | "Guarda este post" / "Vuelve cuando lo necesites". |
| 9 | CTA | Acción concreta + dónde. |
| 10 | (opcional) Bono / créditos / hashtags | Si aplica. |

**Reglas técnicas asociadas**:

- Aspect ratio **4:5 (1080×1350)** por defecto (no 1:1) → ocupa más pantalla en feed → +23% engagement vs 1:1.
- Carrusel para LinkedIn: export PDF; carrusel IG: export PNG.
- **Añadir música al carrusel IG** → entra en algoritmo Reels = reach gratis.
- 7-10 slides es el sweet spot; menos de 7 pierde retention, más de 10 pierde finalización.

### Frameworks de prompting (incorporar al brief)

| Framework | Componentes | Cuándo usar |
|---|---|---|
| **ASPECT** | Acción + Steps + Persona + Examples + Context + Restrictions + Template | Tareas complejas, máxima precisión |
| **TAREA** | Tarea + Acción + Rol + Ejemplo + Aclaraciones | Daily, rápido |
| **CICLO** | Contexto + Instrucciones + Condiciones + Límites + Output | Reglas estrictas (cliente sensible) |
| **ECO** | Expectativas + Contexto + Objetivo | Marketing 80/20 |
| **ROSAS** | Rol + Objetivo + Situación + Acción + Secuencia | Business deliverables |

Razonamiento (cuando el output requiere lógica multi-paso):
- **COT** (Chain of Thought) — razonar paso a paso.
- **TOT** (Tree of Thoughts) — explorar ramas y elegir golden path.
- **ReAct** — razonar + actuar (web search, ask user).
- **Adversarial Validation** ("Battle of the Bots") — personas que compiten + crítico → final.
- **Metaprompting** — IA escribe el prompt para otra IA.

Estructura de contenido:
- **PAS** (Problem-Agitation-Solution) → Reels, Shorts, TikToks.
- **4-Step Viral Script** (Promesa / Intro / Desarrollo+open loops / Final) → YouTube long.
- **Timeline Prompting** → vídeo largo en bloques 3s × 4 = 12s.
- **Brick by Brick** → empezar minimal y añadir capas progresivas (env → light → camera).

### Reglas de viralidad incorporadas

- **Hook layered**: text + visual + audio (riser SFX en frame 0). Plantear problema/contradicción, NO desvelar solución.
- **Captions**: Poppins / Thrive, line-spacing ajustado, text-shadow + glow + fade-in 0.2s. Gradiente negro 90° tras texto si aplica.
- **Vignette global** en reels para look cinematográfico unificado.
- **Audio ducking -20 dB** del SFX nativo del modelo de vídeo (Veo, SeaDance, LTX-2.3) para no pisar voz/música.
- **Loop seamless 10s** en reels → repetitive viewing → más retention.
- **Bulk reels**: spreadsheet hooks/payoffs ChatGPT → Canva Bulk Create (low-cost).

### 9 anti-patterns (NO HACER, refuerzo)

1. Wall of text vague prompts.
2. AI Loop ("hazlo más natural" sin métricas).
3. Olvidar contexto + brand + audiencia.
4. Escribir prompts vídeo manuales (pasar la doc del modelo a Claude/ChatGPT).
5. Diálogo entre comillas dentro del prompt visual.
6. Estilos contradictorios.
7. Una sola cara AI para toda la marca.
8. Scripts "experiencia personal" sin autoridad (escribir desde el dolor del oyente).
9. Datos sensibles en prompts sin opt-out training.

### Stack mínimo recomendado

Audio antes que imagen, imagen antes que vídeo. Ver §2 del [[santo-grial-visual]] para el stack 7-pasos completo.
