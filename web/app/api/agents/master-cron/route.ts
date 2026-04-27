/**
 * GET /api/agents/master-cron
 *
 * Master dispatcher de los crons PACAME. Sustituye los 13 crons declarados
 * antes en vercel.json (que excedían el límite Hobby = 2 crons).
 *
 * Vercel cron único: cada 5 min UTC (cron expression "asterisk-slash-5 asterisk asterisk asterisk asterisk").
 * Este handler evalúa la hora actual y dispatcha vía fetch interno a los
 * endpoints que correspondan. Cada endpoint sigue exactamente igual que antes
 * (mismo auth, mismo handler) — solo cambia quién los dispara.
 *
 * Ventana de match: el handler corre cada 5 min, así que cualquier schedule
 * caerá en una ventana de [scheduledMin, scheduledMin+4].
 *
 * Verificación: cada dispatch se loguea en agent_activities con type=update
 * (vía logAgentActivity en cada endpoint destino) + un summary final aquí.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { logAgentActivity } from "@/lib/agent-logger";

export const runtime = "nodejs";
export const maxDuration = 300;

interface ScheduledTask {
  /** Hora UTC (0-23) en la que corre. */
  hour: number;
  /** Minuto UTC (0-59) en el que arranca. Tolerancia ±2 min. */
  minute: number;
  /** Día de la semana (0=Dom, 1=Lun…). null = todos los días. */
  dayOfWeek?: number;
  /** Path relativo del endpoint a disparar. */
  path: string;
  /** Método HTTP. */
  method?: "GET" | "POST";
}

// Mapping equivalente a los 13 crons que antes vivían en vercel.json.
// Si añades un cron nuevo, basta con meterlo aquí.
const SCHEDULE: ScheduledTask[] = [
  { hour: 2, minute: 0, path: "/api/referrals/approve-pending" },
  { hour: 3, minute: 0, path: "/api/agents/neural-decay" },
  { hour: 4, minute: 0, path: "/api/neural/factoria-package" },
  { hour: 4, minute: 0, dayOfWeek: 1, path: "/api/agents/maintenance" }, // lunes 04:00
  { hour: 5, minute: 0, path: "/api/neural/auto-discovery" },
  { hour: 6, minute: 0, path: "/api/agents/cron" },
  { hour: 7, minute: 0, dayOfWeek: 1, path: "/api/agents/weekly-audit" }, // lunes 07:00
  { hour: 8, minute: 0, path: "/api/neural/opportunity-scanner" },
  { hour: 9, minute: 0, path: "/api/agents/auto-publish" },   // 11:00 ES — slot mañana IG
  { hour: 9, minute: 15, path: "/api/neural/learn" },
  { hour: 9, minute: 30, path: "/api/neural/promote-tools" },
  { hour: 11, minute: 5, path: "/api/neural/draft-tool" },
  { hour: 12, minute: 0, path: "/api/agents/cron" },
  { hour: 18, minute: 0, path: "/api/agents/cron" },
  { hour: 19, minute: 0, path: "/api/agents/auto-publish" },  // 21:00 ES — slot tarde-noche IG
];

const TOLERANCE_MIN = 2; // si dispatcher corre a :00, :05, :10... → match si scheduled en [now-2, now+2]

function shouldFire(task: ScheduledTask, now: Date): boolean {
  if (task.dayOfWeek !== undefined && now.getUTCDay() !== task.dayOfWeek) return false;
  if (now.getUTCHours() !== task.hour) return false;
  const diff = Math.abs(now.getUTCMinutes() - task.minute);
  return diff <= TOLERANCE_MIN;
}

function getBaseUrl(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  if (fromEnv) return fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
  // Fallback: derivar del request actual (production: pacameagencia.com)
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "pacameagencia.com";
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const startedAt = Date.now();
  const now = new Date();
  const baseUrl = getBaseUrl(request);
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const dueTasks = SCHEDULE.filter((t) => shouldFire(t, now));

  // Dispatch en paralelo: Vercel Hobby maxDuration=300s. Si dispatchara serial
  // 13 endpoints × ~30s c/u = 390s (timeout). En paralelo el tiempo total es
  // el del endpoint más lento (~120s). Los endpoints son independientes entre
  // sí (cada uno escribe a su propia tabla / dimensión del cerebro).
  const results = await Promise.all(
    dueTasks.map(async (task) => {
      const t0 = Date.now();
      try {
        const res = await fetch(`${baseUrl}${task.path}`, {
          method: task.method || "GET",
          headers: { Authorization: `Bearer ${cronSecret}` },
          signal: AbortSignal.timeout(280_000),
        });
        return { path: task.path, status: res.status, ms: Date.now() - t0 };
      } catch (err) {
        return {
          path: task.path,
          status: 0,
          ms: Date.now() - t0,
          error: err instanceof Error ? err.message : "unknown",
        } as { path: string; status: number; ms: number; error?: string };
      }
    })
  );

  const okCount = results.filter((r) => r.status >= 200 && r.status < 300).length;
  const failCount = results.length - okCount;

  // Solo loggear actividad si hubo dispatches reales (no en cada tick vacío de 5 min)
  if (results.length > 0) {
    await logAgentActivity({
      agentId: "core",
      type: "update",
      title: `Master cron dispatcher (${results.length} tareas)`,
      description: `${okCount} OK, ${failCount} fallos. Endpoints: ${results.map((r) => r.path).join(", ")}`,
      metadata: {
        triggered_at_utc: now.toISOString(),
        utc_hour: now.getUTCHours(),
        utc_minute: now.getUTCMinutes(),
        results,
        total_ms: Date.now() - startedAt,
        source: "master-cron",
      },
    });
  }

  return NextResponse.json({
    ok: failCount === 0,
    triggered_at_utc: now.toISOString(),
    dispatched: results.length,
    success: okCount,
    failed: failCount,
    results,
    next_check_in: "5 min",
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
