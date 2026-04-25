/**
 * Template renderer para la factoría PACAME.
 *
 * Reemplaza {{variable}} y {{variable.nested.path}} en strings y archivos
 * markdown. Sin engine externo (no handlebars, no mustache) — regex simple
 * suficiente para nuestras plantillas controladas internamente.
 *
 * Convenciones:
 *   {{var}}              → vars.var
 *   {{client.city}}      → vars.client.city
 *   {{address|fallback}} → vars.address || "fallback"  (pipe sintaxis)
 *   {{#if var}}…{{/if}}  → bloque condicional simple
 *   {{#each items}}…{{/each}}  → iteración (item disponible como `it`)
 *
 * Reglas:
 * - Si una variable falta y NO tiene fallback → se deja {{var}} en el output
 *   y se reporta en `missingVars`. NUNCA renderiza string vacío silenciosamente.
 * - El renderer es síncrono (lee archivos vía fs/promises antes).
 */

const VAR_REGEX = /\{\{\s*([^{}#/]+?)\s*\}\}/g;
const IF_BLOCK_REGEX = /\{\{#if\s+([^}]+?)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g;
const EACH_BLOCK_REGEX = /\{\{#each\s+([^}]+?)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g;

export interface RenderResult {
  output: string;
  missingVars: string[];
  resolvedVars: string[];
}

function getNested(obj: unknown, path: string): unknown {
  if (obj === null || obj === undefined) return undefined;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(stringify).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function isTruthy(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return Boolean(value);
}

/**
 * Renderiza un template con las variables dadas.
 *
 * Procesa en orden: each → if → variables (porque each/if pueden contener vars).
 */
export function renderTemplate(template: string, vars: Record<string, unknown>): RenderResult {
  const missing = new Set<string>();
  const resolved = new Set<string>();
  let output = template;

  // 1. Bloques {{#each}} (procesar antes de las vars sueltas)
  output = output.replace(EACH_BLOCK_REGEX, (_m, path: string, body: string) => {
    const collection = getNested(vars, path.trim());
    if (!Array.isArray(collection)) {
      missing.add(path.trim());
      return "";
    }
    resolved.add(path.trim());
    return collection
      .map((item) => {
        const itemVars = { ...vars, it: item };
        const rendered = renderTemplate(body, itemVars);
        rendered.missingVars.forEach((v) => missing.add(v));
        rendered.resolvedVars.forEach((v) => resolved.add(v));
        return rendered.output;
      })
      .join("");
  });

  // 2. Bloques {{#if}}
  output = output.replace(IF_BLOCK_REGEX, (_m, condition: string, body: string) => {
    const value = getNested(vars, condition.trim());
    if (isTruthy(value)) {
      resolved.add(condition.trim());
      const rendered = renderTemplate(body, vars);
      rendered.missingVars.forEach((v) => missing.add(v));
      rendered.resolvedVars.forEach((v) => resolved.add(v));
      return rendered.output;
    }
    return "";
  });

  // 3. Variables sueltas {{var}} y {{var|fallback}}
  output = output.replace(VAR_REGEX, (match, expr: string) => {
    const trimmed = expr.trim();
    const [path, fallback] = trimmed.split("|").map((s) => s.trim());

    const value = getNested(vars, path);
    if (value !== undefined && value !== null && value !== "") {
      resolved.add(path);
      return stringify(value);
    }

    if (fallback !== undefined) {
      // Fallback puede ser literal (entre comillas) o referencia a otra var.
      if (
        (fallback.startsWith('"') && fallback.endsWith('"')) ||
        (fallback.startsWith("'") && fallback.endsWith("'"))
      ) {
        return fallback.slice(1, -1);
      }
      const fallbackValue = getNested(vars, fallback);
      if (fallbackValue !== undefined && fallbackValue !== null && fallbackValue !== "") {
        resolved.add(fallback);
        return stringify(fallbackValue);
      }
    }

    missing.add(path);
    return match; // Deja {{var}} para que sea visible que falta.
  });

  return {
    output,
    missingVars: Array.from(missing),
    resolvedVars: Array.from(resolved),
  };
}

/**
 * Extrae todas las variables `{{var}}` referenciadas en un template,
 * normalizando paths anidados a su raíz top-level.
 *
 * Útil para validar que el cliente tiene todos los datos requeridos antes
 * de materializar.
 */
export function extractVariables(template: string): Set<string> {
  const set = new Set<string>();

  // Simple {{var}} y {{var|fallback}}
  const matches = template.matchAll(VAR_REGEX);
  for (const m of matches) {
    const expr = m[1].trim();
    const [path] = expr.split("|").map((s) => s.trim());
    set.add(path);
  }

  // Each blocks: la collection es una variable.
  const eachMatches = template.matchAll(EACH_BLOCK_REGEX);
  for (const m of eachMatches) {
    set.add(m[1].trim());
  }

  // If blocks: la condition es una variable.
  const ifMatches = template.matchAll(IF_BLOCK_REGEX);
  for (const m of ifMatches) {
    set.add(m[1].trim());
  }

  return set;
}

/**
 * Valida que un set de vars cumple todos los requeridos por el template.
 *
 * Devuelve { ok, missing[] } donde missing son paths con dot notation.
 */
export function validateRequiredVars(
  template: string,
  vars: Record<string, unknown>,
  options: { ignoreInternal?: boolean } = {}
): { ok: boolean; missing: string[] } {
  const required = extractVariables(template);
  const missing: string[] = [];

  // Variables internas usadas por bloques each/if que NO son del cliente.
  const internalVars = new Set(["it"]);

  for (const path of required) {
    if (options.ignoreInternal && internalVars.has(path.split(".")[0])) continue;
    const value = getNested(vars, path);
    if (value === undefined || value === null || value === "") {
      missing.push(path);
    }
  }

  return { ok: missing.length === 0, missing };
}

/**
 * Slugify un string para nombres de archivo / URLs / paths Supabase Storage.
 *
 * "Casa Marisol Cádiz" → "casa-marisol-cadiz"
 */
// Mapeo manual exhaustivo de caracteres acentuados / especiales españoles.
// Evitamos depender de String.normalize("NFD") + regex unicode property
// escape porque Turbopack/SWC en algunos targets no transpila bien
// `\p{M}/gu` y se cuelan caracteres acentuados en los slugs.
const SLUG_CHAR_MAP: Record<string, string> = {
  á: "a", à: "a", ä: "a", â: "a", ã: "a", å: "a",
  é: "e", è: "e", ë: "e", ê: "e",
  í: "i", ì: "i", ï: "i", î: "i",
  ó: "o", ò: "o", ö: "o", ô: "o", õ: "o",
  ú: "u", ù: "u", ü: "u", û: "u",
  ñ: "n", ç: "c",
  Á: "A", À: "A", Ä: "A", Â: "A", Ã: "A", Å: "A",
  É: "E", È: "E", Ë: "E", Ê: "E",
  Í: "I", Ì: "I", Ï: "I", Î: "I",
  Ó: "O", Ò: "O", Ö: "O", Ô: "O", Õ: "O",
  Ú: "U", Ù: "U", Ü: "U", Û: "U",
  Ñ: "N", Ç: "C",
};

export function slugify(input: string): string {
  let mapped = "";
  for (const ch of input) {
    mapped += SLUG_CHAR_MAP[ch] ?? ch;
  }
  return mapped
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
