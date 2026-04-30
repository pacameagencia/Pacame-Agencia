# Cliente: Talleres Jaula

## Identidad
- **Nombre comercial:** Talleres Jaula
- **Capa:** 2 (cliente B2B externo)
- **Industria:** Tunning camiones / customización vehículos pesados
- **Localización:** Iniesta, Cuenca, España
- **Web cliente:** ver vault.

## Contactos
- Ver vault `PacameCueva/02-Clientes/talleresjaula/`.

## Estado (a 2026-04-30)
- **Estado:** activo (PIVOT 2026-04-29).
- **Sprint actual:** desarrollo tema custom Shopify.
- **Stack actual:** Shopify (post-pivot). Stack viejo (Next.js + Vercel) archivado.

## Stack del cliente
- **Plataforma:** Shopify (decisión del cliente, gestión vía propio admin).
- **Tema:** custom PACAME, stack: Liquid + TypeScript + GSAP + Lenis (smooth scroll).
- **Repo del tema:** `pacameagencia/talleresjaula-shopify` (NO vive en este repo PACAME-AGENCIA).
- **Repo viejo (archivado):** `pacameagencia/talleresjaula-web` — desarrollo Next.js abandonado tras pivot.

## Por qué el código vive en repo separado

- Es un tema Shopify (Liquid), no encaja en monorepo Next.js de PACAME.
- Despliegue es vía Shopify CLI / theme push, no vía Vercel.
- Aislamiento facilita versionado del tema independiente.

## Cómo trabajar con su código

```bash
# Repo separado, en otra ruta local del PC
cd C:/Users/Pacame24/Downloads/talleresjaula-shopify
git pull
shopify theme dev    # entorno local Shopify
shopify theme push   # subir cambios a tienda
```

## Servicios PACAME activos
- [x] Tema Shopify custom (en construcción, post-pivot 2026-04-29)
- [ ] SEO (roadmap)
- [ ] Ads (roadmap)

## Vínculos
- **Memoria Claude:** `MEMORY.md` → `project_talleresjaula_client.md`.
- **Repo tema:** [`pacameagencia/talleresjaula-shopify`](https://github.com/pacameagencia/talleresjaula-shopify).
- **Repo archivado:** [`pacameagencia/talleresjaula-web`](https://github.com/pacameagencia/talleresjaula-web) (referencia histórica, archived).
