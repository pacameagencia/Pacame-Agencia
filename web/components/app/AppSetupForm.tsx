"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";

interface SchemaProperty {
  type: string;
  title?: string;
  enum?: string[];
  items?: { type: string; enum?: string[] };
  maxLength?: number;
}

interface Schema {
  type?: string;
  required?: string[];
  properties?: Record<string, SchemaProperty>;
}

interface Props {
  instanceId: string;
  schema: Schema;
  initialConfig: Record<string, unknown>;
}

export default function AppSetupForm({ instanceId, schema, initialConfig }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>(initialConfig);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const props = schema.properties || {};
  const required = schema.required || [];
  const fieldEntries = Object.entries(props);

  function update(key: string, v: unknown) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setOk(false);
    try {
      // Validation
      for (const k of required) {
        if (!values[k] || (typeof values[k] === "string" && !(values[k] as string).trim())) {
          throw new Error(`El campo "${props[k]?.title || k}" es obligatorio`);
        }
      }

      const res = await fetch(`/api/apps/${instanceId}/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ config: values }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar");
      }
      setOk(true);
      setTimeout(() => router.push(`/portal/apps/${instanceId}`), 900);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl p-6 bg-dark-card border border-white/[0.06] space-y-5">
      {fieldEntries.map(([key, field]) => {
        const isReq = required.includes(key);
        const label = (field.title || key) + (isReq ? " *" : "");
        const value = values[key];

        // Enum → select
        if (field.type === "string" && field.enum) {
          return (
            <div key={key}>
              <label className="block text-sm font-body font-medium text-pacame-white/80 mb-1.5">
                {label}
              </label>
              <select
                value={(value as string) || ""}
                onChange={(e) => update(key, e.target.value)}
                className="w-full bg-pacame-black border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-pacame-white focus:border-olympus-gold focus:outline-none transition"
              >
                <option value="">Elige una opcion</option>
                {field.enum.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        // Array of enum → multi-checkbox
        if (field.type === "array" && field.items?.enum) {
          const arr = Array.isArray(value) ? (value as string[]) : [];
          return (
            <div key={key}>
              <label className="block text-sm font-body font-medium text-pacame-white/80 mb-2">
                {label}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {field.items.enum.map((opt) => {
                  const checked = arr.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-body cursor-pointer transition ${
                        checked
                          ? "bg-olympus-gold/10 border-olympus-gold/40 text-olympus-gold"
                          : "bg-white/[0.02] border-white/[0.08] text-pacame-white/70 hover:border-white/[0.15]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            update(key, [...arr, opt]);
                          } else {
                            update(key, arr.filter((x) => x !== opt));
                          }
                        }}
                        className="sr-only"
                      />
                      {checked && <Check className="w-3.5 h-3.5" />}
                      {opt}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        }

        // Long text fields
        if (field.type === "string" && (field.maxLength ?? 0) > 200) {
          return (
            <div key={key}>
              <label className="block text-sm font-body font-medium text-pacame-white/80 mb-1.5">
                {label}
              </label>
              <textarea
                value={(value as string) || ""}
                onChange={(e) => update(key, e.target.value)}
                maxLength={field.maxLength}
                rows={4}
                className="w-full bg-pacame-black border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-pacame-white focus:border-olympus-gold focus:outline-none transition resize-none"
              />
            </div>
          );
        }

        // Default: text input
        return (
          <div key={key}>
            <label className="block text-sm font-body font-medium text-pacame-white/80 mb-1.5">
              {label}
            </label>
            <input
              type="text"
              value={(value as string) || ""}
              onChange={(e) => update(key, e.target.value)}
              maxLength={field.maxLength}
              className="w-full bg-pacame-black border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-pacame-white focus:border-olympus-gold focus:outline-none transition"
            />
          </div>
        );
      })}

      {err && (
        <div className="p-3 rounded-lg bg-rose-400/10 border border-rose-400/30 text-rose-400 text-sm font-body">
          {err}
        </div>
      )}
      {ok && (
        <div className="p-3 rounded-lg bg-green-400/10 border border-green-400/30 text-green-400 text-sm font-body flex items-center gap-2">
          <Check className="w-4 h-4" />
          Guardado. Redirigiendo...
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-olympus-gold hover:bg-olympus-gold/90 disabled:opacity-50 text-pacame-black font-heading font-semibold py-3 rounded-xl transition"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Activar app
      </button>
    </form>
  );
}
