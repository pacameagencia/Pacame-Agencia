# VPS Hostinger Runtime — Runbook PACAME

**Host:** 72.62.185.125 (Hostinger KVM2)
**Specs:** 8 GB RAM, 2 cores AMD EPYC, 96 GB SSD
**Stack:** Docker, n8n, Nginx, Ollama + Gemma 4, PM2, cron
**SSH:** `ssh root@72.62.185.125` (key en `~/.ssh/hostinger_vps`)
**Último audit:** 2026-05-01

---

## 1. Procesos PM2 (estado deseado)

| Proceso | Tipo | Estado deseado | Notas |
|---|---|---|---|
| `dark-room-broker` | fork | `online` 24/7 | Dark Room SaaS |
| `dark-room-discord-bot` | fork | `online` 24/7 | Dark Room Discord |
| `dark-room-telegram-bot` | fork | `online` 24/7 | Dark Room Telegram |
| `pacame-vault-pull` | cron `*/5 * * * *` | `stopped` entre runs (correcto) | Pull Supabase → vault. Status `stopped` con `cron_restart` y `autorestart=false` es lo esperado. |
| `pacame-vault-watcher` | fork | `online` 24/7 | Chokidar watcher vault → Supabase. **Activado 2026-05-01.** |

```bash
ssh root@72.62.185.125 "pm2 list"
```

### Logs

```
/var/log/pacame/pull.log         (info)
/var/log/pacame/pull.err.log     (errors)
/var/log/pacame/watcher.log      (info)
/var/log/pacame/watcher.err.log  (errors)
/var/log/pacame/vault-pull.log   (cron git pull del vault)
```

### Comandos útiles

```bash
# Estado completo
pm2 list && pm2 describe pacame-vault-watcher

# Reiniciar watcher
pm2 restart pacame-vault-watcher
pm2 save  # IMPORTANTE: guarda dump tras cualquier cambio

# Ver logs en vivo
pm2 logs pacame-vault-watcher --lines 50

# Logs históricos
tail -100 /var/log/pacame/watcher.log
```

---

## 2. Sync vault PC ↔ VPS (24/7 sin PC encendido)

### Arquitectura

```
PC (Pablo) Obsidian Desktop
    │
    │ plugin obsidian-git auto-commit + push cada 5min
    ▼
GitHub: pacameagencia/PacameCueva-vault (privado)
    │
    │ cron git pull cada 5min
    ▼
VPS /opt/pacame/PacameCueva
    │
    │ chokidar watcher detecta cambios .md
    ▼
Supabase agent_memories + fire_synapse(wikilinks)
    │
    │ pull cron */5min vuelca memorias/discoveries/sinapsis al vault
    ▼
VPS /opt/pacame/PacameCueva (07-Sinapsis, 08-Memorias, 09-Discoveries)
    │
    │ git push (cron) hacia el repo vault
    ▼
GitHub PacameCueva-vault
    │
    │ plugin obsidian-git pull cada 5min
    ▼
PC Obsidian — Pablo ve las nuevas memorias materializadas
```

### Setup VPS (una vez)

