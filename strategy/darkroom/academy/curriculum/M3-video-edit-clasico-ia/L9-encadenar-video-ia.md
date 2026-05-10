# M3.L9 — Encadenar video IA · start frame + last frame chaining

> **Dura**: 14 min
> **Nivel progreso**: 51% → 53%
> **Requisito previo**: M3.L8

## Qué vas a sacar de aquí

Generas un 2-act 14s con dos shots encadenados sin saltos visibles. Entiendes la regla R5 ("video premium: last frame generado + start image pasado al shot siguiente"). Evitas el "cut feo" que delata pieza IA mediocre.

## El concepto (1 idea, no 5)

Para 2-act y 3-act IA, el problema técnico clave es la **transición entre shots**. Si shot 1 acaba con tu personaje a la izquierda mirando al cielo, y shot 2 abre con el mismo personaje a la derecha mirando al suelo, hay "jump cut" feo.

Solución: **last frame chaining**.

1. Generas el shot 1 (ej. 6 segundos).
2. Extraes el **último frame** del shot 1 (PNG congelado del frame N=180 si es 30fps × 6s).
3. Pasas ese último frame como **start image** del shot 2.
4. Generas el shot 2 (6 segundos) usando ese frame como punto de partida.

Resultado: shot 2 abre exactamente donde acabó shot 1. Cero salto visual.

Esto requiere modelo que acepte "start image" como input. Cinematic Studio Video V3 lo hace nativo. Seedance 2.0 también. Higgsfield Soul Video v3+ también.

## El ejemplo real

**Caso · 2-act 14s cliente fitness · persona corriendo en parque + close-up cara sudando**

Workflow Cinematic Studio Video V3:

1. **Generar shot 1 (7s)**:
   ```
   Wide shot of athlete running through park at golden hour,
   dynamic tracking shot following from behind, cinematic 35mm,
   inspired by Roger Deakins Dunkirk pacing.
   ```
2. **Descargar shot 1**.
3. **Extraer último frame** · en Cinematic Studio hay botón "Extract Last Frame" → PNG.
4. **Generar shot 2 (7s) con start image**:
   - Sube el PNG último frame de shot 1.
   - Prompt:
     ```
     Match cut to close-up of same athlete's face, sweat dripping,
     intense focused expression, slow push in over 7 seconds.
     Same lighting and color as previous shot (golden hour, warm tones).
     ```
5. **Concatenar en Premiere**: shot 1 + shot 2 = 14s totales sin cut visible.
6. **Audio**: respiración sincronizada + música subiendo intensidad.
7. **Export**.

Resultado: 2-act 14s con flujo continuo. Cliente paga 300-500€ por la pieza.

## El prompt copiable

Template chain 2-act:

```
SHOT 1 (start)
  Type: wide / medium / close-up
  Subject: __________
  Action: __________
  Camera: __________
  Duration: 6-8 segundos

[ ↓ Extract last frame → start image shot 2 ]

SHOT 2 (end)
  Start image: último frame shot 1 (forzar continuidad)
  Type: contrast a shot 1 (si shot 1 wide → shot 2 close-up)
  Action: continuación lógica de shot 1
  Camera: contrasta movimiento
  Match: "same lighting and color tone as previous shot"
  Duration: 6-8 segundos
```

## Tu ejercicio (5 min)

Si tienes acceso a Cinematic Studio V3 o Seedance:

- [ ] Genera shot 1 simple (6s acción cualquiera).
- [ ] Extrae último frame.
- [ ] Genera shot 2 (6s) con ese frame como start.
- [ ] Concatena en Premiere o CapCut.

Si no tienes presupuesto: lee el ejemplo y entiende el concepto. Lo aplicarás cuando tengas acceso.

## Quick-win

**Regla "los PNGs intermedios viven en carpeta cliente"**: cuando trabajas con chaining, los frames intermedios son assets críticos. Guárdalos en `/CLI-NombreCliente/03-trabajo/chain-frames/`. Si más adelante el cliente pide cambiar shot 2, vuelves al frame correcto sin re-generar shot 1.

## Si quieres profundizar

- [ ] M3.L10 · Workflow video completo · idea → shotlist → edición → publish (cierra M3)
- [ ] Lead magnet M3 · Decision Tree video (PDF)
- [ ] `strategy/darkroom/studio-config/DARK-ROOM-REFERENCE.md` §7 (Frame-to-Frame Continuity)

---

**Visual**: `TODO: visual · brief: "diagrama horizontal · Shot 1 → última frame PNG → Shot 2 · 3 thumbnails de los frames clave con flechas conectoras doradas · fondo dark + estilo storyboard pro"`

**Quiz check**:
- Pregunta: "Generas un 2-act y entre shot 1 y shot 2 hay jump-cut feo. ¿Cuál es la causa más probable?"
- Opciones: El prompt está mal · No pasaste el último frame de shot 1 como start image de shot 2 · El modelo IA es malo · El audio no encaja.
- Correcta: No pasaste el último frame de shot 1 como start image de shot 2.
- Explicación: chaining requiere conectar shots compartiendo último frame de A = start frame de B. Sin eso, el modelo IA recompone desde cero y produce jump cut.

<!-- VISUAL_PENDIENTE -->
