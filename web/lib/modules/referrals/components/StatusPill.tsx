"use client";

const STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  converted: "bg-emerald-100 text-emerald-800",
  paid: "bg-emerald-100 text-emerald-800",
  approved: "bg-emerald-50 text-emerald-700",
  pending: "bg-ink/5 text-ink/70",
  suspicious: "bg-amber-100 text-amber-800",
  cancelled: "bg-rose-100 text-rose-800",
  voided: "bg-rose-100 text-rose-800",
  disabled: "bg-rose-100 text-rose-800",
};

export function StatusPill({ status }: { status: string }) {
  const cls = STYLES[status] ?? "bg-ink/5 text-ink/70";
  return <span className={`inline-block rounded-sm px-2 py-0.5 text-xs ${cls}`}>{status}</span>;
}
