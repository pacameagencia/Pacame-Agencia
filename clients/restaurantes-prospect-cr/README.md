# Prospección Restaurantes Ciudad Real

Sistema de generación masiva de demos web personalizadas + outreach legal por email para captar restaurantes B2B sin web (o web anticuada) de la provincia de Ciudad Real.

## Estructura

```
restaurantes-prospect-cr/
├── data/                          # Configs JSON por restaurante
│   ├── el-ventero.json
│   ├── meson-taurino.json
│   └── la-casuca.json
├── demos/                         # HTML generados (1 carpeta por demo)
│   ├── el-ventero/index.html
│   ├── meson-taurino/index.html
│   └── la-casuca/index.html
├── scripts/
│   └── generate-demo.mjs          # Generador parametrizable
├── templates/
│   ├── restaurante-base.html      # Template HTML con {{PLACEHOLDERS}}
│   └── email-outreach.md          # Plantillas email cercanas
└── README.md                      # Este archivo
```

## Piloto generado (3 demos)

| Lead | Slug | URL local | Pricing pitch |
|---|---|---|---|
| **El Ventero** (Plaza Mayor 8, CR) | `el-ventero` | `demos/el-ventero/index.html` | 390 € + 19 €/mes |
| **Mesón Taurino** (centro CR) | `meson-taurino` | `demos/meson-taurino/index.html` | Mismo |
| **La Casuca** (C/ Palma 10, CR) | `la-casuca` | `demos/la-casuca/index.html` | Mismo |

Cada demo tiene su **propia paleta** (vino+ocre / burdeos+dorado / verde oliva+miel) y tipografía display distinta, para que se vea claramente trabajo individual y no plantilla copy-paste.

## Cómo añadir un nuevo restaurante

```bash
# 1. Crear data/<slug>.json siguiendo la estructura de los 3 ejemplos
# 2. Generar
node scripts/generate-demo.mjs data/<slug>.json
# 3. La demo aparece en demos/<slug>/index.html
# 4. Deploy (siguiente sección)
```

## Plan de deploy a Vercel

Cada demo se sirve estática en `https://<slug>.demos.pacameagencia.com` o `<slug>-pacame.vercel.app`.

### Opción A — Manual desde panel Vercel

1. `vercel deploy` en cada `demos/<slug>/`
2. Configurar custom domain en panel
3. **Tiempo**: 2 min/demo manual = 4-5h para 137

### Opción B — Vercel CLI batch (recomendado)

```bash
# Instalar Vercel CLI si no está
npm i -g vercel

# Login (una vez)
vercel login

# Deploy todos en bucle
for dir in demos/*/; do
  slug=$(basename "$dir")
  cd "$dir"
  vercel --prod --name "$slug-restaurant" --yes
  cd ../..
done
```

### Opción C — Vercel MCP desde Claude Code

Tras autorizar el MCP `vercel` con OAuth, puedo hacer los deploys uno a uno desde aquí en lote. Necesita el OAuth completado (link en `mcp__vercel__authenticate`).

## Outreach — flujo legal (RGPD/LSSI)

1. **Email primero** (B2B con interés legítimo, art. 21 LSSI)
2. **CTA**: link a la demo + invitación WhatsApp opcional
3. **Tras respuesta o clic WhatsApp** = opt-in implícito → Pablo entra a chatear

Plantilla en `templates/email-outreach.md`. Tono cercano, asunto curioso, sin spam-words. Pricing claro.

## Pricing

- **Setup**: 390 €
- **Mantenimiento**: 19 €/mes (incluye dominio, hosting, cambios de carta y fotos, reseñas)
- **Custom**: si pide algo más (reservas calendario, pedidos online, diseño 100% único, TPV), contacto WhatsApp directo

## Métricas esperadas (137 leads)

| Métrica | Valor esperado |
|---|---|
| Emails enviados | 137 |
| Open rate | 25-35% |
| Click al demo | 8-12% |
| Respuesta opt-in | 3-6% |
| Cierre comercial | 1-2% |
| Revenue mes 1 | ~1.170 € (3 cierres × 390 €) |
| MRR a partir mes 2 | ~57 €/mes (3 × 19) creciente |

## Próximos pasos

1. **Validar diseño con Pablo** las 3 demos piloto (abrir cada `index.html` localmente o deploy preview)
2. Si OK → escalar a 134 restantes:
   - Auto-generar configs JSON desde el CSV `data/leads/restaurantes-ciudad-real-2026-05-07.csv`
   - Para cada lead: cargar fotos hero por tipo (regional, italiano, asiático, etc.)
   - Cargar carta tipo según `cuisine` del CSV
3. **Deploy Vercel** masivo (lote de 137)
4. **Configurar email** desde Resend / Gmail con plantilla
5. **Lanzar campaña** en lotes de 30 emails/día

## Limitaciones conocidas

- Las demos usan **datos OSM + estimaciones**: rating Google, número reseñas y horarios son aproximados (Pablo verifica antes de enviar)
- Fotos hero son **stock Unsplash** hasta que el local responda y mande las suyas
- **Carta digital es genérica por tipo de cocina** (regional manchego, tapas, casero) — el dueño la edita cuando contrata
