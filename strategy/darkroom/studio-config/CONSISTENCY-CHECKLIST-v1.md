# Dark Room · Consistency Checklist v1.0

> **SOP §3 Pillar 3** + **§6.1 Three-Pass Review** · checklist binario yes/no antes de aprobar cualquier asset.
> **Uso**: visual-reviewer subagent recorre cada item · firma Ed25519 sobre el reel.mp4 solo si TODOS pasan.
> **Si 2+ markers fail** → reject. **Si 1 marker fail** → puede salvar con refinement targeted.
> **Version log**: v1.0 — inicial · alineado con `tools/dark-frames/enqueue-reel.mjs` 11 checks.

---

## PASS 1 · TECHNICAL (binary reject si CUALQUIERA fail)

| # | Marker | Pregunta | Y / N |
|---|---|---|---|
| 1 | Resolution | ¿Reel = 1080×1920? · ¿Carrusel = 1080×1350? · ¿Story = 1080×1920? | |
| 2 | Aspect ratio | ¿Reel/Story = 9:16? · ¿Carrusel = 4:5? | |
| 3 | File format | ¿Reel = MP4 H.264 yuv420p AAC audio? · ¿Carrusel = PNG/JPG baseline? | |
| 4 | Naming convention | ¿Sigue patrón `[project]_[concept]_[variant]_v[N]_[YYYYMMDD].[ext]`? | |
| 5 | Duration | ¿Reel duration objetivo ±0.5s? · ¿Outro 2s incluido si DARK_FRAMES? | |
| 6 | Frame rate | ¿24-30 fps? · ¿No drops/jumps? | |
| 7 | Bitrate | ¿≥1.5 Mbps video · ≥128 kbps audio? | |

**Si 1+ fail → REJECT INMEDIATO · regenerar con specs correctos · NO continuar a Pass 2.**

---

## PASS 2 · STYLE (Consistency Checklist · 11 checks bloqueantes)

| # | Marker | Pregunta | Y / N |
|---|---|---|---|
| 1 | Color Palette canónico | ¿Solo HEX `#0A0A0A` · `#CFFF00` · `#F2F2F2` (+ variant si concept lo declara)? · ¿Cero gradients azul-violeta techbro? | |
| 2 | Lighting | ¿Single safelight neón verde acid rasante (canónico) O variant DP-specific (Beebe/Hoytema/Deakins/Acord)? · ¿Contrast ratio 6:1+? | |
| 3 | Composition | ¿Rule of thirds? · ¿Subject left/right two-thirds NO centered? · ¿Negative space asymmetric? · ¿Depth layers FG+MG+BG visibles? | |
| 4 | Texture | ¿35mm grain + halation visible? · ¿Surfaces mate (no plastic CGI)? · ¿Kodak Portra 400 push+1 emulation? | |
| 5 | Photography style | ¿Editorial premium noir? · ¿35mm anamorphic 2x squeeze (oval bokeh + horizontal lens flares)? · ¿Low-angle three-quarter NO flat front-on? | |
| 6 | Soul Character (DARK_FRAMES y BTS Pablo) | ¿Pablo `PACAME` reconocible cross-shot? · ¿Misma cara · mismo outfit · misma personalidad en TODOS los shots? | |
| 7 | Typography (si hay text overlay) | ¿Anton ALL CAPS display? · ¿Space Grotesk Bold/Medium body? · ¿JetBrains Mono captions? · ¿Cero decorative scripts? | |
| 8 | Excluded elements | ¿Cero IP marks (GTA · Vice City · Ducati · Rockstar · Lambo · Stranger Things · etc)? · ¿Cero competitor logos visibles? · ¿Cero readable text inventado IA en señales? · ¿Cero faces glamour stock? | |
| 9 | Safe areas IG | ¿Reel: top 280px clear de texto crítico? · ¿bottom 380px clear (caption preview + audio info)? · ¿sides 80px margin? | |
| 10 | Brand outro (DARK_FRAMES only) | ¿Outro 2s `outro-darkroom-2s-v2.mp4` concatenado al final con texto "TODO HECHO CON · darkroomcreative.cloud"? | |
| 11 | Hashtag canónico | ¿Caption incluye `#DarkFrames` (DARK_FRAMES) O `#DarkRoom` (resto)? · ¿`#darkroomcreative` siempre? | |

