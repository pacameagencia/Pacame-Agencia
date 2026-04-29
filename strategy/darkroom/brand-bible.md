# DarkRoom — Brand Bible Visual

> **Estado**: v1.0 — sistema visual operativo. De aquí salen TODOS los outputs públicos: posts, stories, reels, landing, ads, emails, mockups.
> **Owner**: NOVA (visual) + COPY (voz) + Pablo Calleja (aprobación).
> **Aplica voz**: `strategy/darkroom/positioning.md` v1.0.
> **Aplica copy**: `strategy/darkroom/landing-copy-v1.md` v1.0.
> **Regla dura**: si un output público de DarkRoom no se puede explicar contra esta bible, NO sale. Vuelve a brief.

---

## 1. Esencia visual en 1 frase

**Cuarto oscuro de revelado**: lo que crea el creator emerge de la sombra, en la luz justa, con la herramienta correcta. Premium pero accesible. Honesto sobre el modelo. Cómplice del que vive de crear.

Imagina: el negro absoluto del laboratorio, una luz roja de seguridad, el grano del papel fotográfico, un detalle dorado en una bandeja metálica. Ese es el universo.

**NO** es: tech-bro azul-violeta · gradients infinitos · emojis fuego · creator sonriendo en stock photo.

---

## 2. Paleta extendida

### Core (95% del uso)

| Token | Hex | Uso |
|---|---|---|
| `ink` | `#0A0A0A` | Fondo principal, body text dark mode |
| `paper` | `#F5F1EA` | Fondo claro alternativo (raro), texto sobre ink |
| `signal` | `#E11D48` | **Acento primario**. CTAs, errores, hooks, alertas. Crimson saturado. |
| `gold` | `#D4A656` | **Acento secundario**. Premium, scarcity, lifetime, milestone. Dorado mate. |
| `ash` | `#3F3F46` | Borders, dividers, captions |
| `smoke` | `#71717A` | Body text mute, metadata |

### Soporte (5% del uso, contextual)

| Token | Hex | Uso |
|---|---|---|
| `cyan-accent` | `#22D3EE` | Solo si gold no encaja (ej: tech / futurismo). Nunca con signal en mismo frame. |
| `red-deep` | `#7F1D1D` | Sombra del signal en gradients largos |
| `gold-deep` | `#92740F` | Sombra del gold |
| `paper-warm` | `#E7DEC8` | Tinte cálido sobre paper, raro |

### Reglas de combinación

- **Combinación canónica**: `ink` + `signal` + tipografía blanca/paper. 90% de los assets.
- **Combinación premium**: `ink` + `gold` + paper. 10% (Studio plan, Black Friday, lifetime).
- **NUNCA**: signal + gold en mismo frame (ruido, suena Christmas). Elige uno por pieza.
- **NUNCA**: azul tech bro `#3B82F6 → #8B5CF6` gradient. Suspende producción.
- **NUNCA**: blanco puro `#FFFFFF` como fondo principal. Usa `paper` (cálido).

---

## 3. Tipografía

### Stack canónico

| Rol | Familia | Pesos | Caso de uso |
|---|---|---|---|
| **Display** | **Geist** (sans-serif técnica) | 700, 800 | H1 hero, H2 secciones |
| **Headline** | Geist | 600 | H3 cards, hooks de carrusel |
| **Body** | **Geist** | 400, 500 | Body landing, copy carrusel |
| **Mono** | **Geist Mono** | 400, 500 | Datos técnicos, labels, código, micro-text |
| **Editorial alt** | **GT Sectra** o **Canela** (serif personalidad) | 400 | Solo hero copies eventuales si quieres editorial vs tech |

Geist es la fuente de Vercel — gratis, técnica, neutral, premium accesible. Casa con la estética. Si Pablo quiere alt-mood (editorial / zine), GT Sectra. Si no decide, default Geist.

### Jerarquía cuantitativa (px en 1080×1350 carrusel)

