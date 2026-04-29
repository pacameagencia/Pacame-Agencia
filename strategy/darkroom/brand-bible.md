# DarkRoom — Brand Bible Visual

> **Estado**: v2.0 — corregida para alinear con pricing oficial (Pro 24,90€/mes + Lifetime 349€), paleta verde ácido, fonts Anton/Space Grotesk/JetBrains Mono.
> **Owner**: NOVA (visual) + COPY (voz) + Pablo Calleja (aprobación final).
> **Pricing canónico**: `strategy/darkroom/positioning.md` (24,90€/mes Pro · 349€ Lifetime · 12 herramientas IA stack).
> **Plan operativo**: `strategy/plan-contenido-30-dias.md` y `strategy/calendario-30-dias-v2.md`.
> **Regla dura**: si un output público de DarkRoom no se puede explicar contra esta bible, NO sale.

---

## 1. Esencia visual

**Cámara oscura · noir cinematográfico · neón verde rasante**.

Sala oscura de revelado fotográfico iluminada por una sola luz verde ácido neón. Negro profundo + verde de "stop bath" + grano sutil + vignette. Premium accessible, no chillona. Cómplice del creator que vive del oficio.

**NO** es: tech-bro azul-violeta · gradients infinitos · stock photos sonriendo · emojis fuego.

---

## 2. Paleta canónica

### Core (95% del uso)

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#0A0A0A` | Fondo principal · negro profundo |
| `acid` | `#CFFF00` | **Acento principal · CTA · números · hooks** · verde ácido neón |
| `acid-dim` | `#9FC700` | Variante apagada del acid (sombras, secundarios) |
| `red` | `#FF3B3B` | **Tachados de precios** (308€ retail tachado) · errores · alertas |
| `white` | `#F2F2F2` | Body text · titulares sobre `bg` · roto, no puro |
| `ghost` | `#8E8E8E` | Subtítulos · captions · metadata |
| `gray` | `#4A4A4A` | Borders · dividers · separadores |
| `line` | `#1E1E1E` | Líneas finas sobre `bg` · grids sutiles |

### Reglas de combinación

- **Combinación canónica**: `bg` + `acid` + `white`. 90% de los assets.
- **Tachados de precio**: usar `red` SOLO cuando taches el retail (308€). Línea diagonal `red` sobre número en `gray`.
- **Texto sobre acid**: si pintas algo en acid, el texto encima va en `bg` (negro). NUNCA `white` sobre `acid` — ilegible.
- **NUNCA**: gradient azul-violeta tech `#3B82F6 → #8B5CF6`. Suspende producción.
- **NUNCA**: blanco puro `#FFFFFF` como fondo. Usa `bg` (negro). Si tiene que ser claro, usa `white` `#F2F2F2`.

---

## 3. Tipografía

### Stack canónico (usado en composers existentes)

| Rol | Familia | Pesos | Caso de uso |
|---|---|---|---|
| **Display titulares** | **Anton Regular** (condensada ALL CAPS) | 400 | H0 hero · H1 grande · números 308€ / 24,90€ |
| **Headline / cuerpo** | **Space Grotesk Bold/Medium** | 700, 500 | H2 / H3 · sub-hooks · body |
| **Mono / precios** | **JetBrains Mono Regular/Bold** | 400, 700 | Precios pequeños · counters · "0,83€/día" · tags · datos tech |

Las fonts ya están descargadas en `carruseles-darkroom/fonts/` y los composers las usan via `opentype.js`.

### Jerarquía cuantitativa (px en carrusel 1080×1350)

| Nivel | Tamaño | Tracking | Caso |
|---|---|---|---|
| H0 hero slide 1 | 110-150 | -3% | Cover · "ESTO DEBERÍA SER ILEGAL" |
| H1 número impacto | 130-180 | -3% | "24,90€" · "308€" · "12 HERRAMIENTAS" |
| H2 título | 48-64 | -1% | Reframe · climax · CTAs |
| H3 subtítulo | 28-34 | 0% | Bullet · sub-hook |
| Body | 18-22 | 0% | Cuerpo · slide value |
| Caption mono | 11-14 (mono, UPPERCASE) | +25% | Tags · sector · "PRECIO RETAIL" · counter |

### Reglas duras

- Frases **≤ 15 palabras** en H0/H1. Si no entra, problema de copy.
- Anton **siempre ALL CAPS**, sin excepción.
- Mono **siempre uppercase** con tracking +25% para etiquetas.
- Texto sobre `bg` en `white` o `acid`. Nunca `gray` sobre `bg` (ilegible).

---

## 4. Stack incluido (los 12 + retail)

Estos son los 12 que comunicas. Stock visible en cada carrusel/landing/ad.

