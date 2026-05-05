# Higgsfield · producers Dark Room

Higgsfield está integrado vía **3 vectores**:

1. **MCP hosted** · `web/.mcp.json` con `${HIGGSFIELD_API_KEY}` + `${HIGGSFIELD_API_SECRET}` interpolados. Claude Code en este repo puede invocar:
   - `mcp__higgsfield__generate_image`
   - `mcp__higgsfield__generate_video`
   - `mcp__higgsfield__create_character` (Soul ID training)
   - `mcp__higgsfield__list_characters`
   - `mcp__higgsfield__get_generation_status`

2. **Skills oficial pack** · clonado en `.agents/skills/higgsfield/` + symlinks en `.claude/skills/`:
   - `higgsfield-generate` · 30+ modelos (Soul, Speak, Cinema, Sora 2, Veo, Kling, Seedance, Hailuo, Nano Banana)
   - `higgsfield-soul-id` · entrenar identidad consistente
   - `higgsfield-product-photoshoot` · brand-quality product images
   - `higgsfield-marketplace-cards` · cards para Etsy/Amazon

3. **CLI** (opcional) · `npm i -g @higgsfield/cli` si Pablo quiere uso desde terminal.

## Casos de uso Dark Room (mes 1)

### Caso 1 · Carrusel diario IG (Soul + Iconic Look)

7 slides hero con cara Pablo consistente + paleta verde ácido `#CFFF00`.

```
mcp__higgsfield__generate_image:
  model: "soul"
  character_id: "<HIGGSFIELD_PABLO_CHARACTER_ID>"  # tras Soul ID training
  prompt: "<PROMPT_SLIDE_N>"
  iconic_look: "cinematic_noir_green"
  aspect_ratio: "1:1"
  count: 7
```

Prompts canónicos slides → ver `prompts.md`.

### Caso 2 · Reel Speak (lipsync 15-30s)

Pablo "habla" sin grabarse. Script auto-generado de hook DR.

```
mcp__higgsfield__generate_video:
  model: "speak_v2"
  character_id: "<HIGGSFIELD_PABLO_CHARACTER_ID>"
  audio_url: "<elevenlabs-tts-url>"     # voz Pablo via ElevenLabs ya configurado
  duration: 15-30s
  aspect_ratio: "9:16"                   # IG Reels / TikTok
  iconic_look: "cinematic_noir_green"
```

### Caso 3 · Still→video animate

Convierte 1 still de la marca en clip animado 5s (parallax + zoom slow).

```
mcp__higgsfield__generate_video:
  model: "soul_animate"
  source_image_url: "<still-url>"
  motion: "slow_zoom_in"
  duration: 5s
  aspect_ratio: "9:16" o "1:1"
```

## Soul ID training (one-time · Pablo manda fotos)

Cuando Pablo proporcione 5-20 fotos cara variadas (front, perfil, distintas luces), ejecutar **una vez**:

```
mcp__higgsfield__create_character:
  name: "Pablo · Dark Room founder"
  reference_images: [<5-20 URLs>]
```

→ Devuelve `character_id`. Guardar en env `HIGGSFIELD_PABLO_CHARACTER_ID` (Vercel + .env.local).

Coste: 40 credits = $2.50 one-time. Después cada `generate_image` con `character_id` cuesta 1.5-3 credits ($0.09-0.19).

## Cost-guard

Rates añadidos a `carruseles-darkroom/lib/cost-guard-rates.json` (ver patch en este directorio).

## Iconic Look canónico Dark Room

`cinematic_noir_green`:
- Fondo negro profundo `#0A0A0A`
- Acento verde ácido `#CFFF00` (rim light, neón)
- Grano sutil + vignette
- Mood: cuarto oscuro de revelado · noir cinematográfico
- NO: tech-bro azul/violeta · gradients infinitos · stock-photo sonriendo

Alternativos para variedad:
- `underground_studio` (escena cerrada con luz dura)
- `editorial_street_es` (creator hispano en calle nocturna)
- `theatrical_light` (un solo foco verde rasante)
