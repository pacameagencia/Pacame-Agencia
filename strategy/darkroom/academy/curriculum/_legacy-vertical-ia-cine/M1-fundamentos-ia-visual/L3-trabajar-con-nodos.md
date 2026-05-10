# M1.L3 — Trabajar con nodos · concepto general

> **Dura**: 12 min
> **Nivel progreso**: 6% → 9%
> **Requisito previo**: M1.L2

## Qué vas a sacar de aquí

Entiendes el patrón "input → modelo → output" que está debajo de toda IA visual. Sabes encadenar 2 herramientas (Higgsfield Soul → Nano Banana Pro) sin volverte loco. Reconoces cuándo te conviene un workflow node-based vs un chat clásico.

## El concepto (1 idea, no 5)

Toda IA visual funciona como un **circuito**: entrada → modelo → salida. La salida de uno alimenta la entrada del siguiente.

Tres formas de operar ese circuito:

1. **Chat clásico** (ChatGPT, Higgsfield default) · escribes un prompt, sale 1 imagen. Para iterar cambias el prompt. Bueno para empezar, lento para volumen.
2. **Node-based** (WeavyAI, ComfyUI, Krea workflows) · conectas cajitas en un lienzo. Cada cajita es un modelo. Bueno para volumen, curva de aprendizaje alta.
3. **API/SDK** (Higgsfield API, Replicate API, Nano Banana API) · llamas al modelo desde código. Bueno para automatización, requiere dev.

Para el alumno básico/medio: **Higgsfield directo (chat) + ChatGPT como ayudante de prompts**. Cubre el 90% de los casos. Los nodos los aprendes en M5 cuando necesites batch generation.

Lo que importa entender hoy: el output de una herramienta puede ser el input de la siguiente. Esa es la única regla.

## El ejemplo real

Workflow real de 30 segundos para una pieza con avatar consistente:

```
Higgsfield Soul
   ├─ Input: reference fotos tuyas (3-5)
   └─ Output: 1 imagen "tu avatar"
        │
        ▼
ChatGPT (asistente prompt)
   ├─ Input: "descríbeme escena cafetería matinal cinemática"
   └─ Output: prompt estructurado 5-step
        │
        ▼
Nano Banana Pro
   ├─ Input 1: imagen avatar
   ├─ Input 2: prompt 5-step + "replace background, keep face identical"
   └─ Output: imagen final
        │
        ▼
Descarga + publica
```

4 herramientas. 3 outputs intermedios. Tiempo total: ~3 minutos cuando ya tienes los inputs preparados.

## El prompt copiable

Plantilla mental para cualquier workflow nuevo:

```
Paso 1 · ¿Qué tengo de entrada?
       (foto, prompt texto, video referencia, otro output)

Paso 2 · ¿Qué necesito de salida?
       (imagen, video 5s, video 8s, asset editado)

Paso 3 · ¿Cuál es el camino más corto?
       (1 modelo · 2 modelos en cadena · 3 modelos · workflow nodos)

Paso 4 · ¿Qué se pierde en cada salto?
       (cara · consistencia outfit · LUT color · audio sync)
```

Cada salto cuesta. Si dos modelos pueden hacer la mitad del trabajo, uno solo es mejor. No encadenes 4 herramientas porque puedas. Encadena solo cuando ninguna sola te da el output completo.

## Tu ejercicio (5 min)

Coge tu última pieza publicada. Diagrama mentalmente (o en papel) cuál fue su circuito:

- Input inicial · ¿qué tenías al empezar?
- Modelos / herramientas · cuántas usaste, en qué orden.
- Output final · qué publicaste.

Ahora pregúntate: ¿podría haberlo hecho con 1 herramienta menos? La respuesta suele ser sí. Esa herramienta menos es tu próxima optimización.

## Quick-win

**Regla del último salto**: el output final mantiene la calidad del peor salto. Si tu cadena es Soul (10/10) → Nano Banana edit (9/10) → CapCut compress (5/10), tu pieza es 5/10. Optimiza el peor eslabón, no el mejor.

## Si quieres profundizar

- [ ] M1.L4 · Ajustes de generación en Higgsfield (siguiente)
- [ ] M5.L2 · Batch generation con nodos (avanzado, viene en módulo 5)
- [ ] Referencia interna: `strategy/darkroom/studio-config/DARK-ROOM-PLAYBOOK.md` §1 (Decision Tree formato)

---

**Visual**: `TODO: visual · brief: "diagrama de flujo 4 cajas conectadas verticalmente: Higgsfield Soul → ChatGPT → Nano Banana Pro → Descarga · cada caja con icono + nombre · flechas marcadas con label del output que viaja · fondo dark + acento dorado en flechas"`

**Quiz check**:
- Pregunta: "¿Cuándo te conviene saltarte el chat clásico y usar workflow node-based?"
- Opciones: Cuando quieres calidad cinemática · Cuando produces 20+ piezas similares en batch · Cuando tienes presupuesto alto · Siempre.
- Correcta: Cuando produces 20+ piezas similares en batch.
- Explicación: nodos amortizan la curva de aprendizaje solo en volumen. Para piezas únicas, el chat clásico es más rápido.

<!-- VISUAL_PENDIENTE -->
