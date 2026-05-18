# Auditoría inicial — Grupo M-LÍA (2026-05-18)

> Auditoría read-only vía WP REST API (`clients/grupo-mlia/scripts/audit.mjs`).
> Sin escrituras en el sitio. Datos en `c:/tmp/mlia-audit.json`.

---

## 1. A qué se dedican

**Grupo M-LÍA** es un **grupo de hostelería y ocio** con locales propios en
**Hellín (Albacete)** — sede del restaurante en Avenida Castilla-La Mancha, 1.
Posicionamiento textual del propio sitio:

> "Somos creadores de experiencias y el punto de encuentro de referencia en
> Hellín. Un espacio para cada momento: desde una buena comida y el café de cada
> día, hasta los eventos más importantes de tu vida y las noches más divertidas."

Marca con iconografía propia: una **jirafa** gigante en la entrada + el **sol**
como símbolo (dorado y negro, vegetación, estilo contemporáneo).

### Líneas de negocio (8 espacios / verticales)

| Espacio | Qué es | Público | Página |
|---|---|---|---|
| **M-LÍA Restaurante** | Cocina mediterránea, menú del día 15,50 €, carta, noches temáticas (sushi) | Local Hellín/comarca, comidas diarias y de fin de semana | `/mlia-restaurante-en-hellin-albacete/` |
| **M-LÍA Eventos** | Bodas, comuniones, cumpleaños, cenas de empresa, celebraciones | Familias, parejas, empresas | `/m-lia-eventos-en-hellin/` |
| **M-LÍA Catering** | Catering profesional en Hellín y provincia (bodas, corporativo, comuniones) | Eventos con desplazamiento | `/cateting-m-lia/` |
| **Manía (MANIA PUB)** | Discoteca/pub "elegante", eventos, cumpleaños, despedidas | Ocio nocturno, despedidas | `/mania/` |
| **M-LÍA Terraza** | Terraza de hostelería | Local | `/terraza/` |
| **M-LÍA Piscina** | Piscina de ocio | Local, verano | `/piscina/` |
| **Chocolate y Menta** | Crepería / batidos (dulce) | Familias, jóvenes | `/chocolate-y-menta/` |
| **Venta de entradas** | Eventos puntuales con entrada (incluye "autorización paterna" → eventos con menores) | Ocio juvenil/eventos | `/entradas/` |

Más **"Trabaja con nosotros"** (RRHH, subida de CV) y **Contacto**.

**Modelo de negocio:** 100 % local, multi-vertical bajo una marca paraguas.
El dinero está en **reservas de restaurante** y, sobre todo, en la **captación
de eventos** (bodas/comuniones/empresa) y catering — alto ticket, decisión
local, fuerte componente de confianza y SEO local + reputación.

---

## 2. Stack técnico real

WordPress · **Elementor Pro + Elementor AI** · Slider Revolution · LiteSpeed
Cache · Jetpack (+ Boost, Stats, Blaze, Pay) · **Yoast SEO** · Contact Form 7 ·
Google Site Kit. Idioma `es_ES`. Home = página Elementor (id 5002). 29 páginas
(17 publicadas), **0 posts**, 19 plantillas Elementor, 458 medios, sin
WooCommerce activo.

Conexión PACAME: `client_websites` `ce525afc-…`, `status=connected`, usuario
rol `administrator`, Yoast confirmado.

---

## 3. Hallazgos priorizados

### 🔴 P0 — Riesgo / corregir ya

