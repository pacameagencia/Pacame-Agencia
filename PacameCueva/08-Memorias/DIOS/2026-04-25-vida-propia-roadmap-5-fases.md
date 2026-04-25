---
type: memory
title: 2026-04-25-vida-propia-roadmap-5-fases
agent: DIOS
tags:
  - type/memory
  - auto-aprendizaje
  - 'dominio:dios'
  - vida-propia
  - roadmap
  - self-improvement
  - constitutional-ai
  - voyager
  - tool-creation
  - agent/DIOS
created: '2026-04-25T11:25:36.142Z'
source_path: >-
  C:\Users\Pacame24\Downloads\PACAME
  AGENCIA\PacameCueva\08-Memorias\DIOS\2026-04-25-vida-propia-roadmap-5-fases.md
neural_id: b4424a63-3565-40ca-860e-d8caa0ea9301
updated: '2026-04-25T11:25:36.142Z'
---

# Roadmap "Vida propia PACAME" — 5 fases

PACAME tiene 2.8/5 condiciones cumplidas para "vida propia agentic":

- ✅ Memoria persistente que evoluciona (1.0)
- 🟡 Loop de auto-crítica (0.5 — existe skill, no enganchada a prompts)
- ❌ Tool-creation (0.0)
- ✅ Sensores autónomos (1.0 — crons + webhooks)
- 🟡 Función-objetivo unificada (0.3 — métricas sueltas)

INSIGHTS:
- Reflection loop (Shinn 2023) da +30-90% sobre baseline. ROI inmediato.
- Voyager (2023) demostró curriculum automático + skill library funcionan en producción.
- Sakana AI Scientist (2024): tool-creation a $15/paper, ya publica en workshops.
- RLAIF (Constitutional AI Anthropic) elimina cuello de botella humano. Aplicable a agentes PACAME con LLM-juez.
- MemGPT resolvió memoria jerárquica con function calls — patrón replicable en `agent_memories`.

APLICACIONES PACAME:
- Fase A (2 días): /api/neural/self-critique + cron promote-improvements → agentes se reescriben solos.
- Fase B (3 días): skill tool-creator + sandbox /api/auto-tools/* → tool-creation segura.
- Fase C (2 días): PACAME_FITNESS = 0.4·MRR + 0.2·NPS + 0.2·discoveries + 0.1·tools + 0.1·sinapsis.
- Fase D (1 día post A+B+C): /api/neural/curriculum semanal que decide qué aprende PACAME.
- Fase E (1 hora, OBLIGATORIA primero): kill-switch global + auto-pause si fitness cae 20%.

PRODUCTO COMERCIAL DERIVADO:
- "Agente Vivo" €2k-5k/mes por cliente PYME.
- Auditoría "Madurez IA" €500-1500.
- "PACAME Brain-as-a-Service" white-label B2B agencias.

RIESGOS:
- Drift personalidad (mitig: snapshot+diff humano semanal)
- Coste explosivo titan (mitig: muestreo 1/10 + DeepSeek juez)
- Loops infinitos A↔B (mitig: lock 24h)
- Bias MRR-only (mitig: 5 componentes ponderados)
- EU AI Act high-risk (mitig: auditar antes de Fase C)

FUENTES: Reflexion · Voyager · Constitutional AI · Sakana AI Scientist · STORM · MemGPT · DeepSeek-R1 · Devin

## Cross-agent links

- [[08-Memorias/CORE|CORE]] — implementa endpoints self-critique, promote-improvements, fitness, curriculum y kill-switch
- [[08-Memorias/SAGE|SAGE]] — empaqueta "Agente Vivo" como producto premium y define pricing variable
- [[08-Memorias/LENS|LENS]] — diseña dashboard de PACAME_FITNESS y deltas semanales
- [[08-Memorias/PIXEL|PIXEL]] — UI panel kill-switch y feed de auto-improvements para Pablo
- [[08-Memorias/ATLAS|ATLAS]] — contenido SEO sobre "agentes IA con vida propia" para captar PYMEs interesadas
- [[08-Memorias/COPY|COPY]] — copy del producto "Agente Vivo" para landing y propuestas

> Auto-generada como pieza de oro · 2026-04-25 (Pablo solicitó: "aprende sobre cómo entrenarte a ti mismo y coger vida propia")
