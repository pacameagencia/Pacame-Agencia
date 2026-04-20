// Cron diario: decae importance de memorias + weight de sinapsis no usadas.
// Activado desde vercel.json a las 03:00 UTC.

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { decayMemories } from "@/lib/neural";
import { logAgentActivity } from "@/lib/agent-logger";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const decayed = await decayMemories();

  // Decay hebbiano inverso: sinapsis sin activación en >14 dias pierden peso
  let synapsesDecayed = 0;
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase.rpc("decay_synapses", {
      decay_factor: 0.02,
      stale_days: 14,
    });
    if (typeof data === "number") synapsesDecayed = data;
  } catch {
    /* no-op: decay no debe romper el cron */
  }

  await logAgentActivity({
    agentId: "core",
    type: "update",
    title: "Decay nocturno cerebro",
    description: `Memorias decaidas: ${decayed}. Sinapsis decaidas: ${synapsesDecayed}.`,
    metadata: {
      decayed_count: decayed,
      synapses_decayed: synapsesDecayed,
      source: "cron",
    },
  });

  return NextResponse.json({ ok: true, decayed, synapses_decayed: synapsesDecayed });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
