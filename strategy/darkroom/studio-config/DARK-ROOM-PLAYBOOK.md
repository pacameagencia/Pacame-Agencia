# Dark Room · PLAYBOOK · Sistema definitivo de creación

> **Recipe card 1-página · entrada única al sistema Dark Room.** Detalle completo en [`DARK-ROOM-REFERENCE.md`](DARK-ROOM-REFERENCE.md). Schema validable en [`DARK-ROOM-TEMPLATE.json`](DARK-ROOM-TEMPLATE.json). Calibración WOW en [`tools/dark-frames/benchmarks/`](../../../tools/dark-frames/benchmarks/).

**Regla maestra:** elige UNO de los 5 formatos canónicos. NO mezcles. NO inventes. Si la idea no encaja en ninguno, no estás listo para producir.

---

## 1 · Decision Tree — qué formato elegir

```
¿Qué quieres publicar?
├── UGC daily / BTS Pablo / tendencia rápida del día
│   └── ★ STORY 5s (AUTHENTIC iPhone tier)
│
├── Explainer semanal / lead magnet / case study
│   └── ★ CARRUSEL 7 slides (estático)
│
├── Pieza con motion · UNA acción que evoluciona en 8s
│   └── ★ 1-ACT 8s (DEFAULT recomendado · empieza aquí)
│
├── Acción que evoluciona en 2 momentos conectados (last frame A = start frame B)
│   └── ★ 2-ACT 14s chained
│
└── Trailer narrativo Hook + Content + CTA
    └── ★ 3-ACT 20-30s (NUNCA "un día completo de Pablo" en 14s)
```

**Anti-patrón #1 (caso concept 007):** disfrazar 4 escenas con cambios de localización como "trailer 14s". Imposible que fluya. Si tienes 4 momentos distintos, son 4 piezas 1-act, no 1 trailer.

---

## 2 · Tabla maestra de formatos

| Formato | Duración | Shots | Tier por defecto | Modelo recomendado | Coste estimado | Doble SÍ Pablo |
|---|---|---|---|---|---|---|
| **Story 5s** | 5s | 1 vertical | AUTHENTIC iPhone | Soul Cast | ~$0.50 | NO |
| **Carrusel** | n/a | 7 slides estáticas | CINEMATIC o AUTHENTIC | Soul V2 / Nano Banana Pro | ~$0.84 | NO |
| **1-act** | 8s | 1 continuo (start+end frame) | CINEMATIC o AUTHENTIC | Seedance 2.0 (HYBRID) o Soul Cast | ~$1.10 | SÍ si Seedance |
| **2-act** | 14s | 2 chained (last A = start B) | CINEMATIC HYBRID | Seedance 2.0 × 2 | ~$2.20 | SÍ |
| **3-act** | 20-30s | 3 con J-cut + match action + color match | CINEMATIC | Cinematic Studio Video 3.0 o Seedance × 3 | ~$3.30-5.50 | SÍ + cost-guard token |

**Costes calculados** sobre Seedance 2.0 22.5 cr/5s 9:16 a $0.049/cr · Soul V2 0.12 cr/gen · Soul Cast Story ~10 cr.

---

## 3 · Workflows por formato

### 3.1 · STORY 5s (AUTHENTIC · UGC daily)

**Cuándo usar:** Pablo en cocina, café, gym, paseo, comentario rápido sobre noticia/trend. Estética iPhone real, no cinematográfica.

**Workflow (5 pasos · 15 min):**
1. Decide la acción única. UN momento. UNA emoción.
2. Genera prompt simple Higgsfield Soul iPhone con `text2image_soul_v2` (3 variations).
3. Elige winner. Anímalo con Soul Cast (single shot 5s · `--medias start_image`).
4. Sube a IG Stories nativo (NO reels) con sticker + 1 hashtag.
5. Publish directo. NO outro Dark Room (stories es íntimo).

