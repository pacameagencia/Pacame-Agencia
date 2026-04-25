---
template_id: hosteleria-v1
version: 1.0.0
sector: hostelería
target_subverticals:
  - restaurante
  - bar de tapas
  - cafetería de especialidad
  - cervecería artesanal
  - bistró
  - food truck
  - chiringuito
status: production
created: 2026-04-25
maintainer: PACAME · DIOS
tier_default: stack
---

# Plantilla de entrega — Sector hostelería

Configuración predefinida de la **factoría PACAME** para PYMEs del sector hostelería. Define qué piezas de la línea de montaje se activan, en qué orden, y con qué parametrización por defecto.

## Promesa al cliente

> Una PYME hostelera con esta plantilla activada en **15 días** tiene:
> - Web mobile-first con carta, reservas, ubicación, reseñas y blog SEO local.
> - Recepcionista IA por WhatsApp + voz que toma reservas, responde dudas y filtra reseñas negativas antes de Google.
> - Funnel de captación local (Meta Ads + Google Local Pack) con copy adaptado al barrio.
> - Dashboard interno con: ocupación por turno, ticket medio, reseñas trackeadas, ROAS.
> - Automatización: confirmación reservas, recordatorios 2h antes, encuesta post-visita, recuperación clientes inactivos.

## Agentes que se activan

| Código | Rol específico en hostelería |
|---|---|
| **DIOS** | Orquesta el sprint de 15 días |
| **PIXEL** | Web Next.js + reservas + integración Google My Business |
| **NEXUS** | Meta Ads geo-target 5km + Google Local Ads |
| **PULSE** | Instagram editorial + Reels diarios automatizados |
| **COPY** | Hooks por barrio + reseñas que vendan + descripciones de carta |
| **CORE** | Vapi (recepcionista IA) + n8n (reservas) + Stripe (depósitos) |
| **SAGE** | Pricing dinámico por turno (early bird, fin de semana, eventos) |
| **LENS** | Dashboard ocupación + ticket medio + reseñas + ROAS |

NOVA y ATLAS solo si el cliente quiere rebrand o blog SEO de gran volumen (upsell).

## Skills activos por defecto (96 total — alineado con tier Stack)

```
web-development · figma-to-code · landing-page-generator · design-system
seo-audit · programmatic-seo · schema-markup · site-architecture
ads-campaign · paid-ads · form-cro · page-cro · onboarding-cro
copywriting · cold-email · email-sequence · marketing-psychology
social-media-manager · ad-creative · infographics · video-prompting
analytics-tracking · campaign-analytics · ab-test-setup
docker-deployment · env-secrets-manager · stripe-integration-expert
```

## Deliverables (15 días)

### Día 0–3 · Setup
- [ ] Auditoría 360° del local: presencia digital, reseñas Google/TripAdvisor, redes actuales
- [ ] Definición de buyer personas (turistas / locales / familias / parejas / grupos)
- [ ] Brief de marca con tono y paleta (si no rebrand → herencia del local)

### Día 4–8 · Web + reservas
- [ ] Next.js mobile-first (carta interactiva, reservas, eventos, ubicación, reseñas)
- [ ] Integración Google My Business (sincroniza horarios, fotos, reseñas)
- [ ] Sistema reservas con depósito Stripe opcional (anti-no-show)
- [ ] Schema.org Restaurant + LocalBusiness para SEO local

### Día 7–12 · Captación + automatización
- [ ] Meta Ads campaign geo-target 5km radio, presupuesto sugerido 300€/mes
- [ ] Recepcionista IA Vapi (toma reservas por voz + WhatsApp)
- [ ] n8n: confirmación reservas, recordatorios 2h, encuesta post-visita
- [ ] 10 piezas Instagram + 4 Reels automatizados

### Día 13–15 · Medición + entrega
- [ ] Dashboard custom con KPIs hostelería
- [ ] Sesión training de 90 min con dueño
- [ ] Documentación + handoff de credenciales
- [ ] Plan mantenimiento mensual

## Pricing recomendado

| Componente | Coste |
|---|---|
| Setup inicial | 2.500–4.500 € (según tamaño y complejidad) |
| Mantenimiento mensual | 149 €/mes |
| Meta Ads (presupuesto cliente) | desde 300 €/mes (no incluido) |
| Vapi recepcionista IA | 49 €/mes (incluido en mantenimiento) |

Para locales con volumen alto (>200 reservas/mes) → upgrade a tier Ready (3.000–5.000 € pago único + roadmap 6 meses).

## Anti-objetivos (qué no hace esta plantilla)

- ❌ App móvil nativa (overkill para 99% de hosteleros)
- ❌ Sistema POS (integraciones con Mr. Restaurant, Square, etc. — solo si cliente paga upgrade)
- ❌ Marketplace tipo Glovo / Just Eat (no es nuestra batalla)
- ❌ Redes sociales con community manager humano (solo automatización + supervisión Pablo)
- ❌ Diseño de carta física impresa (referir a NOVA si cliente lo pide)

## Customización por cliente (variables a parametrizar)

```yaml
business_name: string
business_legal_name: string
city: string
neighborhood: string
phone_whatsapp: string  # E.164 format
email_contact: string
google_my_business_id: string
google_place_id: string
instagram_handle: string
booking_currency: EUR
booking_deposit_percentage: 0..100  # 0 = sin depósito
opening_hours: { mon-sun: [["09:00","16:00"],["19:00","00:00"]] }
average_ticket_eur: number
seats_count: number
turn_capacity: { lunch: number, dinner: number }
peak_season: ['summer','autumn','winter','spring']
language_primary: 'es'
language_secondary: 'en' | 'fr' | 'de' | null
seo_keywords_local: [string]  # 5-10 keywords con barrio/ciudad
brand_colors: { primary: hex, secondary: hex, accent: hex }
brand_typography: { display: string, body: string }
target_personas: ['turistas','locales','familias','parejas','grupos']
```

## Variantes regionales

Esta plantilla está optimizada para **España** (legislación de reservas, IVA hostelería 10%, costumbres locales). Para LATAM/UE adaptar:
- IVA y facturación
- Idioma + tonalidad (vosotros/ustedes)
- Plataformas de reseñas (TripAdvisor / Yelp / Google)
- Sistemas de pago locales (Bizum, MB Way, OXXO Pay, etc.)

## Casos de éxito esperados (para el dashboard LENS)

| Métrica | Baseline | Target 90 días |
|---|---|---|
| Reservas online / mes | 10–20 | 80–150 |
| Tasa no-show | 25–35% | 8–12% |
| Reseñas Google / mes | 2–4 | 15–25 |
| Rating Google | 4.0–4.3 | 4.5+ |
| Ticket medio | euro X | X + 8–12% |
| Ocupación turnos clave | 55% | 80%+ |

## Trazabilidad PACAME

Esta plantilla se usa cuando:
1. Un cliente identifica como "hostelería" en `/contacto` o auditoría inicial.
2. SAGE detecta vía `/api/neural/factoria-package` un discovery `target_sector: "hostelería"`.
3. DIOS clasifica vía `/cerebro` con keywords: restaurante, bar, café, reservas, carta, mesa, terraza, comida.

Cada despliegue queda registrado en Supabase tabla `client_deployments` con `template_id: hosteleria-v1` para que LENS calcule el margen marginal real de la solución N+1.
