---
type: seo_keywords
template: hosteleria-v1
locale: es-ES
strategy: long_tail_local + intent_match
---

# Keywords SEO — Plantilla hostelería

## Estructura por intención de búsqueda

### 1. Intención transaccional (alta conversión, bajo volumen)
Pattern: `[platos/cocina] [barrio/ciudad]` o `reservar [tipo] [zona]`

```
restaurante {{cocina}} {{barrio}}
mejor {{tipo_local}} en {{ciudad}}
{{tipo_local}} con terraza {{ciudad}}
reservar mesa {{barrio}} {{ciudad}}
{{tipo_local}} cerca de {{landmark}}
{{cocina}} para llevar {{barrio}}
restaurante para grupos {{ciudad}}
restaurante con menú del día {{barrio}}
brunch {{barrio}} {{ciudad}}
cenar romántico {{ciudad}}
```

### 2. Intención informacional (alto volumen, mid-funnel)
Pattern: `dónde comer/cenar/desayunar [adjetivo] [zona]`

```
dónde comer en {{barrio}}
mejores restaurantes {{ciudad}} 2026
restaurantes recomendados {{barrio}}
qué hacer en {{ciudad}} comer
gastronomía típica {{provincia}}
mejor {{plato_signature}} de {{ciudad}}
restaurantes con vistas {{ciudad}}
restaurantes baratos {{ciudad}}
restaurantes para celíacos {{ciudad}}
{{tipo_local}} con encanto {{ciudad}}
```

### 3. Intención brand + reputation
Pattern: `{{business_name}} [modificador]`

```
{{business_name}} reservas
{{business_name}} carta
{{business_name}} opiniones
{{business_name}} {{ciudad}}
{{business_name}} horarios
{{business_name}} {{ciudad}} teléfono
{{business_name}} reservar online
```

### 4. Long-tail diferenciador
Pattern: keywords ultra-específicas que la competencia no trabaja

```
{{cocina_específica}} en horno de leña {{barrio}}
{{plato_signature}} con maridaje {{ciudad}}
restaurante km 0 {{provincia}}
restaurante eventos privados {{ciudad}} hasta {{seats_count}} personas
{{tipo_local}} con cocina abierta {{barrio}}
restaurante {{cocina}} chef {{nacionalidad}} {{ciudad}}
```

### 5. Eventos / temporada
```
restaurantes navidad {{ciudad}}
menú nochevieja {{ciudad}}
restaurantes san valentín {{ciudad}} románticos
restaurantes día de la madre {{ciudad}}
restaurantes verano terraza {{ciudad}}
brunch domingo {{barrio}}
```

## Estrategia de implementación

### Páginas a crear (ATLAS)
1. **Home** — keyword principal: `{{cocina}} {{barrio}} {{ciudad}}`
2. **Carta** — keywords platos signature
3. **Reservas** — `reservar mesa {{business_name}}`
4. **Eventos privados** — `eventos privados {{ciudad}} hasta {{seats_count}} personas`
5. **Blog SEO** (1 post / semana mínimo):
   - "Mejor {{plato_signature}} de {{ciudad}}: cómo lo hacemos"
   - "Qué hacer en {{barrio}} si vienes a comer"
   - "Recetas de {{cocina}} que servimos en {{business_name}}"
   - "Maridajes con {{plato_signature}}: guía rápida"
   - "Eventos privados en {{barrio}}: nuestra propuesta"
   - "Ingredientes locales de {{provincia}} en nuestra carta"

### Schema.org obligatorio (CORE)
```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "{{business_name}}",
  "image": "{{hero_image_url}}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{{street}}",
    "addressLocality": "{{city}}",
    "addressRegion": "{{region}}",
    "postalCode": "{{postal_code}}",
    "addressCountry": "ES"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "{{lat}}",
    "longitude": "{{lng}}"
  },
  "url": "{{website_url}}",
  "telephone": "{{phone}}",
  "servesCuisine": "{{cuisine}}",
  "priceRange": "{{price_range}}",
  "openingHoursSpecification": [...],
  "menu": "{{menu_url}}",
  "acceptsReservations": "True",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "{{google_rating}}",
    "reviewCount": "{{google_review_count}}"
  }
}
```

### Listings + GMB (NEXUS + ATLAS)
- Google My Business optimizado (categoría primaria + secundarias, fotos cada semana, posts mensuales)
- TripAdvisor (responder TODAS las reseñas en 24h)
- TheFork si aplica
- Yelp opcional
- Citas locales: directorio del ayuntamiento, asociaciones gastronómicas, guías locales

## Anti-keywords (qué NO trabajamos)

- ❌ "restaurante" solo sin geo (CPC 5€+, volumen masivo, intención difusa)
- ❌ "comida a domicilio" salvo que tengamos delivery propio (compite con Glovo, ROAS negativo)
- ❌ Recetas genéricas sin marca (atrae tráfico que nunca convierte)

## Targets primer trimestre (con tier Stack)

| KPI | Mes 1 | Mes 3 |
|---|---|---|
| Keywords ranking top 10 | 5 | 18 |
| Tráfico orgánico mensual | +50% baseline | +200% baseline |
| Reservas web/orgánico | 15 | 80 |
| Click-through GMB → web | +40% | +120% |