```bash
ssh root@72.62.185.125

# Backup del vault actual (479 archivos parciales)
cd /opt/pacame
mv PacameCueva PacameCueva.backup-$(date +%Y%m%d)

# Clonar el repo vault
git clone https://github.com/pacameagencia/PacameCueva-vault.git PacameCueva
cd PacameCueva && git config pull.rebase true && git config pull.autostash true

# Restaurar carpetas que el pull regenera (07/08/09) desde el backup
mkdir -p 07-Sinapsis 08-Memorias 09-Discoveries
cp -r ../PacameCueva.backup-*/07-Sinapsis/* 07-Sinapsis/ 2>/dev/null
cp -r ../PacameCueva.backup-*/08-Memorias/* 08-Memorias/ 2>/dev/null
cp -r ../PacameCueva.backup-*/09-Discoveries/* 09-Discoveries/ 2>/dev/null

# Cron git pull cada 5min (sync desde repo vault)
( crontab -l 2>/dev/null | grep -v "PacameCueva.*git pull"; \
  echo "*/5 * * * * cd /opt/pacame/PacameCueva && git pull --rebase --autostash >> /var/log/pacame/vault-pull.log 2>&1" \
) | crontab -

# Cron git push cada 5min (envía las notas regeneradas por pull al repo vault)
( crontab -l 2>/dev/null | grep -v "PacameCueva.*git push"; \
  echo "*/5 * * * * cd /opt/pacame/PacameCueva && git add -A 07-Sinapsis 08-Memorias 09-Discoveries && git diff --cached --quiet || (git commit -m 'auto: cerebro pull $(date -u +\"%Y-%m-%dT%H:%MZ\")' && git push origin main) >> /var/log/pacame/vault-push.log 2>&1" \
) | crontab -

# Verificar
crontab -l | grep PacameCueva
```

### Setup PC (una vez — acción manual de Pablo)

