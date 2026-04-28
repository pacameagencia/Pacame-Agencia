# DarkRoom — Flywheel de Micronichos

> **Estado**: v1.0 estratégico — diseño operativo del funnel de captación.
> **Fecha**: 2026-04-28.
> **Owner**: Pablo Calleja + NEXUS (growth) + PIXEL (build) + COPY (mensajes).
> **Pre-requisito**: `strategy/darkroom/positioning.md` (ICP + voz + pricing) leído y aprobado.

---

## Modelo mental — el flywheel completo

```
         [TRÁFICO ORGÁNICO + Pago bajo]
                    │
                    ▼
   ┌────────────────────────────────────────────┐
   │  6 MICRONICHOS — TOOLS GRATIS / FREEMIUM   │
   │  Cada uno resuelve UN dolor específico     │
   │  del ICP creator. Sin pedir tarjeta.       │
   └────────────────────────────────────────────┘
                    │
                    ▼  Captura email (NO obligatorio para usar)
                    │
   ┌────────────────────────────────────────────┐
   │  SECUENCIA EMAIL EDUCATIVA (5-7 emails)    │
   │  Valor real → confianza → relación         │
   └────────────────────────────────────────────┘
                    │
                    ▼  Email #6 (o trigger uso intensivo)
                    │
   ┌────────────────────────────────────────────┐
   │  PITCH SUTIL → 14 días free trial DarkRoom │
   │  "Si te ayudó esta tool gratis, imagina    │
   │   tener TODO el stack premium incluido"    │
   └────────────────────────────────────────────┘
                    │
                    ▼  Convierten ~2-4%
                    │
              ┌───────────┐
              │ DARKROOM  │ ◄── el WOW grande, recurrente
              │ membresía │
              └───────────┘
                    │
                    ▼  Comunidad activa
                    │
              ┌───────────┐
              │ Referrals │ → más miembros + boca a boca social
              └───────────┘
```

**Regla maestra del flywheel**: cada micronicho **debe ser útil POR SÍ MISMO** sin pedir nada. Si el usuario nunca convierte a DarkRoom, no nos importa: ya nos hace SEO, comparte, recomienda. **Cero dark patterns** (formulario obligatorio, popup spam, etc.).

---

## Por qué micronichos vs un solo "hub" de tools

- **SEO específico**: cada micronicho ranquea por una keyword precisa de cola larga ("generador paletas desde foto", "alternativas adobe baratas") en vez de competir por "creative tools" donde Canva, Figma, etc dominan.
- **Bajo coste por unidad**: 1 micronicho = 1 página Next.js + 1 endpoint + 1 lógica = ~8-15h de desarrollo.
- **Validación rápida**: ¿el micronicho de "paletas" funciona? Lo veo en 4 semanas (visitas + emails captados). Si no, lo dejo morir.
- **Aprende qué busca el ICP**: el winner-takes-all me dice qué problema duele más → DarkRoom puede destacar esa categoría en su pitch.

---

## Los 6 micronichos diseñados

### 1. **Paletas desde Foto** — `paletas.darkroomcreative.cloud`

**Problema que resuelve**: el diseñador encuentra una foto inspiradora pero no sabe qué hex codes tiene. Hoy usa Adobe Color o Coolors o web random con anuncios.

**Lo que hace**:
- Subes una imagen.
- Extrae 5-10 colores dominantes.
- Te da hex, RGB, HSL.
- Botón "exportar a Figma" (genera link Figma) o "descargar .ase" (Adobe Swatch Exchange).
- "Descargar paleta como CSS variables" o "Tailwind config".

**ICP que toca**: diseñador / branding / motion / web designer.

**Stack**:
- Next.js client-side (cero backend salvo email capture).
- Algoritmo: k-means clustering en client (`color-thief` library, o impl propia).
- Email capture: opcional, no bloqueante, mediante Resend API.

**Coste**:
- Build inicial: ~10h PIXEL (incluye UI minimalista oscura).
- Recurrente: 0€/mes (todo cliente, sin compute server).

**SEO target**: "extractor paleta colores foto", "color picker imagen", "paleta hex desde imagen".

**Conexión a DarkRoom**: footer "Para acceso completo a Adobe Color, Coolors Pro y todas las tools de diseño premium → DarkRoom 14 días gratis".

---

### 2. **Mockup Batch** — `mockup-batch.darkroomcreative.cloud`

