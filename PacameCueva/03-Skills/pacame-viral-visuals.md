---
type: skill
title: pacame-viral-visuals
tags:
  - type/skill
created: '2026-04-25T21:44:21.883Z'
source_path: >-
  C:/Users/Pacame24/Downloads/PACAME
  AGENCIA/.claude/skills/pacame-viral-visuals/SKILL.md
neural_id: b4353d2f-f879-4049-bcc6-5418caf87369
---

# PACAME-VIRAL-VISUALS — Fotos, Carruseles y Vídeos con nivel Instagram 2026

Output genérico se acabó. Con las APIs que PACAME tiene wiradas (Apify, Freepik Suite, Instagram Business API, Gemini, Nebius, OpenAI), el pipeline es real y verificable.

---

## APIs disponibles (verificadas en `.env.local`)

| Servicio | Env var | Wrapper | Para qué |
|----------|---------|---------|----------|
| **Apify** | `APIFY_API_KEY` | directo vía fetch | Scrape hashtags / reels / cuentas IG |
| **Instagram Business** | `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_ACCOUNT_ID` | `web/lib/instagram.ts` | Publicar, leer insights propios, DM |
| **Freepik Suite** | `FREEPIK_API_KEY` | `web/lib/freepik.ts` | Generar (Mystic 4K), upscale 16x, bg removal, image-to-video, stock search, icons |
| **Gemini** | `GEMINI_API_KEY` | Google AI SDK | Análisis visual de referencias (pattern extraction) |
| **Nebius AI** | `NEBIUS_API_KEY` | OpenAI SDK compatible | 28 modelos open (Qwen 3.5 VL, Llama 3.3, DeepSeek V3.2) — visión + texto barato |
| **OpenAI** | `OPENAI_API_KEY` | openai SDK | DALL-E 3, Whisper, GPT-4o visión |
| **Gemma 4 (VPS)** | `GEMMA_API_URL` + `GEMMA_API_TOKEN` | fetch | Análisis ultra-rápido local, 14 tok/s, 128K contexto |

---

## Pipeline de 3 pasos (nunca saltarse ninguno)

### PASO 1 — Research con Apify

Actor: `apify/instagram-hashtag-scraper` (top posts por hashtag) o `apify/instagram-reel-scraper` (reels).

```typescript
// web/lib/viral-research.ts (crear si no existe)
export async function scrapeHashtags(hashtags: string[], limit = 30) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hashtags,
        resultsLimit: limit,
        resultsType: "posts",
        searchType: "hashtag",
      }),
    }
  );
  return res.json();
}
```

Cada post devuelve: `url, caption, likesCount, commentsCount, displayUrl, videoUrl, ownerFullName, ownerUsername, timestamp, alt, hashtags`.

**Hashtags default por nicho ES** (sobreescribir si cliente tiene los suyos):
- Agencias/marketing: `marketingdigital`, `branding`, `emprendedores`, `pymes`, `agenciadigital`
- Moda/lifestyle: `ootd`, `streetstyle`, `moda`, `outfit`, `tendencias`
- Food: `foodporn`, `recetasfaciles`, `foodphotography`, `gastronomiaespañola`
- Fitness: `fitness`, `rutinadeentrenamiento`, `transformacion`, `crossfit`
- Tech/SaaS: `productivity`, `saas`, `tech`, `indiehackers`, `startup`

Filtro de calidad: descartar posts con `likesCount < (promedio * 1.5)` del dataset. Nos quedamos solo con los outliers, no con la media.

**Guardar en Supabase:**

```sql
create table if not exists viral_references (
  id uuid primary key default gen_random_uuid(),
  platform text default 'instagram',
  niche text not null,
  hashtag text,
  post_url text unique,
  caption text,
  likes int,
  comments int,
  image_url text,
  video_url text,
  owner_username text,
  captured_at timestamptz default now(),
  analyzed boolean default false
);
create index on viral_references (niche, captured_at desc);
```

---

### PASO 2 — Pattern extraction con Gemini Vision

Gemini 2.5 Pro multimodal acepta URLs de imagen directamente. Un solo prompt por referencia extrae las 12 dimensiones:

