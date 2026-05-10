# M3.L10 — Workflow video completo · idea → shotlist → edición → publish

> **Dura**: 15 min
> **Nivel progreso**: 53% → 55%
> **Requisito previo**: M3.L9 (cierra módulo M3)

## Qué vas a sacar de aquí

Ejecutas un video end-to-end aplicando todo M3: research-first, shotlist, formato decidido, modelo IA o edit clásico según tier, color grading, captions, audio, export. Cierras M3 (55% de la academia).

## El concepto (1 idea, no 5)

Un proyecto video profesional tiene **6 etapas**, igual que en M2 pero adaptadas:

1. **Concepto + research** (5-15 datos verificables si cinematic).
2. **Shotlist** (planning de cada shot con tipo, duración, prompt o cam direction).
3. **Generación o grabación** (IA o cámara real).
4. **Edición** (Premiere / DaVinci / CapCut según formato).
5. **Color + audio** (DaVinci grading + ElevenLabs voice over si aplica).
6. **Export + entrega**.

Cada etapa ahorra tiempo en la siguiente si está bien hecha. Saltarse research = ahorrar 30 min, perder 4 horas en re-generar.

## El ejemplo real

**Caso completo · cliente eCom skincare, pieza 1-act 8s "hero image móvil" + 3 stories 5s · presupuesto 600€**

### Día 1 · Concepto + research (1h)

- Brief cliente: marca minimal premium, target mujer 28-45, "rutina nocturna calmante".
- Research (5 datos):
  - Peli ref: "Aftersun 2022" (Charlotte Wells).
  - DP: Gregory Oke.
  - Lentes: Sony FX3 + Atlas Orion anamórfico.
  - LUT: pastel washed, low contrast, warm shadows.
  - Ritmo: contemplativo, tomas largas, dialog mínimo.
- Decide formato: 1 pieza 1-act 8s horizontal (hero web) + 3 stories 5s vertical (IG/TikTok).

### Día 2 · Shotlist (30 min)

```
PIEZA 1 · Hero 1-act 8s horizontal · CINEMATIC · Cinematic Studio V3
  Subject: producto skincare en mano femenina
  Action: aplicación lenta del producto en muñeca
  Setting: baño bañado en luz dorada al atardecer
  Camera: macro 50mm, push in lento
  LUT: pastel washed, warm shadows

STORY 1 · Vertical 5s · AUTHENTIC · Higgsfield Soul Video
  Subject: persona viéndose al espejo
  Action: aplica crema con micro-sonrisa
  Tier: iPhone-look casual

STORY 2 · Vertical 5s · AUTHENTIC · Higgsfield Soul Video
  Subject: producto siendo recibido (paquete abriéndose)
  Action: unboxing rápido manos

STORY 3 · Vertical 5s · AUTHENTIC · Higgsfield Soul Video
  Subject: textura producto (close-up)
  Action: gota cae sobre cristal
```

### Día 3 · Generación (3h)

- Pieza 1 (Cinematic Studio V3): genera 3 variations del 1-act 8s. Coste ~$3 total. Elige mejor.
- Stories 1-3 (Higgsfield Soul Video): genera cada una con 3 variations. Coste $0 (incluido plan Plus).
- Descarga todas.

### Día 4 · Edición + Color (1h)

- Pieza 1 a DaVinci: aplica grading pastel (Lift sombras hacia warm, Gain luces sutil deshaturado).
- Stories: a CapCut, ratio 9:16, captions auto, música ambient suave.
- Export todos a /04-entregables/.

### Día 5 · Audio + Voz over (30 min)

- Pieza 1: música ambient + sound design (gota líquida sutil, breath in/out).
- Stories: música trending sutil 30% volumen.
- Si cliente pide narrador: ElevenLabs Multilingual v2 voz "Brian" español.

### Día 6 · Entrega (30 min)

ZIP `ClienteSkincare-Campaign-2026-05-25-FINAL.zip`:
- `01-hero/hero-8s-1080p.mp4`
- `02-stories/story-1.mp4, story-2.mp4, story-3.mp4`
- `03-raw-frames/` (los PNGs intermedios IA para futuras ediciones)
- `README.md` con captions y horario óptimo publicación.

Total: 6.5 horas trabajo. Cobras 600€. Margen 92€/hora.

## El prompt copiable

Template shotlist (pega en Notion):

```
PROYECTO: __________
CLIENTE: __________ · presupuesto: ____ €

RESEARCH:
  1. Peli/serie: __________
  2. DP: __________
  3. Lentes: __________
  4. LUT: __________
  5. Ritmo: __________

PIEZAS:

  Pieza 1
    Formato: 1-act / 2-act / 3-act / story / carrusel
    Duración: __ s
    Tier: AUTHENTIC / HYBRID / CINEMATIC
    Modelo IA o cam real: __________
    Prompt o cam direction: __________
    Coste estimado: __ €

  Pieza 2 (si aplica)
    ...

ENTREGABLES:
  ▢ Hero pieza · formato + resolución
  ▢ Stories N · formato + resolución
  ▢ Raw frames intermedios IA
  ▢ README con captions sugeridos
```

## Tu ejercicio (5 min)

Coge tu próxima campaña / proyecto. Llena la plantilla shotlist arriba (puede ser ficticio). Estima tiempos por etapa. Compara después con tiempo real.

Si tu real supera estimado en >50%, una de las 6 etapas está flaca. Itera plantilla.

## Quick-win

**Regla "raw frames son oro"**: los PNGs intermedios IA (start frames, last frames, base images Soul) son assets que el cliente puede pedir reusar después. Guárdalos siempre en `/03-raw-frames/`. Cuando 6 meses después el cliente pida "otra versión de aquel mismo personaje", tienes el frame base y generas sin volver al brief.

## Si quieres profundizar

- [ ] **Has cerrado M3 (55% progreso) ✓**
- [ ] M4.L1 · Higgsfield Soul · tu avatar persistente (siguiente módulo IA generativa)
- [ ] M5.L1 · Dropshipping en 2026 (si quieres saltar a e-commerce)
- [ ] Lead magnet M3 · Decision Tree video (PDF)

---

**Visual**: `TODO: visual · brief: "timeline 6 días con cada etapa + entregable + tiempo invertido · iconos por etapa · fondo dark + flechas doradas · estilo case study video"`

**Quiz check**:
- Pregunta: "Cliente pide cambiar el LUT del hero a 2 meses de la entrega. ¿Qué te salva tiempo?"
- Opciones: Re-generar todo · Tener los raw frames guardados + DaVinci timeline · Decirle que es presupuesto aparte total · Negarte.
- Correcta: Tener los raw frames guardados + DaVinci timeline.
- Explicación: si guardas raw frames IA y la timeline DaVinci, cambiar LUT son 15 min, no re-generar todo. Por eso la regla "raw frames son oro".

<!-- VISUAL_PENDIENTE -->

---

## ✓ Módulo 3 cerrado · 55% de Dark Academy

Has completado las 10 lecciones del Módulo 3. Próximos pasos:

- **M4 · IA generativa amplia** (8 lecciones, ~1.5 horas) · profundiza en Higgsfield Soul, Nano Banana, Three-Pass Review.
- **M5 · E-commerce** (7 lecciones, ~1.5 horas) · si quieres montar tienda y vender.
- **M6 · Marketing** (8 lecciones, ~2 horas) · si quieres captar más clientes.

Lead magnet M3 disponible: "Decision Tree video · edit clásico vs IA generativa".
