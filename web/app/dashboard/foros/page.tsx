/**
 * Dashboard /dashboard/foros · queue oportunidades motor foros Dark Room.
 *
 * Pablo aprueba/edita/marca-publicada en 5-10 min/día.
 * Auth: heredada del layout dashboard (cookie auth admin).
 */

import { headers } from "next/headers";
import ForosQueue from "./ForosQueue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface OpportunityWithDrafts {
  id: string;
  platform: string;
  source_key: string;
  thread_url: string;
  thread_title: string;
  thread_body: string;
  author_username: string;
  posted_at: string | null;
  intent: string;
  score: number;
  reach_proxy: number;
  competition_count: number;
  status: string;
  scraped_at: string;
  drafts: Array<{
    id: string;
    style: string;
    draft_body: string;
    edited_body: string | null;
    status: string;
    upvotes: number | null;
    leads_attributed: number;
  }>;
}

async function fetchQueue(): Promise<OpportunityWithDrafts[]> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("host") || "pacameagencia.com";
  const cronSecret = process.env.CRON_SECRET || "";
  try {
    const r = await fetch(`${proto}://${host}/api/foros/queue?limit=20&status=generated`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
      cache: "no-store",
    });
    if (!r.ok) return [];
    const data = (await r.json()) as { items?: OpportunityWithDrafts[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

export default async function ForosDashboardPage() {
  const items = await fetchQueue();
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#CFFF00" }}>
          Dark Room · Motor Foros
        </div>
        <h1 style={{ fontSize: 32, margin: "4px 0 0", color: "#FFF", fontWeight: 700 }}>
          Inbox · top {items.length} oportunidades
        </h1>
        <p style={{ color: "#888", fontSize: 13, marginTop: 6 }}>
          5 fuentes · Reddit + Forobeta + X + IndieHackers + Quora · scrape cada 4h
        </p>
      </header>
      <ForosQueue items={items} />
    </div>
  );
}
