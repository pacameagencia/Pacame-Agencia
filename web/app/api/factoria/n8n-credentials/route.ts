/**
 * POST /api/factoria/n8n-credentials
 *
 * Crea las credentials n8n necesarias para que los workflows del cliente
 * puedan activarse. Se invoca desde el preflight checker o manualmente
 * antes del deploy n8n.
 *
 * Request body:
 *   {
 *     deployment_id: uuid,
 *     creds: [
 *       { type: "supabaseApi", data: { host, serviceRole } },
 *       { type: "twilioApi", data: { accountSid, authToken } }
 *     ]
 *   }
 *
 * Devuelve:
 *   { ok, credentials: [{ name, id, type }], errors }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

interface CredRequest {
  type: string;
  data: Record<string, string>;
}

interface CreatedCred {
  name: string;
  id: string;
  type: string;
}

export async function POST(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const apiKey = process.env.N8N_API_KEY;
  const baseUrl = process.env.N8N_BASE_URL || "https://n8n.pacameagencia.com";

  if (!apiKey) {
    return NextResponse.json(
      { error: "N8N_API_KEY missing en env. Configúralo en .env.local primero." },
      { status: 503 }
    );
  }

  let body: { deployment_id: string; creds: CredRequest[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { deployment_id, creds } = body;
  if (!deployment_id || !Array.isArray(creds) || creds.length === 0) {
    return NextResponse.json(
      { error: "deployment_id and creds[] required" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabase();
  const { data: deployment } = await supabase
    .from("client_deployments")
    .select("slug")
    .eq("id", deployment_id)
    .single();

  const slug = deployment?.slug as string | undefined;
  if (!slug) {
    return NextResponse.json({ error: "deployment not found or no slug" }, { status: 404 });
  }

  const created: CreatedCred[] = [];
  const errors: { type: string; error: string }[] = [];

  for (const cred of creds) {
    const name = `pacame-${slug}-${cred.type.replace(/Api$/, "").toLowerCase()}`;

    try {
      const resp = await fetch(`${baseUrl}/api/v1/credentials`, {
        method: "POST",
        headers: {
          "X-N8N-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          type: cred.type,
          data: cred.data,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        errors.push({ type: cred.type, error: `${resp.status}: ${text.slice(0, 200)}` });
        continue;
      }

      const result = (await resp.json()) as { id?: string };
      if (result.id) {
        created.push({ name, id: result.id, type: cred.type });
      }
    } catch (err) {
      errors.push({
        type: cred.type,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    deployment_id,
    slug,
    credentials: created,
    errors: errors.length > 0 ? errors : undefined,
  });
}

/**
 * GET /api/factoria/n8n-credentials?deployment_id=X
 *
 * Lista las credentials que necesita el cliente y su estado actual
 * (creada o pendiente).
 */
export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const apiKey = process.env.N8N_API_KEY;
  const baseUrl = process.env.N8N_BASE_URL || "https://n8n.pacameagencia.com";

  if (!apiKey) {
    return NextResponse.json(
      { error: "N8N_API_KEY missing", required: ["supabaseApi", "twilioApi"] },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const deploymentId = url.searchParams.get("deployment_id");
  if (!deploymentId) {
    return NextResponse.json({ error: "deployment_id required" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: deployment } = await supabase
    .from("client_deployments")
    .select("slug")
    .eq("id", deploymentId)
    .single();
  const slug = deployment?.slug as string | undefined;
  if (!slug) {
    return NextResponse.json({ error: "deployment not found" }, { status: 404 });
  }

  // Listar credentials existentes en n8n
  const resp = await fetch(`${baseUrl}/api/v1/credentials?limit=200`, {
    headers: { "X-N8N-API-KEY": apiKey },
  });
  if (!resp.ok) {
    return NextResponse.json({ error: `n8n API ${resp.status}` }, { status: 502 });
  }
  const list = (await resp.json()) as { data?: Array<{ id: string; name: string; type: string }> };

  const required = [
    {
      type: "supabaseApi",
      name: `pacame-${slug}-supabase`,
      requires_data: ["host", "serviceRole"],
      hint: "host = URL del proyecto Supabase del cliente (https://xyz.supabase.co), serviceRole = SUPABASE_SERVICE_ROLE_KEY del cliente",
    },
    {
      type: "twilioApi",
      name: `pacame-${slug}-twilio`,
      requires_data: ["accountSid", "authToken"],
      hint: "Twilio dashboard → Account → API keys",
    },
  ];

  const status = required.map((req) => {
    const found = list.data?.find((c) => c.name === req.name);
    return {
      ...req,
      exists: !!found,
      id: found?.id,
    };
  });

  return NextResponse.json({
    deployment_id: deploymentId,
    slug,
    required: status,
    all_ready: status.every((s) => s.exists),
  });
}
