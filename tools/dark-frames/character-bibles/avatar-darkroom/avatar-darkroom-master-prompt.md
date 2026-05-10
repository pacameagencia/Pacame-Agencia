# Avatar Dark Room · Master Prompts (Candidato D · Tech-Noir Robot con Ojos Cute)

> **Versión**: v1.0 (2026-05-10 · Phase A.2 inicial)
> **Basado en**: `strategy/darkroom/avatar/AVATAR-BRIEF.md` §3 Candidato D
> **Modelo objetivo**: Higgsfield Soul V2 (`text2image_soul_v2`) · sin soul-id en Phase A (concept art exploration · sin training todavía)

---

## Base DNA descriptor (paste en todos los prompts)

```
A small bipedal robot creature mascot, approximately 35cm tall, head-to-body proportions 1:1.5, head is a spherical chassis of brushed matte black metal #0A0A0A with two large round CUTE eyes glowing acid neon green #CFFF00 (Stitch-Baymax style proportions, NOT slit visor NOT humanoid), a third small pulsing single eye between the two main eyes also acid neon green, three-segment fractal antenna on top of head with acid green glow tips, compact body chassis with visible panel joinery and brushed metal finish, rubber-tech matte black joints with subtle sub-surface scattering, short articulated arms with exposed servos, compact legs with stabilizer pads, off-white #F2F2F2 fine stitching lines visible at joint articulations (Stitch-style detail), micro acid green LEDs on heel pads, back panel with visible solar mini-cells and status LEDs and cable bundles, no humanoid face, no mouth, expression conveyed entirely through the three glowing eyes.
```

---

## Prompt 1 · Close-up cabeza (3 variations · validate face identity)

**Aspect**: 3:4 portrait · resolution 2K · variation seed control 3 different.

```
Ultra-detailed close-up portrait of [BASE DNA · paste from above].

Neutral curious expression, slow-blink mid-frame with the two large round acid green eyes locked toward camera at three-quarter angle, third pulsing eye in forehead at peak glow intensity, fractal antenna fully visible against background, head tilted 5 degrees right (subtle curious gesture), no body visible (head and shoulders only).

Background: pure matte charcoal black #0A0A0A studio backdrop, even cross-polarized clinical scan lighting from above with soft fill from camera-left, no gradients, optimized for VFX reference and identity capture.

Camera: shot on Hasselblad X1D 120mm macro lens, f/4.5, ISO 100, 1/125s, vertical portrait orientation, absolute sharpness on the three eyes, infinite depth of field.

Texture stack realism: ray-traced global illumination, subsurface scattering on rubber-tech joint areas around neck, texture-rich brushed metal chassis with micro-imperfections (faint scratches and oxidation on edges), faint fingerprints on glossy curved surfaces breaking specular highlights, acid green glow with realistic bloom not over-processed, contact shadows under chin where head meets shoulders, uncompromising detail, premium commercial advertising look, Kodak Portra 400 push +1 grain emulation subtle, halation only on the brightest acid green LED tips, no plastic CGI cleanliness, no HDR over-processing.

Mood: mysterious tech-noir creature with unexpected cute eyes, reminiscent of BB-8 + Wall-E + Stitch hybrid in Blade Runner aesthetic, curious sharp slightly mischievous personality conveyed through eyes only.

No humanoid face, no mouth, no smiling glamour stock-photo aesthetic, no competitor brand logos visible, no readable text on chassis, no HDR over-processing.
```

---

## Prompt 2 · Body shot 3/4 (3 variations · validate proportions + materials)

**Aspect**: 4:5 portrait · resolution 2K · variation seed control 3 different.

```
Ultra-detailed three-quarter body shot of [BASE DNA · paste from above].

Full standing pose, weight slightly on left leg with right leg subtly forward, both arms relaxed at sides with hands articulated visible joints, body angled 25 degrees to camera-left showing depth of chassis paneling and back-panel solar cells partially visible, head turned toward camera at slight downward angle (3 degrees · slightly inquisitive), all three eyes locked on camera, fractal antenna fully extended.

Background: pure matte charcoal black #0A0A0A studio backdrop, single neon acid green key light from upper-camera-left casting hard chiaroscuro shadow on the robot's right side (3:1 contrast ratio), subtle atmospheric haze with floating dust particles caught in the key light beam, ground plane reflection subtle, no gradients elsewhere.

Camera: shot on Hasselblad X1D 70mm film lens emulation, f/2.8, ISO 100, 1/125s, vertical portrait orientation, full robot height in frame with 15% headroom and 15% feet room, sharp focus throughout (deep depth of field).

Texture stack realism: ray-traced global illumination, subsurface scattering on rubber-tech joints (knees, elbows, neck) creating soft material feel against the harder chassis metal, texture-rich brushed metal chassis micro-imperfections (subtle scratches along high-contact edges, faint oxidation on bottom edges where legs meet feet, fingerprints on smooth curved surfaces), rubber grip pads showing slight wear pattern on heels, micro acid green LEDs on heels glowing realistic bloom, off-white stitching lines at joint articulations visible (Stitch-style detail), contact shadows where feet touch the ground plane, uncompromising detail, premium commercial advertising look, Kodak Portra 400 push +1 grain emulation subtle, no plastic CGI cleanliness.

Mood: mysterious tech-noir creature with unexpected cute presence, BB-8 carisma without humanoid face, Wall-E worn materials feel, Stitch large-eye empathy, all rendered in Blade Runner 2049 acid green noir aesthetic.

No humanoid face, no mouth, no extra fingers or deformed limbs, no smiling glamour aesthetic, no competitor brand logos visible, no readable text on chassis, no HDR over-processing.
```

---

## Notes para Phase B (Soul training 360 sheet)

Cuando Pablo apruebe Phase A.2, escalar a Phase B con:
- Master prompt 360 sheet adaptado (12-14 angles · neutral expression · clinical scan lighting · ver REFERENCE §6.1 template)
- Body DNA descriptor IDÉNTICO al de arriba (no variar entre A.2 y B · garantiza identity match)
- Soul Character training Higgsfield via skill `higgsfield-soul-id` (upload 5-10 ref images de Phase A.2 ganadores → new Soul Character ID)
- Object Consistency Sheet adicional con focus en materiales (brushed metal + rubber-tech + glow + costuras)

---

## Version log

- **v1.0** (2026-05-10) — Master prompts iniciales Candidato D Mix A+B. Pendiente Phase A.2 generación 6 frames concept art con higgsfield-generate skill.
