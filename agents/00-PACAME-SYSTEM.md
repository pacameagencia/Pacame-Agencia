# 00-PACAME-SYSTEM — Guia de Inicializacion del Sistema

> Punto de entrada del sistema de agentes PACAME.
> Para implementacion tecnica, lee este archivo primero.
> Para operacion diaria, el documento maestro es `agents/DIOS.md`.

---

## Que es este sistema

PACAME opera con un equipo de 7 agentes IA especializados orquestados por DIOS. Cada agente tiene un system prompt propio, una especialidad definida y reglas de colaboracion claras. Pablo Calleja es el supervisor humano y punto de escalado critico.

El sistema esta disenado para funcionar via **Claude API** (`claude-sonnet-4-6` o `claude-opus-4-6`).

---

## Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────┐
│                    DIOS (Orquestador)                    │
│            agents/DIOS.md → system prompt maestro        │
└───────────────────────┬─────────────────────────────────┘
                        │ coordina
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   [Sage]          [Nova]          [Atlas]
   Estrategia      Branding        SEO
        │               │               │
        └───────────────┼───────────────┘
                        │ colaboran con
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   [Nexus]         [Pixel]         [Core]
   Growth/Ads      Frontend        Backend
                        │
                        ▼
                    [Pulse]
                    Social Media
                        │
                        ▼
               [Pablo Calleja]
               Supervision humana
               Decisiones criticas
```

---

## Archivos del sistema

| Archivo | Funcion |
|---------|---------|
| `agents/DIOS.md` | Documento maestro. Protocolo operativo, routing, QA global, prompt de orquestacion. |
| `agents/00-PACAME-SYSTEM.md` | Este archivo. Guia de inicializacion y referencia de implementacion. |
| `agents/01-NOVA.md` | Agente: Directora Creativa / Branding. |
| `agents/02-ATLAS.md` | Agente: Estratega SEO. |
| `agents/03-NEXUS.md` | Agente: Head of Growth / Paid Media. |
| `agents/04-PIXEL.md` | Agente: Lead Frontend Developer. |
| `agents/05-CORE.md` | Agente: Arquitecto Backend. |
| `agents/06-PULSE.md` | Agente: Head of Social Media. |
| `agents/07-SAGE.md` | Agente: Chief Strategy Officer. |
| `brand/identity.md` | Identidad de marca: colores, tipografia, tono, agentes. Fuente de verdad visual. |
| `strategy/business-strategy.md` | Modelo de negocio, servicios, precios, personas. |
| `strategy/growth-strategy.md` | Embudos, Meta Ads, email sequences, KPIs de growth. |
| `strategy/seo-strategy.md` | Keywords, arquitectura SEO, calendario editorial, KPIs SEO. |
| `strategy/social-media-strategy.md` | Estrategia por plataforma, calendario, formatos, metricas. |

---

## Como inicializar un agente en Claude API

### Patron basico (agente individual)

```javascript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 4096,
  system: [
    // 1. Contexto de sistema PACAME
    {
      type: "text",
      text: fs.readFileSync("agents/DIOS.md", "utf8"),
      cache_control: { type: "ephemeral" }
    },
    // 2. System prompt del agente especifico
    {
      type: "text",
      text: fs.readFileSync("agents/02-ATLAS.md", "utf8"),
      cache_control: { type: "ephemeral" }
    },
    // 3. Contexto de marca (condensado o completo segun necesidad)
    {
      type: "text",
      text: fs.readFileSync("brand/identity.md", "utf8"),
      cache_control: { type: "ephemeral" }
    }
  ],
  messages: [
    { role: "user", content: mensajeDelCliente }
  ]
});
```

### Patron orquestado (DIOS coordina el equipo)

```javascript
// Session con DIOS como orquestador principal
const response = await anthropic.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 8096,
  system: [
    {
      type: "text",
      text: fs.readFileSync("agents/DIOS.md", "utf8"),
      cache_control: { type: "ephemeral" }
    },
    {
      type: "text",
      text: fs.readFileSync("brand/identity.md", "utf8"),
      cache_control: { type: "ephemeral" }
    },
    {
      type: "text",
      text: fs.readFileSync("strategy/business-strategy.md", "utf8"),
      cache_control: { type: "ephemeral" }
    }
  ],
  messages: conversationHistory
});
```

---

## Seleccion de modelo por caso de uso

| Caso de uso | Modelo recomendado | Razon |
|-------------|-------------------|-------|
| Orquestacion DIOS (proyectos complejos) | `claude-opus-4-6` | Maxima capacidad de razonamiento multi-agente |
| Agentes individuales (Sage, Nova, Atlas, Nexus) | `claude-sonnet-4-6` | Balance optimo calidad/velocidad/coste |
| Chat de soporte rapido | `claude-sonnet-4-6` | Respuestas veloces con buena calidad |
| Generacion de contenido en volumen (Pulse/Atlas) | `claude-haiku-4-5` | Alta velocidad, coste bajo para contenido |
| Revision de codigo (Pixel/Core) | `claude-sonnet-4-6` | Precision tecnica sin coste de Opus |

---

## Reglas de mantenimiento del sistema

1. **No duplicar contenido** entre archivos de agentes. Si algo aplica globalmente, va en `DIOS.md`.
2. **Los cambios de marca** van en `brand/identity.md` y se propagan a los agentes que la referencian.
3. **Los cambios de estrategia** van en `strategy/` — los agentes la referencian como contexto de sesion, no la embeben.
4. **Los cambios de operacion global** (routing, QA, escalado) van en `DIOS.md`.
5. **Los cambios de comportamiento de un agente especifico** van en el archivo del agente (`01-NOVA.md`, etc.).

---

## Convenciones de prompt

- Todos los prompts de agente estan en el bloque `## Prompt de [Agente] para Claude API` al final de cada archivo.
- Los prompts son independientes: pueden copiarse directamente como `system` en la API sin modificar.
- El bloque delimitado por ` ``` ` contiene el texto exacto del system prompt.
- Los agentes se comunican en **espanol de Espana**: tono directo, tuteo, sin formalismos.

---

## Control de versiones

- Version actual del sistema: **2.0**
- Fecha de ultima actualizacion: **Abril 2026**
- Responsable de actualizaciones: **Pablo Calleja**
- Criterio para nueva version mayor: cambio de arquitectura de agentes o nuevo agente.
- Criterio para nueva version menor: ajuste de prompts, actualizacion de estrategia.
