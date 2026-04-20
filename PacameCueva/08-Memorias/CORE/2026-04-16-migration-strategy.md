---
type: memory
title: Migration strategy
agent: CORE
tags:
  - type/memory
  - memory-type/semantic
  - backend
  - migrations
  - database
  - agent/CORE
created: '2026-04-19T14:26:26.547Z'
neural_id: eb2a3488-36d4-4e9d-b085-95ac3b66da86
importance: 0.85
accessed_count: 0
updated: '2026-04-16T08:33:11.215721+00:00'
---
> **Tipo:** semantic · **Importancia:** 0.85 · **Accedida:** 0 veces

Every schema change as numbered .sql file in infra/migrations/. Idempotent (IF NOT EXISTS). RLS policies defined in same migration. Rollback script documented.

## Metadatos
- Agente: [[01-CORE|CORE]]
- Creada: 2026-04-16T08:33:11.215721+00:00
- Última lectura: —
