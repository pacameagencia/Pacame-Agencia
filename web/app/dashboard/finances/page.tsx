"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { dbCall } from "@/lib/dashboard-db";
import { DollarSign, TrendingUp, TrendingDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Finance {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  client_id: string;
  invoice_number: string;
  date: string;
  created_at: string;
}

export default function FinancesPage() {
  const [transactions, setTransactions] = useState<Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "income", category: "", amount: "", description: "", invoice_number: "" });

  useEffect(() => {
    fetchFinances();
  }, []);

  async function fetchFinances() {
    const { data } = await supabase
      .from("finances")
      .select("*")
      .order("date", { ascending: false })
      .limit(100);
    setTransactions(data || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await dbCall({
      table: "finances",
      op: "insert",
      data: {
        type: form.type,
        category: form.category || null,
        amount: Number(form.amount),
        description: form.description || null,
        invoice_number: form.invoice_number || null,
      },
    });
    setForm({ type: "income", category: "", amount: "", description: "", invoice_number: "" });
    setShowForm(false);
    setSaving(false);
    fetchFinances();
  }

  // Current month totals
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = transactions.filter((t) => t.date && t.date.startsWith(monthKey));
  const income = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const expenses = thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const profit = income - expenses;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-pacame-white">Finanzas</h1>
          <p className="text-sm text-pacame-white/40 font-body mt-1">
            {loading ? "Cargando..." : `${transactions.length} transacciones`}
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="w-4 h-4" />Nueva transaccion
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-green-400">{income.toLocaleString("es-ES")}€</div>
          <div className="text-xs text-pacame-white/40 font-body">Ingresos este mes</div>
        </div>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <TrendingDown className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <div className="font-heading font-bold text-2xl text-red-400">{expenses.toLocaleString("es-ES")}€</div>
          <div className="text-xs text-pacame-white/40 font-body">Gastos este mes</div>
        </div>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5 text-center">
          <DollarSign className="w-6 h-6 mx-auto mb-2" style={{ color: profit >= 0 ? "#16A34A" : "#EF4444" }} />
          <div className="font-heading font-bold text-2xl" style={{ color: profit >= 0 ? "#16A34A" : "#EF4444" }}>{profit.toLocaleString("es-ES")}€</div>
          <div className="text-xs text-pacame-white/40 font-body">Beneficio neto</div>
        </div>
      </div>

      {/* New transaction form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl bg-dark-card border border-electric-violet/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-pacame-white">Nueva transaccion</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-pacame-white/30 hover:text-pacame-white/60">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body focus:border-electric-violet/50 outline-none"
            >
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
            <input
              placeholder="Categoria (ej: proyecto, API, herramientas)"
              value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none"
            />
            <input
              required type="number" step="0.01" placeholder="Cantidad (€) *"
              value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none"
            />
            <input
              placeholder="Num. factura"
              value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
              className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none"
            />
            <input
              placeholder="Descripcion"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="col-span-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none"
            />
          </div>
          <Button type="submit" variant="gradient" size="sm" disabled={saving}>
            {saving ? "Guardando..." : "Registrar"}
          </Button>
        </form>
      )}

      {/* Transaction list */}
      <div className="space-y-2">
        {!loading && transactions.length === 0 && (
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-12 text-center">
            <DollarSign className="w-8 h-8 text-pacame-white/20 mx-auto mb-3" />
            <p className="text-sm text-pacame-white/40 font-body">Sin transacciones</p>
          </div>
        )}
        {transactions.map((t) => {
          const isIncome = t.type === "income";
          return (
            <div key={t.id} className="flex items-center gap-4 p-4 rounded-xl bg-dark-card border border-white/[0.06]">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIncome ? "bg-green-500/15" : "bg-red-500/15"}`}>
                {isIncome ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-heading font-medium text-pacame-white">{t.description || t.category || (isIncome ? "Ingreso" : "Gasto")}</span>
                  {t.category && t.description && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-pacame-white/40 font-body">{t.category}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-pacame-white/30 font-body">{t.date}</span>
                  {t.invoice_number && <span className="text-xs text-pacame-white/20 font-body">#{t.invoice_number}</span>}
                </div>
              </div>
              <span className={`font-heading font-bold ${isIncome ? "text-green-400" : "text-red-400"}`}>
                {isIncome ? "+" : "-"}{Number(t.amount).toLocaleString("es-ES")}€
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
