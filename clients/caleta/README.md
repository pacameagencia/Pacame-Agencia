# Cliente: La Caleta Manchega

## Identidad
- **Nombre comercial:** La Caleta Manchega
- **Capa:** 2 (cliente B2B externo) — reclasificado de Capa 4 el 2026-05-13 (ver `strategy/arquitectura-3-capas.md`).
- **Industria:** Hostelería — restaurante cocina manchega contemporánea + parrilla de carbón + tapas.
- **Localización:** Calle Francisco Pizarro 64, 02003 Albacete (España).
- **Web cliente:** https://lacaletamanchega.com (oficial PACAME) · https://www.lacaletamanchega.com.
- **Plataforma:** Vite + React SPA (build estático), repo GitHub, deploy Vercel.

## Contactos
- **Datos públicos del negocio:** teléfono `+34 663 493 475`, email negocio `lacaletamanchega@gmail.com`.
- **Decisor / canal operativo:** ver vault `PacameCueva/02-Clientes/caleta/contactos.md`.
- **Canal preferente:** WhatsApp con Pablo (interno PACAME).

## Accesos (referencia, NO valores)
- **Dominio oficial PACAME:** `lacaletamanchega.com` (registrado Hostinger, NS `ns1/ns2.dns-parking.com`).
- **Hosting web oficial:** Vercel, team `PACAME` (`pacames-projects`), proyecto `lacaletamanchegaalbacete` (`prj_B5wlyLrEzHIGPnG2Zvsj8VX55lcu`).
- **Repo GitHub:** `pacameagencia/lacaletamanchega-com` (privado).
- **Branch producción:** `main`. Push automático → redeploy Vercel.
- **Dominios paralelos (NO PACAME):**
  - `lacaletamanchega.es` → Lovable + Cloudflare (control directo Pablo, NO entra en scope PACAME).
  - `lacaletamanchega.online` → Hostinger CDN (parked-ish, sin scope).
- **DNS:** Hostinger (Pablo manager). Credenciales en vault.
- **Stripe:** no usa.
- **Resend / email transaccional:** no usa.

## Scope contratado PACAME
- Web oficial sobre dominio `.com` (Vercel + repo `pacameagencia/lacaletamanchega-com`).
- Mantenimiento técnico (deploys, SSL, monitoring).
- Carta digital + assets visuales (ver `strategy/caleta/carta-v8/` para generación PDF).
- RRSS y contenido a demanda (Instagram + Facebook `@lacaletamanchega`).
- **NO entra:** lacaletamanchega.es (Lovable de Pablo) ni lacaletamanchega.online (Hostinger).

## Estado (a 2026-05-13)
- **Estado:** activo, gestionado 100% desde PACAME.
- **Última intervención:** 2026-05-13 — Sprint 0 completado: reclasificación Capa 2 + fix canonical SEO + fork de repo independiente sin Lovable.
- **Sprint actual:** ninguno abierto.
- **Riesgos abiertos:** 3 proyectos Vercel sueltos en cuenta Personal Hobby (`caleta-gestiona`, `caleta-gestiona-n1x7`, `lacaleta-gestion`) pendientes de auditar/borrar (no afectan a la web oficial). Deuda técnica menor: `og:image` y favicon todavía apuntan a `storage.googleapis.com/gpt-engineer-file-uploads/...` (bucket Lovable); migrar a Vercel Blob cuando se priorice.

## Stack del cliente
- Vite 5.x + React 18 + TypeScript (SPA build estático).
- HTML head con schema.org Restaurant + OpenGraph + Twitter Cards.
- Lovable (GPT-Engineer) como editor visual con sync bidireccional al repo GitHub.
- Vercel CDN edge `cdg1` (París), HSTS 2 años, SSL Let's Encrypt R12/R13 (auto-renew).

## Servicios PACAME activos
- [x] Web oficial sobre `.com` (Vercel)
- [x] SSL + monitoring + DNS health
- [x] Carta digital (PDF generator en `strategy/caleta/carta-v8/`)
- [ ] Fix SEO canonical (sprint 0 abierto 2026-05-13)
- [ ] RRSS contenido recurrente
- [ ] SEO local Albacete (programmatic + Google Business Profile)
- [ ] Reservas integradas (TheFork / sistema propio)

## Decisiones clave (registro)
- **2026-05-13 (mañana):** reclasificado de Capa 4 a Capa 2 (cliente B2B normal). Dominio oficial PACAME: `lacaletamanchega.com`. El `.es` (Lovable) y `.online` (Hostinger) quedan fuera de PACAME y bajo control directo de Pablo.
- **2026-05-13 (tarde):** Fix canonical SEO completo (canonical, og:url, JSON-LD, sitemap, robots, llms apuntan a `.com`). Repo cliente forkeado a `pacameagencia/lacaletamanchega-com` (sin Lovable, gestionable solo desde PACAME). Proyecto Vercel `lacaletamanchegaalbacete` reconectado al nuevo repo. El repo viejo `pacameagencia/lacaletamanchegaalbacete` queda intacto sirviendo al `.es` desde Lovable (control directo de Pablo, fuera de scope PACAME).

## Vínculos
- **Memoria Claude:** `MEMORY.md` → `project_caleta_client.md`.
- **Vault Obsidian:** `PacameCueva/02-Clientes/caleta/` (mover desde `11-Personal/la-caleta.md` el 2026-05-13).
- **Doc maestro arquitectura:** [`strategy/arquitectura-3-capas.md`](../../strategy/arquitectura-3-capas.md) — Capa 2.
- **Repo cliente:** [`pacameagencia/lacaletamanchega-com`](https://github.com/pacameagencia/lacaletamanchega-com) (privado).
- **Proyecto Vercel:** [`vercel.com/pacames-projects/lacaletamanchegaalbacete`](https://vercel.com/pacames-projects/lacaletamanchegaalbacete).
- **Carta PDF (generator):** [`strategy/caleta/carta-v8/`](../../strategy/caleta/carta-v8/).
