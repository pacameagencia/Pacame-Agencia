# M3.L8 — Research-first cinemático · 5 datos antes de generar

> **Dura**: 14 min
> **Nivel progreso**: 49% → 51%
> **Requisito previo**: M3.L7

## Qué vas a sacar de aquí

Antes de generar cualquier video cinemático, investigas 5 datos verificables de una peli/director real. Tu prompt cita técnica concreta en lugar de "cinematic vibe". Resultado: piezas con look cine real, no genérico IA.

## El concepto (1 idea, no 5)

El 80% de prompts de video IA fallan porque empiezan con "cinematic shot, moody atmosphere, 4K, hyperrealistic". Eso no es prompt: es deseo abstracto. El modelo no sabe qué hacer con eso.

Prompt que SÍ funciona: cita técnica concreta de cine real.

**Research-first**: antes de tocar el modelo, recoges 5 datos verificables:

1. **Película / director referencia** · ej. "Drive 2011, dirigida por Nicolas Winding Refn".
2. **Cinematógrafo (DP)** · ej. "Newton Thomas Sigel".
3. **Lente / formato** · ej. "Arri Alexa con Cooke S4 35mm".
4. **LUT / color grading** · ej. "magentas elevados en sombras, teal en luces medias".
5. **Estructura / ritmo** · ej. "tomas largas estáticas, ritmo lento, dialog escaso".

Con 5 datos reales, tu prompt va de "cinematic shot" → "shot with Cooke S4 35mm, color graded with magenta lift in shadows like Drive 2011 by Newton Thomas Sigel, slow contemplative pacing".

El modelo IA entiende ese vocabulario. Lo ha visto en su training.

## El ejemplo real

**Caso real · concept dark-frames-005 antes y después de research-first**

**Versión v1 (sin research-first, falló):**
```
Cinematic shot of a person in a neon city, moody atmosphere,
hyperrealistic, 4K, dramatic lighting.
```
Output: genérico "estética Tron". Concept rechazado.

**Versión v2 (con research-first 5 datos, aprobado):**

Research:
- Peli: Blade Runner 2049 (2017).
- Director: Denis Villeneuve.
- DP: Roger Deakins.
- Lentes: Arri Master Prime 35mm.
- LUT: orange tungsten en interiores, cyan deep en sombras exteriores.
- Estructura: tomas estáticas largas, foreground/background nítidos.

Prompt v2:
```
Wide shot at 35mm, Roger Deakins style cinematography, person standing
mid-frame in a rain-wet neon-lit street, blade runner 2049 inspired
orange tungsten haze in foreground, deep cyan shadows behind. Static
framing, slight push in over 8 seconds. Color graded with Kodak Vision3
500T film stock emulation.
```

Output: cinemático Villeneuve-style real. Concept aprobado y publicado.

Diferencia: 5 datos reales = modelo entiende exactamente qué generar.

## El prompt copiable

Plantilla research-first (rellena antes de tocar Higgsfield/Seedance):

```
PIEZA: __________
TIPO: cinematic short / hero piece / reel

RESEARCH (5 datos verificables):

1. Peli/serie referencia:
   _____________________ (año _____)
   Por qué encaja: _____________________

2. Director / DP:
   _____________________

3. Lentes / formato:
   _____________________

4. LUT / color grading:
   _____________________ (describe en 1 frase)

5. Estructura / ritmo:
   _____________________

PROMPT FINAL (citando los 5 datos):
"_______________________________________"
```

Si no puedes responder los 5 (porque no investigaste), no generes. Investiga primero. 10 minutos en Letterboxd / IMDB / Vimeo te ahorran 2 horas de pruebas-y-error.

## Tu ejercicio (5 min)

Coge una pieza que vas a generar:

- [ ] Decide tipo: action, retrato, paisaje, anuncio.
- [ ] Busca 1 peli del último año que te inspira (Letterboxd top 250 si no se te ocurre).
- [ ] En IMDB busca: director, DP (cinematographer).
- [ ] En r/cinematography o en Google "Lens used in {peli}" averigua lentes.
- [ ] Describe el color grading en 1 frase mirando capturas (Vimeo, ImagesinFilm).

Tienes tus 5 datos. Tu próximo prompt va a citar esto.

## Quick-win

**Regla "0 prompts cinemáticos sin research"**: si te encuentras tirando un prompt cinemático sin haber rellenado los 5 datos, párate. Genera fallido. Cuesta créditos. Investiga primero. La regla es dura porque salva créditos.

## Si quieres profundizar

- [ ] M3.L9 · Encadenar video IA · start frame + last frame chaining
- [ ] M3.L10 · Workflow video completo · idea → shotlist → edición → publish
- [ ] `strategy/darkroom/studio-config/DARK-ROOM-REFERENCE.md` §9 (regla R6 + research-first)
- [ ] [Letterboxd](https://letterboxd.com), [ImagesinFilm](https://www.imagesinfilm.com), [r/cinematography](https://reddit.com/r/cinematography) (research fuentes)

---

**Visual**: `TODO: visual · brief: "formulario 5 campos verticales (peli / DP / lentes / LUT / ritmo) sobre fondo dark con cuadros para rellenar + ejemplo Blade Runner 2049 a la derecha · acento dorado · estilo brief técnico"`

**Quiz check**:
- Pregunta: "Quieres generar un cinematic short tipo 'Drive 2011'. ¿Cuál es el primer paso antes de abrir Higgsfield?"
- Opciones: Pensar el prompt mentalmente · Investigar 5 datos verificables (peli, DP, lentes, LUT, ritmo) · Generar 3 variations y elegir · Pedirle a ChatGPT que escriba el prompt.
- Correcta: Investigar 5 datos verificables.
- Explicación: research-first es regla dura Dark Academy. Sin los 5 datos, el prompt es deseo abstracto y el modelo no entiende. ChatGPT puede ayudar después de tener los datos.

<!-- VISUAL_PENDIENTE -->
