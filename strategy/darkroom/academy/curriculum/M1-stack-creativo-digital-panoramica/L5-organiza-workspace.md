# M1.L5 — Organiza tu workspace · Notion + Drive + carpetas

> **Dura**: 10 min
> **Nivel progreso**: 10% → 12.5%
> **Requisito previo**: M1.L4

## Qué vas a sacar de aquí

Tienes una estructura de carpetas y un Notion mínimo donde guardar prompts, assets, briefs y entregables. No vuelves a perder un archivo en Descargas durante 6 meses.

## El concepto (1 idea, no 5)

El 90% de los freelances tienen archivos repartidos entre Desktop, Downloads, Drive, Dropbox, WhatsApp y email. Cuando un cliente vuelve a los 3 meses pidiendo "el psd de aquel logo", encuentras 4 versiones distintas y ninguna es la final.

**Una estructura simple en local + nube + Notion** evita ese desastre. No necesitas software de project management caro. Solo carpetas con sentido.

## El ejemplo real

Estructura propuesta (probada en Dark Room en producción):

```
/Trabajo
  /Clientes
    /CLI-001-NOMBRE-CLIENTE
      /01-brief
        brief.md
        whatsapp-screenshots/
      /02-recursos-cliente
        logos-clientes/
        fotos-cliente/
      /03-trabajo
        figma-link.txt
        psd/
        videos/
      /04-entregables
        v1/
        v2/
        FINAL/
      /05-facturas
    /CLI-002-OTRO-CLIENTE
      ...
  /Personal
    /portfolio-piezas
    /investigacion-IA
    /banco-prompts
  /Plantillas
    plantilla-brief.md
    plantilla-presupuesto.md
    plantilla-contrato.md
```

Reglas:

1. **Numeración 01-05 dentro de cada cliente**. El sistema operativo los ordena solos.
2. **Una versión "FINAL" siempre**. No "FINAL-FINAL-v3". Si rehaces, el anterior pasa a `01-brief/historico/`.
3. **Brief en .md no en email**. El email se pierde, el archivo se queda.
4. **Plantillas en una carpeta aparte**. Copy-paste cuando empieces nuevo cliente.

## El prompt copiable

Plantilla mínima `brief.md` para cada cliente:

```markdown
# Brief · {Nombre Cliente}

**Fecha:** YYYY-MM-DD
**Contacto:** nombre · email · whatsapp
**Encargo:** descripción 1 línea
**Presupuesto:** _____ €
**Plazo:** YYYY-MM-DD
**Disciplinas Dark Academy:** M2 / M3 / M4 / M5 / M6 (marca cuáles)

## Lo que pide el cliente

- ...
- ...

## Lo que NO entra (out of scope)

- ...
- ...

## Entregables

- [ ] Entregable 1 · plazo X
- [ ] Entregable 2 · plazo Y

## Notas / decisiones

- {fecha} acordamos X
- {fecha} cambio a Y
```

Pega ese template como `plantilla-brief.md` en `/Plantillas` y duplícalo cada vez que entre un cliente.

## El segundo prompt copiable · Notion mínimo

Crea un workspace en [notion.so](https://notion.so) con esta estructura:

```
🏠 Inicio (página raíz)
├─ 🎯 Clientes activos (database)
│   ├─ CLI-001-NombreCliente · status · próximo entregable · fecha
│   └─ CLI-002 · ...
├─ 📦 Banco de prompts (database)
│   ├─ Prompt 5-step cinemático A
│   ├─ Prompt outfit transform B
│   └─ Prompt email cold C
├─ 📚 Recursos academia (Dark)
│   ├─ Mapa stack creativo digital 2026 (PDF)
│   ├─ Three-Pass Review checklist
│   └─ Marco precios €
└─ 💡 Ideas / próximos posts (kanban)
    ├─ Idea A
    └─ Idea B
```

No metas más. Notion sin disciplina es un cementerio de páginas a medias.

## Tu ejercicio (5 min)

Crea HOY:

- [ ] Carpeta `/Trabajo/Clientes` y `/Trabajo/Plantillas` en local.
- [ ] Pega `plantilla-brief.md` en Plantillas.
- [ ] Notion con las 4 databases mínimas vacías.
- [ ] Si tienes 1 cliente activo: créale carpeta `CLI-001-NombreCliente` con las 5 subcarpetas.

No copies clientes antiguos hoy. Eso es trabajo de fin de semana. Hoy solo la estructura.

## Quick-win

**Regla "1 archivo, 1 sitio"**: cuando descargues una asset del cliente, vete YA a su carpeta `02-recursos-cliente/` y muévelo. No lo dejes en Downloads "para luego". El "luego" es 3 meses después y no lo encuentras.

## Si quieres profundizar

- [ ] M1.L6 · Encadenar 2 herramientas · output → input
- [ ] Notion · plantillas oficiales: [notion.so/templates](https://notion.so/templates)
- [ ] (Avanzado · M5) Cuando uses dropshipping, Shopify usa otra estructura; lo verás en M5.L2.

---

**Visual**: `TODO: visual · brief: "tree-view de carpetas anidadas en estilo monospace + screenshot Notion al lado · fondo dark + iconos folder en dorado · estilo terminal output"`

**Quiz check**:
- Pregunta: "Acabas de recibir 5 fotos producto del cliente por WhatsApp. ¿Qué haces?"
- Opciones: Las dejo en WhatsApp · Las guardo en Descargas · Las muevo a `CLI-NombreCliente/02-recursos-cliente/` · Las subo a Drive sin orden.
- Correcta: Las muevo a `CLI-NombreCliente/02-recursos-cliente/`.
- Explicación: regla "1 archivo, 1 sitio". WhatsApp/Descargas son tránsito, no destino.

<!-- VISUAL_PENDIENTE -->
