"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChevronRight, ChevronLeft, Loader2, Trash2, Calendar, AlertCircle } from "lucide-react";
import type { PipelineCard, AsesorClient } from "@/lib/products/asesor-pro/queries";

const COLUMNS: { id: PipelineCard["status"]; label: string; accent: string; sub: string }[] = [
  { id: "pendiente", label: "Pendiente", accent: "#E8B730", sub: "Por revisar" },
  { id: "revisado", label: "Revisado", accent: "#283B70", sub: "Listo para empaquetar" },
  { id: "presentado", label: "Empaquetado", accent: "#6B7535", sub: "Pack mensual generado" },
  { id: "cerrado", label: "Cerrado", accent: "#1A1813", sub: "Trimestre cerrado" },
];

const PRIORITY_LABELS: Record<string, { color: string; label: string }> = {
  urgent: { color: "#B54E30", label: "urgente" },
  high: { color: "#E8B730", label: "alta" },
  normal: { color: "#6E6858", label: "normal" },
  low: { color: "#A89A72", label: "baja" },
};

interface Props {
  initialCards: PipelineCard[];
  clients: AsesorClient[];
}

export default function PipelineClient({ initialCards, clients }: Props) {
  const [cards, setCards] = useState<PipelineCard[]>(initialCards);
  const [showForm, setShowForm] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  function cardsByStatus(status: PipelineCard["status"]): PipelineCard[] {
    return cards.filter((c) => c.status === status).sort((a, b) => a.position - b.position);
  }

  async function moveCard(cardId: string, direction: "left" | "right") {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const idx = COLUMNS.findIndex((col) => col.id === card.status);
    const targetIdx = direction === "right" ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= COLUMNS.length) return;
    const newStatus = COLUMNS[targetIdx].id;

    setMovingId(cardId);
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, status: newStatus } : c)));

    try {
      await fetch(`/api/products/asesor-pro/pipeline?id=${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } finally {
      setMovingId(null);
    }
  }

  async function deleteCard(cardId: string) {
    if (!confirm("¿Borrar esta tarjeta?")) return;
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    await fetch(`/api/products/asesor-pro/pipeline?id=${cardId}`, { method: "DELETE" });
  }

  async function createCard(data: { title: string; description?: string; priority?: string; due_date?: string; asesor_client_id?: string }) {
    const res = await fetch("/api/products/asesor-pro/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.card) {
      setCards((prev) => [...prev, json.card]);
    }
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
            AsesorPro · Pipeline
          </span>
          <h1
            className="font-display text-ink mt-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
          >
            {cards.length} tarjeta{cards.length === 1 ? "" : "s"}
          </h1>
          <p className="font-sans text-ink-soft text-[14px] mt-2">
            Click en las flechas para mover entre columnas. Sin drag&amp;drop, sin sorpresas.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-paper font-sans text-sm font-medium hover:bg-terracotta-500 transition-colors"
          style={{ boxShadow: "3px 3px 0 #B54E30" }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancelar" : "Nueva tarjeta"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <NewCardForm clients={clients} onSubmit={createCard} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colCards = cardsByStatus(col.id);
          return (
            <div
              key={col.id}
              className="bg-paper border-2 border-ink flex flex-col min-h-[400px]"
              style={{ boxShadow: "5px 5px 0 #1A1813" }}
            >
              <div className="px-4 py-3 border-b-2 border-ink flex items-center justify-between" style={{ background: col.accent + "15" }}>
                <div>
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink block">{col.label}</span>
                  <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink-mute">{col.sub}</span>
                </div>
                <span
                  className="font-display text-ink tabular-nums"
                  style={{ fontSize: "1.5rem", lineHeight: "1", fontWeight: 500, color: col.accent }}
                >
                  {colCards.length}
                </span>
              </div>

              <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                {colCards.length === 0 ? (
                  <p className="text-center font-mono text-[11px] text-ink-mute/50 py-8">
                    Sin tarjetas
                  </p>
                ) : (
                  colCards.map((card) => {
                    const client = clients.find((c) => c.id === card.asesor_client_id);
                    const isMoving = movingId === card.id;
                    const colIdx = COLUMNS.findIndex((c) => c.id === card.status);
                    return (
                      <div
                        key={card.id}
                        className={`bg-paper border border-ink/20 hover:border-ink p-3 transition-all ${isMoving ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-sans text-[13px] text-ink font-medium leading-snug">{card.title}</span>
                          <button
                            onClick={() => deleteCard(card.id)}
                            className="text-ink-mute/40 hover:text-rose-alert flex-shrink-0"
                            aria-label="Borrar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {card.description && (
                          <p className="font-sans text-[11px] text-ink-soft mb-2 leading-snug">{card.description}</p>
                        )}

                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {client && (
                            <span className="font-mono text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 bg-indigo-600/15 text-indigo-600">
                              {client.fiscal_name}
                            </span>
                          )}
                          {card.priority !== "normal" && (
                            <span
                              className="font-mono text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5"
                              style={{
                                background: PRIORITY_LABELS[card.priority].color + "20",
                                color: PRIORITY_LABELS[card.priority].color,
                              }}
                            >
                              {PRIORITY_LABELS[card.priority].label}
                            </span>
                          )}
                          {card.due_date && (
                            <span className="font-mono text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 bg-mustard-500/15 text-mustard-700 inline-flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(card.due_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-ink/10">
                          <button
                            onClick={() => moveCard(card.id, "left")}
                            disabled={colIdx === 0 || isMoving}
                            className="text-ink-mute hover:text-ink disabled:opacity-20 disabled:cursor-not-allowed"
                            aria-label="Mover izquierda"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          {isMoving && <Loader2 className="w-3 h-3 animate-spin text-ink-mute" />}
                          <button
                            onClick={() => moveCard(card.id, "right")}
                            disabled={colIdx === COLUMNS.length - 1 || isMoving}
                            className="text-ink-mute hover:text-ink disabled:opacity-20 disabled:cursor-not-allowed"
                            aria-label="Mover derecha"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewCardForm({
  clients,
  onSubmit,
}: {
  clients: AsesorClient[];
  onSubmit: (data: { title: string; description?: string; priority?: string; due_date?: string; asesor_client_id?: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");
  const [clientId, setClientId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title,
        description: description || undefined,
        priority,
        due_date: dueDate || undefined,
        asesor_client_id: clientId || undefined,
      });
      setTitle("");
      setDescription("");
      setPriority("normal");
      setDueDate("");
      setClientId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-paper border-2 border-indigo-600 p-6 space-y-4"
      style={{ boxShadow: "5px 5px 0 #283B70" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block md:col-span-2">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">
            Título <span className="text-rose-alert">*</span>
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Revisar facturas Casa Marisol Q2"
            required
            className="w-full px-3 py-2 bg-paper border border-ink/30 text-ink text-[14px] focus:outline-none focus:border-indigo-600"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">
            Descripción
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-paper border border-ink/30 text-ink text-[14px] focus:outline-none focus:border-indigo-600 resize-none"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">Cliente</span>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2 bg-paper border border-ink/30 text-ink text-[14px] focus:outline-none focus:border-indigo-600"
          >
            <option value="">— sin asignar —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.fiscal_name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">Prioridad</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 bg-paper border border-ink/30 text-ink text-[14px] focus:outline-none focus:border-indigo-600"
          >
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </label>
        <label className="block">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">Fecha límite</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 bg-paper border border-ink/30 text-ink text-[14px] focus:outline-none focus:border-indigo-600"
          />
        </label>
      </div>

      {error && (
        <div className="p-3 border border-rose-alert/40 bg-rose-alert/10 text-sm text-rose-alert flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-ink/15">
        <button
          type="submit"
          disabled={submitting || !title}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-paper font-sans text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Crear tarjeta
        </button>
      </div>
    </form>
  );
}
