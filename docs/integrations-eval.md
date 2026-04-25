# Evaluacion de integraciones propuestas — 2026-04-19

9 repos evaluados para integrar en PACAME. Stack objetivo: Next.js 15 + Supabase + Claude API + VPS Hostinger (8GB RAM) + 10 agentes IA.

## Fase 1 — INSTALADO

### tokenjuice (vincentkoc) — MIT
- **Que es:** CLI compactador de output ruidoso (git, pnpm, docker, rg). Reduce tokens consumidos por el harness.
- **Instalado:** `npm install -g tokenjuice` → v0.4.0 global.
- **Activar con Claude Code:** `tokenjuice install claude-code` (opcional, lo dejo a decision manual).
- **Beneficio esperado:** 30-60% menos tokens en sesiones pesadas de build/test.

### dotskills (vincentkoc) — AGPL-3.0 ⚠️
- **Que es:** 4 skills descargados en `.claude/skills/dotskills/`.
- **Skills instalados:**
  - `technical-deslop` — limpiar ruido IA en diffs antes de PR.
  - `technical-documentation` — docs tecnicas dev-ready.
  - `technical-integrations` — integraciones vendor-agnostic.
  - `technical-skill-finder` — mina logs y propone nuevos skills.
- **Licencia AGPL-3.0:** uso interno OK; si PACAME se empaqueta como SaaS cerrado redistribuyendo estos skills, contamina la licencia. Uso como tooling de desarrollo: sin problema.

## Fase 2 — EVALUAR ANTES DE INSTALAR

### paperclip (paperclipai) — MIT — DESPLEGADO EN VPS
- **Que es:** Node.js + React UI. Orquesta equipos de agentes con goals, presupuestos, org charts, governance.
- **Fit PACAME:** Alto — mapea 1:1 con los 10 agentes + 120 subespecialistas + supervision Pablo.
- **Estado 2026-04-20:**
  - ✅ Clonado en VPS `~/pacame/paperclip`
  - ✅ Docker container `docker-paperclip-1` corriendo, volumen nombrado `paperclip-data`
  - ✅ Compose custom: `~/pacame/paperclip/docker/docker-compose.pacame.yml`
  - ✅ `.env` con ANTHROPIC_API_KEY (key de n8n) + BETTER_AUTH_SECRET aleatorio
  - ✅ Onboard ejecutado: `deploymentMode=authenticated, bind=lan`, embedded Postgres (port 54329), Claude key en ENV
  - ✅ Doctor: 8 checks OK
  - ✅ Nginx: `/etc/nginx/sites-enabled/paperclip.pacameagencia.com` proxying a 127.0.0.1:3100
  - ✅ Health check con Host header manual → 200 OK
  - ✅ RAM tras despliegue: 2.5G/7.8G (5.2G libre)
- **Bloqueado por:**
  - ❌ DNS: falta registro A `paperclip.pacameagencia.com → 72.62.185.125` en el panel de Hostinger
  - ❌ SSL: certbot pendiente (necesita DNS propagado)
  - ❌ Signup primer admin (bootstrap invite activa, requiere acceso web)
  - ❌ Config Claude provider vía UI + carga de 10 agentes PACAME
- **Riesgo:** duplica `agents/DIOS.md` y red neuronal Supabase. Decidir tras evaluar.

### openclaw (openclaw) — MIT
- **Que es:** Asistente IA personal multicanal (WhatsApp, Telegram, Slack, Discord, Teams, iMessage, etc.).
- **Fit PACAME:** Medio — ya existe bot Telegram + n8n WhatsApp. OpenClaw podria reemplazar/unificar pero requiere migrar flujos.
- **Riesgo:** reescritura de canales actuales. No romper lo que funciona.
- **Decision:** pos-poner. Reevaluar cuando se quiera ofrecer "asistente multicanal" como servicio a clientes PYME.

### opik-openclaw (comet-ml) — Apache-2.0
- **Que es:** Plugin de observabilidad Opik para OpenClaw (traces, costes, tokens).
- **Dependencia:** requiere OpenClaw instalado.
- **Decision:** solo si se instala OpenClaw (Fase 2).

## Fase 3 — EVALUAR PARA CLIENTES ESPECIFICOS

### finagotchi (vincentkoc) — alpha hackathon
- **Que es:** Agente "Tamagotchi" IA que evoluciona con datos financieros (vendors, invoices, payments). Anomaly detection + auditing.
- **Stack:** FastAPI + Next.js 15 + Llama.cpp + Qdrant + Kuzu + GGUFs locales.
- **Fit PACAME:** Alto PARA `ecomglobalbox` (Cesar Veld, 255 clientes, 6.9k€ MRR, sistema de subs con invoices).
- **Riesgo:** alpha, requiere infra pesada (Qdrant+Kuzu = 2 servicios mas en VPS ya saturado 8GB).
- **Decision:** pos-poner. Reevaluar cuando ecomglobalbox quiera auditoria automatica. Ahora mismo overkill.

## SKIP — NO ENCAJAN

### NVIDIA/NemoClaw — alpha, Apache-2.0
- **Por que no:** Sandbox NVIDIA OpenShell para OpenClaw. Alpha (mar 2026), requiere GPU NVIDIA, overkill para PACAME.
- **Accion:** ninguna.

### vincentkoc/dexscraper — MIT
- **Por que no:** SDK Python para scraping DexScreener (tokens crypto, OHLC para MetaTrader). PACAME no hace crypto.
- **Accion:** ninguna.

### vincentkoc/android-market-api-php — MIT
- **Por que no:** Cliente PHP legacy (2012) del Android Market. PACAME es Node.js/Next.js. Reverse-engineering de Google Play no tiene caso de uso.
- **Accion:** ninguna.

## Resumen

| Repo | Decision | Estado |
|---|---|---|
| tokenjuice | Instalar | ✅ Global v0.4.0 |
| dotskills (4 skills) | Instalar | ✅ `.claude/skills/dotskills/` |
| paperclip | Evaluar en sandbox | ⏳ Pendiente clone + quickstart |
| openclaw | Pos-poner | ⏸ Reevaluar si se ofrece "asistente PYME" |
| opik-openclaw | Depende de openclaw | ⏸ |
| finagotchi | Pos-poner | ⏸ Reevaluar para ecomglobalbox |
| NemoClaw | Skip | ❌ |
| dexscraper | Skip | ❌ |
| android-market-api-php | Skip | ❌ |

## Proximos pasos
1. Activar `tokenjuice install claude-code` si Pablo valida el ahorro de tokens.
2. Clonar paperclip en VPS aislado y correr quickstart (2-3h).
3. Medir si paperclip reemplaza el orquestador DIOS o lo complementa.