**Pre-render checklist (5 items):**
- [ ] Tier=AUTHENTIC declarado en concept JSON
- [ ] Soul Character ID `PACAME` referenciado
- [ ] Vocabulario AUTHENTIC en prompt (`shot on iPhone`, `natural light`, `unedited`, `candid`)
- [ ] Resolución 1080×1920 9:16
- [ ] Acción descrita con verbos simples (no "Pablo conduce un Testarossa al atardecer")

**Post-render checklist (3 items):**
- [ ] Skin realism micro-imperfections visible (NO plastic shine)
- [ ] Movimiento natural (NO robot · "with subtle human mannerisms and natural timing")
- [ ] Caption ≤80 chars + 1 hashtag

**Anti-patrón:** prompts cinematográficos (`cinematic lighting`, `RED 8K`, `color graded`) → genera imagen sobreproducida que se siente fake en stories.

---

### 3.2 · CARRUSEL 7 slides (estático · weekly)

**Cuándo usar:** explainer técnico, breakdown de un viral, lead magnet ebook 21 prompts, case study mensual.

**Workflow (6 pasos · 45 min):**
1. Define narrativa 7 slides: hook · problema · 3 pasos solución · resultado · CTA.
2. Genera 7 imágenes base con Soul V2 (3 variations cada · keep best).
3. Pasa por Smart Editor para añadir Pablo en slides 1, 4, 7.
4. Compose en Figma o Canva con tipografía Anton + paleta acid green canónica.
5. Export 1080×1350 4:5 IG feed format · 7 slides + 1 cover = 8 PNG.
6. Publish con caption larga storytelling + 5-7 hashtags Dark Room.

**Pre-render checklist (5 items):**
- [ ] Slide 1 = hook que para el scroll (pregunta o claim provocador)
- [ ] Slide 7 = CTA explícito (`Comenta GTA y te mando ebook`)
- [ ] Texto en slides ≤25 palabras por slide
- [ ] Tipografía Anton ALL CAPS + Space Grotesk para body
- [ ] Paleta acid green `#CFFF00` + off-white `#F4F1EA` + warm dark base

**Post-render checklist (3 items):**
- [ ] Consistencia visual cross-slide (mismo grading, misma luz)
- [ ] Pablo aparece en 3-4 slides (no en todos · descansos visuales)
- [ ] Caption tiene gancho primer línea + CTA + hashtags al final

**Anti-patrón:** carrusel sin CTA en slide 7 → engagement muere. Carrusel con texto over-saturado en cada slide → audiencia no lee.

---

### 3.3 · 1-ACT 8s (DEFAULT cinemático · empieza siempre aquí)

**Cuándo usar:** UNA acción que evoluciona. Pablo conduce → mira a cámara → sonríe. Pablo enciende mechero → da calada → suelta humo. Pablo abre Mac → tipea → mira pensativo.

**Workflow (7 pasos · 60-90 min):**
1. Research-first OBLIGATORIO: 5 datos reales de referencia (peli/director/lente/LUT/audio).
2. Decide tier (CINEMATIC=Seedance · AUTHENTIC=Soul Cast).
3. Define UNA acción única en 3 verbos encadenados.
4. Genera **start frame** con Soul V2 + Pablo Soul ID (3 variations · keep best).
5. Genera **end frame** con Soul V2 + Pablo Soul ID + acción al final (3 variations · keep best).
6. **Doble SÍ Pablo** + cost-guard token. Lanza Seedance 2.0 con `--medias start_image,end_image` (single shot 8s).
7. Post: LUT del concept + caption Anton + outro Dark Room 1.7s + audio (música + 3-5 SFX sync). Master 9.7s.

**Pre-render checklist (5 items):**
- [ ] Concept JSON pasa `node tools/dark-frames/validate-concept.mjs` con exit 0
- [ ] `research` array tiene 5 items reales (peli/director/lente/LUT/audio)
- [ ] `start_frame_path` y `end_frame_path` existen físicamente
- [ ] `subject_motion` describe acción evolutiva en verbos encadenados
- [ ] `approval.pablo_double_yes === true` + `cost_guard_token` válido

