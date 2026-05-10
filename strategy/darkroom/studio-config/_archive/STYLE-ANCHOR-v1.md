# Dark Room · Style Anchor v1.0

> **SOP §3 Pillar 2** · prompt fragment portable 50-150 palabras · se concatena al prompt de cada generación para mantener identidad visual.
> **Inyección**: añadir al final de CADA prompt de imagen/video.
> **Version log**: v1.0 — extracto del Mega Prompt v1 (Section B Visual Standards).

---

## Style Anchor canónico (cuarto oscuro brand bible)

```
Premium editorial noir cinematic style, 35mm anamorphic 2x squeeze with oval bokeh and subtle horizontal lens flares, low-angle three-quarter perspective with rule of thirds composition (subject left two-thirds, negative space asymmetric right), shot on Kodak Portra 400 film push +1 stop with subtle silver halide grain and halation on highlights, color palette strict deep ink black #0A0A0A acid neon green #CFFF00 off-white #F2F2F2, single safelight neon green key from above casting hard chiaroscuro shadows contrast ratio 6:1, atmospheric haze with floating dust particles, mood clandestine craftsmanship reminiscent Crewdson cinematic and Saul Leiter color sensibility, no faces visible besides Soul Character if applicable, no competitor brand logos, no readable text on signs, no emojis, no symmetric centered layouts, no plastic CGI cleanliness, no HDR over-processing.
```

---

## Style Anchor variant · DARK_FRAMES Vice City sunset (cuando concept lo justifica)

```
Premium editorial cinematic Vice City sunset variant, 35mm anamorphic 2x squeeze with oval bokeh and horizontal lens flares (Beebe Miami Vice 2006 signature), Hoyte van Hoytema Tenet IMAX golden hour reference, color palette pastel pink #FFB5C5 pastel teal #7FE8E0 sunset orange #FF8C42 sunset purple #9B5DE5 deep ink black #0A0A0A acid neon green #CFFF00 only for HUD overlay, sunset golden hour 5pm Miami latitude warm-cool split sun-side pink-orange shadow-side teal-cyan, Kodak Portra 400 push +1 grain hybrid digital, low-angle three-quarter perspective rule of thirds, subtle film grain, mood late afternoon swagger summer 1986 nostalgia, NO MTV-80s saturated neon, NO competitor brand logos visible, NO Rockstar IP marks, NO Vice City literal city naming, NO Lamborghini Aventador literal naming (use "pastel pink Italian sport car" instead).
```

---

## Style Anchor variant · BR2049 sci-fi neon corridor (concept 001)

```
Premium editorial sci-fi corridor variant, Roger Deakins Blade Runner 2049 reference (American Cinematographer Oct 2017), Arri Alexa 65 + Cooke S4i Prime 32mm anamorphic, color palette amber-orange #E8A547 against deep teal-cyan #0E3B4F shadows, atmospheric haze dense with dust particles caught in volumetric light beams, single key light high angle warm against cool ambient fill ratio 8:1 high contrast noir, Kodak grain emulation, low-angle three-quarter perspective rule of thirds, subtle film grain push +1 stop, mood corporate dystopia clandestine, NO faces visible, NO competitor brand logos, NO neon green (this variant uses amber-teal palette only), NO Vice City pastel.
```

---

## Cómo aplicar

### En prompts de imagen (text2image_soul_v2)

```
[Subject + scene description specific to shot]

[Soul Character anchor: the trained subject Pablo PACAME wearing X doing Y]

[Style Anchor canónico O variant según concept]
```

### En prompts de video (Seedance 2.0 / Cinema Studio Video V2)

```
[Action description specific to shot · what moves how]

[Camera movement: push-in / dolly / handheld / drone pull-back / whip pan]

[Subject Pablo PACAME identity preserved from start_image]

[Style Anchor canónico O variant según concept]

negative prompt: [from Style Anchor exclusions]
```

### Reglas de aplicación

1. **El Style Anchor SIEMPRE va al final del prompt** (después de subject/action/camera/Soul)
2. **NO modificar el Style Anchor por gen** · si necesitas cambiar algo es señal de que ese concept requiere variant nuevo (crear y versionar)
3. **Verificar que NO contradice el specific de la pieza** · si hay conflicto · loggear en `refinement-log.md`
4. **Variant se elige según `concept.style_anchor_variant`** field en JSON (default: "canónico")

---

## Maintenance

- Actualizar cuando se identifique un drift recurrent en outputs (e.g. siempre sale plano · añadir "low-angle three-quarter perspective" reforzado)
- Crear NUEVOS variants cuando un concept requiera paleta/lighting fuera del canónico (e.g. concept 001 BR2049 amber-teal NO encaja con canónico acid green)
- Versionar como `STYLE-ANCHOR-v1.1.md` etc

**Version log**:
- v1.0 (2026-05-08) — Inicial · canónico + Vice City + BR2049 variants extraídos del Mega Prompt v1
