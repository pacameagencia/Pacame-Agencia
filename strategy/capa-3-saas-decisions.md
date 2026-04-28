# Capa 3 — Decisiones sobre SaaS propios PACAME

> **Estado**: DECISIÓN ESTRATÉGICA — sustituye al listado anterior de 4 SaaS Capa 3.
> **Fecha**: 2026-04-28.
> **Owner**: Pablo Calleja + DIOS.
> **Contexto**: auditoría DIOS 2026-04-28 detectó que 3 de los 4 SaaS Capa 3 no tienen código en el repo. Decisión: concentrar fuerza en DarkRoom como flagship único + recompactar el resto.

---

## Diagnóstico real (verificado, no aspiracional)

Auditoría del repo `C:\Users\Pacame24\Downloads\PACAME AGENCIA\.claude\worktrees\stupefied-jepsen-33da6f` con `find` + `grep` exhaustivo:

| Producto | Menciones en docs | Código real | Migraciones SQL | Landing pública | Estado verificado |
|---|---|---|---|---|---|
| **DarkRoom** | sí | NO en este repo (vive en proyecto Vercel `dark-room`) | ✅ Supabase org `Dark Room IO` aislada | pendiente | **Operacional pero sin marketing** |
| **AsesorPro** | sí (README + arquitectura) | ❌ ninguno | ❌ ninguna | ❌ ninguna | **Vaporware** |
| **PromptForge** | sí (README + arquitectura) | ❌ ninguno | ❌ ninguna | ❌ ninguna | **Vaporware** |
| **PacameGPT** | sí (README + arquitectura) | ❌ ninguno | ❌ ninguna | ❌ ninguna | **Vaporware** |

**Conclusión brutal**: 3 de los 4 SaaS Capa 3 son nombres en una hoja de ruta, no productos. Pablo tiene reservados los conceptos pero no ha construido nada. Esto cambia toda la estrategia.

---

## Decisión por producto

### 🟢 DarkRoom — FLAGSHIP ÚNICO

Confirmado como buque insignia de PACAME Studios. Toda la inversión de growth (micronichos, contenido, ads silenciosos) se concentra aquí.

- Infra ya parcialmente aislada (Supabase org propia, Resend separado, Vercel team `Dark Room IO`).
- Modelo definido: membresía colectiva.
- Necesita: positioning público + landing + funnel desde micronichos (ver `strategy/darkroom/positioning.md` y `strategy/darkroom/flywheel-micronichos.md`).

### 🔴 AsesorPro — MATAR (o mover a Capa 4 personal de Pablo)

**Razón**:
- ICP completamente distinto a DarkRoom (B2B contabilidad de pymes españolas vs creators/freelancers visuales).
- No comparte audiencia, no comparte canales de captación, no comparte posicionamiento.
- Construir AsesorPro = abrir un segundo frente con coste de oportunidad alto.
- Para construir bien necesita 200-400 horas + funnel propio + ICP propio.

**Acción recomendada**:
1. **Liberar el dominio** si está reservado y no se va a usar en 90 días.
2. **Archivar el concepto** en `strategy/archive/asesorpro-concepto.md` por si en el futuro se retoma como negocio independiente fuera de PACAME Studios.
3. **No mencionar más en docs vivos de PACAME**.

Si Pablo quiere mantener la idea, NO meterla en PACAME Studios. Sería negocio independiente (Capa 4 personal o nueva sociedad), igual que La Caleta.

### 🟡 PromptForge — RECICLAR como micronicho de DarkRoom

**Razón**:
- ICP solapa con DarkRoom (creators/freelancers que usan AI generativa).
- "Tool gratis de prompts" es uno de los 6 micronichos diseñados (ver `flywheel-micronichos.md`).
- Renombrar **PromptForge → "Prompts Pulidos"** o similar sin marca propia, dentro del paraguas DarkRoom.
- Url sugerida: `prompts.darkroomcreative.cloud` o subruta `darkroomcreative.cloud/tools/prompts`.

