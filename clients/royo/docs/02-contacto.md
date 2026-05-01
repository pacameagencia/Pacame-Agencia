# Borrador — Página "Contacto" · Joyería Royo

URL destino: https://joyeriaroyo.com/contacto-joyeria-royo-albacete/
Page ID WP: 10795
Estado actual: datos demo Ecomus ("66 Mott St, New York", "EComposer@example.com", "(623) 934-2400", mapa apunta a Tower of London). DESASTRE.

## Title (Yoast SEO)

`Contacto · Joyería Royo Albacete — Tesifonte Gallego, 2`

## Meta description

`Visítanos en Calle Tesifonte Gallego 2, Albacete. WhatsApp 967 21 79 03. Joyería de confianza con más de 50 años atendiendo personalmente.`

## Contenido

```html
<h1>Contacto</h1>

<p class="lead">Estamos en el centro de Albacete, a dos pasos del Paseo de la Libertad. Pásate, escríbenos por WhatsApp o llámanos: contestamos siempre.</p>

<!-- Bloque dos columnas -->
<div class="grid-2">

  <!-- Columna izquierda: información -->
  <div>
    <h2>Visita la tienda</h2>
    <p>
      <strong>Calle Tesifonte Gallego, 2</strong><br>
      02002 Albacete<br>
      España
    </p>

    <h3>Horario</h3>
    <p>
      Lunes a viernes: <strong>[CONFIRMAR — ej: 10:00 — 13:30 y 17:00 — 20:30]</strong><br>
      Sábado: <strong>[CONFIRMAR — ej: 10:00 — 13:30]</strong><br>
      Domingo y festivos: cerrado
    </p>
    <p class="hint">[CONFIRMAR si en agosto cambia el horario]</p>

    <h3>Cómo contactar</h3>
    <p>
      📞 Teléfono: <a href="tel:+34967217903">+34 967 21 79 03</a><br>
      💬 WhatsApp: <a href="https://wa.me/34967217903">+34 967 21 79 03</a><br>
      ✉️ Email: <a href="mailto:jroyo@joyeriaroyo.com">jroyo@joyeriaroyo.com</a>
    </p>

    <h3>Síguenos</h3>
    <p>
      <a href="[CONFIRMAR Instagram URL]">Instagram</a> ·
      <a href="[CONFIRMAR Facebook URL]">Facebook</a> ·
      <a href="[CONFIRMAR Pinterest URL]">Pinterest</a> ·
      <a href="[CONFIRMAR TikTok URL]">TikTok</a>
    </p>
  </div>

  <!-- Columna derecha: formulario -->
  <div>
    <h2>Escríbenos</h2>
    <p>¿Tienes una duda sobre un reloj, una joya o un servicio? Cuéntanos y te respondemos en menos de 24h laborables.</p>

    <!-- Form CF7 ya existe en wp; mantenemos shortcode -->
    [contact-form-7 id="..." title="Contacto Royo"]
  </div>

</div>

<!-- Mapa Google con coordenadas REALES Albacete -->
<div class="map-container">
  <iframe
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3107.0!2d-1.857!3d38.994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd6403d!2s40C.+Tesifonte+Gallego%2C+2%2C+02002+Albacete!5e0!3m2!1ses!2ses!4v0"
    width="100%" height="400" style="border:0;"
    allowfullscreen=""
    loading="lazy"
    referrerpolicy="no-referrer-when-downgrade"
    title="Joyería Royo en Albacete"></iframe>
</div>

<!-- Coordenadas exactas Tesifonte Gallego 2, Albacete: lat 38.9943, lng -1.8585 aprox -->
```

## Notas de implementación

- Coordenadas Google exactas a confirmar antes de generar el iframe (búsqueda automática vía Google Maps API o yo las confirmo manual con `https://www.google.com/maps/place/Calle+Tesifonte+Gallego,+2,+02002+Albacete/`).
- Form CF7: el ID actual del form lo busco al ejecutar (`GET /wp-json/contact-form-7/v1/contact-forms`) y reemplazo el shortcode.
- Datos sociales (IG/FB/etc.): los URLs reales están en el footer del WP, los extraigo con curl al ejecutar.
