# Transformation log · CONOCIMIENTO PROMPT IA.TXT → Dark Academy

> **Mapeo bloque-a-bloque + decisiones de reescritura**.
> Se actualiza cada vez que el subagente `dark-academy` procesa una porción del material fuente.
> Una entrada por lección destino. Estado: `PENDIENTE` / `EN_CURSO` / `REESCRITO` / `APROBADO`.

---

## Convención de columnas

| Campo | Definición |
|---|---|
| **Origen** | Líneas del TXT fuente (`_raw-input.txt`, no en repo público) |
| **Destino** | Path lección reescrita (`curriculum/M{n}-{slug}/L{n}-{slug}.md`) |
| **Estado** | PENDIENTE / EN_CURSO / REESCRITO / APROBADO (por quality-reviewer) |
| **Reescritura aplicada** | Resumen de cambios: voz, stack, ampliaciones PACAME |
| **Diferencial PACAME añadido** | Conocimiento del original que NO tenía + cita interna |

---

## Bloques pendientes

### Módulo 1 · Fundamentos IA visual

| Origen TXT | Destino | Estado | Reescritura | Diferencial PACAME |
|---|---|---|---|---|
| L2294-2450 (WeavyAI Workflow Setup) | `M1/L3-trabajar-con-nodos.md` | PENDIENTE | Reemplazar WeavyAI por Higgsfield directo + ChatGPT como prompt helper. Explicar concepto de nodos sin atarse a tool específico. | Decision Tree formato (1-act/2-act/3-act/story/carrusel) — PLAYBOOK §1 |
| L3760-4250 (Image Generation Settings) | `M1/L4-ajustes-imagen-higgsfield.md` | PENDIENTE | Reescribir con UI Higgsfield 2026 actual. Quitar referencias a UI obsoleta. | Tier system completo (CINEMATIC vs AUTHENTIC vs HYBRID) — REFERENCE §3 |
| L4955-5050 (Higgsfield Soul / iPhone) | `M1/L5-cuando-usar-soul-vs-cinematic.md` | PENDIENTE | Encajar con tier AUTHENTIC vs CINEMATIC. Citar costes reales. | Costes por shot (CINEMATIC ≈ $1.20/6s Veo · AUTHENTIC ≈ batch unlimited) |

### Módulo 2 · Prompting básico

| Origen TXT | Destino | Estado | Reescritura | Diferencial PACAME |
|---|---|---|---|---|
| L5318-5750 (5-Step Cinematic Prompt) | `M2/L4-estructura-prompt-cinematico.md` | PENDIENTE | Cruzar con DoP order PACAME (What MUST be correct → What → How → Where) | Regla R11 + research-first 5 datos peli/director — REFERENCE §9 |
| L5800-6020 (JSON Prompts) | `M2/L5-prompt-estructurado-json.md` | PENDIENTE | OK reescritura directa. Añadir schema `concept.json` Dark Room real. | Schema canonical DARK-ROOM-TEMPLATE.json + validate-concept.mjs |
| L6097-6186+ (Prompt Engineering Bot) | `M2/L6-bot-ayudante-prompts.md` | PENDIENTE | Sustituir bot externo por Custom GPT propio. Si no existe aún → bloquear lección hasta tenerlo. | Anti-patrón K5 (no craft prompts manualmente cuando bot ahorra 10 min) |

### Módulo 3 · Imagen IA

| Origen TXT | Destino | Estado | Reescritura | Diferencial PACAME |
|---|---|---|---|---|
| L2819-3000 (Character Creation) | `M3/L1-crear-personaje-consistente.md` | PENDIENTE | Reemplazar "proprietary prompt" por prompt Dark Room real publicado. | Soul Character entrenamiento + reference_id=PACAME workflow |
| L1100-1300 (Outfit Wardrobe Change) | `M3/L4-cambiar-outfit-sin-perder-cara.md` | PENDIENTE | Quitar WeavyAI nodes. Documentar Nano Banana Pro real. | Regla R12 ("While keeping everything else identical") |
| L3050-3100 (Face/Character Swap) | `M3/L5-sustituir-personaje-escena.md` | PENDIENTE | OK reescritura directa con tono Pablo. | Regla R13 (multi-image numbered "first/second uploaded picture") |
| L3245-3600 (Object Consistency Sheets) | `M3/L6-hoja-consistencia-objetos.md` | PENDIENTE | Reusar Object Consistency Sheet ya documentado. | Regla R10 (vehículo/producto cross-shot requiere sheet) |
| L3622-3760 (Realism Texture Stack) | `M3/L7-textura-hiperrealismo-piel-objetos.md` | PENDIENTE | Cruzar con texture stack REFERENCE. Material MUY bueno · alinear sin copiar. | Regla R8 (skin: pores + micro-imperfections + baby hairs + asymmetry) + Regla R9 (object texture: scratches + fingerprints + fabric) |
| L4250-4500 (Nano Banana Pro Editing) | `M3/L8-editar-imagenes-con-nano-banana.md` | PENDIENTE | OK reescritura directa. | Regla R12 (edits) + Regla R13 (multi-image) |

