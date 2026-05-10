# M3.L2 — DaVinci Resolve · color grading que separa amateur de pro

> **Dura**: 14 min
> **Nivel progreso**: 37% → 39%
> **Requisito previo**: M3.L1

## Qué vas a sacar de aquí

Aplicas tu primer color grading cinemático a un clip de video. Diferencias "primary correction" (corregir lo que está mal) de "secondary grading" (estilo). Sabes leer Waveform + Vectorscope.

## El concepto (1 idea, no 5)

DaVinci Resolve es **gratis en su versión Free** y casi todo el cine de los últimos 10 años se ha coloreado ahí. La versión Studio (paga, 295€ one-time) añade: noise reduction temporal, herramientas IA, soporte 4K+ sin marca de agua.

Color grading tiene 2 fases:

1. **Primary correction** · arregla lo que está mal: exposición, balance de blancos, contraste. Equivalente a "ajustar levels" en Photoshop.
2. **Secondary grading** · aplica estilo: warm tones, cool shadows, LUT cine. Equivalente a "filtros Instagram pero serio".

NO empieces por la 2. La 1 es base. Si pones LUT cinemático sobre clip mal expuesto, el LUT no salva nada.

## El ejemplo real

**Caso · clip 4K bien grabado pero "plano" (sin look)**

Workflow DaVinci Free:

1. **Importa clip**: File → Import Media.
2. **Cambia a página Color** (abajo, panel "Color").
3. **Primary correction (Node 1)**:
   - Wheels: ajusta Lift (sombras), Gamma (tonos medios), Gain (luces).
   - Sube Gain hasta que las luces NO se quemen (mira Waveform · línea no debe pasar 100).
   - Baja Lift hasta que las sombras se vean ricas pero no aplastadas (Waveform línea no debe tocar 0 plana).
   - Balance White: usa color picker en algo que sepas que es blanco real (camiseta blanca, papel). Auto-corrige tinte azul/verde.
4. **Crea Node 2** (clic derecho en Node 1 → Add Serial Node).
5. **Secondary grading (Node 2)**:
   - Color Wheels: añade tinte. Ej. Lift hacia azul (sombras frías), Gain hacia naranja (luces cálidas). Esto es el clásico "teal & orange" de cine Hollywood.
   - Curves → Hue vs Sat: desatura los amarillos -15 (piel más natural).
   - Curves → Lum vs Sat: baja saturación de luces altas -10 (luces no se ven como neón).
6. **Aplica LUT cine (Node 3)**:
   - Effects → LUTs → Film Looks → "Kodak Portra" o similar.
   - Baja intensidad LUT a 60% (Gain Output node) para que no domine.
7. **Compara antes/después**: tecla N (toggle node) o split-screen.

Resultado: clip plano → clip con look cine. Tiempo: 10-15 min/clip si vas con plantilla.

## El prompt copiable

Plantilla "Kodak cinematic look" para clip estándar:

```
Node 1 · Primary
  Lift:   azul +3, magenta -2
  Gamma:  neutro
  Gain:   naranja +2, amarillo +1

Node 2 · Secondary
  HSL Hue vs Hue: amarillos hacia naranja
  HSL Hue vs Sat: amarillos -10, magentas -5
  Curves: lift sombras hacia azul (más frío)

Node 3 · LUT
  Kodak Portra al 60%
  o Cinestill 800T al 50%
```

Esto te da un look "Drive 2011" / "Blade Runner 2049" base. Iteras desde ahí.

## Tu ejercicio (5 min)

Importa 1 clip a DaVinci Free:

- [ ] Página Color · crea Node 1 + Node 2.
- [ ] En Node 1 ajusta Lift/Gamma/Gain para corregir exposición.
- [ ] En Node 2 aplica color wheels (lift azul + gain naranja).
- [ ] Compara antes/después con N.

Si no tienes DaVinci instalado: descárgalo gratis de [blackmagicdesign.com](https://www.blackmagicdesign.com). 4GB. La versión Free cubre 90% del uso.

## Quick-win

**Regla "Waveform > tus ojos"**: tu monitor miente (brillo, calibración, condiciones de luz). El Waveform (panel inferior DaVinci · monitor de luminancia) te dice la verdad. Si la línea blanca está en 100 (no encima), tu exposición es correcta sin importar lo que ven tus ojos.

## Si quieres profundizar

- [ ] M3.L3 · CapCut Pro · velocidad para feed vertical
- [ ] M3.L8 · Research-first cinemático · 5 datos antes de generar
- [ ] [DaVinci Resolve manual oficial](https://www.blackmagicdesign.com/products/davinciresolve/training) (PDF gratis, 400 pages, denso)

---

**Visual**: `TODO: visual · brief: "split-screen antes/después de un clip · izquierda flat · derecha con teal&orange grading · nodes panel anotado · fondo dark + acento dorado"`

**Quiz check**:
- Pregunta: "Aplicas LUT 'Kodak Portra' a un clip y se ve raro (caras verdosas). ¿Qué pasó?"
- Opciones: El LUT es malo · Te saltaste primary correction · El monitor no está calibrado · DaVinci tiene un bug.
- Correcta: Te saltaste primary correction.
- Explicación: LUT cinemático presupone que el clip ya tiene balance de blancos y exposición correctos. Si lo aplicas sobre un clip con tinte verde original, el LUT lo amplifica.

<!-- VISUAL_PENDIENTE -->
