# M4.L4 — ChatGPT + Claude · IA texto en tu workflow

> **Dura**: 12 min
> **Nivel progreso**: 61% → 63%
> **Requisito previo**: M4.L3

## Qué vas a sacar de aquí

Usas ChatGPT + Claude como ayudante para briefs, copy, prompts cinemáticos y captions. Sabes qué pedirle a cada uno (no son intercambiables al 100%). Generas tu primer briefing estructurado en 5 minutos.

## El concepto (1 idea, no 5)

ChatGPT (GPT-5) y Claude (Sonnet 4.6) son las 2 IAs texto premium 2026. Diferencias prácticas:

- **ChatGPT** · más rápido, mejor en imagen integrada, plugin store, GPT custom (custom GPTs guardables).
- **Claude** · mejor en textos largos coherentes, contexto extenso (1M tokens), mejor en código.

Para freelance creativo:

- **Brief de proyecto** · Claude (estructura larga coherente).
- **Copy para web/social** · ambos · Claude tiende a sonar menos "ChatGPT-AI", ChatGPT más rápido.
- **Prompt cinemático para Higgsfield/Seedance** · ChatGPT (más entrenado en jerga visual).
- **Caption Instagram** · ChatGPT con Custom GPT propio.
- **Email funnel** · Claude (continuidad tono a lo largo de 5 emails).
- **Análisis competencia** · Claude (manejar grandes documentos).

Regla: ChatGPT para "rápido y visual", Claude para "estructura larga y código".

## El ejemplo real

**Caso · cliente envía brief verbal por WhatsApp, necesitas pasarlo a brief estructurado**

Workflow con Claude:

Prompt a Claude:
```
Te paso transcripción de una llamada con cliente. Conviértela en
brief estructurado markdown con secciones: Cliente, Producto,
Audiencia, Tono, Entregables, Fechas clave, Presupuesto, Anti-scope
(qué NO entra), Notas. Mantén el lenguaje conciso. No inventes datos
que no estén en la transcripción · si falta info marca [PENDIENTE].

[Transcripción]
"Llamé con cliente Marta, tiene una marca de productos para bebé,
quiere relanzamiento web y carrusel mensual instagram. Habló de
necesitarlo antes del Black Friday. No tiene presupuesto fijo
pero mencionó que pagaba 800€ al diseñador anterior por carrusel
mensual. Quiere foto producto premium y tono cercano de madre a
madre. No quiere usar fotos de stock. Tiene logo y paleta de la
marca pero no usa Figma..."
```

Claude responde con brief markdown listo para pegar en `/CLI-Marta/01-brief/brief.md`. 30 segundos vs 30 minutos a mano.

**Caso · prompt cinemático para Seedance**

Prompt a ChatGPT:
```
Necesito prompt cinemático Seedance 2.0 para escena 8s · close-up
de manos abriendo una caja de joyería. Estilo: cinema oscuro,
inspirado en "House of Gucci" 2021. Devuelve prompt estructurado
en formato DoP: subject + setting + camera + look. Cita técnica
real (lente, LUT). Cero adjetivos vacíos.
```

ChatGPT te devuelve prompt cinemático estructurado citando técnica real (35mm anamorphic, Cinestill 800T LUT, etc.).

## El prompt copiable

3 prompts maestros para usar con ChatGPT/Claude (memoriza estos):

```
1. Brief desde transcripción (Claude):
   "Convierte transcripción cliente en brief markdown estructurado:
   Cliente / Producto / Audiencia / Tono / Entregables / Fechas /
   Presupuesto / Anti-scope / Notas. No inventes datos.
   Marca [PENDIENTE] si falta info. Transcripción: [pega aquí]"

2. Copy hero web (ChatGPT):
   "Escribe 3 versiones hero copy para [sector] con tono [adjetivo].
   Estructura: H1 (≤8 palabras) + Sub (≤25 palabras) + CTA (≤4 palabras).
   Cero superlativos vacíos. Cero palabras IA-trilladas
   (desbloquea, transformador, revolucionario). 3 versiones distintas."

3. Prompt cinemático para Higgsfield/Seedance (ChatGPT):
   "Convierte esta idea visual en prompt cinemático Higgsfield Nano
   Banana Pro · estructura DoP: subject + setting + camera/lens +
   look/LUT. Cita técnica real (lente, director, LUT). Cero adjetivos
   vacíos. Idea: [tu idea]"
```

Pega estos 3 prompts en tu Notion "Banco de prompts maestros". Los reutilizas miles de veces.

## Tu ejercicio (5 min)

- [ ] Coge tu último brief (o invéntalo): pide a Claude que lo estructure como brief markdown.
- [ ] Pide a ChatGPT 3 versiones hero copy para tu marca o cliente.
- [ ] Pide a ChatGPT 1 prompt cinemático para una pieza que vas a generar.

Compara: ¿Claude estructura mejor el brief largo? ¿ChatGPT da mejor prompt cinemático visual? Confirma o ajusta tu uso de cada uno.

## Quick-win

**Regla "Custom GPT propio Dark Academy"**: en ChatGPT puedes crear "Custom GPT" con instrucciones permanentes. Crea uno con: voz Dark Academy + palabras prohibidas + estructura DoP order + research-first regla. Cada prompt que pidas le pasarás solo el caso concreto. Ahorras 5 min/prompt en repetir el sistema.

## Si quieres profundizar

- [ ] M4.L5 · ElevenLabs · voice over con emoción
- [ ] M4.L7 · JSON prompts · schema validable
- [ ] M4.L8 · Three-Pass Review · 26 markers anti-AI-look

---

**Visual**: `TODO: visual · brief: "matriz 2 columnas (ChatGPT / Claude) × 6 filas casos uso · tick verde en herramienta ganadora por caso · fondo dark + acento dorado · estilo decision table"`

**Quiz check**:
- Pregunta: "Necesitas convertir 30 min de llamada con cliente en brief estructurado de 800 palabras. ¿ChatGPT o Claude?"
- Opciones: ChatGPT · Claude · Da igual · Mejor a mano.
- Correcta: Claude.
- Explicación: Claude tiene mejor manejo de contexto largo coherente y produce estructura limpia. ChatGPT puede hacerlo pero tiende a perder consistencia en outputs largos.

<!-- VISUAL_PENDIENTE -->