**Problema que resuelve**: el creator necesita generar 10-50 mockups (taza, camiseta, poster, smartphone) de su diseño. A mano son horas. Tools online cobran por mockup.

**Lo que hace**:
- Subes 1 diseño (PNG/JPG).
- Eliges plantillas mockup (catálogo de 30+ gratis).
- Genera batch en 30 segundos.
- Descarga ZIP con los PNG generados.
- **Marca de agua DarkRoom mínima en esquina** del PNG free; eliminas la marca con email captura.

**ICP**: creator que vende en Etsy / Society6 / Redbubble, ilustrador.

**Stack**:
- Next.js + Sharp.js (server-side image composition).
- Plantillas mockup en R2/Supabase Storage.
- Email capture para "sin marca de agua".

**Coste**:
- Build inicial: ~25h PIXEL (incluye catalogación de plantillas).
- Recurrente: ~10-25€/mes en compute Vercel/R2 según uso.
- One-time: comprar/crear 30+ mockups templates ≈ 40-80€ (Creative Market o crearlos en DarkRoom).

**SEO target**: "generador mockup batch", "mockup masivo", "varias mockups a la vez".

**Conexión a DarkRoom**: "¿necesitas más plantillas mockup premium + Photoshop completo para personalizar? DarkRoom".

---

### 3. **Hooks Virales** — `hooks.darkroomcreative.cloud`

**Problema que resuelve**: el creator hace reels/TikToks pero no sabe cómo abrir el primer 1.5s para retención. Hooks malos = 0 alcance.

**Lo que hace**:
- Input: nicho (diseño, ilustración, motion, etc.) + tono (educativo, controversial, humor).
- Output: 20 hooks listos para reel.
- Cada hook tiene racional de por qué funciona.
- Bonus: copy de la descripción + hashtags relevantes.

**ICP**: creator de contenido visual + freelance que se promociona.

**Stack**:
- Next.js + Claude Haiku 4.5 / GPT-4o-mini (cheap tier).
- Sin DB persistente para outputs (privacidad + simplicidad).
- Email capture al solicitar segundo batch.

**Coste**:
- Build inicial: ~15h PIXEL.
- Recurrente: ~30-50€/mes (LLM inference, depende de volumen).

**SEO target**: "hooks para reels", "primer segundo tiktok", "copy viral instagram".

**Conexión a DarkRoom**: "Para escalar tus reels con stock premium + IA + edición pro → DarkRoom".

---

### 4. **Comparador de Alternativas Premium** — `alternativas.darkroomcreative.cloud`

**Problema que resuelve**: el creator busca "Adobe Photoshop alternativa" o "Figma vs Sketch vs Penpot" y se encuentra con artículos generalistas o blogs SEO sin alma.

**Lo que hace**:
- Páginas SEO programáticas (10-30 pares de comparativa) con tabla de criterios:
  - Precio
  - Curva de aprendizaje
  - Funcionalidades clave
  - Comunidad
  - Cuándo elegir cada una
- Cada página termina con: "Si ya pagas Adobe pero piensas que es excesivo, valora DarkRoom".

**Pares prioritarios**:
- "Adobe Photoshop vs GIMP vs Krita"
- "Figma vs Sketch vs Penpot"
- "Adobe Premiere vs DaVinci Resolve vs Final Cut"
- "Canva Pro vs Adobe Express vs Figma Slides"
- "Midjourney vs Stable Diffusion vs Flux"
- "ChatGPT Plus vs Claude Pro vs DeepSeek"
- ... etc.

**ICP**: creator que está investigando (parte alta del funnel).

**Stack**:
- Next.js + MDX (contenido programático).
- Cero backend salvo email capture al final del artículo.
- Schema markup `ComparisonReview`.

**Coste**:
- Build inicial: ~20h (10 pares iniciales con copy denso).
- Recurrente: 0€/mes.
- Trabajo de COPY/ATLAS: ongoing para añadir pares (1 par/semana).

**SEO target**: "alternativa adobe", "X vs Y" donde X e Y son herramientas premium del stack.

**Conexión a DarkRoom**: "¿Y si no tuvieras que elegir? DarkRoom incluye TODO el stack que estás comparando".

---

### 5. **Prompts Pulidos para Creators** — `prompts.darkroomcreative.cloud` (RECICLA PromptForge)

