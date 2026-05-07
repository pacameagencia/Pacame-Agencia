# 🔒 PROTOCOLO QUALITY GATE (OBLIGATORIO)

> Cargar SIEMPRE antes de entregar cualquier output a Pablo o a un cliente.
>
> Este protocolo es la **regla maestra de calidad** de PACAME. Cubre 5 dominios de output: **frontend, copy, video, branding, backend**. Bloquea entregas genéricas, sin carácter, o con calidad de "AI a secas".

---

## La regla de oro

> **Calidad > velocidad. Carácter > genérico. Iteración > primera versión.**
>
> Pablo prefiere esperar 30 minutos por algo bueno a recibir en 30 segundos algo regular. Lo regular es el default del modelo. Lo bueno requiere 3 cosas: (1) skill curada, (2) checklist pre-entrega, (3) revisor crítico.

---

## Las 3 capas obligatorias

### Capa 1: SKILL CURADA antes de generar
Cada dominio tiene su skill maestra del catálogo. **Es invocación obligatoria, no opcional.**

| Dominio | Skill obligatoria primera | Skills complementarias |
|---|---|---|
| **Frontend** (`.tsx/.jsx/.css/.html`) | `pacame-web` o `frontend-design` | `imagen` (mockups), `theme-factory` (tokens), `react-view-transitions` (animación), `brand-guidelines` (branding) |
| **Copy** (textos persuasivos, nombres, claims) | `copywriting` | `copy-editing`, `content-humanizer`, `marketing-psychology` |
| **Video / Cinemático** (reels, ads, trailers) | `video-content-strategist` | `remotion`, `ffmpeg`, `elevenlabs` (voz), research-first cinemático |
| **Branding** (logo, identidad, sistema visual) | `brand-guidelines` o `theme-factory` | `imagen`, `canvas-design`, `ui-design-system` |
| **Backend** (APIs, schemas, integraciones) | `architecture-patterns` o `senior-backend` | `api-endpoint-generator`, `database-schema-designer`, `code-reviewer` |

**Si la skill no aplica exacto, busca en `INDEX.md` o pregunta a Pablo.** Lo que NO vale: ir directo a generar sin pasar por skill.

### Capa 2: CHECKLIST PRE-ENTREGA
Antes de mostrar output a Pablo, pasar **TODOS** estos checks aplicables al dominio:

#### Para CUALQUIER output
- [ ] He invocado al menos 1 skill del catálogo (`Capa 1`).
- [ ] La salida tiene **carácter distintivo** — un experto del dominio no diría "esto es output AI genérico".
- [ ] Está **alineada con identidad PACAME** (`IDENTIDAD-PABLO.md`) o brand pack del cliente.
- [ ] No hay placeholders, lorem ipsum, "TODO", o secciones a medias.

#### Frontend (`.tsx/.jsx/.css/.html`)
- [ ] Paleta: tokens reales del cliente o PACAME (no `from-blue-500 to-purple-600` random).
- [ ] Tipografía: del brand pack (no system-ui en proyecto branded).
- [ ] Imágenes: generadas con `imagen` o assets reales (no SVG genérico, no via.placeholder).
- [ ] Iconos: Lucide/Radix consistentes (no SVG inline ad-hoc).
- [ ] Mobile-first: probado a 375px.
- [ ] Lighthouse 90+ esperable (lazy-load, semantic HTML, alt en imágenes).
- [ ] Animaciones añaden valor (no decoración random).

#### Copy
- [ ] No usa palabras prohibidas IA: *desbloquea, embárcate, viaje, transformador, en última instancia, en el mundo actual, navegar*.
- [ ] No usa fórmulas trilladas: *"X no es solo Y, es Z"*, *"imagina un futuro donde..."*.
- [ ] Frases cortas, verbos activos, números concretos.
- [ ] Tutea (alineado IDENTIDAD-PABLO).
- [ ] Tiene **hook real** en primer beat (no introducción vaga).
- [ ] Cierra con CTA o próximo paso accionable.

#### Video / Cinemático
- [ ] **Research-first completo**: 5 datos reales de peli/juego/director referencia (lentes, LUT, ritmo, audio, estructura). Sin esto, BLOQUEA.
- [ ] Concept_id asignado y tracked.
- [ ] Quality gate cinema (cost-guard token, visual-reviewer pass, outro Dark Room presente).
- [ ] Cita técnica concreta en prompt (no "cinematic vibe" genérico).
- [ ] Doble aprobación Pablo si es Veo/Seedance/Kling (regla dura por coste).

