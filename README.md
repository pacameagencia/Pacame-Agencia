# PACAME Agencia

Agencia digital potenciada por IA. **10 agentes especializados + 120+ subespecialistas**, supervisados por Pablo Calleja.

## Arquitectura — 3 capas (datos no se cruzan)

- **Capa 1 — Factoría PACAME** (`pacameagencia.com`): la fábrica. 10 agentes IA + skills + red neuronal + workflows n8n.
- **Capa 2 — Clientes B2B**: negocios externos servidos por la factoría (Casa Marisol, Joyería Royo, Clara Women, Bravamood, etc.). Cada uno con su infra propia.
- **Capa 3 — Proyectos propios**: SaaS y negocios que opera Pablo (Dark Room, La Caleta, AsesorPro, PromptForge, PacameGPT). Aislados de la factoría.

Doc maestro: [`strategy/arquitectura-3-capas.md`](strategy/arquitectura-3-capas.md).

## Estructura

- `web/` — Next.js 15 (App Router, Tailwind, shadcn/ui) — la factoría productiva
- `agents/` — Los 10 agentes principales: DIOS (orquesta), NOVA, ATLAS, NEXUS, PIXEL, CORE, PULSE, SAGE, COPY, LENS
- `agency-agents/` — 120+ subespecialistas por dominio
- `brand/` — Identidad visual y guías de marca
- `strategy/` — SEO, growth, social media, arquitectura, plan contenido
- `workflows/` — SOPs framework WAT
- `infra/migrations/` — 23 migraciones Supabase versionadas
- `infra/n8n/workflows/` — 10 workflows automatización
- `tools/obsidian-sync/` — Cerebro PACAME ↔ Obsidian vault (PacameCueva)
- `PacameCueva/` — Vault Obsidian (capa visual del cerebro neuronal)
- `.claude/skills/` — 374 skills proyecto + 424 globales

## Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Framer Motion, Radix UI
- **Backend**: Supabase (Postgres + RLS + Realtime + pgvector), Stripe, Resend
- **IA**: Claude API (Opus 4.7 / Sonnet 4.6 / Haiku 4.5), DeepSeek V3.2 (volumen), Gemma 4 (VPS), Nebius (fallback)
- **Voz**: ElevenLabs, Vapi, OpenAI Whisper
- **Imagen**: Google Gemini (nano-banana), Freepik, Apify
- **Infra**: Vercel (web), VPS Hostinger KVM2 72.62.185.125 (n8n + Gemma 4 + voice + watcher)
- **Mensajería**: Telegram bot, WhatsApp Business, Instagram Business

## Desarrollo

```bash
cd web
npm install
npm run dev
```

## Cerebro PACAME (vault + Supabase)

```bash
# Verificar salud del cerebro (9 checks)
cd tools/obsidian-sync
npx tsx verify.ts

# Sincronización manual vault ↔ Supabase
npx tsx bootstrap.ts --commit  # push vault → Supabase
npx tsx pull.ts                # pull Supabase → vault
```

Watcher en tiempo real: Task Scheduler `PACAME-BrainWatcher` (Windows). Health alarm: Task Scheduler `PACAME-HealthCheck` 3x diario con alerta Telegram.

## Contacto

Web: [pacameagencia.com](https://pacameagencia.com) · Email: hola@pacameagencia.com · WhatsApp: +34 722 669 381
