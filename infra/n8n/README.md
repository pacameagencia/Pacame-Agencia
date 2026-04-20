# PACAME — n8n Workflows

10 workflows instalados en `https://n8n.pacameagencia.com` (VPS Hostinger KVM2, contenedor `n8n-n8n-1`).

Import automatizado:
```bash
bash infra/scripts/n8n-import-all.sh
```
El script prepara cada JSON (inyecta `id`, `versionId`, `settings`), los copia al VPS via SSH (`~/.ssh/hostinger_vps`), los sube al contenedor y corre `n8n import:workflow` en cascada.

---

## Catálogo

| # | ID n8n | Trigger | Funcion |
|---|---|---|---|
| 01 | `pacame-01-telegram-bot` | Webhook | Bot de Telegram que aprueba contenido, lanza ciclos y responde comandos |
| 02 | `pacame-02-whatsapp-inbound` | Webhook | Entrada WhatsApp → triage IA → ruta a lead qualification o respuesta directa |
| 03 | `pacame-03-web-form-lead` | Webhook | Formulario web → crea lead en Supabase → notifica Telegram + dispara SAGE |
| 04 | `pacame-04-content-weekly` | Cron lunes 08:00 | Genera calendario semanal de contenido para cada cliente activo |
| 05 | `pacame-05-external-cron-trigger` | Webhook + secret | Puerta externa al cron PACAME (Slack, GitHub Actions, dashboards externos) |
| 06 | `pacame-06-google-reviews-monitor` | Cron cada 2h | Polea Google Maps, detecta reviews nuevas, Claude sugiere respuesta, alerta Telegram |
| 07 | `pacame-07-lead-enrichment` | Webhook | Hunter.io + Clearbit para enriquecer lead, actualiza Supabase, dispara SAGE |
| 08 | `pacame-08-rss-to-social` | Cron cada 4h | Lee RSS de cada cliente, reproposita posts para Twitter/LinkedIn/Instagram |
| 09 | `pacame-09-client-weekly-report` | Cron lunes 09:00 | Agrega métricas por cliente y envía reporte HTML via Resend |
| 10 | `pacame-10-competitor-tracker` | Cron diario 07:00 | Scraping ligero de webs competidores, diff hash, Claude analiza cambios |

---

## Variables de entorno necesarias

Ya configuradas en `docker-compose.yml` (`~/pacame/n8n/.env`):
- `CLAUDE_API_KEY`
- `SUPABASE_URL` y `SUPABASE_SERVICE_KEY`
- `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`
- `WHATSAPP_PHONE_ID` y `WHATSAPP_TOKEN`
- `RESEND_API_KEY`
- `CRON_SECRET`

Pendientes (añadir al `.env` del VPS para activar los nuevos):
```env
# Workflow 05 (external cron trigger) — inventa un secret y compartelo
PACAME_WEBHOOK_SECRET=pacame-ext-webhook-2026-<random>

# Workflow 06 (google reviews)
GOOGLE_PLACES_API_KEY=AIza...

# Workflow 07 (lead enrichment)
HUNTER_API_KEY=...
CLEARBIT_API_KEY=...
```

Tras añadir variables: `cd ~/pacame/n8n && docker compose restart n8n`.

### Estado actual (live)

| Workflow | Active | ENV keys |
|---|---|---|
| 05 external-cron-trigger | ✅ activo | `PACAME_WEBHOOK_SECRET` + `CRON_SECRET` (ambos configurados) |
| 06 google-reviews-monitor | ✅ activo | `GOOGLE_PLACES_API_KEY` (configurado) |
| 07 lead-enrichment | ⏸ inactivo | faltan `HUNTER_API_KEY` + `CLEARBIT_API_KEY` |
| 08, 09, 10 | ⏸ inactivo | listos, solo toggle desde UI |

Verificación end-to-end del workflow 06 (17/04/2026):
- 2 clientes test (`Restaurante La Tasca`, `Gimnasio FitZone`) con `google_place_id` real asignado
- Google Places devuelve reviews ES (La Gran Tasca 2071 reviews, FitnessZone 197)
- Claude Haiku 4.5 genera respuestas naturales en tono apropiado
- Primera fila en `external_reviews` insertada correctamente

Webhook activo del workflow 05:
```
POST https://n8n.pacameagencia.com/webhook/pacame-cron
X-PACAME-SECRET: pacame-ext-778e23895062bf44c76efb6c
Body: {"agent":"sage"}  (opcional; omitir → ciclo completo)
```

---

## Activación

Por defecto los workflows importados quedan **inactivos** (`active: false`). Para activar uno:

1. Abre `https://n8n.pacameagencia.com/` y autentícate
2. Selecciona el workflow
3. Toggle "Active" (arriba a la derecha)
4. Para los webhooks: copia la URL y configúrala donde corresponda (formulario web, Meta, Telegram, etc.)

---

## Tablas Supabase creadas por la migración 008

- `external_reviews` — Google/Yelp/TripAdvisor reviews captadas por el workflow 06
- `competitors` — tabla de competidores a monitorizar (workflow 10)

Nuevas columnas en `clients`: `google_place_id`, `last_review_check`, `rss_feed_url`, `last_rss_check`, `contact_email`, `contact_name`.
Nueva columna en `leads`: `enrichment_data` (JSONB).
Nueva columna en `content`: `source_url`.

---

## Siguiente nivel

Patrones de n8n.io que encajan y están listos para adaptar cuando haga falta:
- **Stripe → Slack alerts** (nuevo pago → notificar canal interno)
- **Gmail → GPT clasificador → Supabase** (triage de emails comerciales)
- **Meta Ads API → dashboard Lens** (importar métricas de ads diarias)
- **Calendly booking → cliente onboarding sequence**
- **TikTok Shop orders → fulfillment** (si entran clientes e-commerce)
