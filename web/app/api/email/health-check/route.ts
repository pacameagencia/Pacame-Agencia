import { NextRequest, NextResponse } from "next/server";
import { sendEmail, wrapEmailTemplate } from "@/lib/resend";

/**
 * POST /api/email/health-check
 *
 * One-shot email health check. Sends a diagnostic email to a FIXED
 * internal address so a public trigger can't be abused as a spam relay.
 * Global rate limit: 3 successful sends per hour.
 *
 * Also queries the Resend API for domain verification status so the
 * response surfaces the root cause if delivery is broken (unverified
 * domain, missing DNS records, etc.).
 */

const TARGET_EMAIL = "pacame2000@gmail.com";
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 3;

// Module-scope rate limit. Survives warm invocations; resets on cold start.
let sends: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  sends = sends.filter((t) => now - t < RATE_WINDOW_MS);
  if (sends.length >= RATE_LIMIT) return true;
  sends.push(now);
  return false;
}

interface ResendDomain {
  id: string;
  name: string;
  status: string;
  region?: string;
  created_at?: string;
  records?: Array<{
    record: string;
    name: string;
    type: string;
    value: string;
    status?: string;
  }>;
}

async function fetchResendDomains(): Promise<{
  ok: boolean;
  domains?: ResendDomain[];
  error?: string;
}> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY no configurada" };
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Resend API ${res.status}: ${text.slice(0, 200)}` };
    }
    const json = (await res.json()) as { data?: ResendDomain[] };
    return { ok: true, domains: json.data || [] };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function POST(_request: NextRequest) {
  if (isRateLimited()) {
    return NextResponse.json(
      { ok: false, error: "Rate limit: 3/hora global" },
      { status: 429 }
    );
  }

  // 1. Diagnostic: domain status at Resend
  const domainStatus = await fetchResendDomains();

  // 2. Try to send — this is the real signal
  const subject = `PACAME email health check — ${new Date().toISOString()}`;
  const html = wrapEmailTemplate(
    `Test automático del pipeline de email de PACAME.\n\n` +
      `Si estás leyendo esto, el envío a Gmail funciona y el dominio está OK en Resend.\n\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `Origen: /api/email/health-check\n` +
      `Destino: ${TARGET_EMAIL}`,
    {
      cta: "Abrir dashboard",
      ctaUrl: "https://pacameagencia.com/dashboard",
      preheader: "Test de Resend — pipeline operativo",
    }
  );

  const emailId = await sendEmail({
    to: TARGET_EMAIL,
    subject,
    html,
    tags: [
      { name: "type", value: "health_check" },
      { name: "automated", value: "true" },
    ],
  });

  const ok = !!emailId;

  return NextResponse.json(
    {
      ok,
      email_id: emailId,
      target: TARGET_EMAIL,
      sent_at: new Date().toISOString(),
      resend_domains: domainStatus,
      hint: ok
        ? "Email entregado a Resend. Comprueba inbox (y spam) en pacame2000@gmail.com"
        : "Envío rechazado por Resend. Revisa resend_domains para DNS pendientes.",
    },
    { status: ok ? 200 : 502 }
  );
}
