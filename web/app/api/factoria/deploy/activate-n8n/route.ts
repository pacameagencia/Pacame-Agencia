/**
 * POST /api/factoria/deploy/activate-n8n
 *
 * Cierra el círculo del deploy n8n: crea credentials del cliente,
 * inyecta los IDs reales en los workflows ya creados, y los activa.
 *
 * Request body:
 *   {
 *     deployment_id: uuid,
 *     credentials: {
 *       supabase?: { host, serviceRole },
 *       twilio?:   { accountSid, authToken }
 *     }
 *   }
 *
 * Response:
 *   { ok, credentials_created[], workflows_activated[], errors[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { activateN8nWorkflows, type ClientCredentials } from "@/lib/factoria/deploy/n8n-activate";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ActivateRequest {
  deployment_id: string;
  credentials: ClientCredentials;
}

export async function POST(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  if (!process.env.N8N_API_KEY) {
    return NextResponse.json(
      { error: "N8N_API_KEY missing en env" },
      { status: 503 }
    );
  }

  let body: ActivateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { deployment_id, credentials } = body;
  if (!deployment_id || !credentials || Object.keys(credentials).length === 0) {
    return NextResponse.json(
      { error: "deployment_id and credentials required (at least 1 type)" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabase();
  const { data: deployment } = await supabase
    .from("client_deployments")
    .select("slug, n8n_workflow_ids")
    .eq("id", deployment_id)
    .single();

  if (!deployment?.slug) {
    return NextResponse.json({ error: "deployment not found or no slug" }, { status: 404 });
  }

  if (!deployment.n8n_workflow_ids || (deployment.n8n_workflow_ids as string[]).length === 0) {
    return NextResponse.json(
      { error: "no workflows in n8n yet. Run /api/factoria/deploy with target=n8n first." },
      { status: 400 }
    );
  }

  try {
    const result = await activateN8nWorkflows({
      deployment_id,
      slug: deployment.slug as string,
      credentials,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 207 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