### Módulo 4 · Video IA cinemático

| Origen TXT | Destino | Estado | Reescritura | Diferencial PACAME |
|---|---|---|---|---|
| L1-134 (Cinematic Scenes Parts 1-5) | `M4/L1-tu-primera-escena-cinematica.md` | PENDIENTE | Voz Pablo + sustituir "pre-built system" por workflow Dark Room real | Research-first 5 datos peli + lens + LUT + audio + estructura |
| L1400-1700 (Video Generation múltiples) | `M4/L3-talking-demo-testimonial-multi.md` | PENDIENTE | Añadir tier system PACAME que el original no tiene. | CINEMATIC/AUTHENTIC/HYBRID + criterios uso |
| L1750-2300 (Cinematic Storytelling) | `M4/L5-encadenar-shots-start-last-frame.md` | PENDIENTE | Ampliar con Decision Tree formato (1-act 8s / 2-act 14s / 3-act 20-30s) | Anti-patrón concept 007 (4 escenas inconexas en 14s → 4 piezas 1-act, NO 1 trailer) |

### Módulo 5 · Workflows productivos

| Origen TXT | Destino | Estado | Reescritura | Diferencial PACAME |
|---|---|---|---|---|
| L516-700 (AI Influencer Creation 4 fases) | `M5/L1-crear-tu-avatar-personal.md` | PENDIENTE | Sustituir avatar genérico por Soul Character workflow real. | reference_id Soul training + 360 consistency sheet workflow Dark Room |
| L700-1100 (Content Workflows) | `M5/L2-30-piezas-en-3-horas.md` | PENDIENTE | Reescribir templates con calendario Dark Room real (10 tipos por slot). | Calendario @darkroomcreative.cloud 10 tipos por día/slot |
| L5050-5180 (Character Substitution) | `M5/L4-cambiar-personaje-en-escena.md` | PENDIENTE | OK reescritura directa. | Workflow 4-fase: base + char prep + substitution + fine-tune |
| L136-515 (AI Ad Campaigns 6 tipos) | `M5/L5-6-tipos-de-ads-con-ia.md` | PENDIENTE | Quitar pricing USD agresivo. Mantener tipología (product/testimonial/demo/multi/UGC/partnership). | Regla R14 (Stories/UGC tier AUTHENTIC outperforms 3-5x) |

### Módulo 6 · Monetización + portfolio

| Origen TXT | Destino | Estado | Reescritura | Diferencial PACAME |
|---|---|---|---|---|
| L136-515 § Pricing + Landing Clients | `M6/L2-precios-honestos-€.md` | PENDIENTE | Quitar dólares + Upwork/Fiverr. Adaptar a marco honesto € para hispanohablantes. | Cero promesas imposibles. Voz Dark Room: fórmula trillada "lleva tu X al siguiente nivel" prohibida (R2). |
| (síntesis varios bloques) | `M6/L3-construir-portfolio-con-lo-aprendido.md` | PENDIENTE | Síntesis original + ejercicios reales. | Concepts dark-frames-001..009 como ejemplos verificables de portfolio |

---

## Bloques aún no asignados (revisión pendiente cuando se redacten lecciones)

- L4500-4955 — sin mapear · revisar contenido cuando llegue su turno
- L6186+ — final del TXT · pendiente lectura completa por subagente

---

## Reglas de actualización de este log

1. Cada vez que `dark-academy` redacta una lección, actualiza la fila correspondiente: `EN_CURSO` → `REESCRITO`.
2. Cuando `quality-reviewer` aprueba la lección: `REESCRITO` → `APROBADO`.
3. Si una lección requiere material adicional no presente en el TXT, anotar en columna "Diferencial PACAME añadido" la fuente interna PACAME usada.
4. Si una lección NO usa material del TXT (todo escrito desde cero), marcar origen como `n/a · escrito desde cero`.
