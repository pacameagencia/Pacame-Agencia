# ⚠️ PROTOCOLO VISUAL-FIRST (OBLIGATORIO)

> Cargar SIEMPRE antes de escribir/editar cualquier `.tsx`, `.jsx`, `.css`, `.html`, `.svg`, `.png`, o generar cualquier diseño/imagen/asset visual.
>
> **Inventario completo con árbol de decisión:** [`strategy/visual-toolkit.md`](../../strategy/visual-toolkit.md).

---

## Checklist (pasar TODOS los puntos antes de codear)

1. **¿Necesito imagen/foto/mockup?** → Invocar skill `imagen` (Google Gemini). NUNCA usar `<svg>` genérico, placeholders, ni "al estilo de" sin imagen real.
2. **¿Es UI nueva o rediseño?** → Invocar skill `frontend-design` para carácter visual distintivo. NO escribir HTML a pelo con gradientes Tailwind genéricos.
3. **¿Existe diseño Figma de referencia?** → MCP `mcp__Figma__get_design_context` + `get_screenshot` antes de codear.
4. **¿Necesito design tokens/paleta?** → Skill `ui-designer` (desde captura) o `theme-factory` (para artefactos).
5. **¿Requiere interacción rica (scroll, reveals, transitions)?** → Framer Motion + skill `react-view-transitions`.
6. **¿Arte ambiental / generativo / fondos?** → Skill `algorithmic-art` (p5.js) o `canvas-design`.
7. **¿Experiencia multi-página interactiva?** → Skill `web-artifacts-builder`.
8. **¿Video/voz?** → Skill `remotion` / `ffmpeg` (video), `elevenlabs` (voz).
9. **¿Dashboard de datos?** → Skill `data:build-dashboard` + `d3-viz`.
10. **Antes de dar por terminado**: invocar subagente `visual-reviewer` ([`.claude/agents/visual-reviewer.md`](../../.claude/agents/visual-reviewer.md)) que bloquea diseño genérico.

---

## Regla dura

> Si la tarea es visual y NO estoy invocando un skill/MCP de la lista, estoy fallando. Parar y elegir la herramienta correcta antes de codear.

## Anti-patrones que el visual-reviewer bloquea

- SVG inline genérico como placeholder.
- Gradientes Tailwind random sin paleta de marca.
- `via.placeholder.com` / `dummyimage.com` en producción.
- "Al estilo de Apple/Linear/Stripe" sin captura de referencia.
- HTML plano para landing nueva sin pasar por `frontend-design`.
- Mezcla de paletas entre cliente y PACAME.
- Tipografía system-ui en proyecto branded.

Detalle completo y árbol de decisión: [`strategy/visual-toolkit.md`](../../strategy/visual-toolkit.md).