1. **Política de privacidad NO válida en España.** `/?page_id=12954` ("Privacy
   Policy") es el texto de demo del tema (Axiomthemes, Cyprus), en inglés, en
   estado *draft*. **Refund and Returns Policy** es la "sample page" de
   WooCommerce. Un negocio español con formularios y captación de datos
   (Contact Form 7, formularios de eventos, CV) **necesita Política de
   Privacidad + Aviso Legal + Cookies conformes a RGPD/LSSI-CE**. Hoy no existe
   contenido legal real → exposición legal.
2. **Restos de tema demo indexables / basura de marca.** Páginas "Videos"
   (Comedy/Stand-Up/Concert en inglés), categorías y tags del tema
   (`Comedy`, `Stand-Up`, `Concert`, `Brutal Humor`…), `Shop/Cart/Checkout/
   My account/Wishlist` (draft), `Carta-05062023` (draft duplicado). Ensucian
   la indexación, el sitemap y la administración.
3. **Zona horaria vacía** (`timezone=""`, `gmt_offset=0`). Debe ser
   `Europe/Madrid`. Afecta a horarios, eventos, programación y Site Health.

### 🟠 P1 — SEO de alto impacto / bajo esfuerzo (scope SEO)

4. **14 de 17 páginas publicadas sin meta description en Yoast**
   (`seo_desc: null`). Solo Home, Catering y M-Lía Eventos la tienen (y bien).
   Faltan en páginas dinero: **Carta, Carta del restaurante, Carta de vinos,
   Carta terraza, Menú diario, Menús especiales, Reservas, Más que un
   restaurante, Manía, Terraza, Piscina, Chocolate y Menta, Contacto, Grupo
   M-Lía, Venta de entradas**. Quick win directo de CTR en Google.
5. **SEO titles genéricos sin keyword local.** Casi todos "X - Grupo M-LÍA".
   Solo Home optimizada. Las páginas de intención (Reservas, Carta, Menú del
   día, Eventos, Catering, Manía) deben incluir **"en Hellín" / "Albacete"** —
   búsquedas reales: *restaurante Hellín*, *menú del día Hellín*, *bodas
   Hellín*, *discoteca Hellín*, *catering Albacete*.
6. **Títulos y cartas como imagen, sin H1 de texto.** Páginas internas Elementor
   sin `<h1>` en HTML (Carta, Menú diario, Reservas, Manía → `h1: []`). Los
   títulos de menú son JPG (`titulos-menu-diario.jpg`). Malo para SEO y
   accesibilidad. La home tiene H1 pobre (`"Grupo MLÍA"`) en vez de
   keyword-rich.
7. **Slug con error tipográfico en página clave:** Catering vive en
   **`/cateting-m-lia/`** ("cateting"). Penaliza *catering Hellín*. Renombrar a
   `/catering-hellin/` o `/m-lia-catering/` + redirección 301.
8. **Sin datos estructurados (Schema).** No hay `LocalBusiness` / `Restaurant` /
   `NightClub` / `Menu` / `Event`. Negocio 100 % local → schema + NAP + Google
   Business Profile es palanca de visibilidad nº1.
9. **Sin blog (0 posts).** Cero contenido de cola larga local. Categorías/tags
   actuales son basura del tema. Base perfecta para el scope de contenido.

### 🟡 P2 — Estructura / mantenimiento

10. **Deuda Elementor:** 11 plantillas Header duplicadas
    (`header`, `header-2`, `header-3`, `header-with-nav` ×4, `Elementor Header
    #27021`…) + footers duplicados. Difícil de mantener, riesgo de
    inconsistencia visual.
11. **Menús de navegación duplicados** y enlaces `Home url="#"` rotos.
12. **Nombre del sitio con espacio final** (`"Grupo M-LÍA "`) → aparece en
    `<title>` y feeds.
13. **Arquitectura de URLs inconsistente:** restaurante bien anidado, pero
    `mania`, `terraza`, `piscina`, `chocolate-y-menta` planos sin keyword local.

---

## 4. Plan recomendado por sprints (encaje con scope contratado)

> Scope: **Mantenimiento mensual + SEO (Yoast) + Producción de contenido**.

### Sprint 1 — Saneo + quick wins SEO (alto impacto, bajo riesgo)
- **Legal P0:** redactar e implementar Política de Privacidad, Aviso Legal y
  Política de Cookies conformes RGPD/LSSI-CE (PACAME redacta, publica en
  páginas reales, enlaza en footer). *Backup previo obligatorio.*
- **Limpieza:** despublicar/eliminar páginas y taxonomías demo; fijar
  `timezone=Europe/Madrid`; corregir nombre del sitio.
- **SEO on-page:** redactar y cargar vía Yoast los **14 meta description**
  faltantes + reescribir **SEO titles con keyword local** en páginas dinero.
- 301 del slug `/cateting-m-lia/` → URL con keyword.

### Sprint 2 — Schema + Local SEO
- Schema `Restaurant` + `Menu` + `LocalBusiness` (NAP: dirección Av.
  Castilla-La Mancha 1, Hellín; teléfono/WhatsApp; horarios) + `NightClub`
  (Manía) + `Event` para venta de entradas.
- Auditoría y optimización Google Business Profile (si hay acceso) — pieza nº1
  para hostelería local.
- Cartas del restaurante como **texto indexable** (no solo imagen/PDF).

### Sprint 3 — Contenido (motor de captación)
- Estrenar blog/actualidad con calendario local: "Menú de Navidad/Reyes en
  Hellín", "Dónde celebrar tu boda en Hellín", "Comuniones en Albacete",
  agenda Manía, noches temáticas restaurante.
- Landings por intención: **Bodas**, **Comuniones**, **Eventos de empresa**
  (hoy todo agregado en Eventos/Catering, sin página por intención de búsqueda).

### Continuo — Mantenimiento mensual
- Consolidar plantillas Header/Footer Elementor, limpiar menús duplicados,
  monitor LiteSpeed/Site Health, backups, actualizaciones controladas.

---

## 5. Datos pendientes de confirmar con Pablo/cliente

- NAP exacto (teléfono, WhatsApp, horarios por espacio) para schema y GBP.
- ¿Acceso a Google Business Profile y a Google Site Kit?
- ¿Hay venta de entradas online real o es informativa? (`jp_pay_*` sin uso).
- Prioridad del cliente: ¿captación de **eventos/bodas** o **reservas
  restaurante** primero? (define foco SEO/contenido).
