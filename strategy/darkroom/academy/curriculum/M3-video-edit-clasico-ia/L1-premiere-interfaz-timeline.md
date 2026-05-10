# M3.L1 — Premiere Pro · interfaz, timeline, cortes básicos

> **Dura**: 14 min
> **Nivel progreso**: 35% → 37%
> **Requisito previo**: M2 cerrado (recomendado L10) o entrar directo si vienes de video

## Qué vas a sacar de aquí

Editas tu primer video corto (90-120s) en Premiere Pro: cortes, transiciones simples, audio. Conoces la interfaz lo suficiente para no rendirte a los 10 minutos.

## El concepto (1 idea, no 5)

Premiere tiene 4 paneles clave que vas a usar el 95% del tiempo:

1. **Project Panel (izquierda)** · donde están tus clips importados (raw video, audio, fotos).
2. **Source Monitor (centro arriba izq)** · previsualizar clips antes de meterlos a timeline.
3. **Program Monitor (centro arriba der)** · ver lo que pasa en la timeline (output final).
4. **Timeline (abajo)** · donde montas el video. Capas de video + audio paralelas.

El resto (Effects, Lumetri Color, Audio Mixer) lo abres cuando lo necesites. No te abrumes con la interfaz default. Configura workspace "Editing" y olvida el resto.

## El ejemplo real

**Caso · cliente envía 10 clips móvil de un evento, quiere reel 60s para Instagram**

Workflow Premiere:

1. **Nuevo proyecto** · File → New → Project · 1920x1080, 30fps, ProRes 422 (calidad cliente final).
2. **Importa clips** · File → Import → selecciona los 10 (mp4 / mov del móvil).
3. **Previsualiza en Source Monitor**: doble clic clip → marcador IN (tecla I) en frame inicio → marcador OUT (tecla O) en frame fin del trozo útil.
4. **Drag a Timeline**: arrastra el clip recortado al track Video 1.
5. **Repite con los siguientes clips** · ajusta tiempos a 5-6 segundos por clip (para 10 clips = 60s aprox).
6. **Cortes**: en timeline, herramienta Razor (C) corta donde quieras. Borra trozos sobrantes.
7. **Transiciones simples**: clic derecho entre 2 clips → Apply Default Transition (cross dissolve 0.5s). NO añadas más.
8. **Audio**: si grabaron audio ambiente, lo pones en Audio 1 a -12dB. Si necesitas música, importa MP3, ponla en Audio 2 a -18dB (debajo del ambiente).
9. **Captions**: ventana Text (T) → "captions auto" si Adobe lo detecta · ajusta tipografía.
10. **Export**: File → Export → Media · H.264 · Match Source 1080p · entregable mp4 ~30-80 MB.

Tiempo total: 1.5-2 horas. Cliente paga 200-400€ por este tipo de reel evento.

## El prompt copiable

Atajos Premiere primera semana:

```
V              Selection tool
C              Razor (cortar)
A              Track select forward (mover todo de un lado)
I              Marcar IN (en clip o timeline)
O              Marcar OUT
J K L          Reproducir reverso / pausa / forward (J pulsado x2 = 2x speed)
Ctrl+K         Cut at playhead (corte rápido sin Razor)
Shift+Delete   Ripple delete (borrar y cerrar gap)
Q              Trim from start (recorta hasta el playhead)
W              Trim to end (recorta desde el playhead)
Ctrl+M         Open Export
+/-            Zoom timeline
\              Ajustar timeline a ventana
```

`Q` y `W` son mágicos: cortas trozos sin necesidad de Razor. Memorízalos.

## Tu ejercicio (5 min)

Abre Premiere. Importa 2 videos cortos (móvil vale):

- [ ] Crea proyecto 1080p 30fps.
- [ ] Previsualiza un clip en Source · marca I y O.
- [ ] Arrastra a timeline.
- [ ] Corta a la mitad con C (Razor) y borra una mitad.
- [ ] Añade clip 2 después · aplica cross dissolve entre los dos.
- [ ] Export a mp4.

Si lo haces en 10 min, Premiere ya no te asusta.

## Quick-win

**Regla "proxies para video 4K en máquina modesta"**: si tu portátil no es M-series Apple ni gaming PC reciente, Premiere se va a arrastrar con 4K. Crea **proxies** (File → New → Proxies) que generan versiones baja resolución para editar fluido. Cuando exportas, usa el original 4K. Es el truco que separa el "Premiere se cuelga" del "Premiere fluido".

## Si quieres profundizar

- [ ] M3.L2 · DaVinci Resolve · color grading que separa amateur de pro
- [ ] M3.L3 · CapCut Pro · velocidad para feed vertical (si trabajas más reels)
- [ ] [Premiere Pro tutorials oficiales](https://helpx.adobe.com/premiere-pro/tutorials.html)

---

**Visual**: `TODO: visual · brief: "screenshot Premiere con 4 paneles anotados (Project / Source / Program / Timeline) · números 1-4 en círculos dorados · estilo screenshot anotado"`

**Quiz check**:
- Pregunta: "Tu portátil se cuelga editando 4K en Premiere. ¿Qué solución pruebas primero?"
- Opciones: Comprar PC nuevo · Crear proxies · Bajar calidad export · Cerrar otras apps.
- Correcta: Crear proxies.
- Explicación: proxies generan versiones baja-res para editar fluido y usan el 4K solo al exportar. Solución gratis dentro de Premiere.

<!-- VISUAL_PENDIENTE -->
