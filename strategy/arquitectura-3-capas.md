# Arquitectura 4 Capas — PACAME / Clientes / SaaS propios / Negocios personales

> Modelo de gobernanza operativa entre la factoría PACAME, sus clientes B2B, sus productos SaaS propios bajo el paraguas PACAME, y los negocios personales de Pablo Calleja totalmente aparte.
> Última revisión: 2026-04-27.

---

## Las 4 capas

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

- **Ejemplos**: Ecomglobalbox (César Veld), Joyería Royo, Clara Women, Bravamood, etc.
- **Propietario**: cada cliente.
- **Revenue**: el cliente factura; PACAME cobra fee aparte.
- **Datos**: el cliente los tiene. PACAME guarda SÓLO metadata del encargo (nombre, estado, factura, fecha).
- **Marca visible**: del cliente.
- **Dominio**: del cliente.
- **Regla maestra**: **Clientes NO se tocan**. Su infra, su Stripe, sus cuentas, sus emails. PACAME es proveedor, no dueño.

### 🚀 Capa 3 — SaaS propios PACAME (productos hijos)
Productos SaaS que la factoría PACAME crea y opera. **Forman parte del paraguas PACAME** — pueden mencionarse públicamente como "productos de PACAME" en marketing, propuestas, RRSS de la marca.

- **Ejemplos**: Dark Room (darkroomcreative.cloud), AsesorPro, PromptForge, PacameGPT.
- **Propietario**: PACAME (Pablo como CEO).
- **Revenue**: MRR recurrente del usuario final.
- **Datos**: users del producto (aislados de la factoría a nivel infra; visibles a PACAME a nivel agregado para análisis y mejora).
- **Marca visible**: del producto. Algunos usan paraguas PACAME (PacameGPT). Otros no (Dark Room, por riesgo legal del modelo "group buy").
- **Dominio**: propio.
- **Regla maestra**: **Aislar infra (Stripe, Supabase, Vercel team), compartir paraguas comunicacional**. Es ecosistema PACAME.

### 🏠 Capa 4 — Negocios personales de Pablo (no PACAME)
Negocios que Pablo opera personalmente y que **NO forman parte de PACAME ni se mencionan junto a la marca**. PACAME (la factoría) le da potencia técnica a Pablo para llevarlos, pero a ojos del mundo son negocios independientes de Pablo Calleja, no de PACAME.

- **Ejemplos**: La Caleta Manchega (negocio físico de hostelería; Pablo opera web + carta + RRSS).
- **Propietario**: Pablo Calleja persona.
- **Revenue**: del negocio en sí (tickets restaurante, eventos, etc.). No factura PACAME.
- **Datos**: del negocio. PACAME no los explota ni los guarda.
- **Marca visible**: del negocio. **CERO mención pública a PACAME**.
- **Dominio**: propio.
- **Regla maestra**: **Aislamiento completo público y comercial**. PACAME es solo motor técnico interno, invisible al mundo. **No mencionar La Caleta cuando se hable de PACAME** (ni en marketing, ni en RRSS, ni en propuestas a clientes B2B). Solo se trata cuando el contexto sea explícitamente La Caleta.

---

## Cómo se relacionan las 4 capas

```
                ┌──────────────────────┐
                │   CAPA 1 · PACAME    │   ← la fábrica, agentes, skills
                │    (factoría IA)     │
                └───────────┬──────────┘
                            │ usa su potencia para…
        ┌───────────────────┼─────────────────────┐
        │                   │                     │
        ▼                   ▼                     ▼
   ┌──────────┐        ┌──────────┐         ┌──────────┐
   │ CAPA 2   │        │ CAPA 3   │         │ CAPA 4   │
   │ CLIENTES │        │ SaaS     │         │ NEGOCIOS │
   │   B2B    │        │ propios  │         │ PERSONAL │
   │ (César,  │        │ PACAME   │         │  PABLO   │
   │ Royo,    │        │ (Dark    │         │ (Caleta) │
   │ Marisol) │        │ AsesorPro)│        │          │
   └──────────┘        └──────────┘         └──────────┘
       ▲                   ▲                     ▲
       │                   │                     │
   factura cliente    paraguas PACAME      sin mención PACAME
   (PACAME cobra fee) (productos hijos)    (Pablo personal)
```

