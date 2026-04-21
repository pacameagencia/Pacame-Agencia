/**
 * GET /api/neural/opportunity-scanner
 *
 * Cron diario 8am UTC: los agentes escanean el dia a dia y detectan oportunidades
 * de venta concretas con potencial >= 1.000 EUR (directiva Pablo 2026-04-21).
 *
 * V1: genera 5-8 oportunidades por razonamiento LLM con contexto estacional
 *     + identidad Pablo + memorias/discoveries existentes. Cada oportunidad:
 *       - Se registra como agent_discoveries type='opportunity'
 *       - Se notifica a Pablo por Telegram si score >= 0.7
 *
 * V2 futuro: integrar SerpApi / Apify Google Trends / Reddit / Product Hunt.
 *
 * Activacion: vercel.json cron "0 8 * * *"
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { recordDiscovery, routeInput } from "@/lib/neural";
import { llmChat } from "@/lib/llm";
import { sendTelegram } from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 300;

interface Opportunity {
  title: string;
  type: string; // 'web-nicho' | 'saas-vertical' | 'infoproducto' | 'ecommerce' | 'affiliate' | 'app-movil' | ...
  niche: string;
  monetization: string;
  why_now: string;
  estimated_monthly_eur: number;
  execution_days: number;
  confidence: number; // 0..1
  action: string;
  tags: string[];
}

const MIN_EUR = 1000;

function getSeasonContext(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const seasons: Record<string, string> = {
    '1-enero': 'Enero: post-navidad, propositos de ano nuevo, dieta, gimnasio, coaching, finanzas personales, productividad',
    '2-febrero': 'Febrero: San Valentin (14), regalos, experiencias parejas, lenceria, restaurantes',
    '3-marzo': 'Marzo: cambio horario, primavera, inicio campanas verano, bodas, dia del padre (19)',
    '4-abril': 'Abril: Semana Santa, turismo interior, reformas, jardines, primavera flores, ciclismo',
    '5-mayo': 'Mayo: dia madre (segundo domingo), comuniones, terrazas, ferias Andalucia',
    '6-junio': 'Junio: verano proximo, bodas pico, Pride (LGTB), vacaciones planificadas, graduaciones',
    '7-julio': 'Julio: verano, playa, viajes, refrescos, protectores solares, San Fermin (7)',
    '8-agosto': 'Agosto: vacaciones, turismo rural/playa, aire acondicionado, festivales',
    '9-septiembre': 'Septiembre: vuelta al cole, uniformes, libros, propositos nuevo curso, fitness reencendido',
    '10-octubre': 'Octubre: Halloween (31), cambio estacion, finde largo Pilar, moda otono',
    '11-noviembre': 'Noviembre: Black Friday (4 viernes), Cyber Monday, compras navidad anticipadas',
    '12-diciembre': 'Diciembre: Navidad, regalos, fin de ano, cenas empresa, Reyes (5-6 enero)',
  };
  const key = `${month}-${['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][month-1]}`;
  const ctx = seasons[key] || '';
  const week = Math.ceil(day / 7);
  return `Hoy es ${day}/${month}/${now.getFullYear()} (semana ${week} del mes). Contexto estacional: ${ctx}`;
}

const SYSTEM_PROMPT = `Eres DIOS, el orquestador PACAME. Tu tarea: detectar HOY oportunidades de
negocio online concretas que PACAME pueda construir con IA, vender a clientes Y tambien
tener como activo propio (doble monetizacion).

REGLAS INNEGOCIABLES:
- Potencial minimo: 1.000 EUR/mes. Por debajo, descartar.
- Cada oportunidad debe ser construible con IA con supervision minima de Pablo.
- Tipo variado: web nicho (ads), SaaS vertical, infoproducto, ecommerce, affiliate,
  marketplace, app movil, videojuego casual, herramienta, comparador, generador, etc.
- Nivel UBER: nada sencillito. Si es delivery, compite con los grandes.
- Modelo Hormozi: valor grande primero + recurrencia/upsell.
- Aprovecha la estacionalidad REAL de hoy.
- Honestidad brutal: si no hay buenas oportunidades hoy, di 3 en vez de 7 inventadas.

Devuelve SOLO JSON valido con esta estructura:
{
  "opportunities": [
    {
      "title": "titulo corto",
      "type": "web-nicho|saas-vertical|infoproducto|ecommerce|affiliate|app-movil|...",
      "niche": "nicho especifico",
      "monetization": "como factura (adsense, subscripcion, comision, etc.)",
      "why_now": "por que AHORA y no en 3 meses (estacionalidad, tendencia, evento)",
      "estimated_monthly_eur": 3500,
      "execution_days": 14,
      "confidence": 0.75,
      "action": "proximo paso concreto para Pablo",
      "tags": ["tag1","tag2"]
    }
  ]
}`;

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const started = Date.now();
  const season = getSeasonContext();

  // Contexto cerebral: identidad Pablo + memorias relevantes
  const route = await routeInput({
    input: `detectar oportunidades de negocio online rentables hoy ${season}`,
    source: "cron",
    channel: "opportunity-scanner",
    agentHint: "dios",
  }).catch(() => null);

  const brainContext = route?.context || "";

  const userPrompt = `${season}

CONTEXTO CEREBRAL (identidad Pablo + memorias aprendidas):
${brainContext}

Genera entre 5 y 8 oportunidades para HOY. Que sean DIFERENTES entre si en tipo y nicho.
Cada una debe ser accionable esta semana si Pablo decide ejecutarla.

IMPORTANTE: JSON valido, sin texto antes ni despues.`;

  let opportunities: Opportunity[] = [];
  try {
    const res = await llmChat(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      { tier: "titan", maxTokens: 3000, temperature: 0.7, agentId: "dios", source: "opportunity-scanner" }
    );
    const jsonMatch = res.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      opportunities = Array.isArray(parsed.opportunities) ? parsed.opportunities : [];
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, step: "llm" }, { status: 502 });
  }

  // Filtrar por umbral 1.000 EUR
  const valid = opportunities.filter(o => typeof o.estimated_monthly_eur === 'number' && o.estimated_monthly_eur >= MIN_EUR);

  // Registrar como discoveries
  const discoveryIds: string[] = [];
  for (const op of valid) {
    const id = await recordDiscovery({
      agentId: "dios",
      type: "service_idea",
      title: op.title,
      description: `Tipo: ${op.type}. Nicho: ${op.niche}. Monetizacion: ${op.monetization}. Por que ahora: ${op.why_now}. Estimado: ${op.estimated_monthly_eur}/mes. Ejecucion: ${op.execution_days} dias. Confidence: ${op.confidence}.`,
      impact: op.estimated_monthly_eur >= 5000 ? "high" : op.estimated_monthly_eur >= 2000 ? "medium" : "low",
      confidence: op.confidence ?? 0.7,
      actionable: true,
      suggestedAction: op.action,
      metadata: {
        source: "opportunity-scanner",
        season,
        opportunity: op,
        scan_date: new Date().toISOString().slice(0, 10),
      },
    });
    if (id) discoveryIds.push(id);
  }

  // Notificar a Pablo por Telegram con las top 3 (si hay)
  let telegramSent = false;
  if (valid.length > 0) {
    const top = [...valid].sort((a, b) => (b.estimated_monthly_eur * b.confidence) - (a.estimated_monthly_eur * a.confidence)).slice(0, 3);
    const msg = [
      `🎯 <b>Oportunidades detectadas hoy</b>`,
      `<i>${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</i>`,
      ``,
      ...top.map((o, i) => [
        `<b>${i + 1}. ${o.title}</b>`,
        `💰 ${o.estimated_monthly_eur}€/mes | ⏱️ ${o.execution_days}d | 🎯 ${Math.round(o.confidence * 100)}%`,
        `📦 ${o.type} · ${o.niche}`,
        `💡 ${o.why_now}`,
        `→ ${o.action}`,
        ``,
      ].join('\n')),
      `Total detectadas: ${valid.length}. Resto en /dashboard/neural.`,
    ].join('\n');
    try {
      await sendTelegram(msg);
      telegramSent = true;
    } catch { /* no-op */ }
  }

  return NextResponse.json({
    ok: true,
    latency_ms: Date.now() - started,
    scanned: opportunities.length,
    valid: valid.length,
    discarded_below_1000eur: opportunities.length - valid.length,
    discovery_ids: discoveryIds,
    telegram_sent: telegramSent,
    season,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