| # | Herramienta | Precio retail/mes | Pilar |
|---|---|---|---|
| 1 | ChatGPT Plus | 22 € | IA texto |
| 2 | Claude Pro | 22 € | IA texto |
| 3 | Gemini Advanced | 22 € | IA texto |
| 4 | Canva Pro | 12 € | Diseño |
| 5 | CapCut Pro | 10 € | Video |
| 6 | Freepik Premium+ | 15 € | Stock + AI |
| 7 | Higgsfield AI | 39 € | IA video |
| 8 | ElevenLabs Pro | 22 € | IA voz |
| 9 | Minea | 49 € | Dropshipping spy |
| 10 | Dropsip.io | 39 € | Dropshipping ops |
| 11 | PiPiAds | 39 € | Spy ads TikTok |
| 12 | Seedance | 17 € | IA video |
| **Total retail** | | **~308 €/mes** | |
| **DarkRoom Pro** | | **24,90 €/mes** | |
| **Ahorro mensual** | | **283 €/mes · 3.396 €/año** | |

---

## 5. Pricing canónico

| Plan | Precio | Comunicación |
|---|---|---|
| **Pro** ⭐ | **24,90 €/mes** | **80% de toda la comunicación** apunta aquí |
| **Lifetime** | **349 €** (one-time) | 10% scarcity drops · "amortiza en 35 días" · "lifetime es lifetime" |
| **Starter** (si existe) | (no comunicar) | Solo en checkout como downsell · NO en RRSS · NO en landing pública |

**Trial**: 14 días gratis sin tarjeta. CTA primario: `Empieza 14 días gratis`.

**Frase de math viral**: "0,83 €/día. 12 herramientas. ¿Sigues pagando 308€?"

---

## 6. Voz y tono

### Atributos

- **Directo · provocador · insider** — habla de tú a tú al creator.
- **Group buy legal, punto** — no maquilla el modelo. Lo afirma con seguridad.
- **Cero humo** — datos concretos. "24,90€", "308€", "0,83€/día", "3.396€/año ahorrado".
- **Tutea siempre.** Argot creator/dropshipper natural.
- **Realismo brutal** heredado de Pablo (PACAME).

### Frases icónicas (banco probado)

```
✅ "Esto debería ser ilegal."
✅ "12 herramientas. 0,83€/día."
✅ "Lifetime es lifetime."
✅ "El stack del creator 2026."
✅ "Mismo acceso. Una décima parte del precio."
✅ "El algoritmo no quiere que sepas esto."
✅ "Pagas más en café que yo en IA al mes."
✅ "Group buy de toda la vida."
✅ "Cancelé 12 suscripciones · te cuento por qué."
✅ "10.373 € ahorrados en 3 años."
```

### Frases prohibidas

```
❌ "Adobe gratis para siempre"
❌ "Pirata legal"
❌ "Hackea Adobe"
❌ "Software ilegal por menos"
❌ "Cracked / Patched / Unlocked"
❌ "Increíble · revolucionario · sin igual"
❌ "Querido cliente"
```

---

## 7. Formats por canal

### 7.1 Carrusel IG (4:5 1080×1350) — caballo de batalla

**Estructura canónica de 10 slides**:

| # | Slide | Función | Visual dominante |
|---|---|---|---|
| 1 | **Cover hook** | 80% del trabajo. Lectura <2s. | H0 acid sobre bg + 1 elemento mínimo |
| 2 | Setup | Plantear dolor (308€/mes en stack) | Número gigante Anton + "PRECIO RETAIL" mono |
| 3 | Reframe | Cambio de óptica | Comparativa lado-lado |
| 4 | Value 1 | Insight 1 | Texto + icono lineal acid |
| 5 | Value 2 | Insight 2 | Dato concreto |
| 6 | Update | Mini-recap | Lista numerada |
| 7 | Climax | Insight más fuerte | H0 acid "24,90€" |
| 8 | Save prompt | "Guarda este post" | Mono caption + flecha |
| 9 | CTA | Acción concreta | "14 días gratis · darkroomcreative.cloud" |
| 10 | Bonus / créditos | Hashtags + counter | Mono pequeño |

**Reglas técnicas**:
- 1 idea por slide.
- Añadir audio al carrusel IG → entra al algoritmo Reels = reach gratis.
- 7-10 slides = +23% engagement.
- Brand mark + counter (`1/10`) en esquina inferior cada slide.
- LinkedIn: export PDF. IG: export PNG.

### 7.2 Story IG (9:16 1080×1920) — ritmo diario

3 templates rotativos:

