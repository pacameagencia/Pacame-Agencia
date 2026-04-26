---
type: concept
title: INSTRUCCIONES-ACTIVACION
tags:
  - type/concept
created: '2026-04-25T21:46:09.334Z'
source_path: >-
  C:\Users\Pacame24\Downloads\PACAME
  AGENCIA\PacameCueva\INSTRUCCIONES-ACTIVACION.md
neural_id: 6b19b956-8dc6-4360-ad26-72308fce462d
updated: '2026-04-25T21:46:09.333Z'
---
# Factoría de Soluciones con IA — Activación del Cerebro PACAME

Este vault Obsidian es la capa visual y editable del **cerebro neuronal PACAME**. Cada nota es una neurona; cada wikilink, una sinapsis; cada edición, un impulso que viaja a Supabase y se convierte en memoria persistente.

> **Definición oficial del sistema**: factoría de soluciones con IA.
> Cada discovery → servicio empaquetado. Cada sinapsis reforzada → workflow recurrente. Cada agente → capacidad monetizable.

---

## 🟢 Arrancar el cerebro en Windows

### 1. Watcher automático (Task Scheduler — registrado 2026-04-25)

La tarea **`PACAME-BrainWatcher`** ya está registrada en Windows Task Scheduler. Arranca al login del usuario, reinicia hasta 3× si falla, y mantiene `chokidar` vivo en background.

Verificar estado:
```powershell
Get-ScheduledTask -TaskName "PACAME-BrainWatcher" | Select-Object TaskName, State
Get-ScheduledTaskInfo -TaskName "PACAME-BrainWatcher" | Select-Object LastRunTime, LastTaskResult
```

Estado esperado: `State: Running` mientras la sesión esté activa.

Arranque manual (si la tarea está parada):
```powershell
Start-ScheduledTask -TaskName "PACAME-BrainWatcher"
```

Re-registrar la tarea desde cero si se pierde:
```powershell
$action = New-ScheduledTaskAction -Execute "C:\Users\Pacame24\Downloads\PACAME AGENCIA\tools\obsidian-sync\brain-watch.bat" -WorkingDirectory "C:\Users\Pacame24\Downloads\PACAME AGENCIA\tools\obsidian-sync"
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 0)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName "PACAME-BrainWatcher" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force
```

Doble click manual de respaldo: `tools/obsidian-sync/brain-watch.bat`.

### 2. Abrir Obsidian Desktop y apuntar a `PacameCueva/`
- 13 plugins activos (smart-connections, local-rest-api, dataview, templater, kanban, excalidraw, graph-analysis, omnisearch, remotely-save, git, calendar, tasks, style-settings).
- Tema `cerebro-neon.css` en `.obsidian/snippets/`.

### 3. (Opcional) MCP desde Claude Code
El MCP `pacame-vault` está registrado en `.claude/mcp.json`. Claude puede leer/escribir el vault vía Obsidian Local REST API. Requiere:
- Plugin Local REST API activo (puerto 27124 HTTPS).
- `OBSIDIAN_API_KEY` en `.env` alineada con `PacameCueva/.obsidian/plugins/obsidian-local-rest-api/data.json`.
- `uvx` instalado (viene con astral-sh/uv).

Si el plugin regenera la key:
```bash
cd tools/obsidian-sync
npx tsx configure-plugins.ts   # re-asegura apiKey + insecure port 27123
```
Y actualizar `.env → OBSIDIAN_API_KEY` con la key de `data.json`.

---

## 🔄 Sincronización manual

### Push vault → Supabase (one-shot)
```bash
cd tools/obsidian-sync
npx tsx bootstrap.ts --commit
```

### Pull Supabase → vault (incremental)
```bash
cd tools/obsidian-sync
npx tsx pull.ts
```
Con `--full` ignora `.sync-state.json` y regenera todo.

### Verificar estado
```bash
cd tools/obsidian-sync
npx tsx verify.ts
```

O desde Claude: `/brain-sync`.

---

## 🖥️ VPS (pull cron cada 5 min)

El VPS Hostinger `72.62.185.125` ejecuta `pacame-vault-pull` vía pm2 + systemd.

```bash
ssh -i ~/.ssh/hostinger_vps -o StrictHostKeyChecking=no root@72.62.185.125
pm2 list                                    # pacame-vault-pull debe aparecer
pm2 logs pacame-vault-pull --lines 30 --nostream
cat /var/log/pacame/pull.log | tail -20
```

Estado esperado: `status: stopped` entre runs (correcto para cron_restart `*/5 * * * *`).

Re-deploy si hace falta:
```bash
bash infra/deploy-brain-vps.sh
```

---

## 🧪 Endpoints neuronales (/api/neural/*)

8 rutas vivas en `web/app/api/neural/`:

