# Checklist Three-Pass Review · 26 markers anti-AI-look

> **Dark Academy** — Lead magnet del Módulo 4
> Imprime. Pega al monitor. Aplica antes de publicar cualquier pieza IA.

---

## Por qué este checklist existe

El 90% de cursos de IA te enseñan a generar. Te dejan publicar sin filtro. Resultado: feed lleno de piezas con manos de 6 dedos, ojos asimétricos, sombras imposibles. La audiencia detecta la IA en 2 segundos. Tu marca queda como "amateur".

Three-Pass Review es el filtro Dark Room que aplicamos antes de publicar TODA pieza IA. 26 markers. 5 minutos. Pieza pasa o se queda en cajón.

---

## Pass 1 · Anatomía (10 markers)

| # | Marker | Qué buscar |
|---|---|---|
| 1 | **Manos** | 5 dedos cada mano · proporciones correctas · no fundidas con objeto |
| 2 | **Ojos** | Simétricos · mismo color iris · no bizcos · no flotando en cara |
| 3 | **Orejas** | Ambas presentes · mismo tamaño · misma altura |
| 4 | **Cuello + clavícula** | Proporcionados al rostro · sin "extras" |
| 5 | **Dientes** | Número correcto (32 humano) · no doble fila · no mezclados con labios |
| 6 | **Pelo** | Raíz nace de cuero cabelludo · no "flotando" · no atravesando ropa |
| 7 | **Pies / zapatos** | 2 pies completos · mismo modelo zapato · talón visible |
| 8 | **Joyas / accesorios** | Gafas 2 patillas · anillos en dedos correctos · relojes con esfera completa |
| 9 | **Posturas** | Articulaciones doblan en dirección anatómicamente posible |
| 10 | **Logos / texto** | Si hay texto en ropa o productos, legible (sin letras inventadas) |

---

## Pass 2 · Física (10 markers)

| # | Marker | Qué buscar |
|---|---|---|
| 11 | **Dirección de luz** | Una sola fuente principal · sombras coherentes con esa fuente |
| 12 | **Sombras de contacto** | Donde algo toca superficie, hay sombra de contacto |
| 13 | **Reflejos** | Espejo o agua · reflejo coherente con sujeto y ángulo |
| 14 | **Profundidad de campo** | Si sujeto enfocado, fondo consistentemente desenfocado |
| 15 | **Materiales** | Tela parece tela · metal parece metal · piel parece piel |
| 16 | **Texturas escala** | Textura proporcional al tamaño del objeto |
| 17 | **Iluminación interior/exterior** | Ventanas dejan entrar luz coherente con hora del día |
| 18 | **Color temperatura** | Luz cálida coherente con golden hour, fría con noche |
| 19 | **Ruido / grano** | Si pretende ser cine, tiene grano realista (no liso plástico) |
| 20 | **Bordes de objetos** | Transiciones según material · no halos artificiales |

---

## Pass 3 · Coherencia narrativa (6 markers)

| # | Marker | Qué buscar |
|---|---|---|
| 21 | **Vestuario coherente** | Ropa adecuada al lugar y momento |
| 22 | **Atributos personaje consistentes** | Soul Character mantiene edad / etnia / features declaradas |
| 23 | **Continuidad temporal** | 2-act/3-act · outfit no cambia entre shots sin justificación |
| 24 | **Stage props consistentes** | Taza en mesa al inicio sigue ahí al final |
| 25 | **Iluminación entre shots** | No salta de golden hour a noche sin transición narrativa |
| 26 | **Mensaje vs visual** | Caption "calma matinal" + pieza estridente = disonancia |

---

## Cómo aplicar Three-Pass Review

### Score

```
TOTAL: __/26 markers OK

≥24 → PUBLICA
20-23 → ITERA (vuelve a generar con prompt ajustado en markers fallidos)
<20 → REJECT (no salvable, empieza de cero · regla K1)
```

### Las 3 reglas duras del review

1. **Regla K1 · NO editar imagen mala intentando salvarla**.
   Si <20 markers OK, no la corrijas en Photoshop. Regenera desde cero. Editar mala = perder 30 min y salir igual de mal.

2. **Manos primero**.
   El marker #1 (manos) es el que más delata IA. Si las manos fallan, ningún otro marker corregido salva la pieza.

3. **Iteración con prompt específico, no genérico**.
   Si fallan markers 11-13 (luz / sombras / reflejos), tu nuevo prompt debe especificar luz concreta: "soft side light from camera left, hard contact shadows under feet, no reflection on glass surface".

---

## Pieza que pasa Three-Pass Review · ejemplo real

**Pieza**: retrato cinematic de Pablo en café Madrid · Soul Character + Nano Banana Pro.

Score: **25/26**.

- Pass 1: 10/10 OK.
- Pass 2: 9/10 OK · falla #18 (color temperatura golden hour ligeramente fría · iteración menor en LUT lo arregló).
- Pass 3: 6/6 OK.

Publicada en feed @darkroomcreative.cloud. Audiencia no detectó "IA". Cliente vio referencia y pidió 3 similares.

---

## El error del 80% de creadores IA

Generan pieza, la suben "porque está aceptable". Audiencia detecta IA. Engagement bajo. Atribuyen al algoritmo.

Realidad: audiencia detecta y rechaza piezas con score <22. Lo que parece "algoritmo malo" es "pieza no pasa Three-Pass Review".

Aplicar 5 minutos de filtro por pieza ahorra meses de "por qué no funciona el contenido IA".

---

## Qué viene después

Module 4 (que cierras si has llegado a este lead magnet) cubre IA generativa. Quedan:

- **Module 5 · E-commerce y dropshipping** (7 lecciones) · monetiza con tienda online.
- **Module 6 · Marketing y monetización** (8 lecciones) · capta clientes con ads + funnels + copy.

**Dark Academy · M5 o M6.**
[Continúa con la academia →](https://darkroomcreative.cloud/academia)

---

<sub>Checklist actualizado: mayo 2026 · Dark Academy · darkroomcreative.cloud · Si los modelos IA mejoran y un marker queda obsoleto, lo retiramos.</sub>

---

## Notas de producción (no van en el PDF público)

- **Formato final**: PDF 1 página A4 vertical · checklist 3 columnas (Pass 1/2/3) con checkboxes · score box al pie · fondo Dark Room dark + acento dorado · tipografía monospace para markers.
- **Asset destino**: bucket Supabase Storage `academy-public/lm-m4-three-pass-review.pdf`.
- **Anti-plagio**: cero copy-paste. Los 26 markers son curaduría Dark Room original basada en errores observados en producción real (concepts 001-009).

<!-- VISUAL_PENDIENTE -->