**A. Quick value**: dato gigante Anton + sticker `link` o swipe up.
- Ej: `"308€/MES"` (Anton huge) → `"EN STACK CREATIVO"` (Space Grotesk) → `"→ DARKROOMCREATIVE.CLOUD"` (mono).

**B. Behind the scenes**: foto Pablo / pantalla / proceso + caption editorial corta.

**C. Pitch directo**: oferta del momento + CTA.

Cadencia: **3-5 stories/día** según RRSS 70/20/10.

### 7.3 Reel IG/TikTok (9:16 1080×1920) — viralidad

**Estructura PAS** (Problem-Agitation-Solution) 30s:

- **0-2s** hook visual + audio riser SFX. Texto burned-in `acid` ALL CAPS Anton.
- **2-15s** agitación: dolor (308€/mes, stack feo, suscripciones absurdas).
- **15-25s** solución: DarkRoom Pro 24,90€/mes · 14 días gratis.
- **25-30s** CTA + handle `darkroomcreative.cloud`.

**Reglas**:
- Captions burned-in: Space Grotesk Bold + shadow + glow `acid` sutil + fade-in 0.2s.
- Vignette global cinematográfico.
- Audio: TTS Pablo (LoRA cuando esté) o ElevenLabs castellano grave + Suno copyright-free.
- Loop seamless 10s en clips ≤10s (`carruseles-darkroom/loop-seamless.mjs`).
- **NUNCA generar Veo/Seedance sin doble sí + cost-guard token**.

### 7.4 WhatsApp meme (1080×1080 cuadrado)

Templates de chat fake imitando conversaciones reales. Usar:
- Bg: `bg` o `#1F1F1F` para chat dark mode realista.
- Bocadillos: bg WhatsApp gris izquierda + acid claro derecha.
- Texto: Space Grotesk 32-40px.
- "Visto a las XX:XX" en mono ghost.

### 7.5 Sticker / pieza única (1080×1080)

Composiciones tipo señal de tráfico, mancha amarilla, "ESTO DEBERÍA SER ILEGAL".
- Usar acid como pintura saturada con drips o cinta de policía.
- Anton ALL CAPS huge.
- bg + acid + white. Nada más.

### 7.6 Comparativa rellenable (1080×1350)

Tabla 2 columnas: "ANTES (retail)" vs "AHORA (DarkRoom)".
- Columna izquierda gray + tachados rojos.
- Columna derecha acid + números limpios.
- Total inferior: "AHORRAS 283€/MES".

---

## 8. Sistema fotográfico

### 3 tipos de imagen permitidos

**Tipo A — Cuarto oscuro neón verde** (60% mix)
- Render IA de revelado fotográfico bajo luz verde ácido (no roja).
- Generador: **Nano Banana Pro** o **Imagen FX** (gratis).
- JSON Prompt:
  ```json
  {
    "subject": "photo paper in chemical bath",
    "environment": "darkroom under acid green safelight #CFFF00",
    "lighting": "single neon green key light from above, deep shadows, electric atmosphere",
    "camera": "macro 100mm f/2.8, extreme close-up",
    "style": "35mm anamorphic, premium editorial noir",
    "color_palette": ["#0A0A0A", "#CFFF00", "#9FC700"],
    "details": "silver grain, water droplets, paper texture, no text, no faces"
  }
  ```

**Tipo B — Pablo persona** (30% mix, cuando LoRA esté)
- Pablo bajo luz verde ácido neón.
- Datos en `carruseles-darkroom/lora-training/dataset/pablo-photo-001..014.jpg`.

**Tipo C — Producto / mockup** (10% mix)
- Mockup app DarkRoom dashboard en dark mode con acentos acid.

### Prohibido

- ❌ Stock creator sonriendo
- ❌ Gradient azul-violeta techbro
- ❌ Logos Adobe/Figma/Canva visibles (riesgo legal)
- ❌ Stickers genéricos / emojis fuego
- ❌ Layouts simétricos centrados sin tensión

---

## 9. Banco de prompts IA copy-paste

Para Whisk Labs / Imagen FX / Nano Banana Pro. Más en `carruseles-darkroom/prompts-darkroom-week-1.txt`.

**Hero abstract cuarto oscuro verde**:
```
ultra-realistic vertical 9:16, extreme close-up of photographic paper floating in a stainless steel developer tray, single deep acid green safelight #CFFF00 from above casting hard shadows, water surface tension droplets, silver halide grain emerging in image, mist rising from chemical bath, mood clandestine craftsmanship, 35mm anamorphic, no text, no logos, no faces
```

**Comparativa stacks visual**:
```
clean editorial product photography, two stacks of papers side by side on matte black surface under acid neon green ambient light, left stack labeled handwritten 308, right stack with handwritten 24,90, premium magazine spread aesthetic, no other text, no logos, top-down 90 degree shot
```

