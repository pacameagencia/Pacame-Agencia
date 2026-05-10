# M3.L5 — Topaz Video AI · salvar video baja resolución

> **Dura**: 10 min
> **Nivel progreso**: 43% → 45%
> **Requisito previo**: M3.L4

## Qué vas a sacar de aquí

Salvas un clip 720p / pixelado / shake-cam con un upscale a 4K limpio. Reconoces los 3 casos donde Topaz vale 299€ y los 3 donde tirar dinero.

## El concepto (1 idea, no 5)

Topaz Video AI es **upscale + denoise + interpolación** con modelos IA dedicados. Compra one-time (sin suscripción), 299€.

3 cosas que hace mejor que cualquier alternativa:

1. **Upscale 720p → 4K** con detalle real. No es resampling tonto. Reconstruye detalle plausible.
2. **Denoise** · elimina ruido de video grabado con poca luz (ISO alto cámara móvil).
3. **Interpolación 30fps → 60fps** · genera frames intermedios suaves (ideal slow motion artificial).

Cuándo NO usarlo:

1. **Video original 4K bien grabado** · no hay nada que mejorar, evita gasto cómputo.
2. **Reel social efímero <24h** · nadie va a notar la diferencia en un story.
3. **Cliente con presupuesto <100€** · el tiempo de cómputo (1-3 horas por minuto de video) no se amortiza.

## El ejemplo real

**Caso · cliente quiere usar un clip viejo 720p (2018 cámara móvil) en un anuncio Meta Ads. Necesita verse decente en 1080p+**

Workflow Topaz Video AI:

1. **Abre Topaz Video AI** → Open File → selecciona el clip 720p.
2. **Preview**: el panel central muestra antes/después en tiempo real con configuración default.
3. **Settings recomendados**:
   - **AI Model**: "Proteus" (general purpose) o "Iris MQ" (caras humanas).
   - **Output Resolution**: 1920x1080 (Full HD) o 3840x2160 (4K).
   - **Frame Rate**: dejar nativo (no interpolar a 60fps a menos que quieras slow-mo).
   - **Denoise**: nivel 30-50 según ruido del original.
4. **Preview en segmento corto** (5s) antes de procesar todo el clip.
5. **Process** · puede tardar 10-30 min por minuto de video según tu GPU.
6. **Export**: ProRes 422 para máxima calidad output, o H.264 si vas a publicar directo.

Resultado: clip 720p ruidoso → clip 1080p limpio. Cliente paga 80-150€ por la "remasterización".

## El prompt copiable

3 presets Topaz Video AI que cubren 90% de casos:

```
Caso 1 · "Móvil viejo 720p a 1080p"
  AI Model: Proteus
  Resolution: 1920x1080
  Denoise: 35
  Sharpen: 20

Caso 2 · "Cámara con ruido nocturno (alto ISO)"
  AI Model: Nyx (specialized denoise)
  Resolution: nativo (no upscale)
  Denoise: 60-80
  Detail Recovery: 40

Caso 3 · "Slow motion artificial (30fps → 60fps)"
  AI Model: Apollo (frame interpolation)
  Frame Rate: 60fps
  Smoothing: medium
```

## Tu ejercicio (5 min)

Si tienes Topaz Video AI (trial gratis 14 días):

- [ ] Abre un clip viejo 720p.
- [ ] Aplica preset "Proteus 1080p Denoise 35".
- [ ] Preview 5 segundos.
- [ ] Compara antes/después.

Si no tienes Topaz: anota mentalmente cuándo lo usarías. Compra solo si tienes 2-3 proyectos al mes que lo justifiquen. Si no, salta esta lección.

## Quick-win

**Regla "Topaz es para producción, no para edición rápida"**: nunca pongas Topaz como paso intermedio mientras editas. El cómputo es lento (horas por minuto). Lo usas SOLO al final, sobre el master editado, antes de exportar entrega final.

## Si quieres profundizar

- [ ] M3.L6 · Video IA · 5 modelos que importan en 2026
- [ ] M3.L7 · Decision Tree formato
- [ ] [Topaz Video AI página oficial](https://www.topazlabs.com/video-ai) (trial 14 días)

---

**Visual**: `TODO: visual · brief: "split-screen antes/después · izquierda clip 720p con ruido · derecha clip 1080p limpio post-Topaz · etiqueta de configuración Proteus + Denoise · fondo dark"`

**Quiz check**:
- Pregunta: "Cliente envía reel 15s ya grabado en 4K bien expuesto para Instagram. ¿Pasas por Topaz?"
- Opciones: Sí, mejora todo · No, está bien grabado · Solo el denoise · Depende del cliente.
- Correcta: No, está bien grabado.
- Explicación: Topaz consume horas de cómputo. Sobre material 4K bien grabado, la mejora marginal no justifica el tiempo. Reserva Topaz para material que necesita salvación real.

<!-- VISUAL_PENDIENTE -->
