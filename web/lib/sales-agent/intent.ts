/**
 * Intent qualification para DarkRoom Sales Agent.
 *
 * Detecta de qué viene el lead en su primer mensaje:
 *   - info / pricing / legal / refund / cancel / upgrade / refer / sub / member / spam / other
 *
 * Multi-brand: el detector es genérico, las acciones downstream se diferencian
 * por brand (PACAME usa `pablo-persona.ts`, DarkRoom usa `persona-darkroom.ts`).
 */

export type DarkRoomIntent =
  | "info"          // qué es DarkRoom, cómo funciona
  | "pricing"       // cuánto cuesta, comparativa precios
  | "legal"         // ¿esto es legal? abogado / cease-and-desist
  | "stack"         // qué herramientas incluye
  | "trial"         // quiero probar / cómo va el trial
  | "refund"        // devolución, reembolso
  | "cancel"        // cancelar, baja
  | "upgrade"       // upgrade plan / change plan
  | "downgrade"     // bajar plan
  | "refer"         // referidos, afiliados, Crew, comisión
  | "member"        // soporte miembro (login, acceso, problema cuenta)
  | "spam"          // spam, bot extranjero, fuera de tema
  | "unknown"       // saludo genérico, info muy vaga
  | "other";

export interface QualifiedIntent {
  intent: DarkRoomIntent;
  confidence: number;  // 0..1
  signal: string;      // qué frase del lead disparó la detección
}

const PATTERNS: Array<{ intent: DarkRoomIntent; rx: RegExp }> = [
  // legal — prioridad alta (escalar humano)
  { intent: "legal", rx: /\b(abogad[oa]s?|cease\s*and\s*desist|denunciar?|burofax|illegal|delito|legal\s*real|adobe\s*va\s*a\s*denunciar|sois\s*legales|es\s*legal\??|piracy|piratear|cracker|copyright)\b/i },

  // refund — prioridad alta (escalar)
  { intent: "refund", rx: /\b(reembolso|refund|devoluci[oó]n|devolver\s*el\s*dinero|me\s*devolvais|chargeback|disputa)\b/i },

  // cancel
  { intent: "cancel", rx: /\b(cancelar|darme\s*de\s*baja|baja|unsubscribe|cancel\s*sub|borrar\s*cuenta)\b/i },

  // upgrade / downgrade
  { intent: "upgrade", rx: /\b(upgrade|subir\s*plan|cambiar\s*a\s*pro|cambiar\s*a\s*studio|pasar\s*a\s*pro|pasar\s*a\s*studio)\b/i },
  { intent: "downgrade", rx: /\b(downgrade|bajar\s*plan|pasar\s*a\s*starter|cambiar\s*a\s*starter)\b/i },

  // refer / Crew
  { intent: "refer", rx: /\b(referid[oa]s?|afilia[dt]o[ds]?|crew|comisi[oó]n|porcentaje\s*referido|programa\s*partner|recomend(ar|aci[oó]n)|invitar\s*amigos?)\b/i },

  // member support
  { intent: "member", rx: /\b(no\s*me\s*deja\s*entrar|no\s*puedo\s*acceder|me\s*ha\s*expulsado|me\s*expulsa|sesi[oó]n\s*caducada|cuenta\s*caida|adobe\s*me\s*pide|me\s*pide\s*contraseña|reset\s*password|olvid[eé]\s*la\s*contraseña|no\s*funciona\s*figma|no\s*funciona\s*adobe)\b/i },

  // pricing
  { intent: "pricing", rx: /\b(precio|cu[aá]nto\s*(cuesta|vale|sale)|cu[oó]nto|cu[aá]nto\s*es|cuanto|cobra[isn]?|tarifa|cuesta|monthly|anual|al\s*mes|al\s*año|29\s*€|49\s*€|15\s*€)\b/i },

  // stack — qué herramientas
  { intent: "stack", rx: /\b(qu[eé]\s*herramientas|qu[eé]\s*incluye|adobe|figma|midjourney|chatgpt|canva|cinema\s*4d|premiere|illustrator|photoshop|after\s*effects|lightroom|davinci)\b/i },

  // trial
  { intent: "trial", rx: /\b(trial|prueba|probar|14\s*d[ií]as|14d|sin\s*tarjeta|gratis\s*14|cu[aá]ndo\s*me\s*cobr[aá]is)\b/i },

  // spam
  { intent: "spam", rx: /\b(crypto|usdt|btc|earn\s*\$\d+|hot\s*girls?|telegram\s*ch[aá]nnel\s*pump)\b/i },

  // info — la más genérica, ponemos al final
  { intent: "info", rx: /\b(qu[eé]\s*es\s*darkroom|c[oó]mo\s*funciona|expl[ií]came|info|cu[eé]ntame|es\s*lo\s*mismo\s*que|m[aá]s\s*detalles|cu[eé]ntamelo)\b/i },
];

/**
 * Detecta el intent. Si nada matchea, devuelve "unknown" si hay saludo,
 * "other" si no hay señal alguna.
 */
export function qualifyIntent(text: string): QualifiedIntent {
  const t = (text || "").toLowerCase();

  for (const { intent, rx } of PATTERNS) {
    const m = t.match(rx);
    if (m) {
      // confidence más alta para intents críticos (legal/refund) que para vagos
      const conf =
        intent === "legal" || intent === "refund" ? 0.95 :
        intent === "spam" || intent === "cancel" || intent === "refer" ? 0.9 :
        0.8;
      return { intent, confidence: conf, signal: m[0] };
    }
  }

  // Saludo / info muy vaga
  if (/\b(hola|hey|buenas|hi|hello|saludos|qu[eé]\s*tal|como\s*va)\b/i.test(t)) {
    return { intent: "unknown", confidence: 0.3, signal: "saludo genérico" };
  }

  return { intent: "other", confidence: 0.2, signal: "" };
}

/**
 * Para los intents que requieren escalado obligatorio a humano,
 * devuelve true. Esto bypassa el agente de IA y crea ticket directo.
 */
export function shouldEscalateImmediately(intent: DarkRoomIntent): boolean {
  return intent === "legal" || intent === "refund";
}
