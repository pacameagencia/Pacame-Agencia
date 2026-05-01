# Cliente: Ecomglobalbox

## Identidad
- **Nombre comercial:** Ecomglobalbox
- **Capa:** 2 (cliente B2B externo)
- **Industria:** SaaS para ecommerce (group-buy / suscripciones)
- **Web cliente:** ecomglobalbox.com (ver vault para confirmación).

## Contactos
- **Decisor:** César Veld.
- **Email cliente (NO confundir con Pablo):** `ecomglobalbox@pm.me`.
  > ⚠️ Crítico: este correo es del CLIENTE, NO de Pablo. Pablo = `pablodesarrolloweb@gmail.com`. NO tocar (regla `feedback_pablo_email_real`).

## Estado (a 2026-04-30)
- **Estado:** activo (mantenimiento + dev features).
- **Métricas:** 255 clientes, ~6.9k€ MRR.
- **Plan operativo detallado:** ver vault → `memoized-brewing-panda.md`.

## Stack del cliente
- **Backend:** Laravel 12 (PHP 8.x).
- **Suscripciones:** Stripe (config del cliente).
- **Auth:** Lauth (custom).
- **Repo:** `CesarVeld/mindset` — Pablo es **colaborador con permisos push/PR/merge directo** (regla `reference_cesarveld_mindset_repo`).

## Cómo trabajar con su código

```bash
# Repo del cliente, otra ruta local
cd <path-mindset-local>
git pull
# Pablo puede push directo + PR + merge sin pedir review extra a César.
```

## Servicios PACAME activos
- [x] Desarrollo features Stripe + Lauth
- [x] Mantenimiento Laravel
- [ ] (pendiente roadmap)

## Aislamiento de datos

Datos de los 255 clientes finales viven en infra de Ecomglobalbox (NO en PACAME). PACAME solo guarda metadata de encargo (regla `feedback_client_data_isolation`).

## Vínculos
- **Memoria Claude:** `MEMORY.md` → `project_ecomglobalbox_client.md`.
- **Plan operativo:** vault `memoized-brewing-panda.md`.
- **Repo cliente:** [`CesarVeld/mindset`](https://github.com/CesarVeld/mindset).