| Nivel | Tamaño | Tracking | Caso |
|---|---|---|---|
| H0 hero slide 1 | 96-128 | -2% | Cover |
| H1 título grande | 64-80 | -1% | Reframe / climax |
| H2 título | 44-56 | 0% | Cards, value slides |
| H3 subtítulo | 28-36 | 0% | Bullet, sub-hook |
| Body | 18-22 | 0% | Cuerpo |
| Caption / label | 11-13 (mono, uppercase) | +25% | Tags, sector, precio mini, contador |

### Reglas duras

- Frases ≤ 15 palabras en H0/H1. Si no entra, problema de copy, no de typography.
- Texto sobre fondo dark = paper / smoke / signal. Nunca ash sobre ink (ilegible).
- Mono uppercase con tracking +25% para etiquetas operativas (ej: `MEMBRESÍA · 14 DÍAS GRATIS`).

---

## 4. Iconografía

### Sistema

- **Trazo lineal 1.5-2px**, paper o signal sobre ink.
- Sin relleno (cero iconos sólidos coloreados).
- Cuadrado virtual de 24×24, padding interno consistente.
- Categorías por silueta clara, no marca específica (riesgo legal Adobe/Figma).

### Iconos canónicos por sección de stack

```
Imagen        →  círculo + cuadrado superpuestos
Vector        →  diamante con puntos en vértices
UI/UX         →  rectángulos anidados
Video         →  triángulo de play en marco
Motion        →  línea curva con dot móvil
3D            →  cubo isométrico hueco
IA texto      →  bocadillo con líneas
IA imagen     →  marco con destello
IA video      →  triángulo play + chispa
IA voz        →  onda en círculo
Stock         →  pila de rectángulos
Tipografía    →  letra A en marco
```

Recurso: usar `lucide-react` (ya en el stack) y filtrar a estos. No subir SVG custom salvo necesidad.

---

## 5. Layout system

### Grid base

- **12 columnas**, gutter 24px, container 1200px (web).
- Ratio áureo aplicado a hero (texto 62% / visual 38%).
- Padding mínimo card: 32px desktop, 24px mobile.

### Safe areas por canal (CRÍTICO)

| Canal | Tamaño | Top unsafe | Bottom unsafe | Side margin |
|---|---|---|---|---|
| Carrusel IG | 1080×1350 (4:5) | 100px | 260px | 60px |
| Story IG | 1080×1920 (9:16) | 250px | 250px | 60px |
| Reel IG | 1080×1920 (9:16) | 200px (handle/audio) | 350px (caption) | 60px |
| Post feed cuadrado | 1080×1080 (1:1) | 80px | 200px | 60px |
| Web hero | 1920×1080 (16:9) | 96px nav | 0 | 24px |

Si el contenido crítico cae en zona unsafe → reposicionar. UI de Instagram lo tapa.

---

## 6. Formats por canal

### 6.1 Carrusel IG (4:5 1080×1350) — el caballo de batalla

Estructura canónica de **10 slides** (santo grial visual):

| # | Slide | Función | Visual dominante |
|---|---|---|---|
| 1 | **Cover hook** | 80% del trabajo. Lectura <2s. | Texto enorme signal sobre ink + 1 elemento visual mínimo |
| 2 | Setup | Plantear problema (ej: 240€/mes en stack) | Dato gigante en mono uppercase |
| 3 | Reframe | Cambio de óptica | Comparativa visual lado-lado |
| 4 | Value 1 | Insight 1 (1 idea por slide) | Texto + icono lineal |
| 5 | Value 2 | Insight 2 | Texto + dato concreto |
| 6 | Update | Mini-recap, tease | Lista numerada |
| 7 | Climax | Insight más fuerte / payoff | Texto enorme + signal |
| 8 | Save prompt | "Guarda este post" | Mono caption + flecha |
| 9 | CTA | Acción concreta + dónde | Botón visual signal |
| 10 | (opcional) | Bonus / hashtags / créditos | Mono pequeño |

