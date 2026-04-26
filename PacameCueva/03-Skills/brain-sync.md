---
type: skill
title: brain-sync
tags:
  - type/skill
  - capability/neural
  - capability/sync
created: '2026-04-26T08:07:23.325Z'
source_path: 'C:\Users\Pacame24\Downloads\PACAME AGENCIA\PacameCueva\03-Skills\brain-sync.md'
neural_id: eadc672f-1f07-4c1d-b46d-852b79156125
updated: '2026-04-26T08:07:23.325Z'
---
# 🔄 brain-sync

Sincronización bidireccional manual entre vault y Supabase. Slash command: `/brain-sync [--full]`.

## Qué envuelve

- `tools/obsidian-sync/bootstrap.ts` — push vault → Supabase (idempotente, UPSERT en `knowledge_nodes` + `knowledge_edges`)
- `tools/obsidian-sync/pull.ts` — pull Supabase → vault (incremental por defecto, `--full` regenera todo)
- `tools/obsidian-sync/verify.ts` — health check final

## Cuándo usarlo

- Tras editar muchos archivos del vault sin que el watcher estuviera vivo
- Tras añadir nuevos agentes/skills/workflows en el repo (ejecuta bootstrap para reflejarlos)
- Cuando el dashboard `Decay.md` muestra zonas muertas inesperadas → suele indicar drift entre fuentes
- Una vez al inicio de cada sesión larga si has estado fuera del vault >24 h

## Cuándo NO usarlo

- Cuando el watcher Task Scheduler `PACAME-BrainWatcher` está Running y el vault está activo (los cambios sincronizan en <3s automáticamente)
- Como primer paso ante un fallo: antes verifica con `verify.ts` qué está realmente roto

## Agentes relacionados

[[01-DIOS]] — orquesta el cerebro completo y consume el resultado.
[[05-CORE|CORE]] — owner del subsistema de sync.

## Cableado verificado

- Watcher: Task Scheduler `PACAME-BrainWatcher`, estado Running
- Endpoint Supabase: `DATABASE_URL` en `web/.env.local`
- Cron VPS: `pacame-vault-pull` cada 5 min vía pm2 en 72.62.185.125