**Problema que resuelve**: el creator usa Midjourney/Flux/DALL-E pero sus prompts dan resultados mediocres. Refinar prompts manualmente es un arte que no domina.

**Lo que hace**:
- Input: idea o boceto + estilo deseado.
- Output: 10 prompts profesionales optimizados para:
  - Midjourney (con --ar, --style, --v parameters)
  - Stable Diffusion / Flux
  - DALL-E 3
  - Adobe Firefly
- Cada prompt explica qué cambia (lighting, composition, lens type).
- Bonus: negative prompts donde aplican.

**ICP**: creator que usa AI generativa para sus diseños.

**Stack**:
- Next.js + Claude Sonnet (premium tier — la calidad del output debe ser EXCELENTE).
- Cero DB persistente.
- Email capture al solicitar tercer batch (los 2 primeros gratis).

**Coste**:
- Build inicial: ~20h (PromptForge MVP existe como concepto, recompactar).
- Recurrente: ~40-80€/mes (Claude Sonnet no es barato pero la calidad justifica).

**SEO target**: "mejor prompt midjourney", "prompts cinemato gráfico", "generador prompts ai".

**Conexión a DarkRoom**: "Para usar Midjourney + Claude + ChatGPT + Flux ilimitado en un solo plan → DarkRoom".

**NOTA INTERNA**: este micronicho **recompacta el concepto PromptForge** (ver `strategy/capa-3-saas-decisions.md`). PromptForge muere como SaaS independiente, vive como tool gratis dentro del flywheel DarkRoom.

---

### 6. **Carruseles IA desde Texto** — `carrusel.darkroomcreative.cloud`

**Problema que resuelve**: el creator quiere convertir un hilo de Twitter, un artículo o una idea en un carrusel de Instagram (10 slides). A mano son horas. Tools premium tipo "InVideo" cobran 30€/mes.

**Lo que hace**:
- Input: pega texto largo o URL artículo.
- Output: carrusel de 10 slides con:
  - Hook fuerte slide 1
  - Estructura "1 idea por slide"
  - CTA en slide 10
  - Diseño minimalista oscuro o claro (toggle)
- Descarga PNG individuales o ZIP.
- Bonus: caption ya redactado para post Instagram.

**ICP**: creator de contenido educativo + freelancer construyendo audiencia.

**Stack**:
- Next.js + Claude Haiku para texto + Konva.js (canvas client-side) para render.
- Templates pre-diseñados con "feeling DarkRoom".
- Email capture para descargar versión sin marca de agua.

**Coste**:
- Build inicial: ~30h PIXEL (la parte de canvas templating es laboriosa).
- Recurrente: ~25-40€/mes (LLM + ocasional storage).

**SEO target**: "generador carrusel instagram", "convertir texto en carrusel", "carrusel ai gratis".

**Conexión a DarkRoom**: "Para crear carruseles con tipografías premium + assets de Adobe Stock + plantillas exclusivas → DarkRoom Pro".

---

## Resumen del flywheel

| # | Micronicho | URL | Build (h) | Recurrente €/mes | SEO target | Conversión esperada → DarkRoom |
|---|---|---|---|---|---|---|
| 1 | Paletas desde foto | `paletas.darkroomcreative.cloud` | 10 | 0 | extractor paleta | 1.5% |
| 2 | Mockup batch | `mockup-batch.darkroomcreative.cloud` | 25 | 10-25 | mockup masivo | 3% |
| 3 | Hooks virales | `hooks.darkroomcreative.cloud` | 15 | 30-50 | hooks reels | 2% |
| 4 | Comparador alternatives | `alternativas.darkroomcreative.cloud` | 20 | 0 | adobe alternativa | 5% (alta intención) |
| 5 | Prompts pulidos | `prompts.darkroomcreative.cloud` | 20 | 40-80 | mejor prompt midjourney | 4% (high-affinity) |
| 6 | Carruseles IA | `carrusel.darkroomcreative.cloud` | 30 | 25-40 | generador carrusel ia | 2.5% |

**Total build**: ~120 horas (1 sprint de 3 semanas con PIXEL + COPY).
**Total recurrente**: 105-195 €/mes.
**Conversión media estimada**: ~3% del tráfico capturado → DarkRoom.

### Estimación de funnel (mes 6, asumiendo SEO arrancado)

