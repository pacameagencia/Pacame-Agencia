---
type: strategy
title: visual-toolkit
tags:
  - type/strategy
created: '2026-04-25T21:44:20.007Z'
source_path: 'C:/Users/Pacame24/Downloads/PACAME AGENCIA/strategy/visual-toolkit.md'
neural_id: 9c0e292d-36f0-4184-a382-4383fea82298
---
# Visual Toolkit PACAME — Árbol de decisión

> **Regla base**: antes de generar cualquier pieza visual (imagen, UI, landing, hero, mockup, dashboard, componente, video, voz), **invocar el skill/MCP correcto**. Nunca escribir HTML/CSS de memoria ni usar SVG genéricos como "placeholder".

---

## 1. Imágenes, fotos, mockups, arte visual

| Intent | Herramienta | Por qué |
|---|---|---|
| Hero image, foto de producto, mockup realista | Skill `imagen` (Google Gemini Imagen) | Fotografía fotorrealista de alta calidad. Default. |
| Imagen AI multi-proveedor (fallback, estilos) | Skill `deapi` | Variedad de modelos cuando Imagen no encaja. |
| Editar imagen existente (inpainting, cambiar colores) | Skill `qwen-edit` | Edición por prompt sobre imagen fuente. |
| Upscale / mejorar calidad de imagen | Skill `image-enhancer` | Para assets que llegan en baja resolución. |
| Arte generativo / patrones / fondos abstractos | Skill `algorithmic-art` (p5.js) | Código ejecutable, único por ejecución. |
| Canvas visual PNG/SVG desde código | Skill `canvas-design` | Arte personalizado por código. |
| Asset para Canva / plantilla editable | MCP `mcp__e1c45596-*__generate-design` | Cuando el cliente vaya a editar después. |
| Icono de modelo/marca AI | Skill `llm-icon-finder` | Logos oficiales Claude/GPT/Gemini. |

**Regla dura**: `<img src="placeholder">` y `<svg viewBox="...">` con formas planas están **prohibidos** salvo iconos UI. Si hay un hero, viene de `imagen`.

---

## 2. UI / componentes / landings / pantallas

| Intent | Herramienta | Por qué |
|---|---|---|
| Pantalla nueva con carácter visual | Skill `frontend-design` | Production-grade distintiva, no "AI-generic". |
| Aplicar personalidad visual a artefacto HTML | Skill `theme-factory` | Temas tipográficos/cromáticos coherentes. |
| Extraer design system desde screenshot/referencia | Skill `ui-designer` | Tokens + prompts de UI desde captura. |
| Crear/documentar design system completo | Skill `design:design-system` | Auditoría + extensión formal. |
| Experiencia multi-página rica, interactiva | Skill `web-artifacts-builder` | Sites multi-sección como artefacto. |
| Hay diseño Figma → código | MCP `mcp__Figma__get_design_context` + `get_screenshot` + `get_variable_defs` | Fidelidad 1:1 con diseño. |
| Convertir captura Figma manualmente | Skill `figma-to-code` | Fallback si el MCP no tiene acceso. |
| Patrones React reutilizables | Skill `composition-patterns` | Composición en lugar de props hell. |
| Performance React / Next | Skill `react-best-practices` | Antes de optimización prematura. |
| Transiciones entre rutas nativas | Skill `react-view-transitions` | Navegación suave tipo app nativa. |
| Scroll effects / parallax / reveals | Framer Motion (ya en stack) + `frontend-design` | Con variantes + `useScroll`. |

---

## 3. Revisión y QA visual

| Intent | Herramienta |
|---|---|
| Crítica estructurada de diseño (usabilidad, jerarquía) | Skill `design:design-critique` |
| Accesibilidad WCAG 2.1 AA | Skill `design:accessibility-review` + `a11y-audit` |
| Revisión contra Web Interface Guidelines | Skill `web-design-guidelines` |
| UX copy (microcopy, errores, CTAs) | Skill `design:ux-copy` |
| Test visual en navegador real | MCP `Claude_Preview` o `Claude_in_Chrome` |
| E2E, regresión visual, smoke tests | Skill `playwright-pro` (`generate`, `fix`, `report`) |
| Handoff a desarrollador | Skill `design:design-handoff` |

---

## 4. Datos, dashboards, viz

| Intent | Herramienta |
|---|---|
| Dashboard interactivo con KPIs | Skill `data:build-dashboard` |
| Visualización puntual (gráfico) | Skill `data:create-viz` + `d3-viz` |
| Infografía profesional | Skill `infographics` |
| Exploración de dataset | Skill `data:explore-data` |

---

## 5. Video y audio

| Intent | Herramienta |
|---|---|
| Video programático (React → video) | Skill `remotion` + `remotion-best-practices` |
| Procesamiento video/audio (recortar, concatenar) | Skill `ffmpeg` |
| Voz AI (voiceover, narración) | Skill `elevenlabs` |
| Demo CLI animado (gif/video) | Skill `cli-demo-generator` |
| Video demo web (grabación Playwright) | Skill `playwright-recording` |
| GIFs para Slack | Skill `slack-gif-creator` |
| Generar tracks de música AI | Skill `moltdj` |
| Comparar dos videos | Skill `video-comparer` |
| Screenshots automáticas | Skill `capture-screen` |

---

## 6. Ads y creatividades

| Intent | Herramienta |
|---|---|
| Creatividad publicitaria (imagen + copy) | Skill `ad-creative` |
| Campaña ads completa (plan + creatividades) | Skill `paid-ads` + `ads-campaign.md` |
| Video promocional | Skill `video-content-strategist` + `remotion` |

---

## 7. GPU / cómputo pesado

| Intent | Herramienta |
|---|---|
| Generación masiva / entrenamiento | Skill `runpod` (serverless GPU) |

---

## 8. Decisión rápida (flujograma)

```
¿Qué quiero crear?
├── Imagen/foto → imagen (Gemini) → si falla, deapi
├── UI nueva →
│   ├── ¿Hay Figma? → MCP Figma
│   ├── ¿Hay referencia/screenshot? → ui-designer
│   └── Nada → frontend-design + theme-factory
├── Video → remotion | ffmpeg (procesado) | playwright-recording (demo)
├── Voz → elevenlabs
├── Dashboard → data:build-dashboard
├── Ads → ad-creative
└── Arte generativo → algorithmic-art
```

---

## 9. Antes de aceptar cualquier diseño como "terminado"

Ejecutar subagente `visual-reviewer` (ver `.claude/agents/visual-reviewer.md`) que verifica:
- ¿Hay imagen real (Gemini/deapi), no placeholder?
- ¿Hay paleta coherente (theme-factory o design-system aplicado)?
- ¿Hay jerarquía tipográfica?
- ¿Hay espaciado consistente (4/8/12/16/24/32/48)?
- ¿Hay micro-interacción (hover, focus, scroll)?
- ¿Pasa a11y AA (contrastes, focus visible, semantic HTML)?
- ¿Tiene personalidad PACAME (no "AI-generic")?

Si falla cualquier punto → volver a capa 1 ó 2, no deployar.

---

## 10. APIs del proyecto relevantes

- **Gemini API** (ver `reference_apis_pacame.md`): usable directamente si el skill `imagen` no cubre el caso.
- **Claude API**: para visión (analizar imágenes subidas) o generación estructurada.
- **Anthropic Files API**: subir assets grandes para pipelines.
- **Supabase Storage**: bucket para imágenes generadas (evitar regenerar).

---

**Última regla**: si dudo qué herramienta aplica, primero invocar `skills-search` o `find-skills`. Nunca asumir.
