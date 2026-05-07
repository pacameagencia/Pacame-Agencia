/**
 * Dashboard CRM live de leads outreach restaurantes.
 * Métricas + tabla con filtros + drill-down + realtime Supabase.
 */
import { Suspense } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import { LeadsTable } from "./leads-table";
import { MetricsBar } from "./metrics-bar";
import { PipelineLiveFeed } from "./pipeline-live-feed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Prospect Leads · PACAME Dashboard",
  description: "Pipeline en directo de outreach restaurantes B2B",
};

async function getInitialData() {
  const sb = createServerSupabase();
  const [{ data: leads }, { data: metricsRows }] = await Promise.all([
    sb
      .from("prospect_leads")
      .select(
        "id, slug, name, email, city, type, cuisine, vercel_url, status, sent_at, first_opened_at, open_count, first_clicked_at, click_count, replied_at, bounced_at, deal_value_eur, notes",
      )
      .order("sent_at", { ascending: false, nullsFirst: false })
      .limit(500),
    sb.from("prospect_leads_metrics").select("*").limit(1),
  ]);
  return { leads: leads ?? [], metrics: metricsRows?.[0] ?? null };
}

export default async function ProspectLeadsPage() {
  const { leads, metrics } = await getInitialData();
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Prospect Leads</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Pipeline outreach restaurantes B2B · Resend webhooks live · Updated{" "}
              {new Date().toLocaleString("es-ES")}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="https://resend.com/emails"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-2 text-xs font-semibold transition-colors"
            >
              Resend dashboard ↗
            </a>
            <a
              href="https://vercel.com/pacames-projects"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-2 text-xs font-semibold transition-colors"
            >
              Vercel ↗
            </a>
          </div>
        </header>

        <Suspense fallback={<div className="h-24 bg-zinc-900 rounded animate-pulse" />}>
          <MetricsBar initial={metrics} />
        </Suspense>

        <Suspense fallback={<div className="h-32 bg-zinc-900 rounded animate-pulse" />}>
          <PipelineLiveFeed />
        </Suspense>

        <Suspense fallback={<div className="h-96 bg-zinc-900 rounded animate-pulse" />}>
          <LeadsTable initialLeads={leads} />
        </Suspense>
      </div>
    </main>
  );
}
