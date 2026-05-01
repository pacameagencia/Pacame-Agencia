# tools/obsidian-sync

Bridge bidireccional entre el vault Obsidian `PacameCueva/` y la red neuronal Supabase de PACAME.

## Componentes

| Archivo | Rol |
|---|---|
| `watcher.ts` | Real-time: chokidar observa `PacameCueva/**/*.md` → upsert `knowledge_nodes` + extract wikilinks → `fire_synapse()`. Debounce 2s. |
| `pull.ts` | Cron: Supabase → vault. Materializa memorias/sinapsis/discoveries en `08-Memorias/`, `07-Sinapsis/`, `09-Discoveries/`. Modo INCREMENTAL por defecto, FULL con flag. |
| `bootstrap.ts` | One-shot: vuelca el vault completo a Supabase. Para primer setup o re-sync masivo. |
| `configure-plugins.ts` | Re-asegura `obsidian-local-rest-api` con apiKey + insecure port 27123. |
| `install-plugins.ts` | Instala los 13 plugins requeridos del vault (smart-connections, dataview, templater, kanban, excalidraw, etc.). |
| `verify.ts` | Health-check unificado: vault ↔ Supabase ↔ crons. Smoke test con `[OK]`/`[FAIL]`. |
| `ecosystem.config.cjs` | PM2 ecosystem para VPS. Define `pacame-vault-watcher` + `pacame-vault-pull`. |
| `lib/paths.ts` | Auto-resolve `PACAME_ROOT` + `PACAME_VAULT`. |
| `lib/frontmatter.ts` | Lectura/escritura YAML frontmatter con `neural_id`. |
| `lib/wikilinks.ts` | Extrae `[[wikilinks]]` para `linkKnowledge`. |
| `lib/supabase.ts` | Carga `.env.local` desde `<root>/web/.env.local` o `PACAME_ENV_FILE`. Helpers Supabase + `upsertKnowledgeNode` + `linkKnowledge`. |

## Stack runtime

### Local (Windows — desarrollo)

```bash
cd tools/obsidian-sync
npm ci
npx tsx watcher.ts    # observa vault local + push a Supabase
npx tsx pull.ts       # one-shot pull Supabase → vault
npx tsx bootstrap.ts  # one-shot push vault completo → Supabase
npx tsx verify.ts     # health-check
```

### VPS (Hostinger 72.62.185.125 — producción 24/7)

```bash
# Setup una vez
git clone https://github.com/pacameagencia/Pacame-Agencia.git /opt/pacame
cd /opt/pacame/tools/obsidian-sync
npm ci

# Vault PacameCueva apunta a un repo separado (recomendado): pacameagencia/PacameCueva-vault
# Pablo activa el plugin obsidian-git en su vault de PC con ese remote.
# El VPS clona ese repo a /opt/pacame/PacameCueva y hace cron git pull cada 5min.

# Arrancar PM2
pm2 start ecosystem.config.cjs --only pacame-vault-pull
pm2 start ecosystem.config.cjs --only pacame-vault-watcher
pm2 save
pm2 startup  # auto-start tras reboot
```

### Variables de entorno

`lib/supabase.ts` busca `.env.local` en este orden:
1. `process.env.PACAME_ENV_FILE` (override)
2. `<PACAME_ROOT>/web/.env.local`
3. Fallback Windows: `C:/Users/Pacame24/Downloads/PACAME AGENCIA/web/.env.local`
4. `/opt/pacame/web/.env.local` (VPS)

Vars necesarias: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Logs (VPS)

```
/var/log/pacame/pull.log
/var/log/pacame/pull.err.log
/var/log/pacame/watcher.log
/var/log/pacame/watcher.err.log
```

## Health check

```bash
npx tsx verify.ts                    # exit 0 si todo OK
npx tsx verify.ts --notify           # + notifica Telegram
ssh root@72.62.185.125 "pm2 list && tail /var/log/pacame/pull.log"
```
