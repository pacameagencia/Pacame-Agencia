"use client";

import { useState } from "react";
import { Loader2, Power, Save } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Initial {
  assistant_id: string | null;
  first_message: string | null;
  business_hours: string | null;
  enabled: boolean;
  brand: string;
}

export function ReceptionistForm({ initial }: { initial: Initial }) {
  const { toast } = useToast();
  const [brand, setBrand] = useState(initial.brand);
  const [hours, setHours] = useState(initial.business_hours ?? "L-V 9:00 a 18:00, sábados cerrado");
  const [first, setFirst] = useState(initial.first_message ?? "");
  const [enabled, setEnabled] = useState(initial.enabled);
  const [assistantId, setAssistantId] = useState(initial.assistant_id);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/products/asesor-pro/receptionist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          business_hours: hours,
          vapi_first_message: first.trim() || undefined,
          enabled,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast({
          variant: "error",
          title: "No se pudo guardar la recepcionista",
          description: json.detail ?? json.error ?? "Inténtalo en unos minutos.",
        });
        return;
      }
      setAssistantId(json.assistant_id);
      toast({
        variant: "success",
        title: assistantId ? "Recepcionista actualizada" : "Recepcionista creada",
        description: "Vapi ya está respondiendo según tu configuración.",
      });
    } catch (err) {
      toast({
        variant: "error",
        title: "Error de red",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-paper border-2 border-ink/15 p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-ink text-lg" style={{ fontWeight: 500 }}>
          Configuración del asistente
        </h2>
        <button
          onClick={() => setEnabled((v) => !v)}
          aria-pressed={enabled}
          className={`inline-flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] ${
            enabled ? "bg-green-600/15 text-green-700" : "bg-ink/10 text-ink-mute"
          }`}
        >
          <Power className="w-3 h-3" /> {enabled ? "Activa" : "Desactivada"}
        </button>
      </div>

      <Field label="Nombre del despacho" value={brand} onChange={setBrand} placeholder="Asesoría Calleja" />
      <Field
        label="Horario laboral (lo dirá si llaman fuera de horario)"
        value={hours}
        onChange={setHours}
        placeholder="L-V 9:00-18:00"
      />
      <label className="block">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-1">
          Mensaje de bienvenida (opcional)
        </span>
        <textarea
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          rows={2}
          placeholder="Despacho Calleja, soy la asistente virtual. ¿En qué puedo ayudarte?"
          className="w-full bg-paper border border-ink/30 px-3 py-2 text-sm font-sans focus-visible:outline-2 focus-visible:outline-terracotta-500"
        />
      </label>

      <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-ink/10">
        <p className="font-mono text-[11px] text-ink-mute">
          {assistantId ? `Assistant ID: ${assistantId}` : "Aún no has creado el asistente."}
        </p>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-paper font-sans text-sm hover:bg-terracotta-500 disabled:opacity-60 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {assistantId ? "Actualizar asistente" : "Crear asistente"}
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-1">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-paper border border-ink/30 px-3 py-2 text-sm font-sans focus-visible:outline-2 focus-visible:outline-terracotta-500"
      />
    </label>
  );
}
