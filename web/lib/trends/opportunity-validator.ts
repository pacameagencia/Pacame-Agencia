/**
 * Validador anti-invento.
 *
 * Filtra oportunidades generadas por el LLM que:
 * - Mencionen eventos pasados (Semana Santa 2026 ya fue, etc.)
 * - Tengan cifras inventadas (sin fórmula ni fuente)
 * - No tengan al menos 2 data_sources referenciables
 * - Tengan search_volume_mes = 0
 */
import { upcomingSpanishEvents } from "./spanish-events";

export interface OpportunityCandidate {
  title: string;
  type: string;
  niche: string;
  monetization_vias: string[];
  why_now: string;
  revenue_medio_eur: number;
  revenue_formula: string;       // ej "traffic × ctr × cpc × 0.68"
  execution_days: number;
  action: string;
  data_sources: string[];        // URLs reales consultadas
  search_volume_mes: number;
  keyword_seed: string;
  tags: string[];
}

export interface ValidationResult {
  valid: boolean;
  reasons_rejected: string[];
  warnings: string[];
}

/**
 * Eventos PASADOS que pueden aparecer inventados en el output LLM.
 * Se construyen dinámicamente desde el calendario real.
 */
function pastEventsKeywords(today = new Date()): string[] {
  // Heurística: eventos de los últimos 30 días ya pasados
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  // Usamos una ventana negativa: buscamos en -30d
  const allEvents = upcomingSpanishEvents(-1, todayUtc);
  // El helper solo devuelve daysFromToday >= 0, por lo que hacemos manual:
  const past: string[] = [];
  const thisYear = today.getUTCFullYear();
  const fixed = [
    `${thisYear}-01-06`, `${thisYear}-02-14`, `${thisYear}-03-19`,
  ];
  const pastKeywords: string[] = [];
  const monthNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const month = today.getUTCMonth();
  for (let m = month - 2; m < month; m++) {
    if (m >= 0) pastKeywords.push(monthNames[m]);
  }
  // Añadir nombres de eventos pasados típicos
  if (month > 1) pastKeywords.push('reyes magos', 'san valentín', 'año nuevo');
  if (month > 2) pastKeywords.push('día del padre');
  if (month > 3) pastKeywords.push('semana santa', 'pascua', 'nazareno', 'torrija', 'capirote', 'procesion');
  if (month > 4) pastKeywords.push('día de la madre', 'feria de abril');
  if (month > 5) pastKeywords.push('san isidro', 'eurovisión');
  if (month > 6) pastKeywords.push('san juan');
  if (month > 7) pastKeywords.push('primavera', 'inicio verano');
  if (month > 9) pastKeywords.push('vuelta al cole', 'septiembre', 'halloween');
  if (month > 10) pastKeywords.push('black friday', 'todos los santos', 'pilar');
  if (month === 0) pastKeywords.push('noche vieja', 'nochebuena', 'navidad');
  return pastKeywords;
}

export function validateOpportunity(
  op: OpportunityCandidate,
  opts: { minRevenue?: number; minSources?: number; today?: Date } = {}
): ValidationResult {
  const minRevenue = opts.minRevenue ?? 1000;
  const minSources = opts.minSources ?? 2;
  const reasons: string[] = [];
  const warnings: string[] = [];

  // 1. Revenue >= threshold
  if (typeof op.revenue_medio_eur !== 'number' || op.revenue_medio_eur < minRevenue) {
    reasons.push(`revenue_medio (${op.revenue_medio_eur}€) < ${minRevenue}€`);
  }

  // 2. Tiene fórmula explícita
  if (!op.revenue_formula || op.revenue_formula.length < 20) {
    reasons.push(`revenue_formula ausente o demasiado corta (debe explicar cómo se calcula)`);
  }

  // 3. Data sources mínimas
  if (!Array.isArray(op.data_sources) || op.data_sources.length < minSources) {
    reasons.push(`solo ${op.data_sources?.length ?? 0} data_sources (mín ${minSources})`);
  } else {
    // Validar que son URLs reales
    const invalid = op.data_sources.filter(s => !/^https?:\/\/\S+$/.test(s));
    if (invalid.length > 0) {
      warnings.push(`data_sources con formato no-URL: ${invalid.join(', ')}`);
    }
  }

  // 4. Search volume > 0
  if (!op.search_volume_mes || op.search_volume_mes === 0) {
    reasons.push(`search_volume_mes = 0 (sin demanda verificada)`);
  }

  // 5. No menciona eventos pasados
  const pastKws = pastEventsKeywords(opts.today);
  const haystack = `${op.title} ${op.why_now} ${op.niche} ${op.action}`.toLowerCase();
  const mentionedPast = pastKws.filter(kw => haystack.includes(kw));
  if (mentionedPast.length > 0) {
    reasons.push(`menciona evento(s) pasado(s): ${mentionedPast.join(', ')}`);
  }

  // 6. why_now_real debe citar un evento próximo o dato concreto
  if (!op.why_now || op.why_now.length < 30) {
    warnings.push(`why_now demasiado corto o genérico`);
  }

  // 7. action debe ser accionable (<=3 días usualmente)
  if (op.execution_days && op.execution_days > 90) {
    warnings.push(`execution_days > 90d (poco accionable)`);
  }

  return {
    valid: reasons.length === 0,
    reasons_rejected: reasons,
    warnings,
  };
}