| Endpoint | Qué hace |
|---|---|
| `POST /api/neural/topology` | Devuelve grafo agentes + sinapsis + weights |
| `POST /api/neural/route` | Input texto → agente primario + colaboradores por keyword+embedding |
| `POST /api/neural/query` | Búsqueda semántica en knowledge_nodes (pgvector HNSW) |
| `POST /api/neural/fire` | Dispara sinapsis (refuerza weight hebbian) |
| `GET /api/agents/neural-decay` | Cron 3 am UTC: decay memorias + sinapsis inactivas (RPCs `decay_memories`, `decay_synapses`) |
| `POST /api/neural/execute` | Ejecuta tarea + opción `store_memory:true` |
| `POST /api/neural/auto-discovery` | Cron 5 am UTC: sinapsis emergentes + market signals |
| `POST /api/neural/opportunity-scanner` | Detecta oportunidades comerciales desde discoveries |

---

## 🧠 Slash commands (desde Claude Code)

| Command | Uso |
|---|---|
| `/cerebro <tarea>` | Abre sesión con agente + memorias + colaboradores cargados |
| `/remember` | Guarda memoria explícita en la red neuronal del agente activo |
| `/synapse <src> <dst> <type>` | Dispara sinapsis manual entre dos agentes |
| `/discover <título>` | Registra insight/tendencia/patrón |
| `/neural-report` | Genera informe estado actual red neuronal |
| `/brain-sync [--full]` | Sync manual bidireccional vault ↔ Supabase |

---

## 🗂️ Estructura del vault

```
PacameCueva/
├── 00-Dios/              ← DIOS + plan maestro
├── 01-Agentes/           ← 10 agentes principales
├── 02-Subespecialistas/  ← 120+ subespecialistas por dominio
├── 03-Skills/            ← Skills .md indexadas
├── 04-Workflows/         ← SOPs WAT framework
├── 05-Strategy/          ← Roadmap, pricing, personas
├── 06-Clientes/          ← Fichas de clientes
├── 07-Sinapsis/          ← Archivos <agente-A>-<agente-B>-<tipo>.md
├── 08-Memorias/<AGENTE>/ ← Memorias persistentes por agente
├── 09-Discoveries/       ← Insights datados (YYYY-MM-DD-...)
├── _dashboards/          ← 9 dashboards (Red, Hubs, Decay, Actividad, Agentes, Kanban, Tareas, Calendario, Cerebro-Excalidraw)
└── _templates/           ← Templater: agente, memoria, discovery, sinapsis
```

---

## ⚠️ Troubleshooting

| Síntoma | Solución |
|---|---|
| `/brain-sync` falla con "cannot find tools/obsidian-sync" | Este fichero acaba de traer los scripts desde la rama `claude/dazzling-hofstadter-514d8d`. Ejecuta `git status` y commitea si hace falta |
| MCP pacame-vault no responde | Reload Obsidian (`Ctrl+R`) → verifica plugin Local REST API activo → comprueba puerto 27124 |
| Cert self-signed bloquea MCP | El flag `OBSIDIAN_VERIFY_SSL=false` ya está en `.claude/mcp.json`. Si persiste, activa insecure server (puerto 27123 HTTP) en el plugin y cambia `OBSIDIAN_PORT=27123`, `OBSIDIAN_PROTOCOL=http` |
| Pull VPS devuelve +0/+0/+0 | Correcto si nada cambió. Ver `cat /var/log/pacame/pull.log` |
| Watcher no detecta cambios | `Stop-ScheduledTask -TaskName "PACAME-BrainWatcher"; Start-ScheduledTask -TaskName "PACAME-BrainWatcher"`. Chokidar a veces pierde watchers tras suspender Windows |
| Embeddings desfasados | `cd tools/obsidian-sync && npx tsx embed-brain.ts` (re-embebe skills) o `npx tsx embed-discoveries.ts` |
| `verify.ts` reporta `Cron activity: 0` | Los crons de Vercel no han escrito en `agent_activities` recientemente. No afecta al vault local pero indica que `/api/agents/cron`, `/api/neural/learn` y `/api/agents/neural-decay` posiblemente no estén deployados o estén fallando antes de `logAgentActivity()`. Acción: revisar Vercel deployments + logs (`vercel logs --follow`) y confirmar `CRON_SECRET` configurado en producción. |

---

## 📦 Estado actual (auditoría adversarial 2026-04-26)

- Supabase: knowledge_nodes embebidos + 35 sinapsis + 216 memorias + 152 discoveries (post catch-up 2026-04-25).
- Vault local: 9 dashboards, 184 subespecialistas, 21 skills, 12 agentes, 8 strategy.
- Watcher: **Task Scheduler `PACAME-BrainWatcher`** registrado, estado Running.
- VPS pull cron: operativo cada 5 min vía pm2.
- Plugins Obsidian activos: 13/13 con `data.json` configurado.
- Endpoints neurales: 8/8.
- Crons Vercel: 12/12 (decay con RPC `decay_synapses` arreglado en migración 017).
- Slash commands: 6/6 con skill wrapper en `03-Skills/`.

Cada nueva sesión debería arrancar con `/cerebro <tarea>` para que el agente correcto entre a la conversación con su memoria ya cargada.

Smoke test rápido: `cd tools/obsidian-sync && npx tsx verify.ts` debe imprimir todo `[OK]`.