**Si 2+ fail → REJECT · refine targeted o regenerar.**
**Si 1 fail → Pass 3 + flag refinement priority.**

---

## PASS 3 · CREATIVE (gut feel · subjective)

| # | Marker | Pregunta | Y / N |
|---|---|---|---|
| 1 | Hollywood test | ¿Aguanta comparación lado-a-lado con trailer real del referente declarado? · ¿NO pierde claramente vs Mad Max real / BR2049 real / Miami Vice real? | |
| 2 | Hook 0-1.5s | ¿Hay movimiento en frame 1 (no estático)? · ¿Genera scroll-stop en feed IG? · ¿Cara reconocible Soul Character desde primer frame? | |
| 3 | Cuts kinetic | ¿Cuts cada 1-2.5s? (8-12 cuts en reel 15s) · ¿NO un solo plano largo aburrido? | |
| 4 | Emotional arc | ¿Act 1 hook (descubrimiento)? · ¿Act 2 build (acción)? · ¿Act 3 climax + reveal (outro)? | |
| 5 | Audio sync | ¿Música drop coordinado con cut clave? · ¿SFX por cada acción visible (door slam · car rev · gun cock)? · ¿LUFS -16 cinema? | |
| 6 | Outro reveal | ¿Outro genera "espera ¿es IA?" en viewer? · ¿NO obvio desde frame 1 que es generación? | |
| 7 | CTA implícito caption | ¿Comments trigger word presente ("Comenta GTA y te mando el ebook")? · ¿NO CTA agresivo "compra ya"? | |
| 8 | Flow | ¿Pasaría tu propio "would I be proud to publish this"? · ¿Si gut dice no · trust it y refine? | |

**Pass 3 es subjetivo · trust gut · si dudas → refine antes de publicar.**

---

## Resultado final del Three-Pass Review

| Pass 1 Technical | Pass 2 Style | Pass 3 Creative | Resultado |
|---|---|---|---|
| ALL pass | ALL pass | ALL pass | ✅ APPROVED · sign Ed25519 · enqueue · publish |
| ALL pass | ALL pass | 1-2 fail | ⚠️ REFINE creative targeted · regenerar |
| ALL pass | 1 fail | ALL pass | ⚠️ REFINE style targeted · regenerar fail-marker only |
| ALL pass | 2+ fail | — | ❌ REJECT · regenerar concept más amplio |
| 1+ fail | — | — | ❌ REJECT TÉCNICO · regenerar con specs correctos |

---

## Workflow operativo

1. Visual-reviewer subagent abre `output/[concept]/reel.mp4` + sample frames
2. Recorre 7+11+8 = 26 markers binarios
3. Genera `review-report.json`:
   ```json
   {
     "concept_id": "dark-frames-005-pablo-gta-vi",
     "version": "v3",
     "reviewed_at": "2026-05-08T13:45:00Z",
     "pass_1_technical": { "all_pass": true, "fails": [] },
     "pass_2_style": { "all_pass": false, "fails": ["6_soul_character"], "severity": "blocker" },
     "pass_3_creative": { "all_pass": true, "fails": [] },
     "overall": "REJECT_REFINE_TARGETED",
     "refinement_action": "Regenerar shot 1 + 3 con start_image anchor PACAME inyectado",
     "ed25519_signature": null
   }
   ```
4. Si `overall = APPROVED` → firma Ed25519 con `sign-approval.mjs` privada del reviewer
5. enqueue-reel.mjs verifica firma + 11 checks + cost-guard token consumed → fila content_queue

---

## Maintenance

- Después de cada pieza publicada con engagement >benchmark: añadir a `style-library/approved/` como benchmark nuevo
- Actualizar checklist con learnings (e.g. "shot 2 frame 60 tenía glitch chromatic aberration en text · añadir check `#27 chromatic_aberration_only_intentional`")
- Versionar v1.0 → v1.1 si añades/quitas checks
- Sincronizar con `tools/dark-frames/enqueue-reel.mjs` cuando cambien los 11 checks de Pass 2

**Version log**:
- v1.0 (2026-05-08) — Inicial · 26 markers (7 technical + 11 style + 8 creative) · alineado SOP §6.1 Three-Pass Review