```typescript
// web/lib/viral-analyze.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function extractPattern(imageUrl: string) {
  const model = gemini.getGenerativeModel({ model: "gemini-2.5-pro" });
  const res = await model.generateContent([
    {
      text: `Analiza esta imagen de Instagram viral. Devuelve JSON con:
{
  "ratio": "1:1|4:5|9:16|16:9",
  "palette": ["#hex1","#hex2","#hex3","#hex4","#hex5"],
  "typography": { "primary": "serif|sans|display|handwritten + style", "weight": "light|regular|bold|black", "tracking": "tight|normal|wide" },
  "composition": "centered|asymmetric|diagonal|grid|bleed",
  "grading": "warm|cool|neutral|duotone + contrast level 1-10",
  "lighting": "natural-soft|harsh|studio-flash|golden-hour",
  "text_in_image": { "amount": "none|short|heavy", "position": "top|center|overlay|bottom", "hierarchy": "single|dual|triple" },
  "hook_type": "question|number|contrarian|before-after|face|product",
  "cta": "exact text if present or null",
  "style_reference": "describe in 10 words max"
}`,
    },
    { inlineData: { mimeType: "image/jpeg", data: await fetchBase64(imageUrl) } },
  ]);
  return JSON.parse(res.response.text());
}
```

**Agregar un `viral_brief.json` del nicho** (consolidando 20-30 referencias):
- `palette_winner`: colores que aparecen en >40% de refs
- `typography_winner`: estilo tipográfico dominante
- `ratio_winner`: ratio más frecuente
- `hook_pattern`: tipo de hook más común
- `carousel_avg_slides`: promedio si hay carruseles
- `reel_avg_duration`: promedio si hay reels

Persistir en Supabase `viral_briefs (niche, date, brief_json, reference_ids[])`.

---

### PASO 3 — Generación con Freepik Mystic

`web/lib/freepik.ts` ya tiene `generateImage()`. Construir prompt fusionando brand del cliente + viral_brief:

```typescript
// web/lib/viral-generate.ts
import { generateImage } from "./freepik";

export async function generateViralPost({
  brief,        // viral_brief.json
  brand,        // { palette, fonts, voice }
  message,      // "Anunciar nuevo producto X"
  format,       // "feed-4:5" | "reel-9:16" | "story-9:16"
}) {
  const ratio = format.split("-")[1]; // "4:5"
  const prompt = `
Editorial Instagram 2026 post, ${brief.composition} composition, shot in ${brief.lighting} lighting,
${brief.grading} color grading. Palette: ${brief.palette_winner.join(", ")}.
Typography overlay: ${brief.typography_winner.primary} font ${brief.typography_winner.weight},
reading "${message}" positioned ${brief.text_in_image.position}. No stock photo feel.
Style reference: ${brief.style_reference}. High contrast, subtle grain, human and real.
Respect brand colors when possible: ${brand.palette.join(", ")}.
`;

  const result = await generateImage({
    prompt,
    model: "realism", // o "fluid", "zen" según brief.style_reference
    aspectRatio: ratio,
    resolution: "2k",
  });
  return result; // { image_url, task_id }
}
```

**Carruseles** → loop sobre N slides con misma paleta/tipo, cambiando contenido slide a slide.

**Reels/vídeos** → `freepik_image_to_video` (Kling v2.6 Pro) toma la imagen generada y la anima 5-10s con movimiento sutil que respeta el hook.

```typescript
import { imageToVideo } from "./freepik";

const reel = await imageToVideo({
  imageUrl: post.image_url,
  prompt: "subtle zoom-in, natural motion, cinematic, 3 seconds",
  duration: 5,
  model: "kling-v2-6-pro",
});
```

**Thumbnails / variantes A/B** → `styleTransfer()` o `relightImage()` aplicados sobre foto base del producto.

**Upscale final antes de publicar** → `freepik.upscale(image_url, { factor: 4 })` → Magnific 16x, output listo para feed.

---

## Endpoints sugeridos en `web/app/api/viral/`

Crear estas 3 rutas en Next.js para que todo el pipeline sea invocable desde Telegram bot / dashboard / agentes:

