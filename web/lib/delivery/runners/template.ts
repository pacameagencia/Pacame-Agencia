/**
 * Template engine para runners declarativos.
 * Reemplaza {{variable}} y {{obj.prop}} con valores de inputs.
 */
export function renderTemplate(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const keys = path.split(".");
    let value: unknown = data;
    for (const k of keys) {
      if (value === null || value === undefined) return "";
      value = (value as Record<string, unknown>)[k];
    }
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  });
}

/** Ensure a template string reasonably escapes user input — avoid prompt injection. */
export function sanitizeUserInput(text: string): string {
  if (typeof text !== "string") return String(text);
  // Strip obvious jailbreak patterns
  return text
    .replace(/\bignore all previous instructions\b/gi, "[removed]")
    .replace(/<\|[^|]+\|>/g, "")
    .slice(0, 5000);
}
