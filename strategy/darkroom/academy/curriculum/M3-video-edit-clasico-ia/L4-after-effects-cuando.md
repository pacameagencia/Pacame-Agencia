# M3.L4 — After Effects · cuándo lo necesitas (y cuándo no)

> **Dura**: 12 min
> **Nivel progreso**: 41% → 43%
> **Requisito previo**: M3.L3

## Qué vas a sacar de aquí

Reconoces los 3 casos donde After Effects es obligatorio y los 5 donde es overkill. Animas tu primer texto con keyframes. Evitas perder 6 horas en una pieza que Figma o CapCut resuelven en 30 min.

## El concepto (1 idea, no 5)

After Effects es para **motion graphics y compositing avanzado**. NO es para edición de video. La confusión entre "edición" y "motion" cuesta horas.

Cuándo SÍ After Effects:

1. **Logo animado** que se mueve, se compone con efectos, transita a otro elemento.
2. **Infografía animada** con gráficos que se construyen visualmente sobre el tiempo.
3. **VFX y compositing** · poner un elemento dentro de una escena (un objeto en mano de un actor, fuego, partículas).

Cuándo NO After Effects:

1. **Editar clip de video** (cortar, transitar) → Premiere o CapCut.
2. **Color grading** → DaVinci.
3. **Logo estático con un fade-in simple** → CapCut o Premiere lo resuelven.
4. **Subtitulado** → CapCut Auto Captions.
5. **Plantilla "lower third" rápida** → Premiere Essential Graphics.

After Effects tiene curva de aprendizaje brutal. No la inviertas si no vas a hacer motion graphics regular.

## El ejemplo real

**Caso real "logo animado para intro YouTube cliente"**

Cliente paga 300€ por intro de 5 segundos.

Sin After Effects (lo que NO haces):
- Premiere transición fade-in → demasiado simple, parece principiante.
- CapCut → no escala bien a horizontal HD profesional.

Con After Effects (el camino correcto):

1. Abre AE · New Composition 1920x1080, 30fps, 5 segundos.
2. **Importa el SVG del logo cliente**.
3. **Convierte a shapes** · clic derecho → Create Shapes from Vector Layer.
4. **Animación entrance** · cada path del logo aparece secuencialmente:
   - Property Scale: 0 al frame 0, 100 al frame 30.
   - Keyframes ease in/out.
   - Stagger 5 frames entre cada path (cada letra/elemento entra después que el anterior).
5. **Background**: shape layer fullscreen con gradiente cliente.
6. **Sonido**: importa whoosh + impacto stinger en momentos clave.
7. **Compose final**: render → File → Export → Add to Adobe Media Encoder → H.264 1080p.

Tiempo: 2-4 horas (depende de complejidad logo). Cliente paga 300€ contento porque el resultado parece profesional.

## El prompt copiable

Atajos After Effects esenciales primera semana:

```
Space          Reproducir/pausa
[ y ]          Recortar layer al frame actual
U              Mostrar todos los keyframes del layer seleccionado
S              Scale property visible
P              Position property visible
R              Rotation property visible
T              Opacity property visible
F9             Easy Ease (suaviza curva keyframes · uso constante)
Ctrl+M         Add to Render Queue
Ctrl+Alt+M     Add to Media Encoder (mejor para H.264)
```

`F9` (Easy Ease) es el atajo de oro: sin él, tus animaciones se ven robóticas. Con él, profesionales.

## Tu ejercicio (5 min)

Abre After Effects (si no lo tienes, [trial 7 días Adobe](https://www.adobe.com/products/aftereffects.html)):

- [ ] New Composition 1920x1080 5s.
- [ ] Crea texto "DARK ROOM" centrado.
- [ ] En layer · pulsa S (Scale) · keyframe en frame 0 a 0%, keyframe en frame 30 a 100%.
- [ ] Selecciona ambos keyframes · F9 (Easy Ease).
- [ ] Play.

Tienes tu primer texto animado con Easy Ease. La animación se siente "viva", no robótica.

## Quick-win

**Regla "templates antes que from-scratch"**: After Effects tiene cientos de plantillas premium en [Envato Elements](https://elements.envato.com), [Motion Array](https://motionarray.com), [Videohive](https://videohive.net). Para clientes con presupuesto bajo, descargas plantilla por 5-15€ y editas con su logo en 30 min. Cobras 200-400€. Margen sano.

## Si quieres profundizar

- [ ] M3.L5 · Topaz Video AI · salvar video baja resolución
- [ ] M3.L6 · Video IA · 5 modelos que importan en 2026
- [ ] [School of Motion](https://www.schoolofmotion.com) (la mejor academia AfterEffects, pago)

---

**Visual**: `TODO: visual · brief: "split comparison · izquierda animación robótica (sin Easy Ease) · derecha animación fluida (con Easy Ease) · curva keyframe panel visible · fondo dark + acento dorado"`

**Quiz check**:
- Pregunta: "Cliente pide 1 reel TikTok 15s con captions y música. ¿Premiere, CapCut o After Effects?"
- Opciones: After Effects · Premiere · CapCut · Cualquiera.
- Correcta: CapCut.
- Explicación: reel vertical corto con captions y música es exactamente lo que CapCut hace mejor. After Effects es overkill total y Premiere es más lento para este caso.

<!-- VISUAL_PENDIENTE -->
