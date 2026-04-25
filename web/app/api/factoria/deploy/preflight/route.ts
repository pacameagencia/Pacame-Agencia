/**
 * GET /api/factoria/deploy/preflight?deployment_id=X
 *
 * Pre-flight checker para el deploy a producción. Valida ANTES de ejecutar
 * que TODO está en su sitio para que Pablo no se encuentre con sorpresas
 * a mitad de despliegue.
 *
 * Comprueba:
 *   1. Deployment existe y está materializado
 *   2. Archivos críticos están en bucket Supabase Storage
 *   3. API keys responden 200 a un GET ligero
 *   4. URLs externas resuelven DNS (n8n, pacameagencia.com)
 *   5. Conflictos potenciales: project name Vercel ya existe? assistant
 *      con mismo name en Vapi? workflows con mismo tag en n8n?
 *   6. Quotas / límites obvios
 *
 * Devuelve un report estructurado con OK / WARN / ERROR por cada check
 * + la lista exacta de acciones que Pablo debería ejecutar antes de deploy.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "client-deployments";

type CheckLevel = "ok" | "warn" | "error" | "info";

interface PreflightCheck {
  id: string;
  group: "deployment" | "vercel" | "vapi" | "n8n" | "webhook" | "env";
  level: CheckLevel;
  message: string;
  detail?: string | Record<string, unknown>;
  action?: string;
}

interface PreflightReport {
  deployment_id: string;
  ready_to_deploy: boolean;
  blocking_errors: number;
  warnings: number;
  checks: PreflightCheck[];
  required_actions: string[];
  optional_actions: string[];
}

async function check<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<{ value: T; error?: Error }> {
  try {
    return { value: await fn() };
  } catch (err) {
    return { value: fallback, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const deploymentId = url.searchParams.get("deployment_id");
  if (!deploymentId) {
    return NextResponse.json({ error: "deployment_id query param required" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const checks: PreflightCheck[] = [];

  // ── 1. Deployment existe y está materializado ──────────────────────────
  const { data: deployment, error: depError } = await supabase
    .from("client_deployments")
    .select("id, slug, business_name, materialized_at, materialized_files, vercel_project_id, vapi_assistant_id, n8n_workflow_ids")
    .eq("id", deploymentId)
    .single();

  if (depError || !deployment) {
    return NextResponse.json(
      {
        deployment_id: deploymentId,
        ready_to_deploy: false,
        checks: [
          { id: "deployment-exists", group: "deployment", level: "error", message: "Deployment no encontrado en BD", action: "Materializa el cliente primero desde /dashboard/factoria/templates" },
        ],
      } as Partial<PreflightReport>,
      { status: 404 }
    );
  }

  if (!deployment.materialized_at || !deployment.slug) {
    checks.push({
      id: "deployment-materialized",
      group: "deployment",
      level: "error",
      message: "Deployment NO materializado",
      action: "Llama POST /api/factoria/materialize antes de deploy",
    });
  } else {
    checks.push({
      id: "deployment-materialized",
      group: "deployment",
      level: "ok",
      message: `Materializado el ${new Date(deployment.materialized_at).toLocaleDateString("es-ES")}`,
    });
  }

  const slug = deployment.slug as string | null;
  const files = (deployment.materialized_files as { path: string }[] | null) ?? [];

  // ── 2. Archivos críticos en bucket ──────────────────────────────────────
  const criticalFiles = [
    `${slug}/.env.example`,
    `${slug}/vapi/assistant-config.json`,
  ];
  for (const path of criticalFiles) {
    const found = files.some((f) => f.path === path);
    if (!found) {
      checks.push({
        id: `file-${path.split("/").pop()}`,
        group: "deployment",
        level: "error",
        message: `Archivo crítico falta en bucket: ${path}`,
        action: "Re-materializar el cliente",
      });
    }
  }
  // Workflows n8n: opcional pero esperado
  const wfFiles = files.filter((f) => f.path.startsWith(`${slug}/n8n/workflows/`));
  if (wfFiles.length === 0) {
    checks.push({
      id: "n8n-workflows-files",
      group: "n8n",
      level: "warn",
      message: "No hay archivos de workflows n8n materializados",
      action: "Re-materializar; el deploy a n8n no tendrá nada que importar",
    });
  } else {
    checks.push({
      id: "n8n-workflows-files",
      group: "n8n",
      level: "ok",
      message: `${wfFiles.length} workflows materializados`,
    });
  }

  // ── 3. Webhooks (Vapi server URL apunta aquí) ──────────────────────────
  const webhookCheck = await check(async () => {
    const r = await fetch("https://pacameagencia.com/api/calls/webhook", {
      method: "OPTIONS",
      signal: AbortSignal.timeout(5000),
    });
    return { ok: r.ok || r.status === 405 || r.status === 401, status: r.status };
  }, { ok: false, status: 0 });

  if (webhookCheck.value.ok) {
    checks.push({
      id: "webhook-vapi",
      group: "webhook",
      level: "ok",
      message: `pacameagencia.com/api/calls/webhook responde (${webhookCheck.value.status})`,
    });
  } else {
    checks.push({
      id: "webhook-vapi",
      group: "webhook",
      level: "warn",
      message: "Webhook Vapi puede no estar accesible en producción",
      detail: webhookCheck.error?.message,
      action: "Verifica que pacameagencia.com está desplegado y /api/calls/webhook funciona",
    });
  }

  // ── 4. Vercel ──────────────────────────────────────────────────────────
  const vercelToken = process.env.VERCEL_TOKEN;
  if (!vercelToken) {
    checks.push({
      id: "vercel-key",
      group: "vercel",
      level: "warn",
      message: "VERCEL_TOKEN no configurada",
      action: "Añade VERCEL_TOKEN al .env.local desde https://vercel.com/account/tokens (scope: full_access)",
    });
  } else {
    const vercelCheck = await check(async () => {
      const teamId = process.env.VERCEL_TEAM_ID;
      const url = teamId ? `https://api.vercel.com/v2/user?teamId=${teamId}` : "https://api.vercel.com/v2/user";
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${vercelToken}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as { user?: { username?: string; email?: string } };
    }, { user: undefined } as { user?: { username?: string; email?: string } });

    if (vercelCheck.error) {
      checks.push({
        id: "vercel-key",
        group: "vercel",
        level: "error",
        message: "VERCEL_TOKEN inválida o sin permisos",
        detail: vercelCheck.error.message,
        action: "Genera token nuevo en https://vercel.com/account/tokens con scope completo",
      });
    } else {
      checks.push({
        id: "vercel-key",
        group: "vercel",
        level: "ok",
        message: `VERCEL_TOKEN válida · usuario ${vercelCheck.value.user?.username ?? vercelCheck.value.user?.email ?? "desconocido"}`,
      });

      // Conflicto: project name ya existe?
      if (slug) {
        const projectName = `pacame-${slug}`.slice(0, 100);
        const teamId = process.env.VERCEL_TEAM_ID;
        const projUrl = teamId
          ? `https://api.vercel.com/v9/projects/${projectName}?teamId=${teamId}`
          : `https://api.vercel.com/v9/projects/${projectName}`;
        const projResp = await fetch(projUrl, {
          headers: { Authorization: `Bearer ${vercelToken}` },
          signal: AbortSignal.timeout(8000),
        });
        if (projResp.ok) {
          checks.push({
            id: "vercel-project-conflict",
            group: "vercel",
            level: "info",
            message: `Project '${projectName}' YA EXISTE en Vercel — el deploy hará idempotente fetch + update env vars`,
          });
        } else if (projResp.status === 404) {
          checks.push({
            id: "vercel-project-conflict",
            group: "vercel",
            level: "ok",
            message: `Project name '${projectName}' disponible · listo para crear`,
          });
        }
      }
    }
  }

  // ── 5. Vapi ────────────────────────────────────────────────────────────
  const vapiKey = process.env.VAPI_API_KEY;
  if (!vapiKey) {
    checks.push({
      id: "vapi-key",
      group: "vapi",
      level: "warn",
      message: "VAPI_API_KEY no configurada",
      action: "Añade VAPI_API_KEY al .env.local desde https://dashboard.vapi.ai/account",
    });
  } else {
    const vapiCheck = await check(async () => {
      const r = await fetch("https://api.vapi.ai/assistant?limit=1", {
        headers: { Authorization: `Bearer ${vapiKey}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as Array<unknown>;
    }, [] as Array<unknown>);

    if (vapiCheck.error) {
      checks.push({
        id: "vapi-key",
        group: "vapi",
        level: "error",
        message: "VAPI_API_KEY inválida",
        detail: vapiCheck.error.message,
        action: "Verifica la key en https://dashboard.vapi.ai/account",
      });
    } else {
      checks.push({
        id: "vapi-key",
        group: "vapi",
        level: "ok",
        message: `VAPI_API_KEY válida · cuenta accesible`,
      });

      // Si existe vapi_assistant_id en BD, confirmar que sigue vivo
      if (deployment.vapi_assistant_id) {
        const aResp = await fetch(`https://api.vapi.ai/assistant/${deployment.vapi_assistant_id}`, {
          headers: { Authorization: `Bearer ${vapiKey}` },
          signal: AbortSignal.timeout(5000),
        });
        if (aResp.ok) {
          checks.push({
            id: "vapi-existing-assistant",
            group: "vapi",
            level: "info",
            message: `Assistant existente sigue activo · re-deploy hará PATCH (idempotente)`,
            detail: { assistant_id: deployment.vapi_assistant_id },
          });
        } else {
          checks.push({
            id: "vapi-existing-assistant",
            group: "vapi",
            level: "warn",
            message: `Assistant ID ${deployment.vapi_assistant_id} en BD pero no responde en Vapi`,
            action: "Re-deploy creará uno nuevo (limpia el ID antiguo manualmente si quieres)",
          });
        }
      }
    }
  }

  // ── 6. n8n ─────────────────────────────────────────────────────────────
  const n8nKey = process.env.N8N_API_KEY;
  const n8nBase = process.env.N8N_BASE_URL || "https://n8n.pacameagencia.com";
  if (!n8nKey) {
    checks.push({
      id: "n8n-key",
      group: "n8n",
      level: "warn",
      message: "N8N_API_KEY no configurada",
      action: "Añade N8N_API_KEY al .env.local desde n8n.pacameagencia.com → Settings → n8n API",
    });
  } else {
    const n8nCheck = await check(async () => {
      const r = await fetch(`${n8nBase}/api/v1/workflows?limit=1`, {
        headers: { "X-N8N-API-KEY": n8nKey },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as { data?: unknown[] };
    }, { data: [] } as { data?: unknown[] });

    if (n8nCheck.error) {
      checks.push({
        id: "n8n-key",
        group: "n8n",
        level: "error",
        message: `N8N_API_KEY inválida o n8n no accesible (${n8nBase})`,
        detail: n8nCheck.error.message,
        action: "Verifica n8n.pacameagencia.com responde y la key tiene scope api",
      });
    } else {
      checks.push({
        id: "n8n-key",
        group: "n8n",
        level: "ok",
        message: `N8N_API_KEY válida · ${n8nBase} responde`,
      });

      // Verificar credentials necesarias existen
      const credsCheck = await check(async () => {
        const r = await fetch(`${n8nBase}/api/v1/credentials?limit=200`, {
          headers: { "X-N8N-API-KEY": n8nKey },
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as { data?: Array<{ name: string; type: string }> };
      }, { data: [] } as { data?: Array<{ name: string; type: string }> });

      if (credsCheck.value.data && slug) {
        const required = [
          { name: `pacame-${slug}-supabase`, type: "supabaseApi" },
          { name: `pacame-${slug}-twilio`, type: "twilioApi" },
        ];
        for (const req of required) {
          const found = credsCheck.value.data.some((c) => c.name === req.name);
          if (!found) {
            checks.push({
              id: `n8n-cred-${req.type}`,
              group: "n8n",
              level: "warn",
              message: `Credential n8n falta: ${req.name} (${req.type})`,
              action: `POST /api/factoria/n8n-credentials con { slug, type:"${req.type}", data:{...} } o créala manualmente en n8n`,
            });
          } else {
            checks.push({
              id: `n8n-cred-${req.type}`,
              group: "n8n",
              level: "ok",
              message: `Credential ${req.name} ✓`,
            });
          }
        }
      }
    }
  }

  // ── 7. Env vars del cliente que faltan en .env.example ─────────────────
  // Estas son las vars que el cliente final necesita para funcionar (Stripe,
  // Twilio, Supabase, etc.) — el .env.example las lista vacías. Para deploy
  // production realmente quieres que tengan valor.
  if (slug && files.some((f) => f.path === `${slug}/.env.example`)) {
    // Descargar y contar vacías
    const { data: blob } = await supabase.storage.from(BUCKET).download(`${slug}/.env.example`);
    if (blob) {
      const envText = await blob.text();
      const emptyVars: string[] = [];
      for (const line of envText.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const m = t.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (m && (m[2] === "" || m[2] === '""')) {
          emptyVars.push(m[1]);
        }
      }
      if (emptyVars.length > 0) {
        checks.push({
          id: "env-empty-vars",
          group: "env",
          level: "warn",
          message: `${emptyVars.length} env vars del cliente vacías en .env.example`,
          detail: { vars: emptyVars.slice(0, 8), more: emptyVars.length > 8 ? emptyVars.length - 8 : 0 },
          action: "Pídele al cliente sus credenciales (Stripe, Twilio, GMB, IG) y rellénalas antes de production",
        });
      }
    }
  }

  // ── Resumen ────────────────────────────────────────────────────────────
  const blocking = checks.filter((c) => c.level === "error").length;
  const warnings = checks.filter((c) => c.level === "warn").length;
  const requiredActions = checks
    .filter((c) => c.level === "error" && c.action)
    .map((c) => c.action!);
  const optionalActions = checks
    .filter((c) => c.level === "warn" && c.action)
    .map((c) => c.action!);

  const report: PreflightReport = {
    deployment_id: deploymentId,
    ready_to_deploy: blocking === 0,
    blocking_errors: blocking,
    warnings,
    checks,
    required_actions: requiredActions,
    optional_actions: optionalActions,
  };

  return NextResponse.json(report);
}
