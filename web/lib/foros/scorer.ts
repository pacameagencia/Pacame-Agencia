/**
 * Foros Opportunity Scorer · score 0-100 cada item recolectado.
 *
 * 6 dimensiones (suman 100):
 *   intent_fit          0-30   qué tan exacto matchea ICP DR
 *   author_authority    0-20   karma reddit / followers / posts del autor
 *   recency_bonus       0-15   <24h=15, <7d=10, <30d=5
 *   reach_proxy         0-15   thread score + replies (visibilidad esperada)
 *   competition_gap     0-10   menos respuestas existentes = más oportunidad
 *   intent_conv_history 0-10   qué intents convierten histórico (config)
 */

import type { ForoIntent } from "./intent";

export interface ScoringInput {
  intent: ForoIntent;
  intent_confidence: number;
  author_authority: number;        // raw karma/followers
  posted_at: Date | string | null;
  reach_proxy: number;             // raw upvotes + replies
  competition_count: number;       // ya respuestas/comments
}

export interface ScoringResult {
  score: number;                   // 0-100
  breakdown: {
    intent_fit: number;
    author_authority: number;
    recency_bonus: number;
    reach_proxy: number;
    competition_gap: number;
    intent_conv_history: number;
  };
}

// Pesos canónicos por intent · derivados del histórico esperado
// (mes 1 pre-validación · ajustar tras 14 días con data real)
const INTENT_FIT: Record<ForoIntent, number> = {
  pregunta_alternativa_pago: 30, // máximo · prospect caliente
  mencion_competidor:        28, // muy caliente · puede educar
  pregunta_stack_tools:      24,
  pregunta_dropship_finder:  22,
  comparativa_pricing:       20,
  pregunta_uso_ia:           14,
  no_relevante:               0,
};

const INTENT_CONV_HISTORY: Record<ForoIntent, number> = {
  pregunta_alternativa_pago: 10,
  mencion_competidor:         9,
  pregunta_dropship_finder:   8,
  pregunta_stack_tools:       7,
  comparativa_pricing:        5,
  pregunta_uso_ia:            3,
  no_relevante:               0,
};

function authorAuthorityScore(raw: number): number {
  if (raw <= 0) return 0;
  if (raw >= 10000) return 20;
  if (raw >= 5000) return 18;
  if (raw >= 1000) return 14;
  if (raw >= 500)  return 10;
  if (raw >= 100)  return 6;
  if (raw >= 20)   return 3;
  return 1;
}

function recencyScore(postedAt: Date | string | null): number {
  if (!postedAt) return 0;
  const t = postedAt instanceof Date ? postedAt.getTime() : Date.parse(String(postedAt));
  if (!Number.isFinite(t)) return 0;
  const ageHours = (Date.now() - t) / (1000 * 60 * 60);
  if (ageHours <= 24) return 15;
  if (ageHours <= 24 * 7) return 10;
  if (ageHours <= 24 * 30) return 5;
  return 0;
}

function reachProxyScore(raw: number): number {
  if (raw <= 0) return 0;
  if (raw >= 200) return 15;
  if (raw >= 50)  return 12;
  if (raw >= 20)  return 9;
  if (raw >= 5)   return 5;
  return 2;
}

function competitionGapScore(comments: number): number {
  // Menos comments = más oportunidad de visibilidad
  if (comments === 0) return 10;
  if (comments <= 3)  return 9;
  if (comments <= 10) return 7;
  if (comments <= 25) return 4;
  if (comments <= 50) return 2;
  return 0;
}

export function scoreOpportunity(input: ScoringInput): ScoringResult {
  const breakdown = {
    intent_fit: Math.round(INTENT_FIT[input.intent] * input.intent_confidence),
    author_authority: authorAuthorityScore(input.author_authority || 0),
    recency_bonus: recencyScore(input.posted_at),
    reach_proxy: reachProxyScore(input.reach_proxy || 0),
    competition_gap: competitionGapScore(input.competition_count || 0),
    intent_conv_history: INTENT_CONV_HISTORY[input.intent],
  };
  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score: Math.min(100, Math.max(0, score)), breakdown };
}
