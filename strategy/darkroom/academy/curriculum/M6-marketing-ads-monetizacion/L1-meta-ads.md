# M6.L1 — Meta Ads · audiencias, creatividades, presupuesto

> **Dura**: 14 min
> **Nivel progreso**: 85% → 87%
> **Requisito previo**: M5 cerrado o M1 si saltas directo a marketing

## Qué vas a sacar de aquí

Lanzas tu primer test Meta Ads $30/día con 3 ads + 2 audiencias. Lees CPM, CTR, CR y ROAS sin entrar en pánico. Decides día 4 con datos, no con intuición.

## El concepto (1 idea, no 5)

Meta Ads (Facebook + Instagram) sigue siendo la plataforma de ads top 2026 para LATAM-ES. Setup mínimo:

1. **Business Manager** · cuenta empresa con tu negocio.
2. **Ad Account** · dentro del BM, conectada a Stripe / tarjeta.
3. **Pixel + Conversions API** · tracking de qué pasa después del clic (ventas, registros, etc.).
4. **Audiencias** · broad + interest + lookalike + retargeting.
5. **Creativos** · 3-5 variantes por test (UGC + product + lifestyle).

NO empieces con awareness ni alcance. Empieza con **objetivo Conversiones** (Meta lo llama "Performance Goal: Maximize number of purchases").

## El ejemplo real

**Caso · primer test Meta Ads para tienda MateBag · $150 budget**

### Setup (2h Día 1)

1. **Business Manager**: [business.facebook.com](https://business.facebook.com) → Create account.
2. Conecta Instagram + Facebook Page de tu marca.
3. **Ad Account**: dentro del BM → Add new account.
4. **Pixel**: BM → Events Manager → Pixel → instalar en Shopify (auto-integrate Shopify-Meta).
5. **Conversions API**: activar (Pixel + Server-side tracking · supera ITP iOS 14.5+).
6. **Audiencias en Audiences**:
   - Audiencia A · broad · interest "trail running" + edad 25-45 + España.
   - Audiencia B · LAL 1% de tus visitantes web (necesitas mínimo 100 visitantes para LAL fiable).

### Creativos (1h Día 1)

3 ads creative en formato vertical 9:16 (Stories + Reels):

- **Ad 1 · UGC** · video 15s de cliente beta usando producto + caption "tres meses con este mate y no vuelvo al de plástico". Tono cómplice cero gurú.
- **Ad 2 · Product demo** · video 8s cinemático generado en Seedance + texto overlay con beneficios.
- **Ad 3 · Lifestyle estático** · imagen Nano Banana Pro del producto en escena trail + caption beneficio + CTA.

### Lanzamiento (30 min Día 1)

- Campaign · Objetivo: Sales.
- Ad Set · audience A · budget $15/día.
- Ad Set · audience B · budget $15/día.
- Cada Ad Set tiene los 3 ads dentro (Meta optimiza cuál mostrar más).
- Total: $30/día × 5 días = $150 test.

### Lectura Día 4 (1h)

Métricas a leer (por audiencia y por ad):

| KPI | Bueno | Regular | Malo |
|---|---|---|---|
| **CPM** (€ / 1000 impressions) | <€15 | 15-25 | >25 |
| **CTR** (% que clica) | >1.5% | 0.8-1.5% | <0.8% |
| **CPC** (€ / click) | <€0.50 | 0.50-1.20 | >1.20 |
| **Conversion Rate** (% compra) | >2% | 1-2% | <1% |
| **ROAS** (€ generado / € gastado) | >2x | 1.2-2x | <1.2x |

Decisión:

- ≥1 ad con ROAS >2x → escala. Sube budget +20%/día.
- Todos 1.2-2x → itera creatives.
- Todos <1.2x → producto/audiencia/ficha producto malos. Pivota.

## El prompt copiable

Setup checklist primer test Meta Ads:

```
PRODUCTO: __________
BUDGET TOTAL TEST: $___ (mínimo $150)
DÍAS: ___ (mínimo 5)

☐ Business Manager creado
☐ Instagram + FB Page conectadas
☐ Ad Account con método pago activo
☐ Pixel instalado y testeado en Shopify
☐ Conversions API activa
☐ Audiencias creadas: broad + LAL 1%
☐ 3 ads creative en 9:16 (UGC + demo + lifestyle)
☐ Campaña Objetivo Sales (NO awareness)
☐ Tracking conversiones verificado
☐ Alarma día 4 para lectura
```

## Tu ejercicio (5 min)

Si tienes Shopify + producto + Stripe:

- [ ] Crea BM si no lo tienes.
- [ ] Instala Pixel en Shopify (Apps → Meta).
- [ ] Define 1 audiencia broad + 1 LAL 1%.
- [ ] Plan creatives (qué vas a grabar/generar).

Lanzamiento real cuando tengas $150-200 listos para test. NO con $20.

## Quick-win

**Regla "Pixel + Conversions API el día 0"**: si lanzas ads sin Pixel + CAPI bien instalados, pierdes 30-50% de datos por iOS 14.5+ tracking restrictions. Meta optimiza con menos datos = peor performance. Setup tracking BIEN antes de gastar el primer dólar.

## Si quieres profundizar

- [ ] M6.L2 · TikTok Ads · cuándo conviene vs Meta
- [ ] M6.L4 · Copywriting honesto · cero promesas imposibles
- [ ] [Meta Ad Library](https://facebook.com/ads/library) (espía competencia)

---

**Visual**: `TODO: visual · brief: "screenshot Meta Ads Manager con campaña activa · panel KPIs visible (CPM/CTR/CR/ROAS) · 3 ads thumbnails · fondo dark + acento dorado · estilo dashboard real"`

**Quiz check**:
- Pregunta: "Día 2 de test ads. ROAS es 0.4x. ¿Qué haces?"
- Opciones: Mato la campaña ahora · Espero al día 4 sin tocar · Aumento budget para 'salvarlo' · Cambio audiencia ya.
- Correcta: Espero al día 4 sin tocar.
- Explicación: día 2 = ruido aún. Meta sigue aprendiendo. Lectura real es día 4-5. Tocar mid-test resetea optimización algoritmo.

<!-- VISUAL_PENDIENTE -->