| Métrica | Estimación |
|---|---|
| Visitas mensuales totales (6 micronichos) | 8.000-15.000 |
| % que captura email | 30% (uso freemium) |
| Emails capturados/mes | 2.400-4.500 |
| % que entra a secuencia completa | 70% (3 emails opens mínimo) |
| % conversión a DarkRoom trial | 3% |
| Trials nuevos/mes | 50-95 |
| % trials que convierten a paid | 35% |
| Nuevos miembros pagados/mes | 18-33 |

A 29€/mes plan Pro promedio: **+520 a +960 € MRR/mes** generados solo por flywheel orgánico.

---

## Funnel email — secuencia post-captura (5 emails)

**Día 0 — confirmación + valor inmediato**
- Subject: "Aquí tienes tu paleta lista (+ 3 plantillas de regalo)"
- Body: confirma uso, da algo extra de valor relacionado.
- Cero pitch.

**Día 2 — autoridad + recurso**
- Subject: "Cómo elegir paleta sin que parezca foto de stock"
- Body: artículo educativo corto del nicho.
- Bottom: "creado por DarkRoom — comunidad de creators".

**Día 5 — caso real**
- Subject: "De 240€/mes a 29€/mes: cómo Lucia bajó su stack creativo"
- Body: testimonial real (cuando los haya) o storytelling con datos.
- CTA suave: "Ver cómo funciona DarkRoom".

**Día 8 — dolor compartido**
- Subject: "Yo también pagaba 200€/mes en Adobe"
- Body: Pablo en primera persona explica por qué construyó DarkRoom.
- CTA: "Probar 14 días gratis. Sin tarjeta."

**Día 12 — pitch directo + scarcity sutil**
- Subject: "Hoy puedes ahorrar 213€/mes (no exagero)"
- Body: comparativa retail vs DarkRoom. CTA grande.
- Bottom: "¿Dudas? Respondes a este email y te respondo personalmente".

**Día 18 — última invitación**
- Subject: "Última vez que te escribo sobre esto"
- Body: corto. Recordatorio del trial. "Si no es para ti, sin problema".
- CTA discreto.

A partir de día 18 → newsletter quincenal con valor. Cero spam.

---

## Stack técnico común

Todos los micronichos comparten:
- **Frontend**: Next.js 16 + Tailwind + Framer Motion + shadcn/ui (igual que el resto del repo PACAME).
- **Auth opcional**: Supabase Auth (`dark-room-prod` org).
- **Email capture/transactional**: Resend (`re_ZPx6dkfB_…` Dark Room).
- **DB**: Supabase para guardar emails + uso anonimizado (no contenido del usuario).
- **Analytics**: Plausible (privacidad-friendly, GDPR-compliant).
- **LLM (donde aplica)**: `web/lib/llm.ts` con `agentId: "nexus"` o `"copy"` (auto-inyecta brain context).
- **Hosting**: Vercel team `Dark Room IO`.
- **Dominios**: subdominios de `darkroomcreative.cloud` (zero coste DNS).

### Estructura de carpetas propuesta (en repo separado de DarkRoom, no en monorepo PACAME)

```
dark-room/                          (Vercel project + Git separado)
├── app/
│   ├── (main)/                     (landing principal + dashboard miembros)
│   ├── tools/
│   │   ├── paletas/
│   │   ├── mockup-batch/
│   │   ├── hooks/
│   │   ├── alternativas/
│   │   ├── prompts/
│   │   └── carrusel/
│   └── api/
│       ├── tools/                  (endpoints de cada micronicho)
│       ├── email/                  (capture + secuencia)
│       └── stripe/                 (membresías + webhook)
├── lib/
│   ├── tools/                      (lógica compartida entre tools)
│   ├── email-sequence.ts
│   └── ...
└── ...
```

**Subdominios opcionales**: si Pablo quiere que cada tool tenga su URL propia tipo `paletas.darkroomcreative.cloud`, hay que configurar wildcards DNS en Hostinger + middleware Next.js que routea por subdominio. Coste: 1h CORE.

**Alternativa más simple**: todos como rutas `/tools/<nombre>` del dominio principal. Pierdes algo de SEO super-específico pero ganas simplicidad.

**Recomendación DIOS**: empezar con rutas (`/tools/paletas`) para validar. Cuando alguno escale, migrar ese a subdominio dedicado.

---

## Plan de ejecución (3 sprints, 6 semanas)

### Sprint 1 — semanas 1-2 (validación rápida)

