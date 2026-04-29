# Borrador — Página "Sobre Nosotros" · Joyería Royo

URL destino: https://joyeriaroyo.com/sobre-nosotros-joyeria-albacete/
Page ID WP: 10796
Estado actual: contenido demo del tema Ecomus en inglés ("We are Ecomus", "women's clothing store", "Robert Smith"). DESASTRE.

## Notas para Pablo

Este borrador asume datos que NO me has confirmado todavía. Marca `[CONFIRMAR]` significa que necesito el dato real antes de publicar:
- Año de fundación exacto
- Fundador (nombre, generación)
- Año en que la familia tomó el relevo (si aplica)
- Equipo actual (cuántos joyeros, gemólogos, vendedores)
- Certificaciones o membresías (Asociación Joyería Albacete, gemólogos certificados, IGS, GIA, etc.)
- Servicios estrella (tasación, reparación, financiación, programa fidelidad)

Si no me confirmas, puedo publicar con texto genérico ajustado a "más de 50 años" (que sí está confirmado en metadatos web) y "tienda física en C. Tesifonte Gallego 2, Albacete" (confirmado en footer y Hostinger domains).

## Title (Yoast SEO)

`Sobre Nosotros — Joyería Royo Albacete · Más de 50 años de tradición joyera`

## Meta description (155 chars)

`Joyería familiar en Albacete con más de 50 años. Distribuidores oficiales de Tissot, Longines, Seiko, Casio y joyería de oro 18kt. Pasa a vernos.`

## Contenido (estructura blocks Gutenberg → cuando ejecutemos vaciamos `_elementor_data` y escribimos `post_content`)

```html
<!-- Hero con título grande -->
<h1>Más de medio siglo cuidando tus joyas</h1>

<p class="lead">Somos Joyería Royo, una joyería familiar en el corazón de Albacete. Desde hace más de 50 años acompañamos a generaciones de Albaceteñas y Albaceteños en los momentos que importan: una pedida, un aniversario, el primer reloj, el regalo que se recordará siempre.</p>

<!-- Imagen tienda física Albacete (Pablo proporciona o se genera) -->
<figure>
  <img src="[URL imagen tienda física]" alt="Fachada de Joyería Royo en Calle Tesifonte Gallego, Albacete" />
  <figcaption>Nuestra tienda en Calle Tesifonte Gallego, 2 — Albacete capital</figcaption>
</figure>

<!-- Sección Heritage -->
<h2>Nuestra historia</h2>

<p>Joyería Royo abrió sus puertas en [CONFIRMAR año] en pleno centro de Albacete con una idea sencilla: ofrecer joyería y relojería de calidad con el asesoramiento personalizado que merece cada cliente. Lo que empezó como un proyecto familiar es hoy un referente en la provincia para quien busca relojes auténticos de las grandes manufacturas suizas y joyería de oro hecha con mimo.</p>

<p>Tres generaciones después[CONFIRMAR si aplica], seguimos en el mismo lugar de siempre, con la misma forma de trabajar: escuchar primero, recomendar después, y atender cada pieza —tuya o nuestra— como si fuera única.</p>

<!-- Sección Marcas -->
<h2>Distribuidores oficiales</h2>

<p>Trabajamos con las grandes manufacturas relojeras y joyeras del mundo:</p>

<ul>
  <li><strong>Suizas</strong>: Tissot, Longines, Hamilton, Oris, Baume &amp; Mercier, Omega, Franck Muller</li>
  <li><strong>Japonesas</strong>: Seiko, Citizen, Casio (incluida la línea premium G-Shock MR-G)</li>
  <li><strong>Europeas</strong>: MontBlanc, Victorinox</li>
  <li><strong>Joyería</strong>: oro 18kt, diamantes naturales certificados, esmeraldas, rubíes y zafiros — diseño propio y colaboraciones con joyeros artesanos</li>
</ul>

<p>Ser distribuidores oficiales significa que cada pieza viene con la garantía completa de fábrica y nosotros podemos ayudarte con el servicio post-venta: revisiones, mantenimiento y reparaciones autorizadas.</p>

<!-- Sección Servicios -->
<h2>Lo que hacemos por ti</h2>

<div class="grid-3">
  <div>
    <h3>Asesoramiento sin prisa</h3>
    <p>Ven a la tienda, prueba el reloj, compara joyas, pregunta lo que quieras. No vendemos: aconsejamos.</p>
  </div>
  <div>
    <h3>Tasación y compra</h3>
    <p>Tasamos joyas usadas con criterio, transparencia y sin compromiso. Si quieres vender, te hacemos una oferta justa el mismo día.</p>
  </div>
  <div>
    <h3>Reparación y mantenimiento</h3>
    <p>Cambio de pila, ajuste de pulsera, repaso de oro, soldadura de cadenas, abrillantado, restauración de piezas antiguas. Trabajamos en el taller o enviamos a las marcas oficiales.</p>
  </div>
  <div>
    <h3>Diseño a medida</h3>
    <p>¿Quieres un anillo único? ¿Un colgante con la piedra de tu abuela? Lo diseñamos contigo y lo hacemos en oro 18kt.</p>
  </div>
  <div>
    <h3>Garantía oficial</h3>
    <p>Cada reloj y cada joya viene con su garantía de fábrica. Y aquí estamos siempre que la necesites.</p>
  </div>
  <div>
    <h3>Envío a toda España</hp>
    <p>Compra online con la confianza de una joyería de tienda física. Envío asegurado y devolución sin preguntas durante 14 días.</p>
  </div>
</div>

<!-- CTA -->
<h2>Ven a vernos</h2>

<p><strong>Calle Tesifonte Gallego, 2 — 02002 Albacete</strong><br>
Lunes a sábado · 10:00 — 13:30 / 17:00 — 20:30 [CONFIRMAR horario real]<br>
Teléfono: <a href="tel:+34967217903">+34 967 21 79 03</a><br>
Email: <a href="mailto:jroyo@joyeriaroyo.com">jroyo@joyeriaroyo.com</a></p>

<p><a href="/contacto-joyeria-royo-albacete/" class="btn-primary">Cómo llegar</a> · <a href="https://wa.me/34967217903" class="btn-secondary">WhatsApp directo</a></p>
```

## Notas de implementación

- Si Pablo confirma año y datos antes de ejecutar, se sustituyen los `[CONFIRMAR]`.
- Si no, ejecutamos con datos genéricos ("desde hace más de 50 años", "varias generaciones", horario "consulte horario en tienda").
- Imagen tienda física: Pablo manda foto real O nano-banana genera mockup elegante con fachada exterior + escaparate.
- Tipografía y estilo visual lo controla el tema Ecomus (no se toca).
