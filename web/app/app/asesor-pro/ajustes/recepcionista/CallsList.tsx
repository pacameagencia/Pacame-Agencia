"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, PhoneCall } from "lucide-react";

interface Call {
  id: string;
  vapi_call_id: string;
  caller_phone: string | null;
  caller_name: string | null;
  summary: string | null;
  transcript: string | null;
  duration_seconds: number | null;
  status: string;
  ended_reason: string | null;
  created_at: string;
}

export function CallsList({ calls }: { calls: Call[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (calls.length === 0) {
    return (
      <p className="font-sans text-sm text-ink-mute">
        Aún no se han registrado llamadas. Cuando el asistente atienda una, aparecerá aquí con transcripción y resumen.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-ink/10">
      {calls.map((c) => {
        const isOpen = open === c.id;
        return (
          <li key={c.id} className="py-3">
            <button
              onClick={() => setOpen(isOpen ? null : c.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-3 text-left"
            >
              {isOpen ? <ChevronDown className="w-4 h-4 text-ink-mute" /> : <ChevronRight className="w-4 h-4 text-ink-mute" />}
              <PhoneCall className="w-4 h-4 text-terracotta-500" />
              <div className="flex-1 min-w-0">
                <div className="font-sans text-sm text-ink">
                  {c.caller_name ?? c.caller_phone ?? "Llamada sin número"}
                </div>
                <div className="font-mono text-[11px] text-ink-mute">
                  {new Date(c.created_at).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {c.duration_seconds ? ` · ${Math.round(c.duration_seconds)}s` : ""}
                  {c.status === "ended" ? "" : ` · ${c.status}`}
                </div>
              </div>
            </button>
            {isOpen && (
              <div className="mt-3 ml-7 space-y-2">
                {c.summary && (
                  <div className="bg-sand-100 border border-ink/10 p-3 text-sm font-sans text-ink leading-relaxed">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute block mb-1">
                      Resumen
                    </span>
                    {c.summary}
                  </div>
                )}
                {c.transcript && (
                  <details className="bg-paper border border-ink/10 p-3">
                    <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute">
                      Ver transcripción ({c.transcript.length} caracteres)
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-[12px] font-mono text-ink-soft leading-relaxed">
                      {c.transcript}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