**Reglas técnicas**:
- 1 idea por slide. Si no entra, divide en 2.
- Añadir audio al carrusel cuando se publique → entra al algoritmo Reels (reach gratis).
- LinkedIn: export PDF. IG: export PNG.
- 7-10 slides → +23% engagement. Menos pierde retention, más pierde finalización.

### 6.2 Story IG (9:16 1080×1920) — el ritmo diario

3 templates rotativos:

**A. Quick value**: 1 dato + 1 fuente + 1 CTA pequeño.
- Ej: `240€/MES en stack creativo` (gigante) → `→ darkroomcreative.cloud` (mono).

**B. Behind the scenes**: foto Pablo + caption corta editorial.
- Plantilla con frame negro top + bottom mostrando proceso.

**C. Pitch directo**: oferta del momento (trial, lifetime, micronicho).
- 1 hook + 1 CTA + sticker `link` o swipe up.

Cadencia objetivo: **3-5 stories/día** según RRSS 70/20/10 (mayoría valor + behind, 1 pitch máx).

### 6.3 Reel IG (9:16 1080×1920) — viralidad

**Estructura PAS** (Problem-Agitation-Solution):

- **Frame 0** (hook 0-2s): visual + audio riser SFX. Texto signal enorme en mono uppercase.
- **2-15s**: agita el dolor (240€/mes, suscripciones absurdas, stack feo).
- **15-25s**: solución (DarkRoom Pro 29€/mes, 14 días gratis).
- **25-30s**: CTA + handle.

**Reglas**:
- Captions burned-in (Geist, paper, shadow ink, glow signal sutil, fade-in 0.2s).
- Vignette global cinematográfico.
- Audio: TTS Pablo (LoRA voz cuando esté) o ElevenLabs castellano grave + música Suno copyright-free.
- Loop seamless 10s en clips ≤10s (`carruseles-darkroom/loop-seamless.mjs`).
- **NUNCA generar Veo/Seedance sin doble sí + cost-guard token.**

### 6.4 Web hero (1920×1080)

Ya cubierto por landing-copy v1. Aplicar paleta `ink` fondo + `signal` CTA + foto de revelado abstracto (Nano Banana / Imagen FX).

### 6.5 Email

Plain text + 1 sola imagen header opcional. Cero HTML chillón.
- Subject: ≤45 chars, mono mental (frase corta cómplice).
- From: `Pablo @ DarkRoom`.
- Firma: `— Pablo · darkroomcreative.cloud`.

---

## 7. Sistema fotográfico

### 3 tipos de imagen permitidos

**Tipo A — Abstracto cuarto oscuro** (60% del visual mix)
- Render IA de revelado fotográfico, papel sumergido en bandeja, luz roja de cuarto oscuro, granos de plata.
- Generador: **Nano Banana Pro** o **Imagen FX** (gratis).
- Prompt base (copy-paste):
  ```
  cinematic vertical 9:16, extreme close-up macro of photo paper emerging from developer tray in a darkroom, deep red safelight illuminating the wet surface, silver grain detail, moody chiaroscuro, 35mm anamorphic, premium product reveal aesthetic, no text, no logos
  ```
- JSON Prompt avanzado:
  ```json
  {
    "subject": "photo paper in chemical bath",
    "environment": "darkroom under red safelight",
    "lighting": "single red key light from above, deep shadows",
    "camera": "macro 100mm f/2.8, extreme close-up",
    "style": "35mm anamorphic, premium editorial",
    "color_palette": ["#0A0A0A", "#E11D48", "#7F1D1D"],
    "details": "silver grain, water droplets, paper texture, no text, no faces"
  }
  ```

**Tipo B — Pablo persona** (30% del visual mix, cuando LoRA esté entrenada)
- Foto Pablo dirigiendo, escribiendo, con luz roja de cuarto oscuro.
- Datos de entrenamiento: `carruseles-darkroom/lora-training/dataset/pablo-photo-001..014.jpg` (14 fotos ya preparadas).
- Cuando LoRA esté entrenada, aplicar el prompt de Pablo (de `produce-teaser-pacame*.mjs`) con paleta DarkRoom (red + ink, NO violet/cyan PACAME).
- Uso: stories behind-the-scenes, reels narrados, hero ocasional.

