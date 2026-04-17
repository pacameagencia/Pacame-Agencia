import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/email/diagnose
 *
 * Pulls full status from Resend API: domain DNS records (verified/failed),
 * specific email delivery status, and a bounce/complaint summary.
 *
 * Use this to understand why an email isn't landing (missing DKIM, SPF
 * misalignment, bounce, spam complaint, etc.) without exposing the API key.
 */

interface DomainRecord {
  record: string;
  name: string;
  type: string;
  value: string;
  ttl?: string;
  status?: string;
  priority?: number;
}

interface Domain {
  id: string;
  name: string;
  status: string;
  region?: string;
  records?: DomainRecord[];
  created_at?: string;
}

interface EmailStatus {
  id: string;
  to: string[];
  from: string;
  subject: string;
  last_event?: string;
  created_at?: string;
  [k: string]: unknown;
}

async function resendFetch<T>(path: string): Promise<{ ok: boolean; data?: T; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY no configurada" };
  try {
    const res = await fetch(`https://api.resend.com${path}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emailId = searchParams.get("email_id");

  // 1. List all domains
  const domainsRes = await resendFetch<{ data: Domain[] }>("/domains");
  const domains = domainsRes.data?.data || [];

  // 2. For each domain, fetch the full record list (DNS status per record)
  const detailedDomains = await Promise.all(
    domains.map(async (d) => {
      const full = await resendFetch<Domain>(`/domains/${d.id}`);
      return full.data || d;
    })
  );

  // 3. If email_id provided, fetch that email's status
  let emailStatus: { ok: boolean; data?: EmailStatus; error?: string } | null = null;
  if (emailId) {
    emailStatus = await resendFetch<EmailStatus>(`/emails/${emailId}`);
  }

  // 4. Summarize what's needed
  const summary = detailedDomains.map((d) => {
    const records = d.records || [];
    const pending = records.filter((r) => r.status && r.status !== "verified");
    return {
      id: d.id,
      name: d.name,
      status: d.status,
      region: d.region,
      total_records: records.length,
      pending_records: pending.length,
      pending_details: pending,
      all_records: records,
    };
  });

  return NextResponse.json({
    ok: domainsRes.ok,
    error: domainsRes.error,
    domains_summary: summary,
    email_status: emailStatus,
    timestamp: new Date().toISOString(),
  });
}