PACAME es la fábrica que usa **su misma potencia** para cuatro cosas distintas:
1. Fabricar servicios para clientes B2B (capa 2) → cobra fee.
2. Fabricar productos SaaS bajo paraguas PACAME (capa 3) → ingresos MRR.
3. Dar potencia técnica a negocios personales de Pablo (capa 4) → sin transferencia comercial; aislamiento público total.
4. Fabricar más fábrica — mejora skills, agentes, herramientas (auto-mejora).

La clave: **la factoría se reutiliza; los datos/marca/dinero NO se cruzan, y la mención pública sigue las reglas de cada capa**.

### Reglas de mención pública (importante)

| Capa | ¿Se menciona junto a PACAME en público? |
|---|---|
| 1 PACAME | Es PACAME. |
| 2 Clientes B2B (Ecomglobalbox, Royo, Clara, Marisol…) | No, salvo casos de marketing con consentimiento del cliente (caso de éxito). |
| 3 SaaS propios — **DarkRoom (flagship único)** | **No** — DarkRoom NO se menciona en público asociado a PACAME (riesgo legal del modelo "membresía colectiva"). Tiene marca independiente. AsesorPro / PromptForge / PacameGPT fueron descartados como SaaS Capa 3 (decisión 2026-04-28, ver `capa-3-saas-decisions.md`). PromptForge se recicló como micronicho free del flywheel DarkRoom. |
| 4 Negocios personales (La Caleta) | **Nunca**. PACAME no aparece en su web, RRSS, comunicación. Pablo lo opera como persona. |

---

## Estado real a 2026-04-27

| Recurso | Capa 1 PACAME | Capa 2 Clientes B2B | Capa 3 SaaS propios | Capa 4 Personal Pablo |
|---|---|---|---|---|
| **Supabase proyectos** | `Pacame Agencia` (kfmnllpscheodgxnutkw) | clientes con infra propia | `dark-room-prod` (kxqcyukivvfygvrxxant) aislado — único proyecto Capa 3 vivo | `dmivrosjaenvcpjmhsmf`, `kmrionmdazlnwocgizik`, `whuiywcnnwhpvaawrvcp` (3 propios para Caleta) |
| **Supabase org** | `pacameagencia` | — | `Dark Room IO` (vlznxeibibkaqqfvnivz) ✓ aislada | (orgs verificación pendiente) |
| **Vercel projects** | `web` → pacameagencia.com | `pacame-casa-marisol-cadiz` | `dark-room` (en team `Dark Room IO`) | `caleta-gestiona`, `caleta-gestiona-n1x7`, `lacaletamanchegaalbacete`, `lacaleta-gestion` |
| **Vercel team** | `pacames-projects` | Misma que PACAME ⚠️ | `Dark Room IO` (Pro) ✓ separado | Misma que PACAME ⚠️ — riesgo bajo (sin datos cross) |
| **Stripe cuenta** | PACAME LIVE | del cliente | 🔴 Dark Room reutiliza PACAME LIVE — pendiente separar (riesgo group buy) | ✅ La Caleta no usa Stripe |
| **Dominios Hostinger** | pacameagencia.com | clarawomen.shop, joyeriaroyo.com, la42.es, etc. | darkroomcreative.cloud | lacaletamanchega.{com,es,online} |
| **VPS** | Hostinger KVM2 72.62.185.125 | — | Contabo EU Windows (pendiente Dark Room) | — |
| **Email ops** | hola@pacameagencia.com | del cliente | support@darkroomcreative.cloud | (TBD `ops@lacaletamanchega.com`) |
| **Resend** | `re_5fSZn9m1_...` PACAME | — | `re_ZPx6dkfB_...` Dark Room ✓ separado | ✅ no usa |
| **Mención pública con PACAME** | Es PACAME | No (salvo case study con consentimiento) | Sí — son ecosistema PACAME (excepto Dark Room por riesgo legal) | **Nunca** |
| **Memoria Claude** | `.claude/projects/.../memory/` | etiqueta cliente | etiqueta self-project · vault `10-Proyectos-Propios/` | etiqueta personal · vault `11-Personal/` |

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
