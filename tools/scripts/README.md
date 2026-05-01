# tools/scripts/

Scripts de mantenimiento del repo PACAME (no de cliente — los de cliente viven en `clients/<x>/scripts/`).

## Scripts disponibles

### `build-skills-index.mjs`

Recorre `.claude/skills/`, parsea frontmatter de SKILL.md (y .md sueltos en raíz), agrupa por categoría y genera:

- `.claude/skills/INDEX.md` — tabla navegable agrupada.
- `.claude/skills/INDEX.json` — estructurado para consumo programático.

Detecta duplicados por nombre y los reporta.

**Uso:**

```bash
node tools/scripts/build-skills-index.mjs
```

**Cuándo regenerar:**
- Tras añadir o quitar skills en `.claude/skills/`.
- Tras renombrar skills (cambia el slug `name:` del frontmatter).
- Tras cambios masivos en categorías.
- Antes de hacer PR si tocaste skills.

**Salida esperada (output console):**
```
✓ INDEX.md + INDEX.json generados
  Escaneados: <n>
  Únicos:     <n>
  Duplicados: <n>
  Sin FM:     <n>
  Categorías: <n>
```

## Convención

- Cada script en su propio fichero.
- Sin dependencias externas (Node 20+ stdlib).
- ESM (`.mjs`).
- README documenta cada script.
- Salida humana legible.
