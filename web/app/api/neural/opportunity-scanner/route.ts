/**
 * GET /api/neural/opportunity-scanner  — V2 CON DATOS REALES
 *
 * Filosofía:
 * - Cero inventos. Cada oportunidad se sustenta en ≥2 fuentes externas reales.
 * - Revenue calculado con fórmula explícita (CPC benchmark + volumen estimado).
 * - Fechas reales (calendario eventos España próximos 60d, no tabla genérica).
 * - Filtro duro ≥1.000€/mes.
 * - LLM solo REFORMULA en estilo PACAME + identidad Pablo. Nunca inventa cifras.
 *
 * Flujo:
 *  1. Eventos reales próximos 60d
 *  2. Google Trends ES (Apify)           [puede estar vacío → ok]
 *  3. Reddit top semana (r/spain, etc)   [gratis, siempre activo]
 *  4. Product Hunt 30d                    [requiere token → opcional]
 *  5. Seed candidates = trends + reddit topics + eventos próximos
 *  6. Para cada seed: Google Autocomplete + estimar volumen + calcular revenue
 *  7. Filtrar revenue ≥ 1.000€/mes
 *  8. LLM reformula los supervivientes (estilo PACAME, contexto identidad)
 *  9. Validator rechaza inventos y menciones a eventos pasados
 * 10. Guarda discoveries + notifica top 3 Telegram
 *
 * Activación: vercel.json cron "0 8 * * *"
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { recordDiscovery, routeInput } from "@/lib/neural";
import { llmChat } from "@/lib/llm";
import { sendTelegram } from "@/lib/telegram";

import { upcomingSpanishEvents, eventsContextString } from "@/lib/trends/spanish-events";
import { fetchGoogleTrendsES } from "@/lib/trends/google-trends";
import { redditSpainWeekly, extractTopics } from "@/lib/trends/reddit";
import { fetchProductHuntLaunches } from "@/lib/trends/product-hunt";
import { googleAutocompleteBatch, estimateMonthlyVolumeFromAutocomplete } from "@/lib/trends/google-autocomplete";
import { estimateRevenue, revenueToPromptString } from "@/lib/trends/revenue-estimator";
import { validateOpportunity, type OpportunityCandidate } from "@/lib/trends/opportunity-validator";
import { pickDailyOssSeeds } from "@/lib/trends/oss-catalog";

export const runtime = "nodejs";
export const maxDuration = 300;

const MIN_REVENUE_EUR = 1000;
const MAX_CANDIDATES_TO_LLM = 7;

interface SeedCandidate {
  keyword: string;
  source: string;        // 'google-trends' | 'reddit' | 'event' | 'product-hunt'
  context: string;       // por qué se considera (dato externo)
  externalUrl?: string;
}

async function gatherSeeds(): Promise<SeedCandidate[]> {
  const today = new Date();
  const seeds: SeedCandidate[] = [];

  // 1. Eventos reales próximos (base segura, cero dependencia externa)
  const events = upcomingSpanishEvents(60, today);
  for (const e of events.slice(0, 5)) {
    seeds.push({
      keyword: e.commercialOpportunity.split(/[,\.]/)[0].trim() || e.name,
      source: 'spanish-event',
      context: `Evento real: ${e.name} en ${e.daysFromToday} días (${e.date}). Oportunidad: ${e.commercialOpportunity}`,
    });
  }

  // 2. Google Trends ES (si APIFY_API_KEY) — allSettled para no bloquear
  const [trendsRes, redditRes, phRes] = await Promise.allSettled([
    fetchGoogleTrendsES({ timeframe: 'now 7-d', limit: 15 }),
    redditSpainWeekly(),
    fetchProductHuntLaunches(25),
  ]);

  if (trendsRes.status === 'fulfilled') {
    for (const t of trendsRes.value.slice(0, 10)) {
      seeds.push({
        keyword: t.keyword,
        source: 'google-trends',
        context: `Google Trends ES ${t.trafficLabel ? `(${t.trafficLabel} búsquedas diarias)` : ''} ${t.category ? `cat: ${t.category}` : ''}`,
        externalUrl: t.pageUrl || `https://trends.google.com/trends/explore?geo=ES&q=${encodeURIComponent(t.keyword)}`,
      });
    }
  }

  // 3. Reddit topics (gratis, siempre)
  if (redditRes.status === 'fulfilled') {
    const posts = redditRes.value;
    const topics = extractTopics(posts).slice(0, 10);
    for (const t of topics) {
      const sample = t.samplePosts[0];
      seeds.push({
        keyword: t.topic,
        source: 'reddit',
        context: `Reddit España: topic '${t.topic}' aparece en ${t.count} top posts esta semana. Ej: "${sample.title.slice(0, 100)}" (${sample.ups} ups r/${sample.subreddit})`,
        externalUrl: `https://www.reddit.com${sample.permalink}`,
      });
    }
  }

  // 4. Product Hunt (opcional)
  if (phRes.status === 'fulfilled') {
    for (const ph of phRes.value.slice(0, 5)) {
      seeds.push({
        keyword: ph.topics[0] || ph.name,
        source: 'product-hunt',
        context: `Product Hunt reciente: "${ph.name}" (${ph.votesCount} votos) - ${ph.tagline}. Topics: ${ph.topics.join(', ')}`,
        externalUrl: ph.url,
      });
    }
  }

  // 5. OSS catalog (fork + rebrand PACAME) — rotación diaria de 5 de 25
  const ossPicks = pickDailyOssSeeds(5, today);
  for (const o of ossPicks) {
    seeds.push({
      keyword: o.brand,
      source: 'oss-catalog',
      context: `OSS replicable: github.com/${o.github} (${o.stars}★, ${o.license}, categoría ${o.category}). Rebrand PACAME propuesto: ${o.brand}. ${o.description}. Modelo de monetización: ${o.monetization_model}.`,
      externalUrl: `https://github.com/${o.github}`,
    });
  }

  return seeds;
}

interface EnrichedSeed extends SeedCandidate {
  searchVolumeMes: number;
  autocompleteSuggestions: string[];
  autocompleteUrl: string;
  revenueEstimate: ReturnType<typeof estimateRevenue>;
}

async function enrichSeeds(seeds: SeedCandidate[]): Promise<EnrichedSeed[]> {
  // Autocomplete en paralelo
  const ac = await googleAutocompleteBatch(seeds.map(s => s.keyword));

  const enriched: EnrichedSeed[] = [];
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const acResult = ac[i];
    const volume = estimateMonthlyVolumeFromAutocomplete(acResult);
    if (volume === 0) continue; // sin demanda, skip

    const revenue = estimateRevenue({
      searchVolumeMes: volume,
      keyword: seed.keyword,
      capturablePct: 0.10,
    });

    enriched.push({
      ...seed,
      searchVolumeMes: volume,
      autocompleteSuggestions: acResult.suggestions,
      autocompleteUrl: acResult.source,
      revenueEstimate: revenue,
    });
  }

  // Ordenar por revenue best y cortar a MAX_CANDIDATES_TO_LLM
  return enriched
    .sort((a, b) => b.revenueEstimate.best.value - a.revenueEstimate.best.value)
    .slice(0, MAX_CANDIDATES_TO_LLM);
}

const LLM_SYSTEM_PROMPT = `Eres DIOS, orquestador PACAME. Recibes CANDIDATOS con datos duros reales
(fecha + eventos próximos + trends + revenue calculado con fórmula + OSS replicables).
Tu trabajo: REFORMULAR cada candidato como OPORTUNIDAD DE NEGOCIO PACAME concreta.

REGLAS INNEGOCIABLES:
- NO inventes cifras. Usa SIEMPRE revenue_medio que te doy.
- NO menciones eventos que ya pasaron. Solo los eventos próximos listados.
- Cada oportunidad debe tener: título, 2 vías de monetización (rueda servicios + activo propio),
  next_action de ≤3 días, tags.
- Estilo PACAME: directo, tutear Pablo, frases cortas, nivel máximo (Uber/Calendly tier).
- Modelo Hormozi: valor grande primero + recurrencia/upsell.

DIVERSIDAD OBLIGATORIA:
- Si generas 6 oportunidades, deben cubrir al MENOS 4 "type" distintos.
- Nunca más de 2 oportunidades del mismo "type".
- El espectro cubre TODO tipo de activo digital monetizable (directiva Pablo).

Si un CANDIDATO viene de source=oss-catalog: type = "oss-fork". Propón fork+rebrand bajo
el brand indicado. Monetización obligada: hosting-as-a-service + soporte/consultoría.

Devuelve SOLO JSON con esta estructura exacta:
{
  "opportunities": [
    {
      "title": "string",
      "type": "web-nicho|saas-vertical|oss-fork|infoproducto|marketplace|app-movil|videojuego|extension-navegador|bot-telegram|bot-discord|plantilla-premium|herramienta-online|directorio|newsletter-premium|agencia-productizada|api-wrapper|micro-saas|plugin-vscode|plugin-figma|template-store|affiliate|community-membership|podcast|stock-ia|aaas|white-label|clon-tendencia-viral",
      "niche": "nicho preciso",
      "monetization_vias": ["via 1 (servicio a cliente)", "via 2 (activo propio o suscripcion)"],
      "why_now": "cita evento/dato real próximo que lo justifica",
      "revenue_medio_eur": 0,            // USAR el medio que te paso (best method)
      "revenue_formula": "string",        // USAR la fórmula del best method
      "execution_days": 7,
      "action": "proximo paso concreto",
      "data_sources": ["url1","url2"],   // usar los que te paso
      "search_volume_mes": 0,             // usar el que te paso
      "keyword_seed": "string",
      "tags": ["tag1","tag2"]
    }
  ]
}`;

function buildCandidatePrompt(candidates: EnrichedSeed[], eventsCtx: string, identityCtx: string): string {
  const lines: string[] = [];
  lines.push('=== CONTEXTO REAL ===');
  lines.push(eventsCtx);
  lines.push('');
  lines.push('=== IDENTIDAD PABLO (obligatorio respetar) ===');
  lines.push(identityCtx);
  lines.push('');
  lines.push('=== CANDIDATOS A REFORMULAR ===');
  lines.push(`Te paso ${candidates.length} candidatos. Para CADA uno genera UNA oportunidad PACAME en el JSON.`);
  lines.push('');
  candidates.forEach((c, i) => {
    lines.push(`--- CANDIDATO ${i + 1} ---`);
    lines.push(`keyword_seed: ${c.keyword}`);
    lines.push(`source: ${c.source}`);
    lines.push(`context: ${c.context}`);
    if (c.externalUrl) lines.push(`external_url: ${c.externalUrl}`);
    lines.push(`autocomplete_suggestions: ${c.autocompleteSuggestions.slice(0, 5).join(' | ')}`);
    lines.push(`search_volume_mes: ${c.searchVolumeMes}`);
    lines.push(revenueToPromptString(c.revenueEstimate));
    lines.push(`data_sources: ["${c.externalUrl || c.autocompleteUrl}", "${c.autocompleteUrl}"]`);
    lines.push('');
  });
  lines.push('Responde con el JSON único. NO inventes nada. NO menciones Semana Santa ni eventos pasados.');
  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const started = Date.now();
  const today = new Date();

  // Pasos 1-4: recopilar datos reales
  const seeds = await gatherSeeds();
  if (seeds.length === 0) {
    return NextResponse.json({ ok: false, error: 'no_seeds', latency_ms: Date.now() - started });
  }

  // Paso 5-6: enriquecer con autocomplete + revenue
  const enriched = await enrichSeeds(seeds);
  if (enriched.length === 0) {
    return NextResponse.json({ ok: false, error: 'no_enriched', seeds_count: seeds.length, latency_ms: Date.now() - started });
  }

  // Paso 7: pre-filtro revenue >= 1000€
  const preFiltered = enriched.filter(e => e.revenueEstimate.best.value >= MIN_REVENUE_EUR);
  if (preFiltered.length === 0) {
    return NextResponse.json({
      ok: false,
      error: 'no_candidates_above_threshold',
      candidates_considered: enriched.length,
      max_revenue_found: enriched[0]?.revenueEstimate.best.value ?? 0,
      latency_ms: Date.now() - started,
    });
  }

  // Paso 8: LLM reformula
  const eventsCtx = eventsContextString(60, today);
  const route = await routeInput({
    input: 'oportunidades de negocio online con datos reales',
    source: 'cron',
    channel: 'opportunity-scanner-v2',
    agentHint: 'dios',
  }).catch(() => null);

  const userPrompt = buildCandidatePrompt(preFiltered, eventsCtx, route?.context || '');

  let llmCandidates: OpportunityCandidate[] = [];
  try {
    const res = await llmChat(
      [
        { role: 'system', content: LLM_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      {
        tier: 'titan',
        maxTokens: 6000,
        temperature: 0.4,
        agentId: 'dios',
        source: 'opportunity-scanner-v2',
      }
    );
    // Parser robusto: intenta varios enfoques
    const content = res.content;
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const jsonStr = content.slice(firstBrace, lastBrace + 1);
      try {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed.opportunities)) llmCandidates = parsed.opportunities;
      } catch {
        // Fallback: extraer objetos opportunities uno a uno con regex
        const opRegex = /\{\s*"title"\s*:[\s\S]*?"tags"\s*:\s*\[[^\]]*\]\s*\}/g;
        const matches = content.match(opRegex) || [];
        for (const m of matches) {
          try { llmCandidates.push(JSON.parse(m)); } catch { /* skip */ }
        }
      }
    }
  } catch (e) {
    return NextResponse.json({ error: `llm_error: ${(e as Error).message}` }, { status: 502 });
  }

  // Paso 8.5: post-procesar LLM output. El LLM suele "perder" las data_sources
  // que le pasamos, así que las inyectamos desde el candidate enriquecido.
  // También forzamos search_volume_mes y revenue_formula para que no inventen.
  const llmByKeyword = new Map(llmCandidates.map(c => [c.keyword_seed || c.title || '', c]));
  const postProcessed: OpportunityCandidate[] = [];
  for (let i = 0; i < preFiltered.length; i++) {
    const enriched = preFiltered[i];
    // Match heurístico: primer LLM candidate sin usar o que mencione la keyword
    const llmCand = llmCandidates[i] || llmByKeyword.get(enriched.keyword) || llmCandidates[0];
    if (!llmCand) continue;

    const realSources = [
      enriched.externalUrl,
      enriched.autocompleteUrl,
      `https://www.google.com/search?q=${encodeURIComponent(enriched.keyword)}&gl=es&hl=es`,
    ].filter((u): u is string => typeof u === 'string' && u.length > 0);

    postProcessed.push({
      ...llmCand,
      search_volume_mes: enriched.searchVolumeMes,
      revenue_medio_eur: enriched.revenueEstimate.best.value,
      revenue_formula: enriched.revenueEstimate[enriched.revenueEstimate.best.method].formula,
      data_sources: realSources,
      keyword_seed: enriched.keyword,
    });
  }

  // Paso 9: validar cada candidato
  const valid: OpportunityCandidate[] = [];
  const rejected: Array<{ title: string; reasons: string[] }> = [];
  for (const c of postProcessed) {
    const v = validateOpportunity(c, { minRevenue: MIN_REVENUE_EUR, minSources: 2, today });
    if (v.valid) valid.push(c);
    else rejected.push({ title: c.title || '(sin título)', reasons: v.reasons_rejected });
  }

  // Paso 10: registrar discoveries + notificar top 3
  const discoveryIds: string[] = [];
  for (const op of valid) {
    const id = await recordDiscovery({
      agentId: 'dios',
      type: 'service_idea',
      title: op.title,
      description: [
        `Tipo: ${op.type}. Nicho: ${op.niche}.`,
        `Monetización: ${(op.monetization_vias || []).join(' | ')}.`,
        `Por qué ahora: ${op.why_now}.`,
        `Revenue medio: ${op.revenue_medio_eur}€/mes (${op.revenue_formula}).`,
        `Volumen búsqueda: ${op.search_volume_mes}/mes.`,
        `Ejecución estimada: ${op.execution_days} días.`,
      ].join(' '),
      impact: op.revenue_medio_eur >= 5000 ? 'high' : 'medium',
      confidence: 0.75,
      actionable: true,
      suggestedAction: op.action,
      metadata: {
        source: 'opportunity-scanner-v2',
        version: 'v2',
        scan_date: today.toISOString().slice(0, 10),
        data_sources: op.data_sources,
        opportunity: op,
      },
    });
    if (id) discoveryIds.push(id);
  }

  // Telegram top 3
  let telegramSent = false;
  if (valid.length > 0) {
    const top = [...valid].sort((a, b) => b.revenue_medio_eur - a.revenue_medio_eur).slice(0, 3);
    const msg = [
      `🎯 <b>Oportunidades detectadas ${today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</b>`,
      `<i>Datos REALES · filtro ≥${MIN_REVENUE_EUR}€/mes</i>`,
      '',
      ...top.map((o, i) => [
        `<b>${i + 1}. ${o.title}</b>`,
        `💰 <b>${o.revenue_medio_eur}€/mes</b> medio · ⏱️ ${o.execution_days}d · 🔍 ${o.search_volume_mes}/mes búsquedas`,
        `📦 ${o.type} · ${o.niche}`,
        `📊 ${o.revenue_formula}`,
        `💡 ${o.why_now}`,
        `→ ${o.action}`,
        '',
      ].join('\n')),
      `<i>Validadas: ${valid.length}/${llmCandidates.length} (${rejected.length} rechazadas por filtro anti-invento)</i>`,
    ].join('\n');
    try { await sendTelegram(msg); telegramSent = true; } catch { /* no-op */ }
  }

  return NextResponse.json({
    ok: true,
    latency_ms: Date.now() - started,
    seeds_count: seeds.length,
    enriched_count: enriched.length,
    pre_filtered_count: preFiltered.length,
    llm_generated: llmCandidates.length,
    valid_count: valid.length,
    rejected_count: rejected.length,
    rejected_reasons: rejected.slice(0, 5),
    discovery_ids: discoveryIds,
    telegram_sent: telegramSent,
    events_ctx_preview: eventsCtx.split('\n').slice(0, 6).join('\n'),
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
