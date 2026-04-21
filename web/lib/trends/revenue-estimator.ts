/**
 * Calculadora de revenue mensual con fórmula EXPLÍCITA.
 *
 * Filosofía: cero invención. Cada € devuelto viene de una fórmula aplicada a
 * inputs reales (volumen de búsqueda real + CPC real + benchmarks conservadores).
 *
 * Las 3 vías de monetización se calculan siempre (no sabemos cuál aplicará el
 * usuario final, devolvemos las 3 y el scanner elige la más realista según tipo).
 */
import { lookupBenchmark } from "./cpc-benchmarks";

export interface RevenueInput {
  searchVolumeMes: number;      // búsquedas mensuales ES
  keyword: string;              // para lookup benchmark
  capturablePct?: number;       // 0..1, por defecto 0.10 (capturamos 10% del tráfico)
}

export type RevenueMethod =
  | 'adsense' | 'saas' | 'afiliado' | 'ventaServicio'
  | 'newsletter' | 'community' | 'extension' | 'templateStore' | 'ossHosting';

export interface RevenueBucket {
  min: number;
  medio: number;
  max: number;
  formula: string;
}

export interface RevenueEstimate {
  adsense:        RevenueBucket;
  saas:           RevenueBucket;
  afiliado:       RevenueBucket;
  ventaServicio:  RevenueBucket;
  newsletter:     RevenueBucket;
  community:      RevenueBucket;
  extension:      RevenueBucket;
  templateStore:  RevenueBucket;
  ossHosting:     RevenueBucket;
  best: { method: RevenueMethod; value: number };
  benchmark: {
    key: string;
    label: string;
    cpcEur: number;
    arpuSaaSMedio: number;
  };
}

/**
 * Calcula revenue mensual bajo 4 modelos. Cada uno con fórmula visible.
 */