**Tipo C — Producto / mockup** (10% del visual mix)
- Mockup de pantalla mostrando la app DarkRoom corriendo.
- Generador: **Mockup Batch** (uno de los 6 micronichos planeados).
- Mientras: Freepik AI o Nano Banana Pro con prompt:
  ```
  laptop screen mockup showing a minimalist dashboard interface in dark mode, deep black background with crimson accent buttons, on a wooden desk with red ambient light, professional product photo, no text on screen
  ```

### Prohibido en imagen

- ❌ Stock creator sonriendo a la cámara
- ❌ Gradient azul-violeta de techbro
- ❌ Logos de Adobe/Figma/Canva visibles
- ❌ Stickers genéricos / emojis fuego
- ❌ Layouts simétricos centrados sin tensión

---

## 8. Voz visual + textual (recap operativo)

### Tu voz al escribir

- Tutea siempre.
- Frases cortas. Verbos activos.
- Datos concretos: `240€/mes` no "muchos euros".
- Ningún superlativo vacío (revolucionario, increíble, sin igual).
- Ningún emoji fuego, cohete, dinero. Tampoco corazones.
- Cómplice del creator: "lo que pagas" no "lo que el cliente paga".

### Banco de frases listas

```
✅ "El stack premium pesa más que tu alquiler."
✅ "Crea sin pagar 240€ al mes."
✅ "Tu suscripción de Adobe vale menos que un café diario."
✅ "Los que crean a diario merecen herramientas a diario."
✅ "Membresía colectiva. Acceso individual. Sin trampas."
✅ "Hartos de pagar 3 mil al año por crear."
```

### Frases prohibidas en producción

```
❌ "Adobe gratis para siempre"
❌ "Pirata legal"
❌ "Hackea Adobe"
❌ "Software ilegal por menos"
❌ "Licencias compartidas"
❌ "Cracked / Patched / Unlocked"
```

---

## 9. Templates concretos (copy-paste para producir)

### 9.1 Carrusel "El stack que pesa"

```
Slide 1 (cover):
  H0:  "240€/MES."
  Caption mono:  ESTACK CREATIVO PREMIUM 2026
  Visual:  fondo ink + signal en H0 + grano sutil

Slide 2 (setup):
  H1:  "Adobe + Figma + ChatGPT + Midjourney + Canva."
  H3:  "Eso es tu stack mínimo si vives de crear."

Slide 3 (reframe):
  H1:  "El problema no es que sea caro."
  H2:  "Es que es retail por persona."

Slide 4 (value 1):
  H2:  "Una agencia con 10 personas paga 10 veces."
  H3:  "Tú, que estás solo, pagas igual."

Slide 5 (value 2):
  H2:  "240€ × 12 = 2.880€/año."
  H3:  "Dos vacaciones. Un Mac nuevo. Un mes sin facturar."

Slide 6 (update):
  H2:  "Hay otra forma."
  H3:  "Membresía colectiva. Stack completo."

Slide 7 (climax):
  H0:  "29€/MES."
  Caption mono:  DARKROOM PRO · STACK COMPLETO

Slide 8 (save):
  H2:  "Guarda este post."
  Caption mono:  PARA CUANDO LA CUENTA NO SALGA

Slide 9 (CTA):
  H1:  "14 días gratis."
  H3:  "Sin tarjeta."
  CTA mono:  → DARKROOMCREATIVE.CLOUD

Slide 10 (créditos):
  Mono small:  COMUNIDAD DE CREATORS · MEMBRESÍA COLECTIVA · MADE IN ESPAÑA
```

### 9.2 Story "Quick value"

```
Frame único 1080×1920:
  Fondo:  ink
  Top 30%:  vacío (safe area)
  Centro:  H0 signal "240€/MES" — peso 800
  Bajo H0:  H3 paper "EN STACK CREATIVO" — uppercase mono
  Bottom 30%:  CTA mono signal "→ DARKROOMCREATIVE.CLOUD"
  Sticker IG:  link (si plan de IG lo permite)
```