Ver [`README.md` del repo PacameCueva-vault](https://github.com/pacameagencia/PacameCueva-vault/blob/main/README.md) sección "Setup PC".

Resumen:
1. Instalar plugin **Obsidian Git** (autor: Vinzent Oboe)
2. Settings → Authentication: PAT con scope `repo`
3. Settings → Backup: interval `5min`, auto-pull `5min`
4. Settings → Advanced: remote = `https://github.com/pacameagencia/PacameCueva-vault.git`
5. Primera sync manual (terminal):
   ```bash
   cd "C:/Users/Pacame24/Downloads/PACAME AGENCIA/PacameCueva"
   git init && git remote add origin https://github.com/pacameagencia/PacameCueva-vault.git
   git add . && git commit -m "vault initial bootstrap"
   git branch -M main && git push -u origin main
   ```

### Eliminar dependencia del watcher local PC (tras verificar que VPS sync funciona)

```powershell
# En PC, eliminar la tarea Windows Task Scheduler que arranca brain-watch.bat
Unregister-ScheduledTask -TaskName "PACAME-BrainWatcher" -Confirm:$false

# Verificar que ya no está
Get-ScheduledTask -TaskName "PACAME-BrainWatcher" 2>&1 | head -5
```

---

## 3. Actualización del código del repo en VPS

VPS estaba en rama `claude/dazzling-hofstadter-514d8d` (10 días atrás). Tras merge de PR #99 (recuperación obsidian-sync) main contiene los scripts. Migrar a main:

```bash
ssh root@72.62.185.125
cd /opt/pacame

# Backup del estado actual
git stash push -m "vps-pre-main-migration-$(date +%Y%m%d)"

# Migrar a main
git fetch origin
git checkout main
git pull origin main

# Reinstalar deps (puede haber cambios en package.json)
cd tools/obsidian-sync && npm ci

# Reiniciar PM2 para que tome el nuevo código
pm2 restart pacame-vault-watcher
pm2 save

# Verificar
git log --oneline -3
pm2 list
tail /var/log/pacame/watcher.log
```

### Mantener el VPS al día (cron git pull código repo)

```bash
( crontab -l 2>/dev/null | grep -v "/opt/pacame git pull"; \
  echo "0 */6 * * * cd /opt/pacame && git pull origin main >> /var/log/pacame/repo-pull.log 2>&1" \
) | crontab -
```

---

## 4. Variables de entorno

### Ubicación

`/opt/pacame/web/.env.local` (3.4 KB)

`lib/supabase.ts` busca en este orden:
1. `process.env.PACAME_ENV_FILE`
2. `<PACAME_ROOT>/web/.env.local`
3. `/opt/pacame/web/.env.local` (fallback VPS)

### Vars críticas

```bash
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL                    # para apply-migration.py
GEMMA_API_URL                   # https://gemma.pacameagencia.com (Ollama VPS)
GEMMA_API_TOKEN
EMBED_MODEL=nomic-embed-text    # 768D (compatible con pgvector existente)
CRON_SECRET                     # auth para /api/neural/embed-bulk y otros crons
```

---

## 5. Health checks

```bash
# Cerebro neuronal completo
ssh root@72.62.185.125 "cd /opt/pacame/tools/obsidian-sync && npx tsx verify.ts --notify"

# Estado PM2
ssh root@72.62.185.125 "pm2 list && pm2 describe pacame-vault-watcher | head -30"

# Crons activos
ssh root@72.62.185.125 "crontab -l"

# Sync vault git
ssh root@72.62.185.125 "cd /opt/pacame/PacameCueva && git log --oneline -5 && git status"

# Embedding gap (debería bajar de 8.591 → 0 tras bulk)
curl https://pacameagencia.com/api/neural/embed-bulk
# Bulk run (ver infra/docs/embed-bulk-runbook.md cuando exista)

# Disco
ssh root@72.62.185.125 "df -h /opt"
```

---

## 6. Reboot recovery (qué arranca solo)

| Servicio | Auto-start tras reboot? |
|---|---|
| PM2 ecosystem (todos los procesos) | ✅ vía `pm2 startup` + `pm2 save` |
| Cron jobs | ✅ systemd cron daemon |
| Docker (n8n, Nginx) | ✅ `docker compose --restart unless-stopped` |
| Ollama | ✅ systemd service |

```bash
# Si PM2 startup no funciona, re-instalar
pm2 startup systemd -u root --hp /root
pm2 save
```

---

## 7. Disaster recovery

### Si VPS se rompe completamente

1. Crear nuevo VPS Hostinger
2. SSH + actualizar `~/.ssh/authorized_keys`
3. Ejecutar `/infra/scripts/setup-vps.sh` (clona repo + Docker + n8n + Nginx + Ollama)
4. Pull `nomic-embed-text` en Ollama: `ollama pull nomic-embed-text`
5. Configurar `.env.local` en `/opt/pacame/web/`
6. PM2: `cd /opt/pacame/tools/obsidian-sync && pm2 start ecosystem.config.cjs && pm2 save && pm2 startup`
7. Setup vault sync: ver sección 2 "Setup VPS"
8. DNS: comprobar que `n8n.`, `api.`, `voice.`, `gemma.` siguen apuntando a 72.62.185.125

### Si vault se pierde

- VPS: `cd /opt/pacame && rm -rf PacameCueva && git clone https://github.com/pacameagencia/PacameCueva-vault.git PacameCueva`
- PC: clonar el mismo repo en una ruta nueva, recargar Obsidian apuntando ahí
- El cerebro Supabase tiene todas las memorias: tras `pull.ts`, las carpetas 07/08/09 se regeneran

### Si Supabase se rompe

- Tablas críticas con backup automático (Supabase pro tier)
- Vault local sigue siendo fuente de verdad para 00-Dios, 01-Agentes, 02-Subespecialistas, 03-Skills, 04-Workflows, 05-Strategy, 06-Clientes
- `bootstrap.ts --commit` re-volca todo el vault a Supabase

---

## 8. Métricas de salud

| Métrica | Healthy | Warning | Critical |
|---|---|---|---|
| `/var/log/pacame/pull.log` última línea | < 6min | 6-30min | > 30min |
| `pacame-vault-watcher` uptime | days | hours | minutes (loop crash) |
| Disco `/opt` | < 70% | 70-85% | > 85% |
| `agent_memories` count | growing | flat 24h | shrinking |
| `agent_synapses fired today` | > 5 | 1-5 | 0 |
| `knowledge_nodes embedded ratio` | > 95% | 50-95% | < 50% |

Trigger alerta Telegram en `verify.ts --notify` si critical.

---

## Histórico de ediciones

- **2026-05-01**: Creación inicial. Watcher activado por primera vez. Recuperados 12 archivos `tools/obsidian-sync/` a main (PR #99). Repo `PacameCueva-vault` creado para sync 24/7 (PR pendiente).
