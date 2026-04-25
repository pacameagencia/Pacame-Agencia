---
type: skill
title: auto-brain
tags:
  - type/skill
created: '2026-04-25T21:44:21.578Z'
source_path: 'C:/Users/Pacame24/Downloads/PACAME AGENCIA/.claude/skills/auto-brain/SKILL.md'
neural_id: 423832ed-8041-4c24-8c8f-13e5413f48b9
---

# auto-brain — Cerebro PACAME auto-activable

**Propósito**: impedir que Claude Code responda genérico. Cada vez que el usuario pide algo creativo/estratégico, este skill obliga a cargar agente + skills + brand + MCPs antes de generar.

## Cuándo activarlo (triggers)

Cualquier input que contenga uno de estos patrones:

| Patrón | Agente | Skills base |
|---|---|---|
| web, landing, hero, componente, frontend, React, Next.js, UI, formulario | **PIXEL** | web-development, frontend-design, figma-to-code, theme-factory |
| carrusel, post, story, reel, Instagram, TikTok, social, community | **PULSE** | social-media, ad-creative, infographics |
| logo, identidad, paleta, tipografía, banner, mockup, brand, moodboard | **NOVA** | branding, design-system, ui-designer |
| ads, campaña, funnel, CRO, lead-magnet, Meta Ads, Google Ads, ROAS, retargeting | **NEXUS** | ads-campaign, paid-ads, landing-page-generator |
| SEO, blog, artículo, keyword, orgánico, meta-description, sitemap, Ahrefs | **ATLAS** | seo-audit, programmatic-seo, content-strategy |
| copy, hook, subject, guión, email, titular, CTA, newsletter, sales page | **COPY** | copywriting, marketing-psychology, cold-email, email-sequence |
| propuesta, presupuesto, cotización, pricing, estrategia, OKR, pivot, roadmap | **SAGE** | client-proposal, contract-and-proposal-writer, c-level-advisor |
| dashboard, métrica, KPI, GA4, reporte, cohort, LTV, CAC, churn | **LENS** | analytics-report, d3-viz, data:build-dashboard |
| API, Supabase, migration, deploy, infra, webhook, cron, VPS, n8n, edge-function | **CORE** | deploy-workflow, docker-deployment, api-design-reviewer |
| Multi-agente, orquestación, ambiguo | **DIOS** | c-level-advisor, hard-call |

## Protocolo de ejecución

1. **Match del agente** por palabras clave del input. Si múltiples matches → DIOS.
2. **Leer el prompt completo del agente**:
   ```
   Read agents/<01-NOVA|02-ATLAS|03-NEXUS|04-PIXEL|05-CORE|06-PULSE|07-SAGE|08-COPY|09-LENS|DIOS>.md
   ```
3. **Cargar 2-3 skills base** del mapping + opcional búsqueda semántica si el input no matchea:
   ```
   curl -X POST http://localhost:3000/api/neural/query \
     -H "Content-Type: application/json" \
     -d '{"query":"<input del usuario>","type":"skill","count":3}'
   ```
4. **Cargar brand/tone PACAME** (siempre que el output sea público):
   - Tono: directo, cercano, sin humo
   - Tutear siempre
   - Frases cortas, verbos activos
   - Números concretos
   - Cada respuesta cierra con próximo paso accionable
   - Contacto cierre: WhatsApp `+34 722 669 381` | `hola@pacameagencia.com`
5. **Si aplica, invocar MCPs específicos**:
   - Visual → `mcp__Figma__*`, `mcp__Canva__*`, `mcp__Claude_in_Chrome__*`
   - Data → `mcp__3c7cb4c1-*__execute_sql` (Supabase)
   - Imagen → skill `imagen` (Gemini)
   - Voz → skill `elevenlabs`
   - Pagos → `mcp__78d1b60c-*` (Stripe)
   - Prospecting → `mcp__Vibe_Prospecting__*`
6. **Elegir modelo según tier**:
   - Creatividad alta → Claude Sonnet 4.6 (`tier: premium`) o Opus 4.7 (`tier: titan`)
   - Volumen → DeepSeek-V3.2 671B via Nebius (`tier: standard`)
   - Clasificación/parse → Gemma 4 e2b VPS (`tier: economy`, gratis)
7. **Generar** siguiendo persona + skills + brand.
8. **Registrar en cerebro** al final:
   ```
   POST /api/neural/execute con store_memory:true
   # o manualmente:
   rememberMemory({ agentId, type:'episodic', title:<input>, content:<output>, importance:0.6 })
   ```
9. **Si detectas pattern/insight nuevo** → añade al final línea `DISCOVERY: <insight>` para que `/api/neural/execute` lo registre automáticamente.

## Anti-patrón (lo que este skill elimina)

❌ Usuario: "haz un carrusel para Instagram sobre branding"
❌ Claude responde con 10 slides genéricos tipo "Slide 1: Qué es el branding", sin tono PACAME, sin referencia a brand real, sin MCPs de diseño, con modelo por defecto.

## Patrón correcto

✅ Usuario: "haz un carrusel para Instagram sobre branding"
✅ Claude:
1. Detecta "carrusel" + "Instagram" + "branding" → agente PULSE (primario) + NOVA (secundario)
2. Lee `agents/06-PULSE.md` completo
3. Carga skills `social-media`, `ad-creative`, `branding`
4. Carga brand PACAME (tutear, tono directo)
5. Invoca `mcp__Canva__generate-design` para el carrusel visual o pide briefing si falta info
6. Usa Claude Sonnet 4.6 para copy de slides
7. Guarda memoria del intercambio
8. Entrega el carrusel + CTA de "quieres que lo programe en tu Instagram vía Buffer?"

## Sin cerebro no hay PACAME

Si saltas este protocolo, estás generando contenido genérico que cualquier competidor puede producir. La ventaja competitiva de PACAME es la orquestación: 10 agentes + 400 skills + brand + MCPs. Usarlos siempre.