Construir los 2 micronichos de menor coste y mayor potencial SEO:

- **#1 Paletas desde Foto** (10h)
- **#4 Comparador alternatives** (20h, primeros 5 pares)

Ambos sin dependencia de LLM. Cero coste recurrente.

KPI Sprint 1:
- 2 tools live en `darkroomcreative.cloud/tools/paletas` y `/alternativas/<par>`
- 30+ emails captados en 14 días
- 1 conversión a DarkRoom trial documentada

### Sprint 2 — semanas 3-4 (escalar SEO)

- **#3 Hooks Virales** (15h)
- **#5 Prompts Pulidos** (20h) — recompactando concepto PromptForge
- Más pares de comparativa (10 nuevos en alternatives)

KPI Sprint 2:
- 4 tools live
- 200+ emails captados acumulados
- 5 conversiones a trial
- 1 conversión a paid

### Sprint 3 — semanas 5-6 (visual heavy)

- **#2 Mockup Batch** (25h)
- **#6 Carruseles IA** (30h)

KPI Sprint 3:
- 6 tools live
- 500+ emails acumulados
- 15 trials
- 5 paid

**Después del Sprint 3**: análisis de winner. Doblar inversión en el que mejor convierte. Matar el que no genere ni 50 emails/mes a las 8 semanas.

---

## Reglas duras del flywheel

1. **Cada tool debe ser ÚTIL POR SÍ MISMA**. Si tu mejor amiga la usa y nunca convierte, vale igual: hace SEO + boca a boca.
2. **CERO dark patterns**: nada de "popup oblige email para usar", "trial sin tarjeta pero te cobra al día 1", "redirige a otra página". El tono honesto del positioning se respeta también en el funnel.
3. **Privacy-first**: las imágenes que sube el usuario al mockup batch no se guardan más de 24h. Los textos de carrusel/hooks no se loguean. La privacy policy es real, no decorativa.
4. **Marca de agua mínima** (cuando aplique) que el usuario quita con email captura. No con upgrade pago. La conversión cara es DarkRoom, no la tool.
5. **CTA a DarkRoom siempre al pie**, no en popup intrusivo. Discreto y honesto.
6. **Cada tool tiene OG image propia** + meta tags optimizados para compartir. SEO + social sharing son los principales motores de tráfico.
7. **Nada de "compartir en redes para usar gratis"**. Ya hicimos algo de valor; pedir más rompe la confianza.

---

## Métricas estrella del flywheel

| KPI | Objetivo 6 meses | Cómo medir |
|---|---|---|
| **Visitas mensuales totales 6 tools** | ≥10.000 | Plausible |
| **Email capture rate** | ≥30% del tráfico | Plausible + Supabase |
| **Tiempo medio de uso por tool** | ≥45 segundos | Plausible engaged time |
| **% tráfico orgánico (vs pago)** | ≥80% | Plausible source |
| **Conversion rate email → trial DarkRoom** | ≥3% | Stripe + Resend |
| **Trial → Paid** | ≥35% | Stripe |
| **CAC pagado en growth (Ads)** | <30€ | Cuando se active Ads (post-hardening) |
| **Backlinks orgánicos a las tools** | ≥50 dominios distintos | Ahrefs / Semrush |

---

## Lo que NO entra en este flywheel (descartado)

- ❌ Generador de logos AI (existe Looka, Wix, Brandcrowd — competencia muy fuerte y conversión baja).
- ❌ Editor SVG online (Figma + Boxy SVG dominan; ROI bajo).
- ❌ Convertidor de formatos genéricos (CloudConvert + similares masacran SEO).
- ❌ Generadores de favicon/OG image (Realfavicongenerator + opengraph.io copan la query).
- ❌ Plantillas notion / planners (audiencia distinta a creators visuales).
- ❌ "AI font matcher" (la audiencia premium ya usa WhatTheFont + Identifont).

Si en futuro quieres añadir un 7º micronicho, valida primero:
- ¿Comparte ICP con DarkRoom? (creators visuales)
- ¿Tiene SEO viable bajo? (long-tail no copado)
- ¿Coste de build < 30h?
- ¿Construyes algo que no exista o solo decoración?

Si las 4 son sí → adelante. Si una falla → no.

---

**Versión del doc**: 1.0
**Próxima revisión**: tras Sprint 1 con datos reales de los primeros 2 micronichos.