**Acción recomendada**:
1. **Tomar el concepto** de PromptForge.
2. **Construirlo como tool gratis** (ver micronicho #5 en `flywheel-micronichos.md`).
3. **No usar el nombre PromptForge en público** — diluye el flagship DarkRoom.
4. Si Pablo quería PromptForge como SaaS independiente cobrando, **abandonar esa idea**: el ICP de creators no paga por solo un editor de prompts. Lo hace gratis y el upsell es DarkRoom (Midjourney/Claude/GPT premium incluido).

### 🔴 PacameGPT — MATAR sin más

**Razón**:
- Nombre confuso: parece chatbot interno PACAME, no producto comercial.
- Sin definición clara: ni ICP, ni propuesta, ni diferenciación.
- ChatGPT de OpenAI + Claude de Anthropic son competencia inmediata con presupuestos de billones. Construir un wrapper sin USP único es perder tiempo.
- El nombre "PacameGPT" ata a PACAME marca, contradice la regla de aislamiento por capa.

**Acción recomendada**:
1. **Matar el concepto** completamente.
2. **Liberar dominio** si está reservado.
3. **No mencionar más** en docs.
4. Si en algún momento Pablo quiere "asistente IA de PACAME interno", se llamará "DIOS Chat" o se incluirá como feature de la web pacameagencia.com — no como SaaS Capa 3.

---

## Impacto en la estructura PACAME

### Antes (situación heredada)

```
PACAME (paraguas)
├── PACAME Agencia (Capa 2 servicios)
└── PACAME Studios (Capa 3)
    ├── DarkRoom
    ├── AsesorPro          ← humo
    ├── PromptForge        ← humo
    └── PacameGPT          ← humo
```

### Después (decisión 2026-04-28)

```
PACAME (paraguas público — autoridad / contenido)
├── PACAME Agencia (Capa 2 servicios B2B)
│   ├── Web (Starter/Pro/Premium)
│   ├── Ecommerce
│   ├── SaaS Personalizado
│   └── Gestión RRSS
└── PACAME Studios (Capa 3)
    └── DarkRoom (FLAGSHIP)
        └── Micronichos free tools (alimentan DarkRoom)
            ├── Paletas desde foto
            ├── Mockup batch
            ├── Hooks virales
            ├── Prompts visuales (← reciclado de PromptForge)
            ├── Carruseles IA
            ├── Comparador alternatives
            └── SVG editor
```

### Reglas de mención pública actualizadas

| Capa / Producto | ¿Se menciona junto a PACAME en público? |
|---|---|
| 1 PACAME factoría | Es PACAME. |
| 2 Clientes B2B | No, salvo case study con consentimiento. |
| 3 PACAME Studios → DarkRoom | **NO** (riesgo legal group-buy). DarkRoom como marca independiente. |
| 3 PACAME Studios → micronichos free tools | Sí pueden tener URL `*.darkroomcreative.cloud` pero **no asociadas a PACAME**. Subdominios de DarkRoom. |
| 4 Personal Pablo | **Nunca**. |

---

## Beneficios de matar el ruido

1. **Foco**: 1 flagship vs 4 = velocidad de ejecución multiplicada.
2. **Marketing**: 1 mensaje vs 4 = audiencia entiende qué es PACAME Studios.
3. **Coste**: cero infra/dominios/dev en productos vaporware.
4. **Salud mental Pablo**: deja de cargar con "tengo que sacar 4 SaaS este año" cuando solo 1 tiene chance real.
5. **Capacidad de growth**: todo el budget Ads + tiempo creativo se concentra en DarkRoom.

---

## Próximos pasos

- ✅ **HECHO**: README actualizado para no mencionar Dark Room ni La Caleta en público.
- ✅ **HECHO**: este doc consolida la decisión.
- **PENDIENTE Pablo**:
  1. Confirmar liberación de dominios reservados de AsesorPro y PacameGPT (si los tiene).
  2. Confirmar que se puede archivar `agents/` o code que mencione AsesorPro/PromptForge/PacameGPT (probablemente nada, según auditoría).
  3. Verificar que no hay activos pendientes (ads pagados, contenido publicado, primeros usuarios) en los proyectos a matar.
- **PENDIENTE DIOS**:
  1. Auditar el repo y limpiar cualquier mención residual a AsesorPro/PromptForge/PacameGPT en docs internos vivos.
  2. Actualizar `strategy/arquitectura-3-capas.md` para reflejar la nueva estructura.
  3. Diseñar el flywheel completo de DarkRoom (`flywheel-micronichos.md`).

---

**Decisión final**: el flagship es DarkRoom. Todo lo demás es ruido o se recicla como tool gratis. Concentración total.
