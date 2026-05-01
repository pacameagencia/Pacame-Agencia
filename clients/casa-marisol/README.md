# Cliente: Casa Marisol

## Identidad
- **Nombre comercial:** Casa Marisol
- **Capa:** 2 (cliente B2B externo) — origen: **test E2E de la Factoría PACAME**.
- **Industria:** Hostelería (restaurante).

## Estado (a 2026-04-30)
- **Estado:** test E2E completado (14/14 pases) — shipped 3/3 en producción.
- **Origen:** primer caso real que validó la Factoría PACAME (FASE E + F + G).
- **Resultado:** plantilla hostelería + auto-deploy Vercel + Vapi + n8n + repo conectado a Git.

## Stack del cliente
- **Frontend:** plantilla hostelería PACAME (Next.js + custom).
- **Voz:** Vapi (asistente telefónico para reservas).
- **Automatización:** n8n con credentials reales del cliente.
- **Hosting:** Vercel (proyecto auto-creado por Factoría).
- **Repo:** auto-creado y conectado a Vercel por endpoint `connect-git` de Factoría.

## Servicios PACAME activos
- [x] Plantilla web hostelería desplegada
- [x] Asistente Vapi configurado
- [x] Workflows n8n activados
- [ ] Mantenimiento mensual (definir si pasa a recurring)

## Por qué este cliente importa

Casa Marisol fue **el primer cliente shipped end-to-end por la Factoría PACAME sin intervención manual de Pablo**:
- FASE E (Materializador) generó 11 archivos físicos del cliente (commit `82c5631`).
- FASE F (Deploy automatizado) desplegó a Vercel + Vapi + n8n (commit `98963fd`).
- FASE G (Cerrar círculo) activó n8n con credentials reales + conectó Git a Vercel (commit `31d39ca`).

Es la prueba viva de que la factoría funciona.

## Vínculos
- **Memorias Claude:**
  - `MEMORY.md` → `project_factoria_implementacion.md` (FASES A-D).
  - `project_factoria_materializador.md` (FASE E).
  - `project_factoria_deploy_automatizado.md` (FASE F).
  - `project_factoria_cerrar_circulo.md` (FASE G).
- **Vault Obsidian:** `PacameCueva/02-Clientes/casa-marisol/` (si aplica).
