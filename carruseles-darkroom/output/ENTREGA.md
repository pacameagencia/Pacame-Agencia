# Dark Room · Entrega 3 carruseles Instagram

> 30 PNG · 1080×1350 (4:5 feed) · Listos para subir.

---

## Estructura

```
output/
 ├── carrusel-1-factura/   (10 slides) · Dolor económico / AIDA puro
 ├── carrusel-2-stack/     (10 slides) · Lista aspiracional stack creador
 └── carrusel-3-ilegal/    (10 slides) · Contrarian + FAQ objeciones
```

Cada carpeta contiene `C{n}-S01.png` a `C{n}-S10.png`. **Subir en ese orden** (S01 primero, S10 último).

---

## Estrategia de publicación (sugerencia)

**No subir los 3 el mismo día.** Separar 48-72 h entre uno y otro para:
1. Ver cuál retiene más (el algoritmo decide en las primeras 2 h).
2. No saturar la audiencia con el mismo mensaje.

**Orden recomendado:**

| Día | Carrusel | Por qué |
|---|---|---|
| D0 | **C1 · Factura** | Hook más duro (pregunta dinero). Mide el engagement de entrada del perfil. |
| D2 | **C2 · Stack** | Menos agresivo, más aspiracional. Recoge a los que dudaron en C1. |
| D4 | **C3 · Ilegal** | Contrarian. Sólo funciona si C1/C2 ya generaron audiencia mínima. |

**Hora**: entre 19:00-21:00 España (picos de scroll en IG feed).

---

## Caption · Carrusel 1 · "La factura"

```
¿Cuánto pagas al año en inteligencia artificial?

No estimes. Suma. La mayoría de creadores y emprendedores están pagando más de 3.500 € al año repartidos en cuotas de 20, 22, 49 € que ni ven pasar.

Yo también. Hasta que hice la cuenta.

12 herramientas premium (ChatGPT, Claude, Gemini, Canva, CapCut, Freepik, ElevenLabs, Higgsfield, Minea, Dropsip, PiPiAds, Seedance). Total oficial: 308 €/mes.

Dark Room te da las 12 por 24,90 €/mes. O 349 € pago único para toda la vida.

En 35 días ya has amortizado el lifetime. El resto: gratis.

El link lo tienes en la bio. Abre la puerta.

—

#IA #HerramientasIA #ChatGPT #Claude #Canva #CapCut #Freepik #ElevenLabs #CreadorDeContenido #MarketingDigital #Emprendedor #AhorroDigital #StackCreador #InteligenciaArtificial #DarkRoom #IA2026 #Dropshipping #AIToolkit #FreelanceLife #Contenido
```

---

## Caption · Carrusel 2 · "Stack Creador 2026"

```
Éste es el stack que uso para crear contenido en 2026.

12 herramientas. Todas premium. Todas en un solo sitio.

→ ESCRIBIR · ChatGPT Plus · Claude Pro · Gemini Advanced
→ DISEÑAR · Canva Pro · CapCut Pro · Freepik Premium+
→ GENERAR · Higgsfield · Seedance · ElevenLabs
→ VENDER · Minea · Dropsip · PiPiAds

Si lo pagas por separado: 308 €/mes.

Lo tengo en Dark Room por 24,90 €/mes. O 349 € lifetime y ya no pago más.

0,83 € al día por el mismo stack que usan las cuentas que facturan en serio.

darkroomcreative.cloud · Link en bio.

—

#StackCreador #CreadorDeContenido #ChatGPT #Canva #CapCut #Freepik #ElevenLabs #HerramientasIA #Dropshipping #Minea #PiPiAds #Seedance #Higgsfield #MarketingDigital #IA2026 #DarkRoom #ContentCreator #DigitalMarketing #Emprendedor #Productividad
```

---

## Caption · Carrusel 3 · "Esto debería ser ilegal"

```
Si las empresas de IA leen esto, me banean.

12 herramientas premium por 24,90 €/mes. O 349 € pago único para toda la vida.

Las objeciones antes de que preguntes:

· ¿Es legal? Sí. Licencias multi-usuario legítimas. Group buy de toda la vida.
· ¿Va lento? No. Infra escalada en Europa, sesión propia por usuario.
· ¿Y si una herramienta cambia su política? Entra otra equivalente. Sin coste extra.
· ¿Soporte? Discord 24/7 + WhatsApp. Respuesta media <15 min.
· ¿Lifetime es lifetime? Sí. Contrato por escrito antes de pagar.
· ¿Por qué tan barato? Volumen. 1.000 usuarios × 24,90 € cubren el coste real.

Al llegar a 500 lifetime sube a 499 €. Hoy seguimos a 349 €.

darkroomcreative.cloud · Link en bio.

—

#IA #ChatGPT #Claude #HerramientasIA #AhorroDigital #Dropshipping #Creadores #Freelance #MarketingDigital #GroupBuy #IA2026 #DarkRoom #ContenidoDigital #CreadorDeContenido #InteligenciaArtificial #Emprendedores #CostesDigitales #Stack #AIToolkit #ContentCreator
```

---

## Notas de producción

**Paleta**: negro profundo `#0A0A0A` · verde ácido neón `#CFFF00` · rojo tachado `#FF3B3B` · blanco roto `#F2F2F2`.

**Tipografía**: Anton (titulares) · Space Grotesk (cuerpo) · JetBrains Mono (precios / contador).

**Tamaño**: 1080×1350 px (4:5 · formato feed IG óptimo para retención).

**Brand mark**: "DARK ROOM" en esquina superior derecha de cada slide.

**Contador**: `C1 · 01/10` en esquina inferior izquierda (señala al usuario cuánto queda para que siga).

---

## Si rinde bien → siguiente iteración

Cuando desbloquees billing (OpenAI o Google AI Studio paid), en 2 minutos genero 6 backgrounds editoriales cinemáticos (mesa con tickets, puerta con neón verde, billetes cayendo, escritorio creador, cinta amarilla hazard, reloj LED rojo) y sustituyo los fondos negros puros de las 12 slides hero de cada carrusel. Efecto WOW sube un escalón.

Coste estimado: **0,30-0,50 €** totales.

---

## Archivos

- `01-MASTER-BRIEF.md` → estrategia + copy + briefs visuales originales.
- `compose-slides.mjs` → generador (si quieres cambiar un copy, editas y vuelves a lanzar).
- `generate-backgrounds.mjs` (OpenAI) + `generate-backgrounds-gemini.mjs` (Google) → generadores de fondos IA, listos para ejecutar cuando haya billing.
- `fonts/` → 5 TTF embebidas vía opentype.js (render pixel-perfect sin depender del sistema).
- `output/carrusel-{1,2,3}-*/` → los 30 PNG finales listos para subir.

**Última revisión**: 2026-04-24.