#### Branding
- [ ] Sistema completo: paleta + tipografía + escala + tokens + ejemplos de aplicación (no solo logo).
- [ ] Justificación racional: por qué estos colores, por qué esta tipo, por qué este nombre.
- [ ] Variantes mínimas: claro/oscuro, primary/secondary, hover/active.
- [ ] Antifragilidad: sigue funcionando en blanco/negro, en pequeño tamaño, en print.

#### Backend
- [ ] TypeScript strict mode, sin `any`.
- [ ] Validación de input en boundaries (Zod o manual).
- [ ] Error handling estructurado (códigos HTTP + mensajes útiles).
- [ ] RLS en Supabase si la tabla es sensible.
- [ ] Secrets en `.env.local`, nunca en código.
- [ ] Test de smoke (`npx tsc --noEmit` + curl básico al endpoint).
- [ ] Observabilidad: log estructurado o `recordLlmCall` si llama LLM.

### Capa 3: REVISOR CRÍTICO antes de entregar
Invocar el subagente correspondiente como **paso final**:

| Output tipo | Revisor |
|---|---|
| Frontend / visual | `visual-reviewer` (`.claude/agents/visual-reviewer.md`) |
| Copy / texto persuasivo | `quality-reviewer` con dominio=copy |
| Video cinemático | `quality-reviewer` con dominio=video + research-first check |
| Branding completo | `quality-reviewer` con dominio=branding |
| Backend / código | `code-reviewer` (`.claude/agents/Code_Reviewer.md`) |

El revisor devuelve: ✅ APROBADO / 🟡 OBSERVACIONES / 🔴 BLOQUEADO. Si BLOQUEADO, **iterar y volver a pasar checklist**.

---

## Lo que NUNCA se entrega

1. **Output sin invocar skill** → estás haciendo "AI genérico" por definición.
2. **Frontend con `from-purple-500 to-pink-500`** sin paleta documentada.
3. **Copy con palabras prohibidas IA** (lista en checklist).
4. **Video sin research-first** (regla dura cinema).
5. **Branding solo logo** sin sistema completo.
6. **Backend con `any`** o sin validación de input.
7. **Cualquier cosa marcada "iteración 1" sin avisar a Pablo** que lo es.

---

## Lo que SIEMPRE se hace

1. **Cargar skill curada antes de generar** (Capa 1).
2. **Pasar checklist completa** del dominio (Capa 2).
3. **Invocar revisor crítico** antes de entregar (Capa 3).
4. **Si BLOQUEADO → iterar**. No entregar nunca con "es lo que hay".
5. **Marcar explícitamente** si es draft/iteración: "Esto es iteración 1, falta X".

---

## Ejemplo: cómo aplica a "haz una landing para Dark Room"

| Paso | Acción concreta |
|---|---|
| 1. Detect intent | Hook `quality-gate-hook.py` matchea "landing" → emite reminder. |
| 2. Skill Capa 1 | Invoco `pacame-web` (meta-skill web). Si solo necesito sección, `frontend-design`. |
| 3. Carga referencias | `imagen` para hero real (no SVG). `theme-factory` para tokens Dark Room. |
| 4. Genero | Sigo guía de la skill. NO escribo HTML directo. |
| 5. Checklist | Reviso paleta (Dark Room: black + caleta), tipo (Inter o display branded), mobile, Lighthouse expectation. |
| 6. Revisor | Invoco `visual-reviewer` con paths a los `.tsx`. |
| 7. Iterar si BLOQUEADO | Si me dice "gradient random en hero", lo arreglo y vuelvo a 5. |
| 8. Entregar | Solo cuando revisor da ✅ o 🟡 con observaciones aceptables. |

---

## Cómo se enforza este protocolo

- **Hook automático** `infra/scripts/quality-gate-hook.py` — detecta intent en cada `UserPromptSubmit` y emite system-reminder con la skill obligatoria del dominio.
- **CLAUDE.md** lista este protocolo como obligatorio en la tabla de "Protocolos OBLIGATORIOS".
- **`verify-claude-rules.py`** verifica que la sección quality-gate sigue en CLAUDE.md y avisa si se pierde tras un pull.
- **`visual-reviewer` y `quality-reviewer`** subagentes bloquean output sin carácter.

---

## Cuándo NO aplica el quality gate

- **Conversación informativa pura** ("explícame X", "qué hora es") — no produce output entregable.
- **Comandos de infraestructura** (git, deploy, env vars) — son ejecución, no creación de contenido.
- **Debugging interno** que no se entrega — se aplica gate al output final, no a los intermedios.

En cualquier creación que vaya a Pablo, cliente, RRSS, o producción: **gate obligatorio sin excepción**.
