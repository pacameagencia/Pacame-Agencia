---
type: strategy
title: arquitectura-3-capas
tags:
  - type/strategy
created: '2026-04-25T21:44:19.386Z'
source_path: 'C:/Users/Pacame24/Downloads/PACAME AGENCIA/strategy/arquitectura-3-capas.md'
neural_id: a208b46e-e74f-4cda-be12-b7c562404ade
---
# Arquitectura 3 Capas — PACAME / Clientes / Pablo

> Modelo de gobernanza operativa entre la factoría PACAME, los clientes que usan sus servicios, y los proyectos personales propios de Pablo.
> Última revisión: 2026-04-24.

---

## Las 3 capas

### 🏭 Capa 1 — PACAME (La Factoría)
La maquinaria que lo produce todo. Aquí viven los 10 agentes, los 798 skills, la red neuronal, los workflows n8n y la IP intelectual.

- **Propósito**: fabricar soluciones digitales para clientes externos (B2B) y para proyectos propios.
- **Propietario**: Pablo Calleja.
- **Revenue**: fee por servicios.
- **Datos**: leads, propuestas, métricas internas, IP de skills/agentes.
- **Marca visible**: PACAME.
- **Dominio**: `pacameagencia.com`.
- **Email**: `hola@pacameagencia.com`.
- **Regla maestra**: ES la fábrica. Nada de datos de cliente vive aquí (sólo metadata del encargo).

### 👥 Capa 2 — Clientes de PACAME
Negocios externos que contratan a la factoría. Son DUEÑOS de su propia infraestructura. PACAME sólo entrega y mantiene.

- **Ejemplos**: Ecomglobalbox (César Veld), La Caleta Manchega, Joyería Royo, Clara Women, Bravamood, etc.
- **Propietario**: cada cliente.
- **Revenue**: el cliente factura; PACAME cobra fee aparte.
- **Datos**: el cliente los tiene. PACAME guarda SÓLO metadata del encargo (nombre, estado, factura, fecha).
- **Marca visible**: del cliente.
- **Dominio**: del cliente.
- **Regla maestra**: **Clientes NO se tocan**. Su infra, su Stripe, sus cuentas, sus emails. PACAME es proveedor, no dueño.

### 🚀 Capa 3 — Proyectos Propios de Pablo
Productos SaaS que Pablo crea y opera él mismo, usando la potencia de PACAME como MOTOR de construcción. Son productos, no servicios.

- **Ejemplos**: Dark Room (darkroomcreative.cloud).
- **Propietario**: Pablo.
- **Revenue**: MRR recurrente del usuario final.
- **Datos**: usuarios finales del producto (no son ni de PACAME ni del cliente Ecomglobalbox).
- **Marca visible**: del proyecto (Dark Room), SIN referencia pública a PACAME.
- **Dominio**: propio.
- **Regla maestra**: **Aislar del resto**. No mezclar con PACAME (distintos modelos de negocio, legal, audiencia) ni con clientes (su marca y users son independientes).

---

## Cómo se relacionan las 3 capas

```
         ┌──────────────────────┐
         │   CAPA 1 · PACAME    │   ← la fábrica, los agentes, los skills
         │    (factoría IA)     │
         └───────────┬──────────┘
                     │
       construye y   │   construye y
       entrega para  │   opera para
     ┌───────────────┴───────────────┐
     │                               │
     ▼                               ▼
┌──────────┐                   ┌──────────┐
│ CAPA 2   │                   │ CAPA 3   │
│ CLIENTES │                   │ PROYECTOS│
│ (César,  │                   │ PROPIOS  │
│ Caleta..)│                   │ (Dark    │
│          │                   │  Room..) │
└──────────┘                   └──────────┘
```

PACAME es la fábrica que usa **su misma potencia** para tres cosas distintas:
1. Fabricar servicios para clientes (capa 2) → cobra fee.
2. Fabricar productos propios (capa 3) → ingresos MRR.
3. Fabricar más fábrica — mejora skills, agentes, herramientas (auto-mejora).

La clave: **la factoría se reutiliza; los datos/marca/dinero NO se cruzan**.

---

## Estado real a 2026-04-24

