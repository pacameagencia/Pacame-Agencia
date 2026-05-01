---
description: Sincroniza manualmente vault ↔ Supabase (pull + bootstrap si falta algo).
argument-hint: "[--full]"
---

Sincroniza bidireccionalmente el cerebro IA PACAME.

Paso 1 — **Push del vault hacia Supabase**: si el watcher no está corriendo, ejecuta un barrido one-shot:
```bash
cd tools/obsidian-sync && npx tsx bootstrap.ts --commit
```

Paso 2 — **Pull de Supabase hacia el vault**:
```bash
cd tools/obsidian-sync && npx tsx pull.ts $1
```
(Si $1 = `--full` ignora last_sync y regenera todo.)

Paso 3 — **Verifica estado**:
```bash
cd tools/obsidian-sync && npx tsx verify.ts
```

Devuelve:
- Deltas: +N memorias, +N discoveries, +N sinapsis.
- Totales en Supabase.
- Tiempo total.
- Recordatorio de reiniciar Obsidian (`Ctrl+R` → Reload app without saving) si se crearon muchos archivos.

Respuesta ≤ 120 palabras.
