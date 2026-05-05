/**
 * GET /api/foros/scrape
 *
 * Cron dispatcher · invoca los 5 workers paralelo (Reddit/Forobeta/X/IH/Quora).
 * Auth: verifyInternalAuth (Bearer CRON_SECRET).
 * Llamado por master-cron 3x/día (01:00, 13:00, 20:00 UTC).
 *
 * Query: ?dry-run=true
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { getLogger } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const maxDuration = 300;

const PLATFORMS = ["reddit", "forobeta", "twitter", "indiehackers", "quora"] as const;

function getBaseUrl(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  if (fromEnv) return fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "pacameagencia.com";
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry-run") === "true";
  const log = getLogger();
  const baseUrl = getBaseUrl(request);
  const cronSecret = process.env.CRON_SECRET || "";
  const startedAt = Date.now();

  const results = await Promise.all(
    PLATFORMS.map(async (plat) => {
      const t0 = Date.now();
      try {
        const r = await fetch(
          `${baseUrl}/api/foros/scrape/${plat}${dryRun ? "?dry-run=true" : ""}`,
          {
            headers: { Authorization: `Bearer ${cronSecret}` },
            signal: AbortSignal.timeout(280_000),
          }
        );
        const data = (await r.json()) as { ok?: boolean; scraped?: number; inserted?: number; error?: string };
        return {
          platform: plat,
          status: r.status,
          scraped: data.scraped ?? 0,
          inserted: data.inserted ?? 0,
          ms: Date.now() - t0,
          error: data.error,
        };
      } catch (err) {
        return {
          platform: plat,
          status: 0,
          scraped: 0,
          inserted: 0,
          ms: Date.now() - t0,
          error: err instanceof Error ? err.message : "unknown",
        };
      }
    })
  );

  const totalScraped = results.reduce((s, r) => s + r.scraped, 0);
  const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
  log.info({ totalScraped, totalInserted, dryRun, ms: Date.now() - startedAt }, "[foros-scrape] dispatch done");

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    duration_ms: Date.now() - startedAt,
    total_scraped: totalScraped,
    total_inserted: totalInserted,
    results,
  });
}
