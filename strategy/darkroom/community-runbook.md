# DarkRoom · Runbook operativo de comunidad

> **Estado**: v1.0 · runbook vivo SOP.
> **Fecha**: 2026-05-01.
> **Owner**: Pablo + DIOS + CORE (técnico) + COPY (plantillas) + LENS (KPIs).
> **Pre-requisitos leídos**: `master-success-playbook.md`, `positioning.md`, `canales-mensajeria-adaptacion.md`, `programa-afiliados.md`.

Este doc es el manual operativo que ejecutan los 3 agentes IA (IRIS, NIMBO, VECTOR) y el humano (Pablo) en la comunidad DarkRoom (Discord + WhatsApp Community + Telegram + IG DM).

---

## 1. Mapa de canales

### Discord (10 canales)

| Canal | Quién escribe | Quién responde primero | Función |
|---|---|---|---|
| `#bienvenida` | Bot DR (auto-greet) + miembros (presentación) | NIMBO | Onboarding · DM con quick wins |
| `#reglas-y-faq` | Solo Pablo (read-only) | — | ToS resumido, anti-promesas, comportamiento |
| `#anuncios` | Solo Pablo + NIMBO | — | Lanzamientos, AMAs, ofertas Pablo |
| `#soporte-ai` | Miembros | IRIS (≤30s) | Problemas técnicos, herramientas, cuentas |
| `#status-stack` | Bot uptime monitor | — | Incidencias proveedores stack |
| `#stack-tutoriales` | NIMBO (1/sem) | NIMBO comments | Tutoriales rotando 12 tools del pack |
| `#showcase` | Miembros | NIMBO viernes (top 3) | UGC. Trabajos hechos con el stack |
| `#oportunidades` | Pro+ | NIMBO | Freelance + colabs entre miembros |
| `#confesionario` | Miembros (DM-only canal) | NIMBO + sentiment | Feedback retención, churn risk early warning |
| `#crew-vip` | Crew VIP + Pablo | NIMBO + Pablo | Embajadores · roadmap + 40% lifetime |
| `#ofertas-pablo` | Pablo | — | Lifetime, BlackFriday, ofertas exclusivas |

### WhatsApp Community (manual, creada por Pablo)

| Subgrupo | Quién escribe | Privacidad teléfonos |
|---|---|---|
| `#anuncios` | Solo Pablo (admin-only) | NO visibles a miembros |
| `#soporte-rapido` | Miembros | SÍ visibles si participa |
| `#showcase-creators` | Miembros | SÍ visibles si participa |

> **Privacy claim** que NIMBO comunica al alta: "En #anuncios solo escribe el equipo. En subgrupos tu nombre/teléfono SÍ son visibles si participas. Si quieres anónimo, escribe al bot 1:1."

### Telegram + Instagram

| Canal | Quién responde |
|---|---|
| `@DarkRoomBot` (Telegram público) | IRIS · soporte + escalation a Pablo |
| IG DM @darkroomstudio | VECTOR · cualifica leads desde menciones IG |

---

## 2. Roles Discord (asignación auto)

| Rol | Tier Stripe | Asignador | Permisos clave |
|---|---|---|---|
| `@founder` | — | Pablo | Admin total |
| `@trial` | trial 14d | Stripe webhook | Acceso lectura todos los canales · sin postear en `#crew-vip` |
| `@starter` | 15€/mes | Stripe webhook | Idem `@trial` + post en `#showcase` |
| `@pro` | 29€/mes | Stripe webhook | Idem + post en `#oportunidades` |
| `@studio` | 49€/mes | Stripe webhook | Idem + acceso a roadmap previews |
| `@crew` | Afiliado >1 ref pagando | Cron afiliados | Acceso `#crew-vip` (lectura) |
| `@crew_vip` | Top 5 afiliados | Pablo manual | `#crew-vip` (escritura) + AMAs privadas |

Sincronización vía `POST /api/darkroom/discord/role-sync` (HMAC firmado). Stripe webhook (cron-master) llama este endpoint en cada `customer.subscription.created/updated/deleted`.

---

## 3. Triage de mensajes (qué agente coge cada cosa)