| Recurso | Capa 1 PACAME | Capa 2 Clientes | Capa 3 Propios |
|---|---|---|---|
| **Supabase proyectos** | `Pacame Agencia` (kfmnllpscheodgxnutkw) | (clientes tienen su infra propia en sus instancias) | `dark-room-prod` (kxqcyukivvfygvrxxant) ✓ ARREGLADO |
| **Supabase org** | `pacameagencia` ✓ SOLO factoría | — | `Dark Room IO` (vlznxeibibkaqqfvnivz) ✓ AISLADO |
| **Vercel projects** | `web` → pacameagencia.com | `caleta-gestiona`, `caleta-gestiona-n1x7`, `lacaletamanchegaalbacete`, `lacaleta-gestion` | `dark-room` → darkroomcreative.cloud |
| **Vercel team** | `pacames-projects` ⚠️ mezcla las 3 capas | Misma que PACAME ⚠️ | Misma que PACAME ⚠️ |
| **Stripe cuenta** | PACAME LIVE | del cliente (independiente) | ⚠️ reutiliza PACAME (decisión velocidad) |
| **Dominios Hostinger** | pacameagencia.com | lacaletamanchega.{com,es,online}, clarawomen.shop, joyeriaroyo.com, la42.es, eternalhug.shop, lexdigital.es, bravamood.com, aldabasrestaurante.es, elabrazoeterno.shop | darkroomcreative.cloud |
| **VPS** | Hostinger KVM2 72.62.185.125 (Gemma, n8n, voice) | propios | Contabo EU Windows (pendiente S4) |
| **Email ops** | hola@pacameagencia.com | del cliente | ops@darkroomcreative.cloud (pendiente) |
| **AdsPower** | — | — | cuenta Pablo personal ⚠️ compartida, ideal cuenta ops@darkroom dedicada |
| **Resend** | `re_5fSZn9m1_...` (PACAME) | — | `re_ZPx6dkfB_...` (Dark Room) ✓ separado |
| **Memoria Claude** | `.claude/projects/C--Users-Pacame24-Downloads-PACAME-AGENCIA/memory/` | referenciados en memoria PACAME con etiqueta cliente | etiquetados como proyecto propio |

---

## Riesgos detectados (por severidad)

### 🔴 Alto
1. **Supabase org compartida**: PACAME + Dark Room viven en la misma org `pacameagencia` (eyzfwmctjrvfscwbqjhx). Si Supabase suspende la org por cualquier causa, cae todo.
2. **Stripe PACAME para Dark Room**: cualquier chargeback o ban por el modelo "cuentas premium compartidas" de Dark Room puede congelar la cuenta Stripe que usa PACAME para facturar a clientes.
3. **Vercel team compartido**: `pacames-projects` aloja clientes + propios + factoría. Si un cliente cambia su equipo legal o un proyecto propio entra en disputa, Vercel podría bloquear todo el team.

### 🟡 Medio
4. **AdsPower cuenta personal de Pablo**: usada para Dark Room warming. Si Pablo vende PACAME o cambia rol, acceso lío. Mejor cuenta dedicada `ops@darkroomcreative.cloud`.
5. **Dominios clientes en Hostinger de Pablo**: los dominios de clientes (lacaletamanchega, clarawomen…) están registrados bajo tu cuenta Hostinger. Si el cliente migra, hay que transferir. Mejor: que cada cliente contrate y registre en su cuenta, y tú seas solo DNS manager.

### 🟢 Bajo
6. **Naming sin tag de capa**: en Vercel y Supabase no hay prefijo `pacame-`, `client-`, `self-` que ayude a distinguir. Riesgo operativo (borrar el que no es). Solucionable con convención + tags.

---

## Reglas de gobernanza (las de verdad, para no romperse)

### Regla 0 — La potencia se comparte, los datos no
La factoría PACAME se reutiliza en las 3 capas (los skills, los agentes, los workflows). **Lo que NO se reutiliza**: identidades, infra de producción, cuentas de pago, usuarios finales, marcas visibles.

### Regla 1 — Clientes son intocables
- Todo del cliente vive en infra del cliente.
- PACAME guarda SOLO metadata del encargo (id, nombre, estado, facturas, fechas). Nunca users finales, pagos, logs técnicos del producto del cliente.
- Acceso de PACAME al repo/infra del cliente es colaborador, no owner.
- Al terminar o pausar un contrato, PACAME REVOCA sus accesos.
- Regla dura específica para Ecomglobalbox: **nunca enviarle emails, crearle cuentas en productos propios, mencionarle en contextos internos que no deba saber**.

