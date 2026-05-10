# Dark Room Studio Config · Archive

Estos docs (v1) fueron **consolidados en `DARK-ROOM-REFERENCE.md`** el 2026-05-10.

## Por qué están aquí

Mantenidos como histórico para auditoría y trazabilidad. **NO usar como fuente de verdad**.

## Contenido

| Archivo | Reemplazado por |
|---|---|
| `MEGA-PROMPT-v1.md` | `DARK-ROOM-REFERENCE.md` §5-§6 (workflow + master prompts) + secciones específicas en MEGA-PROMPT-v2 (mantenido en parent dir) |
| `STYLE-ANCHOR-v1.md` | `DARK-ROOM-REFERENCE.md` §3 (style variants) + `STYLE-ANCHOR-v2.md` (parent dir · 6 variants) |
| `KNOWLEDGE-INTEGRATION-v1.md` | `DARK-ROOM-REFERENCE.md` §9 (21 reglas duras) + `KNOWLEDGE-INTEGRATION-v2.md` (parent dir · 31 secciones · audit completo) |

## Por qué NO se borran

- Auditoría: rastreabilidad de cómo evolucionó el sistema (v1 → v2 → unified v1)
- Diff history: poder comparar deltas entre versiones para detectar regresiones
- Aprendizaje: estos docs documentan errores y aprendizajes que llevaron a la versión actual (e.g. concept 005 v1 falló con IP rejection · v2 añadió IP-safe substitutions)

## Si necesitas actualizar

NO actualices estos archivos. Actualiza:
1. `DARK-ROOM-REFERENCE.md` (fuente única de verdad)
2. `DARK-ROOM-PLAYBOOK.md` si afecta el workflow operativo
3. `DARK-ROOM-TEMPLATE.json` si afecta el schema de concepts

## Cuándo limpiar este archive

- Cuando los docs v1 superen 1 año sin consultarse
- Cuando se mergee a main otra reescritura mayor (ref. v2 actual al unified)
- Coordinar con Pablo antes de purga
