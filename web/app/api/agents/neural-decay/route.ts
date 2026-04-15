// Cron diario que decae la importance de memorias no accedidas en >7 dias.
// Activado desde vercel.json a las 03:00 UTC.

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { decayMemories } from "@/lib/neural";
import { logAgentActivity } from "@/lib/agent-logger";

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const decayed = await decayMemories();

  await logAgentActivity({
    agentId: "core",
    type: "update",
    title: "Decay nocturno de memorias",
    description: `Importance reducida en ${decayed} memorias no accedidas hace >7 dias.`,
    metadata: { decayed_count: decayed, source: "cron" },
  });

  return NextResponse.json({ ok: true, decayed });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
