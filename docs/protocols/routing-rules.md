# Routing Rules (Progressive Disclosure)

> Tabla de "para tarea X → lee archivo Y". Cargar solo lo relevante a la petición actual.

---

## Agentes PACAME + Skills custom

| Tarea | Lee |
|-------|-----|
| Branding/identidad visual | [`agents/01-NOVA.md`](../../agents/01-NOVA.md) y `.claude/skills/branding.md` |
| SEO/contenido orgánico | [`agents/02-ATLAS.md`](../../agents/02-ATLAS.md) y `.claude/skills/seo-audit.md` |
| Ads/embudos/CRO | [`agents/03-NEXUS.md`](../../agents/03-NEXUS.md) y `.claude/skills/ads-campaign.md` |
| Frontend/web | [`agents/04-PIXEL.md`](../../agents/04-PIXEL.md) y `.claude/skills/web-development.md` |
| Backend/APIs/infra | [`agents/05-CORE.md`](../../agents/05-CORE.md) |
| Social media | [`agents/06-PULSE.md`](../../agents/06-PULSE.md) y `.claude/skills/social-media.md` |
| Estrategia/pricing | [`agents/07-SAGE.md`](../../agents/07-SAGE.md) y `.claude/skills/client-proposal.md` |
| Copywriting | [`agents/08-COPY.md`](../../agents/08-COPY.md) y `.claude/skills/copywriting.md` |
| Analytics | [`agents/09-LENS.md`](../../agents/09-LENS.md) y `.claude/skills/analytics-report.md` |
| Lead gen outbound | [`workflows/lead-gen-pipeline.md`](../../workflows/lead-gen-pipeline.md) |
| Orquestación multi-agente | [`agents/DIOS.md`](../../agents/DIOS.md) |
| Vibe coding/MVP rápido | skill `vibe-coding` |
| Figma a código | skill `figma-to-code` |
| Design system/tokens | skill `design-system` |
| Prototipos interactivos | skill `interactive-prototyping` |
| Exploración visual/estética | skill `visual-design-exploration` |
| Deploy/producción | skill `deploy-workflow` |

## Estrategia y decisión ejecutiva

| Tarea | Skill |
|-------|-------|
| Consejo virtual / decisión estratégica | `c-level-advisor` |
| Decisión irreversible (pivot, despido, cambio de modelo) | `hard-call` |
| Antes de cualquier implementación creativa (OBLIGATORIO) | `brainstorming` |
| Segunda opinión sobre arquitectura o decisión crítica | `second-opinion` |
| Post-mortem de proyecto o incidencia | `postmortem` |

## Investigación y análisis de mercado

| Tarea | Skill |
|-------|-------|
| Investigación profunda (mercado, competencia, tendencias) | `deep-research` |
| Informe de mercado 50+ páginas estilo consultora | `market-research-reports` |
| Auditoría de producto / UX / arquitectura | `product-analysis` |
| Análisis financiero, valoración, forecasting | `finance-skills` |

## Marketing digital avanzado (42 sub-skills)

| Tarea | Skill |
|-------|-------|
| Estrategia de marketing completa (contenido, SEO, CRO, canales, growth) | `marketing-skills` |
| Crecimiento empresarial, ventas, customer success, RFPs | `business-growth-skills` |

## Gestión de producto

| Tarea | Skill |
|-------|-------|
| Priorización RICE, OKRs, agile, UX research | `product-skills` |

## Comunicación interna y con clientes

| Tarea | Skill |
|-------|-------|
| Updates 3P, newsletters, FAQs, informes de incidencia | `internal-comms` |
| Redacción técnica avanzada, artículos, guías | `writing-skills` |
| Infografías profesionales para clientes o RRSS | `infographics` |

## Visualización de datos / dashboards

| Tarea | Skill |
|-------|-------|
| Dashboards interactivos, KPIs, gráficos D3 | `d3-viz` |

## Diseño UI/UX

| Tarea | Skill |
|-------|-------|
| Extraer design system de capturas y generar prompts de UI | `ui-designer` |
| Revisión de UI contra Web Interface Guidelines / accesibilidad | `web-design-guidelines` |

## Planificación y ejecución de proyectos

| Tarea | Skill |
|-------|-------|
| Plan de implementación con tareas detalladas | `writing-plans` |
| Planificación con ficheros (task_plan.md, findings.md) | `planning-with-files` |
| Ejecutar plan paso a paso con checkpoints | `executing-plans` |

## Orquestación de agentes paralelos

| Tarea | Skill |
|-------|-------|
| 2+ tareas independientes en paralelo | `dispatching-parallel-agents` |
| Implementar plan con subagentes + revisión en 2 fases | `subagent-driven-development` |
| Lanzar N subagentes en worktrees aislados | `spawn` |
| Fusionar rama ganadora y limpiar | `merge` |

## Desarrollo autónomo MVP

| Tarea | Skill |
|-------|-------|
| PRD → producto desplegado sin supervisión | `loki-mode` |

## Testing y QA (Playwright)

| Tarea | Skill |
|-------|-------|
| Setup infraestructura de tests | `init` |
| Generar tests desde historias de usuario | `generate` |
| Diagnosticar y arreglar tests fallidos/flaky | `fix` |
| Migrar Cypress/Selenium a Playwright | `migrate` |
| Automatización browser / scraping / forms | `agent-browser` |

## Meta: factoría de skills y optimización

| Tarea | Skill |
|-------|-------|
| Crear o mejorar un skill desde cero | `skill-creator` |
| Diseñar workflow-skills con fases y decision trees | `designing-workflow-skills` |
| Optimizar un prompt con metodología EARS | `prompt-optimizer` |
| Extraer patrón probado como skill reutilizable | `extract` |
| Promover aprendizajes de memoria a reglas CLAUDE.md | `promote` |

---

> **Inventario completo de skills:** [`.claude/skills/INDEX.md`](../../.claude/skills/INDEX.md) (autogenerado, 959 skills).
> Regenerar tras añadir/quitar skills: `node tools/scripts/build-skills-index.mjs`.