**Post-render checklist (3 items):**
- [ ] Continuidad cara/wardrobe entre start y end frame (mismo Pablo · mismo outfit · misma luz)
- [ ] Movimiento natural sin saltos (subject_motion + camera_motion declarados → coherentes en output)
- [ ] Audio sync points frame-perfect (motor a 0s · acción a 3s · resolución a 7s)

**Anti-patrón:** prompt video largo y barroco (`Pablo dramáticamente conduce su deportivo italiano por el atardecer mientras...`) → Seedance se confunde. Mejor prompt simple: `Pablo turns head to camera, slight smirk, exhales smoke, with subtle human mannerisms and natural timing, stable camera`.

---

### 3.4 · 2-ACT 14s (chained · mini-narrativa fluida)

**Cuándo usar:** la acción evoluciona en 2 momentos conectados. Pablo cocina → corta verdura (acto A) → prueba el plato (acto B). Pablo entra al estudio → enciende monitor (acto A) → escribe primer prompt (acto B).

**Workflow (9 pasos · 90-120 min):**
1. Research + decide tier (igual que 1-act).
2. Define narrativa A→B. La transición DEBE ser orgánica (no cambio de localización).
3. Genera start frame A con Soul V2 (3 variations · keep best).
4. Genera **end frame A** con Soul V2 — este será también el **start frame B**. ESTO ES CRÍTICO.
5. Genera **end frame B** con Soul V2 (3 variations · keep best).
6. Doble SÍ + cost-guard. Lanza Seedance shot A con `--medias start_A, end_A`.
7. Lanza Seedance shot B con `--medias end_A (=start_B), end_B`. **MISMO archivo PNG físico.**
8. Concat shot A + shot B sin transition (corte directo · last frame A = first frame B).
9. Post: LUT + caption con punch en transición + outro + audio continuo cross-shot.

**Pre-render checklist (5 items):**
- [ ] `transitions` array declara `from_shot=A`, `to_shot=B`, `type=last_frame_chain`
- [ ] `shots[0].end_frame_path === shots[1].start_frame_path` (mismo PNG)
- [ ] Subject motion A termina en pose que start B continúa (NO salto)
- [ ] Camera motion A y B coherentes (NO cambio brusco de lente entre shots)
- [ ] Audio plan continuo (música no se corta entre shots)

**Post-render checklist (3 items):**
- [ ] Si pausas en frame final A y frame inicial B: idénticos (test crítico)
- [ ] Movimiento entre shots se siente como UNA toma continua
- [ ] Audio cross-shot mantiene tono (no "cae" la música)

**Anti-patrón:** generar shot A y shot B con start frames distintos → salto narrativo brutal. Es el error de concept 007.

---

### 3.5 · 3-ACT 20-30s (trailer narrativo · usar con disciplina extrema)

**Cuándo usar:** cuando la pieza es un MICRO-TRAILER con estructura Hook + Content + CTA explícita. Cada act tiene función narrativa distinta. NO usar como "un día completo de Pablo" comprimido.

**Workflow (12 pasos · 3-4h):**
1. Research + tier obligatorio CINEMATIC.
2. Storyboard 3 acts:
   - **ACT 1 Hook (5-8s)** — UNA acción provocadora que para scroll
   - **ACT 2 Content (8-15s)** — desarrolla / contradice / sorprende
   - **ACT 3 CTA (5-8s)** — resolución + IDENTITY REVEAL + caption + outro
3. Para cada act: define start frame + end frame.
4. Define transiciones entre acts:
   - A→B: J-cut audio (audio del act siguiente entra antes del corte visual)
   - B→C: match action (motion arc visible cruzando el cut · ej: mano que se mueve continúa en el siguiente)
   - O: color match (último color de B = primer color de C)
5. Genera 6 frames Soul V2 (3 variations cada · 18 generations · ~$0.85)
6. Doble SÍ Pablo + cost-guard token específico por act.
7-9. Lanza Seedance × 3 (o Cinematic Studio Video 3.0 si tier=top).
10. Edit: aplicar transiciones declaradas (J-cut, match action, color match).
11. Post: LUT por act (puede variar cool→warm→neutral) + 4 captions sync + outro Dark Room.
12. Master 22-32s con audio music master arc (intro → drop → resolution).

