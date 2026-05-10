# Dark Room · WOW References

> Piezas externas (academias / creators IA top / referencia cultural) que Pablo considera WOW. Sirven como punto de calibración para visual-reviewer y concept-reviewer.

## Cómo añadir una pieza reference

1. Crear archivo `wow-NN-slug.md` con el análisis estructurado (ver template abajo).
2. Si la pieza es descargable (mp4 / png) y <50MB, copiar a esta carpeta.
3. Si NO es descargable, dejar solo el archivo .md con `source_url` apuntando al link público.
4. Update `../BENCHMARKS-INDEX.md` añadiendo entrada con resumen 1 línea.

## Template de análisis

```yaml
pieza_id: wow-01-cinematic-influencer-airport
source_url: https://instagram.com/p/XXXXXX/
creator: "@creator_handle"
formato_canónico: 1-act
duración_exacta_s: 7.8
num_shots: 1
duración_por_shot: [7.8]
tipo_transiciones: []  # 1-act sin transitions
audio:
  música: synthwave 80s 78bpm F# minor (Suno-generated)
  voiceover: null
  sfx: ambient airport + footsteps + suitcase wheels
  license: Suno copyright-free
lens_references_identificables:
  - "Hoyte van Hoytema Tenet 2020 IMAX 70mm low angle"
  - "Roger Deakins BR2049 anamorphic flares"
motion_priority_dominante: camera
camera_arc: "Slow dolly-in from medium-wide to medium-tight over 7.8s"
subject_arc: "Walks 3 steps · turns head · stops · slight smirk"
por_qué_funciona_1_frase: |
  Una sola acción evolutiva en 8 segundos con motion fluido y referencia cinematográfica
  reconocible · cero cortes · audio anchor frame-perfect.

screenshots:
  - frame_0.png  # primer frame del shot
  - frame_50pct.png  # frame medio
  - frame_final.png  # último frame
```

## Status hoy

0 piezas registradas. Pablo: pasa 5-10 piezas reference cuando puedas.
