# M4.L7 — JSON prompts · schema validable

> **Dura**: 10 min
> **Nivel progreso**: 67% → 69%
> **Requisito previo**: M4.L6

## Qué vas a sacar de aquí

Conviertes tus prompts en JSON estructurado. Validas concepts antes de generar (evitas créditos perdidos). Reusas plantillas JSON entre clientes.

## El concepto (1 idea, no 5)

El prompt en JSON es **prompt estructurado en máquina-legible**. Sirve para:

1. **Validación previa** · un script puede verificar que tu prompt tiene los 5 campos antes de gastar créditos.
2. **Reusabilidad** · plantillas JSON que reusas entre clientes cambiando variables.
3. **Versioning** · cada generación queda con su JSON guardado. Si la pieza funciona, sabes exactamente qué prompt la generó.
4. **Automation** · scripts pueden generar N variations modificando 1 campo del JSON.

Ejemplo simple, mismo prompt del 5-step en JSON:

```json
{
  "concept_id": "demo-001",
  "format": "1-act",
  "tier": "CINEMATIC",
  "subject": {
    "description": "32 year old man with short dark beard",
    "wardrobe": "worn leather jacket",
    "action": "leaning against brick wall, looking off-camera",
    "expression": "contemplative"
  },
  "setting": {
    "location": "narrow alley in Buenos Aires",
    "time_of_day": "late afternoon",
    "light": "soft golden light between buildings, faint mist"
  },
  "camera": {
    "shot_type": "medium",
    "lens": "35mm anamorphic",
    "angle": "slight low angle",
    "motion": "static with subtle handheld",
    "depth_of_field": "shallow, subject in focus"
  },
  "look": {
    "color_grading": "warm amber highlights, deep cool shadows",
    "reference": {
      "film": "Drive (2011)",
      "dp": "Newton Thomas Sigel",
      "lut": "Kodak Vision3 250D"
    },
    "texture": "slight film grain"
  },
  "research": [
    "Newton Thomas Sigel ASC interview Cinematographer.com 2012",
    "Drive 2011 BTS Anatomy of Lighting featurette",
    "Cinestill 800T film tests Vimeo",
    "Buenos Aires alley reference Letterboxd Roma 2018",
    "anamorphic 35mm lens flare comparison YouTube"
  ],
  "duration_seconds": 8,
  "aspect_ratio": "16:9"
}
```

Cada campo es validable: el campo `research` debe tener ≥5 items para pasar el gate cinematic.

## El ejemplo real

**Workflow JSON real Dark Room**:

1. Redactas concept en JSON siguiendo `DARK-ROOM-TEMPLATE.json` schema.
2. Lanzas `node tools/dark-frames/validate-concept.mjs concept.json`.
3. Script verifica:
   - Schema completo (todos los campos obligatorios).
   - Research ≥5 items.
   - Tier coherente con modelo (CINEMATIC requiere modelo correcto).
   - Format coherente con duración.
   - Sin IPs prohibidas (GTA / Marvel / Disney etc.).
4. Si validate-concept exit 0 → puedes generar.
5. Si falla → corrige JSON antes de gastar créditos.

Para alumno Dark Academy: NO tienes que correr `validate-concept.mjs` (es script Dark Room interno). Pero SÍ tienes que pensar tus prompts como JSON antes de generar. Eso evita los errores típicos.

## El prompt copiable

Plantilla JSON simple para tu uso (guárdala en Notion banco de prompts):

```json
{
  "concept_id": "{nombre-corto}",
  "format": "1-act / 2-act / 3-act / story / carrusel",
  "tier": "AUTHENTIC / CINEMATIC / HYBRID",
  "subject": {
    "description": "",
    "action": "",
    "expression": ""
  },
  "setting": {
    "location": "",
    "time_of_day": "",
    "light": ""
  },
  "camera": {
    "shot_type": "",
    "lens": "",
    "motion": ""
  },
  "look": {
    "color_grading": "",
    "reference": {
      "film": "",
      "dp": "",
      "lut": ""
    }
  },
  "research": [
    "fuente 1 verificable",
    "fuente 2 verificable",
    "fuente 3 verificable",
    "fuente 4 verificable",
    "fuente 5 verificable"
  ]
}
```

Rellena este JSON antes de cada generación cinematic. Si dejas un campo vacío, ahí es donde tu prompt va a fallar.

## Tu ejercicio (5 min)

Coge una pieza que vas a generar:

- [ ] Crea un archivo `.json` (puede ser solo nota Notion estilo JSON).
- [ ] Rellena los campos del template.
- [ ] Si dejas algún campo vacío, identifica qué falta investigar.
- [ ] Antes de tocar Higgsfield, verifica que research tiene 5 items reales.

Si los 5 research son verificables (URLs / pelis concretas / DPs nombrados), tu prompt está listo.

## Quick-win

**Regla "JSON antes que prompt"**: si vas a generar pieza CINEMATIC, escribes el JSON primero. Después conviertes el JSON en prompt natural pegando los campos en orden. El JSON evita olvidar campos. El prompt natural es output del JSON, no al revés.

## Si quieres profundizar

- [ ] M4.L8 · Three-Pass Review · 26 markers anti-AI-look (cierra M4)
- [ ] Lead magnet M4 · Three-Pass Review Checklist (PDF)
- [ ] `strategy/darkroom/studio-config/DARK-ROOM-TEMPLATE.json` (schema canonical Dark Room real)

---

**Visual**: `TODO: visual · brief: "split-screen · izquierda JSON estructurado con campos · derecha prompt natural derivado · flechas conectoras de campos a frases · fondo dark + acento dorado · estilo workflow técnico"`

**Quiz check**:
- Pregunta: "Tu JSON concept tiene research con solo 2 items. ¿Qué haces?"
- Opciones: Genera igual, son detalles · Investiga 3 más antes de generar · Quita el campo research · Pídelo a ChatGPT que rellene research.
- Correcta: Investiga 3 más antes de generar.
- Explicación: research ≥5 items es regla dura cinematic. Saltarse esto = créditos en pieza mediocre. ChatGPT no debe rellenarlo (puede inventar fuentes que no existen).

<!-- VISUAL_PENDIENTE -->