### 9.3 Reel "PAS de 30s"

```
0-2s    Hook visual (foto Pablo o paper en bandeja)
        Texto burned-in:  "Si vives de crear, esto es para ti."
        Audio:  riser SFX

2-12s   Agitación (Pablo o B-roll)
        Texto:  "240 al mes en suscripciones. 2.880 al año."
        VO:  "Adobe, Figma, ChatGPT, Midjourney. Cada uno un trozo."

12-22s  Solución (mockup screen DarkRoom)
        Texto:  "Membresía colectiva. Stack completo. 29€."
        VO:  "DarkRoom es el stack premium por menos de un café al día."

22-30s  CTA + handle (visual abstracto cuarto oscuro)
        Texto:  "14 días gratis. Sin tarjeta."
        Caption:  darkroomcreative.cloud
```

---

## 10. Banco de prompts IA copy-paste

### Para Nano Banana Pro / Imagen FX

**Hero abstract dark room**:
```
ultra-realistic vertical 9:16, extreme close-up of photographic paper floating in a stainless steel developer tray, single deep crimson safelight #E11D48 from above casting hard shadows, water surface tension droplets, silver halide grain emerging in image, mist rising from chemical bath, mood: clandestine craftsmanship, 35mm anamorphic Phantom camera, no text, no logos, no faces
```

**Hero pricing comparison** (mockup tabla):
```
clean editorial product photography, two stacks of papers side by side on matte black surface under #E11D48 red ambient light, left stack labeled with handwritten 240, right stack with handwritten 29, premium magazine spread aesthetic, no other text, no logos, top-down 90 degree shot
```

**Pablo persona (cuando LoRA esté)**:
```
phone front camera selfie, the same man from reference photo, in a darkroom under deep red safelight, holding a print drying clothespin, focused gaze, late evening, 35mm grain, no logos
```

### Para Whisk Labs (gratis bulk via `bulk-whisk.mjs`)

Crear `prompts-darkroom-week-1.txt` con 20 prompts del banco superior + variaciones. Lanzar:

```bash
node carruseles-darkroom/bulk-whisk.mjs --prompts=prompts-darkroom-week-1.txt --output=carruseles-darkroom/output/week-1
```

---

## 11. No-no's visuales (anti-patterns)

| ❌ Mal | ✅ Bien |
|---|---|
| Gradient azul-violeta `#3B82F6 → #8B5CF6` | Negro `#0A0A0A` con grano + signal `#E11D48` |
| Stock creator sonriendo con auriculares | Foto Pablo con LoRA o paper en bandeja revelado |
| Logos Adobe/Figma directos en hero | Iconos lineales por categoría (lucide) |
| Emojis fuego 🔥, cohete 🚀, dinero 💰 | Mono caption con dato concreto |
| Frase >15 palabras en H0 | Frase ≤15 palabras o reescribir |
| Paleta blanca limpia tipo SaaS B2B | Dark mode siempre como base |
| "Increíble", "el mejor", "revolucionario" | "240€ al mes", "29€", "14 días gratis" |
| Carrusel <7 slides o >10 slides | Exactamente 10 slides estructura canónica |
| Mismo carrusel sin música al subir IG | Añadir audio sí o sí (entra Reels algo) |
| Reel sin captions burned-in | Captions burned-in obligatorios (85% mira muted) |

---

## 12. Distribución 70/20/10 aplicada a DarkRoom

(Recap operativo de `strategy/rrss-humanizadas-70-20-10.md` aplicado a este proyecto.)

Cada **10 piezas DarkRoom** se reparten así:

### 70% VALOR (7 piezas)