### Regla 2 — Proyectos propios son aislados de clientes
- Infraestructura separada (Supabase org propio, Vercel team propio, Stripe propio).
- Nunca usar emails de clientes (ni `ecomglobalbox@pm.me`) para testear, registrar o poblar un proyecto propio.
- Marca separada sin referencia a PACAME cuando haya riesgo legal (ej. Dark Room por "group buy").
- Cada proyecto propio se nombra con su propio dominio en emails/DNS/tarjetas virtuales.

### Regla 3 — PACAME es master, no mezclado
- La carpeta `C:\Users\Pacame24\Downloads\PACAME AGENCIA` y su Supabase `Pacame Agencia` son la **fábrica**, no productos. Ahí viven agentes, skills, leads B2B, plantillas.
- Los productos que fabrique (clientes o propios) **no se commitan** dentro del repo PACAME — cada uno en su repo.
- La red neuronal PACAME (synapses, memories) aprende DE LOS PROYECTOS construidos (éxitos, fallos) pero los datos de esos proyectos están fuera.

### Regla 4 — Identidades compartimentadas
| Contexto | Email / Identidad |
|---|---|
| Comms PACAME | `hola@pacameagencia.com` |
| Pablo persona | `pablodesarrolloweb@gmail.com` |
| Cliente Ecomglobalbox | César Veld (su email, que tú NUNCA usas para nada interno) |
| Proyecto Dark Room ops | `ops@darkroomcreative.cloud` |
| Dev / staging proyectos | `dev@<dominio-proyecto>` |

---

## Acciones concretas de limpieza (orden de prioridad)

### Prioridad 1 (alto — esta semana)
1. ✅ **HECHO 2026-04-24** — Supabase organization `Dark Room IO` (`vlznxeibibkaqqfvnivz`) creada. Nuevo proyecto `dark-room-prod` (`kxqcyukivvfygvrxxant`) en Frankfurt con schema completo + seeds + data migrada + SMTP Resend + templates Dark Room. Proyecto viejo (`uimttlyjpmmexettbqjg`) en `pacameagencia` PAUSED como backup por 7 días. Env Vercel y `.env.local` actualizados. Producción `darkroomcreative.cloud` corre con el nuevo backend.
2. ✅ **HECHO 2026-04-24** — Vercel team `Dark Room IO` (`team_ApmnOAs00bIX6Kt1gTWPbRpm`) creado. **Proyecto `dark-room` todavía vive en team `pacames-projects`**; el transfer requiere remover dominio (downtime), reconfigurar env y deploy nuevo — se ejecuta cuando Dark Room alcance >1k€ MRR o cuando Vercel añada API de transfer sin downtime.

### Prioridad 2 (medio — este mes)
3. **Convención de naming**: renombrar en Vercel/Supabase con tags:
   - `[FACTORY] *` para PACAME interna.
   - `[CLIENT:<slug>] *` para cada cliente (caleta, royo, clara…).
   - `[SELF:<slug>] *` para proyectos propios (darkroom, …).
4. **Cuenta AdsPower** dedicada con email `ops@darkroomcreative.cloud` + API key nueva. Migrar perfiles warming desde la cuenta personal de Pablo.
5. **Entidad legal separada** para Dark Room (SL interpuesta o sociedad existente asignada sólo al proyecto propio). Separa responsabilidad legal.

### Prioridad 3 (cuando Dark Room tenga >1k € MRR)
6. **Stripe cuenta nueva** para Dark Room (evita cross-risk del "group buy" con la cuenta PACAME LIVE). Pendiente de justificación por volumen.
7. **Transferir dominios de clientes** a sus propias cuentas Hostinger/registrar. Pablo se queda sólo como DNS manager.

---

## Cómo este modelo escala

- **+Cliente nuevo**: copia template proyecto, registra bajo su cuenta, etiquétalo `[CLIENT:<slug>]`, añade memoria `project_<slug>_client.md` con reglas específicas.
- **+Proyecto propio nuevo**: nuevo Supabase org, nuevo Vercel team, nuevo Stripe (o reutilizar con metadata si bajo volumen), etiqueta `[SELF:<slug>]`.
- **+Capability en la factoría**: mejora PACAME (nuevo agente, skill, workflow). Se reutiliza automáticamente en capas 2 y 3.

---

*Este documento es la fuente de verdad para cómo se organiza el ecosistema digital de Pablo. Cualquier excepción se anota aquí.*