```
POST /api/viral/research     { niche, hashtags? }  → scrape + save refs
POST /api/viral/analyze      { niche }             → extract pattern of all un-analyzed refs, build brief
POST /api/viral/generate     { niche, message, format, brand? } → returns image/video URL
```

Cada endpoint dispara sinapsis en la red neuronal PACAME:
- `fire_synapse('viral_research_complete', { niche, count })`
- `fire_synapse('viral_pattern_extracted', { niche, brief_id })`
- `fire_synapse('viral_content_generated', { ref_id, brief_id, content_id })`

---

## Feedback loop de aprendizaje

Tras publicar vía Instagram Business API (`publishPost()` en `lib/instagram.ts`), programar cron a las 24h y 72h:

```typescript
// infra/crons/viral-feedback.ts
const insights = await getInsights(post_id); // lib/instagram.ts
if (insights.engagement_rate > client_avg * 1.2) {
  await fireSynapse("pattern_validated", { brief_id, weight: +0.3 });
} else if (insights.engagement_rate < client_avg * 0.8) {
  await fireSynapse("pattern_rejected", { brief_id, weight: -0.2 });
}
```

Con el tiempo, `viral_briefs` se filtran por `avg_validation_score` descendente → la red aprende qué funciona en cada nicho.

---

## Reglas no negociables

1. **Research SIEMPRE antes de generar.** Sin refs actuales, la skill se niega.
2. **Mínimo 15 referencias** analizadas por nicho antes de construir brief.
3. **Refresh cada 14 días** — lo viral muta rápido.
4. **Copiar gramática, no contenido.** Paleta/tipo/composición sí; texto y producto del cliente.
5. **Respetar marca.** Si la viral usa naranja pero el brand es azul, adapta; no traiciones al cliente.
6. **4:5 para feed, 9:16 para reels/stories.** 1:1 solo si cliente lo exige.
7. **Texto ≤ 20% del área** en imagen (legibilidad).
8. **Hook en frame 0 / slide 1.** Scroll rate IG = 0,8s.
9. **Subs burned-in siempre en reels.** 85% ve muted.
10. **Upscale + bg cleanup antes de publicar.** Nunca output de 1024px al feed.

---

## Anti-patrones vs reemplazo 2026

| ❌ Evitar | ✅ Reemplazo |
|-----------|-------------|
| Stock models con laptop sonriendo | Foto editorial Mystic `realism` + prompt "natural candid" |
| Gradients pastel 2019 | Paleta cruda: negro + 1 acento saturado del brief |
| Poppins redondo genérico | Serif con personalidad (GT Sectra, Canela) o grotesque (Neue Haas) |
| Iconos flat | Foto real hiperrealista generada o tipografía dominante |
| Layout centrado simétrico | Asimetría, bleed, texto cortando imagen |
| CTA botón azul redondeado | Texto subrayado crudo o pill con mucho contraste |
| Copy corporate genérico | Hook directo, primera persona, pregunta cruda |
| Fondo blanco limpio | Fondos con textura: papel, grain, color saturado plano |

---

## Comando de arranque

Cuando el usuario pida fotos/reels/carruseles:

1. Confirmar **nicho** + **cliente** + **objetivo** del post (en 1 pregunta, no más)
2. `POST /api/viral/research` con el nicho → espera a que termine
3. `POST /api/viral/analyze` → muestra el `viral_brief.json` al usuario como moodboard
4. Confirma que el ADN es correcto (opcional, skip si hay autoridad)
5. `POST /api/viral/generate` con brand + mensaje + formato
6. Aplicar `upscale` + `remove_background` si aplica → output final
7. Guardar en `content_generated` + fire synapse
8. Si es reel, `imageToVideo` encima
9. Presentar 2-3 variantes (A/B/C) al usuario
10. Test final: **"¿Esto podría estar en el Explore AHORA?"** Si no, iterar.

No se declara terminado hasta que la pieza pasa ese test.

---

## Update 2026-04-28 — Santo Grial Visual (NotebookLM)

**Doc maestro de referencia**: [[santo-grial-visual]] (en `04-Workflows/`). Lee ese doc antes de añadir/cambiar modelos en esta skill.