- Tutoriales reales: cómo usar Photoshop para X.
- Datos del sector: cuánto gana un freelance creativo en España 2026.
- Hooks que funcionan en reels (recetas).
- Plantillas gratis (Figma library, presets Lightroom).
- Comparativas honestas: Photoshop vs Affinity, Figma vs Penpot.
- Casos de uso: timelapse de cómo se hace una pieza con stack DarkRoom.
- Mini-glosario: qué es un LoRA, qué es un seed, qué es un workflow.

### 20% BEHIND-THE-SCENES (2 piezas)

- Pablo monta el setup (foto cuarto oscuro real o mockup).
- Decisiones reales: por qué subió el plan Pro de 25 a 29.
- Fallos reales: cuando se cayó Adobe 3 días.
- Aprendizajes: qué descubrió scrapeando 100 freelances.

### 10% PITCH (1 pieza)

- "DarkRoom Pro a 29€/mes. 14 días gratis. Sin tarjeta."
- Caso real: "Marta canceló Adobe + Midjourney. Ahorra 196€/mes."
- Lifetime drop: "100 plazas a 499€ una vez. Quedan X."

**Regla**: jamás dos pitches consecutivos. El pitch entra después de 7 valor + 2 behind.

---

## 13. Checklist pre-publicar (antes de salir al mundo)

Antes de publicar cualquier asset DarkRoom, marcar todos:

- [ ] Aplica voz: tutear + ≤15 palabras + datos concretos
- [ ] Aplica paleta: ink + signal (o ink + gold premium). Cero azul tech.
- [ ] Aplica tipografía: Geist 700/600/400. Mono uppercase para captions.
- [ ] Format correcto del canal (4:5 carrusel, 9:16 story/reel, 16:9 web)
- [ ] Safe areas respetadas (texto crítico no en top/bottom unsafe)
- [ ] Captions burned-in si es reel (mirar muted)
- [ ] Música añadida si es carrusel IG (algoritmo Reels)
- [ ] Cero logos Adobe/Figma directos
- [ ] Cero "Adobe gratis" / "pirata" / "cracked"
- [ ] CTA coherente: "14 días gratis" / "darkroomcreative.cloud"
- [ ] Pieza encaja en 70/20/10 actual del calendario
- [ ] Pre-flight cost-guard si toca generación vídeo premium
- [ ] Pre-flight `/factoria/intake` no aplica (DarkRoom es proyecto propio, no cliente)

Si falla 1 → no sale.

---

## 14. Roadmap visual hacia 1.000 subscripciones

| Mes | Foco visual | Salida esperada |
|---|---|---|
| **0** (hoy) | Brand bible aplicada · LoRA Pablo entrenada · 10 carruseles + 20 stories + 5 reels iniciales | Bedrock visual disponible |
| **1** | Landing live con sistema visual + 30 piezas/semana RRSS | Tracción orgánica · primeros 50 trials |
| **2** | Bot DM persona Pablo activo · Stories pitch 10% activadas | Conversión trial → paid · primeros 100 paid |
| **3** | 6 micronichos con visual coherente DarkRoom | SEO traffic · funnel automatizado |
| **4-6** | Iteración basada en data · ads paid si CAC <30€ | 500-700 paid |
| **7-12** | Lifetime drops · Black Friday · expansión LATAM | 1.000+ paid |

---

## 15. Cómo invocar esta bible desde otra skill / sesión

Cualquier skill PACAME que produzca un asset DarkRoom debe leer este doc primero. La forma:

```
1. Lee strategy/darkroom/positioning.md (voz, ICP, pricing)
2. Lee strategy/darkroom/landing-copy-v1.md (copy aprobado)
3. Lee este doc (visual + format + templates)
4. Aplica la fórmula del santo grial visual: PacameCueva/04-Workflows/santo-grial-visual.md
5. Ejecuta el cost-guard si toca video premium
```

Esta bible es el contrato visual de DarkRoom. Si el contrato cambia, se versiona aquí (`v1.0 → v1.1`) y se documenta el motivo.

---

**Versión**: 1.0
**Fecha**: 2026-04-29
**Próxima revisión**: cuando MRR > 1.000€ o cuando feedback público real exija ajuste.
