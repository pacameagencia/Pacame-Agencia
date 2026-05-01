# Visual Toolkit PACAME — árbol de decisión completo

> Inventario exhaustivo de skills, MCPs y subagentes para producir CUALQUIER asset visual sin caer en HTML genérico, SVG inline o "al estilo de" sin imagen real.
>
> Referenciado desde `CLAUDE.md` § PROTOCOLO VISUAL-FIRST. Si una tarea visual no encaja con ninguna entrada de este árbol, parar y revisar — no improvisar.

---

## Árbol de decisión (orden de invocación)

```
┌─ ¿Qué tipo de asset visual necesito?
│
├── Imagen / foto / mockup / hero / asset estático
│   └── skill `imagen` (Google Gemini Imagen 3) — primer recurso siempre
│       Alternativas: skill `nano-banana` (Gemini editor), Freepik AI API
│
├── UI nueva o rediseño completo (carácter visual distintivo)
│   └── skill `frontend-design`
│       Para tokens/paleta desde captura → skill `ui-designer`
│       Para tema de artefactos → skill `theme-factory`
│
├── Diseño Figma de referencia
│   ├── MCP `mcp__Figma__get_design_context`
│   ├── MCP `mcp__Figma__get_screenshot`
│   └── skill `figma-to-code` para traducir a Next.js/Tailwind
│
├── Interacción rica (scroll, reveals, page transitions, micro-anim)
│   ├── Framer Motion (siempre dispobible en stack PACAME)
│   ├── skill `react-view-transitions` (animaciones nativas)
│   └── skill `composition-patterns` (refactor de animaciones complejas)
│
├── Arte ambiental / generativo / fondos / patrones
│   ├── skill `algorithmic-art` (p5.js, semilla determinística)
│   └── skill `canvas-design` (canvas 2D + export PNG/PDF)
│
├── Experiencia multi-página interactiva tipo claude.ai/artifacts
│   └── skill `web-artifacts-builder`
│
├── Web 3D / scroll-animated / premium
│   └── skill `3d-scroll-website`
│
├── Vídeo / motion graphics
│   ├── skill `remotion` (React + video) — patrones toolkit-specific
│   ├── skill `remotion-best-practices` (patrones generales)
│   ├── skill `ffmpeg` (procesamiento, format conversion)
│   ├── skill `video-prompting` (text-to-video / image-to-video)
│   └── skill `playwright-recording` (capturar interacciones browser)
│
├── Voz / audio / podcasts
│   ├── skill `elevenlabs` (TTS español, voz Brian, multilingual_v2)
│   ├── skill `audio-transcribe` (timestamps + speakers)
│   ├── skill `asr-transcribe-to-text` (Qwen3-ASR)
│   └── skill `google-tts` (alternativa Cloud)
│
├── Dashboard / data viz
│   ├── skill `data:build-dashboard`
│   └── skill `d3-viz` (D3.js custom)
│
├── Carrusel / post / story / reel social
│   ├── skill `social-media`
│   ├── skill `social-content`
│   ├── skill `ad-creative`
│   ├── skill `infographics`
│   └── skill `pacame-viral-visuals` (PACAME custom para Dark Room/RRSS)
│
├── Brand identity completa (logo, paleta, tipografía, sistema)
│   ├── skill `branding`
│   ├── skill `brand-guidelines` (Anthropic-style)
│   ├── skill `design-system`
│   └── skill `ui-design-system`
│
├── Producción de contenido masivo PACAME
│   ├── skill `pacame-contenido` (skill maestra producción Dark Room)
│   └── skill `content-production`
│
├── Slides / presentaciones
│   ├── skill `ppt-creator`
│   ├── skill `pptx`
│   └── skill `board-deck-builder` (decks ejecutivos)
│
├── PDFs / documentos
│   ├── skill `pdf`
│   ├── skill `pdf-creator` (con fonts chinas si toca)
│   └── skill `markdown-to-epub-converter` (libros/manuales)
│
├── Excel / spreadsheets visuales
│   ├── skill `xlsx`
│   └── skill `excel-automation`
│
├── Diagramas
│   └── skill `mermaid-tools` (extrae + renderiza Mermaid)
│
└── Logos / iconos AI/LLM brands
    └── skill `llm-icon-finder` (lobe-icons)
```

---

## MCPs visuales disponibles

| MCP | Caso de uso | Cuándo invocar |
|-----|-------------|----------------|
| `mcp__Figma__*` | Get design context, screenshot, exportar componentes | Cliente comparte link Figma |
| `mcp__Canva__*` (id `e1c45596-*`) | Plantillas Canva editables | Imagen branded rápida con kit |
| `mcp__Claude_in_Chrome__*` | Navegación browser para referencia competencia | Auditar competencia visual |

---

## Subagentes con poder de veto

| Subagente | Función | Cuándo invocar |
|-----------|---------|----------------|
| `.claude/agents/visual-reviewer.md` | **Bloquea diseño genérico** antes de dar por terminado output visual | TODO output visual antes de cerrar tarea (paso 10 del protocolo) |
| `nova` (`agents/01-NOVA.md`) | Directora creativa: marca, identidad, sistemas visuales | Tarea creativa de marca completa |
| `pixel` (`agents/04-PIXEL.md`) | Frontend lead: implementación UI con código | Implementar diseño en Next.js/React |

---

## Anti-patrones (NUNCA hacer)

1. **Escribir `<svg>` inline genérico** como placeholder. Si necesitas icono → Lucide / Radix Icons. Si necesitas ilustración → skill `imagen`.
2. **Gradientes Tailwind random** (`bg-gradient-to-br from-purple-500 to-pink-500`) sin paleta de marca. Cargar tokens del cliente o invocar `theme-factory`.
3. **"Al estilo de Apple/Linear/Stripe"** sin captura de referencia. Si el usuario pide ese estilo → MCP Chrome para sacar screenshot real → `ui-designer` extrae sistema → aplicar.
4. **Placeholder.com / via.placeholder / dummyimage** en producción cliente. Generar imagen real con `imagen` aunque sea iteración 1.
5. **HTML plano + Tailwind** para landing nueva sin pasar por `frontend-design`. Resultado predecible = look genérico de plantilla SaaS.
6. **Mezclar paletas** entre cliente y PACAME. Cada cliente Capa 2 tiene su brand pack en `clients/<x>/brand/`.

---

## Checklist final (paso 10 protocolo visual-first)

Antes de cerrar cualquier tarea visual, verificar:

- [ ] ¿Usé al menos un skill/MCP de este árbol? (no fui a HTML plano directo)
- [ ] ¿La paleta/tipografía/sistema está documentada o cargada de tokens?
- [ ] ¿Pasé el output por `visual-reviewer` (`.claude/agents/visual-reviewer.md`)?
- [ ] ¿Hay imagen real generada con `imagen` o asset real, no SVG inline / placeholder?
- [ ] ¿El resultado tiene carácter distintivo o se ve a SaaS template?

Si alguna respuesta es **no**, parar y completar antes de entregar.

---

## Mantenimiento de este documento

- **Última revisión:** 2026-04-30.
- **Cuándo actualizar:** cada vez que se añada/retire un skill visual relevante en `.claude/skills/`, cambien MCPs disponibles, o se incorpore un nuevo subagente con veto visual.
- **Responsable:** Pablo Calleja (con asistencia de Claude). Validar contra `node tools/scripts/build-skills-index.mjs` para sincronización con inventario real.
