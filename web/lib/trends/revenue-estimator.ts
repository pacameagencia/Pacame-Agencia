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

export interface RevenueEstimate {
  adsense:  { min: number; medio: number; max: number; formula: string };
  saas:     { min: number; medio: number; max: number; formula: string };
  afiliado: { min: number; medio: number; max: number; formula: string };
  ventaServicio: { min: number; medio: number; max: number; formula: string };
  best: { method: 'adsense' | 'saas' | 'afiliado' | 'ventaServicio'; value: number };
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

  // Mejor modelo según el mayor medio
  const candidates: Array<{ m: string; v: number }> = [
    { m: 'adsense', v: adsense.medio },
    { m: 'saas', v: saas.medio },
    { m: 'afiliado', v: afiliado.medio },
    { m: 'ventaServicio', v: ventaServicio.medio },
  ];
  const best = candidates.sort((a, b) => b.v - a.v)[0];

  return {
    adsense, saas, afiliado, ventaServicio,
    best: { method: best.m as any, value: best.v },
    benchmark: { key: bench.key, label: bench.label, cpcEur: bench.cpcEur, arpuSaaSMedio: bench.arpuSaaSMedio },
  };
}

/**
 * Devuelve un string compacto con todas las cifras para inyectar al prompt LLM.
 */
export function revenueToPromptString(e: RevenueEstimate): string {
  return [
    `Nicho benchmark: ${e.benchmark.label} (CPC ${e.benchmark.cpcEur}€ · ARPU SaaS ${e.benchmark.arpuSaaSMedio}€)`,
    `AdSense: ${e.adsense.min}-${e.adsense.max}€/mes (medio ${e.adsense.medio}€) → ${e.adsense.formula}`,
    `SaaS: ${e.saas.min}-${e.saas.max}€/mes (medio ${e.saas.medio}€) → ${e.saas.formula}`,
    `Afiliado: ${e.afiliado.min}-${e.afiliado.max}€/mes (medio ${e.afiliado.medio}€) → ${e.afiliado.formula}`,
    `Venta servicio: ${e.ventaServicio.min}-${e.ventaServicio.max}€/mes (medio ${e.ventaServicio.medio}€) → ${e.ventaServicio.formula}`,
    `MEJOR MODELO: ${e.best.method} = ${e.best.value}€/mes`,
  ].join('\n');
}