export function estimateRevenue(input: RevenueInput): RevenueEstimate {
  const bench = lookupBenchmark(input.keyword);
  const captura = Math.max(0.05, Math.min(0.30, input.capturablePct ?? 0.10));
  const trafficMes = Math.floor(input.searchVolumeMes * captura);

  // --- 1. AdSense (web nicho que monetiza con publicidad) ---
  // revenue = trafico × CTR_ad × CPC × (1 − googleFee)
  const adsenseMedio = trafficMes * bench.ctrAd * bench.cpcEur * (1 - bench.googleFeeAdsense);
  const adsense = {
    min: Math.round(adsenseMedio * 0.6),
    medio: Math.round(adsenseMedio),
    max: Math.round(adsenseMedio * 1.5),
    formula: `traffic_mes(${trafficMes}) × ctr_ad(${bench.ctrAd}) × cpc(${bench.cpcEur}€) × (1 − googleFee(${bench.googleFeeAdsense})) = ${Math.round(adsenseMedio)}€`,
  };

  // --- 2. SaaS (conversión a plan de pago) ---
  // revenue_mensual = trafico × convSaaS × ARPU (mensual, se acumula tras mes 1)
  // Asumimos churn 5%/mes, por lo que revenue estable ≈ conv × trafficMes × arpu × 0.95
  const saasMedio = trafficMes * bench.convSaaS * bench.arpuSaaSMedio * 0.95;
  const saas = {
    min: Math.round(saasMedio * 0.5),
    medio: Math.round(saasMedio),
    max: Math.round(saasMedio * 2.0),
    formula: `traffic_mes(${trafficMes}) × conv_saas(${bench.convSaaS}) × arpu(${bench.arpuSaaSMedio}€) × retencion(0.95) = ${Math.round(saasMedio)}€`,
  };

  // --- 3. Afiliado (comisiones por venta) ---
  // revenue = trafico × conv_afiliado × comisionMedia
  const afiliadoMedio = trafficMes * bench.convAfiliado * bench.comisionMedia;
  const afiliado = {
    min: Math.round(afiliadoMedio * 0.5),
    medio: Math.round(afiliadoMedio),
    max: Math.round(afiliadoMedio * 1.8),
    formula: `traffic_mes(${trafficMes}) × conv_afiliado(${bench.convAfiliado}) × comision(${bench.comisionMedia}€) = ${Math.round(afiliadoMedio)}€`,
  };

  // --- 4. Venta de servicio a clientes (PACAME vende el molde) ---
  // Cada 1000 búsquedas/mes del nicho sugieren ~1-3 pymes que podrían pagar por servicio.
  // Asumimos 1 cliente nuevo por cada 2000 búsquedas/mes, ticket medio 500-2000€ unico + suscripción 100-300€/mes
  // revenue_mensual = (clientes/mes × suscripcion) + (clientes/mes × ticket_unico_amortizado/12)
  const clientesPotencialesMes = Math.max(1, Math.floor(input.searchVolumeMes / 2000));
  const suscripcionMedia = bench.arpuSaaSMedio * 3; // pymes pagan 3x más que consumer SaaS
  const ticketUnico = bench.arpuSaaSMedio * 25;
  const ventaServicioMedio = clientesPotencialesMes * suscripcionMedia + (clientesPotencialesMes * ticketUnico / 12);
  const ventaServicio = {
    min: Math.round(ventaServicioMedio * 0.3),
    medio: Math.round(ventaServicioMedio),
    max: Math.round(ventaServicioMedio * 2.0),
    formula: `clientes_mes(${clientesPotencialesMes}) × suscripcion(${suscripcionMedia}€) + ticket_unico_amortizado(${Math.round(ticketUnico / 12)}€/mes) = ${Math.round(ventaServicioMedio)}€`,
  };

  // --- 5. Newsletter premium ---
  // revenue = suscriptores × ARPU_newsletter × retencion(0.92)
  // Estimamos que captamos 1 suscriptor de cada 200 visitas (conv 0.5%)
  const newsletterSubs = Math.floor(trafficMes * 0.005);
  const arpuNewsletter = Math.max(5, Math.min(30, bench.arpuSaaSMedio * 0.5));
  const newsletterMedio = newsletterSubs * arpuNewsletter * 0.92;
  const newsletter: RevenueBucket = {
    min: Math.round(newsletterMedio * 0.5),
    medio: Math.round(newsletterMedio),
    max: Math.round(newsletterMedio * 2.0),
    formula: `suscriptores(${newsletterSubs}) × ARPU_newsletter(${arpuNewsletter}€) × retencion(0.92) = ${Math.round(newsletterMedio)}€`,
  };

  // --- 6. Community / membership ---
  // Similar a newsletter pero ARPU más alto (20-80€/mes) y conversión más baja
  const communityMembers = Math.floor(trafficMes * 0.003);
  const arpuCommunity = Math.max(20, Math.min(80, bench.arpuSaaSMedio * 1.5));
  const communityMedio = communityMembers * arpuCommunity * 0.90;
  const community: RevenueBucket = {
    min: Math.round(communityMedio * 0.4),
    medio: Math.round(communityMedio),
    max: Math.round(communityMedio * 2.2),
    formula: `members(${communityMembers}) × ARPU_community(${arpuCommunity}€) × retencion(0.90) = ${Math.round(communityMedio)}€`,
  };

  // --- 7. Browser extension freemium ---
  // installs = ~0.5% del tráfico. De esos, 1-3% convierte a pro (ARPU 3-15€/mes)
  const installs = Math.floor(trafficMes * 0.05);  // extensions tienen mejor conv desde SEO
  const convPro = 0.015;
  const arpuExt = Math.max(3, Math.min(15, bench.arpuSaaSMedio * 0.35));
  const extensionMedio = installs * convPro * arpuExt;
  const extension: RevenueBucket = {
    min: Math.round(extensionMedio * 0.4),
    medio: Math.round(extensionMedio),
    max: Math.round(extensionMedio * 2.0),
    formula: `installs(${installs}) × conv_pro(${convPro}) × ARPU_ext(${arpuExt}€) = ${Math.round(extensionMedio)}€`,
  };

  // --- 8. Template store (Shopify/Notion/Figma themes) ---
  // revenue = descargas × precio_medio × revenue_share
  // Conversión 1.5% del tráfico a descarga de pago
  const descargas = Math.floor(trafficMes * 0.015);
  const precioMedio = Math.max(15, Math.min(80, bench.arpuSaaSMedio * 1.2));
  const templateStoreMedio = descargas * precioMedio * 0.70;
  const templateStore: RevenueBucket = {
    min: Math.round(templateStoreMedio * 0.4),
    medio: Math.round(templateStoreMedio),
    max: Math.round(templateStoreMedio * 1.8),
    formula: `descargas(${descargas}) × precio(${precioMedio}€) × revenue_share(0.70) = ${Math.round(templateStoreMedio)}€`,
  };

  // --- 9. OSS hosting-as-a-service (fork + rebrand PACAME + hosting) ---
  // Clientes pagando hosting mensual del servicio rebrandeado.
  // Conversión 0.4% del tráfico a cliente (B2B pyme), ARPU 30-200€/mes
  const clientesOss = Math.max(1, Math.floor(trafficMes * 0.004));
  const arpuOss = Math.max(30, Math.min(200, bench.arpuSaaSMedio * 2.5));
  const ossHostingMedio = clientesOss * arpuOss * 0.93; // churn bajo B2B self-host
  const ossHosting: RevenueBucket = {
    min: Math.round(ossHostingMedio * 0.5),
    medio: Math.round(ossHostingMedio),
    max: Math.round(ossHostingMedio * 2.5),
    formula: `clientes(${clientesOss}) × ARPU_hosting(${arpuOss}€) × retencion(0.93) = ${Math.round(ossHostingMedio)}€`,
  };

  // Mejor modelo según el mayor medio
  const candidates: Array<{ m: RevenueMethod; v: number }> = [
    { m: 'adsense', v: adsense.medio },
    { m: 'saas', v: saas.medio },
    { m: 'afiliado', v: afiliado.medio },
    { m: 'ventaServicio', v: ventaServicio.medio },
    { m: 'newsletter', v: newsletter.medio },
    { m: 'community', v: community.medio },
    { m: 'extension', v: extension.medio },
    { m: 'templateStore', v: templateStore.medio },
    { m: 'ossHosting', v: ossHosting.medio },
  ];
  const best = candidates.sort((a, b) => b.v - a.v)[0];

  return {
    adsense, saas, afiliado, ventaServicio,
    newsletter, community, extension, templateStore, ossHosting,
    best: { method: best.m, value: best.v },
    benchmark: { key: bench.key, label: bench.label, cpcEur: bench.cpcEur, arpuSaaSMedio: bench.arpuSaaSMedio },
  };
}

