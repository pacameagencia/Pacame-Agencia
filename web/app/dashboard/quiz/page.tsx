import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { ArrowUpRight, Mail, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · Quiz results · PACAME",
  robots: { index: false, follow: false },
};

interface QuizRow {
  slug: string;
  sector: string | null;
  business_size: string | null;
  goal: string | null;
  budget: string | null;
  urgency: string | null;
  persona_slug: string | null;
  total_cents: number | null;
  timeline_days: number | null;
  lead_email: string | null;
  lead_phone: string | null;
  lead_name: string | null;
  created_at: string;
}

async function listQuizResults(): Promise<QuizRow[]> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("quiz_results")
      .select(
        "slug, sector, business_size, goal, budget, urgency, persona_slug, total_cents, timeline_days, lead_email, lead_phone, lead_name, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(200);
    return (data as QuizRow[]) || [];
  } catch {
    return [];
  }
}

export default async function DashboardQuizPage() {
  const results = await listQuizResults();
  const withEmail = results.filter((r) => r.lead_email).length;
  const totalValue = results.reduce((s, r) => s + (r.total_cents || 0), 0);

  return (
    <main className="min-h-screen bg-paper pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45 mb-6 border-b border-ink/10 pb-3">
          <span className="text-accent-gold">Admin · Quiz Results</span>
          <span className="h-px w-8 bg-ink/20" />
          <span>Smart Service Finder submissions</span>
          <span className="ml-auto">
            {results.length} resultados · {withEmail} con email ·{" "}
            {(totalValue / 100).toLocaleString("es-ES")}€ pipeline
          </span>
        </div>

        {results.length === 0 ? (
          <p className="text-[14px] text-ink/50 font-body py-12">
            Sin resultados aun. Los quizzes completados aparecen aqui
            automaticamente.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] font-body">
              <thead>
                <tr className="border-b border-ink/15 text-left text-[11px] font-mono uppercase tracking-[0.18em] text-ink/45">
                  <th className="pb-3 pr-4">Fecha</th>
                  <th className="pb-3 pr-4">Sector</th>
                  <th className="pb-3 pr-4">Tamano</th>
                  <th className="pb-3 pr-4">Goal</th>
                  <th className="pb-3 pr-4">Presupuesto</th>
                  <th className="pb-3 pr-4">Persona</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3 pr-4">Lead</th>
                  <th className="pb-3 pr-4">Ver</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.slug}
                    className="border-b border-ink/[0.06] hover:bg-ink/[0.02]"
                  >
                    <td className="py-3 pr-4 text-ink/60 tabular-nums">
                      {new Date(r.created_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 pr-4 text-ink font-medium">{r.sector}</td>
                    <td className="py-3 pr-4 text-ink/70">{r.business_size}</td>
                    <td className="py-3 pr-4 text-ink/70">{r.goal}</td>
                    <td className="py-3 pr-4 text-ink/70">{r.budget}</td>
                    <td className="py-3 pr-4 text-ink/70">
                      {r.persona_slug || "—"}
                    </td>
                    <td className="py-3 pr-4 font-mono text-accent-gold tabular-nums">
                      {r.total_cents
                        ? `${(r.total_cents / 100).toLocaleString("es-ES")}€`
                        : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {r.lead_email ? (
                        <div className="flex flex-col gap-1">
                          <a
                            href={`mailto:${r.lead_email}`}
                            className="inline-flex items-center gap-1 text-ink/70 hover:text-accent-gold"
                          >
                            <Mail className="w-3 h-3" />
                            {r.lead_email}
                          </a>
                          {r.lead_phone && (
                            <a
                              href={`https://wa.me/${r.lead_phone.replace(/[^0-9+]/g, "")}`}
                              className="inline-flex items-center gap-1 text-ink/60 hover:text-accent-gold text-[12px]"
                            >
                              <Phone className="w-3 h-3" />
                              {r.lead_phone}
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink/30">anonimo</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/encuentra-tu-solucion/${r.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[12px] text-ink/60 hover:text-accent-gold"
                      >
                        {r.slug}
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
