# M1.L2 — El stack 2026 · qué herramienta para qué cosa

> **Dura**: 10 min
> **Nivel progreso**: 3% → 6%
> **Requisito previo**: M1.L1

## Qué vas a sacar de aquí

Tienes claro qué herramienta abrir según el resultado que buscas. Sabes diferenciar AUTHENTIC (iPhone-look) de CINEMATIC (cine real) y por qué importa esa distinción desde el primer prompt.

## El concepto (1 idea, no 5)

El stack creativo IA se organiza por **función + tier**, no por marca.

**Función**: imagen, video, voz, edición, publicación. Una herramienta sirve para una función. No mezcles.

**Tier** (clasificación interna Dark Room):

- **AUTHENTIC** · output iPhone-look. Útil para daily content, UGC, stories, reels casual. Higgsfield Soul + Soul Video + Kling. Coste bajo (batch unlimited en plan Plus).
- **CINEMATIC** · output cine real. Útil para hero pieces, anuncios, trailers, portfolio. Nano Banana Pro 2K + Seedance 2.0 + Cinematic Studio + Veo 3.1. Coste alto ($0.15-$1.20 por shot).
- **HYBRID** · base AUTHENTIC + substitución CINEMATIC. Útil cuando quieres calidad pero el daily no lo justifica. Flux + Kling + Topaz upscale.

Si tu prompt mezcla vocabularios ("shot on iPhone" + "shot on 70mm anamorphic") la pieza sale confusa. Una pieza = un tier.

## El ejemplo real

Calendario semanal típico Dark Room (10 piezas/semana):

| Slot | Pieza | Tier | Herramientas |
|---|---|---|---|
| Lunes story | UGC reflexión 5s | AUTHENTIC | Soul + Soul Video |
| Lunes feed | Carrusel 7 slides | AUTHENTIC | Nano Banana base + ChatGPT layout |
| Martes story | Behind-the-scenes 5s | AUTHENTIC | Soul Video directo |
| Miércoles feed | 1-act 8s cinemático | CINEMATIC | Nano Banana Pro 2K + Seedance 2.0 |
| Jueves story | Trend rápido 5s | AUTHENTIC | Soul + audio trending |
| Viernes feed | Hero pieza semana | CINEMATIC | Nano Banana 2K + Cinematic Studio V3 |
| Sábado story | Comunidad / pregunta | AUTHENTIC | Soul + texto overlay |
| Domingo feed | Reflexión / quote | AUTHENTIC | Soul + tipografía |

10 piezas. 6 AUTHENTIC + 2 CINEMATIC + 2 mixtas. Coste real: ~$8 de créditos en hero pieces, el resto unlimited.

## El prompt copiable

Decisión de tier rápida (3 preguntas):

```
¿Daily o hero?
  Daily → AUTHENTIC
  Hero  → CINEMATIC

¿Stories vertical 5s o feed 8s+?
  Stories vertical → AUTHENTIC iPhone
  Feed 8s+         → considera CINEMATIC

¿Cuántas piezas a la semana de este tipo?
  3+ por semana → AUTHENTIC (batch unlimited)
  1 por semana  → CINEMATIC vale la inversión
```

Pegáralo en una nota visible. La decisión sale en 10 segundos. Las pruebas-y-error con el modelo equivocado cuestan horas.

## Tu ejercicio (5 min)

Apunta en un papel o Notion las 3 últimas piezas que has publicado en RRSS personal o de cliente. Para cada una, anota:

- Función (imagen / video / carrusel)
- Tier que habrías usado (AUTHENTIC / CINEMATIC / HYBRID)
- Herramienta que sí usaste (puede ser cualquiera, incluso no-IA)
- Si el resultado hubiera mejorado con el tier correcto

No hay nota correcta. Es para que veas en qué tier vives ya y dónde estás invirtiendo créditos sin justificación.

## Quick-win

**Regla "una pieza, un tier"**: si te encuentras escribiendo "shot on iPhone" Y "shot on 70mm anamorphic" en el mismo prompt, párate. La pieza se confunde. Elige tier antes de escribir prompt, no después.

## Si quieres profundizar

- [ ] M1.L3 · Trabajar con nodos · concepto general (siguiente lección)
- [ ] Lead magnet M1 · Mapa del stack IA 2026 con 18 herramientas
- [ ] Referencia interna: `strategy/darkroom/studio-config/DARK-ROOM-REFERENCE.md` §3 (tier system completo + costes)

---

**Visual**: `TODO: visual · brief: "matriz 3x5 · filas=AUTHENTIC/CINEMATIC/HYBRID · columnas=Imagen/Video/Voz/Edición/Publicación · cada celda con 1-2 herramientas concretas · fondo dark + acento dorado en headers tier · estilo Notion table"`

**Quiz check**:
- Pregunta: "Quieres publicar una pieza hero el viernes (vista en feed permanente) sobre un cliente premium. ¿Qué tier?"
- Opciones: AUTHENTIC · CINEMATIC · HYBRID · Da igual si el prompt está bien.
- Correcta: CINEMATIC.
- Explicación: hero piece + feed permanente justifica la inversión cinemática. Nano Banana Pro 2K + Seedance 2.0 + Cinematic Studio V3.

<!-- VISUAL_PENDIENTE -->