/**
 * Devuelve un string MINIMAL con la cifra best + top 3 alternativas.
 * Reduce tokens para no saturar el prompt LLM.
 */
export function revenueToPromptString(e: RevenueEstimate): string {
  const all: Array<{ label: string; m: string; e: RevenueBucket }> = [
    { label: 'adsense', m: 'adsense', e: e.adsense },
    { label: 'saas', m: 'saas', e: e.saas },
    { label: 'afiliado', m: 'afiliado', e: e.afiliado },
    { label: 'ventaServicio', m: 'ventaServicio', e: e.ventaServicio },
    { label: 'newsletter', m: 'newsletter', e: e.newsletter },
    { label: 'community', m: 'community', e: e.community },
    { label: 'extension', m: 'extension', e: e.extension },
    { label: 'templateStore', m: 'templateStore', e: e.templateStore },
    { label: 'ossHosting', m: 'ossHosting', e: e.ossHosting },
  ].sort((a, b) => b.e.medio - a.e.medio).slice(0, 4);
  return [
    `Nicho: ${e.benchmark.label} (CPC ${e.benchmark.cpcEur}€)`,
    `BEST: ${e.best.method} = ${e.best.value}€/mes`,
    `Fórmula BEST: ${(e as any)[e.best.method].formula}`,
    `Otros modelos viables: ${all.slice(1, 4).map(x => `${x.label}(${x.e.medio}€)`).join(', ')}`,
  ].join('\n');
}
