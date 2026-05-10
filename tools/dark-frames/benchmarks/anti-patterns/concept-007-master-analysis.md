# Anti-pattern · Concept 007 master "Pablo GTA VI Day"

## Datos básicos

| Campo | Valor |
|---|---|
| `concept_id` | dark-frames-007-pablo-gta-vi-day |
| `master_path` | `tools/dark-frames/output/dark-frames-007-pablo-gta-vi-day/final/reel_v1_30fps_master.mp4` |
| `tamaño` | 48MB |
| `creado` | 2026-05-10 14:51 |
| `formato_declarado` | "trailer 4-act with protagonist" (16.2s) |
| `formato_real` | montage 4 escenas con cambios de localización |
| `tier_declarado` | HYBRID |
| `feedback_pablo` | "no tiene coherencia de película o un guión fluido porque son 4 escenas totalmente diferentes que dan transiciones bruscas entre ellas" |

## Por qué falla (en 1 frase)

4 escenas con cambios de localización en 14s · imposible que fluya como trailer narrativo · transiciones técnicas (J-cut audio S1→S2 · whip pan S2→S3 · color match S3→S4) intentan compensar una narrativa estructuralmente rota.

## Análisis detallado

### Estructura del fallo

```
S1 ARRIVAL (3.5s)        — Pablo bajando del Testarossa · valet · concesionario
   └── J-cut audio →
S2 TOSS (4.0s)           — Pablo en balcón mirando rubia tirándole llaves · escena diferente
   └── whip-pan continuation →
S3 RIDE (4.0s)           — Pablo en moto haciendo drift · escena diferente
   └── color match →
S4 TOAST (3.0s)          — Pablo en yate brindando champagne · escena diferente
   └── fade →
OUTRO Dark Room (1.7s)
```

**Total: 16.2s · 4 localizaciones distintas · 0 conexión narrativa real entre escenas**.

Esto NO es un trailer 4-act. Es un montage. Los trailers de Hollywood reales (BR2049, Drive, Tenet, Miami Vice 2006) usan 60-90s para mostrar 4 actos con audio anchor y voiceover. En 14s, comprimir 4 actos = postales pegadas.

### Lo que el concept JSON declaraba (vs lo que entregó)

| Promesa concept JSON | Realidad output |
|---|---|
| "Single-day Vice City lifestyle 4-act arc" | 4 escenas inconexas · ningún cue temporal "morning → noon → sunset" se siente |
| Wardrobe continuity (single Hawaiian) | Wardrobe consistente ✓ · pero compensa poco la disrupción de localización |
| Lighting continuity (warm-cool split) | Cada escena tiene su propia luz · NO continuity entre shots |
| Transitions handoff (J-cut + whip + color-match) | Transiciones aplicadas técnicamente · pero no resuelven que la NARRATIVA salta |
| Audio sync points cada shot | SFX sí sincronizados · música también · pero la música no es lo suficientemente fuerte como para hilvanar 4 escenas distintas |

### Lecciones clave

1. **Las transiciones técnicas no salvan narrativas rotas**. J-cut audio + whip pan + color match son herramientas de edición · sirven a una historia que YA tiene continuidad, no LA crean.
2. **4 cambios de localización en 14s es imposible** que fluya. Ese contenido necesita 60-90s con música como hilo conductor (formato real de trailer Hollywood) o split en 4 piezas 1-act independientes (cada localización su propia pieza).
3. **El concept JSON sobre-vendía** lo que técnicamente Seedance puede entregar. Concept escrito como Hollywood-grade, pero el output era 4 shots aislados pegados.
4. **El anti-pattern aparece cuando se confunde "tener mucho que mostrar" con "trailer narrativo"**. Tener 4 momentos fuertes ≠ poder hacer un trailer en 14s.

## Cómo se debería haber resuelto

### Opción A · 4 piezas 1-act independientes
Cada localización su propio reel 8s con UNA acción evolutiva:
- 008 "Pablo arrival Testarossa" (1-act 8s)
- 009 "Pablo recibe llaves" (1-act 8s)
- 010 "Pablo en moto drift" (1-act 8s)
- 011 "Pablo brindis yate" (1-act 8s)

Coste: 4 × $1.10 = $4.40 (mismo que 007 · pero 4 piezas validadas en lugar de 1 fallida)

### Opción B · 2-act chained con 2 momentos conectados
Reducir a 2 momentos donde el last_frame_chain funciona:
- ACT A: Pablo bajando Testarossa · last frame = Pablo de pie con llaves
- ACT B: Same start frame (Pablo de pie con llaves) → camina hacia moto · last frame = Pablo en moto con casco

Coste: 2 × $1.10 = $2.20. Una sola toma continua de 14s.

### Opción C · 3-act trailer pero con narrativa REAL
Si insiste en 3-act, necesita:
- Hook 5-8s: UNA acción provocadora
- Content 8-15s: desarrollo / contradicción / sorpresa
- CTA 5-8s: resolución + identity reveal

Total: 18-31s (no 14s). Y cada act con función narrativa distinta, no 3 escenas random.

## Reglas duras derivadas

Esta pieza fundamenta:
- **Anti-patrón #1 del DARK-ROOM-PLAYBOOK** §1 ("trailer 4 escenas inconexas en 14s")
- **Check 1 del concept-reviewer** (formato declarado vs shots reales)
- **Bloqueo automático** en validate-concept.mjs si format=3-act + duration <18s + shots >3

## Referencias en el repo

- Concept JSON: [`tools/dark-frames/concepts/dark-frames-007-pablo-gta-vi-day.json`](../../concepts/dark-frames-007-pablo-gta-vi-day.json)
- Master video: `tools/dark-frames/output/dark-frames-007-pablo-gta-vi-day/final/reel_v1_30fps_master.mp4`
- Render script ffmpeg: [`tools/dark-frames/render-007-final.sh`](../../render-007-final.sh) (preservar como template ffmpeg post para 3-act real)
