# Clientes PACAME — Capa 2

> Carpeta única para todo lo que toca a clientes B2B externos contratantes de la factoría PACAME (Capa 2 según `strategy/arquitectura-3-capas.md`).
>
> **Regla maestra Capa 2:** los datos del cliente son del cliente. Aquí solo vive **metadata del encargo**, runbook, scripts internos PACAME y assets de trabajo. **Nunca** secretos en plano (usar referencia a `.env.local` o vault).

---

## Estructura por cliente

```
clients/
├── README.md                    # este archivo
├── _template/                   # plantilla para nuevo cliente
│   ├── README.md
│   ├── runbook.md
│   └── history/
└── <nombre-cliente>/
    ├── README.md                # estado, contactos, accesos (apuntando a vault)
    ├── runbook.md               # cómo intervenir su infra sin tocar lo que no toca
    ├── scripts/                 # scripts PACAME para este cliente
    ├── docs/                    # drafts de contenido, briefings, decisiones
    ├── assets/                  # imágenes, mockups, deliverables visuales
    └── history/                 # log de sprints e intervenciones
```

## Convención de naming

- Nombre de carpeta: kebab-case ASCII (`royo`, `talleresjaula`, `ecomglobalbox`, `casa-marisol`).
- Sin tildes ni espacios. Coincide con slug usado en MEMORY.md y vault Obsidian.

## Qué SÍ va aquí

- README de estado del cliente (activo, pausado, cerrado).
- Runbook técnico para intervenir su infra.
- Scripts PACAME que tocan datos de cliente (enrichment, scrapers, sync).
- Drafts de contenido producido para el cliente.
- Assets de trabajo (mockups, imágenes generadas, before/after).
- Log de sprints e historial de intervenciones (`history/2026-04-29-sprint-1c.md`).

## Qué NO va aquí

- Credenciales en plano (API keys, passwords, tokens). Vivir en vault Obsidian o `.env.local` con referencia desde el README.
- Datos personales de clientes finales (RGPD): no descargar bases de datos del cliente al repo.
- Código del cliente cuando está en repo separado (Talleres Jaula → solo README apuntador).

## Onboarding nuevo cliente

1. Copiar `_template/` a `<nombre-cliente>/`.
2. Rellenar `README.md` con: nombre, capa (2), industria, contactos, dominio, accesos (referencia vault), estado, scope acordado.
3. Crear entrada en `MEMORY.md` (vault Claude) con `project_<slug>_client.md`.
4. Si hay scripts → vivir en `scripts/`.
5. Si hay assets → vivir en `assets/` (jpegs, pngs, mockups).
6. Cada sprint cerrado → entrada en `history/YYYY-MM-DD-<sprint>.md`.

## Clientes activos (a 2026-04-30)

| Cliente | Slug | Estado | Sprint actual | Memoria |
|---------|------|--------|---------------|---------|
| Joyería Royo | `royo` | Activo (mantenimiento + enrichment) | Sprint 1A/B/D pendiente | `project_joyeria_royo.md` |
| Talleres Jaula | `talleresjaula` | Activo (PIVOT 2026-04-29 a Shopify) | Tema custom | `project_talleresjaula_client.md` |
| Ecomglobalbox | `ecomglobalbox` | Activo (Stripe+Lauth, Laravel 12) | Mantenimiento | `project_ecomglobalbox_client.md` |
| Casa Marisol | `casa-marisol` | Test E2E Factoría completado | Shipped 3/3 | `project_factoria_*.md` |
