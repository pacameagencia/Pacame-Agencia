/**
 * POST /api/factoria/deploy/connect-git
 *
 * Conecta un repo Git al project Vercel del cliente. Una vez conectado,
 * los pushes al branch configurado disparan deploys automáticos.
 *
 * Request body:
 *   {
 *     deployment_id: uuid,
 *     github_repo: "owner/repo",
 *     github_branch?: string,        // default: main
 *     trigger_deploy?: boolean       // default: false (recomendado true para deploy inmediato)
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { connectVercelToGit } from "@/lib/factoria/deploy/vercel-git";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  if (!process.env.VERCEL_TOKEN) {
    return NextResponse.json({ error: "VERCEL_TOKEN missing en env" }, { status: 503 });
  }

  let body: {
    deployment_id?: string;
    github_repo?: string;
    github_branch?: string;
    trigger_deploy?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { deployment_id, github_repo, github_branch, trigger_deploy } = body;
  if (!deployment_id || !github_repo) {
    return NextResponse.json(
      { error: "deployment_id and github_repo (owner/repo format) required" },
      { status: 400 }
    );
  }

  if (!/^[\w.-]+\/[\w.-]+$/.test(github_repo)) {
    return NextResponse.json(
      { error: "github_repo must be in 'owner/repo' format" },
      { status: 400 }
    );
  }

  const result = await connectVercelToGit({
    deployment_id,
    github_repo,
    github_branch,
    trigger_deploy: trigger_deploy ?? false,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
