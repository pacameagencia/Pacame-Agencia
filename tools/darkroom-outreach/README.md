# DarkRoom Outreach · Bucket 4 TikTok ES scraper

Script Node ESM standalone que automatiza la **identificación de candidatos para Crew (afiliados Dark Room)** en TikTok ES.

Implementa el filtro 4/4 de cualificación documentado en `strategy/darkroom/outreach-comunidades.md` §6 sobre el actor Apify `clockworks/free-tiktok-scraper`.

## Cuándo usarlo

- **Mes 1 día 1-3**: scraping inicial · objetivo 200 candidatos crudos → 60-100 cualificados.
- **Mes 2+ refresh mensual**: detectar nuevos creators ES que han empezado a hablar de tools IA.
- **Pivot temático**: cambiar `--hashtags` para pescar en otros nichos (motion design, copywriting, freelance).

## Comandos

```bash
# Smoke (cero coste Apify) · valida APIFY_API_KEY + filtros
node tools/darkroom-outreach/scrape-tiktok-creators-es.mjs --dry-run

# Real run pequeño (~10 items, ~$0)
node tools/darkroom-outreach/scrape-tiktok-creators-es.mjs --max-results=10

# Real run completo mes 1 (default 200 items)
node tools/darkroom-outreach/scrape-tiktok-creators-es.mjs

# Hashtags custom
node tools/darkroom-outreach/scrape-tiktok-creators-es.mjs \
  --hashtags=motiondesign,illustrator,creadorescolombia

# Output custom
node tools/darkroom-outreach/scrape-tiktok-creators-es.mjs \
  --output=output/tiktok-mes2.csv
```

## Cómo funciona

1. Lee `APIFY_API_KEY` de `web/.env.local` (mismo patrón que producers de Dark Room).
2. Para cada hashtag (default 7) llama `clockworks/free-tiktok-scraper` con `run-sync-get-dataset-items` (timeout 240s).
3. Aplica filtros 4/4 sobre cada autor:
   - **A. Audiencia activa**: 1.000 ≤ followers ≤ 50.000
   - **B. ICP coincidente**: bio matches `creator|freelance|dropship|marketing|ia|emprendedor|stack|ahorra|tools|chatgpt|canva|capcut|elevenlabs|midjourney|prompt`
   - **C. Activo ≤7 días**: último video reciente
   - **D. NO competencia**: bio no contiene `groupbuy|toolzbuy|allinai|seogb|softwareshare`
4. Anti-fraude: skip si `engagement_rate < 0.5%` (likes/(views×followers)).
5. Deduplica por username (se queda con la versión más cualificada).
6. Ordena por `qualified_4of4=true` primero, luego por engagement descendente.
7. Exporta CSV UTF-8 con BOM (Excel/Notion compatible) en `tools/darkroom-outreach/output/`.

## Coste Apify

- Actor `clockworks/free-tiktok-scraper`: tier gratis ~10.000 items/mes.
- 200 candidatos = ~0,02% del cap.
- Cero gasto adicional si Pablo se mantiene <2k items/mes (suficiente con 1 run/semana).

## Output del CSV

```
username, display_name, bio, followers, following, hearts_total,
videos_count, engagement_rate, last_video_days_ago, last_video_url,
bucket, qualified_4of4, qualified_score (0-4), notes,
contact_method (DM TikTok / IG link in bio / website)
```

## Workflow post-scrape

1. **Importar** CSV a Notion / Google Sheets (UTF-8 BOM ya soportado).
2. **Filtrar** `qualified_4of4 = true`.
3. **Revisar manual** los top 30-60 (cualificación humana antes de DM).
4. **DM** con templates §5 de `strategy/darkroom/outreach-comunidades.md`:
   - DM TikTok 1:1
   - Email blogger/newsletter
   - Reply tweet X
   - Discord DM
   - LinkedIn (cursos)
5. **Tracking** en la misma hoja Notion:
   - Fecha contacto · mensaje usado · respuesta · Crew code asignado.

## Reglas anti-baneo TikTok

- Apify usa proxy rotativo (`proxyConfiguration.useApifyProxy: true`).
- Run cada 7+ días, no diario.
- Cero auto-DM (script solo identifica candidatos · DM siempre manual).

## Privacy

- `output/*.csv` está en `.gitignore` (las bios pueden contener emails personales).
- Pablo nunca commitea outputs con datos personales.

## Riesgos conocidos + mitigaciones

| Riesgo | Mitigación |
|---|---|
| Actor cambia schema | Fallbacks por campo: `it.authorMeta?.fans ?? it.author?.followerCount ?? 0` |
| Hashtag ES bajo volumen | Combinar 7 hashtags + posibilidad de ampliar via `--hashtags` |
| Bots con engagement inflado | Threshold ≥0.5% + cap followers ≤50k |
| Timeout Apify | Default 240s (margen para 50 items/hashtag) |

## Out of scope

- Bucket 1 YouTube ES, Bucket 5 X founders, Bucket 8 blogs ES — automatizar tras validar Bucket 4 mes 1.
- Auto-DM (NO automatizar · riesgo ban + ético).
- Tabla DB de candidatos (Notion manual basta mes 1).
- Integración con `aff_affiliates` (los firmados van al sistema de afiliados PACAME existente).

---

**Versión**: 1.0 · **Fecha**: 2026-04-29