### Modelos canónicos por capa (ampliación)

**Imagen (orden de preferencia 2026)**:
1. **Nano Banana Pro** (Gemini) — producto, arquitectura, edición quirúrgica, character refs 360°. Mantiene texto en etiquetas, swap ropa/fondo/luz sin alterar sujeto.
2. **ChatGPT Image 2.0 (DALL-E)** — carruseles, mockups, brand assets, logos. Mejor legibilidad de texto del mercado.
3. **Imagen FX** (Google, gratis) — fallback económico. Sin límite estricto, múltiples variaciones a la vez. Vía Whisk Labs (~100 attempts/día).
4. **Flux 2 Pro / Flux Context / Flux Snell** — B-roll consistente, isolating clothing en capas transparentes.
5. **Freepik Spaces** ya integrado vía `web/lib/freepik.ts` — para bulk lookbooks producto.
6. **Z-Image Turbo** — gen ultra-rápida local 4-8 pasos en hardware modesto.
7. **Qwen Image / Qwen Image Edit** — edición quirúrgica local + pose extraction.

**Vídeo (NUEVO en stack PACAME, ahora referenciado)**:
- **Veo 3.1 Fast / Quality** (Google Flow) — JSON prompts; ads $100k tier; audio nativo.
- **SeaDance 2.0 / 2.5 Turbo Pro** — UGC ads, fashion, lip-sync premium, 1080p nativo.
- **Kling 2.6 / 3.0** — start frame → end frame interpolation (clave para before/after).
- **V-Fabric 1.0** (Viu) — talking videos hasta 1 min, 60× barato y 7× rápido vs alternativas.
- LTX-2.3 ya soportado vía skill `ltx2`.

### Modo de prompting preferido: JSON Prompting

A partir de hoy, los prompts a modelos imagen/vídeo se construyen en **JSON estructurado**, no en prosa. Permite swaps quirúrgicos sin re-romper el resto.

```json
{
  "subject": "...",
  "action": "...",
  "environment": "...",
  "lighting": "...",
  "camera": "...",
  "style": "cinematic 35mm",
  "color_palette": ["#hex1", "#hex2"]
}
```

Mantener prosa SOLO cuando el modelo no tolere JSON o el output sea moodboard exploratorio.

### Fórmulas estructuradas (alternativa cuando no hay JSON)

- **Imagen 6 componentes**: `Subject + Action + Environment + Art Style + Lighting + Details`
- **Imagen 8 componentes universal**: `Purpose + Subject + Style + Composition + Lighting + Text + Aspect Ratio + Constraints("no")`
- **Vídeo cinematic 5 capas**: `Subject + Environment + Action + Camera Shot/Movement + Visual Style`
- **UGC selfie**: prefijo `phone front camera selfie ...` obligatorio.
- **Multi-shot grid (consistency)**: `create a 3x3 grid of different angles of this product`. Después usar el grid como ref para componer escenas.

### Anti-patterns adicionales (NO HACER, según el santo grial)

11. **Wall of text vague prompt** ("Man walking on a street") → resultado stock genérico. Usa fórmula o JSON.
12. **AI Loop** — pedir "make it longer / more natural / shorter" sin métricas → loop infinito. Usa números absolutos o ejemplos.
13. **Manual video prompts** — no escribas a mano prompts para Veo/Kling/Runway. Pasa la doc oficial del modelo a Claude/ChatGPT y deja que él formatee.
14. **Diálogo entre comillas dentro de prompt visual** → el modelo "graba" el texto en pantalla. Pásalo por TTS.
15. **Estilos contradictorios** ("Japanese Mediterranean Gothic") → caos.
16. **Una sola cara AI** para todo el branding → diversifica para no estancar conversiones.
17. **CFG > 8-9 en ComfyUI** → colores quemados, piel plástica.

### Producers nuevos sugeridos para Dark Room

- **Time-lapse renovation** (Veo 3.1 start/end frame + Nano Banana Pro fases intermedias).
- **UGC e-commerce ad** (3×3 product grid + AI actor + Kling 2.1 Pro hablando).
- Ver §10 Roadmap del [[santo-grial-visual]] para priorización P1-P4.
