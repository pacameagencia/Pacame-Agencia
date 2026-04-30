/**
 * Generador de codes de afiliado Dark Room Crew.
 * Formato: kebab(name) + "-" + 4 hex random.
 * Ejemplo: "Lucia Motion" → "lucia-motion-3F2A"
 *
 * Comprueba colisión contra DB · regenera hex hasta encontrar uno libre
 * (probabilidad colisión 1/65536 → suele bastar 1 intento).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

function kebabize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)         // máx 3 palabras del nombre
    .join("-")
    .slice(0, 32);       // hard cap longitud
}

function fourHex(): string {
  return crypto.randomBytes(2).toString("hex").toUpperCase();
}

export async function generateUniqueCode(
  name: string,
  supabase: SupabaseClient,
  maxAttempts = 8
): Promise<string> {
  const base = kebabize(name) || "crew";

  for (let i = 0; i < maxAttempts; i++) {
    const candidate = `${base}-${fourHex()}`;
    const { data, error } = await supabase
      .from("darkroom_affiliates")
      .select("code")
      .eq("code", candidate)
      .maybeSingle();
    if (error) throw new Error(`code uniqueness check failed: ${error.message}`);
    if (!data) return candidate;
  }

  // Fallback con timestamp si tras N intentos seguimos colisionando
  // (no debería ocurrir nunca con 65536 valores hex × 8 intentos)
  return `${base}-${fourHex()}-${Date.now().toString(36).slice(-4)}`;
}