**Pablo persona (LoRA)**:
```
phone front camera selfie, the same man from reference photo, in a darkroom under deep acid green neon safelight, holding a print drying clothespin, focused gaze, late evening, 35mm grain, no logos
```

---

## 10. Anti-patterns visuales

| ❌ Mal | ✅ Bien |
|---|---|
| Gradient azul-violeta `#3B82F6 → #8B5CF6` | `#0A0A0A` con grano + acid `#CFFF00` |
| Stock creator sonriendo con auriculares | Foto Pablo LoRA o cuarto oscuro abstracto |
| Logos Adobe/Figma directos | Iconos lineales por categoría |
| Emojis fuego, cohete, dinero | Mono caption con dato concreto |
| Frase >15 palabras en H0 | Reescribir hasta que entre |
| Paleta blanca limpia tipo SaaS B2B | Dark mode siempre como base |
| "Increíble", "el mejor", "revolucionario" | "24,90€", "308€ retail", "14 días gratis" |
| Carrusel <7 slides o >10 slides | Exactamente 10 slides estructura canónica |
| Carrusel sin música al subir IG | Añadir audio sí o sí (entra Reels algo) |
| Reel sin captions burned-in | Captions burned-in (85% mira muted) |
| `signal` rojo + `gold` dorado en mismo frame | Solo verde acid + bg + white. Rojo `red` solo en tachados de precio |

---

## 11. Distribución 70/20/10 (RRSS Dark Room)

Cada **10 piezas** se reparten así:

### 70% VALOR (7 piezas)

- Tutoriales rápidos: cómo uso ChatGPT/Canva/CapCut desde DarkRoom (screen-record).
- Datos sector: cuánto gana un freelance creativo en España 2026.
- Comparativas honestas: DarkRoom vs Toolzbuy vs SeoGB.
- Stack reveals: "El stack del dropshipper 2026", "El stack del creator IG".
- Hooks que funcionan: 10 hooks IA que probé y funcionaron.
- Mini-glosario: qué es group buy, qué es LoRA, qué es membresía colectiva.

### 20% BEHIND-THE-SCENES (2 piezas)

- Pablo cuenta cómo montó DarkRoom · timeline.
- Decisiones reales: por qué subió/bajó precio.
- Fallos reales: cuando una herramienta cayó 3 días.
- Aprendizajes: qué descubrió tras 100 conversaciones con creators.

### 10% PITCH (1 pieza)

- "DarkRoom Pro · 24,90€/mes · 14 días gratis. Sin tarjeta."
- Caso real: "Marta canceló 5 suscripciones. Ahorra 196€/mes."
- Lifetime drop: "100 plazas a 349€. Quedan X."

**Regla**: jamás dos pitches consecutivos. Pitch entra después de 7 valor + 2 behind.

---

## 12. Checklist pre-publicar

Antes de publicar cualquier asset DarkRoom:

- [ ] Aplica voz: tutear + ≤15 palabras + datos concretos
- [ ] Aplica paleta: `bg` + `acid` (o `bg` + `acid` + `red` para tachados). Cero azul tech.
- [ ] Aplica tipografía: Anton (titular) + Space Grotesk (cuerpo) + JetBrains Mono (precios/captions)
- [ ] Format correcto del canal (4:5 carrusel, 9:16 story/reel, 1:1 meme/sticker, 16:9 web)
- [ ] Safe areas respetadas (texto crítico no en zonas IG UI)
- [ ] Captions burned-in si es reel
- [ ] Música añadida si es carrusel IG
- [ ] Cero logos Adobe/Figma directos
- [ ] Cero "Adobe gratis" / "pirata" / "cracked"
- [ ] CTA coherente: "14 días gratis" + `darkroomcreative.cloud`
- [ ] Pieza encaja en 70/20/10 actual del calendario
- [ ] Pre-flight cost-guard si toca generación vídeo premium

Si falla 1 → no sale.

---

## 13. Cómo invocar esta bible

Cualquier skill PACAME que produzca un asset DarkRoom debe leer este doc primero. Orden:

```
1. Lee strategy/plan-contenido-30-dias.md (banco 75 ideas + brand bible expandida)
2. Lee strategy/calendario-30-dias-v2.md (calendario operativo cuenta @pacamespain)
3. Lee este doc (sistema visual operativo)
4. Aplica fórmulas santo grial: PacameCueva/04-Workflows/santo-grial-visual.md
5. Ejecuta cost-guard si toca video premium
```

---

**Versión**: 2.0
**Fecha**: 2026-04-29
**Próxima revisión**: cuando MRR > 1.000€ o cuando feedback público real exija ajuste.
