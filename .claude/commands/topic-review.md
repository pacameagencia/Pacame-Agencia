---
description: Vista global de un tema agregado entre múltiples chats Claude Code (visión cross-sesión).
argument-hint: "[slug | título aproximado]"
---

Devuelve la vista agregada de un thread de conversaciones por tema. Cada chat de Claude Code se procesa al cerrar (hook `SessionEnd` → `tools/extract-session-topic.ts` → `/api/neural/sessions/extract-topic`) y se agrupa en `conversation_threads` por `topic_slug` (con fuzzy-match para evitar fragmentación).

Pasos:

1. **Resolución del slug:**
   - Si $1 contiene guiones y solo a-z0-9 → es slug directo (ej. `dark-frames-pipeline`).
   - Si $1 es texto natural → normalizar a kebab-case y hacer match flexible:
     ```sql
     SELECT topic_slug, topic_title, similarity(topic_slug, '<normalized>') AS sim
     FROM conversation_threads
     ORDER BY sim DESC LIMIT 5;
     ```
     Si solo hay 1 con sim > 0.7 → usarlo. Si hay varios → mostrar tabla y pedir confirmación.
   - Si $1 vacío → listar los 10 threads más recientes con `updated_at DESC` y dejar que Pablo elija.

2. **Llamar al endpoint:**
   ```bash
   curl -s "http://localhost:3000/api/neural/threads/<slug>" | jq
   # En prod: https://pacameagencia.com/api/neural/threads/<slug>
   ```

3. **Renderizar a Pablo:**
   - **Tema:** `topic_title` + número de sesiones agrupadas + última actividad.
   - **Resumen:** `summary` consolidado.
   - **Decisiones tomadas:** lista de `decisions[].decision` con fecha.
   - **Bloqueos abiertos:** lista de `blockers[]` (severity ≠ resolved).
   - **Próximos pasos pendientes:** lista de `next_steps[]` con owner.
   - **Sesiones que contribuyeron:** tabla compacta `session_id | started_at | turns_count | quality_score`.
   - **Continúa donde lo dejaste:** propón el primer `next_step` con owner=pablo o claude como acción concreta.

4. Si no hay `next_steps` pendientes → resume "Tema cerrado, sin pendientes".
5. Si no hay matches → "No tengo memoria global de este tema. ¿Quieres que abramos thread nuevo? Lanza `/cerebro` con el tema."

Respuesta ≤ 250 palabras. Tutear a Pablo.
