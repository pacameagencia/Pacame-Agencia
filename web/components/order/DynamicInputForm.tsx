"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, AlertCircle } from "lucide-react";

interface JSONSchemaProperty {
  type: string;
  title?: string;
  enum?: string[];
  items?: { type: string; enum?: string[] };
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  default?: unknown;
}

interface JSONSchema {
  type: string;
  required?: string[];
  properties?: Record<string, JSONSchemaProperty>;
}

interface Props {
  orderId: string;
  schema: JSONSchema;
  defaults?: Record<string, unknown>;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block font-heading font-medium text-ink text-sm mb-2">
      {children}
      {required && <span className="text-accent-gold ml-1">*</span>}
    </label>
  );
}

const inputClass =
  "w-full bg-white/[0.04] border border-ink/[0.1] rounded-xl px-4 py-3 text-ink font-body placeholder:text-ink/30 focus:border-accent-gold/60 focus:outline-none transition";

export default function DynamicInputForm({ orderId, schema, defaults }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>(defaults || {});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const required = schema.required || [];
  const props = schema.properties || {};
  const fields = Object.entries(props);

  function setValue(key: string, val: unknown) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Light client validation
    const missing = required.filter((k) => {
      const v = values[k];
      if (v === undefined || v === null || v === "") return true;
      if (Array.isArray(v) && v.length === 0) return true;
      return false;
    });
    if (missing.length > 0) {
      setError(
        `Faltan: ${missing.map((k) => props[k]?.title || k).join(", ")}`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/inputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: values }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No pudimos guardar tu brief.");
        setSubmitting(false);
        return;
      }
      router.push(`/portal/orders/${orderId}`);
    } catch {
      setError("Error de red. Intentalo de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {fields.map(([key, prop]) => {
        const isRequired = required.includes(key);
        const title = prop.title || key;
        const val = values[key];

        // array of enum → checkboxes
        if (prop.type === "array" && prop.items?.enum) {
          const options = prop.items.enum;
          const selected = Array.isArray(val) ? (val as string[]) : [];
          return (
            <div key={key}>
              <Label required={isRequired}>{title}</Label>
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => {
                  const isOn = selected.includes(opt);
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => {
                        const next = isOn
                          ? selected.filter((x) => x !== opt)
                          : [...selected, opt];
                        if (prop.maxItems && next.length > prop.maxItems) return;
                        setValue(key, next);
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-body transition border ${
                        isOn
                          ? "bg-accent-gold text-paper border-accent-gold"
                          : "bg-white/[0.04] text-ink/70 border-ink/[0.1] hover:border-accent-gold/40"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {prop.maxItems && (
                <p className="text-xs text-ink/30 mt-1 font-body">
                  Maximo {prop.maxItems}
                </p>
              )}
            </div>
          );
        }

        // enum single → select
        if (prop.type === "string" && prop.enum) {
          return (
            <div key={key}>
              <Label required={isRequired}>{title}</Label>
              <select
                value={(val as string) || ""}
                onChange={(e) => setValue(key, e.target.value)}
                className={inputClass}
                required={isRequired}
              >
                <option value="">— Selecciona —</option>
                {prop.enum.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // boolean
        if (prop.type === "boolean") {
          return (
            <div key={key} className="flex items-center gap-3">
              <input
                id={key}
                type="checkbox"
                checked={Boolean(val ?? prop.default)}
                onChange={(e) => setValue(key, e.target.checked)}
                className="w-5 h-5 accent-accent-gold"
              />
              <label htmlFor={key} className="font-body text-ink/80">
                {title}
              </label>
            </div>
          );
        }

        // textarea for long fields
        const isLong =
          (prop.maxLength && prop.maxLength > 150) ||
          key === "current_copy" ||
          key === "references" ||
          key === "avoid";

        if (prop.type === "string" && isLong) {
          return (
            <div key={key}>
              <Label required={isRequired}>{title}</Label>
              <textarea
                value={(val as string) || ""}
                onChange={(e) => setValue(key, e.target.value)}
                className={inputClass + " min-h-[100px]"}
                maxLength={prop.maxLength}
                required={isRequired}
                placeholder={prop.format === "uri" ? "https://..." : ""}
              />
            </div>
          );
        }

        // default text input
        return (
          <div key={key}>
            <Label required={isRequired}>{title}</Label>
            <input
              type={prop.format === "uri" ? "url" : "text"}
              value={(val as string) || ""}
              onChange={(e) => setValue(key, e.target.value)}
              className={inputClass}
              maxLength={prop.maxLength}
              minLength={prop.minLength}
              pattern={prop.pattern}
              required={isRequired}
              placeholder={
                prop.format === "uri" ? "https://..." :
                prop.pattern?.includes("#") ? "#7C3AED" : ""
              }
            />
          </div>
        );
      })}

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 font-body text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-accent-gold hover:bg-accent-gold/90 disabled:opacity-60 disabled:cursor-not-allowed text-paper font-heading font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Enviando brief...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Enviar brief y arrancar agente
          </>
        )}
      </button>

      <p className="text-xs text-ink/40 font-body text-center">
        En cuanto envies el brief, nuestro agente IA empieza a trabajar en tu entregable.
      </p>
    </form>
  );
}
