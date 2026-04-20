/**
 * Deterministic A/B variant picker for lifecycle emails.
 *
 * Un client SIEMPRE recibe la misma variant de un email_type dado
 * (mismo hash + weighted buckets). Esto garantiza que si el cron reintenta,
 * o si analizamos performance, los datos son consistentes.
 */

import { createHash } from "node:crypto";

export interface Variant {
  variant_key: string;
  subject: string;
  preheader?: string | null;
  weight?: number; // default 1
  is_active?: boolean;
}

/**
 * Elige una variant usando sha256(clientId + "::" + emailType) → int → bucket
 * weighted por variants[i].weight.
 *
 * Solo considera variants activas. Si no hay activas, devuelve null.
 * Si solo hay 1 activa, la devuelve siempre.
 */
export function pickVariant(
  variants: Variant[],
  clientId: string,
  emailType: string
): Variant | null {
  const active = variants.filter((v) => v.is_active !== false && (v.weight ?? 1) > 0);
  if (active.length === 0) return null;
  if (active.length === 1) return active[0];

  const totalWeight = active.reduce((s, v) => s + (v.weight ?? 1), 0);
  if (totalWeight <= 0) return active[0];

  // Hash determinista → entero no-negativo dentro de totalWeight
  const h = createHash("sha256")
    .update(`${clientId}::${emailType}`)
    .digest();
  // Tomamos primeros 4 bytes como uint32 LE (suficiente dispersion)
  const n = h.readUInt32LE(0);
  let bucket = n % totalWeight;

  for (const v of active) {
    const w = v.weight ?? 1;
    if (bucket < w) return v;
    bucket -= w;
  }
  // Fallback (no deberia ocurrir)
  return active[active.length - 1];
}