| Patrón | Agente | Tier LLM | SLA |
|---|---|---|---|
| "no puedo entrar / credenciales / suspendió" | IRIS | economy | <30s |
| "quiero cancelar / refund / baja" | IRIS + escalate Pablo | none → escala | <5min |
| "cuánto cuesta / qué incluye / 14 días" | VECTOR | titan | <2min |
| Mensaje en `#bienvenida` (recién llegado) | NIMBO | standard | <5min |
| Mensaje en `#showcase` (work upload) | NIMBO | standard | <30min |
| Mensaje en `#confesionario` con frustración | NIMBO + retention offer | standard | <2min |
| Piracy talk ("cracked", "keygen") | IRIS responde + escala + flag abuse | none | inmediato |
| Score lead ≥85 + ticket >100€/mes | VECTOR escala a Pablo | titan | <1min |

---

## 4. Plantillas comms · crisis pre-cocinadas

Cada plantilla está versionada y aprobada por Pablo. NIMBO no improvisa estas — las copia tal cual.

### 4.1 — Cease-and-desist Adobe/Figma (Escenario 4)

```
Hola comunidad,

Adobe/Figma nos ha contactado oficialmente. Tres cosas inmediatas:

1. Pause signups nuevos por 7 días. Ningún miembro actual ve cambios.
2. Refund pro-rata disponible para quien quiera salir AHORA. Sin preguntas.
3. Plan B opensource (GIMP + Krita + DaVinci + Penpot + Flux) en 7 días por 19€/mes.

Os escribo aquí cada 48h con avances. Y en directo Discord stage el viernes 19:00 CET.

Cero humo, máxima transparencia. Os abraza,
— Pablo
```

### 4.2 — PR negativo / artículo viral (Escenario 7)

```
Buenas,

Acabo de leer el artículo de [medio]. Resumen:

· Tienen razón en [X concreto]. Lo asumo.
· Te corrijo en [Y concreto] con datos en [link transparency dump].
· Esto es lo que hacemos exactamente: [link blog post detallado].

Estoy disponible para entrevista directa. Llamadme al [email].

DM abierto en #anuncios y #ofertas-pablo durante 7 días para preguntas.

— Pablo (en primera persona)
```

### 4.3 — Hyperviral creator wave (Escenario 2)

```
Hola gente,

Hemos recibido +30 signups en 24h gracias a [creator]. Bienvenidos.

Tres cosas:

1. Capacity check OK · stack rotando, todos podéis usar todo.
2. NIMBO os mete en onboarding 7-day automático. No hace falta hacer nada.
3. Discord AMA con Pablo este viernes 19:00 CET para explicar todo.

Si algo va lento, escribid en #soporte-ai. IRIS responde inmediato.

— Equipo DarkRoom
```

### 4.4 — Churn save offer (Escenario 9)

```
Hola {name},

Veo que has bajado actividad. Antes de cancelar, tres opciones reales:

1. Pausa membresía 30 días sin perder tu sitio.
2. Downgrade a plan menor (ahorras 50%).
3. Llamada 15min con Pablo · sin compromiso.

¿Cuál prefieres? Responde con 1, 2 o 3.

— NIMBO
```

---

## 5. Escalation triggers · cuándo Pablo se mete

Pablo recibe ping Telegram (vía `escalateToPablo` en `web/lib/darkroom/community/agents/shared.ts`) en estos casos:

| Trigger | Quién detecta | Severidad | SLA Pablo |
|---|---|---|---|
| Cancellation intent | IRIS | media | <2h |
| Refund request | IRIS | media | <2h |
| Cuenta master suspendida | IRIS + status-stack | crítica | <30min |
| Mención competidor (ScaleBoost/Toolzilla/etc.) | VECTOR | media | <2h |
| Lead score ≥85 + Studio/Lifetime | VECTOR | alta | <1h |
| Abuse / piracy chat | IRIS o NIMBO | alta | <30min |
| Threatening msg | cualquiera | crítica | <15min |
| 1 articulo medio mainstream con tono crítico | LENS monitor | crítica | <30min |
| 1 afiliado >35% MRR durante 2 meses | LENS monthly | media | <24h |
| Pablo > 60h/sem 2 sem consecutivas | self-report Mon AM | alta | self |

---

## 6. KPIs operativos (revisión semanal Pablo lunes 09:00)

Dashboard `/admin/darkroom/community` consume directo `darkroom_community_*` tablas:

| KPI | Target M2 | Target M6 | Cómo se calcula |
|---|---|---|---|
| Miembros Discord activos | 60 | 300 | distinct member_id en messages últimos 7d |
| Joins semanales | 25/sem | 80/sem | events `discord:joined` últimos 7d |
| IRIS resolution rate | ≥65% | ≥75% | messages agent='iris' AND escalated=false / total |
| NIMBO onboarding D7 completion | ≥70% | ≥80% | events `onboarding:d7` / events `onboarding:d0` |
| VECTOR lead→trial | ≥15% | ≥25% | members tier='trial' / total_leads acquisition_channel='community' |
| Churn cohort comunidad vs no-comunidad | -3pp | -6pp | LENS cohort analysis Stripe |
| Escalations a Pablo /sem | <15 | <30 | messages escalated=true últimos 7d |

---

## 7. Anti-spam · banlist · moderación

### Reglas duras (NIMBO + IRIS aplican automático)

| Patrón | Acción |
|---|---|
| 5 mensajes idénticos en <60s del mismo user | mute auto + alert Pablo |
| Mensaje contiene `cracked`, `keygen`, `pirateal*`, `cuenta adobe gratis` | reply firme + flag abuse + escalate |
| 10+ DMs salientes a otros miembros del mismo nuevo user en <1h | tempban 24h + alert Pablo |
| Cuenta creada <24h + post pidiendo "compartir cuenta" | tempban 24h |
| Mensaje en >3 idiomas distintos en <5min (bot probable) | mute auto |

### Reglas suaves (NIMBO sugiere, no banea)

| Patrón | Acción |
|---|---|
| Off-topic en `#showcase` (no es work) | NIMBO sugiere mover a `#oportunidades` |
| Pregunta de soporte en `#bienvenida` | NIMBO redirige a `#soporte-ai` |
| Mismo creator postea +3 reels propios mismo día | NIMBO sugiere "deja respirar el showcase" |

---

## 8. Rituales semanales

| Día | Hora | Quién | Qué |
|---|---|---|---|
| Lunes | 09:00 | Pablo + LENS | Dashboard KPIs · revisión escenario activo |
| Lunes | 10:00 | NIMBO | Tutorial semana posteado en `#stack-tutoriales` |
| Miércoles | 18:00 | NIMBO | Recordatorio webinar mensual (semana antes) |
| Viernes | 17:00 | NIMBO | Top 3 `#showcase` destacados con foto + crédito |
| Domingo | 12:00 | VECTOR | Outreach batch 5 candidatos afiliados (M3+) |
| Último viernes mes | 17:00 | Pablo + DIOS + LENS | Retro mensual completa · ajuste plan |

---

## 9. Kill switch · cómo pausar todo en 60s

Si necesitas pausar la comunidad (Escenario 4 cease-and-desist, crisis legal):

```bash
# Vercel env (afecta endpoints /api/darkroom/community/*)
vercel env add DARKROOM_COMMUNITY_PAUSE production
# valor: true

# VPS bot Discord
ssh root@72.62.185.125
sed -i 's/^DARKROOM_COMMUNITY_PAUSE=.*/DARKROOM_COMMUNITY_PAUSE=true/' /root/darkroom-bot.env
docker restart darkroom-bot
```

Resultado: bot responde solo "DarkRoom · servicio en mantenimiento. Soporte: support@darkroomcreative.cloud". Endpoints Vercel devuelven 503. Ningún cron dispara onboarding/role-sync. Toda interacción queda en cola para retomar cuando se desactive el switch.

---

## 10. Cómo añadir un Known Issue a IRIS

Cuando aparece un problema recurrente en `#soporte-ai` (≥3 miembros mismo issue en 7 días):

```sql
INSERT INTO darkroom_known_issues (slug, title, symptom_keywords, resolution, escalate_to_human, category, active)
VALUES (
  'midjourney-no-arranca',
  'Midjourney no carga la primera imagen',
  ARRAY['midjourney no arranca', 'midjourney lento', 'mj no carga'],
  'Refresca cookies del navegador. Si sigue sin ir, Midjourney puede estar saturado — revisa #status-stack. Si en 30min no se resuelve, escribimos al equipo.',
  false,
  'tools',
  true
);
```

IRIS lo recoge en su próxima query (sin redeploy). Si `escalate_to_human=true` IRIS responde con la `resolution` + escala a Pablo en paralelo.

---

**Versión doc**: 1.0 · **Fecha**: 2026-05-01 · **Owner**: Pablo + DIOS
