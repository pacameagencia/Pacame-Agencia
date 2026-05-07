# Pipeline outreach masivo — Manual de operación

Sistema que genera + despliega + envía emails de prospección **uno-a-uno** pero en lote, con calidad indistinguible de copy manual.

## Filosofía: "human writer in a hurry"

Cada lead recibe un email **único pero no robotizado**. Variantes determinísticas con seed por slug — el mismo lead siempre recibe el mismo email (idempotente), pero leads distintos reciben combinaciones distintas de:

- 8 asuntos
- 5 saludos
- 6 openings (con mención al tipo y ciudad real)
- 4 hooks
- 3 disclaimers de fotos
- 4 cierres
- 4 firmas
- 6 P.D.
- 17 menciones de ciudad (Madrid, BCN, Sevilla, etc.)

**Combinaciones únicas posibles**: 8 × 5 × 6 × 4 × 3 × 4 × 4 × 6 = **138.240** combinaciones distintas.

## Comando único

```bash
cd clients/restaurantes-prospect-cr
node scripts/pipeline.mjs --cap=30
```

## Modos

| Flag | Efecto |
|---|---|
| (default) | genera demo + deploy Vercel + envía email |
| `--dry` | genera demo pero NO deploy ni envía. Útil para revisar copy |
| `--no-deploy` | salta deploy Vercel (solo HTML local) |
| `--no-send` | despliega pero no envía email |
| `--cap=N` | máximo N leads en este run (default 30) |

## Anti-spam técnico

| Característica | Por qué importa |
|---|---|
| Plain text + HTML | Gmail/Outlook prefieren multipart |
| `List-Unsubscribe` header con mailto | Gmail bonus, RGPD compliant |
| `List-Unsubscribe-Post: List-Unsubscribe=One-Click` | Gmail "tarjeta amarilla" anti-spam |
| `Message-ID` único `<slug-timestamp@pacameagencia.com>` | DKIM trace |
| `X-Entity-Ref-ID: slug` + `X-Mailer` | Headers profesionales |
| Throttle 45-90s seeded por slug | Velocidad humana, no bot |
| Sin palabras spam-trigger en asunto | "GRATIS", "OFERTA", $$ → out |
| Tono cercano + tutear | Anti-corporate, conversacional |
| Reply-To y From mismo dominio | DMARC-friendly |
| Tags por campaña + slug + tipo | Tracking en panel Resend |

## Calidad técnica de las webs

Cada demo incluye:

- **Schema.org Restaurant** JSON-LD con address, phone, rating, hours
- **Open Graph image** + dimensiones (preview brutal en WhatsApp/Telegram al compartir)
- **Twitter Card** summary_large_image
- **Canonical URL**
- **Meta description** real (no Lorem ipsum)
- **Mobile-first** responsive
- **Lighthouse 95+** typically (sin frameworks pesados, vanilla CSS+JS)
- **Carta rotada**: 2 platos por categoría se sustituyen por seed → cada carta única

## Estado actual

Ejecutado:
- 10 leads piloto Ciudad Real (con email)
- 30 leads España batch 1 (V1 sin variantes)
- N leads España batch 2 (V2 con variantes — este run)

Pendiente: ~3000 leads España con email.

## Plan diario (warm-up de reputación)

Para no quemar el dominio, escalar gradualmente:

| Día | Cap | Total acumulado |
|---|---|---|
| Día 1 | 30 | 30 |
| Día 2 | 30 | 60 |
| Día 3-4 | 50 | 160 |
| Día 5-7 | 80 | 400 |
| Día 8+ | 100 | 1100+ |

Resend free tier permite 100/día y 3000/mes. Para 3000 leads completos: ~30 días de envío.

Si quieres acelerar: upgrade a plan Resend Pro ($20/mes para 50.000 emails/mes).

## Datos en archivos

```
data/
├── leads-spain-email.json       # 3129 leads España con email
├── send-log.json                # log de envíos (idempotente, no duplica)
├── leads-with-email.json        # 10 piloto Ciudad Real
└── <slug>.json                  # config por lead generado en cada run
demos/
└── <slug>/index.html            # demo deployada por lead
scripts/
├── pipeline.mjs                 # MAIN — orquesta todo
├── copy-variants.mjs            # variantes de copy y rotación de carta
├── menus.mjs                    # plantillas menú por tipo (5 tipos)
└── generate-demo.mjs            # genera HTML desde template + config
templates/
├── restaurante-base.html        # template parametrizable
└── email-outreach.md            # plantilla email v0 (referencia)
```

## Tracking de respuestas

1. **Resend dashboard**: https://resend.com/emails — open rate, click rate, bounces
2. **Filtrar por tags**: `campaign:restaurantes-spain-2026-05`, `lead_slug:<slug>`, `lead_type:<type>`
3. **Replies**: van a `hola@pacameagencia.com` (configurar Reply-To en cliente Pablo)
4. **Click WhatsApp**: van directamente a `+34 722 669 381` con conversación abierta

## Cuando se autorice MCP Resend

Si en el futuro el MCP de Resend Anthropic está disponible o configuras un MCP custom, podríamos:
- Triggers automáticos cuando alguien abre el email → notificación Telegram
- Auto-pause si bounce rate > 5% (proteger reputación)
- A/B testing por subject (rotar subjects y medir winners)

## Protocolo de respuesta

Cuando alguien responda:

1. Pablo recibe email en `hola@pacameagencia.com` o WhatsApp en `+34 722 669 381`
2. Conversación humana — nada automatizado en este punto
3. Si quiere: Pablo le pide 8-12 fotos del local + carta real
4. Sustituye datos en `data/<slug>.json`
5. Re-genera con `node scripts/generate-demo.mjs data/<slug>.json`
6. Re-deploy con `cd demos/<slug> && vercel --prod`
7. Demo final lista para vincular a su dominio (custom domain Vercel)

## Roadmap mejoras (V3+)

1. **Dashboard CRM live** (próximo): tabla en `web/app/dashboard/prospect-leads` con métricas Resend en tiempo real
2. **Agente auto-mejora**: cuando haya 200+ envíos con métricas, analizar winners vs losers y aplicar al template/copy automáticamente
3. **Enriquecimiento Google Maps**: scraping de fotos reales del local + reviews reales (con permiso post-cliente)
4. **A/B testing**: 2 subjects, 2 hero copies → comparar conversión
5. **Custom domain por lead**: cuando contraten, mover de `<slug>.vercel.app` a `<slug>.com`