**Pre-render checklist (5 items):**
- [ ] 3 acts con función narrativa distinta declarada (Hook · Content · CTA)
- [ ] Cada act ≤10s (NUNCA un solo act ≥12s · pesa demasiado)
- [ ] Transiciones declaradas con tipo específico (NO "cut" genérico)
- [ ] Music plan tiene arco (intro → drop → resolution · BPM consistente)
- [ ] Cost ≤$5.50 (3-4 shots) · si excede, plantear si vale la pena

**Post-render checklist (3 items):**
- [ ] Las 3 transiciones funcionan (test: pausa en cada cut · ¿se siente intencional?)
- [ ] Música se mantiene como hilo narrativo (NO descanso · NO cambio brusco)
- [ ] CTA en último act es ACCIONABLE (`comenta X y te mando Y`)

**Anti-patrón #1 (concept 007):** 4 escenas con cambios de localización en 14s. Si tu trailer requiere 4 localizaciones, es un mini-doc de 60s, no un reel de 20s.
**Anti-patrón #2:** transiciones técnicas (J-cut/whip/color-match) sin narrativa que las justifique. La transición SIRVE a la historia, no la salva.

---

## 4 · Pipeline 4-fase (común a todos los formatos con motion)

```
FASE 1 · Character Anchor       → 1 vez por character · 360 sheet + Soul ID Higgsfield
FASE 2 · Base Scenes (sin Pablo) → Soul V2 o Nano Banana Pro · genera ambiente
FASE 3 · Substitution           → Smart Editor mete a Pablo en cada base scene
FASE 4 · Video premium          → Seedance/Cinematic Studio (REQUIERE 2 SÍ Pablo)
FASE 5 · Composition + Outro    → ffmpeg LUT + captions + concat + outro Dark Room + audio
```

Detalle completo en [`DARK-ROOM-REFERENCE.md`](DARK-ROOM-REFERENCE.md) §5 · Workflow 4-fase obligatorio.

---

## 5 · Quality gate de 3 capas (defensa en profundidad)

Antes de cualquier render que cueste créditos:

1. **Schema validator** · `node tools/dark-frames/validate-concept.mjs <concept.json>` → exit 0 obligatorio
2. **Hook knowledge-gate** · emite reminder con checklist 16-item al detectar intent generación
3. **Subagente concept-reviewer** · valida coherencia narrativa contra el formato declarado · APROBADO/BLOQUEADO

Si cualquiera de las 3 capas falla → NO render. Itera hasta pass.

---

## 6 · Quick links

- Detalle completo: [`DARK-ROOM-REFERENCE.md`](DARK-ROOM-REFERENCE.md)
- Schema canonical: [`DARK-ROOM-TEMPLATE.json`](DARK-ROOM-TEMPLATE.json)
- Ejemplos validados: [`_examples/`](_examples/)
- Benchmarks WOW: [`tools/dark-frames/benchmarks/wow-references/`](../../../tools/dark-frames/benchmarks/wow-references/)
- Anti-patterns: [`tools/dark-frames/benchmarks/anti-patterns/`](../../../tools/dark-frames/benchmarks/anti-patterns/)
- Validator: [`tools/dark-frames/validate-concept.mjs`](../../../tools/dark-frames/validate-concept.mjs)
- Subagente reviewer: [`.claude/agents/concept-reviewer.md`](../../../.claude/agents/concept-reviewer.md)
- Hook gate: [`infra/scripts/knowledge-gate-hook.py`](../../../infra/scripts/knowledge-gate-hook.py)

---

## 7 · Maintenance

- Update playbook cuando un nuevo formato canónico se demuestre (rara vez · disciplina)
- Update tabla maestra cuando coste real diverja >20% del estimado (re-tarifar Seedance/Cinema)
- Revisión trimestral: ¿algún anti-patrón nuevo aparece en outputs reales? → añadir aquí
- Log de cambios al final de [`DARK-ROOM-REFERENCE.md`](DARK-ROOM-REFERENCE.md) §14
